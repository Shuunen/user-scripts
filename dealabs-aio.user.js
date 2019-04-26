// ==UserScript==
// @name         Dealabs - All in one
// @namespace    https://github.com/Shuunen
// @version      1.0.1
// @description  Un-clutter & add filters to Dealabs
// @author       Romain Racamier-Lafon
// @match        https://www.dealabs.com/*
// @require      https://raw.githubusercontent.com/Shuunen/user-scripts/master/utils.js
// @grant none
// ==/UserScript==

(function () {
  /* global Shuutils */
  'use strict'

  var app = {
    id: 'dlb-clr',
    debug: false
  }

  var uselessElements = {
    righNav: '.listLayout-side',
    subNav: '.subNavMenu--morph',
    banner: '.box--all-b',
    flash: '.cept-threadUpdate',
    buttons: '.threadGrid-body > .boxAlign-ai--all-c',
    showMore: '.thread-link.linkPlain.text--b.overflow--wrap-off',
    data: '.threadGrid-footerMeta, .metaRibbon'
  }

  var uselessClasses = {
    descriptions: '.cept-description-container'
  }

  var utils = new Shuutils(app)

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

  function injectStyles () {
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
      `
    document.head.insertAdjacentElement('beforeend', styleTag)
  }

  function process () {
    utils.log('processing')
    injectStyles()
    cleanClasses()
    cleanElements()
  }

  process()

  var processDebounced = utils.debounce(process, 500)
  document.addEventListener('scroll', processDebounced)
  document.addEventListener('load', processDebounced)
})()
