// ==UserScript==
// @author       Romain Racamier-Lafon
// @description  Bigger listing
// @downloadURL  https://github.com/Shuunen/user-scripts/raw/master/src/amazon-aio.user.js
// @grant        none
// @match        https://*.amazon.fr/*
// @name         Amazon - All in one
// @namespace    https://github.com/Shuunen
// @require      https://cdn.jsdelivr.net/gh/Shuunen/user-scripts/src/utils.js
// @version      1.0.2
// ==/UserScript==

/* eslint-disable no-magic-numbers */
/* eslint-disable max-statements */

/**
 * Return the position of a value in an interval
 * @param {number} value The value
 * @param {number[]} intervals The intervals
 * @returns {number} the position of the value in the interval
 */
const positionInInterval = (value, intervals) => {
  let weight = 0
  for (const interval of intervals) {
    if (value <= interval) break
    weight += 1
  }
  return weight
}

const maxScore = 16

/**
 * Calculate the score of a product based on its ratings and reviews count
 * @param {number} rating The product rating
 * @param {number} reviews The product reviews count
 * @param {boolean} explanation If true, the score explanation string will be returned
 * @returns {number|string} a score between 0 and maxScore
 */
const calcScore = (rating, reviews, explanation = false) => {
  const ratingScore = positionInInterval(rating, [2, 3, 4, 4.1, 4.2, 4.3, 4.4, 4.5, 4.6, 4.7, 4.8, 4.9, 5])
  const reviewsScore = ratingScore ? positionInInterval(reviews, [4, 8, 16, 32]) : 0
  let score = ratingScore + reviewsScore
  if (reviewsScore === 0) score *= .3
  if (reviewsScore === 1) score *= .5
  if (explanation) return `${score}pts (rating: ${rating}, ratingScore: ${ratingScore}, reviews: ${reviews}, reviewsScore: ${reviewsScore})`
  return score
}

/**
 * Get the score of a product /20 and give its style
 * @param {number} rating The product rating
 * @param {number} reviews The product reviews count
 * @returns {{ score: number, color: string, size: number }} The score, its color and its size
 */
const score20Styled = (rating, reviews) => {
  const data = { color: 'black', score: 0, size: 1 }
  const value = calcScore(rating, reviews)
  if (typeof value === 'number') data.score = Math.round(value / maxScore * 20)
  const index = positionInInterval(data.score, [8, 12, 16])
  data.color = ['red', 'darkorange', 'black', 'darkgreen'][index] ?? 'grey'
  data.size = index + 1
  return data
}

(function amazonAio () {
  if (globalThis.matchMedia === undefined) return
  /** @type {import('./utils.js').Shuutils} */// @ts-ignore
  const utils = new Shuutils('amz-aio')
  const selectors = {
    product: '[data-asin][data-component-type="s-search-result"]:not(.AdHolder):not(.amz-processed)',
    productPrice: '.a-price-whole',
    productPriceCurrency: '.a-price-symbol',
    productPricePerWeight: '.a-price + .a-size-base',
    productRatingSection: '.s-title-instructions-style + div:not(.s-price-instructions-style)',
  }
  const clearClassSelectors = {
    productLine: '.s-item-container',
  }
  const deleteUselessSelectors = {
    ads: '.s-left-ads-item, .nav-swmslot, .GB-M-COMMON.GB-SHOVELER, #pdagSparkleAdFeedback, #detail-ilm_div, #quickPromoBucketContent, #sp_detail, #hqpWrapper, #productAlert_feature_div, #navSwmHoliday, #quickPromoDivId, [cel_widget_id^="adplacements"], [data-cel-widget^="percolate"], [data-cel-widget="nav_sitewide_msg"], [cel_widget_id^="dpx-sponsored"]',
    badges: 'span.rush-component[data-component-type="s-coupon-component"], .a-badge-label, #acBadge_feature_div, #zeitgeistBadge_feature_div, .dotdBadge, .a-row.DEAL_OF_THE_DAY',
    buyPack: '#sims-fbt',
    comparison: '#HLCXComparisonWidget_feature_div',
    dashButtons: '#digitalDashHighProminence_feature_div',
    instantBuy: '#buyNow_feature_div, #oneClick_feature_div, [data-cel-widget="secureTransaction_feature_div"]',
    needHelp: '[data-cel-widget^="MAIN-FEEDBACK"]',
    oldPrice: '.a-text-strike, #priceblock_saleprice_lbl, #vatMessage',
    recommandations:
      '[data-component-type="s-impression-logger"], [cel_widget_id^="store-spotlight"], #raw-sitewide-rhf,[cel_widget_id^="MAIN-SHOPPING_ADVISER"],[cel_widget_id^="MAIN-VIDEO"],div[class^="_multi-card-creative"][data-mrkt], #rhf, [cel_widget_id^="tetris"], [cel_widget_id^="sims-consolidated"]',
    relatedSearches: '.s-flex-geom',
    sellYours: '[data-cel-widget="moreBuyingChoices_feature_div"]',
    sharing: '#tellAFriendBox_feature_div',
  }
  /**
   * Delete useless elements
   */
  function deleteUseless () {
    for (const selector of Object.values(deleteUselessSelectors)) for (const node of utils.findAll(selector, document, true))
      // node.style = 'background-color: red !important;color: white !important; box-shadow: 0 0 10px red;'
      node.remove()
  }
  /**
   * Clear classnames of some elements to remove their styles
   */
  function clearClassnames () {
    for (const selector of Object.values(clearClassSelectors)) for (const node of utils.findAll(selector, document, true))
      // eslint-disable-next-line unicorn/no-keyword-prefix
      node.className = ''
  }
  /**
   * Get the price in a text
   * @param {string} text The text
   * @returns {number} The price
   */
  function getPrice (text) {
    const price = Number.parseFloat(text.replace(',', '.').replace(/\s/u, '') ?? '0')
    if (price === 0) utils.warn('failed to calc price from', { text })
    return price
  }
  /**
   * Get the price of an element
   * @param {HTMLElement} element The element
   * @returns {number} The price
   */
  function getPriceInElement (element) {
    const text = element.textContent ?? ''
    if (text === '') {
      utils.warn('failed to find textContent in', element)
      return 0
    }
    return getPrice(text)
  }
  /**
   * Calculate the score by currency, eg: 0.52 pts/€
   * @param {number} price The price, like 12.99
   * @param {string} currency The currency, like "€"
   * @param {number} score The score, like 16
   * @param {HTMLDivElement} scoreSection The score section
   * @returns {number} The score by currency
   */
  // eslint-disable-next-line max-params
  function getScoreByCurrency (price, currency, score, scoreSection) {
    const scoreByCurrencySection = document.createElement('div')
    const scoreByCurrency = Math.round(score / price * 100) / 100
    scoreByCurrencySection.textContent += `💯 ${scoreByCurrency.toFixed(2)} pts/${currency}`
    const index = positionInInterval(scoreByCurrency, [0.2, 0.3, 0.4])
    scoreByCurrencySection.style.color = ['red', 'darkorange', 'black', 'darkgreen'][index] ?? 'grey'
    scoreByCurrencySection.title = `Score: ${score} / 20, price: ${price} ${currency}`
    scoreSection.append(document.createElement('br'), scoreByCurrencySection)
    return scoreByCurrency
  }
  /**
   * Add the price per weight to the score section
   * @param {object} parameters The parameters
   * @param {HTMLElement} parameters.product The product element
   * @param {number} parameters.price The price
   * @param {string} parameters.currency The currency
   * @param {HTMLElement} parameters.scoreSection The score section
   * @returns {void} nothing and alter the score section dom element
   */
  // eslint-disable-next-line complexity
  function addPricePerWeight ({ currency, price, product, scoreSection }) {
    const pricePerWeightElement = product.querySelector(selectors.productPricePerWeight)
    const pricePerWeightSection = document.createElement('div')
    if (pricePerWeightElement) {
      const text = pricePerWeightElement.textContent
      const { currencyPer = '', pricePer = '', unitPer = '' } = /(?<pricePer>\d?\s?\d+[,.]\d+)(?<currencyPer>€)\/(?<unitPer>\w+)/u.exec(pricePerWeightElement.textContent ?? '')?.groups ?? {}
      const priceParsed = getPrice(pricePer)
      const priceRound = Math.round(priceParsed)
      if (pricePer === '') utils.warn('failed to find price in :', text)
      if (currencyPer === '') utils.warn('failed to find currency in :', text)
      if (unitPer === '') utils.warn('failed to find unit in :', text)
      if (unitPer === 'kg') pricePerWeightSection.textContent = `${priceRound} ${currencyPer}/${unitPer}`
      utils.debug({ currencyPer, priceParsed, pricePer, priceRound, text, unitPer })
    }
    if (pricePerWeightSection.textContent === '') {
      const title = utils.findOne('h2', product, true)?.textContent ?? ''
      if (title === '') { utils.warn('failed to find title in', product); return }
      const { unitPer = '', weightPer = '' } = /(?<weightPer>\d+)\s?(?<unitPer>[kKgG]+)/u.exec(title)?.groups ?? {}
      if (weightPer === '') { utils.log('failed to find weight in :', title); return }
      if (unitPer === '') { utils.log('failed to find unit in :', title); return }
      const grams = unitPer.toLowerCase() === 'g' ? Number.parseInt(weightPer, 10) : (unitPer.toLowerCase() === 'kg' ? Number.parseInt(weightPer, 10) * 1000 : 0)
      if (grams === 0) { utils.warn('failed to find calc grams in', { title, unitPer, weightPer }); return }
      const pricePerKg = Math.round(price / grams * 1000)
      pricePerWeightSection.textContent = `${pricePerKg} ${currency}/kg`
      utils.debug({ grams, innerHtml: pricePerWeightSection.innerHTML, price, pricePerKg, title, unitPer, weightPer })
    }
    if (pricePerWeightSection.textContent === '') return
    pricePerWeightSection.textContent = `⚖️ ${pricePerWeightSection.textContent}`
    scoreSection.append(pricePerWeightSection)
  }
  /**
   * Get the product score section
   * @param {object} parameters The parameters
   * @param {HTMLElement} parameters.product The product element
   * @param {number} parameters.score The score of the product, like 16 (out of 20)
   * @param {string} parameters.color The color
   * @param {number} parameters.size The size
   * @param {number} parameters.rating The rating of the product, like 4.2 (out of 5)
   * @param {number} parameters.reviews The number of reviews, like 30
   * @returns {{ scoreSection:HTMLElement, scoreByCurrency:number }} The score section and the score by currency
   */
  function generateScoreSection ({ color, product, rating, reviews, score, size }) {
    const scoreSection = document.createElement('div')
    // eslint-disable-next-line unicorn/no-keyword-prefix
    scoreSection.className = 'amz-aio-score a-spacing-top-micro'
    const on20 = document.createElement('span')
    on20.textContent = `💯 ${score}/20`
    on20.title = `Rating: ${rating} / 5, reviews: ${reviews}`
    on20.style.color = color
    scoreSection.style.lineHeight = 'normal'
    scoreSection.style.fontSize = `${Math.max(size * 7, 14)}px`
    scoreSection.append(on20)
    const priceElement = utils.findOne(selectors.productPrice, product, true)
    if (!priceElement) return { scoreByCurrency: 0, scoreSection }
    const price = getPriceInElement(priceElement)
    const currency = utils.findOne(selectors.productPriceCurrency, product, true)?.textContent ?? '€'
    const scoreByCurrency = getScoreByCurrency(price, currency, score, scoreSection)
    addPricePerWeight({ currency, price, product, scoreSection })
    return { scoreByCurrency, scoreSection }
  }
  /**
   * Get the rating from an element
   * @param {HTMLElement} element The element
   * @returns {number} The rating or review count
   */
  function getRating (element) {
    const html = element.outerHTML
    const value = /\d[,.]\d ?/u.exec(html)?.[0] ?? '0'
    const count = Number.parseFloat(value.replace(',', '.'))
    if (count === 0) utils.warn('failed to find rating in', element)
    return count
  }
  /**
   * Get the reviews count from an element
   * @param {HTMLElement} element The element
   * @returns {number} The reviews count
   */
  function getReviews (element) {
    const html = element.outerHTML
    const { p1 = '', p2 = '' } = /"(?<p1>\d+)(?:&nbsp;)?(?<p2>\d+)&nbsp;/u.exec(html)?.groups ?? {}
    const parts = p1 + p2
    const count = Number.parseInt(parts || '0', 10)
    if (count === 0) utils.warn('failed to find reviews count in', element)
    return count
  }
  /**
   * Inject the score in the page
   */
  function injectScore () {
    const products = utils.findAll(selectors.product, document, true)
    // set amz-aio-score
    for (const product of products) {
      product.classList.add('amz-processed')
      product.dataset.amzAioScore = '0'
      const title = utils.findOne('h2', product, true)?.textContent ?? ''
      const ratingSection = utils.findOne(selectors.productRatingSection, product, true)
      if (!ratingSection) continue
      // @ts-ignore
      const children = Array.from(ratingSection.firstChild?.children)
      const rating = getRating(children.at(0))
      const reviews = getReviews(children.at(-1))
      const { color, score, size } = score20Styled(rating, reviews)
      const { scoreByCurrency, scoreSection } = generateScoreSection({ color, product, rating, reviews, score, size })
      utils.log({ rating, reviews, score, scoreByCurrency, title })
      ratingSection.parentNode?.insertBefore(scoreSection, ratingSection.nextSibling)
      product.dataset.amzAioScore = Math.round(score * score * scoreByCurrency * 70).toString()
    }
    // sort by score & apply position
    for (const [index, product] of products.sort((productA, productB) => (Number.parseFloat(productB.dataset.amzAioScore ?? '0') - Number.parseFloat(productA.dataset.amzAioScore ?? '0'))).entries())
      product.style.order = index.toString()
  }
  /**
   * Process the page
   */
  const process = () => {
    utils.log('process...')
    deleteUseless()
    clearClassnames()
    injectScore()
  }
  const processDebounced = utils.debounce(process, 500)
  utils.onPageChange(processDebounced)
  globalThis.addEventListener('scroll', () => processDebounced())
})()

if (module) module.exports = {
  maxScore, score: calcScore, score20Styled,
}
