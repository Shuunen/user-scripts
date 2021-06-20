// ==UserScript==
// @name         AliExpress - All in one
// @namespace    https://github.com/Shuunen
// @version      1.0.2
// @description  Bigger listing
// @author       Romain Racamier-Lafon
// @match        https://*.aliexpress.com/*
// @require      https://raw.githubusercontent.com/Shuunen/user-scripts/master/src/utils.js
// @grant        none
// ==/UserScript==

(function AliExpressAIO () {
  /* global Shuutils */
  const utils = new Shuutils({ id: 'ali-express-aio', debug: false })
  const extendsImage = (img, size = 600) => {
    // img.src = img.src.split('.jpg_')[0] + '.jpg'
    img.style.height = `${size}px`
    img.style.width = `${size}px`
    img.style.maxHeight = 'inherit'
    img.style.maxWidth = 'inherit'
  }
  const processProductCard = element => {
    const img = element.querySelector('.item-img, img')
    if (!img || !img.src) return utils.error('cannot find image on card el', element)
    extendsImage(img)
    const wrapper = img.closest('.product-img, a')
    if (!wrapper) return utils.error('failed to find wrapper of', img)
    wrapper.style.height = 'inherit'
    wrapper.style.width = 'inherit'
    element.style.display = 'flex'
    const zone = element.querySelector('.right-zone')
    if (!zone) return utils.error('cannot find zone on card el', element)
    zone.style.paddingLeft = '16px'
    zone.style.marginTop = '16px'
    zone.previousElementSibling.style.width = '80%'
    element.classList.add('ali-aio-handled')
  }
  const processItemRow = element => {
    const img = element.querySelector('.pic-core')
    if (!img || !img.src) return utils.error('cannot find image on row el', element)
    utils.log('image src was', img.src)
    extendsImage(img, 500)
    utils.log('now image src is', img.src)
    let wrapper = img.closest('.pic')
    wrapper.style.height = 'inherit'
    wrapper.style.width = 'inherit'
    wrapper = wrapper.parentElement
    wrapper.style.height = 'inherit'
    wrapper.style.width = 'inherit'
    element.style.display = 'flex'
    element.style.height = 'inherit'
    element.classList.add('ali-aio-handled')
  }
  const all = selector => [...document.querySelectorAll(selector)]
  const processProductCards = () => all('.list.product-card:not(.ali-aio-handled)').map(element => processProductCard(element))
  const processItemRows = () => all('.items-list > .item:not(.ali-aio-handled)').map(element => processItemRow(element))
  const process = () => {
    utils.log('process...')
    processProductCards()
    processItemRows()
  }
  const processDebounced = utils.debounce(process, 1000)
  window.addEventListener('scroll', processDebounced)
})()
