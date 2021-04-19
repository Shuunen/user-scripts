// ==UserScript==
// @name         Amazon - Clearer
// @namespace    https://github.com/Shuunen
// @version      1.0.6
// @description  Un-clutter Amazon website
// @author       Romain Racamier-Lafon
// @match        https://www.amazon.fr/*
// @require      https://raw.githubusercontent.com/Shuunen/user-scripts/master/src/utils.js
// @grant        none
// ==/UserScript==

(function AmazonClearer() {
  /* global document, Shuutils */
  const utils = new Shuutils({ id: 'amz-clr', debug: false })
  const selectors = {
    productLine: '.s-item-container',
  }
  const uselessSelectors = {
    oldPrice: '.a-text-strike, #priceblock_saleprice_lbl, #vatMessage',
    badges: 'span.rush-component[data-component-type="s-coupon-component"], .a-badge-label, #acBadge_feature_div, #zeitgeistBadge_feature_div, .dotdBadge, .a-row.DEAL_OF_THE_DAY',
    ads: '.s-left-ads-item, .nav-swmslot, .GB-M-COMMON.GB-SHOVELER, #pdagSparkleAdFeedback, #detail-ilm_div, #quickPromoBucketContent, #sp_detail, #hqpWrapper, #productAlert_feature_div, #navSwmHoliday, #quickPromoDivId, [cel_widget_id^="adplacements"], [data-cel-widget^="percolate"], [data-cel-widget="nav_sitewide_msg"], [cel_widget_id^="dpx-sponsored"]',
    recommandations: '[data-component-type="s-impression-logger"], [cel_widget_id^="store-spotlight"], #raw-sitewide-rhf,[cel_widget_id^="MAIN-SHOPPING_ADVISER"],[cel_widget_id^="MAIN-VIDEO"],div[class^="_multi-card-creative"][data-mrkt], #rhf, [cel_widget_id^="tetris"], [cel_widget_id^="sims-consolidated"]',
    instantBuy: '#buyNow_feature_div, #oneClick_feature_div, [data-cel-widget="secureTransaction_feature_div"]',
    dashButtons: '#digitalDashHighProminence_feature_div',
    sharing: '#tellAFriendBox_feature_div',
    sellYours: '[data-cel-widget="moreBuyingChoices_feature_div"]',
    buyPack: '#sims-fbt',
    comparison: '#HLCXComparisonWidget_feature_div',
  }
  function deleteUseless() {
    Object.keys(uselessSelectors).forEach(key => {
      utils.findAll(uselessSelectors[key], document, true).forEach(node => {
        if (utils.app.debug) node.style = 'background-color: red !important;color: white !important; box-shadow: 0 0 10px red;'
        else node.remove()
      })
    })
  }
  function cosmeticChanges() {
    utils.findAll(selectors.productLine, document, true).forEach(node => {
      node.className = ''
    })
  }
  function process() {
    utils.log('processing')
    deleteUseless()
    cosmeticChanges()
  }
  process()
  setTimeout(() => process(), 500)
  setTimeout(() => process(), 1000)
  setTimeout(() => process(), 1500)
  const processDebounced = utils.debounce(process, 500)
  document.addEventListener('scroll', processDebounced)
})()
