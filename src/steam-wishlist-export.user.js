// ==UserScript==
// @name         Steam Wishlist Export
// @namespace    https://github.com/Shuunen
// @version      1.1.1
// @description  Export games from a wishlist page
// @author       Romain Racamier-Lafon
// @match        https://store.steampowered.com/wishlist/profiles/*
// @match        https://store.steampowered.com/wishlist/id/*
// @require      https://cdn.jsdelivr.net/gh/Shuunen/user-scripts@2.4.0/src/utils.min.js
// ==/UserScript==

(function SteamWishlistExport () {
  let appButton = document.createElement('button')
  /** @type {{ id: string, img: string, price: number, title: string }[]} */
  let appGames = []
  /** @type {import('./utils.js').Shuutils} */// @ts-ignore
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
  function getGameData (row) {
    row.classList.add(utils.id)
    row.scrollIntoView()
    const titleElement = utils.findOne(selectors.title, row)
    const title = titleElement ? utils.readableString(titleElement.textContent?.trim() ?? '') : '' // @ts-ignore
    const img = utils.findOne(selectors.img, row)?.src ?? ''
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
  async function getGames (list = []) {
    // eslint-disable-next-line no-magic-numbers
    const row = await utils.waitToDetect(selectors.row, 50)
    if (row === undefined) return list
    list.push(getGameData(row))
    return await getGames(list)
  }
  async function copyGames () {
    if (appGames.length > 0) { void utils.copyToClipboard(appGames); return }
    const games = await getGames()
    utils.log('found games :', games)
    void utils.copyToClipboard(games)
    appButton.style.backgroundColor = 'lightgreen'
    appButton.textContent = `${games.length} games copied to your clipboard`
    // eslint-disable-next-line require-atomic-updates
    appGames = games
  }
  function injectButton () {
    const button = document.createElement('button')
    button.textContent = 'Export list to JSON' // @ts-ignore it works ^^'
    button.style = 'position: fixed; cursor: pointer; top: 3.5rem; right: 1rem; padding: 0.5rem 1.2rem; font-size: 1rem; z-index: 1000; '
    button.addEventListener('click', () => { void copyGames() })
    appButton = button
    document.body.append(button)
  }
  async function init () {
    const row = await utils.waitToDetect(selectors.row)
    if (row === undefined) { utils.log('no game found on this page'); return }
    injectButton()
  }
  void utils.onPageChange(init)
})()
