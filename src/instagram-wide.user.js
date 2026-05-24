// ==UserScript==
// @name         Instagram Wide
// @author       Romain Racamier-Lafon
// @description  Improve Instagram UX
// @downloadURL  https://github.com/Shuunen/user-scripts/raw/master/src/instagram-wide.user.js
// @updateURL    https://github.com/Shuunen/user-scripts/raw/master/src/instagram-wide.user.js
// @grant        none
// @match        https://www.instagram.com/*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=instagram.com
// @namespace    https://github.com/Shuunen
// @require      https://cdn.jsdelivr.net/gh/Shuunen/user-scripts@latest/src/utils.js
// @version      1.0.3
// ==/UserScript==

function InstagramWide() {
  const utils = new Shuutils('instagram-wide')
  const uselessSelectors = {
    sidebar: 'main > div > div + div', // useless account suggestions
  }
  const selectors = {
    feed: 'main > div > div > div > div:last-child > div',
    main: 'main > div > div',
    wrapper: '[aria-hidden="true"][tabindex="0"][role="button"] > div[style]',
  }

  function showVideoControls() {
    const videos = Array.from(document.querySelectorAll('video:not([controls])'))
    if (videos.length === 0) return
    for (const video of videos) {
      if (!(video instanceof HTMLVideoElement)) continue
      video.controls = true

      if (video.nextElementSibling instanceof HTMLElement) video.nextElementSibling.style.pointerEvents = 'none'
    }
    utils.log(`video controls added to ${videos.length} video${videos.length > 1 ? 's' : ''}`)
  }

  function enlargeMain() {
    const main = utils.findOne(selectors.main)
    if (main === undefined) {
      utils.warn('Could not find main element')
      return
    }
    main.style.padding = '60px'
    main.style.width = '100%'
    main.style.maxWidth = '1000px'
  }

  function enlargeFeed() {
    const feed = utils.findOne(selectors.feed)
    if (feed === undefined) {
      utils.warn('Could not find feed element')
      return
    }
    feed.style.width = '100%'
  }

  function enlargeWrappers() {
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

  function start(reason = 'unknown') {
    utils.debug(`start called because "${reason}"`)
    utils.hideElements(uselessSelectors, 'useless')
    enlargeMain()
    enlargeFeed()
    enlargeWrappers()
    showVideoControls()
  }
  const startDebounceTime = 300
  const startDebounced = utils.debounce((/** @type {string | undefined} */ reason) => start(reason), startDebounceTime)
  globalThis.addEventListener('scroll', () => startDebounced('scroll'))
  utils.onPageChange(() => startDebounced('page-change'))
}

if (globalThis.window) InstagramWide()
