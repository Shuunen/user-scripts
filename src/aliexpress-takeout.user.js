// ==UserScript==
// @name         AliExpress Takeout - Get data with you
// @namespace    https://github.com/Shuunen
// @match        https://www.aliexpress.*/*
// @grant        none
// @version      1.0.0
// @require      https://cdn.jsdelivr.net/gh/Shuunen/user-scripts@2.6.0/src/utils.min.js
// @require      https://cdn.jsdelivr.net/gh/Shuunen/user-scripts@2.6.0/src/mb-import-utils.js
// @author       Shuunen
// @description  This script let you export data from AliExpress
// ==/UserScript==

(function AliExpressTakeout () {
  /** @type {import('./utils.js').Shuutils} */// @ts-ignore
  const utils = new Shuutils('alx-tko', true)
  const selectors = {
    details: '[data-pl="product-title"]',
    name: '[data-pl="product-title"]',
    photo: '[class^="image-view--previewBox"] img',
  }
  /**
   * Handles the form submission event.
   * @param {typeof selectors} values - The form values.
   */
  async function onSubmit (values) {
    utils.log('Form submitted with', { values })
    await utils.copyToClipboard(values)
    utils.showSuccess('Data copied to clipboard')
  }
  function getPrice () {
    const price = textFromSelector('.product-price-value')
    if (price === '') { utils.showError('failed to get price from page'); return '' }
    return Math.round(Number.parseFloat(price.replace(',', '.'))).toString()
  }
  function getReference () {
    // eslint-disable-next-line typescript-compat/compat
    const path = document.location.pathname.split('/').toReversed()[0] ?? ''
    if (path === '') { utils.showError('failed to get path from URL'); return '' }
    const reference = path.split('.')[0] ?? ''
    if (reference === '') { utils.showError('failed to get reference from path'); return '' }
    return reference
  }
  function startTakeout () {
    const form = createMbForm({ id: utils.id, title: 'AliExpress Takeout' }, onSubmit)
    Object.entries(selectors).forEach(([key, selector]) => { addMbField(form, key, textFromSelector(selector)) })
    addMbField(form, 'brand', 'AliExpress')
    addMbField(form, 'reference', getReference())
    addMbField(form, 'price', getPrice())
    addMbSubmit(form, 'Copy to clipboard')
    document.body.append(form)
  }
  /** @param {MouseEvent} event */
  async function init (event) {
    /** @type {HTMLElement | null} */// @ts-ignore
    const target = event.target
    if (target === null) return
    if ('className' in target && !target.className.includes('sku-item--selected')) { utils.log('waiting for the product image thumbnail click'); return }
    const photo = await utils.waitToDetect(selectors.photo)
    if (photo === undefined) { utils.showError('failed to find product photo on this page'); return }
    startTakeout()
  }
  const initDebounced = utils.debounce(init, 500) // eslint-disable-line no-magic-numbers
  // void utils.onPageChange(initDebounced)
  // @ts-ignore
  window.addEventListener('click', initDebounced)
})()

