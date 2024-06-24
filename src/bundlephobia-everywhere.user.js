// ==UserScript==
// @name         BundlePhobia <3 Everywhere
// @downloadURL  https://github.com/Shuunen/user-scripts/raw/master/src/bundlephobia-everywhere.user.js
// @namespace    https://github.com/Shuunen
// @description  Show size of npm packages on Github & Npm
// @author       Romain Racamier-Lafon
// @inject-into  content
// @match        https://github.com/*
// @match        https://www.npmjs.com/package/*
// @grant        none
// @require      https://cdn.jsdelivr.net/gh/Shuunen/user-scripts@2.6.1/src/utils.min.js
// @version      1.1.1
// ==/UserScript==

(function BundlePhobiaEverywhere () {
  /** @type {import('./utils.js').Shuutils} */// @ts-ignore
  const utils = new Shuutils('bdl-evr')
  /**
   * Inject bundlephobia badges into the page
   * @param {string} name the package name
   */
  // eslint-disable-next-line max-statements
  function injectBadge (name) {
    const link = document.createElement('a')
    link.innerHTML = `"${name}" stats from BundlePhobia :
      <img src="https://badgen.net/bundlephobia/min/${name}" alt="minified size" />
      <img src="https://badgen.net/bundlephobia/dependency-count/${name}" alt="dependency count" />`
    link.href = `https://bundlephobia.com/package/${name}`
    link.target = '_blank'
    link.style.position = 'absolute'
    link.style.right = '16px'
    link.style.top = '18px'
    link.style.zIndex = '1000'
    link.style.display = 'flex'
    link.style.gap = '20px'
    const /** @type {HTMLElement} */ anchor = document.querySelector('#readme') || document.body
    anchor.style.position = 'relative'
    anchor.append(link)
  }
  /**
   * Detect the package name in the page and inject the badge
   */
  // eslint-disable-next-line max-statements
  function detectName () {
    let text = document.body.textContent
    if (!text) { utils.error('cannot find body text content'); return }
    if (!text.includes('npm')) { utils.log('does not seems like the good place to add a badge'); return }
    const copyBlock = utils.findOne('.lh-copy span')
    if (copyBlock) text = `${copyBlock.textContent}\n${text}`
    const name = (text.match(/\b(?<provider>npm i|npm install|npx|yarn add).* (?<name>[^-][\w./@-]+)/iu) || text.match(/(?<provider>unpkg\.com)\/(?<name>@?[\w./-]+)/iu))?.groups?.name
    if (name === undefined) { utils.warn('failed to find a npm package name in this page'); return }
    utils.log('found package name :', name)
    injectBadge(name)
  }
  utils.onPageChange(detectName)
})()
