// ==UserScript==
// @name         Gitlab - MR Shortcuts
// @author       Romain Racamier-Lafon
// @description  Ease access to my affected MR / opened MR
// @downloadURL  https://github.com/Shuunen/user-scripts/raw/master/src/gitlab-mr.user.js
// @updateURL    https://github.com/Shuunen/user-scripts/raw/master/src/gitlab-mr.user.js
// @grant        none
// @match        https://some-gitlab.fr/*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=some-gitlab.fr
// @namespace    https://github.com/Shuunen
// @require      https://cdn.jsdelivr.net/gh/Shuunen/monorepo@latest/apps/user-scripts/src/utils.js
// @version      1.1.6
// ==/UserScript==

// oxlint-disable promise/prefer-await-to-callbacks

function GitlabMr() {
  const debounceTime = 300

  const utils = new Shuutils('gitlab-mr')
  /**
   * Clones a given element to create a new button, updates its label and href,
   * fetches the provided href to count merge requests, and updates the badge accordingly.
   *
   * @param {HTMLElement} element - The DOM element to clone as a template for the button.
   * @param {string} label - The text label to display on the button.
   * @param {string} href - The URL to set for the button link and to fetch for counting merge requests.
   * @returns {HTMLElement} The newly created button element.
   */
  function addButton(element, label, href) {
    const button = element.cloneNode(true)
    if (!(button instanceof HTMLElement)) {
      utils.showError('button is not an HTMLElement')
      return element
    }
    const link = button.querySelector('a')
    if (!link) {
      utils.error('no link found in element', element)
      return button
    }
    if (!(link instanceof HTMLAnchorElement)) {
      utils.error('link is not an anchor element', link)
      return button
    }
    const badge = link.querySelector('.badge')
    if (!badge) {
      utils.error('no badge found in link', link)
      return button
    }
    if (!(badge instanceof HTMLElement)) {
      utils.error('badge is not a span element', badge)
      return button
    }
    button.style.display = ''
    badge.innerHTML = '&nbsp;'
    badge.classList.add('ml-0')
    badge.classList.remove('hidden')
    link.href = href
    link.style.height = '28px'
    link.style.marginTop = '7px'
    link.style.marginRight = '2px'
    const labelInside = link.querySelector('.label')
    if (labelInside) labelInside.textContent = label
    element.after(button)
    fetch(href)
      .then(response => response.text())
      .then(html => {
        const matches = html.match(/class="merge-request" data-id/gu)
        const nb = matches ? matches.length : 0
        utils.log('found', nb, 'matches for', label)
        badge.textContent = String(nb)
        if (nb < 1) badge.style.backgroundColor = '#1aaa55'
        return nb
      })
      .catch(error => utils.error(error))
    return button
  }
  async function enhanceLinks() {
    const link = document.querySelector('.dashboard-shortcuts-merge_requests:not(.processed)')
    if (!link) return
    if (!link.parentElement) {
      utils.error('no parent element found for link', link)
      return
    }
    if (!(link instanceof HTMLAnchorElement)) {
      utils.error('link is not an anchor element', link)
      return
    }
    link.classList.add('processed')
    const text = document.createElement('div')
    text.classList.add('label')
    link.after(text)
    link.parentElement.style.display = 'none'
    addButton(link.parentElement, 'MR affectée(s)', link.href.replace('assignee_username', 'wip=no&assignee_username'))
    await utils.sleep(debounceTime)
    addButton(link.parentElement, 'MR ouverte(s)', `${link.href.replace('assignee_username', 'author_username')}&state=opened`)
  }
  function hideStuff() {
    for (const element of utils.findAll('.shortcuts-todos, .nav-item.header-help')) element.remove()
  }
  function start() {
    void enhanceLinks()
    hideStuff()
  }
  const startDebounced = utils.debounce(start, debounceTime)
  utils.onPageChange(startDebounced)
}

if (globalThis.window) GitlabMr()
