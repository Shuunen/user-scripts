// ==UserScript==
// @name         Template - All in one
// @author       Romain Racamier-Lafon
// @description  Starter template to bootstrap a new user-script
// @downloadURL  https://github.com/Shuunen/user-scripts/raw/master/src/template.user.js
// @updateURL    https://github.com/Shuunen/user-scripts/raw/master/src/template.user.js
// @grant        none
// @match        https://www.example.com/*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=example.com
// @namespace    https://github.com/Shuunen
// @require      https://cdn.jsdelivr.net/gh/Shuunen/user-scripts@master/src/utils.js
// @version      1.0.0
// ==/UserScript==

/*
 * How to use this template :
 *
 * 1. copy this file to `src/my-script.user.js`
 * 2. rename the main function to match the filename in PascalCase, here `my-script` gives `MyScript`
 * 3. update the metadata block above : @name, @description, @downloadURL, @updateURL, @match, @icon
 * 4. keep the metadata keys sorted like above, @name must stay on the second line
 * 5. put your pure & testable functions outside the main function and export them via `module.exports`
 * 6. add a `src/my-script.test.ts` importing them, see `src/template.test.ts`
 * 7. run `pnpm run check` to lint, type-check & test everything
 *
 * Available `utils` helpers, see `src/utils.js` for the full list :
 *
 * - dom      : findAll, findFirst, findOne, waitToDetect, hideElement, hideElements, injectStyles, fillLikeHuman, animateCss
 * - flow     : debounce, throttle, sleep, onPageChange
 * - feedback : log, debug, warn, error, showLog, showError, showSuccess, toastInfo, toastSuccess, toastError
 * - string   : capitalize, ellipsis, ellipsisWords, readableString, removeAccents, parsePrice
 * - misc     : copyToClipboard, readClipboard, getRandomNumber, pickRandom, round, rangedScore, tw
 */

// the script id, used as a log prefix and as a css marker, keep it short
const id = 'tpl-aio'

// css classes injected by this script, prefixed with the script id to avoid collisions
const cls = {
  done: `${id}-done`,
  highlight: `${id}-highlight`,
}

// all css selectors in one place, `:not(.done)` avoids processing the same element twice
const selectors = {
  item: `.item:not(.${cls.done})`,
  itemTitle: 'h2, h3',
}

// elements of the page we never want to see, hidden via `utils.hideElements`
const uselessSelectors = {
  ads: '.ad, .ads, [id^="ad-"]',
  cookieBanner: '#cookie-banner',
  newsletter: '.newsletter-popup',
}

// all regexes in one place, they are hoisted here to avoid re-creating them on each call
const regex = {
  spaces: /\s+/gu,
  tags: /[[({][^\])}]*[\])}]/gu,
}

// styles injected in the page, use the `cls` entries above
const styles = `
  .${cls.highlight} {
    outline: 2px solid orangered;
    outline-offset: 2px;
  }
`

// how long to wait before processing the page again, in ms
const startDebounceTime = 500

/**
 * Clean a title : drop the bracketed parts, collapse the spaces and trim it
 * @param {string} title the title to clean, like "  Nice  product [new] (2024) "
 * @returns {string} the cleaned title, like "Nice product"
 */
function cleanTitle(title) {
  return title.replace(regex.tags, ' ').replace(regex.spaces, ' ').trim()
}

function Template() {
  const utils = new Shuutils(id)
  /**
   * Augment one item : clean its title and highlight it
   * @param {HTMLElement} item the item to augment
   */
  function augmentItem(item) {
    item.classList.add(cls.done) // mark it first, so a concurrent run will skip it
    const title = utils.findOne(selectors.itemTitle, item, true)
    if (title === undefined) {
      utils.debug('skip, item without title', item)
      return
    }
    const cleaned = cleanTitle(title.textContent ?? '')
    if (cleaned === '') {
      utils.debug('skip, item with an empty title', item)
      return
    }
    title.textContent = cleaned
    item.classList.add(cls.highlight)
  }
  /**
   * Augment all the items found on the page
   */
  function augmentItems() {
    const items = utils.findAll(selectors.item, document, true)
    if (items.length === 0) {
      utils.debug('found no item to augment')
      return
    }
    utils.log(`found ${items.length} items to augment`)
    for (const item of items) augmentItem(item)
    utils.showSuccess(`augmented ${items.length} items`)
  }
  /**
   * Process the page : hide the useless stuff and augment the items
   * @param {string} reason the reason why the process has been triggered
   */
  function start(reason = 'unknown') {
    utils.debug(`start called because "${reason}"`)
    utils.hideElements(uselessSelectors, 'useless')
    augmentItems()
  }
  utils.injectStyles(styles)
  const startDebounced = utils.debounce((/** @type {string} */ reason) => start(reason), startDebounceTime)
  globalThis.addEventListener('scroll', () => startDebounced('scroll'))
  utils.onPageChange(() => startDebounced('page-change'))
  document.addEventListener('DOMContentLoaded', () => startDebounced('dom-loaded'))
  startDebounced('initial-dom-ready')
}

if (globalThis.window) Template()
else module.exports = { cleanTitle }
