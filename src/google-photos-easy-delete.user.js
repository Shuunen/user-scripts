// ==UserScript==
// @name         Google Photos - Easy Delete
// @namespace    https://github.com/Shuunen
// @version      1.0.4
// @description  Delete a photo by pressing ! (bang)
// @author       Romain Racamier-Lafon
// @match        https://photos.google.com/*
// @require      https://raw.githubusercontent.com/Shuunen/user-scripts/master/src/utils.js
// @grant        none
// ==/UserScript==

(function GooglePhotosEasyDelete () {
  /* global Shuutils */
  const app = { id: 'gp-ed', debug: false, init: false }
  // @ts-ignore
  const utils = new Shuutils(app)
  const selectors = {
    trash: '[data-delete-origin] button',
    confirmBtn: 'button[autofocus]',
  }
  // eslint-disable-next-line max-statements
  async function deleteCurrentPhoto () {
    utils.log('deleting currently displayed photo...')
    const trash = utils.findOne(selectors.trash)
    if (!trash) { utils.error('failed to find trash button'); return }
    trash.click()
    await utils.sleep('200')
    const confirmButton = utils.findOne(selectors.confirmBtn)
    if (!confirmButton) { utils.error('failed to find confirm button'); return }
    confirmButton.click()
  }
  /**
   * Handle keypress events
   * @param {KeyboardEvent} event the keypress event
   * @returns {void}
   */
  function onKeyPress (event) {
    if (event.key === '!') deleteCurrentPhoto()
  }
  function init () {
    if (app.init) return
    utils.log('init !')
    document.body.addEventListener('keypress', onKeyPress)
    app.init = true
  }
  utils.onPageChange(init)
})()
