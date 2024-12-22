// ==UserScript==
// @author       Romain Racamier-Lafon
// @description  Easily hide products from your searches by specifying a block list
// @downloadURL  https://github.com/Shuunen/user-scripts/raw/master/src/amazon-hide-products-by-keywords.user.js
// @grant        none
// @match        https://www.amazon.fr/s*
// @name         Amazon - Hide products by keyword
// @namespace    https://github.com/Shuunen
// @require      https://cdn.jsdelivr.net/gh/Shuunen/user-scripts@latest/src/utils.js
// @require      https://cdnjs.cloudflare.com/ajax/libs/autosize.js/4.0.2/autosize.min.js
// @version      1.1.8
// ==/UserScript==

// @ts-nocheck
// eslint-disable-next-line max-statements
(function AmazonHide () {
  /* global autosize */
  const app = {
    debounceTime: 500,
    debug: false,
    excluders: [],
    filter: '',
    id: 'amz-xd',
    maxSuggestions: 7,
    minLengthSuggestion: 2,
    suggestions: {},
  }

  app.excluders = (globalThis.localStorage[`${app.id}.filter`] || 'my-keyword, other-keyword').split(',')

  const cls = {
    base: app.id,
    filter: `${app.id}-filter`,
    first: `${app.id}-first`,
    plus: `${app.id}-plus`,
    suggestion: `${app.id}-suggestion`,
    suggestions: `${app.id}-suggestions`,
    title: `${app.id}-title`,
  }

  const selectors = {
    container: ['#search > .sg-row > div:first-child > .sg-col-inner', '#leftNavContainer'].join(','),
    product: 'div[data-asin]',
    productTitle: ['a.s-access-detail-page > h2.s-access-title', '.a-size-medium.a-color-base.a-text-normal'].join(','),
  }

  /** @type {import('./utils.js').Shuutils} */// @ts-ignore
  const utils = new Shuutils(app.id)

  /**
   * Clear the suggestions list
   */
  function clearSuggestions () {
    utils.log('cleared suggestions !')
    app.suggestions = {}
    utils.findOne(`.${cls.suggestions}`).innerHTML = ''
  }

  /**
   * Show the suggestions list
   */
  function showSuggestions () {
    for (const word of Object.keys(app.suggestions)) if (app.excluders.includes(word)) // if already excluded, no need to suggest it again
      delete app.suggestions[word]
    // add .map(key => `${key} (${app.suggestions[key]})`)
    // to see ["silicone (5)", "decoration (4)", "support (4)", "cheveux (3)",
    // instead of ["silicone", "decoration", "support", "cheveux",
    let suggestions = Object.keys(app.suggestions).sort((suggestionA, suggestionB) => (app.suggestions[suggestionB] - app.suggestions[suggestionA]))
    // limit displayed suggestions
    suggestions = suggestions.splice(0, app.maxSuggestions)
    // build html
    utils.log('showing suggestions', suggestions)
    const html = suggestions.map(suggestion => `<div class="${cls.suggestion}" title="apparaît ${app.suggestions[suggestion]} fois"><span class="${cls.plus}">+</span>${suggestion}</div>`).join('')
    utils.findOne(`.${cls.suggestions}`).innerHTML = html
  }

  const showSuggestionsDebounced = utils.debounce(showSuggestions, app.debounceTime)
  /**
   * Add a title to the suggestions list
   * @param {string} title - The title to add
   */
  function addTitleToSuggestions (title) {
    const suggestions = title.split(' ').filter(word => word.length > app.minLengthSuggestion)
    for (const word of suggestions) {
      // add the word if needed & count the occurrence
      if (!app.suggestions[word]) app.suggestions[word] = 0
      app.suggestions[word] += 1
    }
    showSuggestionsDebounced()
  }
  /**
   * Check if a product should be displayed or not
   * @param {string} titleString - The title of the product
   * @param {HTMLElement} titleElement - The element containing the title
   */
  function checkProduct (titleString, titleElement) {
    let isFound = false
    let remaining = app.excluders.length
    while (!isFound && remaining) {
      isFound = titleString.includes(app.excluders[remaining - 1])
      remaining -= 1
    }
    // eslint-disable-next-line no-magic-numbers
    if (isFound) utils.log(`"${titleString.slice(0, 40)}..."`, 'should be excluded')
    else addTitleToSuggestions(titleString)
    const product = titleElement.closest(selectors.product)
    product.style.display = isFound ? 'none' : 'inline-block'
  }
  /**
   * Check the displayed products
   */
  function checkProducts () {
    utils.log('checking displayed products...')
    clearSuggestions()
    const products = utils.findAll(selectors.productTitle)
    for (const titleElement of products) {
      titleElement.textContent = utils.readableString(titleElement.textContent)
      const titleString = titleElement.textContent.toLowerCase()
      checkProduct(titleString, titleElement)
    }
  }
  /**
   * Update the excluders list
   * @param {boolean} fromFilter - Whether the update comes from the filter or not
   */
  function onExcludersUpdate (fromFilter) {
    app.excluders = app.excluders
      .map(entry => entry.trim().toLowerCase())
      .filter(entry => entry.length)
    if (app.excluders.length <= 0) return
    utils.log('new excluders :', app.excluders)
    app.filter = app.excluders.join(', ')
    globalThis.localStorage[`${app.id}.filter`] = app.filter
    if (!fromFilter) {
      const filter = utils.findOne(`.${cls.filter}`)
      filter.value = app.filter
      autosize.update(filter)
    }
    checkProducts()
  }
  /**
   * Handle a suggestion click
   * @param {MouseEvent} event - The click event
   */
  function onSuggestionClick (event) {
    const suggestion = event.target.textContent.replace(/\W/gu, '') // regex avoid caching the plus sign
    utils.log('user wants to add suggestion', suggestion)
    app.excluders.push(suggestion)
    onExcludersUpdate()
  }
  /**
   * Handle a filter change
   * @param {Event} event - The change event
   */
  function onFilterChange (event) {
    utils.log('filter changed')
    app.excluders = event.target.value.split(',')
    onExcludersUpdate(true)
  }

  const onFilterChangeDebounced = utils.debounce(onFilterChange, app.debounceTime)

  const styles = `
  <style>
  .${cls.suggestions} {
    display: flex;
    flex-direction: column;
  }
  .${cls.suggestion} {
    display: flex;
    align-items: baseline;
    margin-top: 2px;
    padding: 2px 4px;
    color: lightcoral;
    transition: background-color .3s, color .3s;
  }
  .${cls.suggestion}:hover {
    color: white;
    background-color: darkred;
    cursor: pointer;
  }
  .${cls.plus} {
    border: 1px solid lightgray;
    border-radius: 50%;
    width: 14px;
    height: 14px;
    line-height: 14px;
    text-align: center;
    margin-right: 6px;
  }
  .${cls.suggestion}:hover .${cls.plus} {
    border: 1px solid currentColor;
  }
  </style>`

  /**
   * Insert the filter in the page
   */
  // eslint-disable-next-line max-statements
  function insertFilter () {
    const container = utils.findFirst(selectors.container)
    if (!container) {
      utils.error('cannot inject filter, did not find left nav container')
      return
    }
    let html = `${styles}
    <h3 class="${cls.title} a-size-medium a-spacing-base a-spacing-top-small a-color-tertiary a-text-normal">Exclure les résultats contenant :</h3>
    <textarea class="${cls.filter}">${app.filter}</textarea>
    <div class="${cls.suggestions}"></div>`
    html += container.innerHTML
    container.innerHTML = html
    const filter = utils.findOne(`.${cls.filter}`)
    autosize(filter)
    filter.addEventListener('keyup', onFilterChangeDebounced)
    const suggestions = utils.findOne(`.${cls.suggestions}`)
    suggestions.addEventListener('click', onSuggestionClick)
  }
  /**
   * Remove previous elements
   */
  function cleanPrevious () {
    for (const node of utils.findAll(`[class^="${cls.base}"]`, document, true)) node.remove()
  }
  /**
   * Detect a new page
   */
  function onNewPage () {
    utils.log('new page detected')
    onExcludersUpdate()
  }
  /**
   * Detect a new page
   */
  function detectNewPage () {
    const firstProduct = utils.findFirst(selectors.productTitle)
    if (firstProduct.classList.contains(cls.first))
      utils.log('same page')
    else {
      firstProduct.classList.add(cls.first)
      onNewPage()
    }
  }
  /**
   * Process the page
   */
  function process () {
    detectNewPage()
  }
  /**
   * Initialize the script
   */
  function init () {
    utils.log('init !')
    cleanPrevious()
    insertFilter()
    onExcludersUpdate()
  }
  init()
  const processDebounced = utils.debounce(process, app.debounceTime)
  document.addEventListener('scroll', processDebounced)
})()
