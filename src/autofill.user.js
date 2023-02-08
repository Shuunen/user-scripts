// ==UserScript==
// @name         Autofill
// @namespace    https://github.com/Shuunen
// @version      1.0.3
// @description  Simply fill your login everywhere
// @require      https://raw.githubusercontent.com/Shuunen/user-scripts/master/src/utils.js
// @author       Romain Racamier-Lafon
// ==/UserScript==

(function AutofillLogin () {
  /* global Shuutils */
  const utils = new Shuutils({ id: 'auto-fill', debug: false })
  const selectors = {
    input: 'input[id*="mail"], input[name*="mail"], input[name*="ogin"], input[type*="mail"], input[name*="user"], input[name*="ident"]',
  }
  /**
   * Trigger a change event on an input element
   * @param {HTMLInputElement} element
   */
  function triggerChange (element) {
    element.dispatchEvent(new KeyboardEvent('change'))
    element.dispatchEvent(new Event('input', { bubbles: true, cancelable: true }))
  }
  function fill (email = 'romain.racamier@gmail.com') {
    utils.log('autofill start')
    utils.findAll(selectors.input).forEach(input => {
      if (input.type === 'password' || input.value.length > 0) return
      // eslint-disable-next-line no-param-reassign
      input.value = email
      triggerChange(input)
      utils.log('filled', input)
    })
  }
  function init () {
    setTimeout(fill, 1000) // eslint-disable-line no-magic-numbers
    setTimeout(fill, 3000) // eslint-disable-line no-magic-numbers
  }
  if (document.location.hostname === 'localhost') return
  utils.onPageChange(init)
})()
