// ==UserScript==
// @name         Text Guard
// @namespace    https://github.com/Shuunen
// @version      1.0.1
// @description  Check the text of the current page, show alerts if it contains weird/forbidden words
// @author       Romain Racamier-Lafon
// @require      https://cdn.jsdelivr.net/gh/Shuunen/user-scripts@master/src/utils.js
// @require      https://cdn.jsdelivr.net/npm/notyf@3/notyf.min.js
// @require      https://unpkg.com/rough-notation/lib/rough-notation.iife.js
// @resource     notyfCss https://cdn.jsdelivr.net/npm/notyf@3/notyf.min.css
// @grant        GM_getResourceText
// @grant        GM_addStyle
// ==/UserScript==

// This script use two ways to find elements in the document:
// 1. Using XPath expressions with document.evaluate
// 2. Using querySelectorAll
// both methods are used to find elements containing a specific word in their text content, sometimes one method is more efficient than the other ¯\_(ツ)_/¯

// eslint-disable-next-line max-statements
(function TextGuard () {
  /* global Shuutils, Notyf, RoughNotation, GM_getResourceText, GM_addStyle */
  // @ts-ignore
  const toast = new Notyf()
  const marker = 'txt-grd'
  const app = {
    counts: {
      forbidden: 0,
    },
    debug: false, // eslint-disable-line @typescript-eslint/naming-convention
    hasLoadedCss: false,
    hasScrolled: false,
    id: marker,
  }
  const forbiddenWords = [
    '23 rue du Berry',
  ]
  const hostExceptions = new Set([
    'localhost',
  ])
  const elementExceptions = new Set([
    'circle', 'defs', 'ellipse', 'path', 'rect',
    'svg', 'symbol', 'br', 'hr', 'iframe',
    'link', 'meta', 'script', 'style', 'title',
  ])
  /** @type {import('./utils.js').Shuutils} */
  // @ts-ignore
  const utils = new Shuutils(app)
  /**
   * Loads CSS styles for the toast notifications
   */
  function loadCss () {
    app.hasLoadedCss = true
    // @ts-ignore
    // eslint-disable-next-line new-cap, sonar/new-cap
    const css = GM_getResourceText('notyfCss')
    // @ts-ignore
    // eslint-disable-next-line new-cap, sonar/new-cap
    GM_addStyle(css)
  }
  /**
   * @param {string} message
   * @returns {void}
   */
  function showError (message) {
    if (!app.hasLoadedCss) loadCss()
    toast.error({ dismissible: true, duration: 3000, message }) // eslint-disable-line @typescript-eslint/naming-convention
    utils.error(message)
  }
  /**
   * @param {string} message
   * @returns {void}
   */
  function showLog (message) {
    if (!app.hasLoadedCss) loadCss()
    toast.success(message)
    utils.log(message)
  }
  /**
   * Handles the detection of a forbidden word.
   * @param {string} word the forbidden word that was detected.
   * @param {HTMLElement} element the element containing the forbidden word.
   * @returns {void}
   */
  function onForbidden (word, element) {
    if (element.dataset.txtGrd === 'forbidden') return
    // eslint-disable-next-line no-param-reassign
    element.dataset.txtGrd = 'forbidden'
    app.counts.forbidden += 1 // @ts-ignore
    const annotation1 = RoughNotation.annotate(element, { color: 'red', strokeWidth: 4, type: 'box' })// @ts-ignore
    const annotation2 = RoughNotation.annotate(element, { color: 'yellow', type: 'highlight' })// @ts-ignore
    const annotationGroup = RoughNotation.annotationGroup([annotation1, annotation2])
    annotationGroup.show()
    utils.error(`Forbidden word detected: ${word}`)
  }
  /**
   * Sanitizes the given text by removing accents, case and other fancy stuff.
   * @param {string} text - The text to be sanitized.
   * @returns {string} The sanitized text.
   */
  function sanitize (text) {
    return utils.readableString(utils.removeAccents(text.toLocaleLowerCase()))
  }
  /**
   * Finds elements in the document that contain a specific word
   * @param {string} word - The word to search for in the elements' text content.
   * @returns {HTMLElement[]} An array of HTMLElements that match the XPath expression and contain the specified word.
   */
  // eslint-disable-next-line max-statements
  function findElementsByXpath (word) {
    const needle = sanitize(word)
    // eslint-disable-next-line sonar/xpath
    const results = document.evaluate(`//*[contains(translate(text(),"ABCDEFGHIJKLMNOPQRSTUVWXYZ ,","abcdefghijklmnopqrstuvwxyz "),"${needle}")]`, document, undefined, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE)
    const elements = []
    for (let index = 0; index < results.snapshotLength; index += 1) {
      const node = results.snapshotItem(index)
      if (node === null) continue // eslint-disable-line no-continue
      if (!(node instanceof HTMLElement)) { utils.error(node); showError('Node is not an HTMLElement'); continue } // eslint-disable-line no-continue
      if (node.dataset.txtGrd !== undefined) continue // eslint-disable-line no-continue
      node.dataset.txtGrd = 'found'
      elements.push(node)
    }
    return elements
  }
  /**
   * Finds all elements in the document that contain the specified word.
   * @param {string} word - The word to search for.
   * @returns {Array<HTMLElement>} - An array of elements that contain the specified word.
   */
  function findElementsByQueryAll (word) {
    const needle = sanitize(word)
    const elements = document.querySelectorAll('*')
    /**
     * @type {HTMLElement[]}
     */
    const results = []
    // eslint-disable-next-line max-statements
    elements.forEach((element) => {
      if (elementExceptions.has(element.tagName.toLowerCase())) return
      if (!(element instanceof HTMLElement)) { utils.error('Element is not an HTMLElement, tag is : ', element.tagName); return }
      if (element.dataset.txtGrd !== undefined) return
      const children = Array.from(element.children).filter(child => !['b', 'br'].includes(child.tagName.toLowerCase()))
      if (children.length > 0) return
      const text = sanitize(element.textContent ?? '')
      if (!text.includes(needle)) return
      element.dataset.txtGrd = 'found' // eslint-disable-line no-param-reassign
      results.push(element)
    })
    return results
  }
  /**
   * Searches for a specified word in the document and performs an action based on the isForbidden parameter.
   * @param {string} word - The word to search for.
   * @param {boolean} isForbidden - Indicates whether the word is forbidden.
   */
  function search (word, isForbidden) {
    const elements = [...findElementsByQueryAll(word), ...findElementsByXpath(word)]
    if (elements.length > 0) utils.log(`found ${elements.length} element(s) :`, elements)
    for (const element of elements)
      if (isForbidden) onForbidden(word, element)
      else showLog(`Found warn word: ${word}`)
  }
  function report () {
    if (app.counts.forbidden > 0) showError(`Found ${app.counts.forbidden} forbidden words`)
    else utils.log('Stop, no forbidden words found')
  }
  function init () {
    if (hostExceptions.has(window.location.hostname)) return
    utils.log('Start...')
    app.counts.forbidden = 0
    const text = document.body.textContent ?? ''
    if (text === '') { showError('No text found in the current page'); return }
    for (const word of forbiddenWords) search(word, true)
    report()
  }
  const initDebounced = utils.debounce(init, 500) // eslint-disable-line no-magic-numbers
  initDebounced()
  /**
   * Handles the DOM insert event.
   * @param {Event} event - The DOM insert event.
   */
  function onDomInsert (event) {
    const { target } = event
    if (target === null) return
    if (!(target instanceof HTMLElement)) return
    if (elementExceptions.has(target.tagName.toLowerCase())) return
    if (target.className.includes('notyf')) return
    // utils.debug(target)
    initDebounced()
  }
  window.addEventListener('DOMNodeInserted', onDomInsert)
})()
