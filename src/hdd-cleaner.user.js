// ==UserScript==
// @author       Romain Racamier-Lafon
// @description  Remove unwanted hard drives disks
// @downloadURL  https://github.com/Shuunen/user-scripts/raw/master/src/hdd-cleaner.user.js
// @grant        none
// @match        https://keepa.com/*
// @match        https://www.amazon.co.uk/*
// @match        https://www.amazon.fr/*
// @match        https://www.dealabs.com/*
// @match        https://www.ldlc.com/*
// @match        https://www.materiel.net/*
// @match        https://www.topachat.com/*
// @name         HDD Cleaner
// @namespace    https://github.com/Shuunen
// @require      https://cdn.jsdelivr.net/gh/Shuunen/user-scripts@latest/src/utils.js
// @version      1.2.5
// ==/UserScript==

/* eslint-disable no-magic-numbers */
/* eslint-disable jsdoc/require-jsdoc */

// @ts-nocheck
// eslint-disable-next-line max-statements
(function hddCleaner () {
  const id = 'hdd-clr'
  const app = {
    maxSize: 12_000,
    minSize: 4000, // in Gb or Go
  }
  const cls = {
    mark: `${id}-mark`,
  }
  const selectors = {
    desc: ['.colorTipContent', 'div[data-asin] span.a-text-normal', '.c-product__title', '.pdt-info .title-3 a', '.thread-title--list', 'article .libelle h3'].map(sel => `${sel}:not(.${cls.mark})`).join(','),
    price: ['.productPriceTableTdLargeS', '.a-offscreen', '.o-product__price', 'br + span.a-color-base', '.price > .price', '.thread-price', '[itemprop="price"]'].join(','),
    product: ['.productContainer', 'div[data-asin]', '.c-products-list__item', '.pdt-item', 'article.thread', 'article.grille-produit'].join(','),
  }
  const regex = {
    price: /(?<price>\d+[,.\\€]\d+)/u,
    size: /(?<size>\d+)\s?(?<unit>\w+)/u,
    sizes: /(?<size>\d+)\s?(?<unit>gb|go|tb|to)\b/giu,
  }
  /** @type {import('./utils.js').Shuutils} */// @ts-ignore
  const utils = new Shuutils(id)
  /**
   * Get the size from a text
   * @param {string} text the text to search in
   * @returns {number|false} the size in Go or false if not found
   */
  function getSize (text) {
    const matches = text.match(regex.sizes)
    if (!matches) return false
    let size = 0
    for (const match of matches) {
      // eslint-disable-next-line prefer-const
      let [, mSize, mUnit] = match.match(regex.size) ?? []
      if (mUnit === 'to' || mUnit === 'tb') mSize *= 1000 // align sizes to Go, may be slightly different according to TO vs TB
      if (mSize > size) size = Number.parseInt(mSize, 10)
    }
    return size
  }
  // eslint-disable-next-line max-statements
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
    descElement.textContent = `( ${rating}${pricePerTo}€ / to ) - ${descElement.textContent}`
    return true
  }

  // eslint-disable-next-line max-statements
  function checkItems () {
    for (const descElement of utils.findAll(selectors.desc, document, true)) {
      const text = utils.readableString(descElement.textContent).toLowerCase().trim()
      // first close last opened console group, else closing nothing without throwing error
      // eslint-disable-next-line no-console
      console.groupEnd()
      // eslint-disable-next-line no-console
      console.groupCollapsed(utils.ellipsisWords(text, 15))
      const size = getSize(text)
      if (!size) {
        utils.error('fail at finding size')
        continue
      }
      utils.log('size found :', size, 'Go')
      const isSizeOk = (app.minSize <= size) && (size <= app.maxSize)
      utils.log('size is', isSizeOk ? 'good' : 'INVALID')
      const productElement = descElement.closest(selectors.product)
      if (!productElement) {
        utils.error('fail at finding closest product')
        continue
      }
      let willMarkItem = true
      if (isSizeOk) willMarkItem = insertPricePerSize(productElement, descElement, size)
      else productElement.style = app.debug ? 'background-color: lightcoral; opacity: 0.6;' : 'display: none;'
      if (willMarkItem) {
        // only add mark class if check completed
        descElement.classList.add(cls.mark)
        utils.log('check complete, element marked')
      }
    }
    // if at least one iteration above, there's an open console group, else closing nothing without throwing error
    // eslint-disable-next-line no-console
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
