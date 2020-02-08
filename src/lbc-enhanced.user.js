// ==UserScript==
// @name        LeBonCoin Enhanced
// @namespace   https://github.com/Shuunen
// @description Add features to LeBonCoin
// @author      Romain Racamier-Lafon
// @match       https://www.leboncoin.fr/*
// @grant       none
// @version     1.0
// ==/UserScript==

/* global fetch */

class LBCEnhanced {
  get config () {
    return {
      processOne: true,
    }
  }

  constructor () {
    var processDebounced = this.debounce(this.process.bind(this), 500)
    setTimeout(() => processDebounced(), 500)
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

  findMatch (str, regex, nbMatch) {
    const matches = str.match(regex) || []
    if (matches.length !== nbMatch) {
      console.warn(`findMatch found ${matches.length} matche(s) instead of ${nbMatch} for this regex :`, regex)
      return null
    }
    const result = matches[nbMatch - 1]
    if (!result) {
      console.error('findMatch failed to return the correct index in matches :', matches)
      return null
    }
    return result
  }

  enhanceListItemImmo (el, link, html) {
    // TODO : get price per surface
    var energyClass = this.findMatch(html, /criteria_item_energy_rate.*?<div class="\w+ \w+ \w+" data-reactid="\d+">(\w)<\/div>/, 2)
    var gesClass = this.findMatch(html, /criteria_item_ges.*?<div class="\w+ \w+ \w+" data-reactid="\d+">(\w)<\/div>/, 2)
    console.table({ title: link.title, energyClass, gesClass })
  }

  async enhanceListItem (el) {
    el.classList.add('processed')
    var link = el.querySelector('a')
    var html = await fetch(link.href).then(r => r.text())
    switch (this.context) {
      case 'immo':
        return this.enhanceListItemImmo(el, link, html)
      default:
        break
    }
  }

  enhanceListing () {
    var items = document.querySelectorAll('[itemtype="http://schema.org/Offer"]:not(.processed)')
    if (!items || !items.length) return
    if (this.config.processOne) {
      return this.enhanceListItem(items[0])
    }
    items.forEach(item => this.enhanceListItem(item))
  }

  detectContext () {
    const title = document.querySelector('h1').textContent
    this.context = 'unknown'
    if (title.includes('Ventes immobilières')) {
      this.context = 'immo'
    }
  }

  process () {
    this.detectContext()
    this.enhanceListing()
  }
}

var instance = new LBCEnhanced()
console.log('LBCEnhanced 3 start, here is the instance', instance)
