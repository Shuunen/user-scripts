// ==UserScript==
// @name        BundlePhobia <3 Everywhere
// @namespace   https://github.com/Shuunen
// @description Show size of npm packages on Github & Npm
// @author      Romain Racamier-Lafon
// @inject-into content
// @match       https://github.com/*
// @match       https://www.npmjs.com/package/*
// @grant       none
// @require     https://raw.githubusercontent.com/Shuunen/user-scripts/master/src/utils.js
// @version     1.1.1
// ==/UserScript==

(function BundlePhobiaEverywhere () {
  /* global Shuutils */
  const utils = new Shuutils({ id: 'bdl-evr', debug: false })
  /**
   * Inject bundlephobia badges into the page
   * @param {string} name
   */
  const injectBadge = async name => {
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
  const detectName = () => {
    let text = document.body.textContent
    if(!text) return utils.error('cannot find body text content')
    if (text.includes('npm') === false) return utils.log('does not seems like the good place to add a badge')
    const copyBlock = utils.findOne('.lh-copy span')
    if (copyBlock) text = copyBlock.textContent + '\n' + text
    const name = (text.match(/\b(npm i|npm install|npx|yarn add).* ([^-][\w./@-]+)/) || text.match(/(unpkg\.com)\/(@?[\w./-]+)/) || [])[2]
    if (name === undefined) return utils.warn('failed to find a npm package name in this page')
    utils.log('found package name :', name)
    injectBadge(name)
  }
  utils.onPageChange(detectName)
})()
