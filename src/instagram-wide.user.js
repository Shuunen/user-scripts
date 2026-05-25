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
// @version      1.0.6
// ==/UserScript==

function InstagramWide() {
  const utils = new Shuutils('instagram-wide')
  const uselessSelectors = {
    muteButton: '[aria-label="Toggle audio"]', // mute button is useless when we unmute videos by default
    sidebar: 'main > div > div + div', // useless account suggestions
  }
  const selectors = {
    feed: 'main > div > div > div > div:last-child > div',
    main: 'main > div > div',
    wrapper: '[aria-hidden="true"][tabindex="0"][role="button"] > div[style]',
  }

  function showVideoControls() {
    const videos = Array.from(document.querySelectorAll('video'))
    if (videos.length === 0) return
    let newCount = 0
    for (const video of videos) {
      if (!(video instanceof HTMLVideoElement)) continue
      // oxlint-disable-next-line unicorn/prefer-add-event-listener
      video.onplay = () => {
        if (video.muted) video.muted = false
      }
      if (video.muted) video.muted = false
      if (video.controls) continue
      video.controls = true
      newCount += 1
      if (video.nextElementSibling instanceof HTMLElement) video.nextElementSibling.style.pointerEvents = 'none'
    }
    if (newCount > 0) utils.log(`video controls added to ${newCount} video${newCount > 1 ? 's' : ''}`)
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

  function enlargeVideos() {
    const containers = utils.findAll('div[data-visualcompletion="ignore-late-mutation"] div[style*="padding-bottom"]')
    if (containers.length === 0) {
      utils.warn('Could not find video containers')
      return
    }
    for (const container of containers) {
      if (!(container instanceof HTMLElement)) continue
      const current = container.style.paddingBottom
      if (!current.endsWith('%') || current === '200%') continue
      container.style.paddingBottom = '200%'
      utils.log(`padding-bottom changed from ${current} to 200%`)
    }
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
    enlargeVideos()
    showVideoControls()
  }
  const startDebounceTime = 300
  const startDebounced = utils.debounce((/** @type {string | undefined} */ reason) => start(reason), startDebounceTime)
  globalThis.addEventListener('scroll', () => startDebounced('scroll'))
  utils.onPageChange(() => startDebounced('page-change'))
}

if (globalThis.window) InstagramWide()
