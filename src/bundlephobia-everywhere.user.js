// ==UserScript==
// @name         BundlePhobia <3 Everywhere
// @namespace    https://github.com/Shuunen
// @description  Show size of npm packages on Github & Npm
// @author       Romain Racamier-Lafon
// @inject-into  content
// @match        https://github.com/*
// @match        https://www.npmjs.com/package/*
// @grant        none
// @require      https://cdn.jsdelivr.net/gh/Shuunen/user-scripts@master/src/utils.js
// @version      1.1.1
// ==/UserScript==

(function BundlePhobiaEverywhere () {
  /* global Shuutils */
  /** @type {import('./utils.js').Shuutils} */
  // @ts-ignore
  const utils = new Shuutils({ debug: false, id: 'bdl-evr' }) // eslint-disable-line @typescript-eslint/naming-convention
  /**
   * Inject bundlephobia badges into the page
   * @param {string} name
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
    link.style.right = '0.8rem'
    link.style.top = '0.9rem'
    link.style.zIndex = '1000'
    link.style.display = 'flex'
    link.style.gap = '1rem'
    const /** @type HTMLElement */ anchor = document.querySelector('#readme') || document.body
    anchor.style.position = 'relative'
    anchor.append(link)
  }
  // eslint-disable-next-line max-statements
  function detectName () {
    let text = document.body.textContent
    if (!text) { utils.error('cannot find body text content'); return }
    if (!text.includes('npm')) { utils.log('does not seems like the good place to add a badge'); return }
    const copyBlock = utils.findOne('.lh-copy span')
    // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
    if (copyBlock) text = `${copyBlock.textContent}\n${text}`
    // eslint-disable-next-line regexp/prefer-regexp-exec
    const name = (text.match(/\b(?<provider>npm i|npm install|npx|yarn add).* (?<name>[^-][\w./@-]+)/iu) || text.match(/(?<provider>unpkg\.com)\/(?<name>@?[\w./-]+)/iu))?.groups?.name
    if (name === undefined) { utils.warn('failed to find a npm package name in this page'); return }
    utils.log('found package name :', name)
    injectBadge(name)
  }
  void utils.onPageChange(detectName)
})()
