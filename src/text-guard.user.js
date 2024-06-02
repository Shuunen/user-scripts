// ==UserScript==
// @name         Text Guard
// @namespace    https://github.com/Shuunen
// @version      1.0.0
// @description  Check the text of the current page, show alerts if it contains weird/forbidden words
// @author       Romain Racamier-Lafon
// @require      https://cdn.jsdelivr.net/gh/Shuunen/user-scripts@master/src/utils.js
// @require      https://cdn.jsdelivr.net/npm/notyf@3/notyf.min.js
// @require      https://unpkg.com/rough-notation/lib/rough-notation.iife.js
// @resource     notyfCss https://cdn.jsdelivr.net/npm/notyf@3/notyf.min.css
// @grant        GM_getResourceText
// @grant        GM_addStyle
// ==/UserScript==

// There is two ways to find elements in the document:
// 1. Using XPath expressions with document.evaluate
// 2. Using querySelectorAll
// the advantage of the first method is that it will find the end of the chain of elements that contain the word
// the second method will only find all elements that contains the word, for exemple if the word is in a span inside a div, it will find html, body, div and span

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
    if (element.dataset.txtGrd !== undefined) return
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
      elements.push(node)
    }
    return elements
  }
  /**
   * Finds all elements in the document that contain the specified word.
   * @param {string} word - The word to search for.
   * @returns {Array<HTMLElement>} - An array of elements that contain the specified word.
   */
  // @ts-ignore
  // eslint-disable-next-line @typescript-eslint/no-unused-vars, unused-imports/no-unused-vars
  function findElementsByQueryAll (word) {
    const needle = sanitize(word)
    const elements = document.querySelectorAll('*')
    /**
     * @type {HTMLElement[]}
     */
    const results = []
    elements.forEach((element) => {
      const text = sanitize(element.textContent ?? '')
      if (!text.includes(needle)) return
      if (!(element instanceof HTMLElement)) { utils.error(element); showError('Element is not an HTMLElement'); return }
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
    const elements = findElementsByXpath(word)
    if (elements.length > 0) utils.debug('found elements :', elements)
    for (const element of elements)
      if (isForbidden) onForbidden(word, element)
      else showLog(`Found warn word: ${word}`)
  }
  function report () {
    if (app.counts.forbidden > 0) showError(`Found ${app.counts.forbidden} forbidden words`)
    else utils.log('Stop, no forbidden words found')
  }
  function init () {
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
    if (['br', 'hr', 'iframe', 'link', 'meta', 'script', 'style'].includes(target.tagName.toLowerCase())) return
    if (target.className.includes('notyf')) return
    utils.debug(target)
    initDebounced()
  }
  window.addEventListener('DOMNodeInserted', onDomInsert)
})()
