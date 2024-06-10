// ==UserScript==
// @name         Lidl Takeout - Get data with you
// @namespace    https://github.com/Shuunen
// @match        https://www.lidl.*/*
// @grant        none
// @version      1.0.0
// @require      https://cdn.jsdelivr.net/gh/Shuunen/user-scripts@2.6.0/src/utils.min.js
// @require      https://cdn.jsdelivr.net/gh/Shuunen/user-scripts@2.6.0/src/mb-import-utils.js
// @author       Shuunen
// @description  This script let you export data from Lidl
// ==/UserScript==

// eslint-disable-next-line max-statements
(function LidlTakeout () {
  /** @type {import('./utils.js').Shuutils} */// @ts-ignore
  const utils = new Shuutils('ldl-tko', true)
  const selectors = {
    details: '.keyfacts__title',
    name: '.keyfacts__title',
    photo: '.multimediabox__slide > a[tabindex="0"] img',
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
  function getBrand () {
    /** @type {HTMLImageElement | undefined} */// @ts-ignore
    const image = utils.findOne('.features__link > img')
    if (image === undefined) { utils.showError('failed to get brand image from page'); return '' }
    return utils.capitalize(utils.readableString(image.alt ?? '').toLowerCase())
  }
  function getReference () {
    // eslint-disable-next-line typescript-compat/compat
    const reference = document.location.pathname.split('/').toReversed()[0] ?? ''
    if (reference === '') { utils.showError('failed to get reference from URL'); return '' }
    return reference
  }
  function getPrice () {
    const price = textFromSelector('.m-price__price')
    if (price === '') { utils.showError('failed to get price from page'); return '' }
    return Math.round(Number.parseFloat(price.replace(',', '.'))).toString()
  }
  function startTakeout () {
    const form = createMbForm({ id: utils.id, title: 'Lidl Takeout' }, onSubmit)
    Object.entries(selectors).forEach(([key, selector]) => { addMbField(form, key, textFromSelector(selector)) })
    addMbField(form, 'reference', getReference())
    addMbField(form, 'brand', getBrand())
    addMbField(form, 'price', getPrice())
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

