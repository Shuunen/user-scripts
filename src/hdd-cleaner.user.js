// ==UserScript==
// @name         HDD Cleaner
// @author       Romain Racamier-Lafon
// @description  Remove unwanted hard drives disks
// @downloadURL  https://github.com/Shuunen/user-scripts/raw/master/src/hdd-cleaner.user.js
// @updateURL    https://github.com/Shuunen/user-scripts/raw/master/src/hdd-cleaner.user.js
// @grant        none
// @match        https://keepa.com/*
// @match        https://www.amazon.co.uk/*
// @match        https://www.amazon.fr/*
// @match        https://www.dealabs.com/*
// @match        https://www.ldlc.com/*
// @match        https://www.ldlc.pro/*
// @match        https://www.materiel.net/*
// @match        https://www.topachat.com/*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=amazon.fr
// @namespace    https://github.com/Shuunen
// @require      https://cdn.jsdelivr.net/gh/Shuunen/monorepo@latest/apps/user-scripts/src/utils.js
// @version      1.2.6
// ==/UserScript==

const id = 'hdd-clr'

const app = {
  maxSize: 30_000,
  minSize: 4000, // in Gb or Go
}

const cls = {
  mark: `${id}-mark`,
}

const selectors = {
  desc: ['h2[aria-label]', '.colorTipContent', 'div[data-asin] span.a-text-normal', '.c-product__title', '.pdt-info .title-3 a', '.thread-title--list', 'article .libelle h3'].map(sel => `${sel}:not(.${cls.mark})`).join(','),
  price: ['.productPriceTableTdLargeS', '.a-offscreen', '.o-product__price', 'br + span.a-color-base', '.price > .price', '.thread-price', '[itemprop="price"]'].join(','),
  product: ['.productContainer', 'div[data-asin]', '.c-products-list__item', '.pdt-item', 'article.thread', 'article.grille-produit'].join(','),
}
const regex = {
  price: /(?<price>\d+[,.\\€]\d+)/u,
  size: /(?<size>\d+)\s?(?<unit>\w+)/u,
  sizes: /(?<size>\d+)\s?(?<unit>gb|go|tb|to)\b/giu,
}

/**
 * Get the size from a text
 * @param {string} text the text to search in
 * @returns {{mSize: string, mUnit: string, size: number}} the matched size/unit and size normalized in Go
 */
function getSize(text) {
  const matches = text.match(regex.sizes)
  const result = { mSize: '', mUnit: '', size: 0 }
  if (!matches) return result
  for (const match of matches) {
    const [, mSize, mUnit] = match.match(regex.size) ?? []
    let size = Number(mSize)
    if (mUnit === 'to' || mUnit === 'tb') size *= 1000 // align sizes to Go, may be slightly different according to TO vs TB
    if (size > result.size) result.size = size
    result.mSize = mSize ?? ''
    result.mUnit = mUnit ?? ''
  }
  return result
}

function HddCleaner() {
  const utils = new Shuutils(id)
  /**
   * Calculates the price per terabyte (To) for a product and inserts it into the description element,
   * along with a rating based on the price per To.
   *
   * @param {HTMLElement} productElement - The DOM element representing the product.
   * @param {HTMLElement} descElement - The DOM element where the price per size will be inserted.
   * @param {number} size - The size of the product in gigabytes (GB).
   * @returns {boolean} Returns true if the price per size was successfully inserted, false otherwise.
   */
  function insertPricePerSize(productElement, descElement, size) {
    const priceElement = utils.findOne(selectors.price, productElement)
    if (!priceElement) {
      utils.error('failed at finding price element')
      return false
    }
    utils.log('found price element', priceElement)
    const matches = priceElement.textContent?.match(regex.price) ?? []
    if (matches.length !== 2) {
      utils.error('failed at finding price in :', `"${priceElement.textContent}"`)
      return false
    }
    const price = utils.parsePrice(priceElement.childNodes[0]?.textContent ?? '')
    const pricePerTo = Math.round(price.amount / (size / 1000))
    let rating = ''
    for (let index = 40; index > 20; index -= 5) if (pricePerTo < index) rating += '👍'
    rating += rating.length > 0 ? ' ' : ''
    utils.log(`price found : ${price.amount} ${price.currency}, ${pricePerTo} ${price.currency} / To`)
    utils.log(`rating is "${rating}"`)
    descElement.textContent = `( ${rating}${pricePerTo}€ / to ) - ${descElement.textContent}`
    productElement.dataset.pricePerTo = String(pricePerTo) // for sorting
    return true
  }
  /**
   * Checks and processes all items on the page.
   */
  function checkItems() {
    /** @type {HTMLElement[]} */
    const productElements = []
    const descElements = utils.findAll(selectors.desc, document, true)
    for (const descElement of descElements) {
      if (!descElement.textContent) {
        utils.error('no text content found in description element', descElement)
        continue
      }
      checkItem(descElement, productElements)
    }
    sortProductsByPricePerTo(productElements)
  }

  /**
   * Processes a description element and updates productElements if valid.
   * @param {HTMLElement} descElement - The description element to process.
   * @param {HTMLElement[]} productElements - The array to collect valid product elements for sorting.
   */
  function checkItem(descElement, productElements) {
    const text = utils.readableString(descElement.textContent).toLowerCase().trim()
    const section = utils.ellipsisWords(text, 10)
    utils.groupCollapsed(section)
    const sizeResult = getSize(text)
    if (sizeResult.size === 0) {
      utils.error('fail at finding size in text', `"${text}"`)
      utils.groupEnd()
      return
    }
    utils.log(`size found "${sizeResult.mSize} ${sizeResult.mUnit}" => ${sizeResult.size} Go`)
    const isSizeOk = app.minSize <= sizeResult.size && sizeResult.size <= app.maxSize
    utils.log('size is', isSizeOk ? 'in range' : 'NOT IN RANGE')
    const productElement = findProductElement(descElement)
    if (!productElement) {
      utils.groupEnd()
      return
    }
    let willMarkItem = true
    if (isSizeOk) willMarkItem = insertPricePerSize(productElement, descElement, sizeResult.size)
    else utils.hideElement(productElement, 'size not in range')
    if (willMarkItem) {
      descElement.classList.add(cls.mark)
      utils.log('check complete, element marked')
    }
    if (productElement.dataset.pricePerTo) productElements.push(productElement)
    utils.groupEnd()
  }

  /**
   * Finds the closest product element for a given description element.
   * @param {HTMLElement} descElement - The description element to search from.
   * @returns {HTMLElement|undefined} The closest product element, or undefined if not found.
   */
  function findProductElement(descElement) {
    const productElement = descElement.closest(selectors.product)
    if (!productElement) {
      utils.error('fail at finding closest product')
      return undefined
    }
    if (!(productElement instanceof HTMLElement)) {
      utils.error('product element is not an HTMLElement', productElement)
      return undefined
    }
    return productElement
  }

  /**
   * Sorts product elements by price per terabyte and appends them to their parent.
   * @param {HTMLElement[]} productElements - The array of product elements to sort.
   */
  function sortProductsByPricePerTo(productElements) {
    if (productElements.length > 1) {
      const parent = productElements[0]?.parentElement
      if (parent) {
        productElements.sort((productA, productB) => {
          const priceA = Number(productA.dataset.pricePerTo)
          const priceB = Number(productB.dataset.pricePerTo)
          return priceA - priceB
        })
        for (const productElementSorted of productElements) parent.append(productElementSorted)
        utils.log('sorted products by pricePerTo')
      }
    }
  }
  function start() {
    utils.log('starting')
    checkItems()
  }
  const startDebounced = utils.debounce(start, 500)
  document.addEventListener('scroll', () => startDebounced())
  setTimeout(startDebounced, 1000)
}

if (globalThis.window) HddCleaner()
else module.exports = { getSize }
