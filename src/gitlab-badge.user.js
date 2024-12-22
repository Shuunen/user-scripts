// ==UserScript==
// @author       Romain Racamier-Lafon
// @description  Display a badge on the top right corner of the page with the number of contributions you made today on Gitlab
// @downloadURL  https://github.com/Shuunen/user-scripts/raw/master/src/gitlab-badge.user.js
// @grant        none
// @match        https://gitlab.com/*
// @name         Gitlab - Contribution badge
// @namespace    https://github.com/Shuunen
// @require      https://cdn.jsdelivr.net/gh/Shuunen/user-scripts@latest/src/utils.min.js
// @version      0.0.4
// ==/UserScript==

// @ts-nocheck
/* eslint-disable jsdoc/require-jsdoc */

const badges = {
  bronze: 'https://i.imgur.com/APbU15u.png',
  gold: 'https://i.imgur.com/hoWbQ3w.png',
  silver: 'https://i.imgur.com/ZGeAId9.png',
}

const steps = {
  bronze: 10,
  silver: 20,
}

async function getNbContributions () {
  const isOnUserProfile = gon.feature_category === 'user_profile'
  const username = isOnUserProfile ? document.location.pathname.slice(1) : gon.current_username
  if (!username) throw new Error('No username found, looked in global gon.current_username')
  const url = `https://gitlab.com/users/${username}/calendar.json`
  const data = await fetch(url)
  const json = await data.json()
  const nb = Object.values(json).at(-1)
  if (!nb) throw new Error('No contribution found')
  if (typeof nb !== 'number') throw new Error('Contribution found but not a number')
  return nb
}

function injectStyles (string = '') {
  // eslint-disable-next-line no-console
  if (string.length === 0) { console.log('cannot inject empty style stuff'); return }
  if (string.includes('://') && !string.includes('\n') && string.includes('.css')) {
    document.querySelector('head').insertAdjacentHTML('beforeend', `<link rel="stylesheet" href="${string}" />`)
    return
  }
  document.body.insertAdjacentHTML('beforeend', `<style>${string}</style>`)
}

async function animateCss (element, animation, canRemoveAfter = true) {
  return await new Promise((resolve) => {
    const animationName = `animate__${animation}`
    element.classList.add('animate__animated', animationName)
    if (!canRemoveAfter) { resolve('Animation ended, no need to remove'); return }
    // When the animation ends, we clean the classes and resolve the Promise
    function handleAnimationEnd (event) {
      event.stopPropagation()
      element.classList.remove('animate__animated', animationName)
      resolve('Animation ended')
    }
    element.addEventListener('animationend', handleAnimationEnd, { once: true })
  })
}

// eslint-disable-next-line max-statements
(function GitlabBadge () {
  /* global gon */
  /** @type {import('./utils.js').Shuutils} */// @ts-ignore
  const utils = new Shuutils('gtb-bdg')
  function getBadge () {
    const badge = document.createElement('div')
    badge.id = utils.id
    badge.classList.add('animate__animated')
    badge.style = 'cursor: grab; background-repeat: no-repeat;filter: drop-shadow(black 2px 4px 6px);position: fixed;top: 60px;right: 0px;z-index: 1000;width: 300px;height: 300px;font-size: 80px;font-weight: 800;text-align: center;line-height: 250px;'
    return badge
  }
  const badge = getBadge()
  let isHidden = false
  badge.addEventListener('click', () => { isHidden = true; animateCss(badge, 'bounceOutUp', false) })
  document.body.append(badge)
  let animationCount = 0
  function animateBadge (hasContributionsChanged = false) {
    if (animationCount === 0) animateCss(badge, 'backInRight')
    else animateCss(badge, hasContributionsChanged ? 'tada' : 'pulse')
    animationCount += 1
  }
  async function process (reason = 'unknown') {
    if (isHidden) { utils.debug(`process called because ${reason} but badge has been hidden`); return }
    const todayContributions = await getNbContributions()
    utils.log(`process, reason ${reason}, found ${todayContributions} contributions`)
    const previousContributions = Number(badge.textContent)
    badge.textContent = todayContributions
    if (todayContributions < steps.bronze) badge.style.backgroundImage = `url(${badges.bronze})`
    else if (todayContributions < steps.silver) badge.style.backgroundImage = `url(${badges.silver})`
    else badge.style.backgroundImage = `url(${badges.gold})`
    animateBadge(todayContributions !== previousContributions)
  }
  const processDebounced = utils.debounce(process, 1000) // eslint-disable-line no-magic-numbers
  globalThis.addEventListener('focus', () => { process('focus') })
  globalThis.addEventListener('click', () => processDebounced('click'))
  utils.onPageChange(async () => await process('page-change'))
})()

injectStyles(`
/*!
 * animate.css - https://animate.style/
 * Version - 4.1.1
 * Licensed under the MIT license - http://opensource.org/licenses/MIT
 *
 * Copyright (c) 2020 Animate.css
 */
 :root {
   --animate-duration: 1s;
   --animate-delay: 1s;
   --animate-repeat: 1;
 }
 .animate__animated {
   -webkit-animation-duration: 1s;
   animation-duration: 1s;
   -webkit-animation-duration: var(--animate-duration);
   animation-duration: var(--animate-duration);
   -webkit-animation-fill-mode: both;
   animation-fill-mode: both;
 }
 @keyframes backInRight {
  0% {
    -webkit-transform: translateX(2000px) scale(0.7);
    transform: translateX(2000px) scale(0.7);
    opacity: 0.7;
  }

  80% {
    -webkit-transform: translateX(0px) scale(0.7);
    transform: translateX(0px) scale(0.7);
    opacity: 0.7;
  }

  100% {
    -webkit-transform: scale(1);
    transform: scale(1);
    opacity: 1;
  }
}
.animate__backInRight {
  -webkit-animation-name: backInRight;
  animation-name: backInRight;
}
@keyframes tada {
  from {
    -webkit-transform: scale3d(1, 1, 1);
    transform: scale3d(1, 1, 1);
  }

  10%,
  20% {
    -webkit-transform: scale3d(0.9, 0.9, 0.9) rotate3d(0, 0, 1, -3deg);
    transform: scale3d(0.9, 0.9, 0.9) rotate3d(0, 0, 1, -3deg);
  }

  30%,
  50%,
  70%,
  90% {
    -webkit-transform: scale3d(1.1, 1.1, 1.1) rotate3d(0, 0, 1, 3deg);
    transform: scale3d(1.1, 1.1, 1.1) rotate3d(0, 0, 1, 3deg);
  }

  40%,
  60%,
  80% {
    -webkit-transform: scale3d(1.1, 1.1, 1.1) rotate3d(0, 0, 1, -3deg);
    transform: scale3d(1.1, 1.1, 1.1) rotate3d(0, 0, 1, -3deg);
  }

  to {
    -webkit-transform: scale3d(1, 1, 1);
    transform: scale3d(1, 1, 1);
  }
}
.animate__tada {
  -webkit-animation-name: tada;
  animation-name: tada;
}
@keyframes bounceOutUp {
  20% {
    -webkit-transform: translate3d(0, -10px, 0) scaleY(0.985);
    transform: translate3d(0, -10px, 0) scaleY(0.985);
  }

  40%,
  45% {
    opacity: 1;
    -webkit-transform: translate3d(0, 20px, 0) scaleY(0.9);
    transform: translate3d(0, 20px, 0) scaleY(0.9);
  }

  to {
    opacity: 0;
    -webkit-transform: translate3d(0, -2000px, 0) scaleY(3);
    transform: translate3d(0, -2000px, 0) scaleY(3);
  }
}
.animate__bounceOutUp {
  -webkit-animation-name: bounceOutUp;
  animation-name: bounceOutUp;
}
@keyframes pulse {
  from {
    -webkit-transform: scale3d(1, 1, 1);
    transform: scale3d(1, 1, 1);
  }

  50% {
    -webkit-transform: scale3d(1.05, 1.05, 1.05);
    transform: scale3d(1.05, 1.05, 1.05);
  }

  to {
    -webkit-transform: scale3d(1, 1, 1);
    transform: scale3d(1, 1, 1);
  }
}
.animate__pulse {
  -webkit-animation-name: pulse;
  animation-name: pulse;
  -webkit-animation-timing-function: ease-in-out;
  animation-timing-function: ease-in-out;
}
`)
