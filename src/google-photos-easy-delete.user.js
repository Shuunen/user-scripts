// ==UserScript==
// @name         Google Photos - Easy Delete
// @author       Romain Racamier-Lafon
// @description  Delete a photo by pressing ! (bang)
// @downloadURL  https://github.com/Shuunen/user-scripts/raw/master/src/google-photos-easy-delete.user.js
// @updateURL    https://github.com/Shuunen/user-scripts/raw/master/src/google-photos-easy-delete.user.js
// @grant        none
// @match        https://photos.google.com/*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=photos.google.com
// @namespace    https://github.com/Shuunen
// @require      https://cdn.jsdelivr.net/gh/Shuunen/monorepo@latest/apps/user-scripts/src/utils.js
// @version      1.0.6
// ==/UserScript==

function GooglePhotosEasyDelete() {
  const app = { init: false, timeToWait: 200 }
  const utils = new Shuutils('gp-ed')
  const selectors = {
    confirmBtn: 'button[autofocus]',
    trash: '[data-delete-origin] button',
  }
  async function deleteCurrentPhoto() {
    utils.log('deleting currently displayed photo...')
    const trash = utils.findOne(selectors.trash)
    if (!trash) {
      utils.error('failed to find trash button')
      return
    }
    trash.click()
    await utils.sleep(app.timeToWait)
    const confirmButton = utils.findOne(selectors.confirmBtn)
    if (!confirmButton) {
      utils.error('failed to find confirm button')
      return
    }
    confirmButton.click()
  }
  /**
   * Handle keypress events
   * @param {KeyboardEvent} event the keypress event
   * @returns {void}
   */
  function onKeyPress(event) {
    if (event.key === '!') void deleteCurrentPhoto()
  }
  function init() {
    if (app.init) return
    utils.log('init !')
    document.body.addEventListener('keypress', onKeyPress)
    app.init = true
  }
  utils.onPageChange(init)
}

if (globalThis.window) GooglePhotosEasyDelete()
