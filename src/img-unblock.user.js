// ==UserScript==
// @name        Image Unblock
// @namespace   https://github.com/Shuunen
// @description Use DuckDuckGo image proxy
// @author      Romain Racamier-Lafon
// @match       https://www.reddit.com/*
// @grant       none
// @require     https://raw.githubusercontent.com/Shuunen/user-scripts/master/src/utils.js
// @version     1.1.3
// ==/UserScript==

(function ImageUnblock () {
  /* global Shuutils */
  const PROXY_URL = 'https://proxy.duckduckgo.com/iu/?u='
  const utils = new Shuutils({ id: 'img-unblock', debug: true })
  const selectors = {
    images: 'a[href^="https://i.imgur.com/"]:not(.img-unblock)',
  }
  const process = () => utils.findAll(selectors.images).forEach(element => {
    element.classList.add('img-unblock')
    if (!element.href.includes('.jpg') && !element.href.includes('.png')) return
    utils.log('processing', element)
    const source = PROXY_URL + element.href
    const img = document.createElement('img')
    img.src = source
    img.style = 'width: 100%'
    element.href = source
    element.parentElement.append(img)
    element.parentElement.style = 'display: flex; flex-direction: column;'
  })
  const processDebounced = utils.debounce(process, 500)
  utils.log('set scroll listener')
  document.addEventListener('scroll', processDebounced)
  utils.onPageChange(processDebounced)
})()
