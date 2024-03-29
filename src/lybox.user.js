// ==UserScript==
// @name         LyBox Enhanced
// @namespace    https://github.com/Shuunen
// @description  Add features to LyBox
// @author       Romain Racamier-Lafon
// @match        https://www.lybox.fr/app/search/*
// @grant        none
// @require      https://cdn.jsdelivr.net/gh/Shuunen/user-scripts@master/src/utils.js
// @version      1.0.0
// ==/UserScript==

// @ts-nocheck

(function LyBoxEnhanced () {
  /* global Shuutils */
  /** @type {import('./utils.js').Shuutils} */
  const utils = new Shuutils({ debug: false, id: 'lyb-enhanced' }) // eslint-disable-line @typescript-eslint/naming-convention
  class Store {
    constructor (provider) {
      this.provider = provider
    }
    fullKey (key) {
      return `${utils.app.id}_${key}`
    }
    get (key, defaultValue) {
      const data = this.provider[this.fullKey(key)]
      if (defaultValue && !data) return defaultValue
      if (!data) throw new Error(`storage : found no matching key "${this.fullKey(key)}"`)
      let result = data
      if (data[0] === '{') result = JSON.parse(data)
      if (data[0] === '[') result = JSON.parse(`{ "arr": ${data} }`).arr
      if (defaultValue && (typeof result !== typeof defaultValue)) throw new Error(`storage : type mismatch, got ${typeof result} instead of ${typeof defaultValue}`)
      return result
    }
    set (key, data) {
      this.provider[this.fullKey(key)] = typeof data === 'object' ? JSON.stringify(data) : data
      return data
    }
    has (key) {
      // eslint-disable-next-line promise/prefer-await-to-then
      return this.get(key).then(Boolean).catch(() => false)
    }
  }
  const store = new Store(localStorage)
  const selectors = {
    row: '#searchForm > div.ng-star-inserted:not(.processed)',
  }
  const hiddenRows = store.get('hiddenRows', [])
  // eslint-disable-next-line max-statements
  function processRow (row) {
    row.classList.add('processed')
    // mark row id as... id
    const id = row.querySelector('.card-body').className.split(' ')[0].split('-')[1]
    if (id.length === 0) { utils.error('no id found on row', row); return }
    // eslint-disable-next-line no-param-reassign
    row.id = id
    if (hiddenRows.includes(id)) {
      // eslint-disable-next-line no-param-reassign
      row.hidden = true
      return // no need to process further
    }
    // text content -> css classes to let user hide/show rows via Amino
    // eslint-disable-next-line prefer-named-capture-group, regexp/prefer-named-capture-group
    const cls = utils.readableString(row.textContent.replace(/([a-z])(\d)/gu, '$1 $2').split(':')[0]).toLowerCase()
    // eslint-disable-next-line unicorn/no-keyword-prefix, no-param-reassign
    row.className += ` ${cls}`
    // add a button to hide row
    const button = document.createElement('i')
    button.style = 'cursor: pointer; float: right; font-size: 1.8rem; margin-left: 0.5rem; color: #666;'
    // eslint-disable-next-line unicorn/no-keyword-prefix
    button.className = 'fa fa-ban'
    button.title = 'Hide this row'
    button.addEventListener('click', () => {
      // eslint-disable-next-line no-param-reassign
      row.hidden = true
      hiddenRows.push(id)
      store.set('hiddenRows', hiddenRows)
    })
    row.querySelector('[type="button"]').parentElement.prepend(button)
  }
  async function process () {
    const row = await utils.waitToDetect(selectors.row)
    if (row === undefined) { utils.log('nothing to process'); return }
    const rows = utils.findAll(selectors.row)
    utils.log(`processing ${rows.length} rows...`)
    rows.forEach(rowElement => { processRow(rowElement) })
  }
  // eslint-disable-next-line no-magic-numbers
  const processDebounced = utils.debounce(process, 1000)
  window.addEventListener('scroll', processDebounced)
  window.addEventListener('load', processDebounced)
})()
