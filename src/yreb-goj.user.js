// ==UserScript==
// @name         YggReborn - Go per day
// @author       Romain Racamier-Lafon
// @description  Add a "Go/j" column (size x completions / age) on torrent listings and sort by it on the freeleech one, from the most to the least interesting
// @downloadURL  https://github.com/Shuunen/user-scripts/raw/master/src/yreb-goj.user.js
// @updateURL    https://github.com/Shuunen/user-scripts/raw/master/src/yreb-goj.user.js
// @grant        none
// @match        https://www.yggreborn.org/torrents*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=yggreborn.org
// @namespace    https://github.com/Shuunen
// @require      https://cdn.jsdelivr.net/gh/Shuunen/user-scripts@master/src/utils.js
// @version      1.1.0
// ==/UserScript==

// the script id, used as a log prefix and as a css marker, keep it short
const id = 'yreb-goj'

// css classes injected by this script, prefixed with the script id to avoid collisions
const cls = {
  done: `${id}-done`,
  grid: `${id}-grid`,
  top: `${id}-top`,
  value: `${id}-value`,
}

// the tailwind class fragment identifying the listing grid : type, name, size, date, completions, seed, leech
const gridMarker = 'grid-cols-[82px_minmax(322px,1fr)_64px_52px_50px_52px_52px]'

// all css selectors in one place, `:not(.done)` avoids processing the same element twice
const selectors = {
  header: `main div[class*="${gridMarker}"]:not(.${cls.done})`,
  row: `main a[class*="${gridMarker}"]:not(.${cls.done})`,
  rows: `main a[class*="${gridMarker}"]`,
}

// all regexes in one place, they are hoisted here to avoid re-creating them on each call
const regex = {
  age: /^(?<value>\d+)\s*(?<unit>mo|[dhmswy])$/iu,
  nonNumeric: /[^\d.,]/gu,
  size: /^(?<value>[\d.,]+)\s*(?<unit>[gkmt])[bo]$/iu,
}

// how many gigabytes one unit of size represents, ex : one "t" (tera) is 1024 gigabytes
const sizeUnits = new Map([
  ['g', 1],
  ['k', 1 / (1024 * 1024)],
  ['m', 1 / 1024],
  ['t', 1024],
])

// how many days one unit of age represents, ex : one "mo" (month) is 30 days, "m" alone is a minute
const ageUnits = new Map([
  ['d', 1],
  ['h', 1 / 24],
  ['m', 1 / (24 * 60)],
  ['mo', 30],
  ['s', 1 / (24 * 60 * 60)],
  ['w', 7],
  ['y', 365],
])

// the age used for the torrents younger than that, else a one hour old torrent would get a x24 boost
const minAgeDays = 1

// the width of the column added by this script, appended to the original grid template
const columnWidth = '90px'

// the share of the rows highlighted as a blue badge, the most interesting ones
const topShare = 0.2

// the classes the site uses for its seed & leech badges, reused so our badge looks native
const badgeClasses = 'inline-flex min-w-[3rem] items-center justify-center rounded-lg px-2.5 py-1 text-sm font-mono font-bold whitespace-nowrap'

// styles injected in the page, the `!important` is needed to override the tailwind grid class
const styles = `
  .${cls.grid} {
    grid-template-columns: 82px minmax(322px, 1fr) 64px 52px 50px 52px 52px ${columnWidth} !important;
  }
  .${cls.top} {
    background: rgba(96, 165, 250, 0.12);
    border: 1px solid var(--light-border);
    color: #60a5fa;
  }
`

// how long to wait before processing the page again, in ms
const startDebounceTime = 500

/**
 * Check if the current page is the freeleech listing, only there the rows get sorted
 * @param {string} search the location search, like "?freeleech=1&page=2"
 * @returns {boolean} true if the freeleech filter is active
 */
function isFreeleech(search) {
  return new URLSearchParams(search).get('freeleech') === '1'
}

/**
 * Parse a size cell into gigabytes
 * @param {string} text the size to parse, like "1.5 Go" or "700 MB"
 * @returns {number|undefined} the size in gigabytes, or undefined if unparsable
 */
function parseSizeToGb(text) {
  const groups = regex.size.exec(text.trim())?.groups
  const unit = sizeUnits.get(groups?.unit.toLowerCase() ?? '')
  if (groups === undefined || unit === undefined) return undefined
  const value = Number(groups.value.replace(',', '.'))
  if (Number.isNaN(value)) return undefined
  return value * unit
}

/**
 * Parse an age cell into days
 * @param {string} text the age to parse, like "3d" or "2mo"
 * @returns {number|undefined} the age in days, or undefined if unparsable
 */
function parseAgeToDays(text) {
  const groups = regex.age.exec(text.trim())?.groups
  const unit = ageUnits.get(groups?.unit.toLowerCase() ?? '')
  if (groups === undefined || unit === undefined) return undefined
  const value = Number(groups.value)
  if (Number.isNaN(value)) return undefined
  return value * unit
}

/**
 * Compute how many gigabytes a torrent gives per day of existence
 * @param {string} sizeText the size cell content, like "1.5 Go"
 * @param {string} ageText the age cell content, like "3d"
 * @param {string} completionsText the completions cell content, like "1 234"
 * @returns {number|undefined} the gigabytes per day, or undefined if one of the inputs is unusable
 */
function computeGbPerDay(sizeText, ageText, completionsText) {
  const sizeGb = parseSizeToGb(sizeText)
  const days = parseAgeToDays(ageText)
  const completions = completionsText.replace(regex.nonNumeric, '').replace(',', '.')
  const count = completions === '' ? Number.NaN : Number(completions)
  if (sizeGb === undefined || days === undefined || days <= 0 || Number.isNaN(count)) return undefined
  return (sizeGb * count) / Math.max(days, minAgeDays)
}

/**
 * Format a gigabytes per day value for display, rounded to keep the column narrow
 * @param {number|undefined} value the value to format
 * @returns {string} the formatted value, like "12" or "—" when there is nothing to show
 */
function formatGbPerDay(value) {
  if (value === undefined || !Number.isFinite(value)) return '—'
  return String(Math.round(value))
}

/**
 * Create the cell appended at the end of a header or a row
 * @param {string} text the cell content
 * @param {string} className the classes to apply to the cell
 * @returns {HTMLDivElement} the created cell
 */
function createCell(text, className) {
  const cell = document.createElement('div')
  cell.className = className
  cell.textContent = text
  return cell
}

/**
 * Create the badge holding the value inside a row cell, styled like the site seed & leech ones
 * @param {string} text the value to display
 * @returns {HTMLSpanElement} the created badge
 */
function createBadge(text) {
  const badge = document.createElement('span')
  badge.className = `${badgeClasses} ${cls.value}`
  badge.textContent = text
  return badge
}

/**
 * Read the gigabytes per day previously computed for a row
 * @param {HTMLElement} row the row to read
 * @returns {number} the value, or -Infinity so the unusable rows end up at the bottom
 */
function readGbPerDay(row) {
  const value = Number(row.dataset.gbPerDay ?? '')
  return Number.isNaN(value) ? Number.NEGATIVE_INFINITY : value
}

/**
 * Compute the value from which a row belongs to the highest ones
 * @param {number[]} values the gigabytes per day of all the rows
 * @returns {number} the threshold, Infinity when there is nothing worth highlighting
 */
function computeTopThreshold(values) {
  const usable = values.filter(value => Number.isFinite(value) && value > 0).toSorted((valueA, valueB) => valueB - valueA)
  const count = Math.ceil(usable.length * topShare)
  return count === 0 ? Number.POSITIVE_INFINITY : (usable[count - 1] ?? Number.POSITIVE_INFINITY)
}

/**
 * Highlight as a blue badge the rows with the highest gigabytes per day
 * @param {HTMLElement[]} rows all the rows of the listing, augmented or not
 */
function highlightTopRows(rows) {
  const threshold = computeTopThreshold(rows.map(row => readGbPerDay(row)))
  for (const row of rows) row.querySelector(`.${cls.value}`)?.classList.toggle(cls.top, readGbPerDay(row) >= threshold)
}

function YrebGoj() {
  const utils = new Shuutils(id)
  /**
   * Augment the listing header with the title of our column
   * @param {HTMLElement} header the header to augment
   * @param {boolean} willSort true if the rows will be sorted by this column
   */
  function augmentHeader(header, willSort) {
    header.classList.add(cls.done, cls.grid) // mark it first, so a concurrent run will skip it
    header.append(createCell(willSort ? 'Go/j ▼' : 'Go/j', 'text-center whitespace-nowrap'))
  }
  /**
   * Augment one row : compute its gigabytes per day and display it in a new cell
   * @param {HTMLElement} row the row to augment
   */
  function augmentRow(row) {
    row.classList.add(cls.done, cls.grid) // mark it first, so a concurrent run will skip it
    const cells = row.children
    if (cells.length < 5) {
      utils.debug('skip, row without enough cells', row)
      return
    }
    const value = computeGbPerDay(cells[2]?.textContent ?? '', cells[3]?.textContent ?? '', cells[4]?.textContent ?? '')
    row.dataset.gbPerDay = value === undefined ? '' : String(value)
    const cell = createCell('', 'text-center')
    cell.append(createBadge(formatGbPerDay(value)))
    row.append(cell)
  }
  /**
   * Sort the rows of a listing, from the most to the least gigabytes per day
   * @param {HTMLElement[]} rows the rows sharing the same parent
   */
  function sortRows(rows) {
    const parent = rows[0]?.parentElement
    if (rows.length < 2 || !parent) return
    const sorted = rows.toSorted((rowA, rowB) => readGbPerDay(rowB) - readGbPerDay(rowA))
    if (sorted.every((row, index) => row === rows[index])) return // avoid useless mutations
    for (const row of sorted) parent.append(row)
    utils.log(`sorted ${sorted.length} rows`)
  }
  /**
   * Augment the listing : add the column to the header & the rows, then sort the rows if asked
   * @param {boolean} willSort true to sort the rows by gigabytes per day
   */
  function augmentListing(willSort) {
    for (const header of utils.findAll(selectors.header, document, true)) augmentHeader(header, willSort)
    const rows = utils.findAll(selectors.row, document, true)
    if (rows.length > 0) utils.log(`found ${rows.length} rows to augment`)
    for (const row of rows) augmentRow(row)
    const allRows = utils.findAll(selectors.rows, document, true)
    highlightTopRows(allRows)
    if (!willSort) return
    /** @type {Map<HTMLElement, HTMLElement[]>} */
    const rowsByParent = new Map()
    for (const row of allRows) {
      const parent = row.parentElement
      if (parent === null) continue
      rowsByParent.set(parent, [...(rowsByParent.get(parent) ?? []), row])
    }
    for (const group of rowsByParent.values()) sortRows(group)
  }
  /**
   * Process the page : augment the listing, sorting it only on the freeleech one
   * @param {string} reason the reason why the process has been triggered
   */
  function start(reason = 'unknown') {
    const willSort = isFreeleech(globalThis.location.search)
    utils.log(`start because "${reason}"${willSort ? '' : ', without sorting'}`)
    augmentListing(willSort)
  }
  utils.injectStyles(styles)
  const startDebounced = utils.debounce((/** @type {string} */ reason) => start(reason), startDebounceTime)
  globalThis.addEventListener('scroll', () => startDebounced('scroll'))
  utils.onPageChange(() => startDebounced('page-change'))
  utils.onPageMutation(() => startDebounced('page-mutation'))
  document.addEventListener('DOMContentLoaded', () => startDebounced('dom-loaded'))
  startDebounced('initial-dom-ready')
}

if (globalThis.window) YrebGoj()
else module.exports = { computeGbPerDay, computeTopThreshold, createBadge, createCell, formatGbPerDay, highlightTopRows, isFreeleech, parseAgeToDays, parseSizeToGb, readGbPerDay }
