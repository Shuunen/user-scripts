// ==UserScript==
// @name         AliExpress - All in one
// @namespace    https://github.com/Shuunen
// @version      1.0.1
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

const processProductCard = element => {
  const img = element.querySelector('.item-img')
  if (!img || !img.src) return console.error('cannot find image on card el', element)
  extendsImage(img)
  const wrapper = img.closest('.product-img')
  wrapper.style.height = wrapper.style.width = 'inherit'
  element.style.display = 'flex'
  const zone = element.querySelector('.right-zone')
  if (!zone) return console.error('cannot find zone on card el', element)
  zone.style.paddingLeft = zone.style.marginTop = '16px'
  zone.previousElementSibling.style.width = '80%'
  element.classList.add('ali-aio-handled')
}

const processItemRow = element => {
  const img = element.querySelector('.pic-core')
  if (!img || !img.src) return console.error('cannot find image on row el', element)
  console.log('image src was', img.src)
  extendsImage(img, 500)
  console.log('now image src is', img.src)
  let wrapper = img.closest('.pic')
  wrapper.style.height = wrapper.style.width = 'inherit'
  wrapper = wrapper.parentElement
  wrapper.style.height = wrapper.style.width = 'inherit'
  element.style.display = 'flex'
  element.style.height = 'inherit'
  element.classList.add('ali-aio-handled')
}

const all = selector => [...document.querySelectorAll(selector)]
const processProductCards = () => all('.list.product-card:not(.ali-aio-handled)').map(element => processProductCard(element))
const processItemRows = () => all('.items-list > .item:not(.ali-aio-handled)').map(element => processItemRow(element))

function debounce (function_, wait, immediate) {
  var timeout
  return function debounced () {
    var context = this
    var arguments_ = arguments
    var later = function later () {
      timeout = undefined
      if (!immediate) function_.apply(context, arguments_)
    }
    var callNow = immediate && !timeout
    clearTimeout(timeout)
    timeout = setTimeout(later, wait)
    if (callNow) function_.apply(context, arguments_)
  }
}

const process = () => {
  console.log('process...')
  processProductCards()
  processItemRows()
}

const processDebounced = debounce(process, 1000)

window.addEventListener('scroll', processDebounced)
