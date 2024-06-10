// ==UserScript==
// @name         Amazon Takeout - Get data with you
// @downloadURL  https://github.com/Shuunen/user-scripts/raw/master/src/amazon-takeout.user.js
// @namespace    https://github.com/Shuunen
// @match        https://www.amazon.*/*
// @grant        none
// @version      1.0.0
// @require      https://cdn.jsdelivr.net/gh/Shuunen/user-scripts@2.6.1/src/utils.min.js
// @require      https://cdn.jsdelivr.net/gh/Shuunen/user-scripts@2.6.1/src/mb-import-utils.js
// @author       Shuunen
// @description  This script let you export data from Amazon
// ==/UserScript==

(function AmazonTakeout () {
  /** @type {import('./utils.js').Shuutils} */// @ts-ignore
  const utils = new Shuutils('amz-tko', true)
  const selectors = {
    brand: '.po-brand .po-break-word',
    details: '#productTitle',
    name: '#productTitle',
    photo: '#imgTagWrapperId img',
    price: '.a-price-whole',
    reference: '#ASIN',
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
  function startTakeout () {
    const form = createMbForm({ id: utils.id, title: 'Amazon Takeout' }, onSubmit)
    Object.entries(selectors).forEach(([key, selector]) => { addMbField(form, key, textFromSelector(selector)) })
    addMbSubmit(form, 'Copy to clipboard')
    document.body.append(form)
  }
  async function init () {
    const name = await utils.waitToDetect(selectors.name)
    if (name === undefined) { utils.log('no product name found on this page'); return }
    startTakeout()
  }
  const initDebounced = utils.debounce(init, 500) // eslint-disable-line no-magic-numbers
  initDebounced()
  void utils.onPageChange(initDebounced)
})()

