// ==UserScript==
// @name         AliExpress Takeout - Get data with you
// @downloadURL  https://github.com/Shuunen/user-scripts/raw/master/src/aliexpress-takeout.user.js
// @namespace    https://github.com/Shuunen
// @match        https://www.aliexpress.*/*
// @grant        none
// @version      1.0.0
// @require      https://cdn.jsdelivr.net/gh/Shuunen/user-scripts@2.6.1/src/utils.min.js
// @require      https://cdn.jsdelivr.net/gh/Shuunen/user-scripts@2.6.1/src/mb-import-utils.js
// @author       Shuunen
// @description  This script let you export data from AliExpress
// ==/UserScript==

/* eslint-disable jsdoc/require-jsdoc */
/* eslint-disable no-magic-numbers */

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
   * @param {object} values - The form values.
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
    const path = document.location.pathname.split('/').toReversed()[0] ?? ''
    if (path === '') { utils.showError('failed to get path from URL'); return '' }
    const reference = path.split('.')[0] ?? ''
    if (reference === '') { utils.showError('failed to get reference from path'); return '' }
    return reference
  }
  function startTakeout () {
    const form = createMbForm({ id: utils.id, title: 'AliExpress Takeout' }, onSubmit)
    for (const [key, selector] of Object.entries(selectors)) addMbField(form, key, textFromSelector(selector))
    addMbField(form, 'brand', 'AliExpress')
    addMbField(form, 'reference', getReference())
    addMbField(form, 'price', getPrice())
    addMbSubmit(form, 'Copy to clipboard')
    document.body.append(form)
  }
  /** @param {MouseEvent} event the click event */
  async function init (event) {
    /** @type {HTMLElement | null} */// @ts-ignore
    const { target } = event
    if (target === null) return
    if ('className' in target && !target.className.includes('sku-item--selected')) { utils.log('waiting for the product image thumbnail click'); return }
    const photo = await utils.waitToDetect(selectors.photo)
    if (photo === undefined) { utils.showError('failed to find product photo on this page'); return }
    startTakeout()
  }
  const initDebounced = utils.debounce(init, 500) // @ts-ignore
  window.addEventListener('click', initDebounced)
})()

