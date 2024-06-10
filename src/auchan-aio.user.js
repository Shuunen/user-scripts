// ==UserScript==
// @name         Auchan - All in one
// @downloadURL  https://github.com/Shuunen/user-scripts/raw/master/src/auchan-aio.user.js
// @namespace    https://github.com/Shuunen
// @version      1.0.0
// @description  Improve Auchan UX
// @author       Romain Racamier-Lafon
// @match        https://*.auchan.fr/*
// @require      https://cdn.jsdelivr.net/gh/Shuunen/user-scripts@2.6.1/src/utils.min.js
// @grant        none
// ==/UserScript==

// eslint-disable-next-line max-statements
(function auchanAio () {

  /** @type {import('./utils.js').Shuutils} */// @ts-ignore
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
  function hideElement (element, reason) {
    /* eslint-disable no-param-reassign */
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
    /* eslint-enable no-param-reassign */
  }

  function hideUseless () {
    let nb = 0
    // eslint-disable-next-line no-loop-func
    for (const selector of Object.values(uselessSelectors)) utils.findAll(`${selector}:not([data-hidden-cause])`, document, true).forEach((node) => {
      hideElement(node, 'useless')
      nb += 1
    })
    if (nb > 0) utils.debug(`hideUseless has hidden ${nb} elements`)
  }

  function hideUnavailableProducts () {
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

  function enhancePricePerKgReadability () {
    let nb = 0
    const prices = utils.findAll('.product-thumbnail__attributes:not(.bolder)', document, true)
    for (const price of prices) {
      price.classList.add('bolder')
      nb += 1
    }
    if (nb > 0) utils.debug(`enhancePricePerKgReadability has processed ${nb} elements`)
  }

  function process (reason = 'unknown') {
    utils.debug(`process called because "${reason}"`)
    hideUseless()
    hideUnavailableProducts()
    enhancePricePerKgReadability()
  }

  const processDebounced = utils.debounce(process, 300) // eslint-disable-line no-magic-numbers
  window.addEventListener('focus', () => processDebounced('focus'))
  window.addEventListener('click', () => processDebounced('click'))
  window.addEventListener('scroll', () => processDebounced('scroll'))
  void utils.onPageChange(() => processDebounced('page-change'))

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
})()
