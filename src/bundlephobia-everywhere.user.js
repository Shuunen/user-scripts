// ==UserScript==
// @name         BundlePhobia <3 Everywhere
// @author       Romain Racamier-Lafon
// @description  Show size of npm packages on Github & Npm
// @downloadURL  https://github.com/Shuunen/user-scripts/raw/master/src/bundlephobia-everywhere.user.js
// @updateURL    https://github.com/Shuunen/user-scripts/raw/master/src/bundlephobia-everywhere.user.js
// @grant        none
// @inject-into  content
// @match        https://github.com/*
// @match        https://www.npmjs.com/package/*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=npmjs.com
// @namespace    https://github.com/Shuunen
// @require      https://cdn.jsdelivr.net/gh/Shuunen/monorepo@latest/apps/user-scripts/src/utils.js
// @version      1.1.3
// ==/UserScript==

const pkgManagerRegex = /\b(?<provider>npm i|npm install|npx|yarn add).* (?<name>[^-][\w./@-]+)/iu
const onlineLibRegex = /(?<provider>unpkg\.com)\/(?<name>@?[\w./-]+)/iu

function BundlephobiaEverywhere() {
  const utils = new Shuutils('bdl-evr')
  /**
   * Inject bundlephobia badges into the page
   * @param {string} name the package name
   */
  function injectBadge(name) {
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
    const anchor = document.querySelector('#readme') || document.body
    if (!(anchor instanceof HTMLElement)) {
      utils.showError('anchor is not an HTMLElement')
      return
    }
    anchor.style.position = 'relative'
    anchor.append(link)
  }
  /**
   * Detect the package name in the page and inject the badge
   */
  function detectName() {
    let text = document.body.textContent
    if (!text) {
      utils.error('cannot find body text content')
      return
    }
    if (!text.includes('npm')) {
      utils.log('does not seems like the good place to add a badge')
      return
    }
    const copyBlock = utils.findOne('.lh-copy span')
    if (copyBlock) text = `${copyBlock.textContent}\n${text}`
    const name = (pkgManagerRegex.exec(text) || onlineLibRegex.exec(text))?.groups?.name
    if (name === undefined) {
      utils.warn('failed to find a npm package name in this page')
      return
    }
    utils.log('found package name :', name)
    injectBadge(name)
  }
  utils.onPageChange(detectName)
}

if (globalThis.window) BundlephobiaEverywhere()
