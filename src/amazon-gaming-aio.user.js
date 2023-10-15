// ==UserScript==
// @name         Amazon Gaming - All in one
// @namespace    https://github.com/Shuunen
// @version      1.0.3
// @description  Hide games
// @author       Romain Racamier-Lafon
// @match        https://gaming.amazon.com/*
// @require      https://cdn.jsdelivr.net/gh/Shuunen/user-scripts@master/src/utils.js
// @grant        none
// ==/UserScript==

/* eslint-disable no-param-reassign */

// eslint-disable-next-line max-statements, sonarjs/cognitive-complexity
(function amazonGamingAIO () {
  /* global Shuutils */
  if (typeof window === 'undefined') return
  const appId = 'amz-gm-aio'
  /** @type {import('./utils.js').Shuutils} */
  // @ts-ignore
  const utils = new Shuutils({ debug: false, id: appId })
  // non word characters will be removed
  const dlcToHide = [
    'Aion Classic',
    'Angry Birds',
    'Apex Legends',
    'asphalt 9 legends',
    'Battlefield',
    'big farm mobile harvest',
    'Black Desert',
    'Blade Soul',
    'blankos block party',
    'Bloons TD',
    'Brawlhalla',
    'BTS Island',
    'Call of Duty',
    'Candy Crush',
    'Company of Heroes',
    'Dead by Daylight',
    'dead island 2',
    'Deathloop',
    'Destiny 2',
    'diablo iv',
    'Divine Knockout',
    'Fall Guys',
    'Farm Heroes',
    'FIFA',
    'Forspoken',
    'Fortnite',
    'Genshin Impact',
    'Guild Wars',
    'Hearthstone',
    'hi fi rush',
    'honkai star rail',
    'Just Dance',
    'Kartrider',
    'Legends of Runeterra',
    'Lineage',
    'Lords Mobile',
    'Lost Ark',
    'Madden',
    'Marvel s Avengers',
    'Minecraft',
    'mojo melee',
    'my pet hooligan',
    'Naraka Bladepoint',
    'NBA 2K',
    'New World',
    'NHL',
    'Overwatch',
    'Paladins',
    'Partie',
    'Path of Exile',
    'Phantasy Star Online',
    'PlanetSide 2',
    'pokemon go',
    'PUBG',
    'Raid Shadow Legends',
    'Rainbow Six',
    'Realm Royale',
    'risk global domination',
    'Roblox',
    'Rocket League',
    'Rogue Company',
    'Roller Champions',
    'Runescape',
    'shadow fight 3',
    'Smite',
    'star trek timelines',
    'Teamfight Tactics',
    'the crew motorfest',
    'the elder scrolls online',
    'time princess',
    'Total War',
    'Two Point Campus',
    'Two Point Hospital',
    'Valorant',
    'Warframe',
    'Wild Rift',
    'World of Tanks',
    'World of Warcraft',
    'World of Warships',
  ]
  const selectors = {
    claimedTag: '[title="Récupéré"]:not(.amz-gm-aio-processed)',
    grid: '.offer-list__content__grid',
    product: 'div.tw-block.tw-relative:not(.amz-gm-aio-processed)',
    productAlt: '[data-a-target="learn-more-card"]:not(.amz-gm-aio-processed)',
    productDlcName: '[data-a-target="ItemCardDetailPrimaryText"]:not(.amz-gm-aio-processed)',
    productName: '[data-a-target="ItemCardDetailSecondaryText"]',
  }
  const clearClassSelectors = {
    productLine: '.s-item-container',
  }
  const deleteUselessSelectors = {
    badges: '.featured-content, [data-a-target="badge-new"],.featured-content-shoveler, [data-a-target="badge-ends-soon"]',
    sections: '[data-a-target="hero-banner"],[data-a-target="offer-section-FGWP"],[data-a-target="offer-section-RECOMMENDED"],[data-a-target="offer-section-WEB_GAMES"], #SearchBar, [data-a-target="offer-section-TOP_PICKS"], [data-a-target="offer-section-EXPIRING"]',
  }
  function deleteUseless () {
    for (const selector of Object.values(deleteUselessSelectors)) utils.findAll(selector, document, true).forEach((node) => {
      if (utils.app.debug) {
        node.style.backgroundColor = 'red !important'
        node.style.color = 'white !important'
        node.style.boxShadow = '0 0 10px red'
        node.style.opacity = '70'
      } else {
        node.style.display = 'none'
        node.style.opacity = '0'
      }
      node.dataset.hiddenCause = 'useless'
    })
  }
  function clearClassnames () {
    for (const selector of Object.values(clearClassSelectors)) utils.findAll(selector, document, true).forEach((node) => {
      // eslint-disable-next-line unicorn/no-keyword-prefix
      node.className = ''
    })
  }
  function checkEmptyGrids () {
    utils.findAll(selectors.grid, document, true).forEach((node) => {
      // @ts-expect-error
      // eslint-disable-next-line array-func/prefer-array-from
      const visibleChildren = [...node.children].filter(child => !child.hasAttribute('data-hidden-cause')).length // eslint-disable-line unicorn/prefer-dom-node-dataset
      node.style.backgroundImage = visibleChildren === 0 ? 'url("data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHhtbDpzcGFjZT0icHJlc2VydmUiIHZpZXdCb3g9IjAgMCAyMzIgMjMyIj48cGF0aCBkPSJNMTA3IDE0NmE4IDggMCAwIDAgMTUtMmwtMy0zM2E4IDggMCAwIDAtMTUgMWwzIDM0em00NyA2IDEgMWM0IDAgNy0zIDgtN2wzLTM0YTcgNyAwIDEgMC0xNS0xbC0zIDMzYy0xIDQgMiA4IDYgOHptLTU4IDMzYTIzIDIzIDAgMSAwIDAgNDcgMjMgMjMgMCAwIDAgMC00N3ptMCAzMmE4IDggMCAxIDEgMC0xNyA4IDggMCAwIDEgMCAxN3ptNzgtMzJhMjMgMjMgMCAxIDAgMCA0NyAyMyAyMyAwIDAgMCAwLTQ3em0wIDMyYTggOCAwIDEgMSAwLTE3IDggOCAwIDAgMSAwIDE3eiIvPjxwYXRoIGQ9Im0yMTkgNzktNi0zSDYzbC02LTI0Yy0xLTMtNC02LTctNkgxOWE4IDggMCAwIDAgMCAxNWgyNWw2IDI0djFsMjMgODljMSAzIDQgNSA4IDVoMTA4YzQgMCA3LTIgOC01bDIzLTg5LTEtN3ptLTM1IDg2SDg2TDY3IDkxaDEzNmwtMTkgNzR6TTEwNiA1M2E3IDcgMCAwIDAgMTAgMGMzLTMgMy04IDAtMTFMOTMgMTlhOCA4IDAgMCAwLTExIDEwbDI0IDI0em01MyAyIDUtMiAyNC0yNGE3IDcgMCAxIDAtMTEtMTBsLTIzIDIzYTggOCAwIDAgMCA1IDEzem0tMjQtN2M0IDAgOC0zIDgtN1Y4YzAtNS00LTgtOC04cy03IDMtNyA3djM0YzAgNCAzIDcgNyA3eiIvPjwvc3ZnPg==")' : ''
      node.style.height = visibleChildren === 0 ? '160px' : ''
      node.style.backgroundRepeat = visibleChildren === 0 ? 'no-repeat' : ''
      node.style.backgroundPositionY = visibleChildren === 0 ? '50%' : ''
      node.style.filter = visibleChildren === 0 ? 'invert(0.4)' : ''
    })
  }
  /**
   * Double check if an element should be hidden
   * @param {HTMLElement} element the element to check if it should be hidden
   * @param {string} cause the cause of the hide
   * @returns {boolean} true if the element should not be hidden
   */
  function preventElementHide (element, cause) {
    const len = element.innerHTML.length
    utils.debug('checkElementToHide', cause, 'with length', len)
    if (['claimed', 'unwanted-dlc'].includes(cause)) {
      if (len > 8500) { utils.error(`element is too big (${len} > 8500) to be hidden`, element); return true } // eslint-disable-line no-magic-numbers
      if (len < 6500) { utils.error(`element is too small (${len} < 6500) to be hidden`, element); return true } // eslint-disable-line no-magic-numbers
    }
    return false
  }
  /**
   * Hide an element for a reason... or not ^^
   * @param {HTMLElement} element The element to hide
   * @param {string} [cause] The cause/reason of the hide
   * @returns {void}
   */
  function hideElement (element, cause = 'unknown') {
    if (preventElementHide(element, cause)) return
    element.dataset.hiddenCause = cause
    if (utils.app.debug) {
      element.style.boxShadow = 'inset darkred 0 100vh, red 0 0 10px'
      return
    }
    element.classList.remove('tw-block')
    element.style.display = 'none'
    element.style.visibility = 'hidden'
    element.style.opacity = '0'
  }
  function hideClaimed () {
    utils.findAll(selectors.claimedTag, document, true).forEach((node) => {
      node.classList.add(`${appId}-processed`)
      /** @type {HTMLElement | null} */
      const product = node.closest(selectors.productAlt)
      if (!product) return
      hideElement(product, 'claimed')
    })
    checkEmptyGrids()
  }
  function cleanDLCName (name = '') {
    return name
      .normalize("NFD").replace(/[\u0300-\u036F]/gu, '') // remove accents
      .replace(/\W/gu, ' ') // remove non word characters
      .replace(/\s+/gu, ' ').trim() // remove multiple spaces
      .toLowerCase() || '' // lowercase
  }
  function hideUnwantedDLC () {
    const list = utils.findAll(selectors.productDlcName, document, true)
    utils.log(list.length, 'dlc found')
    // eslint-disable-next-line max-statements
    list.forEach((node) => {
      node.classList.add(`${appId}-processed`)
      /** @type {HTMLElement | null} */
      const product = node.closest(selectors.product)
      if (!product) { utils.error('no product found in product :', node); return }
      const title = product.querySelector(selectors.productName)
      if (!title) { utils.error('no title found in product :', node); return }
      /** @type {string} */
      const gameName = cleanDLCName(title.textContent ?? '')
      if (gameName.length === 0) { utils.error('no game name found', node); return }
      node.title = gameName
      const shouldHide = dlcToHide.some((dlc) => gameName.includes(cleanDLCName(dlc)))
      if (!shouldHide) { utils.log('game dlc is ok :', gameName); return }
      product.title = gameName
      hideElement(product, 'unwanted-dlc')
    })
    checkEmptyGrids()
  }
  function process (cause = '') {
    if (cause === 'dom-node-inserted:featured-content-thumbnail__overlay') return
    utils.log('process, cause :', cause)
    deleteUseless()
    clearClassnames()
    hideClaimed()
    hideUnwantedDLC()
  }
  // eslint-disable-next-line no-magic-numbers
  const processDebounced = utils.debounce(process, 500)

  utils.onPageChange(() => processDebounced('page-change'))

  window.addEventListener('scroll', () => processDebounced('scroll'))

  window.addEventListener('DOMNodeInserted', (event) => processDebounced(`dom-node-inserted:${ /** @type {HTMLElement} */ (event.target)?.className || 'unknown'}`))
})()
