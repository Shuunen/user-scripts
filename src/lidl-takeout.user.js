// ==UserScript==
// @name         Lidl Takeout - Get data with you
// @author       Shuunen
// @description  This script let you export data from Lidl
// @downloadURL  https://github.com/Shuunen/user-scripts/raw/master/src/lidl-takeout.user.js
// @updateURL    https://github.com/Shuunen/user-scripts/raw/master/src/lidl-takeout.user.js
// @grant        none
// @match        https://www.lidl.fr/*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=lidl.fr
// @namespace    https://github.com/Shuunen
// @require      https://cdn.jsdelivr.net/gh/Shuunen/user-scripts/src/mb-import-utils.js
// @require      https://cdn.jsdelivr.net/gh/Shuunen/monorepo@latest/apps/user-scripts/src/utils.js
// @version      1.0.2
// ==/UserScript==

function LidlTakeout() {
  const utils = new Shuutils('ldl-tko')
  const selectors = {
    details: '.keyfacts__title',
    name: '.keyfacts__title',
    photo: '.multimediabox__slide > a[tabindex="0"] img',
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
  /**
   * Get the brand from the page
   * @returns {string} the product brand
   */
  function getBrand() {
    const image = utils.findOne('.features__link > img')
    if (image === undefined) {
      utils.showError('failed to get brand image from page')
      return ''
    }
    if (!(image instanceof HTMLImageElement)) {
      utils.showError('brand image is not an image element')
      return ''
    }
    return utils.capitalize(utils.readableString(image.alt ?? '').toLowerCase())
  }
  /**
   * Get the product reference from the URL
   * @returns {string} the product reference
   */
  function getReference() {
    const reference = document.location.pathname.split('/').toReversed()[0] ?? ''
    if (reference === '') {
      utils.showError('failed to get reference from URL')
      return ''
    }
    return reference
  }
  /**
   * Get the price from the page
   * @returns {string} the product price
   */
  function getPrice() {
    const price = textFromSelector('.m-price__price')
    if (price === '') {
      utils.showError('failed to get price from page')
      return ''
    }
    return Math.round(Number.parseFloat(price.replace(',', '.'))).toString()
  }
  /**
   * Start the takeout process
   */
  function startTakeout() {
    const form = createMbForm({ id: utils.id, title: 'Lidl Takeout' }, onSubmit)
    for (const [key, selector] of Object.entries(selectors)) addMbField(form, key, textFromSelector(selector))
    addMbField(form, 'reference', getReference())
    addMbField(form, 'brand', getBrand())
    addMbField(form, 'price', getPrice())
    addMbSubmit(form, 'Copy to clipboard')
    document.body.append(form)
  }
  /**
   * Initialize the script
   */
  async function init() {
    const name = await utils.waitToDetect(selectors.name)
    if (name === undefined) {
      utils.log('no product name found on this page')
      return
    }
    startTakeout()
  }
  const initDebouncedTime = 500
  const initDebounced = utils.debounce(init, initDebouncedTime)
  initDebounced()
  utils.onPageChange(initDebounced)
}

if (globalThis.window) LidlTakeout()
