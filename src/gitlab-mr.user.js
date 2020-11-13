// ==UserScript==
// @name        Gitlab - MR Shortcuts
// @namespace   https://github.com/Shuunen
// @description Ease access to my affected MR / opened MR
// @author      Romain Racamier-Lafon
// @match       https://sd-gitlab.cm-cic.fr/*
// @grant       none
// @version     1.1.2
// ==/UserScript==

/* global fetch */

class GitlabMr {
  constructor () {
    var processDebounced = this.debounce(this.process.bind(this), 500)
    setTimeout(() => processDebounced(), 500)
    document.addEventListener('scroll', processDebounced)
  }

  async sleep (ms) {
    return new Promise(resolve => setTimeout(resolve, (ms || 1000)))
  }

  debounce (function_, wait, immediate) {
    var timeout
    return function debounced () {
      var context = this
      var arguments_ = arguments
      var later = function later () {
        timeout = undefined
        if (!immediate) {
          function_.apply(context, arguments_)
        }
      }
      var callNow = immediate && !timeout
      clearTimeout(timeout)
      timeout = setTimeout(later, wait)
      if (callNow) {
        function_.apply(context, arguments_)
      }
    }
  }

  async enhanceLinks () {
    var link = document.querySelector('.dashboard-shortcuts-merge_requests:not(.processed)')
    if (!link) return
    link.classList.add('processed')
    var text = document.createElement('div')
    text.classList.add('label')
    link.insertAdjacentElement('afterBegin', text)
    link.parentElement.style.display = 'none'
    await this.addButton(link.parentElement, 'MR affectée(s)', link.href.replace('assignee_username', 'wip=no&assignee_username'))
    await this.sleep(300)
    await this.addButton(link.parentElement, 'MR ouverte(s)', link.href.replace('assignee_username', 'author_username') + '&state=opened')
  }

  async addButton (parent, label, href) {
    var button = parent.cloneNode(true)
    var link = button.firstChild
    var badge = link.querySelector('.badge')
    button.style.display = ''
    badge.innerHTML = '&nbsp;'
    badge.classList.add('ml-0')
    badge.classList.remove('hidden')
    link.href = href
    link.style.height = '28px'
    link.style.marginTop = '7px'
    link.style.marginRight = '2px'
    link.querySelector('.label').textContent = label
    parent.insertAdjacentElement('afterEnd', button)
    fetch(href).then(r => r.text()).then(html => {
      var matches = html.match(/class="merge-request" data-id/g)
      var nb = matches ? matches.length : 0
      console.log('found', nb, 'matches for', label)
      badge.textContent = nb
      if (nb < 1) badge.style.backgroundColor = '#1aaa55'
    })
    return button
  }

  hideStuff () {
    document.querySelectorAll('.shortcuts-todos, .nav-item.header-help').forEach(element => element.remove())
  }

  process () {
    this.enhanceLinks()
    this.hideStuff()
  }
}

var instance = new GitlabMr()
console.log('GitlabMr start, here is the instance', instance)
