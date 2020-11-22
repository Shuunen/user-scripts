// ==UserScript==
// @name        Imgur Unblock
// @namespace   https://github.com/Shuunen
// @description Allow access to imgur pictures
// @author      Romain Racamier-Lafon
// @match       https://www.reddit.com/*
// @grant       none
// @version     1.1.1
// ==/UserScript==

const PROXY_URL = 'https://proxy.duckduckgo.com/iu/?u='

class ImgurUnblock {
  constructor () {
    const processDebounced = this.debounce(this.process.bind(this), 500)
    document.addEventListener('scroll', processDebounced)
  }

  debounce (function_, wait, immediate) {
    let timeout
    return function debounced () {
      const context = this
      const arguments_ = arguments
      const later = function later () {
        timeout = undefined
        if (!immediate) {
          function_.apply(context, arguments_)
        }
      }
      const callNow = immediate && !timeout
      clearTimeout(timeout)
      timeout = setTimeout(later, wait)
      if (callNow) {
        function_.apply(context, arguments_)
      }
    }
  }

  findLinks () {
    const links = document.querySelectorAll('a[href^="https://i.imgur.com/"]')
    if (!links || links.length <= 0) return
    console.log('found', links.length, 'to process')
    links.forEach(link => {
      const source = PROXY_URL + link.href
      const img = document.createElement('img')
      img.src = source
      img.style = 'width: 100%'
      link.href = source
      link.parentElement.append(img)
    })
  }

  process () {
    this.findLinks()
  }
}

const instance = new ImgurUnblock()
console.log('ImgurUnblock start, here is the instance', instance)
