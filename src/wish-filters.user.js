// ==UserScript==
// @name         Wish.com - Price filter & more
// @namespace    https://github.com/Shuunen
// @version      5.4.1
// @description  Filtering by min/max price, allow hiding nsfw products, see reviews
// @author       Romain Racamier-Lafon
// @match        https://*.wish.com/*
// @require      http://ajax.googleapis.com/ajax/libs/jquery/1.12.4/jquery.min.js
// @grant        none
// ==/UserScript==

(function () {
  'use strict'
  /* eslint-disable unicorn/no-fn-reference-in-iterator */
  /* global jQuery */

  console.log('wish price filter : init')

  var $ = jQuery.noConflict(true)
  var minPrice = 0
  var maxPrice = 1000
  var minStars = Number.parseInt(window.localStorage.abwMinStars) || 1
  var hideNsfw = window.localStorage.abwHideNsfw !== 'false'
  var itemsPerBatch = 10
  var itemSelector = '[class^="FeedItemV2__Wrapper"]'
  var itemImageSelector = '[class^="FeedItemV2__Image"]'
  var itemPriceSelector = '[class^="FeedItemV2__ActualPrice"]'
  var itemDetailsSelector = '[class^="FeedItemV2__Row2"]'

  function debounce (function_, wait) {
    var timeout
    return function () {
      var context = this
      var arguments_ = arguments
      var later = function () {
        timeout = undefined
        function_.apply(context, arguments_)
      }
      var callNow = !timeout
      clearTimeout(timeout)
      timeout = setTimeout(later, wait)
      if (callNow) function_.apply(context, arguments_)
    }
  }

  function fetchData (id, productElement, originalPicture) {
    // console.log('will get data for', id);
    const url = 'https://www.wish.com/c/' + id
    // console.log('getting data for', id);
    window.fetch(url)
      .then((r) => r.text())
      .then((html) => {
        let dataMatches = html.match(/"aggregaterating" : ([\W\w]+"\n}),/gi)
        let ratings = 0
        let count = 0
        if (dataMatches) {
          const dataString = dataMatches[0]
          const data = JSON.parse('{' + dataString.replace('},', '}').replace(/\n/g, '') + '}')
          ratings = Math.round(data.aggregateRating.ratingValue * 100) / 100
          count = Math.round(data.aggregateRating.ratingCount)
        } else {
          dataMatches = html.match(/"product_rating": {"rating": (\d\.?\d+), "rating_count": (\d\.?\d+)/i)
          if (dataMatches.length === 3) {
            ratings = dataMatches[1]
            count = dataMatches[2]
          } else {
            dataMatches = undefined
          }
        }
        if (dataMatches) {
          ratings = Math.round(ratings * 100) / 100
          count = Math.round(count)
        } else {
          throw new Error('did not found ratings & count in wish page :' + url)
        }
        // console.log(id, ': found a rating of', ratings, 'over', count, 'reviews :)');
        const nbStars = Math.round(ratings)
        let roundedRatings = Math.round(ratings)
        let ratingsString = ''
        while (roundedRatings--) {
          ratingsString += '<img class="abw-star" src="https://cdn0.iconfinder.com/data/icons/small-n-flat/24/678064-star-20.png" />'
        }
        if (count > 0) {
          ratingsString += '<hr> over ' + count + ' reviews'
        } else {
          ratingsString = 'no reviews !'
        }
        productElement.find(itemDetailsSelector).css('display', 'flex').css('align-items', 'center').html(ratingsString)
        const shippingMatches = html.match(/"localized_shipping":\s{"localized_value":\s(\d)/i)
        const shippingFees = Number.parseInt(shippingMatches[1])
        // console.log(id, ': shipping fees', shippingFees);
        const priceMatches = productElement.find(itemPriceSelector).text().match(/\d+/)
        const price = Number.parseInt(priceMatches && priceMatches.length > 0 ? priceMatches[0] : 0)
        // console.log(id, ': base price', price);
        const totalPrice = shippingFees + price
        const priceElement = productElement.find(itemPriceSelector)
        priceElement.html(totalPrice + ' ' + getCurrency())
        const nsfwMatches = html.match(/sex|lingerie|crotch|masturbat|vibrator|bdsm|bondage|nipple/gi)
        if (nsfwMatches && nsfwMatches.length > 0) {
          // console.log(id, ': is NSFW');
          productElement.addClass('abw-nsfw')
        }
        showHideProduct(productElement, originalPicture, totalPrice, nbStars)
      })
      .catch((error) => {
        console.error('did not managed to found ratings for product "', id, '"', error)
      })
  }

  var currency
  function getCurrency () {
    if (currency) {
      return currency
    }
    $(itemPriceSelector).each(function (index, element) {
      if (currency) {
        return
      }
      var array = element.textContent.replace(/\d+/, '_').split('_')
      if (array.length === 2) {
        console.log('currency found at iteration', index)
        currency = array[1]
      }
    })
    if (currency) {
      console.log('detected currency :', currency)
    } else {
      console.warn('failed at detect currency, try to update "itemPriceSelector"')
    }
    return currency
  }

  var loadedUrl = '//main.cdn.wish.com/fd9acde14ab5/img/ajax_loader_16.gif?v=13'

  function getData (element) {
    const productElement = $(element.tagName ? element : element.currentTarget)
    if (productElement.hasClass('abw-with-data')) {
      // console.log('product has already data');
      return
    }
    productElement.addClass('abw-with-data')
    const image = productElement.find(itemImageSelector)
    if (!image || !image[0]) {
      console.error('did not found image on product', productElement)
      console.error('try to update "itemImageSelector"')
      return
    }
    const href = productElement.attr('href')
    if (!href) return console.error('did not found href on product', productElement)
    const id = href.split('/').reverse()[0]
    const originalPicture = image[0].style.backgroundImage
    image[0].style.backgroundImage = 'url(' + loadedUrl + ')'
    image[0].style.backgroundSize = '10%'
    fetchData(id, productElement, originalPicture)
  }

  function getNextData () {
    const items = $(itemSelector + ':visible:not(.abw-with-data):lt(' + itemsPerBatch + ')')
    if (items.length > 0) {
      console.log('getting next', items.length, 'items data')
      items.each((index, element) => {
        setTimeout(() => getData(element), index * 300)
      })
    } else {
      console.log('found no items to parse, please review const "itemSelector"')
    }
  }

  function showHideProduct (element, originalPicture, totalPrice, nbStars) {
    var productElement = $(element)
    if (!totalPrice) {
      totalPrice = productElement.find(itemPriceSelector).text().replace(/\D/g, '')
    }
    if (!nbStars) {
      nbStars = productElement.find('img.abw-star').size()
    }
    var priceOk = totalPrice <= maxPrice
    if (minPrice && minPrice > 0) {
      priceOk = priceOk && totalPrice >= minPrice
      // console.log('min price',priceOk? '': 'NOT', 'passed');
    }
    if (priceOk && minStars && minStars > 0 && productElement.hasClass('abw-with-data')) {
      priceOk = nbStars >= minStars
      // console.log('min stars',priceOk? '': 'NOT', 'passed');
      // console[(priceOk ? 'log':'error')](nbStars, '>=',minStars);
    }
    if (priceOk && hideNsfw && productElement.hasClass('abw-nsfw')) {
      priceOk = false
      // console.log('nsfw',priceOk? '': 'NOT', 'passed');
    }
    if (originalPicture) {
      const image = productElement.find(itemImageSelector)
      if (!image || !image[0]) {
        console.error('did not found image on product', productElement)
        console.error('try to update "itemImageSelector"')
        return
      }
      image[0].style.backgroundImage = originalPicture
      image[0].style.backgroundSize = '100%'
    }
    if (priceOk) {
      productElement.show('fast')
      if (!productElement.hasClass('abw-on-hover')) {
        productElement.addClass('abw-on-hover')
        productElement.hover(getData)
      }
    } else {
      productElement.hide('fast')
    }
  }

  function showHideProducts (event) {
    console.log('wish price filter : showHideProducts')
    setTimeout(hideUseless, 100)
    setTimeout(getNextData, 100)
    $(itemSelector).each((_, element) => showHideProduct(element))
  }

  // prepare a debounced function
  var showHideProductsDebounced = debounce(showHideProducts, 1000)

  // activate when window is scrolled
  $('.feed-grid-scroll-container, .search-grid-scroll-container').scroll(showHideProductsDebounced)

  function hideUseless () {
    // hide products that can't be rated in order history
    $('.transaction-expanded-row-item .rate-button').parents('.transaction-expanded-row-item').addClass('abw-has-rate')
    $('.transaction-expanded-row-item:not(.abw-has-rate)').remove()
    // delete useless marketing stuff
    $('[class^="FeedItemV2__UrgencyInventory"], [class^="FeedItemV2__AuthorizedBrand"], [class^="FeedItemV2__ProductBoost"], [class^="FeedItemV2__CrossedPrice"]').remove()
    // delete fake discount
    $('[class^="FeedItemV2__DiscountBanner"]').remove()
    // delete wish express
    $('[class^="SearchPage__WishExpressRowContainer"]').remove()
    // delete sms reminders
    $('.transaction-opt-in-banner, .sms-div, .sms-notification-request').remove()
    // delete tab bar, footer
    $('[class^="TabBarV2__Wrapper"], [class^="FooterV2__Wrapper"]').remove()
  }

  setTimeout(hideUseless, 100)

  var html = '<div id="wish_tweaks_config" style="float:left; white-space: nowrap; margin-right:10px;display:flex;justify-content:space-between;align-items:center; font-size: 14px; margin-left: 15px;">'
  html += 'Min / Max Price : <input id="wtc_min_price" type="text" style="width: 30px; text-align: center; margin-left: 5px;">&nbsp;/<input id="wtc_max_price" type="text" style="width: 30px; text-align: center; margin-left: 5px; margin-right: 10px;">'
  html += 'Min stars : <input id="wtc_min_stars" type="number" min="0" max="5" style="width: 40px; text-align: center; margin: 0 5px;">&nbsp;'
  html += 'Hide nsfw : <input id="wtc_hide_nsfw" type="checkbox" checked style="margin: 0; height: 16px; width: 16px; margin: 0 5px;">'
  html += '</div>'

  if ($('#header-left').length > 0) {
    // insert controllers in v1 header
    $('#mobile-app-buttons').remove()
    $('#nav-search-input-wrapper').width(320)
    $('#header-left').after(html)
  } else if ($('.left.feed-v2').length > 0) {
    // insert controllers in v2 header
    $('.left.feed-v2').before(html)
  } else if ($('[class^="Navbar__Left"]').length > 0) {
    // insert controllers in v3 header
    $('[class^="Navbar__Left"]').html(html)
    $('[class^="NavbarCartAndModalPages__Wrapper"]').css('paddingBottom', 0)
  } else if ($('[class^="NavbarV2__Left"]').length > 0) {
    // insert controllers in v4 header
    $('[class^="NavbarV2__Left"]').after(html)
  } else {
    console.error('failed at inserting controllers')
  }

  // get elements
  var hideNsfwCheckbox = $('#wtc_hide_nsfw')
  var minStarsInput = $('#wtc_min_stars')
  var minPriceInput = $('#wtc_min_price')
  var maxPriceInput = $('#wtc_max_price')

  // restore previous choices
  hideNsfwCheckbox.attr('checked', hideNsfw)
  minStarsInput.val(minStars)

  // start filtering by default
  setTimeout(() => {
    showHideProductsDebounced()
    getNextData()
  }, 1000)

  // when input value change
  hideNsfwCheckbox.change((event) => {
    hideNsfw = event.currentTarget.checked
    window.localStorage.abwHideNsfw = hideNsfw
    // console.log('hideNsfw is now', hideNsfw);
    showHideProductsDebounced()
  })
  minPriceInput.change((event) => {
    minPrice = Number.parseInt(event.currentTarget.value) || 0
    // console.log('minPrice is now', minPrice);
    showHideProductsDebounced()
  })
  maxPriceInput.change((event) => {
    maxPrice = Number.parseInt(event.currentTarget.value) || 1000
    // console.log('maxPrice is now', maxPrice);
    showHideProductsDebounced()
  })
  minStarsInput.change((event) => {
    minStars = Number.parseInt(event.currentTarget.value)
    window.localStorage.abwMinStars = minStars
    // console.log('minStars is now', minStars);
    showHideProductsDebounced()
  })
})()
