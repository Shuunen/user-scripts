// ==UserScript==
// @name         AliExpress - All in one
// @downloadURL  https://github.com/Shuunen/user-scripts/raw/master/src/aliexpress-aio.user.js
// @namespace    https://github.com/Shuunen
// @version      1.0.2
// @description  Bigger listing
// @author       Romain Racamier-Lafon
// @match        https://*.aliexpress.com/*
// @require      https://cdn.jsdelivr.net/gh/Shuunen/user-scripts@2.6.1/src/utils.min.js
// @grant        none
// ==/UserScript==

/* eslint-disable no-magic-numbers */
/* eslint-disable max-statements */
/* eslint-disable consistent-return */
/* eslint-disable jsdoc/require-param */
/* eslint-disable jsdoc/require-param-description */
/* eslint-disable jsdoc/require-returns */

(function aliExpressAio () {
  /** @type {import('./utils.js').Shuutils} */// @ts-ignore
  const utils = new Shuutils('ali-express-aio')
  /** @param {HTMLImageElement} img */
  function extendsImage (img, size = 600) {
    // img.src = img.src.split('.jpg_')[0] + '.jpg'
    img.style.height = `${size}px`
    img.style.width = `${size}px`
    img.style.maxHeight = 'inherit'
    img.style.maxWidth = 'inherit'
  }
  /** @param {HTMLElement} element */
  function processProductCard (element) {
    /** @type {HTMLImageElement | null} */
    const img = element.querySelector('.item-img, img')
    if (!img?.src)
      return utils.error('cannot find image on card el', element)
    extendsImage(img)
    /** @type {HTMLImageElement | null} */
    const wrapper = img.closest('.product-img, a')
    if (!wrapper) return utils.error('failed to find wrapper of', img)
    wrapper.style.height = 'inherit'
    wrapper.style.width = 'inherit'
    element.style.display = 'flex'
    /** @type {HTMLImageElement | null} */
    const zone = element.querySelector('.right-zone')
    if (!zone) return utils.error('cannot find zone on card el', element)
    zone.style.paddingLeft = '16px'
    zone.style.marginTop = '16px'
    /** @type {HTMLImageElement | null} */// @ts-ignore
    const sibling = zone.previousElementSibling
    if (sibling) sibling.style.width = '80%'
    element.classList.add('ali-aio-handled')
  }
  /** @param {HTMLElement} element */
  function processItemRow (element) {
    /** @type {HTMLImageElement | null} */
    const img = element.querySelector('.pic-core')
    if (!img?.src) return utils.error('cannot find image on row el', element)
    utils.log('image src was', img.src)
    extendsImage(img, 500)
    utils.log('now image src is', img.src)
    /** @type {HTMLImageElement | null} */
    let wrapper = img.closest('.pic')
    if (!wrapper) return utils.error('failed to find wrapper of', img)
    wrapper.style.height = 'inherit'
    wrapper.style.width = 'inherit' // @ts-ignore
    wrapper = wrapper.parentElement // @ts-ignore
    wrapper.style.height = 'inherit' // @ts-ignore
    wrapper.style.width = 'inherit'
    element.style.display = 'flex'
    element.style.height = 'inherit'
    element.classList.add('ali-aio-handled')
  }
  /**
   * Returns an array of all elements that match the given selector.
   * @param {string} selector - The CSS selector to match elements against.
   * @returns {Array<HTMLElement>} - An array of elements that match the selector.
   */
  function all (selector) {
    return Array.from(document.querySelectorAll(selector))
  }
  /**
   * Process the product cards
   */
  const processProductCards = () =>
    all('.list.product-card:not(.ali-aio-handled)').map((element) =>
      processProductCard(element),
    )
  /**
   * Process the item rows
   */
  const processItemRows = () =>
    all('.items-list > .item:not(.ali-aio-handled)').map((element) =>
      processItemRow(element),
    )
  /**
   * Process the page
   */
  const process = () => {
    utils.log('process...')
    processProductCards()
    processItemRows()
  }
  const processDebounced = utils.debounce(process, 1000) // @ts-ignore
  globalThis.addEventListener('scroll', processDebounced)
})()
