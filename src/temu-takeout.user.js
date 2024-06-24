// ==UserScript==
// @name         Temu Takeout - Get data with you
// @downloadURL  https://github.com/Shuunen/user-scripts/raw/master/src/temu-takeout.user.js
// @namespace    https://github.com/Shuunen
// @match        https://www.temu.*/*
// @grant        none
// @version      1.0.0
// @require      https://cdn.jsdelivr.net/gh/Shuunen/user-scripts@2.6.1/src/utils.min.js
// @require      https://cdn.jsdelivr.net/gh/Shuunen/user-scripts@2.6.1/src/mb-import-utils.js
// @author       Shuunen
// @description  This script let you export data from Temu
// ==/UserScript==

(function TemuTakeout () {
  /** @type {import('./utils.js').Shuutils} */// @ts-ignore
  const utils = new Shuutils('ldl-tko', true)
  /**
   * Handles the form submission event.
   * @param {object} values - The form values.
   */
  async function onSubmit (values) {
    utils.log('Form submitted with', { values })
    await utils.copyToClipboard(values)
    utils.showSuccess('Data copied to clipboard')
  }
  /**
   * Start the takeout process.
   */
  function startTakeout () {
    /* global rawData */// @ts-expect-error rawData is not defined but exists in the page
    const data = JSON.parse(rawData.store.googleShoppingJson)
    const form = createMbForm({ id: utils.id, title: 'Temu Takeout' }, onSubmit)
    addMbField(form, 'name', data.name)
    addMbField(form, 'details', data.description)
    addMbField(form, 'reference', data.sku)
    addMbField(form, 'photo', data.image)
    addMbField(form, 'brand', data.brand.name)
    addMbField(form, 'price', Math.round(Number.parseFloat(data.offers.price.replace(',', '.'))).toString())
    addMbSubmit(form, 'Copy to clipboard')
    document.body.append(form)
  }
  /**
   * Initialize the script.
   */
  function init () {
    startTakeout()
  }
  const initDebounced = utils.debounce(init, 500) // eslint-disable-line no-magic-numbers
  initDebounced()
  utils.onPageChange(initDebounced)
})()

