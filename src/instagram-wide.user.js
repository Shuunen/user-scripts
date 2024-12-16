// ==UserScript==
// @name         Instagram Wide
// @downloadURL  https://github.com/Shuunen/user-scripts/raw/master/src/instagram-wide.user.js
// @namespace    https://github.com/Shuunen
// @version      1.0.0
// @description  Improve Instagram UX
// @author       Romain Racamier-Lafon
// @match        https://*.instagram.com/*
// @require      https://cdn.jsdelivr.net/gh/Shuunen/user-scripts@latest/src/utils.min.js
// @grant        none
// ==/UserScript==

/* eslint-disable jsdoc/require-jsdoc */

// eslint-disable-next-line max-statements
(function instagramWide () {

  /** @type {import('./utils.js').Shuutils} */// @ts-ignore
  const utils = new Shuutils('instagram-wide')
  const uselessSelectors = {
    sidebar: 'main > div > div + div', // useless account suggestions
  }
  const selectors = {
    feed: 'main > div > div > div > div:last-child > div',
    main: 'main > div > div',
    wrapper: '[aria-hidden="true"][tabindex="0"][role="button"] > div[style]',
  }

  /**
   * Hide an element for a reason
   * @param {HTMLElement} element the element to hide
   * @param {string} reason the reason why the element is hidden
   * @returns {void}
   */
  function hideElement (element, reason) {
    if (utils.willDebug) {
      element.style.backgroundColor = 'red !important'
      element.style.color = 'white !important'
      element.style.boxShadow = '0 0 10px red'
      element.style.opacity = '70'
      element.style.filter = 'blur(1px)'
    } else {
      element.style.display = 'none'
      element.style.opacity = '0'
    }
    element.dataset.hiddenCause = reason
  }

  function hideUseless () {
    let nb = 0
    for (const selector of Object.values(uselessSelectors)) for (const node of utils.findAll(`${selector}:not([data-hidden-cause])`, document, true)) {
      hideElement(node, 'useless')
      nb += 1
    }
    if (nb > 0) utils.debug(`hideUseless has hidden ${nb} elements`)
  }


  function enlargeMain () {
    const main = utils.findOne(selectors.main)
    if (main === undefined) {
      utils.showError('Could not find main element')
      return
    }
    main.style.padding = '60px'
    main.style.width = '100%'
    main.style.maxWidth = '1000px'
  }

  function enlargeFeed () {
    const feed = utils.findOne(selectors.feed)
    if (feed === undefined) {
      utils.showError('Could not find feed element')
      return
    }
    feed.style.width = '100%'
  }


  function enlargeWrappers () {
    const wrappers = utils.findAll(selectors.wrapper)
    if (wrappers.length === 0) {
      utils.showError('Could not find wrapper elements')
      return
    }
    for (const wrapper of wrappers) {
       wrapper.style.width = '100%'
       if(wrapper.parentElement) wrapper.parentElement.style.width = '100%'
       if(wrapper.parentElement?.parentElement) wrapper.parentElement.parentElement.style.width = '100%'
    }

  }

  function process (reason = 'unknown') {
    utils.debug(`process called because "${reason}"`)
    hideUseless()
    enlargeMain()
    enlargeFeed()
    enlargeWrappers()
  }

  const processDebounced = utils.debounce(process, 300) // eslint-disable-line no-magic-numbers
  globalThis.addEventListener('scroll', () => processDebounced('scroll'))
  utils.onPageChange(() => processDebounced('page-change'))
})()
