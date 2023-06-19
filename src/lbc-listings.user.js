/* eslint-disable max-statements */
// ==UserScript==
// @name        LeBonCoin Listing Plus Plus
// @namespace   https://github.com/Shuunen
// @description Show more infos on LeBonCoin listings
// @author      Romain Racamier-Lafon
// @match       https://www.leboncoin.fr/*
// @grant       none
// @require     https://raw.githubusercontent.com/Shuunen/user-scripts/master/src/utils.js
// @version     1.0.3
// ==/UserScript==

'use strict'

/**
 * @typedef {import('./lbc.types').LbcAd} LbcAd
 */

const districts = {
  3_001_193: 'Tribunal',
  3_001_192: 'Les Halles',
  3_001_181: 'Neudorf centre',
  3_001_182: 'Neudorf-Musau-Port du Rhin',
  3_001_183: 'Meinau',
  3_001_184: 'Neuhof',
  3_001_187: 'Cathédrale',
  3_001_189: 'Robertsau',
  3_001_197: 'Esplanade - Université',
  3_001_199: 'Cronenbourg',
  3_001_201: 'Stockfeld',
  3_001_203: 'Petite France',
  3_001_211: 'Hautepierre',
  100_101: 'Illkirch nord',
  100_102: 'Illkirch centre ouest',
  67_218: 'Illkirch',
}

/* eslint-disable no-magic-numbers */
const districtsToHide = new Set([
  districts[3_001_189], // Robertsau
  districts[3_001_192], // Les Halles
  districts[3_001_199], // Cronenbourg
  districts[3_001_211], // Hautepierre
])
/* eslint-enable no-magic-numbers */

const citiesToHide = new Set([
  'Eschau',
]);


(function LeBonCoinDpe () {
  /* global Shuutils */
  /** @type {import('./utils.js').Shuutils} */
  // @ts-ignore
  const utils = new Shuutils({ id: 'lbc-lpp', debug: false }) // eslint-disable-line @typescript-eslint/naming-convention
  const cls = {
    marker: `${utils.app.id}-processed`,
  }

  /**
   * Get the ad element from the ad object
   * @param {LbcAd} ad the ad object
   * @returns {HTMLElement|undefined} the ad element
   */
  function getAdElement (ad) {
    const id = ad.list_id
    const link = document.querySelector(`[href*="${id}"]`)
    if (!link) { document.location.reload(); return } // we need to have that next data in page
    const element = link.parentElement
    if (!element) { utils.error('no element found for link', link); return }
    if (element.classList.contains('hidden')) { utils.debug('ad is hidden', id); return }
    if (element.classList.contains(cls.marker)) { utils.debug('ad already processed', id); return }
    return element // eslint-disable-line consistent-return
  }

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
    const color = /[a-c]/u.test(value) ? 'text-green-600' : (value.includes('d') ? 'text-yellow-600' : 'text-red-600')
    const line = document.createElement('div')
    line.textContent = `${name} : ${value.toUpperCase()}`
    line.style.top = `${positionTop}px`
    line.classList.add(color, ...utils.tw('absolute right-0 font-bold'))
    element.append(line)
  }

  /**
   * Determine if the ad should be hidden
   * @param {LbcAd} ad the ad to process
   * @returns {boolean} true if the ad should be hidden
   */
  function shouldHideBasedOnLocation (ad) {
    const { city } = ad.location
    if (city === undefined) utils.warn('no city found in ad', ad)
    if (citiesToHide.has(city)) return true
    return districtsToHide.has(ad.district)
  }

  /**
   * Add district info to the ad object
   * @param {LbcAd} ad the ad to augment
   * @returns {void}
   */
  function addDistrictToAd (ad) {
    const districtId = ad.attributes.find(attribute => attribute.key === 'district_id')?.value
    if (districtId === undefined) return
    // @ts-ignore
    // eslint-disable-next-line no-param-reassign
    ad.district = districts[districtId] ?? districtId
  }

  /**
   * Hide the ad element
   * @param {HTMLElement} element the element to hide
   * @returns {void}
   */
  function hideAdElement (element) {
    element.classList.add(...utils.tw('h-24 overflow-hidden opacity-50 grayscale transition-all duration-500 ease-in-out hover:h-[215px] hover:opacity-100 hover:filter-none'))
    element.parentElement?.classList.add(`${utils.app.id}-hidden`, `${utils.app.id}-hidden-cause-location`)
  }

  /**
   * Remove the pro tag from the ad
   * @param {HTMLElement} element the element to remove the pro tag from
   * @returns {void}
   */
  function removeProTag (element) {
    const tag = utils.findOne('div[color="black"] span', element)
    if (tag?.textContent?.toLowerCase() === 'pro') tag.parentElement?.remove()
  }

  /**
   * Add location info to the ad
   * @param {HTMLElement} element the element to append the location info to
   * @param {LbcAd} ad the ad to process
   * @param {number} positionTop the top position of the line
   * @returns {void}
   */
  function addLocationInfo (element, ad, positionTop) {
    addDistrictToAd(ad)
    if (ad.owner.type === 'pro') removeProTag(element)
    if (shouldHideBasedOnLocation(ad)) hideAdElement(element)
    const line = document.createElement('div')
    line.textContent = ad.location.city
    if (ad.district !== undefined && !ad.location.city.includes(ad.district)) line.textContent += ` - ${ad.district}`
    line.style.top = `${positionTop}px`
    line.classList.add(...utils.tw('absolute right-0 font-bold'))
    element.append(line)
  }

  /**
   * Add owner info to the ad
   * @param {HTMLElement} element the element to append the owner info to
   * @param {LbcAd} ad the ad to process
   * @param {number} positionTop the top position of the line
   * @returns {void}
   */
  function addOwnerInfo (element, ad, positionTop) {
    const { owner } = ad
    if (!owner) { utils.warn('no owner found in ad', ad); return }
    const line = document.createElement('div')
    line.textContent = [owner.type, ':', owner.name.toLocaleLowerCase()].join(' ')
    line.style.top = `${positionTop}px`
    line.classList.add(...utils.tw('absolute right-0 font-bold'))
    if (owner.type === 'pro') line.classList.add(...utils.tw('text-red-700'))
    element.append(line)
  }

  /**
   * Add square info to the ad
   * @param {HTMLElement} element the element to append the square info to
   * @param {LbcAd} ad the ad to process
   * @param {number} positionTop the top position of the line
   * @returns {void}
   */
  function addSquareInfo (element, ad, positionTop) {
    const square = ad.attributes.find(attribute => attribute.key === 'square')
    if (square === undefined) { utils.warn('no square attribute found in ad', ad); return }
    const line = document.createElement('div')
    line.textContent = `surface : ${square.value} m²`
    line.style.top = `${positionTop}px`
    line.classList.add(...utils.tw('absolute right-0'))
    element.append(line)
  }

  /**
   * Add rooms info to the ad
   * @param {HTMLElement} element the element to append the rooms info to
   * @param {LbcAd} ad the ad to process
   * @param {number} positionTop the top position of the line
   * @returns {void}
   */
  function addRoomsInfo (element, ad, positionTop) {
    const rooms = ad.attributes.find(attribute => attribute.key === 'rooms')
    if (rooms === undefined) { utils.warn('no rooms attribute found in ad', ad); return }
    const line = document.createElement('div')
    line.textContent = `${rooms.value} pièces`
    line.style.top = `${positionTop}px`
    line.classList.add(...utils.tw('absolute right-0'))
    element.append(line)
  }

  /**
   * Readable floor number
   * @param {string} floorNumber the floor number
   * @returns {string} the human readable floor number
   */
  function humanReadableFloor (floorNumber) {
    if (floorNumber === '0') return 'étage : rdc'
    if (floorNumber === '1') return '1er étage'
    return `${floorNumber}e étage`
  }

  /**
   * Add floor info to the ad
   * @param {HTMLElement} element the element to append the floor info to
   * @param {LbcAd} ad the ad to process
   * @param {number} positionTop the top position of the line
   * @returns {void}
   */
  function addFloorNumberInfo (element, ad, positionTop) {
    const floorNumber = ad.attributes.find(attribute => attribute.key === 'floor_number')
    if (floorNumber === undefined) return
    const line = document.createElement('div')
    line.textContent = humanReadableFloor(floorNumber.value)
    line.style.top = `${positionTop}px`
    line.classList.add(...utils.tw('absolute right-0'))
    if (floorNumber.value === '0') line.classList.add(...utils.tw('text-red-700'))
    element.append(line)
  }

  /**
   * Add elevator info to the ad
   * @param {HTMLElement} element the element to append the elevator info to
   * @param {LbcAd} ad the ad to process
   * @param {number} positionTop the top position of the line
   * @returns {void}
   */
  function addElevatorInfo (element, ad, positionTop) {
    const elevator = ad.attributes.find(attribute => attribute.key === 'elevator')
    if (elevator === undefined) return
    const line = document.createElement('div')
    line.textContent = elevator.value === '1' ? 'ascenseur' : 'pas d\'ascenseur'
    line.style.top = `${positionTop}px`
    line.classList.add(...utils.tw('absolute right-0'))
    if (elevator.value === '0') line.classList.add(...utils.tw('text-red-700'))
    element.append(line)
  }

  /**
   * Get the DPE infos from the ad
   * @param {LbcAd} ad the ad to process
   * @param {HTMLElement} element the ad element
   * @returns {{energy: string, ges: string}} the DPE infos
   */
  function getDpeInfos (ad, element) {
    const energy = ad.attributes.find(attribute => attribute.key === 'energy_rate')?.value ?? ''
    if (energy === '') utils.warn('no energy rate found in ad', ad)
    const ges = ad.attributes.find(attribute => attribute.key === 'ges')?.value ?? ''
    if (ges === '') utils.warn('no GES found in ad', ad)
    // eslint-disable-next-line no-param-reassign
    if (!/[a-c]/u.test(energy) || !/[a-c]/u.test(ges)) element.style.display = 'none'
    return { energy, ges }
  }

  /**
   * Remove the native LBC viewed style from the ad picture
   * @param {HTMLElement} picture the picture element
   * @returns {void} nothing
   */
  function removePictureViewedStyle (picture) {
    const nbParents = 4
    let cursor = picture
    for (let index = 0; index < nbParents; index += 1) {
      const { parentElement } = cursor
      if (!parentElement) { utils.warn(`no parent found for picture at level ${index}`, picture); return }
      parentElement.style.opacity = '1'
      cursor = parentElement
    }
    picture.classList.add(cls.marker)
  }

  /**
   * Remove the native LBC viewed style from the ad paragraph
   * @param {HTMLElement} paragraph the paragraph element
   * @returns {void} nothing
   */
  function removeParagraphViewedStyle (paragraph) {
    // eslint-disable-next-line no-param-reassign
    paragraph.style.opacity = '1'
    paragraph.classList.add('max-w-md')
    paragraph.classList.add(cls.marker)
  }

  function removeViewedStyles () {
    const pictures = utils.findAll(`.${cls.marker} picture:not(.${cls.marker})`, document, true)
    for (const picture of pictures) removePictureViewedStyle(picture)
    const paragraphs = utils.findAll(`.${cls.marker} p:not(.${cls.marker})`, document, true)
    for (const paragraph of paragraphs) removeParagraphViewedStyle(paragraph)
  }

  /**
   * Process a single ad
   * @param {LbcAd} ad the ad object
   * @returns {void}
   */
  function processAd (ad) {
    const element = getAdElement(ad)
    if (!element) return
    utils.log('process ad :', ad.subject, ad)
    element.classList.add(cls.marker)
    // @ts-ignore
    const /** @type HTMLElement[] */[, link] = Array.from(element.children)
    if (!link) { utils.warn('no link found in ad', ad); return }
    const { energy, ges } = getDpeInfos(ad, element)
    addDpeInfo(link, 'Classe', energy, 0)
    addDpeInfo(link, 'GES', ges, 20) // eslint-disable-line no-magic-numbers
    addLocationInfo(link, ad, 45) // eslint-disable-line no-magic-numbers
    addOwnerInfo(link, ad, 65) // eslint-disable-line no-magic-numbers
    addSquareInfo(link, ad, 85) // eslint-disable-line no-magic-numbers
    addRoomsInfo(link, ad, 105) // eslint-disable-line no-magic-numbers
    addFloorNumberInfo(link, ad, 125) // eslint-disable-line no-magic-numbers
    addElevatorInfo(link, ad, 145) // eslint-disable-line no-magic-numbers
  }

  /**
   * Start the process
   * @returns {void}
   */
  function process () {
    const dataElement = document.querySelector('#__NEXT_DATA__')
    if (!dataElement) { utils.error('no data element found'); return }
    const { props } = JSON.parse(dataElement.innerHTML)
    const searchData = props.pageProps?.initialProps?.searchData
    if (searchData === undefined) { utils.log('no page props data to parse'); return }
    const { ads } = searchData
    utils.log(`processing ${ads.length} ads listing...`)
    for (const ad of ads) processAd(ad)
    removeViewedStyles()
  }

  // eslint-disable-next-line no-magic-numbers
  const processDebounced = utils.debounce(process, 1000)
  window.addEventListener('scroll', () => processDebounced())
  window.addEventListener('load', () => processDebounced())
})()



