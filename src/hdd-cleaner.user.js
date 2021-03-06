// ==UserScript==
// @name         HDD Cleaner
// @namespace    https://github.com/Shuunen
// @version      1.2.4
// @description  Remove unwanted hard drives disks
// @author       Romain Racamier-Lafon
// @match        https://keepa.com/*
// @match        https://www.amazon.fr/*
// @match        https://www.amazon.co.uk/*
// @match        https://www.dealabs.com/*
// @match        https://www.topachat.com/*
// @match        https://www.materiel.net/*
// @match        https://www.ldlc.com/*
// @require      https://raw.githubusercontent.com/Shuunen/user-scripts/master/src/utils.js
// @grant        none
// ==/UserScript==

(function HDDCleaner () {
  /* global Shuutils */
  const app = {
    id: 'hdd-clr',
    debug: false,
    minSize: 4000, // in Gb or Go
    maxSize: 12_000,
  }
  const cls = {
    mark: app.id + '-mark',
  }
  const selectors = {
    desc: ['.colorTipContent', 'div[data-asin] span.a-text-normal', '.c-product__title', '.pdt-info .title-3 a', '.thread-title--list', 'article .libelle h3'].map(sel => `${sel}:not(.${cls.mark})`).join(','),
    product: ['.productContainer', 'div[data-asin]', '.c-products-list__item', '.pdt-item', 'article.thread', 'article.grille-produit'].join(','),
    price: ['.productPriceTableTdLargeS', '.a-offscreen', '.o-product__price', 'br + span.a-color-base', '.price > .price', '.thread-price', '[itemprop="price"]'].join(','),
  }
  const regex = {
    sizes: /(\d+)\s?(go|gb|to|tb)\b/gi,
    size: /(\d+)\s?(\w+)/i,
    price: /(\d+[,.\\€]\d+)/,
  }
  const utils = new Shuutils(app)
  function getSize (text) {
    const matches = text.match(regex.sizes)
    if (!matches) return false
    let size = 0
    matches.forEach(m => {
      let [, mSize, mUnit] = m.match(regex.size)
      if (mUnit === 'to' || mUnit === 'tb') mSize *= 1000 // align sizes to Go, may be slightly different according to TO vs TB
      if (mSize > size) size = Number.parseInt(mSize, 10)
    })
    return size
  }
  function insertPricePerSize (productElement, descElement, size) {
    const priceElement = utils.findOne(selectors.price, productElement)
    if (!priceElement) {
      utils.error('failed at finding price element')
      return false
    }
    utils.log('found price element :', priceElement.textContent)
    const matches = priceElement.textContent.match(regex.price)
    if (matches.length !== 2) {
      utils.error('failed at finding price')
      return false
    }
    const price = Number.parseFloat(matches[0].replace(',', '.').replace('€', '.'))
    const pricePerTo = Math.round(price / (size / 1000))
    let rating = ''
    for (let index = 40; index > 20; index -= 5)
      if (pricePerTo < index) rating += '👍'
    rating += (rating.length > 0 ? ' ' : '')
    utils.log('price found :', pricePerTo, '€ per To')
    descElement.textContent = '( ' + rating + pricePerTo + '€ / to ) - ' + descElement.textContent
    return true
  }
  function checkItems () {
    utils.findAll(selectors.desc, document, true).forEach(descElement => {
      const text = utils.readableString(descElement.textContent).toLowerCase().trim()
      // first close last opened console group, else closing nothing without throwing error
      console.groupEnd()
      console.groupCollapsed(utils.ellipsisWords(text, 15))
      const size = getSize(text)
      if (!size) {
        utils.error('fail at finding size')
        return
      }
      utils.log('size found :', size, 'Go')
      const sizeIsOk = (app.minSize <= size) && (size <= app.maxSize)
      utils.log('size is', sizeIsOk ? 'good' : 'INVALID')
      const productElement = descElement.closest(selectors.product)
      if (!productElement) {
        utils.error('fail at finding closest product')
        return
      }
      let markItem = true
      if (sizeIsOk) markItem = insertPricePerSize(productElement, descElement, size)
      else productElement.style = app.debug ? 'background-color: lightcoral; opacity: 0.6;' : 'display: none;'
      if (markItem) {
        // only add mark class if check completed
        descElement.classList.add(cls.mark)
        utils.log('check complete, element marked')
      }
    })
    // if at least one iteration above, there's an open console group, else closing nothing without throwing error
    console.groupEnd()
  }
  function process () {
    utils.log('processing')
    checkItems()
  }
  const processDebounced = utils.debounce(process, 500)
  document.addEventListener('scroll', processDebounced)
  setTimeout(processDebounced, 1000)
})()
