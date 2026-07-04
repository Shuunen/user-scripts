// ==UserScript==
// @name         AliExpress Takeout - Get data with you
// @author       Shuunen
// @description  This script let you export data from AliExpress
// @downloadURL  https://github.com/Shuunen/user-scripts/raw/master/src/ali-express-takeout.user.js
// @updateURL    https://github.com/Shuunen/user-scripts/raw/master/src/ali-express-takeout.user.js
// @grant        none
// @match        https://www.aliexpress.com/*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=aliexpress.com
// @namespace    https://github.com/Shuunen
// @require      https://cdn.jsdelivr.net/gh/Shuunen/user-scripts/src/mb-import-utils.js
// @require      https://cdn.jsdelivr.net/gh/Shuunen/monorepo@latest/apps/user-scripts/src/utils.js
// @version      1.0.4
// ==/UserScript==

function AliExpressTakeout() {
  const utils = new Shuutils('alx-tko')
  const selectors = {
    details: '[data-pl="product-title"]',
    name: '[data-pl="product-title"]',
    photo: '[class^="image-view"] > div > img',
  }
  /**
   * Handles the form submission event.
   * @param {object} values - The form values.
   */
  async function onSubmit(values) {
    utils.log('Form submitted with', { values })
    await utils.copyToClipboard(values)
    utils.showSuccess('Data copied to clipboard')
  }
  function getPrice() {
    const price = textFromSelector('.product-price-value')
    if (price === '') {
      utils.showError('failed to get price from page')
      return ''
    }
    return Math.round(Number(price.replace(',', '.'))).toString()
  }
  function getReference() {
    const path = document.location.pathname.split('/').toReversed()[0] ?? ''
    if (path === '') {
      utils.showError('failed to get path from URL')
      return ''
    }
    const reference = path.split('.')[0] ?? ''
    if (reference === '') {
      utils.showError('failed to get reference from path')
      return ''
    }
    return reference
  }
  function startTakeout() {
    const form = createMbForm({ id: utils.id, title: 'AliExpress Takeout' }, onSubmit)
    for (const [key, selector] of Object.entries(selectors)) addMbField(form, key, textFromSelector(selector))
    addMbField(form, 'brand', 'AliExpress')
    addMbField(form, 'reference', getReference())
    addMbField(form, 'price', getPrice())
    addMbSubmit(form, 'Copy to clipboard')
    document.body.append(form)
  }
  /** @param {MouseEvent} event the click event */
  async function init(event) {
    utils.debug('init')
    const { target } = event
    if (!(target instanceof HTMLElement)) {
      utils.showError('target is not an HTMLElement')
      return
    }
    if (!target.className.includes('image')) return
    const photo = await utils.waitToDetect(selectors.photo)
    if (photo === undefined) {
      utils.showError('failed to find product photo on this page')
      return
    }
    startTakeout()
  }
  const initDebounced = utils.debounce(init, 500)
  globalThis.addEventListener('click', () => initDebounced())
}

if (globalThis.window) AliExpressTakeout()
