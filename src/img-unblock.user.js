// ==UserScript==
// @author       Romain Racamier-Lafon
// @description  Use DuckDuckGo image proxy
// @downloadURL  https://github.com/Shuunen/user-scripts/raw/master/src/img-unblock.user.js
// @grant        none
// @match        https://www.reddit.com/*
// @name         Image Unblock
// @namespace    https://github.com/Shuunen
// @require      https://cdn.jsdelivr.net/gh/Shuunen/user-scripts/src/utils.js
// @version      1.1.5
// ==/UserScript==

/* eslint-disable jsdoc/require-jsdoc */

(function ImageUnblock () {
  const proxyUrl = 'https://proxy.duckduckgo.com/iu/?u='
  /** @type {import('./utils.js').Shuutils} */// @ts-ignore
  const utils = new Shuutils('img-unblock')
  const selectors = {
    images: 'a[href^="https://i.imgur.com/"]:not(.img-unblock)',
  }
  // eslint-disable-next-line max-statements
  function process () {
    /** @type {HTMLAnchorElement[]} */ // @ts-ignore
    const images = utils.findAll(selectors.images)
    for (const element of images) {
      element.classList.add('img-unblock')
      if (!element.href.includes('.jpg') && !element.href.includes('.png')) continue
      utils.log('processing', element)
      const source = proxyUrl + element.href
      const img = document.createElement('img')
      img.src = source
      img.style.width = '100%'
      element.href = source
      if (!element.parentElement) continue
      element.parentElement.append(img)
      element.parentElement.style.display = 'flex'
      element.parentElement.style.flexDirection = 'column'
    }
  }
  // eslint-disable-next-line no-magic-numbers
  const processDebounced = utils.debounce(process, 500)
  utils.log('set scroll listener')
  document.addEventListener('scroll', () => processDebounced())
  utils.onPageChange(processDebounced)
})()
