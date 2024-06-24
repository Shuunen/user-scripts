// ==UserScript==
// @name         Autofill
// @downloadURL  https://github.com/Shuunen/user-scripts/raw/master/src/autofill.user.js
// @namespace    https://github.com/Shuunen
// @version      1.0.3
// @description  Simply fill your login everywhere
// @require      https://cdn.jsdelivr.net/gh/Shuunen/user-scripts@2.6.1/src/utils.min.js
// @author       Romain Racamier-Lafon
// ==/UserScript==

(function AutofillLogin () {
  /** @type {import('./utils.js').Shuutils} */// @ts-ignore
  const utils = new Shuutils('auto-fill')
  const selectors = {
    input: 'input[id*="mail"], input[name*="mail"], input[name*="ogin"], input[type*="mail"], input[name*="user"], input[name*="ident"]',
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
   * Fill the login input with the email
   * @param {string} email the email to fill
   */
  function fill (email = 'romain.racamier@gmail.com') {
    utils.log('autofill start')
    // @ts-ignore
    for (const input of utils.findAll(selectors.input)) {
      // @ts-ignore
      if (input.type === 'password' || input.value.length > 0) continue
      // @ts-ignore
      input.value = email
      // @ts-ignore
      triggerChange(input)
      utils.log('filled', input)
    }
  }
  /**
   * Init the autofill
   */
  function init () {
    setTimeout(fill, 1000) // eslint-disable-line no-magic-numbers
    setTimeout(fill, 3000) // eslint-disable-line no-magic-numbers
  }
  if (document.location.hostname === 'localhost') return
  utils.onPageChange(init)
})()
