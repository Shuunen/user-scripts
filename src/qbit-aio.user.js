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
// @version      1.1.0
// ==/UserScript==

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

function QbitAio() {
  const utils = new Shuutils(id)
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
else module.exports = { countPeers, encodeTrackerUrl, getRemovedTrackers, getTrackersToRemove, getUselessTrackers, isRealTracker, isUselessTracker }
