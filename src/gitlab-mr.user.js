// ==UserScript==
// @name         Gitlab - MR Shortcuts
// @downloadURL  https://github.com/Shuunen/user-scripts/raw/master/src/gitlab-mr.user.js
// @namespace    https://github.com/Shuunen
// @description  Ease access to my affected MR / opened MR
// @author       Romain Racamier-Lafon
// @match        https://some-gitlab.fr/*
// @require      https://cdn.jsdelivr.net/gh/Shuunen/user-scripts@2.6.1/src/utils.min.js
// @grant        none
// @version      1.1.4
// ==/UserScript==

// @ts-nocheck
/* eslint-disable jsdoc/require-jsdoc */

(function gitlabMr () {
  const debounceTime = 300
  /** @type {import('./utils.js').Shuutils} */// @ts-ignore
  const utils = new Shuutils('gitlab-mr')
  // eslint-disable-next-line max-statements
  function addButton (element, label, href) {
    const button = element.cloneNode(true)
    const link = button.firstChild
    const badge = link.querySelector('.badge')
    button.style.display = ''
    badge.innerHTML = '&nbsp;'
    badge.classList.add('ml-0')
    badge.classList.remove('hidden')
    link.href = href
    link.style.height = '28px'
    link.style.marginTop = '7px'
    link.style.marginRight = '2px'
    link.querySelector('.label').textContent = label
    element.insertAdjacentElement('afterEnd', button)
    fetch(href).then(async response => await response.text()).then(html => {
      const matches = html.match(/class="merge-request" data-id/gu)
      const nb = matches ? matches.length : 0
      utils.log('found', nb, 'matches for', label)
      badge.textContent = nb
      if (nb < 1) badge.style.backgroundColor = '#1aaa55'
      return nb
    }).catch(error => utils.error(error))
    return button
  }
  async function enhanceLinks () {
    const link = document.querySelector('.dashboard-shortcuts-merge_requests:not(.processed)')
    if (!link)
      return
    link.classList.add('processed')
    const text = document.createElement('div')
    text.classList.add('label')
    link.insertAdjacentElement('afterBegin', text)
    link.parentElement.style.display = 'none'
    await addButton(link.parentElement, 'MR affectée(s)', link.href.replace('assignee_username', 'wip=no&assignee_username'))
    await utils.sleep(debounceTime)
    await addButton(link.parentElement, 'MR ouverte(s)', `${link.href.replace('assignee_username', 'author_username')}&state=opened`)
  }
  function hideStuff () {
    for (const element of utils.findAll('.shortcuts-todos, .nav-item.header-help')) element.remove()
  }
  function process () {
    enhanceLinks()
    hideStuff()
  }
  const processDebounced = utils.debounce(process, debounceTime)
  utils.onPageChange(processDebounced)
})()
