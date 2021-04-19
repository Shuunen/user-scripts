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

(function GooglePhotosEasyDelete() {
  /* global document, Shuutils */
  const app = { id: 'gp-ed', debug: false, init: false }
  const utils = new Shuutils(app)
  const selectors = {
    trash: '[data-delete-origin] button',
    confirmBtn: 'button[autofocus]',
  }
  const deleteCurrentPhoto = async () => {
    utils.log('deleting currently displayed photo...')
    const trash = utils.findOne(selectors.trash)
    if (!trash) return utils.error('failed to find trash button')
    trash.click()
    await utils.sleep('200')
    const confirmBtn = utils.findOne(selectors.confirmBtn)
    if (!confirmBtn) return utils.error('failed to find confirm button')
    confirmBtn.click()
  }
  const onKeyPress = event => {
    if (event.key === '!') deleteCurrentPhoto()
  }
  const init = () => {
    if (app.init) return
    utils.log('init !')
    document.body.addEventListener('keypress', onKeyPress)
    app.init = true
  }
  utils.onPageChange(init)
})()
