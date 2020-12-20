// ==UserScript==
// @name        LeBonCoin Enhanced
// @namespace   https://github.com/Shuunen
// @description Add features to LeBonCoin
// @author      Romain Racamier-Lafon
// @match       https://www.leboncoin.fr/*
// @grant       none
// @version     1.1.1
// ==/UserScript==

/* global fetch, localStorage */

const DomElement = document.createElement('div')

class Store {
  constructor (provider) {
    this.provider = provider
  }

  fullKey (key) {
    return `lbc-enhanced_${key}`
  }

  async get (key = '', defaultValue) {
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
      debug: false,
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

  debounce (function_, wait = 500, immediate = false) {
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

  findMatch (string = '', regex = new RegExp(), nbMatch = 2) {
    const matches = string.match(regex) || []
    if (matches.length !== nbMatch) return this.warn(`findMatch found ${matches.length} matche(s) instead of ${nbMatch} for this regex :`, regex)
    const result = matches[nbMatch - 1]
    if (!result) return this.error('findMatch failed to return the correct index in matches :', matches)
    return result
  }

  async enhanceListItemImmo (element = DomElement, html = '') {
    this.log('enhanceListItemImmo')
    const energyClass = this.findMatch(html, /criteria_item_energy_rate.*?<div class="\w+ \w+ \w+" data-reactid="\d+">(\w)<\/div>/)
    const gesClass = this.findMatch(html, /criteria_item_ges.*?<div class="\w+ \w+ \w+" data-reactid="\d+">(\w)<\/div>/)
    if (energyClass && !['A', 'B', 'C'].includes(energyClass)) this.hideListItem(element, `Classe énergétique non-renseignée ou naze : ${energyClass}`)
    if (gesClass && !['A', 'B', 'C', 'D'].includes(gesClass)) this.hideListItem(element, `Classe GES pourrie : ${gesClass}`)
    this.addIconsForClasses(element, [energyClass, gesClass])
    let meters = this.findMatch(html, /surface[\S\s]+?>(\d+)/i) || 0
    if (meters === 0) meters = this.findMatch(html, /(\d+)\s?m²/i) || 0
    const price = this.findMatch(html, /(\d+)<![\S\s]+?>Charges comprises/) || 0
    this.addIcon(element, `${meters} m²`, 106, 8)
    if (meters > 0 && price > 0) this.addIconsForPricePerMeter(element, Math.round(price / meters))
    const forbiddenKeywords = 'sans asenseur,sans ascenseur'.split(',').sort()
    const founds = forbiddenKeywords.filter(keyword => html.toLowerCase().includes(keyword))
    if (founds.length > 0) this.hideListItem(element, `Mots clé excluant trouvés : ${founds.join(', ')}`)
    this.findKeywords(element, html.toLowerCase(), 'calme,rénové,jardin,placards,petite résidence,pas de frais,stationnement,double vitrage,petite copropriété,proximité du parc,parking,cave,ascenseur,dernier étage,lumineux,impasse,tram,arbres,champs,vis à vis'.split(',').sort())
  }

  findKeywords (element = DomElement, html = '', keywords) {
    const founds = keywords.filter(keyword => html.includes(keyword))
    const icon = this.addIcon(element, founds.join(', '), 0)
    const width = 300
    icon.style.right = `-${width}px`
    icon.style.width = `${width}px`
    icon.style.height = '100%'
    icon.style.textAlign = 'left'
    icon.style.backgroundColor = '#f1f1f1'
  }

  addIconsForPricePerMeter (element = DomElement, price) {
    const icon = this.addIcon(element, `${price} € / m²`, 129, 8)
    icon.style.color = (price <= 9 ? colors.success : (price > 12 ? colors.error : 'black'))
    icon.style.padding = '0 2px'
  }

  /**
   * @param {Array} list La liste des classe énergétique ou GES de A à G
   */
  addIconsForClasses (element = DomElement, list = ['?', '?']) {
    const top = 81
    let right = 15
    list.forEach(cls => {
      const icon = this.addIcon(element, cls, top, right)
      icon.style.backgroundColor = colors[cls]
      icon.style.padding = '0 2px'
      icon.style.fontSize = '20px'
      right += 24
    })
  }

  addIcon (element = DomElement, icon = '?', top = 10, right = 10, callback) {
    const button = document.createElement('button')
    button.textContent = icon
    button.style = `background: none;border: 0px;font-size: 24px;position: absolute;top: ${top}px;right: ${right}px;`
    element.append(button)
    if (!callback) return button
    button.addEventListener('click', () => callback.bind(this)(element))
    return button
  }

  async hideListItem (element = DomElement, message = '') {
    if (message.length > 0) this.log(message, '=> hiding', element.link.href)
    else this.log('hiding', element.link.href)
    if (this.hidden.includes(element.id)) return
    this.hidden.push(element.id)
    store.set('hidden', this.hidden)
    element.style.display = 'none'
  }

  enhanceListItemGeneric (element = DomElement, html = '') {
    this.addIcon(element, '👁️', 44, 7, this.hideListItem)
  }

  async enhanceListItem (element = DomElement) {
    element.link = element.querySelector('a')
    element.id = this.findMatch(element.link.href, /\/(\d+)\.htm/)
    if (!element.id) throw new Error('failed at defining an id')
    if (this.hidden.includes(element.id)) return (element.style.display = 'none')
    const html = await fetch(element.link.href).then(r => r.text())
    this.enhanceListItemGeneric(element, html)
    if (this.context === 'immo') await this.enhanceListItemImmo(element, html)
    await this.sleep(this.config.delayBetweenProcess)
  }

  async enhanceListing () {
    let items = document.querySelectorAll('[itemtype="http://schema.org/Offer"]:not(.processed)')
    if (!items || items.length <= 0) return
    if (this.config.processOne) items = [items[0]]
    items.forEach(item => item.classList.add('processed'))
    for (const item of items) {
      await this.enhanceListItem(item)
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

const instance = new LBCEnhanced()
instance.log('LBCEnhanced 3 start, here is the instance :', instance)
