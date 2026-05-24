// ==UserScript==
// @name         ImgUnblock
// @author       Romain Racamier-Lafon
// @description  Use DuckDuckGo image proxy
// @downloadURL  https://github.com/Shuunen/user-scripts/raw/master/src/img-unblock.user.js
// @updateURL    https://github.com/Shuunen/user-scripts/raw/master/src/img-unblock.user.js
// @grant        none
// @match        https://www.reddit.com/*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=reddit.com
// @namespace    https://github.com/Shuunen
// @require      https://cdn.jsdelivr.net/gh/Shuunen/monorepo@latest/apps/user-scripts/src/utils.js
// @version      1.1.5
// ==/UserScript==

function ImgUnblock() {
  const proxyUrl = 'https://proxy.duckduckgo.com/iu/?u='
  const utils = new Shuutils('img-unblock')
  const selectors = {
    images: 'a[href^="https://i.imgur.com/"]:not(.img-unblock)',
  }
  function start() {
    const images = utils.findAll(selectors.images)
    for (const element of images) {
      if (!(element instanceof HTMLAnchorElement)) {
        utils.error('element is not an anchor', element)
        continue
      }
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
  const startDebounceTime = 500
  const startDebounced = utils.debounce(start, startDebounceTime)
  utils.log('set scroll listener')
  document.addEventListener('scroll', () => startDebounced())
  utils.onPageChange(startDebounced)
}

if (globalThis.window) ImgUnblock()
