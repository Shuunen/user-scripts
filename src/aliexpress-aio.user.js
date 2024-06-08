// ==UserScript==
// @name         AliExpress - All in one
// @namespace    https://github.com/Shuunen
// @version      1.0.2
// @description  Bigger listing
// @author       Romain Racamier-Lafon
// @match        https://*.aliexpress.com/*
// @require      https://cdn.jsdelivr.net/gh/Shuunen/user-scripts@2.4.0/src/utils.min.js
// @grant        none
// ==/UserScript==

/* eslint-disable func-style */
/* eslint-disable no-magic-numbers */
/* eslint-disable no-param-reassign */
/* eslint-disable max-statements */
/* eslint-disable consistent-return */

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
    /** @type HTMLImageElement | null */
    const img = element.querySelector('.item-img, img')
    if (!img?.src)
      return utils.error('cannot find image on card el', element)
    extendsImage(img)
    /** @type HTMLElement | null */
    const wrapper = img.closest('.product-img, a')
    if (!wrapper) return utils.error('failed to find wrapper of', img)
    wrapper.style.height = 'inherit'
    wrapper.style.width = 'inherit'
    element.style.display = 'flex'
    /** @type HTMLElement | null */
    const zone = element.querySelector('.right-zone')
    if (!zone) return utils.error('cannot find zone on card el', element)
    zone.style.paddingLeft = '16px'
    zone.style.marginTop = '16px'
    /** @type HTMLElement | null */// @ts-ignore
    const sibling = zone.previousElementSibling
    if (sibling) sibling.style.width = '80%'
    element.classList.add('ali-aio-handled')
  }
  /** @param {HTMLElement} element */
  function processItemRow (element) {
    /** @type HTMLImageElement | null */
    const img = element.querySelector('.pic-core')
    if (!img?.src) return utils.error('cannot find image on row el', element)
    utils.log('image src was', img.src)
    extendsImage(img, 500)
    utils.log('now image src is', img.src)
    /** @type HTMLElement | null */
    let wrapper = img.closest('.pic')
    if (!wrapper) return utils.error('failed to find wrapper of', img)
    wrapper.style.height = 'inherit'
    wrapper.style.width = 'inherit'
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
  const processProductCards = () =>
    all('.list.product-card:not(.ali-aio-handled)').map((element) =>
      processProductCard(element),
    )
  const processItemRows = () =>
    all('.items-list > .item:not(.ali-aio-handled)').map((element) =>
      processItemRow(element),
    )
  const process = () => {
    utils.log('process...')
    processProductCards()
    processItemRows()
  }
  const processDebounced = utils.debounce(process, 1000) // @ts-ignore
  window.addEventListener('scroll', processDebounced)
})()
