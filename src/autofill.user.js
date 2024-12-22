// ==UserScript==
// @author       Romain Racamier-Lafon
// @description  Simply fill your login everywhere
// @downloadURL  https://github.com/Shuunen/user-scripts/raw/master/src/autofill.user.js
// @name         Autofill
// @namespace    https://github.com/Shuunen
// @require      https://cdn.jsdelivr.net/gh/Shuunen/user-scripts/src/utils.js
// @version      1.0.5
// ==/UserScript==

// eslint-disable-next-line max-statements
(function AutofillLogin () {
  /** @type {import('./utils.js').Shuutils} */// @ts-ignore
  const utils = new Shuutils('auto-fill')
  const data = {
    email: atob('cm9tYWluLnJhY2FtaWVyQGdtYWlsLmNvbQ=='),
    phone: atob('NjU4NDc2Nzg4'),
  }
  const selectors = {
    login: 'input[id*="mail"], input[name*="mail"], input[name*="ogin"], input[type*="mail"], input[name*="user"], input[name*="ident"]',
    phone: 'input[type*="phone"], input[name*="phone"], input[name*="mobile"], input[name*="tel"], input[inputmode="tel"]',
    phoneCountry: '[id="areaCode-+33"]',
  }
  /**
   * Trigger a change event on an input element
   * @param {HTMLInputElement} element the input element
   * @returns {void}
   */
  function triggerChange (element) {
    element.dispatchEvent(new KeyboardEvent('change'))
    element.dispatchEvent(new Event('input', { bubbles: true, cancelable: true }))
  }
  /**
   * Get the inputs matching the selector
   * @param {string} selector the selector to match
   * @returns {HTMLInputElement[]} the inputs if any
   */
  function getInputs (selector) { // @ts-ignore
    return utils.findAll(selector, document, true)
  }
  /**
   * Fill the login input with the email
   */
  function fillLogin () {
    for (const input of getInputs(selectors.login)) {
      if (input.type === 'password' || input.value.length > 0) continue
      input.value = data.email
      triggerChange(input)
      utils.log('filled login', input)
    }
  }
  /**
   * Fill the phone input with the phone number
   */
  function fillPhone () {
    // select the right country before filling the phone
    const country = utils.findOne(selectors.phoneCountry, document, true)
    if (country === undefined) { utils.debug('no country selector found'); return }
    country.click()
    for (const input of getInputs(selectors.phone)) {
      if (input.value.length > 0) continue
      input.value = data.phone
      triggerChange(input)
      utils.log('filled phone', input)
    }
  }
  /**
   * Init the autofill
   */
  function init () {
    utils.log('autofill start...')
    fillLogin()
    fillPhone()
  }
  const initDebounced = utils.debounce(init, 1000) // eslint-disable-line no-magic-numbers
  if (document.location.hostname === 'localhost') return
  utils.onPageChange(() => initDebounced())
})()
