// ==UserScript==
// @name         Digiposte - Rename helper
// @namespace    https://github.com/Shuunen
// @version      1.0.1
// @description  Rename files with one keypress
// @author       Romain Racamier-Lafon
// @match        https://secure.digiposte.fr/
// @grant        none
// ==/UserScript==

(function () {
  /* global KeyboardEvent, Event */
  'use strict'

  console.log('drh : init')

  var monthsIn = ['janv', 'févr', 'mars', 'avr', 'mai', 'juin', 'juil', 'août', 'sept', 'oct', 'nov', 'déc']
  var monthsOut = ['01', '02', '03', '04', '05', '06', '07', '08', '09', '10', '11', '12']

  var formatDate = function (string, full) {
    var found = false
    string = string.replace('.', '')
    console.log('drh : trying to format date', string)
    monthsIn.forEach(function (monthIn, monthIndex) {
      var monthPos = string.indexOf(monthIn)
      if (monthPos !== -1) {
        found = true
        string = string.replace(monthIn, monthsOut[monthIndex])
      }
    })
    if (!found) {
      window.alert('drh : did not found month in', string)
    }
    var array = string.split(' ')
    var year = array[2]
    if (year.length < 4) {
      year = '20' + year
    }
    var month = array[1]
    if (month.length < 2) {
      month = '0' + month
    }
    var day = array[0]
    if (day.length < 2) {
      day = '0' + day
    }
    return year + '-' + month + (full ? '-' + day : '')
  }

  var triggerChange = function (element) {
    element.dispatchEvent(new KeyboardEvent('change'))
    element.dispatchEvent(new Event('input', {
      bubbles: true,
      cancelable: true,
    }))
  }

  var openModal = function (fullDate, doReplace) {
    if (!document.querySelector('.safeContent_item--selected')) {
      window.alert('drh : please select a document :)')
      return false
    }
    document.querySelector('.dataAction_link--rename').click()
    var datePourrie = document.querySelector('.safeContent_item--selected .safeContent_item_inner--date').textContent
    var dateNickel = formatDate(datePourrie, fullDate)
    console.log('drh : document date is', dateNickel)
    setTimeout(function () {
      var modalInput = document.querySelector('.modal_form_input')
      modalInput.value = dateNickel + (doReplace ? '' : ' ' + modalInput.value)
      triggerChange(modalInput)
      setTimeout(function () {
        document.querySelector('.modal_form_submit').click()
      }, 100)
    }, 300)
  }

  window.addEventListener('keydown', function (event) {
    if (event.key === 'F2') {
      console.log('drh : F2 pressed !')
      openModal(false, false)
      return false
    } else if (event.key === 'F3') {
      console.log('drh : F3 pressed !')
      openModal(false, true)
      return false
    } else if (event.key === 'F4') {
      console.log('drh : F4 pressed !')
      openModal(true, false)
      return false
    } else {
      console.log('drh : keyCode', event.key, 'not handled')
      return true
    }
  })
})()
