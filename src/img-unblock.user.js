// ==UserScript==
// @name         Image Unblock
// @namespace    https://github.com/Shuunen
// @description  Use DuckDuckGo image proxy
// @author       Romain Racamier-Lafon
// @match        https://www.reddit.com/*
// @grant        none
// @require      https://cdn.jsdelivr.net/gh/Shuunen/user-scripts@master/src/utils.js
// @version      1.1.3
// ==/UserScript==

/* eslint-disable no-param-reassign */

(function ImageUnblock () {
  /* global Shuutils */
  const proxyUrl = 'https://proxy.duckduckgo.com/iu/?u='
  /** @type {import('./utils.js').Shuutils} */
  // @ts-ignore
  const utils = new Shuutils({ debug: true, id: 'img-unblock' }) // eslint-disable-line @typescript-eslint/naming-convention
  const selectors = {
    images: 'a[href^="https://i.imgur.com/"]:not(.img-unblock)',
  }
  function process () {
    // @ts-ignore
    // eslint-disable-next-line max-statements
    return utils.findAll(selectors.images).forEach((/** @type HTMLAnchorElement */ element) => {
      element.classList.add('img-unblock')
      if (!element.href.includes('.jpg') && !element.href.includes('.png')) return
      utils.log('processing', element)
      const source = proxyUrl + element.href
      const img = document.createElement('img')
      img.src = source
      img.style.width = '100%'
      element.href = source
      if (!element.parentElement) return
      element.parentElement.append(img)
      element.parentElement.style.display = 'flex'
      element.parentElement.style.flexDirection = 'column'
    })
  }
  // eslint-disable-next-line no-magic-numbers
  const processDebounced = utils.debounce(process, 500)
  utils.log('set scroll listener')
  document.addEventListener('scroll', () => processDebounced())
  void utils.onPageChange(processDebounced)
})()
