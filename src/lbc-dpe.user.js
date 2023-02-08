// ==UserScript==
// @name        LeBonCoin DPE
// @namespace   https://github.com/Shuunen
// @description Show DPE on LeBonCoin listings
// @author      Romain Racamier-Lafon
// @match       https://www.leboncoin.fr/*
// @grant       none
// @require     https://raw.githubusercontent.com/Shuunen/user-scripts/master/src/utils.js
// @version     1.0.1
// ==/UserScript==

// @ts-nocheck
// eslint-disable-next-line max-statements
(function LeBonCoinDPE () {
  /* global Shuutils */
  const utils = new Shuutils({ id: 'lbc-dpe', debug: true })
  const cls = {
    marker: `${utils.app.id}-processed`,
  }
  const districts = {
    3_001_199: 'Cronenbourg',
    3_001_211: 'Hautepierre',
    3_001_183: 'Meinau',
    3_001_201: 'Stockfeld',
    3_001_187: 'Cathédrale',
    3_001_181: 'Neudorf centre',
    3_001_203: 'Petite France',
    100_102: 'Illkirch centre ouest',
    67_218: 'Illkirch',
  }
  utils.log(districts)
  // eslint-disable-next-line max-params
  function addDpeInfo (element, name, value, positionTop) {
    // eslint-disable-next-line no-nested-ternary
    const color = /[a-c]/u.test(value) ? 'green' : (/d/u.test(value) ? 'orange' : 'red')
    const line = document.createElement('div')
    line.textContent = `${name} : ${value.toUpperCase()}`
    line.style = `color: ${color}; top: ${positionTop}px; font-weight: bold; position: absolute; right: 0;`
    element.append(line)
  }
  function addLocationInfo (element, ad, positionTop) {
    const districtId = ad.attributes.find(attribute => attribute.key === 'district_id').value
    const district = districts[districtId] || districtId
    // eslint-disable-next-line no-param-reassign
    if (['Cronenbourg', 'Hautepierre'].includes(district)) { element.style.display = 'none'; return }
    const line = document.createElement('div')
    line.textContent = district
    line.style = `top: ${positionTop}px; font-weight: bold; position: absolute; right: 0;`
    element.append(line)
  }
  // eslint-disable-next-line max-statements, consistent-return
  function processAd (ad) {
    const id = ad.list_id
    const link = document.querySelector(`[href*="${id}"]`)
    if (!link) return document.location.reload() // we need to have that next data in page
    const element = link.parentElement
    if (element.classList.contains(cls.marker)) return utils.log('ad already processed', id)
    utils.log('process ad :', ad)
    element.classList.add(cls.marker)
    element.style.position = 'relative'
    const energy = ad.attributes.find(attribute => attribute.key === 'energy_rate').value
    const ges = ad.attributes.find(attribute => attribute.key === 'ges').value
    if (!/[a-c]/u.test(energy) || !/[a-c]/u.test(ges)) element.style.display = 'none'
    addDpeInfo(element, 'Classe', energy, 25) // eslint-disable-line no-magic-numbers
    addDpeInfo(element, 'GES', ges, 45) // eslint-disable-line no-magic-numbers
    addLocationInfo(element, ad, 65) // eslint-disable-line no-magic-numbers
  }
  function process () {
    const { props } = JSON.parse(document.querySelector('#__NEXT_DATA__').innerHTML)
    if (!props.pageProps || !props.pageProps.searchData) { utils.log('no page props data to parse'); return }
    const { ads } = props.pageProps.searchData
    utils.log(`processing ${ads.length} ads listing...`)
    ads.forEach(ad => { processAd(ad) })
  }
  // eslint-disable-next-line no-magic-numbers
  const processDebounced = utils.debounce(process, 1000)
  window.addEventListener('scroll', processDebounced)
  window.addEventListener('load', processDebounced)
})()
