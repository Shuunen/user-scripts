// ==UserScript==
// @name         Amazon Gaming - All in one
// @author       Romain Racamier-Lafon
// @description  Hide games
// @downloadURL  https://github.com/Shuunen/user-scripts/raw/master/src/amazon-gaming-aio.user.js
// @updateURL    https://github.com/Shuunen/user-scripts/raw/master/src/amazon-gaming-aio.user.js
// @grant        none
// @match        https://luna.amazon.fr/*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=amazon.com
// @namespace    https://github.com/Shuunen
// @require      https://cdn.jsdelivr.net/gh/Shuunen/monorepo@latest/apps/user-scripts/src/utils.js
// @version      1.1.3
// ==/UserScript==

/**
 * Clean a dlc name
 * @param {string} name the name to clean
 * @returns {string} the cleaned name
 */
function cleanDlcName(name = '') {
  return (
    name
      .normalize('NFD')
      .replaceAll(/[\u0300-\u036F]/gu, '') // remove accents
      .replaceAll(/\W/gu, ' ') // remove non word characters
      .replaceAll(/\s+/gu, ' ') // remove multiple spaces
      .trim() // remove leading and trailing spaces
      .toLowerCase() || '' // lowercase
  )
}

function AmazonGamingAio() {
  if (globalThis.matchMedia === undefined) return
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
    gameNight: '[data-a-target="GameNightBannerSectionRootHome"]',
    lunaGaming: '#offer-section-LUNA',
    sections:
      '[data-a-target="hero-banner"],.event-container,.sub-credit-promotion-banner,[data-a-target="offer-section-FGWP"],.marketing-promotion-banner,[data-a-target="offer-section-RECOMMENDED"],[data-a-target="offer-section-WEB_GAMES"], #SearchBar, [data-a-target="offer-section-TOP_PICKS"], [data-a-target="offer-section-EXPIRING"]',
  }
  /**
   * Delete useless elements
   */
  function deleteUseless() {
    for (const selector of Object.values(deleteUselessSelectors))
      for (const node of utils.findAll(selector, document, true)) {
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
  function clearClassnames() {
    for (const selector of Object.values(clearClassSelectors)) for (const node of utils.findAll(selector, document, true)) node.className = ''
  }
  /**
   * Check if a grid is empty and hide it
   */
  function showGridFlex() {
    const grids = utils.findAll(selectors.grid, document, true)
    utils.log(grids.length, 'grids found', grids)
    for (const grid of grids) {
      grid.style.display = 'flex'
      const htmlChildren = Array.from(grid.children).filter(node => node instanceof HTMLElement)
      for (const node of htmlChildren) node.style.minWidth = '380px'
    }
  }
  /**
   * Double check if an element should be hidden
   * @param {HTMLElement} element the element to check if it should be hidden
   * @param {string} cause the cause of the hide
   * @returns {boolean} true if the element should not be hidden
   */
  function preventElementHide(element, cause) {
    const { length } = element.innerHTML
    utils.debug('checkElementToHide', cause, 'with length', length)
    if (['claimed', 'unwanted-dlc'].includes(cause)) {
      if (length > 8500) {
        utils.error(`element is too big (${length} > 8500) to be hidden`, element)
        return true
      }
      if (length < 2000) {
        utils.error(`element is too small (${length} < 2000) to be hidden`, element)
        return true
      }
    }
    return false
  }
  /**
   * Hide an element for a reason... or not ^^
   * @param {HTMLElement} element The element to hide
   * @param {string} [cause] The cause/reason of the hide
   * @returns {void}
   */
  function hideElement(element, cause = 'unknown') {
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
  function hideClaimed() {
    const claimed = utils.findAll(selectors.claimedTag, document, true)
    utils.log(claimed.length, 'claimed found')
    for (const node of claimed) {
      node.classList.add(`${utils.id}-processed`)
      const product = node.closest(selectors.productAlt)
      if (!(product instanceof HTMLElement)) continue
      hideElement(product, 'claimed')
    }
  }
  /**
   * Hide unwanted dlc
   */
  function hideUnwantedDlc() {
    const list = utils.findAll(selectors.productDlcName, document, true)
    utils.log(list.length, 'dlc found')

    for (const node of list) {
      node.classList.add(`${utils.id}-processed`)
      const product = node.closest(selectors.product)
      if (!(product instanceof HTMLElement)) {
        utils.error('no product found in product :', node)
        continue
      }
      const title = product.querySelector(selectors.productName)
      if (!title) {
        utils.error('no title found in product :', node)
        continue
      }
      const gameName = cleanDlcName(title.textContent ?? '')
      if (gameName.length === 0) {
        utils.error('no game name found', node)
        continue
      }
      node.title = gameName
      const shouldHide = dlcToHide.some(dlc => gameName.includes(cleanDlcName(dlc)))
      if (!shouldHide) {
        utils.log('game dlc is ok :', gameName)
        continue
      }
      product.title = gameName
      hideElement(product, 'unwanted-dlc')
    }
  }
  /**
   * Hide Luna games
   * @returns {void}
   */
  function hideLuna() {
    const buttons = utils.findAll(selectors.playGameButton, document, true)
    utils.log(buttons.length, 'luna games found')
    for (const button of buttons) {
      button.classList.add(`${utils.id}-processed`)
      const product = button.closest(selectors.productAlt) // the link to the game
      if (!(product instanceof HTMLElement)) {
        utils.error('no product found for button :', button)
        continue
      }
      hideElement(product, 'luna')
    }
  }
  /**
   * Process the page
   * @param {string} cause the cause of the process
   */
  function start(cause = '') {
    if (cause === 'dom-node-inserted:featured-content-thumbnail__overlay') return
    utils.log('start, cause :', cause)
    deleteUseless()
    clearClassnames()
    hideClaimed()
    hideUnwantedDlc()
    hideLuna()
    showGridFlex()
  }
  const startDebounced = utils.debounce(start, 500)

  utils.onPageChange(() => startDebounced('page-change'))

  /**
   * Handles page mutations
   * @param {MutationRecord[]} mutations the mutations that occurred
   */
  function onMutation(mutations) {
    // const { target } = event
    const element = mutations[0]?.addedNodes[0]
    if (element === null || element === undefined) return
    if (!(element instanceof HTMLElement)) return
    if (element.className.includes('shu-toast')) return
    utils.debug('mutation detected', mutations[0])
    startDebounced('mutation')
  }
  const observer = new MutationObserver(onMutation)
  observer.observe(document.body, { childList: true, subtree: true })
}

if (globalThis.window) AmazonGamingAio()
else module.exports = { cleanDlcName }
