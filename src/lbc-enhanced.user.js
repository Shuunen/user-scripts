// ==UserScript==
// @name        LeBonCoin Enhanced
// @namespace   https://github.com/Shuunen
// @description Add features to LeBonCoin
// @author      Romain Racamier-Lafon
// @match       https://www.leboncoin.fr/*
// @grant       none
// @version     1.1
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
    this.provider[this.fullKey(key)] = typeof data === 'object' ? JSON.stringify(data) : data
    return data
  }

  async has (key) {
    return this.get(key).then(value => !!value).catch(() => false)
  }
}

const store = new Store(localStorage)
const colors = {
  A: '#379932',
  B: '#3acc31',
  C: '#cdfd33',
  D: '#fbea49',
  E: '#fccc2f',
  F: '#fb9c34',
  G: '#fa1c1f',
  error: '#fa1c1f',
  success: '#379932',
  primary: '#f56b2a',
}

class LBCEnhanced {
  get config () {
    return {
      debug: true,
      processOne: false,
      delayBetweenProcess: 700,
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

  log (...stuff) {
    if (this.config.debug) return
    console.log.apply(console, stuff)
  }

  warn (...stuff) {
    console.warn.apply(console, stuff)
  }

  error (...stuff) {
    console.error.apply(console, stuff)
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
      this.warn(`findMatch found ${matches.length} matche(s) instead of ${nbMatch} for this regex :`, regex)
      return null
    }
    const result = matches[nbMatch - 1]
    if (!result) {
      this.error('findMatch failed to return the correct index in matches :', matches)
      return null
    }
    return result
  }

  async enhanceListItemImmo (el = DomEl, html = '') {
    this.log('enhanceListItemImmo')
    var energyClass = this.findMatch(html, /criteria_item_energy_rate.*?<div class="\w+ \w+ \w+" data-reactid="\d+">(\w)<\/div>/)
    var gesClass = this.findMatch(html, /criteria_item_ges.*?<div class="\w+ \w+ \w+" data-reactid="\d+">(\w)<\/div>/)
    if (energyClass && !['A', 'B', 'C'].includes(energyClass)) this.hideListItem(el, `Classe énergétique non-renseignée ou naze : ${energyClass}`)
    if (gesClass && !['A', 'B', 'C', 'D'].includes(gesClass)) this.hideListItem(el, `Classe GES pourrie : ${gesClass}`)
    this.addIconsForClasses(el, [energyClass, gesClass])
    var meters = this.findMatch(html, /surface[<\\\s\S">]+?>(\d+)/i) || 0
    if (meters === 0) meters = this.findMatch(html, /(\d+)[\s]?m²/i) || 0
    var price = this.findMatch(html, /(\d+)<![\s\S"]+?>Charges comprises/) || 0
    this.addIcon(el, `${meters} m²`, 106, 8)
    if (meters > 0 && price > 0) this.addIconsForPricePerMeter(el, Math.round(price / meters))
    var forbiddenKeywords = 'sans asenseur,sans ascenseur'.split(',').sort()
    var founds = forbiddenKeywords.filter(keyword => html.toLowerCase().includes(keyword))
    if (founds.length) this.hideListItem(el, `Mots clé excluant trouvés : ${founds.join(', ')}`)
    this.findKeywords(el, html.toLowerCase(), 'calme,rénové,jardin,placards,petite résidence,pas de frais,stationnement,double vitrage,petite copropriété,proximité du parc,parking,cave,ascenseur,dernier étage,lumineux,impasse,tram,arbres,champs,vis à vis'.split(',').sort())
  }

  findKeywords (el = DomEl, html = '', keywords) {
    var founds = keywords.filter(keyword => html.includes(keyword))
    var icon = this.addIcon(el, founds.join(', '), 0)
    var width = 300
    icon.style.right = `-${width}px`
    icon.style.width = `${width}px`
    icon.style.height = '100%'
    icon.style.textAlign = 'left'
    icon.style.backgroundColor = '#f1f1f1'
  }

  addIconsForPricePerMeter (el = DomEl, price) {
    var icon = this.addIcon(el, `${price} € / m²`, 129, 8)
    icon.style.color = (price <= 9 ? colors.success : (price > 12 ? colors.error : 'black'))
    icon.style.padding = '0 2px'
  }

  /**
   * @param {Array} list La liste des classe énergétique ou GES de A à G
   */
  addIconsForClasses (el = DomEl, list = ['?', '?']) {
    var top = 81
    var right = 15
    list.forEach(cls => {
      var icon = this.addIcon(el, cls, top, right)
      icon.style.backgroundColor = colors[cls]
      icon.style.padding = '0 2px'
      icon.style.fontSize = '20px'
      right += 24
    })
  }

  addIcon (el = DomEl, icon = '?', top = 10, right = 10, callback = null) {
    const btn = document.createElement('button')
    btn.textContent = icon
    btn.style = `background: none;border: 0px;font-size: 24px;position: absolute;top: ${top}px;right: ${right}px;`
    el.appendChild(btn)
    if (!callback) return btn
    btn.addEventListener('click', () => callback.bind(this)(el))
    return btn
  }

  async hideListItem (el = DomEl, message = '') {
    if (message.length) this.log(message, '=> hiding', el.link.href)
    else this.log('hiding', el.link.href)
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
    if (this.context === 'immo') await this.enhanceListItemImmo(el, html)
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
    if (title.includes('immobilières')) {
      this.context = 'immo'
    }
  }

  process () {
    this.detectContext()
    this.enhanceListing()
  }
}

var instance = new LBCEnhanced()
instance.log('LBCEnhanced 3 start, here is the instance :', instance)
