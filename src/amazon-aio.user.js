// ==UserScript==
// @name         Amazon - All in one
// @namespace    https://github.com/Shuunen
// @version      1.0.0
// @description  Bigger listing
// @author       Romain Racamier-Lafon
// @match        https://*.amazon.fr/*
// @require      https://raw.githubusercontent.com/Shuunen/user-scripts/master/src/utils.js
// @grant        none
// ==/UserScript==

/**
 * Return the position of a value in an interval
 * @param {number} value
 * @param {number[]} intervals
 * @returns {number}
 */
const positionInInterval = (value, intervals) => {
  let ponderation = 0
  for (const interval of intervals) {
    if (value <= interval) break
    ponderation++
  }
  return ponderation
}

const maxScore = 16

/**
 * Calculate the score of a product based on its ratings and reviews count
 * @param {number} rating The product rating
 * @param {number} reviews The product reviews count
 * @param {boolean} explanation If true, the score explanation string will be returned
 * @returns {number|string} a score between 0 and maxScore
 */
const score = (rating, reviews, explanation = false) => {
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
 * @param {number} rating
 * @param {number} reviews
 * @returns {{ score: number, color: string, size: number }}
 */
const score20Styled = (rating, reviews) => {
  const data = { score: 0, color: 'black', size: 1 }
  const value = score(rating, reviews)
  if (typeof value === 'number') data.score = Math.round(value / maxScore * 20)
  const index = positionInInterval(data.score, [8, 12, 16])
  data.color = ['red', 'darkorange', 'black', 'darkgreen'][index] ?? 'grey'
  data.size = index + 1
  return data
}

(function AmazonAIO () {
  /* global Shuutils, module */
  if (typeof window === 'undefined') return
  const utils = new Shuutils({ id: 'amz-aio', debug: true })
  const selectors = {
    product: '[data-asin][data-component-type="s-search-result"]:not(.AdHolder):not(.amz-processed)',
    productRatingSection: '.s-title-instructions-style + div:not(.s-price-instructions-style)',
    productPrice: '.a-price-whole',
    productPriceCurrency: '.a-price-symbol',
  }
  const clearClassSelectors = {
    productLine: '.s-item-container',
  }
  const deleteUselessSelectors = {
    oldPrice: '.a-text-strike, #priceblock_saleprice_lbl, #vatMessage',
    badges: 'span.rush-component[data-component-type="s-coupon-component"], .a-badge-label, #acBadge_feature_div, #zeitgeistBadge_feature_div, .dotdBadge, .a-row.DEAL_OF_THE_DAY',
    ads: '.s-left-ads-item, .nav-swmslot, .GB-M-COMMON.GB-SHOVELER, #pdagSparkleAdFeedback, #detail-ilm_div, #quickPromoBucketContent, #sp_detail, #hqpWrapper, #productAlert_feature_div, #navSwmHoliday, #quickPromoDivId, [cel_widget_id^="adplacements"], [data-cel-widget^="percolate"], [data-cel-widget="nav_sitewide_msg"], [cel_widget_id^="dpx-sponsored"]',
    recommandations:
      '[data-component-type="s-impression-logger"], [cel_widget_id^="store-spotlight"], #raw-sitewide-rhf,[cel_widget_id^="MAIN-SHOPPING_ADVISER"],[cel_widget_id^="MAIN-VIDEO"],div[class^="_multi-card-creative"][data-mrkt], #rhf, [cel_widget_id^="tetris"], [cel_widget_id^="sims-consolidated"]',
    instantBuy: '#buyNow_feature_div, #oneClick_feature_div, [data-cel-widget="secureTransaction_feature_div"]',
    dashButtons: '#digitalDashHighProminence_feature_div',
    sharing: '#tellAFriendBox_feature_div',
    sellYours: '[data-cel-widget="moreBuyingChoices_feature_div"]',
    buyPack: '#sims-fbt',
    comparison: '#HLCXComparisonWidget_feature_div',
    relatedSearches: '.s-flex-geom',
    needHelp: '[data-cel-widget^="MAIN-FEEDBACK"]',
  }
  function deleteUseless () {
    for (const selector of Object.values(deleteUselessSelectors)) utils.findAll(selector, document, true).forEach((node) => {
      // node.style = 'background-color: red !important;color: white !important; box-shadow: 0 0 10px red;'
      node.remove()
    })
  }
  function clearClassnames () {
    for (const selector of Object.values(clearClassSelectors)) utils.findAll(selector, document, true).forEach((node) => {
      node.className = ''
    })
  }
  /**
   * Calculate the score by currency, eg: 0.52 pts/€
   * @param {HTMLElement} product
   * @param {number} score
   * @param {HTMLDivElement} scoreSection
   */
  function getScoreByCurrency (product, score, scoreSection) {
    let scoreByCurrency = 0
    const priceElement = utils.findOne(selectors.productPrice, product, true)
    if (!priceElement) return scoreByCurrency
    const scoreByCurrencySection = document.createElement('div')
    const price = Number.parseFloat(priceElement.textContent.replace(',', '.').replace(' ', ''))
    const currency = utils.findOne(selectors.productPriceCurrency, product, true).textContent
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
  function generateScoreSection (product, score, color, size) {
    const scoreSection = document.createElement('div')
    scoreSection.className = 'amz-aio-score a-spacing-top-micro'
    scoreSection.textContent = `${score}/20`
    scoreSection.style.color = color
    scoreSection.style.lineHeight = 'normal'
    scoreSection.style.fontSize = `${Math.max(size * 7, 14)}px`
    const scoreByCurrency = getScoreByCurrency(product, score, scoreSection)
    return { scoreSection, scoreByCurrency }
  }
  function injectScore () {
    const products = utils.findAll(selectors.product, document, true)
    // set amz-aio-score
    products.forEach((product) => {
      product.classList.add('amz-processed')
      product.dataset.amzAioScore = 0
      const ratingSection = utils.findOne(selectors.productRatingSection, product, true)
      if (!ratingSection) return
      const childs = ratingSection.firstChild.children
      const rating = Number.parseFloat(childs[0].getAttribute('aria-label').split(' ')[0].replace(',', '.'))
      const reviews = Number.parseInt(childs[1].getAttribute('aria-label').replace(/\W/g, ''))
      const { score, color, size } = score20Styled(rating, reviews)
      const { scoreSection, scoreByCurrency } = generateScoreSection(product, score, color, size)
      ratingSection.parentNode.insertBefore(scoreSection, ratingSection.nextSibling)
      product.dataset.amzAioScore = Math.round(score * score * scoreByCurrency * 70)
    })
    // sort by score & apply position
    products.sort((a, b) => (b.dataset.amzAioScore - a.dataset.amzAioScore)).forEach((product, index) => {
      product.style.order = index
    })
  }
  const process = () => {
    utils.log('process...')
    deleteUseless()
    clearClassnames()
    injectScore()
  }
  const processDebounced = utils.debounce(process, 500)
  utils.onPageChange(processDebounced)
  window.addEventListener('scroll', processDebounced)
})()

if (module) module.exports = {
  score, score20Styled, maxScore,
}
