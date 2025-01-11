// ==UserScript==
// @author       Romain Racamier-Lafon
// @description  Improve Instagram UX
// @downloadURL  https://github.com/Shuunen/user-scripts/raw/master/src/instagram-wide.user.js
// @grant        none
// @match        https://*.instagram.com/*
// @name         Instagram Wide
// @namespace    https://github.com/Shuunen
// @require      https://cdn.jsdelivr.net/gh/Shuunen/user-scripts/src/utils.js
// @version      1.0.2
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

  function showVideoControls () {
    /** @type {HTMLVideoElement[]} */
    const videos = Array.from(document.querySelectorAll('video:not([controls])'))
    if (videos.length === 0) return
    for (const video of videos) {
      video.controls = true
      // @ts-ignore
      if (video.nextElementSibling) video.nextElementSibling.style.pointerEvents = 'none'
    }
    utils.log(`video controls added to ${videos.length} video${videos.length > 1 ? 's' : ''}`)
  }

  function enlargeMain () {
    const main = utils.findOne(selectors.main)
    if (main === undefined) {
      utils.warn('Could not find main element')
      return
    }
    main.style.padding = '60px'
    main.style.width = '100%'
    main.style.maxWidth = '1000px'
  }

  function enlargeFeed () {
    const feed = utils.findOne(selectors.feed)
    if (feed === undefined) {
      utils.warn('Could not find feed element')
      return
    }
    feed.style.width = '100%'
  }


  function enlargeWrappers () {
    const wrappers = utils.findAll(selectors.wrapper)
    if (wrappers.length === 0) {
      utils.warn('Could not find wrapper elements')
      return
    }
    for (const wrapper of wrappers) {
      wrapper.style.width = '100%'
      if (wrapper.parentElement) wrapper.parentElement.style.width = '100%'
      if (wrapper.parentElement?.parentElement) wrapper.parentElement.parentElement.style.width = '100%'
    }
  }

  function process (reason = 'unknown') {
    utils.debug(`process called because "${reason}"`)
    utils.hideElements(uselessSelectors, 'useless')
    enlargeMain()
    enlargeFeed()
    enlargeWrappers()
    showVideoControls()
  }

  const processDebounced = utils.debounce(process, 300) // eslint-disable-line no-magic-numbers
  globalThis.addEventListener('scroll', () => processDebounced('scroll'))
  utils.onPageChange(() => processDebounced('page-change'))
})()
