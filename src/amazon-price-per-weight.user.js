// ==UserScript==
// @name         Amazon - Price per weight
// @author       Romain Racamier-Lafon
// @description  Display price per weight & sort ascending
// @downloadURL  https://github.com/Shuunen/user-scripts/raw/master/src/amazon-price-per-weight.user.js
// @updateURL    https://github.com/Shuunen/user-scripts/raw/master/src/amazon-price-per-weight.user.js
// @grant        none
// @match        https://www.amazon.fr/*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=amazon.fr
// @namespace    https://github.com/Shuunen
// @require      https://cdn.jsdelivr.net/gh/Shuunen/monorepo@latest/apps/user-scripts/src/utils.js
// @version      1.0.9
// ==/UserScript==

// @ts-nocheck

/**
 * Converts a price string to a floating-point number.
 * Replaces commas with dots to handle European decimal notation.
 *
 * @param {string} string - The price string to convert (e.g., "12,34" or "12.34").
 * @returns {number} The parsed floating-point price.
 */
function priceStringToFloat(string) {
  let price = string.replace(',', '.')
  price = Number(price)
  return price
}

/**
 * Converts a floating-point price to a string formatted with one decimal place,
 * replaces the decimal point with a comma, and appends a trailing zero.
 *
 * @param {number} number - The price value to format.
 * @returns {string} The formatted price string (e.g., "12,30").
 */
function priceFloatToString(number) {
  let price = number.toFixed(1)
  price = `${price.replace('.', ',')}0`
  return price
}

function getTitle(text) {
  return text.split(' ').slice(0, 5).join(' ')
}

function AmazonPricePerWeight() {
  const app = {
    id: 'amz-kg',
    injectRealPrice: true,
    processOnce: false,
    processOne: false,
    showDebug: false,
  }

  const cls = {
    avoided: `${app.id}-avoided`,
    debug: `${app.id}-debug`,
    handled: `${app.id}-handled`,
    pricePer: `${app.id}-price-per`,
  }

  const selectors = {
    debug: `.${cls.debug}`,
    debugContainer: '.a-fixed-left-grid-col.a-col-right .a-row:not(.a-spacing-small) .a-column.a-span7',
    item: `.s-result-item[data-asin^="B"]:not(.aok-hidden):not(.${cls.handled}):not(.${cls.avoided})`,
    otherPrice: '.a-size-base.a-color-price.s-price.a-text-bold',
    pantry: 'img.sprPantry',
    price: 'span.a-price',
    pricePer: 'span.a-price + .a-size-base.a-color-secondary',
  }

  // selectors.price = selectors.debugContainer + ' div:first-child .a-link-normal'

  const regex = {
    bulk: /lot de (?<count>\d+)/iu,
    price: /(?<currency>eur|€)\s?(?<amount>\d+,\d{2})/iu,
    pricePer: /(?<amount>\d+,\d{2})\s€\/(?<unit>\w+)/u,
    weight: /(?<weight>\d+)\s?(?<unit>g|kg|-)/iu,
  }

  const templates = {
    debug: `<div class="a-row ${cls.debug}"><div class="a-column a-span12">\n    <p class="a-spacing-micro">Price  : {{price}} \u20AC</p>\n    <p class="a-spacing-micro">Weight : {{weight}} {{unit}}</p>    \n    <p class="a-spacing-small">Bulk   : {{bulk}}</p>\n    <p class="a-spacing-micro a-size-base a-color-price s-price a-text-bold">P/Kg  : {{pricePerKilo}} \u20AC/kg</p>\n    </div></div>`,
    price: '<span class="s-price a-text-bold">EUR {{price}}</span>',
    pricePerKilo: `<span class="a-color-price s-price a-text-bold ${cls.pricePer}">EUR {{pricePerKilo}}/kg</span>`,
  }

  const utils = new Shuutils(app.id)

  const products = []

  function shadeBadProducts() {
    const elements = utils.findAll(selectors.pantry, document, true)
    for (const element of elements) {
      const item = element.parentElement.parentElement.parentElement.parentElement.parentElement.parentElement.parentElement.parentElement
      item.style.filter = 'grayscale(100%)'
      item.style.opacity = 0.5
      item.style.order = 1000
      item.classList.add(cls.avoided)
      utils.log('shaded item', item)
    }
  }

  /**
   * Extracts the price from a given text using a regular expression.
   * Logs warnings if the price cannot be found, and logs matches and price if `app.processOne` is enabled.
   *
   * @param {string} text - The input text containing the price information.
   * @returns {number|undefined} The extracted price as a float, or undefined if not found.
   */
  function getPrice(text) {
    const matches = text.match(regex.price) || []
    if (matches.length !== 3) return utils.warn(`failed to find price in : "${text}"`, matches)
    if (app.processOne) utils.log('found price matches :', matches)
    const price = priceStringToFloat(matches[2])
    if (app.processOne) utils.log('found price', price)
    return price
  }

  function getWeightAndUnit(text) {
    const matches = text.toLowerCase().match(regex.weight)
    if (app.processOne) utils.log('found weight matches & unit :', matches)
    const data = { unit: '', weight: 0 }
    if (matches?.length === 3) {
      data.weight = matches.at(1) ?? 0
      data.unit = matches.at(2) ?? ''
    }
    if (data.unit === '-') data.unit = 'g'
    else if (data.unit === '') utils.warn('failed to find a unit in :', text)
    if (app.processOne) utils.log('found weight & unit :', data)
    return data
  }

  function getBulk(text) {
    const matches = text.match(regex.bulk)
    // utils.log('found bulk matches :', matches)
    let bulk = matches?.length === 2 ? matches[1] : '1'
    bulk = Math.trunc(Number(bulk))
    // utils.log('found bulk', bulk)
    return bulk
  }

  function getProductDataViaPricePer(text) {
    const matches = text.replace('&nbsp;', ' ').match(regex.pricePer) || []
    const data = {
      bulk: 1,
      price: 0,
      unit: '',
      weight: 0,
    }
    if (matches.length === 0) {
      utils.warn('failed to find data in :', text)
      return data
    }
    if (matches.length === 3) {
      data.price = priceStringToFloat(matches[1])
      data.weight = 1
      data.unit = matches.at(2) ?? ''
    }
    if (data.unit === 'unit') data.unit = ''

    if (!['', 'g', 'kg'].includes(data.unit)) utils.error('unit ?', data.unit)
    if (app.processOne) utils.log('found pricePer :', data)
    return data
  }

  function getProductData(item, data = {}) {
    const text = item.textContent.trim()
    const textClean = utils.readableString(text)
    if (!data.unit || data.unit === '') {
      const weightAndUnit = getWeightAndUnit(textClean)
      data.weight = weightAndUnit.weight
      data.unit = weightAndUnit.unit
    }
    if (!data.price) data.price = getPrice(text)
    if (!data.bulk) data.bulk = getBulk(textClean)
    if (!data.title) data.title = getTitle(textClean)
    return data
  }

  function fill(template, data) {
    let tpl = String(template)
    for (const key of Object.keys(data)) {
      const string = `{{${key}}}`
      let value = data[key]
      if (key.includes('price') && value > 0) value = priceFloatToString(value)
      // utils.log('looking for', str)
      tpl = tpl.replaceAll(new RegExp(string, 'giu'), value)
    }
    return tpl
  }

  function showDebugData(item, data) {
    let debug = utils.findOne(selectors.debug, item, true)
    if (!app.showDebug) {
      if (debug) debug.style.display = 'none' // if existing debug zone found
      return
    }
    const html = fill(templates.debug, data)
    // utils.log('debug html', html)
    if (debug) {
      // if existing debug zone found
      debug.style.display = 'inherit'
      debug.outerHTML = html
      return
    }
    debug = document.createElement('div')
    debug.innerHTML = html
    const container = utils.findOne(selectors.debugContainer, item)
    if (container) container.append(debug)
    else utils.error(data.title, ': failed at finding debug container', item)
  }

  function getPricePerKilo(data) {
    data.pricePerKilo = 0
    if (data.weight === 0) return data
    const weight = data.weight * data.bulk
    if (data.unit === 'g') data.pricePerKilo = (1000 / weight) * data.price
    else if (data.unit === 'kg') data.pricePerKilo = weight * data.price
    else utils.error(data.title, ': unit not handled :', data.unit)
    if (data.pricePerKilo >= 0) data.pricePerKilo = priceStringToFloat(data.pricePerKilo.toFixed(1))
    if (app.processOne) utils.log('found pricePerKilo :', data)
    return data
  }

  function injectRealPrice(item, data) {
    if (!app.injectRealPrice) return
    const price = utils.findOne(selectors.price, item)
    if (!price) {
      utils.error('failed to find price el')
      return
    }
    utils.log('injecting real price :', data)
    let text = ''
    if (data.pricePerKilo > 0) text = fill(templates.pricePerKilo, data)
    else if (data.price > 0) text = fill(templates.price, data)
    price.innerHTML = text + (app.debug ? ` (${price.innerHTML})` : '')
    if (price.nextElementSibling && !app.debug) price.nextElementSibling.remove()
    const otherPrice = utils.findOne(selectors.otherPrice, item, true)
    if (otherPrice) otherPrice.classList.remove('a-color-price', 'a-text-bold')
  }

  function augmentProduct(item) {
    if (app.processOne) utils.log('augment', item)
    const pricePer = utils.findOne(selectors.pricePer, item, true)
    let data = {}
    if (pricePer) data = getProductDataViaPricePer(pricePer.textContent)
    data = getProductData(item, data)
    data = getPricePerKilo(data)
    showDebugData(item, data)
    injectRealPrice(item, data)
    if (app.processOnce) item.classList.add(cls.handled)
    data.el = item
    products.push(data)
  }

  function augmentProducts() {
    for (const item of utils.findAll(selectors.item)) augmentProduct(item)
    // sortProducts()
  }

  // function sortProducts() {
  // const list = utils.findOne(selectors.list)
  // if (!list) return utils.error('cannot sort without list')
  // list.style.display = 'flex'
  // list.style.flexDirection = 'column'
  // // trick to have products without pricePerKilo at bottom
  // products.forEach(p => {
  //     p.pricePerKilo = p.pricePerKilo || p.price + 1000
  // })
  // // sort by pricePerKilo
  // products = products.sort((a, b) => {
  //     return a.pricePerKilo - b.pricePerKilo
  // })
  // products.forEach((p, index) => {
  //     p.el.style.order = index
  // })
  // }

  function init() {
    utils.log('is starting...')
    shadeBadProducts()
    if (app.processOne) augmentProduct(utils.findFirst(selectors.item))
    else augmentProducts()
    utils.log('processed', products.length, 'products')
  }

  init()
}

if (globalThis.window) AmazonPricePerWeight()
else module.exports = { getTitle, priceFloatToString, priceStringToFloat }
