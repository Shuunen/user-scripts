// ==UserScript==
// @name         Auchan - All in one
// @author       Romain Racamier-Lafon
// @description  Improve Auchan UX
// @downloadURL  https://github.com/Shuunen/user-scripts/raw/master/src/auchan-aio.user.js
// @updateURL    https://github.com/Shuunen/user-scripts/raw/master/src/auchan-aio.user.js
// @grant        none
// @match        https://www.auchan.fr/*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=auchan.fr
// @namespace    https://github.com/Shuunen
// @require      https://cdn.jsdelivr.net/gh/Shuunen/user-scripts@master/src/utils.js
// @version      1.0.3
// ==/UserScript==

function AuchanAio() {
  const utils = new Shuutils('auchan-aio')
  const uselessSelectors = {
    productIcon: '.product-thumbnail__icon', // useless icon like "Frais", "Vegan", "Bio"...
    promoCard: 'article.picture-thumbnail',
    promoTag: '.product-flap', // best of promo tag above product
    unitPrice: '.product-price__container', // unit price is not useful
  }

  function hideUnavailableProducts() {
    const messages = utils.findAll('.product-unavailable__message', document, true)
    let nb = 0
    for (const message of messages) {
      const product = message.closest('article')
      if (!product) throw new Error('No product found from unavailable message')
      utils.hideElement(product, 'unavailable')
      nb += 1
    }
    if (nb > 0) utils.debug(`hideUnavailableProducts has hidden ${nb} elements`)
  }

  function enhancePricePerKgReadability() {
    let nb = 0
    const prices = utils.findAll('.product-thumbnail__attributes:not(.bolder)', document, true)
    for (const price of prices) {
      price.classList.add('bolder')
      nb += 1
    }
    if (nb > 0) utils.debug(`enhancePricePerKgReadability has processed ${nb} elements`)
  }

  function start(reason = 'unknown') {
    utils.debug(`start called because "${reason}"`)
    utils.hideElements(uselessSelectors, 'useless')
    hideUnavailableProducts()
    enhancePricePerKgReadability()
  }

  const startDebounced = utils.debounce(start, 300)
  globalThis.addEventListener('focus', () => startDebounced('focus'))
  globalThis.addEventListener('click', () => startDebounced('click'))
  globalThis.addEventListener('scroll', () => startDebounced('scroll'))
  utils.onPageChange(() => startDebounced('page-change'))
  utils.injectStyles(`
  .product-thumbnail__attributes {
    font-size: 24px;
    display: flex;
    flex-direction: column;
  }
  .product-thumbnail__commercials,
  .product-thumbnail__footer-wrapper {
    justify-content: flex-end;
  }
  button.btn {
    background-color: #dc3c31;
    border: none;
  }
  div.discount-markups {
    width: auto;
    margin-bottom: 5px;
  }
  `)
}

if (globalThis.window) AuchanAio()
