// ==UserScript==
// @name         Saveur Bière - Untappd Ratings
// @namespace    https://github.com/Shuunen
// @version      1.2.0
// @description  See your ratings when buying
// @author       Romain Racamier-Lafon
// @match        https://www.saveur-biere.com/*
// @require      https://cdn.jsdelivr.net/gh/Shuunen/user-scripts/src/utils.js
// @grant none
// ==/UserScript==

// @ts-nocheck

/**
 * Clean a title string
 * @param {string} title The title to clean
 * @returns {string} The cleaned title
 */
const cleanTitle = (title) => {
  return title
    .replace(/\([^(]+\)/g, ' ') // remove parenthesis content(s)
    .replace(' Can', ' ').replace('Fût ', ' ')
    .replace(/['’-]/g, ' ').normalize('NFD').replace(/[^\d\sa-z]/gi, '').toLowerCase() // from shuutils sanitize
    .replace(/(\d+cl|\d+l|\d+L|pack \d+|pack de|\d+ bieres|pack|et \d+ verres)/g, ' ') // remove contenance or pack size
    .replace(/\s+/g, ' ')
    .trim()
}

(function SaveurBiereUntappd () {
  /* global Shuutils, module */
  if (typeof window === 'undefined') return
  const marker = 'svb-rat'
  const cached = new Date().toISOString().slice(0, 7) // like 2021-11
  const utils = new Shuutils({ id: marker, debug: true })
  const user = localStorage.untappdUser || ''
  if (user === '') return utils.error('please set localStorage.untappdUser to use this script')
  const wrapAPIKey = localStorage.wrapAPIKey || ''
  if (wrapAPIKey === '') return utils.error('please set localStorage.wrapAPIKey to use this script')
  const selectors = {
    items: 'div > div > div > div > div > div > div > img[class^="Box-sc"] + div[class^="Box-sc"],[data-insights-object-id], div[class^="styled__List"] > div[class^="styled__Container-sc"],[class^="styled__Products"] > div[class^="styled__Container-sc"], div[class^="styled__Content"] > h1[class^="styled__Title"]:first-child, div[class^="styled__Column-sc"] > span[class^="styled__Title-sc"]',
    title: 'p[class^="Paragraph"]:first-child, div > div + div > div > a:first-child, a[class*="styled__Name-sc"]',
    banner: 'span > p, div[class^="styled__Banner-sc"]',
    useless: '[class^="styled__List"]>a, [class^="styled__DiscountContainer"]',
  }
  const injectRating = (element, data) => {
    const rating = document.createElement('p')
    rating.textContent = `You rated "${data.title}" : ${data.user_rating}/5 on Untappd`
    rating.style.padding = '2px 6px'
    if (data.user_rating >= 4) rating.style.backgroundColor = 'lightgreen'
    else if (data.user_rating >= 3) rating.style.backgroundColor = 'lightyellow'
    else rating.style.backgroundColor = 'lightpink'
    element.append(rating)
    element.classList.add(marker)
    element.parentElement.style.height = 'auto'
  }
  const fetchRating = async item => {
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
      data = await fetch(`https://wrapapi.com/use/jojo/untappd/history/0.0.1?user=${user}&search=${name}&wrapAPIKey=${wrapAPIKey}`).then(response => response.json()).then(response => response.data)
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
    if (titleElement.tagName !== 'A') titleElement.outerHTML = `<a href="https://www.saveur-biere.com/fr/search-result/${name}" target="_blank">${name}</a>`
  }
  const injectRatings = () => {
    const items = utils.findAll(selectors.items)
    utils.log('found items', items)
    items.forEach(item => {
      if (item.classList.contains(marker)) return utils.log('item already processed')
      // skip if product not available
      if (utils.findOne(selectors.banner, item)) {
        item.style.opacity = '0.3'
        return utils.log('product not available', item)
      }
      fetchRating(item)
    })
  }
  const deleteUseless = () => {
    utils.findAll(selectors.useless, document, true).forEach(node => {
      if (utils.app.debug) node.style = 'background-color: red !important;color: white !important; box-shadow: 0 0 10px red;'
      else node.remove()
    })
  }
  const init = async () => {
    const items = await utils.waitToDetect(selectors.items)
    if (items === undefined) return utils.log('no item found on this page')
    deleteUseless()
    injectRatings()
  }
  utils.onPageChange(init)
})()

if (module) module.exports = {
  cleanTitle,
}
