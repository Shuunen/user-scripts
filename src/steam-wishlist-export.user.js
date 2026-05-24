// ==UserScript==
// @name         Steam Wishlist Export
// @author       Romain Racamier-Lafon
// @description  Export games from a wishlist page
// @downloadURL  https://github.com/Shuunen/user-scripts/raw/master/src/steam-wishlist-export.user.js
// @updateURL    https://github.com/Shuunen/user-scripts/raw/master/src/steam-wishlist-export.user.js
// @grant        none
// @match        https://store.steampowered.com/wishlist/id/*
// @match        https://store.steampowered.com/wishlist/profiles/*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=steampowered.com
// @namespace    https://github.com/Shuunen
// @require      https://cdn.jsdelivr.net/gh/Shuunen/monorepo@latest/apps/user-scripts/src/utils.js
// @version      1.1.3
// ==/UserScript==

function SteamWishlistExport() {
  let appButton = document.createElement('button')
  /** @type {{ id: string, img: string, price: number, title: string }[]} */
  let appGames = []
  const utils = new Shuutils('stm-wex')
  const selectors = {
    img: '.capsule img',
    price: '.discount_final_price',
    row: `.wishlist_row:not(.${utils.id})`,
    title: 'a.title',
  }
  /**
   * Retrieves game data from a given row element.
   * @param {HTMLElement} row - The row element containing the game data.
   * @returns {{ id: string, img: string, price: number, title: string }} - The game data.
   */
  function getGameData(row) {
    row.classList.add(utils.id)
    row.scrollIntoView()
    const titleElement = utils.findOne(selectors.title, row)
    const title = titleElement ? utils.readableString(titleElement.textContent?.trim() ?? '') : ''
    const image = utils.findOne(selectors.img, row) // ?.src ?? ''
    const img = image instanceof HTMLImageElement ? image.src : ''
    const id = row.dataset.appId ?? ''
    const priceElement = utils.findOne(selectors.price, row)
    const price = priceElement ? Math.round(Number.parseFloat(priceElement.textContent?.replace(',', '.') ?? '')) : 0
    return { id, img, price, title }
  }
  /**
   * Retrieves games from a list and returns them recursively.
   * @param {{ id: string, img: string, price: number, title: string }[]} list - The list of games.
   * @returns {Promise<{ id: string, img: string, price: number, title: string }[]>} - A promise that resolves to an array of games.
   */
  async function getGames(list = []) {
    const wait = 50
    const row = await utils.waitToDetect(selectors.row, wait)
    if (row === undefined) return list
    list.push(getGameData(row))
    return getGames(list)
  }
  /**
   * Copies the games to the clipboard.
   */
  async function copyGames() {
    if (appGames.length > 0) {
      utils.copyToClipboard(appGames)
      return
    }
    const games = await getGames()
    utils.log('found games :', games)
    utils.copyToClipboard(games)
    appButton.style.backgroundColor = 'lightgreen'
    appButton.textContent = `${games.length} games copied to your clipboard`
    appGames = games
  }
  /**
   * Injects the export button into the page.
   */
  function injectButton() {
    const button = document.createElement('button')
    button.textContent = 'Export list to JSON'
    button.style = 'position: fixed; cursor: pointer; top: 70px; right: 20px; padding: 10px 24px; font-size: 20px; z-index: 1000; '
    button.addEventListener('click', () => {
      void copyGames()
    })
    appButton = button
    document.body.append(button)
  }
  /**
   * Initializes the script.
   */
  async function init() {
    const row = await utils.waitToDetect(selectors.row)
    if (row === undefined) {
      utils.log('no game found on this page')
      return
    }
    injectButton()
  }
  utils.onPageChange(init)
}

if (globalThis.window) SteamWishlistExport()
