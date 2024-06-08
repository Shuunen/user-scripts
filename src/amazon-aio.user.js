// ==UserScript==
// @name         Amazon - All in one
// @namespace    https://github.com/Shuunen
// @version      1.0.0
// @description  Bigger listing
// @author       Romain Racamier-Lafon
// @match        https://*.amazon.fr/*
// @require      https://cdn.jsdelivr.net/gh/Shuunen/user-scripts@2.4.0/src/utils.min.js
// @grant        none
// ==/UserScript==

/* eslint-disable func-style */
/* eslint-disable no-magic-numbers */
/* eslint-disable no-param-reassign */
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
const calcScore = (rating, reviews, explanation = false) => { // eslint-disable-line @typescript-eslint/naming-convention
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
  if (typeof window === 'undefined') return
  /** @type {import('./utils.js').Shuutils} */// @ts-ignore
  const utils = new Shuutils('amz-aio')
  const selectors = {
    product: '[data-asin][data-component-type="s-search-result"]:not(.AdHolder):not(.amz-processed)',
    productPrice: '.a-price-whole',
    productPriceCurrency: '.a-price-symbol',
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
  function deleteUseless () {
    for (const selector of Object.values(deleteUselessSelectors)) utils.findAll(selector, document, true).forEach((node) => {
      // node.style = 'background-color: red !important;color: white !important; box-shadow: 0 0 10px red;'
      node.remove()
    })
  }
  function clearClassnames () {
    for (const selector of Object.values(clearClassSelectors)) utils.findAll(selector, document, true).forEach((node) => {
      // eslint-disable-next-line unicorn/no-keyword-prefix
      node.className = ''
    })
  }
  /**
   * Calculate the score by currency, eg: 0.52 pts/€
   * @param {HTMLElement} product The product
   * @param {number} score The score
   * @param {HTMLDivElement} scoreSection The score section
   * @returns {number} The score by currency
   */
  function getScoreByCurrency (product, score, scoreSection) {
    let scoreByCurrency = 0
    const priceElement = utils.findOne(selectors.productPrice, product, true)
    if (!priceElement) return scoreByCurrency
    const scoreByCurrencySection = document.createElement('div')
    const price = Number.parseFloat(priceElement.textContent?.replace(',', '.')?.replace(' ', '') ?? '0')
    const currency = utils.findOne(selectors.productPriceCurrency, product, true)?.textContent ?? '€'
    scoreByCurrency = Math.round(score / price * 100) / 100
    scoreByCurrencySection.textContent += `${scoreByCurrency.toFixed(2)}pts/${currency}`
    const index = positionInInterval(scoreByCurrency, [0.2, 0.3, 0.4])
    scoreByCurrencySection.style.color = ['red', 'darkorange', 'black', 'darkgreen'][index] ?? 'grey'
    scoreSection.append(document.createElement('br'), scoreByCurrencySection)
    return scoreByCurrency
  }
  /**
   * Get the product score section
   * @param {HTMLElement} product
   * @param {number} score
   * @param {string} color
   * @param {number} size
   * @returns {{ scoreSection:HTMLElement, scoreByCurrency:number }}
   */
  // eslint-disable-next-line max-params
  function generateScoreSection (product, score, color, size) {
    const scoreSection = document.createElement('div')
    // eslint-disable-next-line unicorn/no-keyword-prefix
    scoreSection.className = 'amz-aio-score a-spacing-top-micro'
    scoreSection.textContent = `${score}/20`
    scoreSection.style.color = color
    scoreSection.style.lineHeight = 'normal'
    scoreSection.style.fontSize = `${Math.max(size * 7, 14)}px`
    const scoreByCurrency = getScoreByCurrency(product, score, scoreSection)
    return { scoreByCurrency, scoreSection }
  }
  function injectScore () {
    const products = utils.findAll(selectors.product, document, true)
    // set amz-aio-score
    products.forEach((product) => {
      product.classList.add('amz-processed')
      product.dataset.amzAioScore = '0'
      const ratingSection = utils.findOne(selectors.productRatingSection, product, true)
      if (!ratingSection) return
      // @ts-ignore
      const children = ratingSection.firstChild?.children
      const rating = Number.parseFloat(children[0].getAttribute('aria-label').split(' ')[0].replace(',', '.'))
      const reviews = Number.parseInt(children[1].getAttribute('aria-label').replace(/\W/gu, ''), 10)
      const { color, score, size } = score20Styled(rating, reviews)
      const { scoreByCurrency, scoreSection } = generateScoreSection(product, score, color, size)
      ratingSection.parentNode?.insertBefore(scoreSection, ratingSection.nextSibling)
      product.dataset.amzAioScore = Math.round(score * score * scoreByCurrency * 70).toString()
    })
    // sort by score & apply position
    // eslint-disable-next-line etc/no-assign-mutated-array
    products.sort((productA, productB) => (Number.parseFloat(productB.dataset.amzAioScore ?? '0') - Number.parseFloat(productA.dataset.amzAioScore ?? '0'))).forEach((product, index) => {
      product.style.order = index.toString()
    })
  }
  const process = () => {
    utils.log('process...')
    deleteUseless()
    clearClassnames()
    injectScore()
  }
  const processDebounced = utils.debounce(process, 500)
  void utils.onPageChange(processDebounced)
  window.addEventListener('scroll', () => processDebounced())
})()

if (module) module.exports = {
  maxScore, score: calcScore, score20Styled,
}
