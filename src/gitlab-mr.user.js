// ==UserScript==
// @name        Gitlab - MR Shortcuts
// @namespace   https://github.com/Shuunen
// @description Ease access to my affected MR / opened MR
// @author      Romain Racamier-Lafon
// @match       https://sd-gitlab.cm-cic.fr/*
// @grant       none
// @version     1.1.1
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
    var btn = parent.cloneNode(true)
    var link = btn.firstChild
    var badge = link.querySelector('.badge')
    btn.style.display = ''
    badge.innerHTML = '&nbsp;'
    badge.classList.add('ml-0')
    badge.classList.remove('hidden')
    link.href = href
    link.style.height = '28px'
    link.style.marginTop = '7px'
    link.style.marginRight = '2px'
    link.querySelector('.label').textContent = label
    parent.insertAdjacentElement('afterEnd', btn)
    fetch(href).then(r => r.text()).then(html => {
      var matches = html.match(/class="merge-request" data-id/g)
      var nb = matches ? matches.length : 0
      console.log('found', nb, 'matches for', label)
      badge.textContent = nb
      if (nb < 1) badge.style.backgroundColor = '#1aaa55'
    })
    return btn
  }

  hideStuff () {
    document.querySelectorAll('.shortcuts-todos, .nav-item.header-help').forEach(el => el.remove())
  }

  process () {
    this.enhanceLinks()
    this.hideStuff()
  }
}

var instance = new GitlabMr()
console.log('GitlabMr start, here is the instance', instance)
