// ==UserScript==
// @name         Github AIO
// @author       Romain Racamier-Lafon
// @description  Add nice features to GitHub
// @downloadURL  https://github.com/Shuunen/user-scripts/raw/master/src/github-aio.user.js
// @updateURL    https://github.com/Shuunen/user-scripts/raw/master/src/github-aio.user.js
// @grant        none
// @match        https://github.com/*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=github.com
// @namespace    https://github.com/Shuunen
// @require      https://cdn.jsdelivr.net/gh/Shuunen/user-scripts@master/src/utils.js
// @version      1.1.2
// ==/UserScript==

// oxlint-disable promise/prefer-await-to-callbacks

const bugIcon = `<svg xmlns="http://www.w3.org/2000/svg" width="12" height="16" class="octicon octicon-repo-issues" viewBox="0 0 53 53">
  <path d="M39 0c2 0 4 2 4 3 0 2-2 4-4 4h-1l-3 4 6 6-14 2-14-2 5-6-3-4h-1c-2 0-4-2-4-4 0-1 2-3 4-3s4 2 4 3l-1 2 4 4 6-1 5 1 4-4V3c0-1 1-3 3-3zm12 29c1 0 2 0 2 2l-2 2h-7v4l7 3c2 1 2 2 2 3l-3 1-8-3c-2 6-8 11-14 12V22c5 0 10-1 14-3v1l8-3c1 0 2 0 3 2 0 1 0 2-2 2l-7 3v5h7zM2 29h7l1-5-8-3-2-2 3-2 8 3v-1c4 2 9 2 14 3v31c-6-1-11-6-14-12l-7 3-3-1c-1-1 0-2 1-3l8-3-1-5-7 1-2-2c0-2 1-2 2-2z"/>
</svg>`
const pullRequestIcon = `<svg xmlns="http://www.w3.org/2000/svg" width="12" height="16" class="octicon octicon-git-pull-request" viewBox="0 0 16 16">
  <path fill="currentColor" fill-rule="evenodd" d="M7.177 3.073 9.573.677A.25.25 0 0 1 10 .854v4.792a.25.25 0 0 1-.427.177L7.177 3.427a.25.25 0 0 1 0-.354ZM3.75 2.5a.75.75 0 1 0 0 1.5.75.75 0 0 0 0-1.5Zm-2.25.75a2.25 2.25 0 1 1 3 2.122v5.256a2.251 2.251 0 1 1-1.5 0V5.372A2.25 2.25 0 0 1 1.5 3.25ZM11 2.5h-1V4h1a1 1 0 0 1 1 1v5.628a2.251 2.251 0 1 0 1.5 0V5A2.5 2.5 0 0 0 11 2.5Zm1 10.25a.75.75 0 1 1 1.5 0 .75.75 0 0 1-1.5 0Zm-8.5 0a.75.75 0 1 1 1.5 0 .75.75 0 0 1-1.5 0Z"/>
</svg>`
let firstRun = true
const minutesInHour = 60
const msInSecond = 1000
const cacheDurationMinutes = 60
const cacheDurationMs = cacheDurationMinutes * minutesInHour * msInSecond
const countError = -1
const selectors = {
  forkLink: '.Link--muted:last-of-type',
  licenseLabel: 'span:has(svg.octicon-law)',
  repoLink: 'a[itemprop="name codeRepository"]',
  userRepos: '#user-repositories-list > ul > li:not(.github-aio)',
}
/** @type {Record<string, string>} */
const licenseShortNames = { 'GNU General Public License v3.0': 'GPL Licence' }
let stopQuerying = false

/**
 * Shorten a repo's license label, if a shorter name is known for it
 * @param {Element} repo - The repo element
 */
function shortenLicenseLabel(repo) {
  const label = repo.querySelector(selectors.licenseLabel)
  const textNode = label?.lastChild
  if (!textNode) return
  const licenseName = textNode.textContent?.trim() ?? ''
  const shortName = licenseShortNames[licenseName]
  if (shortName) textNode.textContent = shortName
}

/**
 * Create issue count link element
 * @param {string} repoFullName - The full name of the repo
 * @param {number} count - The issue count
 * @returns {HTMLAnchorElement} The created link element
 */
function createIssueCountLink(repoFullName, count) {
  const link = document.createElement('a')
  link.className = `${count > 0 ? '' : 'Link--muted'} tooltipped tooltipped-s mr-3`
  if (count > 0) link.style.color = 'var(--color-ansi-red) !important'
  link.innerHTML = `${bugIcon} ${count === countError ? '&nbsp;?' : count}`
  link.href = `/${repoFullName}/issues`
  link.setAttribute('aria-label', 'see issues')
  return link
}

/**
 * Turn the fork count link into a pull request count link, in place
 * @param {HTMLElement} forkLink - The fork count link element to convert
 * @param {string} repoFullName - The full name of the repo
 * @param {number} count - The pull request count
 */
function convertToPullRequestCountLink(forkLink, repoFullName, count) {
  forkLink.className = `${count > 0 ? '' : 'Link--muted'} tooltipped tooltipped-s mr-3`
  forkLink.style.color = count > 0 ? 'var(--color-ansi-yellow) !important' : ''
  forkLink.innerHTML = `${pullRequestIcon} ${count === countError ? '&nbsp;?' : count}`
  forkLink.setAttribute('href', `/${repoFullName}/pulls`)
  forkLink.setAttribute('aria-label', 'see pull requests')
}

/**
 * Get repository full name from repo element
 * @param {Element} repo - The repo element
 * @param {InstanceType<typeof Shuutils>} [utils] - The utils instance for logging
 * @returns {string} The repo full name or "" an empty string if not found
 */
function getRepoFullName(repo, utils) {
  const repoLinkElement = repo.querySelector(selectors.repoLink)
  const repoLink = repoLinkElement?.getAttribute('href') ?? ''
  if (repoLink === '') {
    utils?.showError('Repository link not found')
    return ''
  }
  const repoFullName = repoLink.slice(1) // remove the leading /
  if (!repoFullName) {
    utils?.showError('Repository full name not found')
    return ''
  }
  return repoFullName
}

/**
 * Get the cache key for a repo's count
 * @param {string} repoFullName The full name of the repo like "owner/repo"
 * @param {'issues' | 'pulls'} endpoint The API endpoint queried
 * @returns {string} The cache key
 */
function getCacheKey(repoFullName, endpoint) {
  // "v2" bust : the "issues" endpoint used to wrongly count pull requests as issues
  return `github-aio-${endpoint}-v2-${repoFullName}`
}

/**
 * Get a cached count
 * @param {string} cacheKey The cache key to use
 * @returns {number} The cached count or -1 if not found
 */
function getCountCached(cacheKey) {
  const cachedData = localStorage.getItem(cacheKey)
  if (!cachedData) return countError
  const { count = countError, timestamp } = JSON.parse(cachedData)
  const isFresh = Date.now() - timestamp < cacheDurationMs
  if (!isFresh) return countError
  return count
}

function GithubAio() {
  const utils = new Shuutils('github-aio')
  /**
   * Fetch a count via the GitHub API
   * @param {string} repoFullName The full name of the repo like "owner/repo"
   * @param {'issues' | 'pulls'} endpoint The API endpoint to query
   * @param {number} cachedCount The cached count to use if available
   * @returns {Promise<number>} The count or -1 on error
   */
  function getCountApi(repoFullName, endpoint, cachedCount) {
    if (stopQuerying) {
      utils.warn(`stopping querying for ${endpoint} count`)
      return Promise.resolve(cachedCount)
    }
    utils.log(`fetching ${endpoint} count for`, repoFullName)
    const cacheKey = getCacheKey(repoFullName, endpoint)
    const apiUrl = `https://api.github.com/repos/${repoFullName}/${endpoint}?state=open`
    const headers = { accept: 'application/vnd.github.v3+json' }
    return fetch(apiUrl, { headers })
      .then(response => response.json())
      .then(response => {
        if (typeof response.message === 'string' && response.message.includes('rate limit exceeded')) {
          utils.warn('github api rate limit exceeded, using cached count')
          stopQuerying = true
          return cachedCount
        }
        // the "issues" endpoint also returns pull requests, so they need to be filtered out
        const count = endpoint === 'issues' ? response.filter((/** @type {{ pull_request?: unknown }} */ item) => !item.pull_request).length : response.length
        localStorage.setItem(cacheKey, JSON.stringify({ count, timestamp: Date.now() }))
        utils.debug(`cached ${endpoint} count for`, repoFullName)
        return count
      })
      .catch(error => {
        utils.error(`error on fetching repo ${endpoint} for "${repoFullName}"`, error)
        return countError
      })
  }
  /**
   * Fetch a count via the API with caching
   * @param {string} repoFullName The full name of the repo like "owner/repo"
   * @param {'issues' | 'pulls'} endpoint The API endpoint to query
   * @returns {Promise<number>} The count
   */
  function getCount(repoFullName, endpoint) {
    const cacheKey = getCacheKey(repoFullName, endpoint)
    const cachedCount = getCountCached(cacheKey)
    if (cachedCount !== countError) return Promise.resolve(cachedCount)
    return getCountApi(repoFullName, endpoint, cachedCount)
  }
  /**
   * Augment a repo with issue and pull request counts
   * @param {Element} repo - The repo element
   */
  async function augmentRepo(repo) {
    const repoFullName = getRepoFullName(repo, utils)
    if (repoFullName === '') return
    shortenLicenseLabel(repo)
    const forkLink = repo.querySelector(selectors.forkLink)
    const [issueCount, pullRequestCount] = await Promise.all([getCount(repoFullName, 'issues'), getCount(repoFullName, 'pulls')])
    if (forkLink instanceof HTMLElement) convertToPullRequestCountLink(forkLink, repoFullName, pullRequestCount)
    const issueLink = createIssueCountLink(repoFullName, issueCount)
    forkLink?.insertAdjacentHTML('afterend', issueLink.outerHTML)
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
    // important : mark all repos as processed before waiting for the async processes
    for (const repo of repos) repo.classList.add(utils.id)
    // oxlint-disable-next-line no-await-in-loop
    for (const repo of repos) await augmentRepo(repo)
    if (!stopQuerying) utils.showSuccess('augmented user repos')
  }
  /**
   * Process the page and hide elements
   * @param {string} reason - The reason for processing
   */
  async function start(reason = 'unknown') {
    utils.debug(`start called because "${reason}"`)
    await augmentUserRepos()
  }
  const startDebounceTime = 300
  const startDebounced = utils.debounce((/** @type {string} */ reason) => start(reason), startDebounceTime)
  globalThis.addEventListener('scroll', () => startDebounced('scroll'))
  utils.onPageChange(() => startDebounced('page-change'))
  document.addEventListener('DOMContentLoaded', () => start('initial-dom-loaded'))
  void start('initial-dom-ready')
}

if (globalThis.window) GithubAio()
else module.exports = { convertToPullRequestCountLink, createIssueCountLink, getCacheKey, getCountCached, getRepoFullName, shortenLicenseLabel }
