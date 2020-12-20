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
// @version     1.0.7
// ==/UserScript==

(function () {
  /* global Shuutils */
  const utils = new Shuutils({ id: 'bdl-evr', debug: false })
  const injectBadge = async (name) => {
    const url = `https://img.shields.io/bundlephobia/min/${name}`
    const image = document.createElement('img')
    image.src = url
    image.style = 'position: absolute; right: 0; top: 1rem;'
    const anchor = document.querySelector('main article h1') || document.querySelector('#readme') || document.body
    anchor.style.position = 'relative'
    anchor.append(image)
  }
  const detectName = () => {
    let text = document.body.textContent
    if (text.includes('npm') === false) return utils.log('does not seems like the good place to add a badge')
    const copyBlock = utils.findOne('.lh-copy span')
    if (copyBlock) text = copyBlock.textContent + '\n' + text
    const name = (text.match(/\b(npm i|npm install|npx|yarn add).* ([^-][\w./@-]+)/) || [])[2]
    if (name === undefined) return utils.warn('failed to find a npm package name in this page')
    utils.log('found package name :', name)
    injectBadge(name)
  }
  utils.onPageChange(detectName)
})()
