// ==UserScript==
// @name        LeBonCoin Enhanced
// @namespace   https://github.com/Shuunen
// @description Add features to LeBonCoin
// @author      Romain Racamier-Lafon
// @match       https://www.leboncoin.fr/*
// @grant       none
// @version     1.0
// ==/UserScript==

/* global fetch, localStorage */

const DomEl = document.createElement('div')

class Store {
  constructor (provider) {
    this.provider = provider
  }

  fullKey (key) {
    return `lbc-enhanced_${key}`
  }

  async get (key = '', defaultValue = null) {
    const data = this.provider[this.fullKey(key)]
    if (defaultValue && !data) return defaultValue
    if (!data) throw new Error(`storage : found no matching key "${this.fullKey(key)}"`)
    let result = data
    if (data[0] === '{') result = JSON.parse(data)
    if (data[0] === '[') result = JSON.parse(`{ "arr": ${data} }`).arr
    if (defaultValue && (typeof result !== typeof defaultValue)) throw new Error(`storage : type mismatch, got ${typeof result} instead of ${typeof defaultValue}`)
    return result
  }

  async set (key = '', data) {
    console.log(`storing ${key}...`, data)
    this.provider[this.fullKey(key)] = typeof data === 'object' ? JSON.stringify(data) : data
    return data
  }

  async has (key) {
    return this.get(key).then(value => !!value).catch(() => false)
  }
}

const store = new Store(localStorage)

class LBCEnhanced {
  get config () {
    return {
      processOne: false,
      delayBetweenProcess: 500,
    }
  }

  constructor () {
    this.processDebounced = this.debounce(this.process.bind(this), 500)
    document.addEventListener('scroll', this.processDebounced)
    this.hidden = []
    this.loadData()
  }

  async sleep (ms = 1000) {
    return new Promise(resolve => setTimeout(resolve, ms))
  }

  async loadData () {
    this.hidden = await store.get('hidden', [])
    await this.sleep(500)
    this.processDebounced()
  }

  debounce (func, wait = 500, immediate = false) {
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

  findMatch (str = '', regex = new RegExp(), nbMatch = 2) {
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

  enhanceListItemImmo (el = DomEl, html = '') {
    // TODO : get price per surface
    var energyClass = this.findMatch(html, /criteria_item_energy_rate.*?<div class="\w+ \w+ \w+" data-reactid="\d+">(\w)<\/div>/)
    var gesClass = this.findMatch(html, /criteria_item_ges.*?<div class="\w+ \w+ \w+" data-reactid="\d+">(\w)<\/div>/)
    if (!energyClass || !['A', 'B', 'C'].includes(energyClass)) this.hideListItem(el, `Classe énergétique non-renseignée ou naze : ${energyClass}`)
    if (gesClass && !['A', 'B', 'C', 'D'].includes(gesClass)) this.hideListItem(el, `Classe GES pourrie : ${gesClass}`)
    console.table({ title: el.link.title, link: el.link.href, energyClass, gesClass })
  }

  /**
   * @param {string} cls La classe énergétique ou GES de A à G
   */
  addIconForClass (el, cls = '') {

  }

  addIcon (el = DomEl, icon = '?', top = 10, right = 10, callback = null) {
    const btn = document.createElement('button')
    btn.textContent = icon
    btn.style = `background: none;border: 0px;font-size: 24px;position: absolute;top: ${top}px;right: ${right}px;`
    el.appendChild(btn)
    if (!callback) return
    btn.addEventListener('click', () => callback.bind(this)(el))
    return btn
  }

  async hideListItem (el = DomEl, message = '') {
    if (message.length) console.log(message, '=> hiding', el.link.href)
    else console.log('hiding', el.link.href)
    if (this.hidden.includes(el.id)) return
    this.hidden.push(el.id)
    store.set('hidden', this.hidden)
    el.style.display = 'none'
  }

  enhanceListItemGeneric (el = DomEl, html = '') {
    this.addIcon(el, '👁️', 44, 7, this.hideListItem)
  }

  async enhanceListItem (el = DomEl) {
    el.link = el.querySelector('a')
    el.id = this.findMatch(el.link.href, /\/(\d+)\.htm/)
    if (!el.id) throw new Error('failed at defining an id')
    if (this.hidden.includes(el.id)) return (el.style.display = 'none')
    var html = await fetch(el.link.href).then(r => r.text())
    this.enhanceListItemGeneric(el, html)
    switch (this.context) {
      case 'immo':
        return this.enhanceListItemImmo(el, html)
      default:
        break
    }
    await this.sleep(this.config.delayBetweenProcess)
  }

  async enhanceListing () {
    var items = document.querySelectorAll('[itemtype="http://schema.org/Offer"]:not(.processed)')
    if (!items || !items.length) return
    if (this.config.processOne) items = [items[0]]
    items.forEach(item => item.classList.add('processed'))
    for (let i = 0; i < items.length; i++) {
      await this.enhanceListItem(items[i])
    }
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
console.log('LBCEnhanced start, here is the instance :', instance)
