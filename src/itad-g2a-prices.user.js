// ==UserScript==
// @name         IsThereAnyDeal - Add G2A prices
// @namespace    http://tampermonkey.net/
// @version      0.3.1
// @description  add G2A prices on listings
// @author       Shuunen
// @match        *://*isthereanydeal.com/*
// @grant        none
// ==/UserScript==

(function () {
  /* global jQuery, $ */
  'use strict'

  /* This part allow this script to access G2A cors protected webservice */
  jQuery.ajaxPrefilter(function (options) {
    if (options.crossDomain && jQuery.support.cors) {
      options.url = 'https://cors-anywhere.herokuapp.com/' + options.url
    }
  })

  // Date.now polyfill
  if (!Date.now) {
    Date.now = function now () {
      return new Date().getTime()
    }
  }

  const colorDefault = 'antiquewhite'
  const colorNice = 'gold'
  const colorGood = 'gold'
  const colorGreat = 'red'

  const g2aBaseUrl = 'https://www.g2a.com'
  const g2aSearchUrl = '/lucene/search/quick?phrase='
  const g2aNormalSearchUrl = '/?search='

  let pricesCache
  try {
    pricesCache = JSON.parse(window.localStorage.g2aPriceCache)
  } catch (error) {
    console.error(error)
    pricesCache = {}
  }

  function timestamp () {
    return Math.round(Date.now() / 1000)
  }

  function searchPrice (gameId, title, platform, callback) {
    // platform is one of 'steam','origin','uplay'
    callback = callback || function () { console.warn('callback not provided') }
    const cacheKey = gameId + '-' + platform
    if (pricesCache[cacheKey]) {
      console.log('found ' + title + ' [' + platform + '] price in cache')
      if (pricesCache[cacheKey].savedOn) {
        const hoursAgo = (timestamp() - pricesCache[cacheKey].savedOn) / 3600
        const maxHours = 1
        if (hoursAgo < maxHours) {
          callback(pricesCache[cacheKey])
          return
        } else {
          console.log('cache entry ' + cacheKey + ' is more than ' + maxHours + ' hours old, will not use this cache entry...')
        }
      } else {
        console.log('cache entry ' + cacheKey + ' was not timestamped, will not use this cache entry...')
      }
    }
    let url = g2aBaseUrl + g2aSearchUrl + title + ' ' + platform + ' global'
    // replace spaces
    url = url.replace(/\s/g, '%20')
    let gameUrl = ''
    let minPrice = 1000
    $.getJSON(url, function (data) {
      if (!data.docs || data.docs.length <= 0) {
        console.error('no results found for ' + title + ' on ' + platform + ' (GET', url, ')')
      } else {
        data.docs.forEach(function (game) {
          if (!game.slug.includes('dlc') && (game.minPrice <= minPrice)) {
            minPrice = game.minPrice
            gameUrl = g2aBaseUrl + game.slug
          }
        })
      }
      // save price for platform in memory cache
      pricesCache[cacheKey] = {
        savedOn: timestamp(),
        minPrice: minPrice,
        gameUrl: gameUrl,
        platform: platform,
      }
      // persist in localStorage
      window.localStorage.g2aPriceCache = JSON.stringify(pricesCache)
      setTimeout(function () {
        // callback after delay to space requests
        callback(pricesCache[cacheKey])
      }, 300)
    })
  }

  function searchPriceByLine (line, index) {
    let title = line.querySelector('.title a.noticeable').textContent
    // Watch_Dogs€ 2 => watch dogs 2
    title = title.toLowerCase().replace(/[^\d\sa-z]/g, ' ').replace(/\s+/g, ' ').trim()
    let priceElement = line.querySelector('.currentBest')
    if (!priceElement) {
      let minPriceDeal = 1000
      line.querySelectorAll('.deals > a').forEach(function (priceDealElement) {
        const priceDeal = Number.parseFloat(priceDealElement.textContent.replace(',', '.'))
        if (priceDeal < minPriceDeal) {
          priceElement = priceDealElement
          minPriceDeal = priceDeal
        }
      })
    }
    if (!priceElement) {
      console.error('cannot find price on line', line)
      return
    }
    const price = Number.parseFloat(priceElement.textContent.replace(',', '.'))
    console.log(title, price)
    let platform = ''
    const gameId = line.getAttribute('data-plain')
    if (!gameId) {
      console.error('cannot find game id on line', line)
      return
    }
    let gameUrl = ''
    let minPrice = 1000
    // mark line as loading
    line.style.filter = 'blur(5px) brightness(300%)'
    line.style.transition = 'filter .4s'
    setTimeout(function () {
      searchPrice(gameId, title, 'steam', function (results) {
        if (results.minPrice < minPrice) {
          minPrice = results.minPrice
          gameUrl = results.gameUrl
          platform = results.platform
        }
        searchPrice(gameId, title, 'origin', function (results) {
          if (results.minPrice < minPrice) {
            minPrice = results.minPrice
            gameUrl = results.gameUrl
            platform = results.platform
          }
          searchPrice(gameId, title, 'uplay', function (results) {
            if (results.minPrice < minPrice) {
              minPrice = results.minPrice
              gameUrl = results.gameUrl
              platform = results.platform
            }
            // update price in DOM
            if (minPrice < price) {
              console.info('found better price for ' + title + ' [' + platform + '] : ' + minPrice + '$')
              const reduc = (100 - Math.round((minPrice / price) * 100))
              // eslint-disable-next-line unicorn/no-nested-ternary
              const color = (reduc > 80 ? colorGreat : (reduc > 50 ? colorGood : (reduc > 30 ? colorNice : colorDefault)))
              const stl = ' style="color:' + color + '"'
              const hrf = ' href="' + gameUrl + '"'
              const ttl = ' title="on [' + platform + '], ' + reduc + '% off !"'
              const trg = ' target="_blank"'
              priceElement.parentElement.innerHTML += '<a' + stl + hrf + ttl + trg + '>' + minPrice + '$ on G2A</a>'
            } else {
              console.log('didnt found better price for ' + title + ' than : ' + price + '$')
            }
            const getPriceLink = line.querySelector('.g2a-get-price')
            if (getPriceLink) {
              getPriceLink.style.display = 'none'
            } else {
              // console.log('cannot find the "Get price" link in order to hide it');
            }
            // let user check himself on G2A
            const dealsElement = line.querySelector('.deals')
            const cls = ' class="g2a-get-price manual"'
            const href = ' href="' + g2aBaseUrl + g2aNormalSearchUrl + title + ' global"'
            const target = ' target="_blank"'
            dealsElement.innerHTML = '<a' + cls + href + target + '>Check on G2A</a>' + dealsElement.innerHTML
            // remove loading styling
            line.style.filter = ''
          })
        })
      })
    }, index * 300)
  }

  function addGetPriceLink (line, index) {
    const dealsElement = line.querySelector('.deals')
    dealsElement.innerHTML = '<div class="g2a-get-price">Get Price on G2A</div>' + dealsElement.innerHTML
    const link = line.querySelector('.g2a-get-price')
    if (link) {
      link.addEventListener('click', function () {
        searchPriceByLine(line, index)
        link.style.display = 'none'
      })
    } else {
      console.error('impossible to find the "Get Price" button to listen the click to')
    }
  }

  function addGetAllPricesLink () {
    const container = document.querySelector('#orderByRight')
    container.innerHTML = '<div class="g2a-get-price all">Get ALL Prices on G2A</div>' + container.innerHTML
    const link = container.querySelector('.g2a-get-price')
    if (link) {
      link.addEventListener('click', function () {
        document.querySelectorAll('#games .game').forEach((element, index) => searchPriceByLine(element, index))
      })
    } else {
      console.error('impossible to find the "Get ALL Prices" button to listen the click to')
    }
  }

  function detectMouseoverGames () {
    let gameHovered = ''
    document.body.addEventListener('mouseover', function (event) {
      const element = event.target
      if (!element.classList.contains('game')) {
        return
      }
      const currentGameHovered = element.getAttribute('data-plain')
      if (currentGameHovered === gameHovered) {
        return
      }
      gameHovered = element.getAttribute('data-plain')
      // console.log('over', gameHovered);
      if (!element.querySelector('.g2a-get-price')) {
        addGetPriceLink(element, 0)
      }
    })
  }

  function insertStyle () {
    const style = `<style class="getG2ApricesStyle">
.g2a-get-price {
background-color: darkslategrey;
padding: 1px 5px;
margin: 3px 0 -5px;
font-size: 10px;
float: left;
cursor: pointer;
}
.g2a-get-price.manual {
background-color: #333;
color: #999;
}
.g2a-get-price.all {
font-size: 12px;
margin: 0px 8px 4px;
padding: 2px 8px;
border: 1px dotted lightblue;
border-radius: 3px;
}
</style>`
    $('body').append($(style))
  }

  // init
  detectMouseoverGames()
  insertStyle()
  addGetAllPricesLink()
})()
