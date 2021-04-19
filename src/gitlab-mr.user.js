// ==UserScript==
// @name        Gitlab - MR Shortcuts
// @namespace   https://github.com/Shuunen
// @description Ease access to my affected MR / opened MR
// @author      Romain Racamier-Lafon
// @match       https://sd-gitlab.cm-cic.fr/*
// @require     https://raw.githubusercontent.com/Shuunen/user-scripts/master/src/utils.js
// @grant       none
// @version     1.1.3
// ==/UserScript==

(function GitlabMR() {
  /* global document, fetch, Shuutils */
  const utils = new Shuutils({ id: 'gitlab-mr', debug: false })
  const enhanceLinks = async () => {
    const link = document.querySelector('.dashboard-shortcuts-merge_requests:not(.processed)')
    if (!link) return
    link.classList.add('processed')
    const text = document.createElement('div')
    text.classList.add('label')
    link.insertAdjacentElement('afterBegin', text)
    link.parentElement.style.display = 'none'
    await addButton(link.parentElement, 'MR affectée(s)', link.href.replace('assignee_username', 'wip=no&assignee_username'))
    await utils.sleep(300)
    await addButton(link.parentElement, 'MR ouverte(s)', link.href.replace('assignee_username', 'author_username') + '&state=opened')
  }
  const addButton = async (parent, label, href) => {
    const button = parent.cloneNode(true)
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
    parent.insertAdjacentElement('afterEnd', button)
    fetch(href).then(r => r.text()).then(html => {
      const matches = html.match(/class="merge-request" data-id/g)
      const nb = matches ? matches.length : 0
      utils.log('found', nb, 'matches for', label)
      badge.textContent = nb
      if (nb < 1) badge.style.backgroundColor = '#1aaa55'
    })
    return button
  }
  const hideStuff = () => {
    utils.findAll('.shortcuts-todos, .nav-item.header-help').forEach(element => element.remove())
  }
  const process = () => {
    enhanceLinks()
    hideStuff()
  }
  const processDebounced = utils.debounce(process, 500)
  utils.onPageChange(processDebounced)
})()
