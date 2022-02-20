// ==UserScript==
// @name        LeBonCoin DPE
// @namespace   https://github.com/Shuunen
// @description Show DPE on LeBonCoin listings
// @author      Romain Racamier-Lafon
// @match       https://www.leboncoin.fr/*
// @grant       none
// @require     https://raw.githubusercontent.com/Shuunen/user-scripts/master/src/utils.js
// @version     1.0.0
// ==/UserScript==

(function LeBonCoinDPE () {
  /* global Shuutils */
  const utils = new Shuutils({ id: 'lbc-dpe', debug: true })
  const cls = {
    marker: utils.app.id + '-processed',
  }
  const addDpeInfo = (element, name, value, top) => {
    const color = /[a-c]/.test(value) ? 'green' : (/d/.test(value) ? 'orange' : 'red')
    const line = document.createElement('div')
    line.textContent = `${name} : ${value.toUpperCase()}`
    line.style = `color: ${color}; top: ${top}px; font-weight: bold; position: absolute; right: 0;`
    element.append(line)
  }
  const processAd = ad => {
    const id = ad.list_id
    const link = document.querySelector(`[href*="${id}"]`)
    if (!link) return document.location.reload() // we need to have that next data in page
    const element = link.parentElement
    if (element.classList.contains(cls.marker)) return utils.log('ad already processed', id)
    element.classList.add(cls.marker)
    const energy = ad.attributes.find(a => a.key === 'energy_rate').value
    const ges = ad.attributes.find(a => a.key === 'ges').value
    if (!/[a-d]/.test(energy) || !/[a-d]/.test(ges)) element.style.display = 'none'
    addDpeInfo(element, 'Classe', energy, 25)
    addDpeInfo(element, 'GES', ges, 45)
  }
  const process = async () => {
    const { ads } = JSON.parse(document.querySelector('#__NEXT_DATA__').innerHTML).props.pageProps.searchData
    utils.log(`processing ${ads.length} ads listing...`)
    ads.forEach(ad => processAd(ad))
  }
  const processDebounced = utils.debounce(process, 1000)
  window.addEventListener('scroll', processDebounced)
  window.addEventListener('load', processDebounced)
})()
