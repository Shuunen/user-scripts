// ==UserScript==
// @name         Temu Takeout - Get data with you
// @downloadURL  https://github.com/Shuunen/user-scripts/raw/master/src/temu-takeout.user.js
// @namespace    https://github.com/Shuunen
// @match        https://www.temu.*/*
// @grant        none
// @version      1.1.0
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
   * Get the data from the page.
   * @returns {Record<'brand' | 'details' | 'name' | 'photo' | 'price' | 'reference', string>} The data.
   */
  function getData () {
    /* global rawData */// @ts-expect-error rawData is not defined but exists in the page
    const { store } = rawData
    if (store === undefined) throw new Error('No rawData.store in window')
    if (store.googleShoppingJson !== undefined) {
      const data = JSON.parse(store.googleShoppingJson)
      return {
        brand: data.brand.name,
        details: data.description,
        name: data.name,
        photo: data.image,
        price: data.offers.price,
        reference: data.sku,
      }
    }
    if (store.seoPageAltInfo === undefined) throw new Error('No rawData.store.seoPageAltInfo in window')
    if (store.goods === undefined) throw new Error('No rawData.store.goods in window')
    return {
      brand: 'Temu',
      details: store.seoPageAltInfo.pageAlt,
      name: store.seoPageAltInfo.pageAlt,
      photo: store.goods.hdThumbUrl,
      price: String(store.goods.minOnSalePrice / 100), // eslint-disable-line no-magic-numbers
      reference: store.goods.itemId,
    }
  }
  /**
   * Start the takeout process.
   */
  // eslint-disable-next-line max-statements
  function startTakeout () {
    const data = getData()
    utils.log('found data', data)
    const form = createMbForm({ id: utils.id, title: 'Temu Takeout' }, onSubmit)
    addMbField(form, 'name', data.name)
    addMbField(form, 'details', data.details)
    addMbField(form, 'reference', data.reference)
    addMbField(form, 'photo', data.photo)
    addMbField(form, 'brand', data.brand)
    addMbField(form, 'price', Math.round(Number.parseFloat(data.price.replace(',', '.'))).toString())
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

