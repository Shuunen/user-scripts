// ==UserScript==
// @name         Steam Wishlist Export
// @namespace    https://github.com/Shuunen
// @version      1.1.1
// @description  Export games from a wishlist page
// @author       Romain Racamier-Lafon
// @match        https://store.steampowered.com/wishlist/profiles/*
// @match        https://store.steampowered.com/wishlist/id/*
// @require      https://cdn.jsdelivr.net/gh/Shuunen/user-scripts@master/src/utils.js
// ==/UserScript==

// @ts-nocheck

(function SteamWishlistExport () {
  /* global Shuutils */
  const marker = 'stm-wex'
  const app = { debug: false, games: [], id: marker } // eslint-disable-line @typescript-eslint/naming-convention
  /** @type {import('./utils.js').Shuutils} */
  const utils = new Shuutils(app)
  const selectors = {
    img: '.capsule img',
    price: '.discount_final_price',
    row: `.wishlist_row:not(.${marker})`,
    title: 'a.title',
  }
  function getGameData (row) {
    row.classList.add(marker)
    row.scrollIntoView()
    const titleElement = utils.findOne(selectors.title, row)
    const title = titleElement ? utils.readableString(titleElement.textContent.trim()) : ''
    const img = (utils.findOne(selectors.img, row) || { src: '' }).src
    const id = row.dataset.appId
    const priceElement = utils.findOne(selectors.price, row)
    const price = priceElement ? Math.round(Number.parseFloat(priceElement.textContent.replace(',', '.'))) : 0
    return { id, img, price, title }
  }
  async function getGames (list = []) {
    // eslint-disable-next-line no-magic-numbers
    const row = await utils.waitToDetect(selectors.row, 50)
    if (row === undefined)
      return list
    list.push(getGameData(row))
    return await getGames(list)
  }
  async function copyGames () {
    if (app.games.length > 0) { void utils.copyToClipboard(app.games); return }
    const games = await getGames()
    utils.log('found games :', games)
    void utils.copyToClipboard(games)
    app.button.style.backgroundColor = 'lightgreen'
    app.button.textContent = `${games.length} games copied to your clipboard`
    app.games = games
  }
  function injectButton () {
    const button = document.createElement('button')
    button.textContent = 'Export list to JSON'
    button.style = 'position: fixed; cursor: pointer; top: 3.5rem; right: 1rem; padding: 0.5rem 1.2rem; font-size: 1rem; z-index: 1000; '
    button.addEventListener('click', () => { void copyGames() })
    app.button = button
    document.body.append(button)
  }
  async function init () {
    const row = await utils.waitToDetect(selectors.row)
    if (row === undefined) { utils.log('no game found on this page'); return }
    injectButton()
  }
  void utils.onPageChange(init)
})()
