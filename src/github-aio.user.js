// ==UserScript==
// @author       Romain Racamier-Lafon
// @description  Add nice features to GitHub
// @downloadURL  https://github.com/Shuunen/user-scripts/raw/master/src/github-aio.user.js
// @grant        none
// @match        https://github.com/*
// @name         Github AIO
// @namespace    https://github.com/Shuunen
// @require      https://cdn.jsdelivr.net/gh/Shuunen/user-scripts@latest/src/utils.js
// @version      1.0.0
// ==/UserScript==

const bugIcon = `<svg xmlns="http://www.w3.org/2000/svg" width="12" height="16" class="octicon octicon-repo-issues" viewBox="0 0 53 53">
  <path d="M39 0c2 0 4 2 4 3 0 2-2 4-4 4h-1l-3 4 6 6-14 2-14-2 5-6-3-4h-1c-2 0-4-2-4-4 0-1 2-3 4-3s4 2 4 3l-1 2 4 4 6-1 5 1 4-4V3c0-1 1-3 3-3zm12 29c1 0 2 0 2 2l-2 2h-7v4l7 3c2 1 2 2 2 3l-3 1-8-3c-2 6-8 11-14 12V22c5 0 10-1 14-3v1l8-3c1 0 2 0 3 2 0 1 0 2-2 2l-7 3v5h7zM2 29h7l1-5-8-3-2-2 3-2 8 3v-1c4 2 9 2 14 3v31c-6-1-11-6-14-12l-7 3-3-1c-1-1 0-2 1-3l8-3-1-5-7 1-2-2c0-2 1-2 2-2z"/>
</svg>`;
let firstRun = true;
const minutesInHour = 60
const msInSecond = 1000
const cacheDurationMinutes = 30
const cacheDurationMs = cacheDurationMinutes * minutesInHour * msInSecond;
const countError = -1;
let stopQuerying = false;

// eslint-disable-next-line max-statements
(() => {
  /** @type {import('./utils.js').Shuutils} */// @ts-ignore
  const utils = new Shuutils('github-aio')
  const selectors = {
    lastLink: '.mr-3.Link--muted:last-of-type',
    repoLink: 'a[itemprop="name codeRepository"]',
    userRepos: '#user-repositories-list > ul > li:not(.github-aio)',
  }
  /**
   * Get issue count from cache
   * @param {string} repoFullName The full name of the repo like "owner/repo"
   * @param {string} cacheKey The cache key to use
   * @returns {number} The issue count or -1 if not found
   */
  function getIssueCountCached(repoFullName, cacheKey) {
    const cachedData = localStorage.getItem(cacheKey)
    if (!cachedData) return countError
    const { count = countError, timestamp } = JSON.parse(cachedData)
    const isFresh = Date.now() - timestamp < cacheDurationMs
    if (!isFresh) return countError
    utils.debug('using cached issue count for', repoFullName)
    return count
  }
  /**
   * Fetch issue count via API
   * @param {string} repoFullName The full name of the repo like "owner/repo"
   * @param {string} cacheKey The cache key to use
   * @param {number} cachedCount The cached count to use if available
   * @returns {Promise<number>} The issue count or -1 on error
   */
  function getIssueCountApi(repoFullName, cacheKey, cachedCount) {
    if (stopQuerying) {
      utils.warn('stopping querying for issue count')
      return Promise.resolve(cachedCount)
    }
    utils.log('fetching issue count for', repoFullName)
    const apiUrl = `https://api.github.com/repos/${repoFullName}/issues?state=open`;
    const headers = { 'Accept': 'application/vnd.github.v3+json' };
    return fetch(apiUrl, { headers })
      .then(response => response.json())
      .then(response => {
        if (typeof response.message === 'string' && response.message.includes('rate limit exceeded')) {
          utils.warn('github api rate limit exceeded, using cached count')
          stopQuerying = true
          return cachedCount
        }
        const count = response.length
        localStorage.setItem(cacheKey, JSON.stringify({ count, timestamp: Date.now() }))
        utils.debug('cached issue count for', repoFullName)
        return count
      })
      .catch(error => {
        utils.error(`error on fetching repo issues for "${repoFullName}"`, error);
        return countError;
      });
  }
  /**
   * Fetch issue count via API with caching
   * @param {string} repoFullName The full name of the repo like "owner/repo"
   * @returns {Promise<number>} The issue count
   */
  function getIssueCount(repoFullName) {
    const cacheKey = `github-aio-issues-${repoFullName}`
    const cachedCount = getIssueCountCached(repoFullName, cacheKey)
    if (cachedCount !== countError) return Promise.resolve(cachedCount)
    return getIssueCountApi(repoFullName, cacheKey, cachedCount)
  }
  /**
   * Get repository full name from repo element
   * @param {HTMLElement} repo - The repo element
   * @returns {string} The repo full name or "" an empty string if not found
   */
  function getRepoFullName(repo) {
    const repoLinkElement = repo.querySelector(selectors.repoLink)
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
    link.className = `${count > 0 ? '' : 'Link--muted'} tooltipped tooltipped-s mr-3`
    if (count > 0) link.style.color = 'var(--color-ansi-red) !important'
    else if (count === 0) link.style.color = 'var(--color-ansi-green) !important'
    link.innerHTML = `${bugIcon} ${count === countError ? '&nbsp;?' : count}`
    link.href = `/${repoFullName}/issues`
    link.setAttribute('aria-label', 'see issues')
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
    const lastLink = repo.querySelector(selectors.lastLink)
    utils.debug({ lastLink, repo })
    const count = await getIssueCount(repoFullName)
    const link = createIssueCountLink(repoFullName, count)
    lastLink?.insertAdjacentHTML('afterend', link.outerHTML)
  }
  /**
   * Augment user repos : add issue count
   */
  async function augmentUserRepos() {
    const repos = utils.findAll(selectors.userRepos, document, true)
    if (repos.length === 0) {
      if (firstRun) utils.warn('found no user repos to augment')
      else utils.log('no more user repos to augment')
      firstRun = false
      return
    }
    firstRun = false
    utils.log(`found ${repos.length} user repos to augment`)
    // eslint-disable-next-line no-await-in-loop
    for (const repo of repos) await augmentRepo(repo)
    if (!stopQuerying) utils.showSuccess('augmented user repos')
  }
  /**
   * Process the page and hide elements
   * @param {string} reason - The reason for processing
   */
  async function process(reason = 'unknown') {
    utils.debug(`process called because "${reason}"`)
    await augmentUserRepos()
  }
  const processDebounced = utils.debounce((/** @type {string} */ reason) => process(reason), 300) // eslint-disable-line no-magic-numbers
  globalThis.addEventListener('scroll', () => processDebounced('scroll'))
  utils.onPageChange(() => processDebounced('page-change'))
  document.addEventListener('DOMContentLoaded', () => process('initial-dom-loaded'))
  process('initial-dom-ready')
})()
