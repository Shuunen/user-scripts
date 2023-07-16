/* eslint-disable no-param-reassign */
// ==UserScript==
// @name         Amazon Gaming - All in one
// @namespace    https://github.com/Shuunen
// @version      1.0.1
// @description  Hide games
// @author       Romain Racamier-Lafon
// @match        https://gaming.amazon.com/home
// @require      https://cdn.jsdelivr.net/gh/Shuunen/user-scripts@master/src/utils.js
// @grant        none
// ==/UserScript==

// eslint-disable-next-line max-statements, sonarjs/cognitive-complexity
(function amazonGamingAIO () {
  /* global Shuutils */
  if (typeof window === 'undefined') return
  const appId = 'amz-gm-aio'
  /** @type {import('./utils.js').Shuutils} */
  // @ts-ignore
  const utils = new Shuutils({ debug: true, id: appId })
  // non word characters will be removed
  const dlcToHide = [
    'Aion Classic',
    'Angry Birds',
    'Apex Legends',
    'Battlefield',
    'Black Desert',
    'Blade Soul',
    'Bloons TD',
    'Brawlhalla',
    'BTS Island',
    'Call of Duty',
    'Candy Crush',
    'Company of Heroes',
    'Dead by Daylight',
    'Deathloop',
    'Destiny 2',
    'Divine Knockout',
    'Fall Guys',
    'Farm Heroes',
    'FIFA',
    'Forspoken',
    'Fortnite',
    'Genshin Impact',
    'Guild Wars',
    'Hearthstone',
    'Just Dance',
    'Kartrider',
    'Legends of Runeterra',
    'Lineage',
    'Lords Mobile',
    'Lost Ark',
    'Madden',
    'Marvel s Avengers',
    'Minecraft',
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
    'PUBG',
    'Raid Shadow Legends',
    'Rainbow Six',
    'Realm Royale',
    'Roblox',
    'Rocket League',
    'Rogue Company',
    'Roller Champions',
    'Runescape',
    'Smite',
    'Teamfight Tactics',
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
    claimedTag: '[data-a-target="notification-success"]:not(.amz-gm-aio-processed)',
    dlcName: '.item-card-details__body > div > p[title]:not(.amz-gm-aio-processed)',
    grid: '.offer-list__content__grid',
    product: 'div.tw-block:not(.amz-gm-aio-processed)',
  }
  const clearClassSelectors = {
    productLine: '.s-item-container',
  }
  const deleteUselessSelectors = {
    badges: '.featured-content, [data-a-target="badge-new"],.featured-content-shoveler, [data-a-target="badge-ends-soon"]',
    sections: '[data-a-target="hero-banner"], #SearchBar, [data-a-target="offer-section-TOP_PICKS"], [data-a-target="offer-section-FGWP"], [data-a-target="offer-section-EXPIRING"]',
  }
  function deleteUseless () {
    for (const selector of Object.values(deleteUselessSelectors)) utils.findAll(selector, document, true).forEach((node) => {
      // node.style = 'background-color: red !important;color: white !important; box-shadow: 0 0 10px red;'
      node.style.display = 'none'
      node.style.opacity = '0'
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
   * Hide an element for a reason... or not ^^
   * @param {HTMLElement} element The element to hide
   * @param {string} [cause] The cause/reason of the hide
   * @returns {void}
   */
  function hideElement (element, cause = '') {
    element.dataset.hiddenCause = cause
    element.classList.remove('tw-block')
    element.style.display = 'none'
    element.style.visibility = 'hidden'
    element.style.opacity = '0'
  }
  function hideClaimed () {
    utils.findAll(selectors.claimedTag, document, true).forEach((node) => {
      node.classList.add(`${appId}-processed`)
      /** @type {HTMLElement | null} */
      const product = node.closest(selectors.product)
      if (!product) { utils.error('no product found for claimed tag', node); return }
      hideElement(product, 'claimed')
    })
    checkEmptyGrids()
  }
  function cleanDLCName (name = '') {
    return name.replace(/\W/gu, ' ').replace(/\s+/gu, ' ').trim().toLowerCase() || ''
  }
  function hideUnwantedDLC () {
    // eslint-disable-next-line max-statements
    utils.findAll(selectors.dlcName, document, true).forEach((node) => {
      node.classList.add(`${appId}-processed`)
      /** @type {HTMLElement | null} */
      const product = node.closest(selectors.product)
      if (!product) { utils.error('no product found in game node', node); return }
      /** @type {string} */
      const gameName = cleanDLCName(node.title)
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
