// ==UserScript==
// @name         HDD Cleaner
// @namespace    https://github.com/Shuunen
// @version      1.1.0
// @description  Remove unwanted hard drives disks
// @author       Romain Racamier-Lafon
// @match        https://keepa.com/*
// @match        https://www.amazon.fr/*
// @require      https://cdn.jsdelivr.net/gh/Shuunen/user-scripts/utils.js
// @grant        none
// ==/UserScript==

(function () {
  /* global Shuutils */
  'use strict'

  var app = {
    id: 'hdd-clr',
    debug: false,
    minSize: 4000, // in Gb or Go
    maxSize: 12000
  }

  var cls = {
    mark: app.id + '-mark'
  }

  var selectors = {
    desc: ['.colorTipContent', 'div[data-asin] span.a-text-normal'].map(sel => `${sel}:not(.${cls.mark})`).join(','),
    product: ['.productContainer', 'div[data-asin]'].join(','),
    price: ['.productPriceTableTdLargeS', '.a-offscreen'].join(',')
  }

  var regex = {
    sizes: /(\d+)\s?(go|gb|to|tb)\b/gi,
    size: /(\d+)\s?(\w+)/i,
    price: /(\d+[\\.,]\d+)/
  }

  var utils = new Shuutils(app)

  function getSize (text) {
    const matches = text.match(regex.sizes)
    if (!matches) {
      return false
    }
    utils.log(matches)
    let size = 0
    matches.forEach(m => {
      let [, mSize, mUnit] = m.match(regex.size)
      if (mUnit === 'to' || mUnit === 'tb') {
        // align sizes to Go
        mSize = mSize * 1000 // may be slightly different according to TO vs TB
      }
      if (mSize > size) {
        size = parseInt(mSize)
      }
    })
    return size
  }

  function insertPricePerSize (productElement, descElement, size) {
    const priceElement = utils.findOne(selectors.price, productElement)
    const matches = priceElement.textContent.match(regex.price)
    if (matches.length !== 2) {
      return utils.error('failed at finding price')
    }
    const price = parseFloat(matches[0].replace(',', '.'))
    const pricePerTo = Math.round(price / (size / 1000))
    let rating = ''
    for (let i = 40; i > 20; i -= 5) {
      if (pricePerTo < i) {
        rating += '👍'
      }
    }
    rating = rating + (rating.length ? ' ' : '')
    descElement.textContent = '( ' + rating + pricePerTo + '€ / to ) - ' + descElement.textContent
  }

  function checkItems () {
    utils.findAll(selectors.desc, document, true).forEach(descElement => {
      descElement.classList.add(cls.mark)
      const text = utils.readableString(descElement.textContent).toLowerCase().trim()
      const size = getSize(text)
      const sizeIsOk = (app.minSize <= size) && (size <= app.maxSize)
      const productElement = descElement.closest(selectors.product)
      if (!productElement) {
        return utils.error('fail at finding closest product')
      }
      if (sizeIsOk) {
        insertPricePerSize(productElement, descElement, size)
        return
      }
      if (!app.debug) {
        productElement.remove()
      }
      productElement.style = 'background-color: lightcoral; opacity: 0.6;'
    })
  }

  function process () {
    utils.log('processing')
    checkItems()
  }

  const processDebounced = utils.debounce(process, 500)

  document.addEventListener('scroll', processDebounced)
})()
