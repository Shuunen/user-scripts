// ==UserScript==
// @name         Autofill
// @namespace    https://github.com/Shuunen
// @version      1.0.2
// @description  Simply fill your login everywhere
// @author       Romain Racamier-Lafon
// ==/UserScript==

(function () {
  /* global KeyboardEvent, Event */
  const triggerChange = (element) => {
    element.dispatchEvent(new KeyboardEvent('change'))
    element.dispatchEvent(new Event('input', { bubbles: true, cancelable: true }))
  }
  const fill = (email = 'romain.racamier@gmail.com') => {
    console.log('autofill start')
    const inputs = document.querySelectorAll('input[id*="mail"], input[name*="mail"], input[name*="ogin"], input[type*="mail"], input[name*="user"], input[name*="ident"]')
    inputs.forEach(input => {
      if (input.type === 'password') return
      if (input.value.length === 0) {
        input.value = email
        triggerChange(input)
        console.log('filled', input)
      }
    })
  }
  if (document.location.hostname !== 'localhost') {
    window.addEventListener('load', () => {
      setTimeout(fill, 1000)
      setTimeout(fill, 3000)
    })
  }
})()
