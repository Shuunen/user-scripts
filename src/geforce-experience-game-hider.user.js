// ==UserScript==
// @name         Geforce Experience - Game hider
// @namespace    https://github.com/Shuunen
// @version      1.0.1
// @description  Lets you hide games from the list
// @author       Romain Racamier-Lafon
// @match        https://www.nvidia.fr/geforce/geforce-experience/games/
// @grant        none
// ==/UserScript==

/* global $ */

// Returns a function, that, as long as it continues to be invoked, will not
// be triggered. The function will be called after it stops being called for
// N milliseconds. If `immediate` is passed, trigger the function on the
// leading edge, instead of the trailing.
function debounce (function_, wait, immediate) {
  let timeout
  return function () {
    const context = this
    const arguments_ = arguments
    const later = function () {
      timeout = undefined
      if (!immediate) { function_.apply(context, arguments_) }
    }
    const callNow = immediate && !timeout
    clearTimeout(timeout)
    timeout = setTimeout(later, wait)
    if (callNow) { function_.apply(context, arguments_) }
  }
}

$(document).ready(function () {
  console.log('geforce experience hider (geh) : init')

  function log (thing) {
    console.log('geh :', thing)
  }

  let gamesToHide = []
  if (window.localStorage.gahGamesToHide) {
    gamesToHide = window.localStorage.gahGamesToHide.split(',')
  }
  log(gamesToHide.length + ' games will be hidden')

  const hideItStyle = 'color: orangered; border-width: 3px; display: inline-block; box-sizing: content-box; border-radius: 50%; margin-left: 10px; cursor: pointer; height: 10px; width: 10px; border-style: dashed;'

  function hide () {
    log('hiding...')
    $('.gameName:visible').each(function (index, game) {
      // clean game tile
      const title = game.textContent.trim().replace(/\./g, '').replace(/[^\d\sA-Za-z]+/g, '')
      // game.textContent = title
      if (gamesToHide.includes(title)) {
        $(game).hide('slow')
      } else {
        game.innerHTML = '<a href="https://www.google.fr/search?q=' + title + '" target="_blank">' + title + '</a>'
        const hideIt = $('<span style="' + hideItStyle + '"></span>')
        hideIt.click(function (event) {
          const gameToHide = event.currentTarget.previousElementSibling.textContent
          log('user choose to hide "' + gameToHide + '"')
          gamesToHide.push(gameToHide)
          log('this list has been saved in LS, put it in your script if you want to save it forever')
          console.log(gamesToHide)
          window.localStorage.gahGamesToHide = gamesToHide
          hide()
        })
        $(game).append(hideIt)
      }
    })
  }

  // prepare a debounced function
  const hideDebounced = debounce(hide, 1000)

  // activate when window is scrolled
  // window.onscroll = hideDebounced;

  // activate when select is changed
  $('#gameTypes').change(hideDebounced)

  // start by default
  hideDebounced()
})
