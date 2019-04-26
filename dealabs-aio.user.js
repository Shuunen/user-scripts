// ==UserScript==
// @name         Dealabs - All in one
// @namespace    https://github.com/Shuunen
// @version      1.1.0
// @description  Un-clutter & add filters to Dealabs
// @author       Romain Racamier-Lafon
// @match        https://www.dealabs.com/*
// @require      https://cdn.jsdelivr.net/gh/Shuunen/user-scripts/utils.js
// @require      https://cdn.jsdelivr.net/npm/autosize@4.0.2/dist/autosize.min.js
// @grant none
// ==/UserScript==

(function () {
  /* global Shuutils, autosize */
  'use strict'

  const app = {
    id: 'dlb-clr',
    filter: '',
    excluders: [],
    debug: true
  }

  app.excluders = (window.localStorage[app.id + '.filter'] || 'my-keyword, other-keyword').split(',')

  const selectors = {
    dealList: '.js-threadList',
    deal: '.thread--type-list'
  }

  const cls = {
    filter: app.id + '-filter'
  }

  const uselessElements = {
    rightNav: '.listLayout-side',
    subNav: '.subNavMenu--morph',
    banner: '.box--all-b',
    flash: '.cept-threadUpdate',
    buttons: '.threadGrid-body > .boxAlign-ai--all-c',
    showMore: '.thread-link.linkPlain.text--b.overflow--wrap-off',
    data: '.threadGrid-footerMeta, .metaRibbon'
  }

  const uselessClasses = {
    descriptions: '.cept-description-container'
  }

  const utils = new Shuutils(app)

  function cleanElements () {
    Object.keys(uselessElements).forEach(key => {
      utils.findAll(uselessElements[key], document, true).forEach(node => (node.remove()))
    })
  }

  function cleanClasses () {
    Object.keys(uselessClasses).forEach(key => {
      utils.findAll(uselessClasses[key], document, true).forEach(node => (node.classList = []))
    })
  }

  function insertStyles () {
    const styleTag = document.createElement('style')
    styleTag.innerHTML = `
        .subNav {
            background-color: inherit;
            border: none;
            padding-top: 8px;
            padding-right: 10px;
        }
        .threadGrid {
            grid-template-rows: auto; 
        }
        .threadGrid-headerMeta > div {
          padding-top: 1em;
        }
        .userHtml {
            font-size: 0.975rem;
        }
        .${cls.filter} {
            position: fixed;
            left: 7px;
            top: 62px;
            min-width: 200px;
            background-color: aliceblue;
            border-radius: 3px;
            padding: 5px;
            z-index: 100;
        }
        .cept-listing--list:not(#pagination) {
            display: flex;
            flex-direction: column;
        }
      `
    document.head.insertAdjacentElement('beforeend', styleTag)
  }

  function onExcludersUpdate (fromFilter) {
    app.excluders = app.excluders
      .map(entry => entry.trim().toLowerCase())
      .filter(entry => entry.length)
    if (!app.excluders.length) {
      return
    }
    utils.log('new excluders :', app.excluders)
    app.filter = app.excluders.join(', ')
    window.localStorage[app.id + '.filter'] = app.filter
    if (!fromFilter) {
      const filter = utils.findOne('.' + cls.filter)
      filter.value = app.filter
      autosize.update(filter)
    }
    checkItems()
  }

  function onFilterChange (event) {
    utils.log('filter changed !')
    app.excluders = event.target.value.split(',')
    onExcludersUpdate(true)
  }

  const onFilterChangeDebounced = utils.debounce(onFilterChange, 500)

  function insertFilter () {
    utils.log('insert filter...')
    const container = utils.findFirst(selectors.dealList)
    if (!container) {
      utils.error('cannot inject excluders without container')
      return
    }
    const filter = document.createElement('textarea')
    filter.spellcheck = false
    filter.classList.add(cls.filter)
    filter.value = app.filter
    autosize(filter)
    filter.addEventListener('keyup', onFilterChangeDebounced)
    container.insertAdjacentElement('beforeBegin', filter)
  }

  function checkItem (text, element) {
    let found = false
    let remaining = app.excluders.length
    while (!found && remaining) {
      found = text.indexOf(app.excluders[remaining - 1]) >= 0
      remaining--
    }
    if (found) {
      utils.warn('"' + text.substr(0, 40) + '..."', 'is excluded, it contains : "' + app.excluders[remaining] + '"')
    } else {
      utils.log('"' + text.substr(0, 400) + '..."', 'was not excluded')
      element.style.backgroundColor = '#f0fbf0'
    }
    element.style.opacity = found ? '0.3' : '1'
  }

  function checkItems () {
    utils.log('checking displayed items...')
    utils.findAll(selectors.deal).forEach((element) => {
      const text = utils.readableString(element.textContent).toLowerCase().trim()
      checkItem(text, element)
    })
  }

  function process () {
    utils.log('processing')
    cleanClasses()
    cleanElements()
    onExcludersUpdate()
  }

  function init () {
    utils.log('init !')
    insertStyles()
    insertFilter()
    process()
  }

  init()

  const processDebounced = utils.debounce(process, 500)
  document.addEventListener('scroll', processDebounced)
})()
