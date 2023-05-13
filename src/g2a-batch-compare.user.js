/* eslint-disable no-param-reassign */
// ==UserScript==
// @name         G2A Batch Compare
// @namespace    https://github.com/Shuunen
// @version      1.1.0
// @description  Compare prices with game list in the clipboard
// @author       Romain Racamier-Lafon
// @match        https://www.g2a.com/*
// @require      https://cdn.jsdelivr.net/npm/didyoumean/didYouMean-1.2.1.min.js
// @require      https://cdn.jsdelivr.net/gh/Shuunen/user-scripts/src/utils.js
// @require      https://cdn.jsdelivr.net/npm/simple-datatables
// @grant none
// ==/UserScript==

// @ts-nocheck

// eslint-disable-next-line max-statements
(function G2ABatchCompare () {
  /* global Shuutils, didYouMean */
  const marker = 'g2a-bcp'
  let list = []
  /** @type {import('./utils.js').Shuutils} */
  const utils = new Shuutils({ id: marker, debug: false })
  function cleanGameName (string) {
    // eslint-disable-next-line prefer-destructuring
    const output = string.toLowerCase()
      .split(' deluxe edition')[0]
      .split(' definitive edition')[0]
      .split(' standard edition')[0]
      .split(' (')[0]
      .split('steam')[0]
    return utils.readableString(output)
  }
  function same (stringA, stringB) {
    const result = Boolean(didYouMean(cleanGameName(stringA), [cleanGameName(stringB)]))
    if (utils.app.debug) utils.log(`${result ? 'same' : 'different'} : "${stringA}" & "${stringB}"`)
    return result
  }
  function injectModal () {
    const backdrop = document.createElement('div')
    backdrop.style = 'display: flex; z-index: 100; width: 100%; height: 100%; background-color: rgba(0,0,0,.5); position: fixed; top: 0; left: 0;'
    backdrop.dataset.close = true
    backdrop.addEventListener('click', event => {
      if (event.target.dataset.close === 'true') backdrop.remove()
    })
    const modal = document.createElement('div')
    modal.style = 'z-index: 200; position: relative; max-height: 90%; overflow-y: auto; margin: auto; padding: 1.6rem 1.2rem; background: floralwhite; width: 800px;'
    modal.innerHTML = `
      <h1 style=" margin: 1rem 0 2rem; text-align: center; text-decoration: underline; ">
        <a target="_blank" href="https://github.com/Shuunen/user-scripts/">G2A Batch Compare</a>
      </h1>
      <button data-close="true" style="position: absolute; border: none; background: none; top: 2rem; right: 2rem; font-size: 4rem; font-family: monospace; color: darkgray;">x</button>
    `
    backdrop.append(modal)
    document.body.append(backdrop)
    return modal
  }
  function injectStyles (string = '') {
    if (string.length === 0) { utils.log('cannot inject empty style stuff'); return }
    if (string.includes('://') && string.includes('.css')) {
      // eslint-disable-next-line no-unsanitized/method
      document.querySelector('head').insertAdjacentHTML('beforeend', `<link rel="stylesheet" href="${string}" />`)
      return
    }
    // eslint-disable-next-line no-unsanitized/method
    document.body.insertAdjacentHTML('beforeend', `<style>${string}</style>`)
  }
  function generateTable () {
    const table = document.createElement('table')
    const head = document.createElement('thead')
    head.innerHTML = `<tr><th>${['Game title', 'Image', 'Steam price', 'Local price raw', 'Local price'].join('</th><th>')}</th></tr>`
    table.append(head)
    const body = document.createElement('tbody')
    body.innerHTML = list.map(game => {
      const cells = []
      cells.push(
        `<a class="title" href="${game.priceLocalSearchUrl}" target="_blank">${game.title}</a>`,
        `<img src="${game.img}" style="width: 200px" />`,
        `<a class="price" href="https://store.steampowered.com/app/${game.id}" target="_blank">${game.price} €</a>`,
        Math.round(game.priceLocal),
      )
      if (game.priceLocal > 0) cells.push(`<a class="price" href="${game.priceLocalUrl}" target="_blank">${Math.round(game.priceLocal)} €</a>`)
      else cells.push(`<a class="no-price" href="${game.priceLocalSearchUrl}" target="_blank">no price found</a>`)
      return `<tr><td>${cells.join('</td><td>')}</td></tr>`
    }).join('\n')
    table.append(body)
    table.id = `${marker}--table`
    injectStyles(`
      #${marker}--table > tbody > tr > td { vertical-align: middle; padding: 0 0.6rem; font-size: 1rem; }
      #${marker}--table > tbody > tr:nth-of-type(odd) { background-color: #f0f0f0; }
      #${marker}--table a.title { font-weight: bold; }
      #${marker}--table a.price { font-size: 1.7rem; }
    `)
    return table
  }
  function enhanceTable (table) {
    injectStyles('https://cdn.jsdelivr.net/npm/simple-datatables@latest/dist/style.css')
    const dataTable = new window.simpleDatatables.DataTable(`#${table.id}`, {
      perPage: 4,
      columns: [
        // eslint-disable-next-line no-magic-numbers
        { select: [1, 2, 4], sortable: false },
        { select: 3, sort: 'asc', hidden: true, render: value => (value === '0' ? '?' : value) }, // raw price
      ],
    })
    utils.log('dataTable init', dataTable)
  }
  // eslint-disable-next-line max-statements
  async function getLocalPrice (game) {
    game.priceLocal = 0
    game.priceLocalUrl = ''
    const search = `${utils.readableString(game.title).toLowerCase()} steam`
    game.priceLocalSearchUrl = `https://www.g2a.com/search?query=${search}`
    const url = `https://www.g2a.com/search/api/v3/suggestions?itemsPerPage=5&phrase=${search}&currency=EUR&variantCategory=189`
    const { data } = await window.fetch(url).then(response => response.json())
    if (data === undefined || data.items === undefined || data.items.length === 0) return
    let lowestPrice = 0
    let lowestUrl = ''
    data.items.forEach(result => {
      if (!/\b(?:europe|euw|global)\b/iu.test(result.name)) { utils.log('incorrect right ?', result.name); return }
      if (!same(game.title, result.name)) return
      if (lowestPrice === undefined || result.price < lowestPrice) {
        lowestPrice = result.price
        lowestUrl = result.href
      }
    })
    game.priceLocal = lowestPrice
    game.priceLocalUrl = lowestUrl
  }
  async function getLocalPrices (progress) {
    let index = 0
    const total = list.length
    for (const game of list) {
      index += 1
      progress.textContent = `${index}/${total}`
      // eslint-disable-next-line no-await-in-loop
      await getLocalPrice(game)
    }
  }
  // eslint-disable-next-line max-statements
  async function showModal () {
    const modal = injectModal()
    const message = document.createElement('p')
    message.textContent = `Getting prices for ${list.length} games, please wait...`
    const progress = document.createElement('span')
    message.append(progress)
    modal.append(message)
    await getLocalPrices(progress)
    message.remove()
    const table = generateTable()
    modal.append(table)
    enhanceTable(table)
  }
  function injectButton () {
    const button = document.createElement('button')
    button.textContent = `Compare ${list.length} prices`
    button.style = 'position: fixed; cursor: pointer; top: 3.5rem; right: 1rem; padding: 0.5rem 1.2rem; font-size: 1rem; z-index: 50; '
    button.addEventListener('click', () => showModal())
    document.body.append(button)
  }
  async function init () {
    const string = await utils.readClipboard()
    if (string[0] !== '[') { utils.log('no JSON array in clipboard'); return }
    list = JSON.parse(string)
    utils.log('got list from clipboard', list)
    injectButton()
  }
  utils.onPageChange(init)
})()
