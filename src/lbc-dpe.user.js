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

'use strict';

/**
 * @typedef LbcAdAttribute
 * @type {Object}
 * @property {string} key the attribute key
 * @property {string} value the attribute value
 */

/**
  @typedef LbcAd
  @type {Object}
  @property {string} list_id the ad id
  @property {LbcAdAttribute[]} attributes the ad attributes
 */

// eslint-disable-next-line max-statements
(function LeBonCoinDpe () {
  /* global Shuutils */
  /** @type {import('./utils.js').Shuutils} */
  // @ts-ignore
  const utils = new Shuutils({ id: 'lbc-dpe', debug: false }) // eslint-disable-line @typescript-eslint/naming-convention
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
  /**
   * Add DPE info to an element
   * @param {HTMLElement} element the element to append the DPE info to
   * @param {string} name the name of the DPE info
   * @param {string} value the value of the DPE info
   * @param {number} positionTop the top position of the line
   */
  // eslint-disable-next-line max-params
  function addDpeInfo (element, name, value = '', positionTop = 0) {
    // eslint-disable-next-line no-nested-ternary
    const color = /[a-c]/u.test(value) ? 'green' : (value.includes('d') ? 'orange' : 'red')
    const line = document.createElement('div')
    line.textContent = `${name} : ${value.toUpperCase()}`
    // @ts-ignore
    line.style = `color: ${color}; top: ${positionTop}px; font-weight: bold; position: absolute; right: 0;`
    element.append(line)
  }
  /**
   * Add location info to the ad
   * @param {HTMLElement} element the element to append the location info to
   * @param {LbcAd} ad the ad to process
   * @param {number} positionTop the top position of the line
   * @returns {void}
   */
  // eslint-disable-next-line max-statements
  function addLocationInfo (element, ad, positionTop) {
    const districtId = ad.attributes.find(attribute => attribute.key === 'district_id')?.value
    if (districtId === undefined) { utils.warn('no district id found in ad', ad); return }
    // @ts-ignore
    const district = districts[districtId] ?? districtId
    // eslint-disable-next-line no-param-reassign
    if (['Cronenbourg', 'Hautepierre'].includes(district)) { element.style.display = 'none'; return }
    const line = document.createElement('div')
    line.textContent = district
    // @ts-ignore
    line.style = `top: ${positionTop}px; font-weight: bold; position: absolute; right: 0;`
    element.append(line)
  }
  /**
   * Process a single ad
   * @param {LbcAd} ad the ad to process
   * @returns {void}
   */
  // eslint-disable-next-line max-statements
  function processAd (ad) {
    const id = ad.list_id
    const link = document.querySelector(`[href*="${id}"]`)
    if (!link) { document.location.reload(); return } // we need to have that next data in page
    const element = link.parentElement
    if (!element) { utils.log('no parent element found for link', link); return }
    if (element.classList.contains(cls.marker)) { utils.debug('ad already processed', id); return }
    utils.log('process ad :', ad)
    element.classList.add(cls.marker)
    element.style.position = 'relative'
    const energy = ad.attributes.find(attribute => attribute.key === 'energy_rate')?.value ?? ''
    if (energy === '') utils.warn('no energy rate found in ad', ad)
    const ges = ad.attributes.find(attribute => attribute.key === 'ges')?.value ?? ''
    if (ges === '') utils.warn('no GES found in ad', ad)
    if (!/[a-c]/u.test(energy) || !/[a-c]/u.test(ges)) element.style.display = 'none'
    addDpeInfo(element, 'Classe', energy, 25) // eslint-disable-line no-magic-numbers
    addDpeInfo(element, 'GES', ges, 45) // eslint-disable-line no-magic-numbers
    addLocationInfo(element, ad, 65) // eslint-disable-line no-magic-numbers
  }
  // eslint-disable-next-line max-statements
  function process () {
    const dataElement = document.querySelector('#__NEXT_DATA__')
    if (!dataElement) { utils.error('no data element found'); return }
    const { props } = JSON.parse(dataElement.innerHTML)
    if (props.pageProps?.searchData === undefined) { utils.log('no page props data to parse'); return }
    const { ads } = props.pageProps.searchData
    utils.log(`processing ${ads.length} ads listing...`)
    for (const ad of ads) processAd(ad)
  }
  // eslint-disable-next-line no-magic-numbers
  const processDebounced = utils.debounce(process, 1000)
  window.addEventListener('scroll', () => processDebounced())
  window.addEventListener('load', () => processDebounced())
})()
