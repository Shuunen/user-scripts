// ==UserScript==
// @name         Autofill
// @namespace    https://github.com/Shuunen
// @version      1.0.3
// @description  Simply fill your login everywhere
// @require      https://raw.githubusercontent.com/Shuunen/user-scripts/master/src/utils.js
// @author       Romain Racamier-Lafon
// ==/UserScript==

(function AutofillLogin() {
  /* global document, KeyboardEvent, Event, Shuutils */
  const utils = new Shuutils({ id: 'auto-fill', debug: true })
  const selectors = {
    input: 'input[id*="mail"], input[name*="mail"], input[name*="ogin"], input[type*="mail"], input[name*="user"], input[name*="ident"]'
  }
  const triggerChange = element => {
    element.dispatchEvent(new KeyboardEvent('change'))
    element.dispatchEvent(new Event('input', { bubbles: true, cancelable: true }))
  }
  const fill = (email = 'romain.racamier@gmail.com') => {
    utils.log('autofill start')
    utils.findAll(selectors.input).forEach(input => {
      if (input.type === 'password' || input.value.length > 0) return
      input.value = email
      triggerChange(input)
      utils.log('filled', input)
    })
  }
  const init = () => {
    setTimeout(fill, 1000)
    setTimeout(fill, 3000)
  }
  if (document.location.hostname === 'localhost') return
  utils.onPageChange(init)
})()
