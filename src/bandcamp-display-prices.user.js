// ==UserScript==
// @name         Bandcamp - Display Prices on Wishlist
// @namespace    https://github.com/Shuunen
// @version      1.0.5
// @description  Simply display a price tag on each item in the wishlist
// @author       Romain Racamier-Lafon
// @match        https://bandcamp.com/*/wishlist
// @require      https://raw.githubusercontent.com/Shuunen/user-scripts/master/src/utils.js
// @grant        none
// ==/UserScript==

(function () {
  /* global Shuutils */
  'use strict'

  const app = {
    id: 'bcp-dp',
    debug: false,
  }

  const cls = {
    price: app.id + '-price',
    handled: app.id + '-handled',
  }

  const selectors = {
    product: 'li[data-trackid]:not(.' + cls.handled + ')',
  }

  const utils = new Shuutils(app)

  function cleanPrevious () {
    utils.findAll('[class^="' + cls.price + '"]', document, true).forEach(function (node) {
      return node.remove()
    })
  }

  function displayPrice (product, price) {
    const tag = document.createElement('div')
    tag.innerHTML = price.value + ' <small>' + price.currency + '</small>'
    tag.style = 'position: absolute; top: 0; right: 0; background-color: green; color: white;'
    tag.classList.add(cls.price, 'col-edit-box')
    product.append(tag)
    if (price.value > 2) {
      product.style.filter = 'grayscale(1) opacity(.5)'
    }
    product.classList.add(cls.handled)
  }

  function displayPrices () {
    utils.findAll(selectors.product, document, true).forEach(function (product) {
      const trackId = Number.parseInt(product.getAttribute('data-trackid'))
      if (trackId) {
        utils.log('adding price for', trackId)
        if (!app.tracks[trackId]) {
          throw new Error('failed at getting track price')
        }
        const price = app.tracks[trackId]
        displayPrice(product, price)
      }
    })
  }

  function setTracksFromList (list) {
    if (!app.tracks) {
      app.tracks = {}
    }
    let added = 0
    list.forEach(function (track) {
      const trackId = track.track_id
      if (!app.tracks[trackId]) {
        app.tracks[trackId] = {
          value: Math.round(track.price),
          currency: track.currency,
        }
        added++
      }
    })
    utils.log('added', added, 'tracks to local db :D')
  }

  function getDataFromApi () {
    window.fetch('https://bandcamp.com/api/fancollection/1/wishlist_items', {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        fan_id: app.userid,
        older_than_token: app.token,
      }),
    }).then(function (json) {
      return json.json()
    }).then(function (data) {
      app.token = data.last_token
      setTracksFromList(data.track_list)
      if (data.more_available) {
        getDataFromApi()
      }
    })
  }

  function getDataFromPage () {
    const dataElement = utils.findOne('#pagedata')
    const data = JSON.parse(dataElement.getAttribute('data-blob'))
    setTracksFromList(data.track_list)
    app.token = data.wishlist_data.last_token
    app.userid = data.fan_data.fan_id
  }

  function process () {
    displayPrices()
  }

  function init () {
    utils.log('init !')
    cleanPrevious()
    getDataFromPage()
    getDataFromApi()
    process()
  }

  init()

  const processDebounced = utils.debounce(process, 500)
  document.addEventListener('scroll', processDebounced)
})()
