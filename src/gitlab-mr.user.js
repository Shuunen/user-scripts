// ==UserScript==
// @name        Gitlab - MR Shortcuts
// @namespace   https://github.com/Shuunen
// @description Ease access to my affected MR / opened MR
// @author      Romain Racamier-Lafon
// @match       https://sd-gitlab.cm-cic.fr/*
// @grant       none
// @version     1.0
// ==/UserScript==

/* global fetch */

class GitlabMr {
  constructor () {
    var processDebounced = this.debounce(this.process.bind(this), 500)
    setTimeout(() => processDebounced(), 500)
    document.addEventListener('scroll', processDebounced)
  }

  debounce (func, wait, immediate) {
    var timeout
    return function debounced () {
      var context = this
      var args = arguments
      var later = function later () {
        timeout = null
        if (!immediate) {
          func.apply(context, args)
        }
      }
      var callNow = immediate && !timeout
      clearTimeout(timeout)
      timeout = setTimeout(later, wait)
      if (callNow) {
        func.apply(context, args)
      }
    }
  }

  enhanceLinks () {
    var link = document.querySelector('.dashboard-shortcuts-merge_requests:not(.processed)')
    if (!link) return
    link.classList.add('processed')
    var text = document.createElement('div')
    text.classList.add('label')
    text.textContent = 'MR affectée(s)'
    link.insertAdjacentElement('afterBegin', text)
    link.removeAttribute('data-original-title')
    var newListElement = link.parentElement.cloneNode(true)
    var newLink = newListElement.firstChild
    var newBadge = newLink.querySelector('.badge')
    var newLinkUrl = link.href.replace('assignee_username', 'author_username') + '&state=opened'
    newLink.href = newLinkUrl
    newLink.querySelector('.label').textContent = 'MR ouverte(s)'
    newBadge.innerHTML = '&nbsp;'
    link.parentElement.insertAdjacentElement('afterEnd', newListElement)
    fetch(newLinkUrl).then(r => r.text()).then(html => {
      var nb = html.match(/class="merge-request" data-id/g).length
      newBadge.textContent = nb && nb > 0 ? nb : ''
    })
  }

  process () {
    this.enhanceLinks()
  }
}

var instance = new GitlabMr()
console.log('GitlabMr start, here is the instance', instance)
