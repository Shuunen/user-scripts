// ==UserScript==
// @name         AliExpress - All in one
// @namespace    https://github.com/Shuunen
// @version      1.0.0
// @description  Bigger listing
// @author       Romain Racamier-Lafon
// @match        https://*.aliexpress.com/*
// @grant        none
// ==/UserScript==

const extendsImage = (img, size = 600) => {
  img.src = img.src.split('.jpg_')[0] + '.jpg'
  img.style.height = img.style.width = `${size}px`
  img.style.maxHeight = img.style.maxWidth = 'inherit'
}

const processProductCard = el => {
  const img = el.querySelector('.item-img')
  if (!img || !img.src) return console.error('cannot find image on card el', el)
  extendsImage(img)
  const wrapper = img.closest('.product-img')
  wrapper.style.height = wrapper.style.width = 'inherit'
  el.style.display = 'flex'
  const zone = el.querySelector('.right-zone')
  if (!zone) return console.error('cannot find zone on card el', el)
  zone.style.paddingLeft = zone.style.marginTop = '16px'
  zone.previousElementSibling.style.width = '80%'
  el.classList.add('ali-aio-handled')
}

const processItemRow = el => {
  const img = el.querySelector('.pic-core')
  if (!img || !img.src) return console.error('cannot find image on row el', el)
  console.log('image src was', img.src)
  extendsImage(img, 500)
  console.log('now image src is', img.src)
  let wrapper = img.closest('.pic')
  wrapper.style.height = wrapper.style.width = 'inherit'
  wrapper = wrapper.parentElement
  wrapper.style.height = wrapper.style.width = 'inherit'
  el.style.display = 'flex'
  el.style.height = 'inherit'
  el.classList.add('ali-aio-handled')
}

const all = selector => Array.from(document.querySelectorAll(selector))
const processProductCards = () => all('.list.product-card:not(.ali-aio-handled)').map(el => processProductCard(el))
const processItemRows = () => all('.items-list > .item:not(.ali-aio-handled)').map(el => processItemRow(el))

function debounce (func, wait, immediate) {
  var timeout
  return function debounced () {
    var context = this
    var args = arguments
    var later = function later () {
      timeout = null
      if (!immediate) func.apply(context, args)
    }
    var callNow = immediate && !timeout
    clearTimeout(timeout)
    timeout = setTimeout(later, wait)
    if (callNow) func.apply(context, args)
  }
}

const process = () => {
  console.log('process...')
  processProductCards()
  processItemRows()
}

const processDebounced = debounce(process, 1000)

window.addEventListener('scroll', processDebounced)
