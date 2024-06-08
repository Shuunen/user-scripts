// ==UserScript==
// @name         Amazon Takeout - Get data with you
// @namespace    https://github.com/Shuunen
// @match        https://www.amazon.*/*
// @grant        none
// @version      1.0.0
// @require      https://cdn.jsdelivr.net/gh/Shuunen/user-scripts@master/src/utils.min.js
// @author       Shuunen
// @description  This script let you export data from Amazon
// ==/UserScript==

(function AmazonTakeout () {
  /** @type {import('./utils.js').Shuutils} */// @ts-ignore
  const utils = new Shuutils('amz-tko')
  function init () {
    utils.log('Start...')
  }
  const initDebounced = utils.debounce(init, 500) // eslint-disable-line no-magic-numbers
  initDebounced()
  void utils.onPageChange(initDebounced)
})()

