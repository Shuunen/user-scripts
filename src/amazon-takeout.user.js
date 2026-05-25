// ==UserScript==
// @name         Amazon Takeout - Get data with you
// @author       Shuunen
// @description  This script let you export data from Amazon
// @downloadURL  https://github.com/Shuunen/user-scripts/raw/master/src/amazon-takeout.user.js
// @updateURL    https://github.com/Shuunen/user-scripts/raw/master/src/amazon-takeout.user.js
// @grant        none
// @match        https://www.amazon.fr/*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=amazon.fr
// @namespace    https://github.com/Shuunen
// @require      https://cdn.jsdelivr.net/gh/Shuunen/user-scripts/src/mb-import-utils.js
// @require      https://cdn.jsdelivr.net/gh/Shuunen/monorepo@latest/apps/user-scripts/src/utils.js
// @version      1.0.3
// ==/UserScript==

function AmazonTakeout() {
  const utils = new Shuutils('amz-tko')
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
   * @param {object} values - The form values.
   */
  async function onSubmit(values) {
    utils.log('Form submitted with', { values })
    await utils.copyToClipboard(values)
    utils.showSuccess('Data copied to clipboard')
  }
  function startTakeout() {
    const form = createMbForm({ id: utils.id, title: 'Amazon Takeout' }, onSubmit)
    for (const [key, selector] of Object.entries(selectors)) addMbField(form, key, textFromSelector(selector))
    addMbSubmit(form, 'Copy to clipboard')
    document.body.append(form)
  }
  async function init() {
    const name = await utils.waitToDetect(selectors.name)
    if (name === undefined) {
      utils.log('no product name found on this page')
      return
    }
    startTakeout()
  }
  const initDebounced = utils.debounce(init, 500)
  initDebounced()
  utils.onPageChange(initDebounced)
}

if (globalThis.window) AmazonTakeout()
