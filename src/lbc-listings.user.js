// ==UserScript==
// @name         LeBonCoin Listing Plus Plus
// @namespace    https://github.com/Shuunen
// @description  Show more infos on LeBonCoin listings
// @author       Romain Racamier-Lafon
// @match        https://www.leboncoin.fr/*
// @grant        none
// @require      https://cdn.jsdelivr.net/gh/Shuunen/user-scripts@master/src/utils.js
// @version      1.0.5
// ==/UserScript==

/* eslint-disable max-statements */

'use strict'

/**
 * @typedef {import('./lbc.types').LbcCustomInfo} LbcCustomInfo
 * @typedef {import('./lbc.types').LbcAdType} LbcAdType
 * @typedef {import('./lbc.types').LbcAd} LbcAd
 * @typedef {import('./lbc.types').LbcHousingAd} LbcHousingAd
 * @typedef {import('./lbc.types').LbcCarAd} LbcCarAd
 */

const districts = {
  67_218: 'Illkirch',
  100_101: 'Illkirch nord',
  100_102: 'Illkirch centre ouest',
  3_001_181: 'Neudorf centre',
  3_001_182: 'Neudorf-Musau-Port du Rhin',
  3_001_183: 'Meinau',
  3_001_184: 'Neuhof',
  3_001_187: 'Cathédrale',
  3_001_189: 'Robertsau',
  3_001_192: 'Les Halles',
  3_001_193: 'Tribunal',
  3_001_197: 'Esplanade - Université',
  3_001_199: 'Cronenbourg',
  3_001_201: 'Stockfeld',
  3_001_203: 'Petite France',
  3_001_211: 'Hautepierre',
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


(function LeBonCoinListing () {
  /* global Shuutils */
  /** @type {import('./utils.js').Shuutils} */
  // @ts-ignore
  const utils = new Shuutils({ debug: false, id: 'lbc-lpp' }) // eslint-disable-line @typescript-eslint/naming-convention
  const cls = {
    marker: `${utils.app.id}-processed`,
  }

  // Remove me one day :)
  // eslint-disable-next-line @typescript-eslint/unbound-method
  utils.tw ||= (classes) => classes.split(' ')

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
   * Get the DPE infos from the ad
   * @param {LbcHousingAd} ad the housing ad to process
   * @returns {LbcCustomInfo} the DPE infos
   */
  function getDpeInfos (ad) {
    const energy = ad.attributes.find(attribute => attribute.key === 'energy_rate')?.value ?? ''
    if (energy === '') utils.warn('no energy rate found in ad', ad)
    const ges = ad.attributes.find(attribute => attribute.key === 'ges')?.value ?? ''
    if (ges === '') utils.warn('no GES found in ad', ad)
    const text = `DPE : ${energy} / GES : ${ges}`
    // eslint-disable-next-line no-nested-ternary
    const flag = ['A', 'B'].includes(energy) ? 'good' : (energy === 'C' ? 'neutral' : 'bad')
    return { flag, text }
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
    paragraph.classList.add(...utils.tw('max-w-md'))
    paragraph.classList.add(cls.marker)
  }

  function removeViewedStyles () {
    const pictures = utils.findAll(`.${cls.marker} picture:not(.${cls.marker})`, document, true)
    for (const picture of pictures) removePictureViewedStyle(picture)
    const paragraphs = utils.findAll(`.${cls.marker} p:not(.${cls.marker})`, document, true)
    for (const paragraph of paragraphs) removeParagraphViewedStyle(paragraph)
  }

  /**
   * Add the ad id to the element
   * @param {LbcAd} ad the ad to process
   * @returns {void}
   */
  function addId (ad) {
    const line = document.createElement('div')
    line.textContent = ad.list_id.toString()
    line.classList.add(...utils.tw('absolute bottom-0 left-0 rounded-lg bg-white/50 text-gray-500'))
    ad.element.append(line)
  }

  /**
   * Get the ad location district
   * @param {LbcHousingAd} ad the ad to process
   * @returns {string} the district
   */
  function getDistrict (ad) {
    const districtId = ad.attributes.find(attribute => attribute.key === 'district_id')?.value
    if (districtId === undefined) return ''
    // @ts-expect-error type conversion from string to number
    return districts[districtId] ?? districtId
  }


  /**
   * Hide the ad element
   * @param {HTMLElement} element the element to hide
   * @param {string} cause the cause of the hide
   * @returns {void}
   */
  function hideAdElement (element, cause = 'unknown') {
    element.classList.add(...utils.tw('h-24 overflow-hidden opacity-50 grayscale transition-all duration-500 ease-in-out hover:h-[215px] hover:opacity-100 hover:filter-none'))
    element.parentElement?.classList.add(`${utils.app.id}-hidden`, `${utils.app.id}-hidden-cause-${cause}`)
  }

  /**
   * Get ad location info
   * @param {LbcHousingAd} ad the ad to process
   * @returns {LbcCustomInfo} the custom info
   */
  function getLocationInfo (ad) {
    const district = getDistrict(ad)
    const { city } = ad.location
    const shouldHide = citiesToHide.has(city) || districtsToHide.has(district)
    if (shouldHide) hideAdElement(ad.element, 'location')
    let text = city
    if (!city.includes(district)) text += ` - ${district}`
    const flag = shouldHide ? 'bad' : 'neutral'
    return { flag, text }
  }

  /**
   * Get the owner infos
   * @param {LbcAd} ad the ad to process
   * @returns {LbcCustomInfo} the custom info
   */
  function getOwnerInfo (ad) {
    const { owner } = ad
    if (!owner) { utils.warn('no owner found in ad', ad); return {} }
    const text = [owner.type, ':', owner.name.toLocaleLowerCase()].join(' ')
    const flag = owner.type === 'pro' ? 'bad' : 'neutral'
    return { flag, text }
  }

  /**
   * Get square info from the ad
   * @param {LbcHousingAd} ad the ad to process
   * @returns {LbcCustomInfo} the custom info
   */
  function getSquareInfo (ad) {
    const square = ad.attributes.find(attribute => attribute.key === 'square')
    const text = square ? `surface : ${square.value} m²` : ''
    return { text }
  }

  /**
   * Get rooms info from the ad
   * @param {LbcHousingAd} ad the ad to process
   * @returns {LbcCustomInfo} the custom info
   */
  function getRoomsInfo (ad) {
    const rooms = ad.attributes.find(attribute => attribute.key === 'rooms')
    const text = rooms ? `${rooms.value} pièces` : ''
    return { text }
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
   * Get floor info from the ad
   * @param {LbcHousingAd} ad the ad to process
   * @returns {LbcCustomInfo} the custom info
   */
  function getFloorNumberInfo (ad) {
    const floorNumber = ad.attributes.find(attribute => attribute.key === 'floor_number')
    if (floorNumber === undefined) return {}
    const text = humanReadableFloor(floorNumber.value)
    const flag = floorNumber.value === '0' ? 'bad' : 'neutral'
    return { flag, text }
  }

  /**
   * Get elevator info from the ad
   * @param {LbcHousingAd} ad the ad to process
   * @returns {LbcCustomInfo} the custom info
   */
  function getElevatorInfo (ad) {
    const elevator = ad.attributes.find(attribute => attribute.key === 'elevator')
    if (elevator === undefined) return {}
    // eslint-disable-next-line no-nested-ternary
    const text = elevator.value === '1' ? 'ascenseur' : (elevator.value === '2' ? 'pas d\'ascenseur' : `unknown elevator value "${elevator.value}"`)
    const flag = elevator.value === '2' ? 'bad' : 'neutral'
    return { flag, text }
  }

  /**
   * Add custom infos to the element
   * @param {LbcHousingAd} ad the housing ad to process
   * @returns {LbcCustomInfo[]} the custom infos
   */
  function getCustomInfosHousing (ad) {
    return [
      getDpeInfos(ad),
      getLocationInfo(ad),
      getSquareInfo(ad),
      getRoomsInfo(ad),
      getFloorNumberInfo(ad),
      getElevatorInfo(ad),
    ]
  }

  /**
  * Get custom infos from a car ad
  * @param {LbcCarAd} ad the car ad to process
  * @returns {LbcCustomInfo[]} the custom infos
  */
  function getCustomInfosCar (ad) {
    return [{ text: ad.ad_type }]
  }

  /**
   * Get the ad type
   * @param {LbcAd} ad the ad to process
   * @returns {LbcAdType} the ad type
   */
  function getAdType (ad) {
    const category = ad.category_id
    if (category === '5') return 'car'
    return 'unknown'
  }

  /**
   * Create a custom infos panel
   * @param {LbcCustomInfo[]} infos the infos to display
   * @returns {HTMLElement} the custom infos panel
   */
  function createCustomInfosPanel (infos) {
    const panel = document.createElement('div')
    panel.classList.add(...utils.tw('absolute bottom-0 left-0 rounded-lg bg-white/50 text-gray-500'))
    for (const info of infos) {
      const line = document.createElement('div')
      if (info.text) line.textContent = info.text
      if (info.classes) line.classList.add(...info.classes)
      panel.append(line)
    }
    return panel
  }

  /**
   * Remove the pro tag from the ad
   * @param {LbcAd} ad the ad to process
   * @returns {void}
   */
  function removeProTag (ad) {
    const tag = utils.findOne('div[color="black"] span, [data-spark-component="tag"]', ad.element)
    if (tag?.textContent?.toLowerCase() !== 'pro') return
    if (tag.parentElement?.textContent?.toLowerCase() === 'pro') tag.parentElement.remove()
    else tag.remove()
  }

  /**
   * Get common infos from the ad
   * @param {LbcAd} ad the ad to process
   * @returns {LbcCustomInfo[]} the custom infos
   */
  function getCommonInfos (ad) {
    if (ad.owner.type === 'pro') removeProTag(ad)
    return [
      getOwnerInfo(ad),
    ]
  }

  /**
   * Add custom infos to the element
   * @param {LbcAd} ad the ad to process
   * @returns {void}
   */
  function addInfos (ad) {
    const type = getAdType(ad)
    const infos = getCommonInfos(ad)
    // @ts-expect-error type conversion from LbcAd to LbcHousingAd
    if (type === 'housing') infos.push(...getCustomInfosHousing(ad))
    // @ts-expect-error type conversion from LbcAd to LbcCarAd
    else if (type === 'car') infos.push(...getCustomInfosCar(ad))
    else utils.warn('un handled ad type', { ad, type })
    ad.element.append(createCustomInfosPanel(infos))
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
    ad.element = link // eslint-disable-line no-param-reassign
    addId(ad)
    addInfos(ad)
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



