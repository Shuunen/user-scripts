// ==UserScript==
// @name        Imgur Unblock
// @namespace   https://github.com/Shuunen
// @description Allow access to imgur pictures
// @author      Romain Racamier-Lafon
// @match       https://www.reddit.com/*
// @grant       none
// @version     1.1.1
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
      var arguments_ = arguments
      var later = function later () {
        timeout = undefined
        if (!immediate) {
          func.apply(context, arguments_)
        }
      }
      var callNow = immediate && !timeout
      clearTimeout(timeout)
      timeout = setTimeout(later, wait)
      if (callNow) {
        func.apply(context, arguments_)
      }
    }
  }

  findLinks () {
    var links = document.querySelectorAll('a[href^="https://i.imgur.com/"]')
    if (!links || links.length <= 0) return
    console.log('found', links.length, 'to process')
    links.forEach(link => {
      var source = PROXY_URL + link.href
      var img = document.createElement('img')
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

var instance = new ImgurUnblock()
console.log('ImgurUnblock start, here is the instance', instance)
