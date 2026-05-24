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
// @require      https://cdn.jsdelivr.net/gh/Shuunen/monorepo@latest/apps/user-scripts/src/utils.js
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

  /**
   * Hide an element for a reason
   * @param {HTMLElement} element the element to hide
   * @param {string} reason the reason why the element is hidden
   * @returns {void}
   */
  function hideElement(element, reason) {
    if (utils.willDebug) {
      element.style.backgroundColor = 'red !important'
      element.style.color = 'white !important'
      element.style.boxShadow = '0 0 10px red'
      element.style.opacity = '70'
    } else {
      element.style.display = 'none'
      element.style.opacity = '0'
    }
    element.dataset.hiddenCause = reason
  }

  function hideUseless() {
    let nb = 0
    for (const selector of Object.values(uselessSelectors))
      for (const node of utils.findAll(`${selector}:not([data-hidden-cause])`, document, true)) {
        hideElement(node, 'useless')
        nb += 1
      }
    if (nb > 0) utils.debug(`hideUseless has hidden ${nb} elements`)
  }

  function hideUnavailableProducts() {
    const messages = utils.findAll('.product-unavailable__message', document, true)
    let nb = 0
    for (const message of messages) {
      const product = message.closest('article')
      if (!product) throw new Error('No product found from unavailable message')
      hideElement(product, 'unavailable')
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
    hideUseless()
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
