// ==UserScript==
// @name         Amazon - All in one
// @namespace    https://github.com/Shuunen
// @version      1.0.0
// @description  Un-clutter & add features to Amazon
// @author       Romain Racamier-Lafon
// @match        https://www.amazon.fr/*
// @require      https://cdn.jsdelivr.net/npm/autosize@4.0.2/dist/autosize.min.js
// @grant        none
// ==/UserScript==

class Shuutils {
  log (...stuff) {
    if (!this.debug) {
      return
    }
    stuff.unshift(this.id + ' :')
    console.log.apply(console, stuff)
  }

  warn (...stuff) {
    stuff.unshift(this.id + ' :')
    console.warn.apply(console, stuff)
  }

  error (...stuff) {
    stuff.unshift(this.id + ' :')
    console.error.apply(console, stuff)
  }
}

class AmazonProductBlock {

}

class AmazonListingPage {

}

class AmazonProductPage {

}

class AmazonPage {

}

class AmazonAIO extends Shuutils {

  id = 'amz-aio'
  debug = true

  constructor() {
    super()
    this.log('constructor')
    this.filter = new AmazonFilter()
    // this.page = new AmazonPage()
  }
}


class AmazonFilter extends Shuutils {

  id = 'amz-aio-filter'
  debug = true
  excluders = []

  constructor() {
    super()
    this.log('constructor')
    this.excluders = (window.localStorage[this.id + '.excluders'] || 'my-keyword, other-keyword').split(',')
  }
}

(function () {
  console.log('creating instance...')
  new AmazonAIO();
})()