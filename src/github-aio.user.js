// ==UserScript==
// @author       Romain Racamier-Lafon
// @description  Add nice features to GitHub
// @downloadURL  https://github.com/Shuunen/user-scripts/raw/master/src/github-aio.user.js
// @grant        none
// @match        https://github.com/*
// @name         Github AIO
// @namespace    https://github.com/Shuunen
// @require      https://cdn.jsdelivr.net/gh/Shuunen/user-scripts@latest/src/utils.js
// @version      0.0.1
// ==/UserScript==

const bugIcon = `<svg class="octicon octicon-repo-issues" xmlns="http://www.w3.org/2000/svg" width="12" height="16" viewBox="0 0 53 53">
				<path d="m39.2 0c2 0 3.7 1.5 3.7 3.4 0 1.9-1.7 3.4-3.7 3.4l-0.9-0.1-3.4 4c2.3 1.6 4.4 3.8 6 6.4-4 1.2-8.9 1.9-14.2 1.9-5.3 0-10.1-0.7-14.2-1.9 1.5-2.6 3.5-4.7 5.7-6.3l-3.5-4.1c-0.2 0-0.4 0.1-0.6 0.1-2 0-3.7-1.5-3.7-3.4 0-1.9 1.7-3.4 3.7-3.4 2 0 3.7 1.5 3.7 3.4 0 0.7-0.2 1.3-0.6 1.8l3.5 4.2c1.8-0.8 3.8-1.3 5.9-1.3 2 0 3.9 0.4 5.6 1.2l3.7-4.3c-0.3-0.5-0.4-1-0.4-1.6 0-1.9 1.6-3.4 3.7-3.4zm11.8 28.5c1.2 0 2.2 0.9 2.2 2 0 1.1-1 2-2.2 2l-6.7 0c-0.1 1.5-0.3 2.9-0.6 4.3l7.8 3.4c1.1 0.5 1.6 1.7 1.1 2.7-0.5 1-1.8 1.5-2.9 1l-7.2-3.1c-2.7 6.7-8 11.4-14.3 12.1l0-31.2c5.2-0.1 10-1 13.9-2.3l0.3 0.7 7.5-2.7c1.1-0.4 2.4 0.1 2.9 1.2 0.4 1.1-0.1 2.2-1.3 2.6l-7.9 2.8c0.3 1.4 0.6 2.9 0.7 4.5l6.7 0 0 0zm-48.7 0 6.7 0c0.1-1.5 0.3-3.1 0.7-4.5l-7.9-2.8c-1.1-0.4-1.7-1.6-1.3-2.6 0.4-1 1.7-1.6 2.9-1.2l7.5 2.7 0.3-0.7c3.9 1.3 8.7 2.1 13.9 2.3l0 31.2c-6.2-0.7-11.5-5.4-14.3-12.1l-7.2 3.1c-1.1 0.5-2.4 0-2.9-1-0.5-1 0-2.2 1.1-2.7l7.8-3.4c-0.3-1.4-0.5-2.8-0.6-4.3l-6.7 0c-1.2 0-2.2-0.9-2.2-2 0-1.1 1-2 2.2-2z" />
			</svg>`;

// eslint-disable-next-line max-statements
(function githubAio() {
  /** @type {import('./utils.js').Shuutils} */// @ts-ignore
  const utils = new Shuutils('github-aio')
  const selectors = {
    userRepos: '#user-repositories-list > ul > li:not(.github-aio)',
  }
  /**
   * Fetch issue count via API
   * @param {string} repoFullName The full name of the repo like "owner/repo"
   * @returns {Promise<number>} The issue count
   */
  function fetchIssueCountViaAPI(repoFullName) {
    const apiUrl = `https://api.github.com/repos/${repoFullName}/issues?state=open`;
    const headers = { 'Accept': 'application/vnd.github.v3+json' };
    return fetch(apiUrl, { headers })
      .then(response => response.json())
      .then(issues => {
        utils.debug('issues', issues)
        return issues.length
      })
      .catch(error => { utils.error(`GitHub Issue Counter: Error for ${repoFullName}`, error); });
  }
  /**
   * Get repository full name from repo element
   * @param {HTMLElement} repo - The repo element
   * @returns {string} The repo full name or "" an empty string if not found
   */
  function getRepoFullName(repo) {
    const repoLinkElement = repo.querySelector('a[itemprop="name codeRepository"]')
    const repoLink = repoLinkElement?.getAttribute('href') ?? ''
    if (repoLink === '') {
      utils.error('no repo link found in', repo)
      return ""
    }
    const repoFullName = repoLink.slice(1) // remove the leading /
    if (!repoFullName) {
      utils.error('failed to extract repo full name from link :', repoLink)
      return ""
    }
    return repoFullName
  }
  /**
   * Create issue count link element
   * @param {string} repoFullName - The full name of the repo
   * @param {number} count - The issue count
   * @returns {HTMLAnchorElement} The created link element
   */
  function createIssueCountLink(repoFullName, count) {
    const link = document.createElement('a')
    // eslint-disable-next-line unicorn/no-keyword-prefix
    link.className = 'muted-link tooltipped tooltipped-s mr-3'
    link.innerHTML = `${bugIcon} ${count}`
    link.href = `/${repoFullName}/issues`
    link.setAttribute('aria-label', `${count} issues`)
    return link
  }
  /**
   * Augment a repo with issue count
   * @param {HTMLElement} repo - The repo element
   */
  async function augmentRepo(repo) {
    repo.classList.add(utils.id)
    const repoFullName = getRepoFullName(repo)
    if (repoFullName === '') return
    const lastLink = repo.querySelector('.mr-3.Link--muted:last-of-type')
    utils.debug({ lastLink, repo })
    const count = await fetchIssueCountViaAPI(repoFullName)
    const link = createIssueCountLink(repoFullName, count)
    lastLink?.insertAdjacentHTML('afterend', link.outerHTML)
  }
  /**
   * Augment user repos : add issue count
   */
  function augmentUserRepos() {
    const repos = utils.findAll(selectors.userRepos)
    if (repos.length === 0) {
      utils.debug('No user repos found')
      return
    }
    utils.debug(`Found ${repos.length} user repos`)
    for (const repo of repos) augmentRepo(repo)
  }
  /**
   * Process the page and hide elements
   * @param {string} reason - The reason for processing
   */
  function process(reason = 'unknown') {
    utils.debug(`process called because "${reason}"`)
    augmentUserRepos()
  }
  const processDebounced = utils.debounce((/** @type {string} */ reason) => process(reason), 300) // eslint-disable-line no-magic-numbers
  globalThis.addEventListener('scroll', () => processDebounced('scroll'))
  utils.onPageChange(() => processDebounced('page-change'))
  document.addEventListener('DOMContentLoaded', () => process('initial-dom-loaded'))
  process('initial-dom-ready')
})()
