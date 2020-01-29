// ==UserScript==
// @name        Imgur Unblock
// @namespace   https://github.com/Shuunen
// @description Allow access to imgur pictures
// @author      Romain Racamier-Lafon
// @match       https://www.reddit.com/*
// @grant       none
// @version     1.1
// ==/UserScript==

var PROXY_URL = 'https://proxy.duckduckgo.com/iu/?u='

class ImgurUnblock {
  constructor () {
    var processDebounced = this.debounce(this.process.bind(this), 500)
    document.addEventListener('scroll', processDebounced)
  }

  debounce (func, wait, immediate) {
    var timeout
    return function debounced () {
      var context = this
      var args = arguments
      var later = function later () {
        timeout = null
        if (!immediate) {
          func.apply(context, args)
        }
      }
      var callNow = immediate && !timeout
      clearTimeout(timeout)
      timeout = setTimeout(later, wait)
      if (callNow) {
        func.apply(context, args)
      }
    }
  }

  findLinks () {
    var links = document.querySelectorAll('a[href^="https://i.imgur.com/"]')
    if (!links || !links.length) return
    console.log('found', links.length, 'to process')
    links.forEach(link => {
      var src = PROXY_URL + link.href
      var img = document.createElement('img')
      img.src = src
      img.style = 'width: 100%'
      link.href = src
      link.parentElement.appendChild(img)
    })
  }

  process () {
    this.findLinks()
  }
}

var instance = new ImgurUnblock()
console.log('ImgurUnblock start, here is the instance', instance)
