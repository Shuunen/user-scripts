// ==UserScript==
// @name         qBittorrent - All in one
// @author       Romain Racamier-Lafon
// @description  Hide the useless bits & delete other trackers in the qBittorrent web ui
// @downloadURL  https://github.com/Shuunen/user-scripts/raw/master/src/qbit-aio.user.js
// @updateURL    https://github.com/Shuunen/user-scripts/raw/master/src/qbit-aio.user.js
// @grant        none
// @match        https://*/*/qbittorrent/
// @icon         https://www.google.com/s2/favicons?sz=64&domain=qbittorrent.org
// @namespace    https://github.com/Shuunen
// @require      https://cdn.jsdelivr.net/gh/Shuunen/user-scripts@master/src/utils.js
// @version      1.2.0
// ==/UserScript==

/* v8 ignore file */

// the script id, used as a log prefix and as a css marker, keep it short
const id = 'qbit-aio'

// css classes injected by this script, prefixed with the script id to avoid collisions
const cls = {
  menuItem: `${id}-menu-item`,
}

// elements of the web ui we never use, hidden via `utils.hideElements`
const uselessSelectors = {
  rssTab: '#rssTabLink', // the rss tab, we don't use the built-in rss reader
}

// all css selectors in one place, the qbittorrent web ui re-renders its rows on each sync so no `:not(.done)` marker here
const selectors = {
  table: '#torrentsTableDiv',
  trackerRow: '#torrentTrackersTableDiv tr[data-row-id]',
  trackersMenu: '#torrentTrackersMenu',
  trackersTable: '#torrentTrackersTableDiv',
}

// the web ui lists these pseudo trackers alongside the real ones, they are protocols and cannot be removed
const fakeTrackers = new Set(['** [DHT] **', '** [PeX] **', '** [LSD] **'])

// the web ui nests one row per announce endpoint under each tracker row, their id starts with this prefix
const endpointPrefix = 'endpoint|'

// the entries we add to the trackers context menu, the icons are the ones shipped by the web ui, relative to its root
// `needsSelection` marks the entries only relevant when a single real tracker is selected
const menuItems = {
  cleanUseless: { icon: 'images/edit-clear.svg', label: 'Clean useless trackers', needsSelection: false },
  deleteOthers: { icon: 'images/list-remove.svg', label: 'Delete other trackers', needsSelection: true },
}

// all regexes in one place, they are hoisted here to avoid re-creating them on each call
const regex = {
  // anything outside the printable ascii range, like the zero width spaces some tracker urls carry
  nonAscii: /[^\u0020-\u007E]/gu,
}

const secondsPerDay = 86_400

// the tiers of the seed health column, from the worst to the best
const tierEmojis = ['🔴', '🟠', '🟡', '🟢']

// the tiers of the last activity column, from the oldest activity to the most recent one
const activityEmojis = ['👴', '👧🏼', '👶🏻']

// how long the tier bounds are reused before being recomputed from all the torrents, in ms
const tiersCacheTime = 1000

// how often to look for the torrent table until it is ready, and when to give up, in ms
const ratioColumnsPollTime = 10
const ratioColumnsPollTimeout = 30_000

// the columns we add to the torrent table, `days` is the period length the average ratio is expressed in
const ratioColumns = [
  { caption: 'Ratio / week', days: 7, name: 'ratio_per_week' },
  { caption: 'Ratio / month', days: 30, name: 'ratio_per_month' },
]

// the seeding column, its score blends the ratio per week, the ratio per month & the last activity
const seedingColumn = { caption: 'Seed health', name: 'seeding' }

// the names of all the columns we add to the torrent table
const addedColumnNames = [...ratioColumns.map(({ name }) => name), seedingColumn.name]

// the tracker status reported by the api for a working tracker
const workingStatus = 2

// the tracker statuses reported by the api when the tracker is broken : 4 "Not working", 5 "Tracker error" & 6 "Unreachable"
// the remaining ones (0 "Disabled", 1 "Not contacted yet" & 3 "Updating") are left alone, they are transient states
const brokenStatuses = new Set([4, 5, 6])

// styles injected in the page, use the `cls` entries above
const styles = `
  .${cls.menuItem}.${cls.menuItem}-off {
    display: none;
  }
`

// how long to wait before processing the page again, in ms
const startDebounceTime = 500

/**
 * @typedef {object} Tracker a tracker of a torrent, as returned by the `torrents/trackers` api
 * @property {string} url the announce url
 * @property {number} status 2 when the tracker is working, see `workingStatus` & `brokenStatuses`
 * @property {number} num_peers the peers it reports, -1 when unknown
 * @property {number} num_seeds the seeds it reports, -1 when unknown
 * @property {number} num_leeches the leeches it reports, -1 when unknown
 */

/**
 * Check if a tracker row holds a real tracker, the web ui mixes pseudo trackers like "** [DHT] **" and announce endpoint rows with the real ones
 * @param {string} url the tracker row id to check, like "http://tracker.org/announce"
 * @returns {boolean} true if the url is a real, removable tracker
 */
function isRealTracker(url) {
  return url !== '' && !fakeTrackers.has(url) && !url.startsWith(endpointPrefix)
}

/**
 * Sum the peers, seeds & leeches reported by a tracker, the api reports -1 for the ones it does not know
 * @param {Tracker} tracker the tracker to count the peers of
 * @returns {number} the total number of peers, 0 when the tracker reports nothing
 */
function countPeers(tracker) {
  return [tracker.num_peers, tracker.num_seeds, tracker.num_leeches].reduce((total, count) => total + Math.max(count, 0), 0)
}

/**
 * Check if a tracker is useless : it is broken, or it works but brings no peer at all
 * a tracker that has not been contacted yet is never useless, it did not get the chance to report anything
 * @param {Tracker} tracker the tracker to check
 * @returns {boolean} true if the tracker should be removed
 */
function isUselessTracker(tracker) {
  if (brokenStatuses.has(tracker.status)) return true
  return tracker.status === workingStatus && countPeers(tracker) === 0
}

/**
 * List the useless trackers of a torrent
 * @param {Tracker[]} trackers the trackers of the torrent, as returned by the api
 * @returns {string[]} the urls of the trackers to remove
 */
function getUselessTrackers(trackers) {
  return trackers.filter(tracker => isRealTracker(tracker.url) && isUselessTracker(tracker)).map(tracker => tracker.url)
}

/**
 * Encode a tracker url the way the api expects it to remove it
 * qbittorrent stores the non-ascii characters percent-encoded but reports them decoded in its json, so the plain url never matches
 * some trackers carry a zero width space (U+200B) and can only be removed once it is turned back into "%E2%80%8B"
 * @param {string} url the tracker url as reported by the api
 * @returns {string} the url to send to the api, with its non-ascii characters percent-encoded
 */
function encodeTrackerUrl(url) {
  return url.replace(regex.nonAscii, char => encodeURIComponent(char))
}

/**
 * List the trackers that really disappeared after a removal, the api answers 204 even when it matched nothing
 * @param {string[]} requested the urls we asked to remove
 * @param {string[]} remaining the urls the torrent still has
 * @returns {string[]} the urls that are really gone
 */
function getRemovedTrackers(requested, remaining) {
  const left = new Set(remaining)
  return requested.filter(url => !left.has(url))
}

/**
 * List the trackers to remove to only keep the selected one
 * @param {string[]} urls all the tracker urls of the torrent, pseudo trackers included
 * @param {string} keptUrl the url of the tracker to keep
 * @returns {string[]} the real tracker urls to remove
 */
function getTrackersToRemove(urls, keptUrl) {
  return urls.filter(url => isRealTracker(url) && url !== keptUrl)
}

/**
 * Compute the upper bounds of all the tiers but the best one, so each tier holds an equal share of the values, everything above is in the best tier
 * equal values never straddle two tiers : they all fall in the worst one, so a pile of 0 is all in the worst tier
 * @param {number[]} values the values of all the torrents
 * @param {number} tierCount how many tiers to split the values in
 * @returns {number[]} the upper bounds (inclusive) of the tiers but the best one, empty when there are fewer values than tiers, as a lone torrent is not worth a verdict
 */
function getTierBounds(values, tierCount = tierEmojis.length) {
  if (values.length < tierCount) return []
  const sorted = values.toSorted((first, second) => first - second)
  // a plain loop on purpose : the qbittorrent web ui ships MooTools, whose `Array.from` ignores the mapping function
  const bounds = []
  for (let tier = 1; tier < tierCount; tier += 1) bounds.push(sorted[Math.ceil((sorted.length * tier) / tierCount) - 1] ?? 0)
  return bounds
}

/**
 * Pick the emoji of the tier a value falls in
 * @param {number} value the value to rank
 * @param {number[]} bounds the tier upper bounds, as returned by `getTierBounds`
 * @param {string[]} emojis the emoji of each tier, from the worst to the best
 * @returns {string} the emoji of the tier, empty when there are no bounds
 */
function getTierEmoji(value, bounds, emojis = tierEmojis) {
  if (bounds.length === 0) return ''
  const index = bounds.findIndex(bound => value <= bound)
  return emojis[index === -1 ? emojis.length - 1 : index] ?? ''
}

/**
 * Average ratio earned per period since the torrent was added, the api only exposes the lifetime ratio so a real "last N days" is not possible
 * the age is floored to the period itself so a young torrent is never extrapolated : under a week old, its ratio per week is just its ratio so far
 * @param {number} ratio the lifetime ratio of the torrent, -1 when unknown
 * @param {number} ageSeconds how long ago the torrent was added, in seconds
 * @param {number} periodDays the length of the period in days, like 7 for a week
 * @returns {number} the average ratio per period, 0 when the ratio is unknown
 */
function getRatioPerPeriod(ratio, ageSeconds, periodDays) {
  if (ratio < 0) return 0
  const ageDays = Math.max(ageSeconds / secondsPerDay, periodDays)
  return ratio / (ageDays / periodDays)
}

/**
 * Index the criteria of all the torrents so a value can be ranked in O(log n) : one ascending sorted list per criterion
 * @param {number[][]} metrics one entry per torrent, each holding its criteria, higher is better
 * @returns {number[][]} the sorted values of each criterion
 */
function buildRankIndex(metrics) {
  const index = []
  const criteriaCount = metrics[0]?.length ?? 0
  // a plain loop on purpose : the qbittorrent web ui ships MooTools, whose `Array.from` ignores the mapping function
  for (let criterion = 0; criterion < criteriaCount; criterion += 1) index.push(metrics.map(entry => entry[criterion] ?? 0).toSorted((first, second) => first - second))
  return index
}

/**
 * Count how many values are strictly lower than the given one
 * @param {number[]} sorted the values in ascending order
 * @param {number} value the value to rank
 * @returns {number} how many values are lower
 */
function countLower(sorted, value) {
  let low = 0
  let high = sorted.length
  while (low < high) {
    const middle = Math.floor((low + high) / 2)
    if ((sorted[middle] ?? 0) < value) low = middle + 1
    else high = middle
  }
  return low
}

/**
 * Compute the seeding score of a torrent from 0 (worst seeder) to 100 (best seeder)
 * each criterion is turned into a percentile rank among all the torrents, then the ranks are averaged, so no criterion drowns the others
 * equal values rank as the lowest, like in the tiers, and a torrent missing from the index (just added) is still ranked fairly
 * @param {number[]} own the criteria of the torrent, higher is better
 * @param {number[][]} index the rank index of all the torrents, as returned by `buildRankIndex`
 * @returns {number} the score, neutral (50) when there are fewer than 2 torrents to compare with
 */
function getSeedingScore(own, index) {
  const count = index[0]?.length ?? 0
  if (count < 2) return 50
  const ranks = own.map((value, criterion) => Math.min(countLower(index[criterion] ?? [], value) / (count - 1), 1))
  return Math.round((100 * ranks.reduce((total, rank) => total + rank, 0)) / ranks.length)
}

/**
 * Compute the seeding score of each torrent, see `getSeedingScore`
 * @param {number[][]} metrics one entry per torrent, each holding its criteria, higher is better
 * @returns {number[]} the score of each torrent, in the same order
 */
function getSeedingScores(metrics) {
  const index = buildRankIndex(metrics)
  return metrics.map(own => getSeedingScore(own, index))
}

/**
 * List the criteria of a torrent that feed its seeding score, higher is better
 * @param {{ full_data: { added_on: number, last_activity?: number, ratio: number } }} row the torrent row
 * @returns {number[]} the ratio per week, the ratio per month & the unix time of the last activity
 */
function getSeedingMetrics(row) {
  const age = Date.now() / 1000 - row.full_data.added_on
  return [getRatioPerPeriod(row.full_data.ratio, age, 7), getRatioPerPeriod(row.full_data.ratio, age, 30), Math.max(row.full_data.last_activity ?? 0, 0)]
}

/**
 * Build the seeding scorer of a torrents table, the rank index is cached as a cell is rendered for each row, and rebuilt from the current rows once stale
 * the score of a row is computed from the index, not looked up by row, so a row the web ui just replaced or added never reads as 0
 * @param {typeof torrentsTable} table the torrents table
 * @returns {{ getScore: (row: { full_data: { added_on: number, last_activity?: number, ratio: number } }) => number, listScores: () => number[] }} gives the score of a row, and the scores of all the rows
 */
function createSeedingScorer(table) {
  let cache = { at: 0, index: /** @type {number[][]} */ ([]) }
  /**
   * Rebuild the rank index when it is stale
   * @returns {number[][]} the rank index
   */
  const getIndex = () => {
    if (Date.now() - cache.at > tiersCacheTime) cache = { at: Date.now(), index: buildRankIndex([...table.rows.values()].map(row => getSeedingMetrics(row))) }
    return cache.index
  }
  return {
    getScore: row => getSeedingScore(getSeedingMetrics(row), getIndex()),
    listScores: () => [...table.rows.values()].map(row => getSeedingScore(getSeedingMetrics(row), getIndex())),
  }
}

/**
 * Build a function giving the tier emoji of a value, ranked against the same value of all the torrents
 * the tier bounds are cached because a cell is rendered for each row, and they are recomputed from the current rows once the cache is stale
 * @param {() => number[]} listValues lists the value of every torrent
 * @param {string[]} emojis the emoji of each tier, from the worst to the best
 * @returns {(value: number) => string} gives the emoji of the tier the value falls in
 */
function createTierPicker(listValues, emojis = tierEmojis) {
  let cache = { at: 0, bounds: /** @type {number[]} */ ([]) }
  return value => {
    if (Date.now() - cache.at > tiersCacheTime) cache = { at: Date.now(), bounds: getTierBounds(listValues(), emojis.length) }
    return getTierEmoji(value, cache.bounds, emojis)
  }
}

// the native columns we already wrapped, to never wrap one twice
const tintedColumns = new WeakSet()

/**
 * Prefix the native "Last Activity" cells with an age emoji, from the oldest activity to the most recent one
 * the web ui gives the unix time of the last activity, 0 or less when there never was one, which ranks as the oldest
 * @param {typeof torrentsTable} table the torrents table
 * @returns {boolean} true when the column has just been wrapped
 */
function tintLastActivity(table) {
  const column = table.columns.last_activity
  if (column === undefined || tintedColumns.has(column)) return false
  const nativeUpdateTd = column.updateTd.bind(column)
  const pickAge = createTierPicker(() => [...table.rows.values()].map(row => Math.max(row.full_data.last_activity ?? 0, 0)), activityEmojis)
  /**
   * Render the native cell, then prefix it with the age emoji
   * @param {HTMLElement} td the cell to fill
   * @param {{ full_data: { added_on: number, last_activity?: number, ratio: number } }} row the torrent row
   */
  column.updateTd = (td, row) => {
    nativeUpdateTd(td, row)
    const text = `${pickAge(Math.max(row.full_data.last_activity ?? 0, 0))} ${td.textContent}`
    td.textContent = text
    td.title = text
  }
  tintedColumns.add(column)
  return true
}

/**
 * Check if the torrents table is ready to get our columns
 * @returns {boolean} true when the web ui has set the table up
 */
function isTorrentsTableReady() {
  return typeof torrentsTable !== 'undefined' && Array.isArray(torrentsTable.columns)
}

/**
 * Check if our columns are registered in the torrent table
 * @returns {boolean} true when all our columns exist
 */
function torrentsTableHasRatioColumns() {
  return isTorrentsTableReady() && addedColumnNames.every(name => torrentsTable.columns[name] !== undefined)
}

// the headers we already wired the sort on, to never wire one twice
const sortWiredHeaders = new WeakSet()

/**
 * Make a click on the header of our columns sort the table
 * the web ui binds its header click handlers once at startup, so ours are missing : a single delegated listener on the header row fixes that
 * and it survives the web ui re-creating a header cell, which per-cell listeners would not
 * @param {typeof torrentsTable} table the torrents table
 */
function wireHeaderSort(table) {
  if (sortWiredHeaders.has(table.fixedTableHeader)) return
  sortWiredHeaders.add(table.fixedTableHeader)
  table.fixedTableHeader.addEventListener('click', event => {
    const header = event.target instanceof Element ? event.target.closest('th') : undefined
    const name = /** @type {{ columnName?: string } | undefined} */ (header ?? undefined)?.columnName
    if (name !== undefined && addedColumnNames.includes(name)) table.setSortedColumn(name)
  })
}

function QbitAio() {
  const utils = new Shuutils(id)
  /**
   * Add our computed columns to the torrent table, it is a no-op if they are already there
   */
  function addRatioColumns() {
    if (!isTorrentsTableReady()) {
      utils.debug('torrent table not ready yet, will retry on next trigger')
      return
    }
    const table = torrentsTable
    wireHeaderSort(table)
    if (tintLastActivity(table)) table.rerender()
    if (torrentsTableHasRatioColumns()) return // the common case on every trigger, nothing to build
    const scorer = createSeedingScorer(table)
    const pickSeedingTier = createTierPicker(() => scorer.listScores())
    const specs = [
      ...ratioColumns.map(({ caption, days, name }) => {
        const getRowValue = (/** @type {{ full_data: { added_on: number, ratio: number } }} */ row) => getRatioPerPeriod(row.full_data.ratio, Date.now() / 1000 - row.full_data.added_on, days)
        return { caption, getRowValue, name, render: (/** @type {number} */ value) => value.toFixed(2) }
      }),
      { ...seedingColumn, getRowValue: scorer.getScore, render: (/** @type {number} */ value) => `${pickSeedingTier(value)} ${value}` },
    ]
    for (const { caption, getRowValue, name, render } of specs) {
      if (table.columns[name] !== undefined) continue
      table.newColumn(name, '', caption, 100, true)
      const column = /** @type {TorrentsTableColumn | undefined} */ (table.columns[name]) // the cast resets the narrowing of the check above
      if (column === undefined) continue
      column.dataProperties = ['ratio', 'added_on', 'last_activity']
      column.getRowValue = getRowValue
      /**
       * Render the cell of a torrent row
       * @param {HTMLElement} td the cell to fill
       * @param {{ full_data: { added_on: number, ratio: number } }} row the torrent row
       */
      column.updateTd = (td, row) => {
        const text = render(getRowValue(row))
        td.textContent = text
        td.title = text
      }
    }
    table.updateTableHeaders()
    table.setupHeaderMenu()
    table.rerender()
    utils.debug('added the ratio per week, ratio per month & seed health columns')
  }
  /**
   * List the tracker urls currently displayed in the details panel
   * @param {boolean} selectedOnly true to only list the urls of the selected rows
   * @returns {string[]} the tracker urls, pseudo trackers included
   */
  function getTrackerUrls(selectedOnly = false) {
    const selector = selectedOnly ? `${selectors.trackerRow}.selected` : selectors.trackerRow
    return utils.findAll(selector, document, true).map(row => row.dataset.rowId ?? '')
  }
  /**
   * Close the context menu like the native entries do
   */
  function closeMenu() {
    utils.findOne(selectors.trackersMenu, document, true)?.classList.remove('visible')
  }
  /**
   * Ask the api to remove the given trackers, in a single call
   * @param {string} hash the hash of the torrent to remove the trackers from
   * @param {string[]} urls the urls of the trackers to remove
   * @returns {Promise<string[]>} the urls that really disappeared, the api silently keeps the ones it fails to match
   */
  async function askRemoval(hash, urls) {
    const list = urls.map(url => encodeTrackerUrl(url)).join('|') // the api wants the urls pipe separated
    const body = `hash=${encodeURIComponent(hash)}&urls=${encodeURIComponent(list)}`
    const response = await fetch('api/v2/torrents/removeTrackers', { body, headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, method: 'POST' })
    if (!response.ok) {
      utils.showError(`failed to remove the trackers (${response.status})`)
      return []
    }
    // the api answers 204 even when it matched nothing, so check what really disappeared instead of trusting it
    const left = await fetchTrackers(hash)
    return getRemovedTrackers(
      urls,
      left.map(tracker => tracker.url),
    )
  }
  /**
   * Remove the given trackers from the current torrent, retrying one by one the ones the api silently kept
   * @param {string} hash the hash of the torrent to remove the trackers from
   * @param {string[]} urls the urls of the trackers to remove
   */
  async function removeTrackers(hash, urls) {
    const removed = new Set(await askRemoval(hash, urls))
    const missing = urls.filter(url => !removed.has(url))
    if (missing.length > 0) {
      utils.debug(`the api kept ${missing.length} trackers, retrying them one by one`)
      // one at a time on purpose, a single bad url should not make the whole retry fail
      for (const url of missing) for (const done of await askRemoval(hash, [url])) removed.add(done)
    }
    qBittorrent.PropTrackers.updateData() // refresh the panel instead of waiting for the next sync
    if (removed.size === 0) {
      utils.showError(`the api accepted the request but removed none of the ${urls.length} trackers`)
      return
    }
    if (removed.size < urls.length) {
      utils.showError(`removed only ${removed.size} trackers out of the ${urls.length} asked`)
      return
    }
    utils.showSuccess(`removed ${removed.size} trackers`)
  }
  /**
   * Fetch the trackers of the current torrent
   * @param {string} hash the hash of the torrent
   * @returns {Promise<Tracker[]>} the trackers, pseudo trackers included, empty when the call fails
   */
  async function fetchTrackers(hash) {
    const response = await fetch(`api/v2/torrents/trackers?hash=${encodeURIComponent(hash)}`)
    if (!response.ok) {
      utils.showError(`failed to list the trackers (${response.status})`)
      return []
    }
    return /** @type {Tracker[]} */ (await response.json())
  }
  /**
   * Remove all the trackers of the current torrent but the selected one
   * @param {MouseEvent} event the click event on the menu entry
   */
  async function deleteOtherTrackers(event) {
    event.preventDefault()
    closeMenu()
    const [keptUrl] = getTrackerUrls(true)
    if (keptUrl === undefined || !isRealTracker(keptUrl)) {
      utils.error('cannot delete other trackers, no single real tracker selected')
      return
    }
    const urls = getTrackersToRemove(getTrackerUrls(), keptUrl)
    if (urls.length === 0) {
      utils.showLog('there is no other tracker to delete')
      return
    }
    const hash = torrentsTable.getCurrentTorrentID()
    if (hash === undefined || hash === '') {
      utils.error('cannot delete other trackers, no current torrent found')
      return
    }
    utils.log(`deleting ${urls.length} trackers to only keep "${keptUrl}"`, urls) // logged so the urls stay recoverable
    await removeTrackers(hash, urls)
  }
  /**
   * Check the trackers panel is showing the torrent we are about to modify, the web ui sometimes lags behind the selection
   * @param {Tracker[]} trackers the trackers of the torrent we are about to modify
   * @returns {boolean} true when the displayed rows belong to that torrent
   */
  function isPanelInSync(trackers) {
    const shown = getTrackerUrls().filter(url => isRealTracker(url))
    if (shown.length === 0) return true // nothing displayed, nothing to contradict
    const known = new Set(trackers.map(tracker => tracker.url))
    return shown.every(url => known.has(url))
  }
  /**
   * Remove the trackers of the current torrent that are not working or that report no peer at all
   * @param {MouseEvent} event the click event on the menu entry
   */
  async function cleanUselessTrackers(event) {
    event.preventDefault()
    closeMenu()
    const hash = torrentsTable.getCurrentTorrentID()
    if (hash === undefined || hash === '') {
      utils.error('cannot clean the useless trackers, no current torrent found')
      return
    }
    const trackers = await fetchTrackers(hash)
    if (!isPanelInSync(trackers)) {
      utils.showError('the trackers panel is out of sync with the selected torrent, re-select it and retry')
      return
    }
    const urls = getUselessTrackers(trackers)
    if (urls.length === 0) {
      utils.showLog('there is no useless tracker to clean')
      return
    }
    utils.log(`cleaning ${urls.length} useless trackers`, urls) // logged so the urls stay recoverable
    await removeTrackers(hash, urls)
  }
  // our entries paired with their click handler, in the order they show up in the menu
  const entries = [
    { ...menuItems.deleteOthers, action: deleteOtherTrackers, key: 'deleteOthers' },
    { ...menuItems.cleanUseless, action: cleanUselessTrackers, key: 'cleanUseless' },
  ]
  /**
   * Add our entries to the trackers context menu, it is a no-op if they are already there
   */
  function addMenuItems() {
    const menu = utils.findOne(selectors.trackersMenu, document, true)
    if (menu === undefined) {
      utils.debug('trackers context menu not found yet, will retry on next trigger')
      return
    }
    if (menu.querySelector(`.${cls.menuItem}`)) return // already added
    for (const { action, icon: source, key, label, needsSelection } of entries) {
      const icon = document.createElement('img')
      icon.src = source
      icon.alt = label
      const link = document.createElement('a')
      link.href = `#${key}`
      link.append(icon, label) // the native entries are built the same way : the icon then the label
      link.addEventListener('click', event => void action(event))
      const item = document.createElement('li')
      item.classList.add(cls.menuItem)
      if (needsSelection) item.classList.add(`${cls.menuItem}-off`) // hidden until a single real tracker is selected
      item.dataset.qbitAioItem = key
      item.append(link)
      menu.append(item)
    }
    utils.debug(`added ${entries.length} entries to the trackers context menu`)
  }
  /**
   * Only offer the entries needing a selection when a single real tracker is selected, the context menu is shared by every tracker row
   */
  function toggleMenuItems() {
    const selected = getTrackerUrls(true)
    const isSingleRealTracker = selected.length === 1 && isRealTracker(selected[0] ?? '')
    for (const { key, needsSelection } of entries) {
      if (!needsSelection) continue
      const item = utils.findOne(`[data-qbit-aio-item="${key}"]`, document, true)
      item?.classList.toggle(`${cls.menuItem}-off`, !isSingleRealTracker)
    }
  }
  /**
   * Watch the right clicks on the trackers table to toggle the entry before the context menu shows up
   * the listener is on the document and in the capture phase because the web ui stops the propagation of the event on the rows
   */
  function watchTrackersRightClicks() {
    document.addEventListener(
      'contextmenu',
      event => {
        if (!(event.target instanceof Element) || event.target.closest(selectors.trackersTable) === null) return
        setTimeout(toggleMenuItems, 0) // let the web ui update the selection first
      },
      true,
    )
    utils.debug('watching the trackers table right clicks')
  }
  /**
   * Process the page : hide the useless elements & add our entry to the trackers context menu
   * @param {string} reason the reason why the process has been triggered
   */
  function start(reason = 'unknown') {
    utils.log(`start because "${reason}"`)
    utils.hideElements(uselessSelectors, 'useless')
    addMenuItems()
    addRatioColumns()
  }
  utils.injectStyles(styles)
  watchTrackersRightClicks()
  const startDebounced = utils.debounce((/** @type {string} */ reason) => start(reason), startDebounceTime)
  /**
   * Watch the torrent table, qbittorrent re-renders the ui on each sync so we need to re-process the page
   */
  function watchTable() {
    const table = utils.findOne(selectors.table, document, true)
    if (table === undefined) {
      utils.debug('torrent table not found yet, will retry on next trigger')
      return
    }
    new MutationObserver(() => startDebounced('table-mutation')).observe(table, { characterData: true, childList: true, subtree: true })
    utils.debug('watching the torrent table')
  }
  /**
   * Add our columns the moment the torrent table is ready, not after the debounce : the web ui restores the sort column it saved, and if that is one of ours
   * its first sync crashes on a column that does not exist yet
   */
  function addRatioColumnsASAP() {
    const timer = setInterval(() => {
      if (!isTorrentsTableReady()) return // silent, this runs every few ms until the web ui is up
      try {
        addRatioColumns()
      } catch (error) {
        clearInterval(timer) // never loop on a failure
        utils.error('failed to add the columns', error)
        return
      }
      if (torrentsTableHasRatioColumns()) clearInterval(timer)
    }, ratioColumnsPollTime)
    setTimeout(() => {
      clearInterval(timer)
      if (!torrentsTableHasRatioColumns()) utils.debug('gave up waiting for the torrent table, the columns will be added on the next trigger')
    }, ratioColumnsPollTimeout)
  }
  addRatioColumnsASAP()
  globalThis.addEventListener('scroll', () => startDebounced('scroll'))
  utils.onPageChange(() => startDebounced('page-change'))
  document.addEventListener('DOMContentLoaded', () => {
    watchTable()
    startDebounced('dom-loaded')
  })
  watchTable()
  startDebounced('initial-dom-ready')
}

if (globalThis.window) QbitAio()
else
  module.exports = {
    buildRankIndex,
    countLower,
    countPeers,
    createSeedingScorer,
    createTierPicker,
    encodeTrackerUrl,
    getRatioPerPeriod,
    getRemovedTrackers,
    getSeedingMetrics,
    getSeedingScore,
    getSeedingScores,
    getTierBounds,
    getTierEmoji,
    getTrackersToRemove,
    getUselessTrackers,
    isRealTracker,
    isTorrentsTableReady,
    isUselessTracker,
    tintLastActivity,
    torrentsTableHasRatioColumns,
    wireHeaderSort,
  }
