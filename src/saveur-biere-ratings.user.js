// ==UserScript==
// @name         Saveur Bière - Untappd Ratings
// @namespace    https://github.com/Shuunen
// @version      1.2.0
// @description  See your ratings when buying
// @author       Romain Racamier-Lafon
// @match        https://www.saveur-biere.com/*
// @require      https://cdn.jsdelivr.net/gh/Shuunen/user-scripts@master/src/utils.js
// @grant        none
// ==/UserScript==

// @ts-nocheck

/**
 * Clean a title string
 * @param {string} title The title to clean
 * @returns {string} The cleaned title
 */
function cleanTitle (title) {
  return title
    .replace(/\([^(]+\)/gu, ' ') // remove parenthesis content(s)
    .replace(' Can', ' ').replace('Fût ', ' ')
    .replace(/['’-]/gu, ' ').normalize('NFD').replace(/[^\d\sa-z]/giu, '').toLowerCase() // from shuutils sanitize
    // eslint-disable-next-line regexp/no-super-linear-move
    .replace(/\d+cl|\d+l|\d+L|pack \d+|pack de|\d+ bieres|pack|et \d+ verres/gu, ' ') // remove contenance or pack size
    .replace(/\s+/gu, ' ')
    .trim()
}

// eslint-disable-next-line max-statements
(function SaveurBiereUntappd () {
  /* global Shuutils, module */
  if (typeof window === 'undefined') return
  const marker = 'svb-rat'
  // eslint-disable-next-line no-magic-numbers
  const cached = new Date().toISOString().slice(0, 7) // like 2021-11
  /** @type {import('./utils.js').Shuutils} */
  const utils = new Shuutils({ debug: true, id: marker }) // eslint-disable-line @typescript-eslint/naming-convention
  const user = localStorage.untappdUser || ''
  if (user === '') { utils.error('please set localStorage.untappdUser to use this script'); return }
  const wrapApiKey = localStorage.wrapAPIKey || ''
  if (wrapApiKey === '') { utils.error('please set localStorage.wrapAPIKey to use this script'); return }
  const selectors = {
    banner: 'span > p, div[class^="styled__Banner-sc"]',
    items: 'div > div > div > div > div > div > div > img[class^="Box-sc"] + div[class^="Box-sc"],[data-insights-object-id], div[class^="styled__List"] > div[class^="styled__Container-sc"],[class^="styled__Products"] > div[class^="styled__Container-sc"], div[class^="styled__Content"] > h1[class^="styled__Title"]:first-child, div[class^="styled__Column-sc"] > span[class^="styled__Title-sc"]',
    title: 'p[class^="Paragraph"]:first-child, div > div + div > div > a:first-child, a[class*="styled__Name-sc"]',
    useless: '[class^="styled__List"]>a, [class^="styled__DiscountContainer"]',
  }
  function injectRating (element, data) {
    const rating = document.createElement('p')
    rating.textContent = `You rated "${data.title}" : ${data.user_rating}/5 on Untappd`
    rating.style.padding = '2px 6px'
    // eslint-disable-next-line no-magic-numbers
    if (data.user_rating >= 4) rating.style.backgroundColor = 'lightgreen'
    // eslint-disable-next-line no-magic-numbers
    else if (data.user_rating >= 3) rating.style.backgroundColor = 'lightyellow'
    else rating.style.backgroundColor = 'lightpink'
    element.append(rating)
    element.classList.add(marker)
    // eslint-disable-next-line no-param-reassign
    element.parentElement.style.height = 'auto'
  }
  // eslint-disable-next-line max-statements, consistent-return, sonarjs/cognitive-complexity
  async function fetchRating (item) {
    const titleElement = utils.findOne(selectors.title, item)
    if (titleElement === null) return utils.error('cant find item title')
    const name = cleanTitle(utils.readableString(titleElement.textContent))
    if (name === '') return utils.error('cant find item name in', titleElement)
    titleElement.title = `Cleaned title : ${name}`
    const storageKey = `${marker}-${cached}-${name}` // '2021-11-svb-rat-Gouden Carolus Tripel'
    utils.log(`looking for "${storageKey}" in localStorage`)
    let data = {}
    if (localStorage.getItem(storageKey) === null) {
      utils.log('fetching rating for :', name)
      data = await fetch(`https://wrapapi.com/use/jojo/untappd/history/0.0.1?user=${user}&search=${name}&wrapAPIKey=${wrapApiKey}`).then(async response => await response.json()).then(response => response.data)
      utils.log(`fetched ${data ? '' : 'EMPTY '}data`, data, 'for item', name)
      localStorage.setItem(storageKey, data ? JSON.stringify(data) : 'EMPTY')
      if (data === null) return utils.log(`no ratings found for item "${name}"`)
    } else {
      data = localStorage.getItem(storageKey)
      utils.log(`found ${data === 'EMPTY' ? 'EMPTY ' : ''}cached data for "${storageKey}" in localStorage`)
      if (data === 'EMPTY') return utils.log(`no ratings found for item "${name}"`)
      data = JSON.parse(data)
    }
    injectRating(titleElement.parentElement, data)
    if (titleElement.tagName !== 'A')
      titleElement.outerHTML = `<a href="https://www.saveur-biere.com/fr/search-result/${name}" target="_blank">${name}</a>`
  }
  function injectRatings () {
    const items = utils.findAll(selectors.items)
    utils.log('found items', items)
    items.forEach(item => {
      if (item.classList.contains(marker)) { utils.log('item already processed'); return }
      // skip if product not available
      if (utils.findOne(selectors.banner, item)) {
        // eslint-disable-next-line no-param-reassign
        item.style.opacity = '0.3'
        utils.log('product not available', item)
        return
      }
      void fetchRating(item)
    })
  }
  function deleteUseless () {
    utils.findAll(selectors.useless, document, true).forEach(node => {
      // eslint-disable-next-line no-param-reassign
      if (utils.app.debug) node.style = 'background-color: red !important;color: white !important; box-shadow: 0 0 10px red;'
      else node.remove()
    })
  }
  async function init () {
    const items = await utils.waitToDetect(selectors.items)
    if (items === undefined) { utils.log('no item found on this page'); return }
    deleteUseless()
    injectRatings()
  }
  void utils.onPageChange(init)
})()

if (module) module.exports = {
  cleanTitle,
}
