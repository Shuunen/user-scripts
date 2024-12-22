// ==UserScript==
// @author       Romain Racamier-Lafon
// @description  Hide games
// @downloadURL  https://github.com/Shuunen/user-scripts/raw/master/src/amazon-gaming-aio.user.js
// @grant        none
// @match        https://gaming.amazon.com/*
// @name         Amazon Gaming - All in one
// @namespace    https://github.com/Shuunen
// @require      https://cdn.jsdelivr.net/gh/Shuunen/user-scripts/src/utils.js
// @version      1.1.1
// ==/UserScript==

// eslint-disable-next-line max-statements
(function amazonGamingAio () {
  if (globalThis.matchMedia === undefined) return
  /** @type {import('./utils.js').Shuutils} */// @ts-ignore
  const utils = new Shuutils('amz-gm-aio')
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
    claimedTag: '[title="Récupéré"]:not(.amz-gm-aio-processed),[title="Collected"]:not(.amz-gm-aio-processed)',
    grid: '.offer-list__content__grid',
    playGameButton: '[title="Play game"]:not(.amz-gm-aio-processed)',
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
    lunaGaming: '#offer-section-LUNA',
    sections: '[data-a-target="hero-banner"],.event-container,.sub-credit-promotion-banner,[data-a-target="offer-section-FGWP"],.marketing-promotion-banner,[data-a-target="offer-section-RECOMMENDED"],[data-a-target="offer-section-WEB_GAMES"], #SearchBar, [data-a-target="offer-section-TOP_PICKS"], [data-a-target="offer-section-EXPIRING"]',
  }
  /**
   * Delete useless elements
   */
  function deleteUseless () {
    for (const selector of Object.values(deleteUselessSelectors)) for (const node of utils.findAll(selector, document, true)) {
      if (utils.willDebug) {
        node.style.backgroundColor = 'red !important'
        node.style.color = 'white !important'
        node.style.boxShadow = '0 0 10px red'
        node.style.opacity = '70'
      } else {
        node.style.display = 'none'
        node.style.opacity = '0'
      }
      node.dataset.hiddenCause = 'useless'
    }
  }
  /**
   * Clear classnames
   */
  function clearClassnames () {
    for (const selector of Object.values(clearClassSelectors)) for (const node of utils.findAll(selector, document, true))
      // eslint-disable-next-line unicorn/no-keyword-prefix
      node.className = ''
  }
  /**
   * Check if a grid is empty and hide it
   */
  function showGridFlex () {
    const grids = utils.findAll(selectors.grid, document, true)
    utils.log(grids.length, 'grids found', grids)
    for (const grid of grids) {
      grid.style.display = 'flex'
      /** @type {HTMLElement[]} */ // @ts-expect-error type issue
      const children = Array.from(grid.children)
      for (const node of children)  node.style.minWidth = '380px'
    }
  }
  /**
   * Double check if an element should be hidden
   * @param {HTMLElement} element the element to check if it should be hidden
   * @param {string} cause the cause of the hide
   * @returns {boolean} true if the element should not be hidden
   */
  function preventElementHide (element, cause) {
    const { length } = element.innerHTML
    utils.debug('checkElementToHide', cause, 'with length', length)
    if (['claimed', 'unwanted-dlc'].includes(cause)) {
      if (length > 8500) { utils.error(`element is too big (${length} > 8500) to be hidden`, element); return true } // eslint-disable-line no-magic-numbers
      if (length < 6500) { utils.error(`element is too small (${length} < 6500) to be hidden`, element); return true } // eslint-disable-line no-magic-numbers
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
    if (utils.willDebug) {
      element.style.boxShadow = 'inset darkred 0 100vh, red 0 0 10px'
      return
    }
    element.classList.remove('tw-block')
    element.style.display = 'none'
    element.style.visibility = 'hidden'
    element.style.opacity = '0'
  }
  /**
   * Hide claimed products
   */
  function hideClaimed () {
    const claimed = utils.findAll(selectors.claimedTag, document, true)
    utils.log(claimed.length, 'claimed found')
    for (const node of claimed) {
      node.classList.add(`${utils.id}-processed`)
      /** @type {HTMLElement | null} */
      const product = node.closest(selectors.productAlt)
      if (!product) continue
      hideElement(product, 'claimed')
    }
  }
  /**
   * Clean a dlc name
   * @param {string} name the name to clean
   * @returns {string} the cleaned name
   */
  function cleanDlcName (name = '') {
    return name
      // biome-ignore lint/suspicious/noMisleadingCharacterClass: <explanation>
      .normalize('NFD').replace(/[\u0300-\u036F]/gu, '') // remove accents
      .replace(/\W/gu, ' ') // remove non word characters
      .replace(/\s+/gu, ' ').trim() // remove multiple spaces
      .toLowerCase() || '' // lowercase
  }
  /**
   * Hide unwanted dlc
   */
  // eslint-disable-next-line max-statements
  function hideUnwantedDlc () {
    const list = utils.findAll(selectors.productDlcName, document, true)
    utils.log(list.length, 'dlc found')

    for (const node of list) {
      node.classList.add(`${utils.id}-processed`)
      /** @type {HTMLElement | null} */
      const product = node.closest(selectors.product)
      if (!product) { utils.error('no product found in product :', node); continue }
      const title = product.querySelector(selectors.productName)
      if (!title) { utils.error('no title found in product :', node); continue }
      /** @type {string} */
      const gameName = cleanDlcName(title.textContent ?? '')
      if (gameName.length === 0) { utils.error('no game name found', node); continue }
      node.title = gameName
      const shouldHide = dlcToHide.some((dlc) => gameName.includes(cleanDlcName(dlc)))
      if (!shouldHide) { utils.log('game dlc is ok :', gameName); continue }
      product.title = gameName
      hideElement(product, 'unwanted-dlc')
    }
  }
  /**
   * Hide Luna games
   * @returns {void}
   */
  function hideLuna () {
    const buttons = utils.findAll(selectors.playGameButton, document, true)
    utils.log(buttons.length, 'luna games found')
    for (const button of buttons) {
      button.classList.add(`${utils.id}-processed`)
      /** @type {HTMLElement | null} */
      const product = button.closest(selectors.productAlt) // the link to the game
      if (!product) { utils.error('no product found for button :', button); continue }
      hideElement(product, 'luna')
    }
  }
  /**
   * Process the page
   * @param {string} cause the cause of the process
   */
  function process (cause = '') {
    if (cause === 'dom-node-inserted:featured-content-thumbnail__overlay') return
    utils.log('process, cause :', cause)
    deleteUseless()
    clearClassnames()
    hideClaimed()
    hideUnwantedDlc()
    hideLuna()
    showGridFlex()
  }
  // eslint-disable-next-line no-magic-numbers
  const processDebounced = utils.debounce(process, 500)

  utils.onPageChange(() => processDebounced('page-change'))

  /**
   * Handles page mutations
   * @param {MutationRecord[]} mutations the mutations that occurred
   */
  function onMutation (mutations) {
    // const { target } = event
    const element = mutations[0]?.addedNodes[0]
    if (element === null || element === undefined) return
    if (!(element instanceof HTMLElement)) return
    if (element.className.includes('shu-toast')) return
    utils.debug('mutation detected', mutations[0])
    processDebounced('mutation')
  }
  const observer = new MutationObserver(onMutation)
  observer.observe(document.body, { childList: true, subtree: true })
})()
