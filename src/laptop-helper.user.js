/* eslint-disable eslint-comments/no-unlimited-disable */
/* eslint-disable no-magic-numbers */
/* eslint-disable unicorn/no-abusive-eslint-disable */
// ==UserScript==
// @name         Laptop Helper
// @namespace    https://github.com/Shuunen
// @version      1.0.1
// @description  Add annotations on displayed informations
// @author       Romain Racamier-Lafon
// @match        https://bestware.com/*
// @match        https://noteb.com/*
// @match        https://www.amazon.fr/*
// @match        https://deals.dell.com/*
// @match        https://laptopmedia.com/*
// @match        https://www.amazon.com/*
// @match        https://www.boulanger.com/*
// @match        https://www.comparez-malin.fr/*
// @match        https://www.darty.com/*
// @match        https://www.dealabs.com/*
// @match        https://www.dell.com/*
// @match        https://www.laptoparena.net/*
// @match        https://www.laptopspirit.fr/*
// @match        https://www.ldlc.com/*
// @match        https://www.lenovo.com/*
// @match        https://www.lenovo.com/*
// @match        https://www.materiel.net/*
// @match        https://www.newegg.com/*
// @match        https://www.notebookcheck.net/*
// @match        https://www.topachat.com/*
// @match        https://www.tuxedocomputers.com/*
// @require      https://raw.githubusercontent.com/Shuunen/user-scripts/master/src/utils.js
// @require      https://unpkg.com/rough-notation/lib/rough-notation.iife.js
// @grant        none
// ==/UserScript==

// @ts-nocheck

function getColorForScore (percent) {
  const alpha = 30
  if (percent <= 35) return `hsl(0deg 100% 50% / ${alpha}%)` // red
  if (percent <= 50) return `hsl(35deg 100% 50% / ${alpha}%)` // orange
  if (percent <= 65) return `hsl(55deg 100% 50% / ${alpha}%)` // yellow
  return `hsl(120deg 100% 50% / ${alpha}%)` // green
}

function getScoresForRam (ram, score) {
  const scores = {}
  scores[`${ram}gb`] = score
  scores[`${ram}go`] = score
  scores[`${ram} gb`] = score
  scores[`${ram} go`] = score
  return scores
}

function getScoresForScreen (inches, score) {
  const scores = {}
  scores[`${inches} pouce`] = score
  scores[`${inches}"`] = score
  scores[`${String(inches).replace('.', ',')}"`] = score
  scores[`${inches}”`] = score
  scores[`${String(inches).replace('.', ',')}”`] = score
  scores[`${inches} inch`] = score
  scores[`${inches}in`] = score
  return scores
}

function getScoresForWifi (wifi, score) {
  const scores = {}
  scores[`wifi ${wifi}`] = score
  scores[`wifi${wifi}`] = score
  scores[`wi-fi ${wifi}`] = score
  return scores
}

function getScoreForRefresh (refresh, score) {
  const scores = {}
  scores[`${refresh}hz`] = score
  scores[`${refresh} hz`] = score
  return scores
}

function getScoreForResolution (resolution, score) {
  const scores = {}
  scores[`${resolution}p`] = score
  scores[`${resolution} p`] = score
  return scores
}

const scoresByKeyword = {
  'gtx': 70,
  'led': 70,
  'Oled': 70,
  'Full HD': 30,
  'FHD': 30,
  'NvmE': 80,
  'rtx': 70,
  'backlit': 70,
  'fingerprint': 70,
  'power delivery': 70,
  'Keyboard Light': 70,
  'ssd': 70,
  'lock': 70,
  ' tn ': 50,
  ...getScoreForResolution('1080', 30),
  ...getScoreForResolution('1200', 60),
  ...getScoreForResolution('1440', 70),
  ...getScoreForResolution('1600', 70),
  ...getScoreForResolution('1800', 70),
  ...getScoreForResolution('2160', 70),
  ...getScoresForWifi(6, 70),
  ...getScoresForWifi('ax', 70),
  ...getScoresForWifi(5, 50),
  ...getScoresForWifi('ac', 50),
  ...getScoresForRam(16, 70),
  ...getScoresForRam(32, 70),
  ...getScoresForRam(8, 50),
  ...getScoresForScreen(12, 0),
  ...getScoresForScreen(13, 50),
  ...getScoresForScreen(13.4, 50),
  ...getScoresForScreen(13.6, 50),
  ...getScoresForScreen(14, 70),
  ...getScoresForScreen(15, 70),
  ...getScoresForScreen(15.6, 70),
  ...getScoresForScreen(16, 50),
  ...getScoresForScreen(17, 0),
  ...getScoresForScreen(17.3, 0),
  ...getScoreForRefresh(60, 0),
  ...getScoreForRefresh(75, 60),
  ...getScoreForRefresh(90, 70),
  ...getScoreForRefresh(120, 70),
  ...getScoreForRefresh(144, 70),
  ...getScoreForRefresh(165, 70),
  ...getScoreForRefresh(240, 70),
}

/* eslint-disable */
function b2a (a) {
  var c, d, e, f, g, h, i, j, o, b = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=", k = 0, l = 0, m = "", n = []
  if (!a) return a
  do c = a.charCodeAt(k++), d = a.charCodeAt(k++), e = a.charCodeAt(k++), j = c << 16 | d << 8 | e,
    f = 63 & j >> 18, g = 63 & j >> 12, h = 63 & j >> 6, i = 63 & j, n[l++] = b.charAt(f) + b.charAt(g) + b.charAt(h) + b.charAt(i); while (k < a.length)
  return m = n.join(""), o = a.length % 3, (o ? m.slice(0, o - 3) : m) + "===".slice(o || 3)
}

function a2b (a) {
  var b, c, d, e = {}, f = 0, g = 0, h = "", i = String.fromCharCode, j = a.length
  for (b = 0; 64 > b; b++) e["ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/".charAt(b)] = b
  for (c = 0; j > c; c++) for (b = e[a.charAt(c)], f = (f << 6) + b, g += 6; g >= 8;) ((d = 255 & f >>> (g -= 8)) || j - 2 > c) && (h += i(d))
  return h
}
/* eslint-enable */

function stringToBase64 (str) {
  console.log('stringToBase64', str)
  return b2a(str)
}

function base64ToString (str) {
  console.log('base64ToString', str)
  return a2b(str)
}

// prepare cpu data
function cleanCpuName (name) {
  return name.replace(/amd|ryzen \d|core i\d-|gold|intel|pentium|pro|silver/giu, '').trim()
}
/* eslint-disable no-tabs */
const data = `AMD Ryzen 3 5125C	3 %
AMD Ryzen 3 5300U	12 %
AMD Ryzen 3 5400U	11 %
AMD Ryzen 3 5425C	11 %
AMD Ryzen 3 5425U	12 %
AMD Ryzen 3 7320U	3 %
AMD Ryzen 3 Pro 5450U	9 %
AMD Ryzen 3 Pro 5475U	13 %
AMD Ryzen 5 4600H	17 %
AMD Ryzen 5 4680U	22 %
Amd Ryzen 5 5500U	26 %
Amd Ryzen 5 5500U	26 %
AMD Ryzen 5 5600H	22 %
AMD Ryzen 5 5600HS	23 %
AMD Ryzen 5 5600U	31 %
AMD Ryzen 5 5625C	20 %
AMD Ryzen 5 5625U	31 %
AMD Ryzen 5 6600H	33 %
AMD Ryzen 5 6600HS	38 %
AMD Ryzen 5 6600U	44 %
AMD Ryzen 5 7520U	3 %
AMD Ryzen 5 Pro 5650U	32 %
AMD Ryzen 5 Pro 5675U	24 %
AMD Ryzen 5 Pro 6650H	38 %
AMD Ryzen 5 Pro 6650HS	42 %
AMD Ryzen 5 Pro 6650U	37 %
AMD Ryzen 7 4800U	40 %
AMD Ryzen 7 4980U	47 %
AMD Ryzen 7 5700G	64 %
AMD Ryzen 7 5700U	38 %
AMD Ryzen 7 5800H	44 %
AMD Ryzen 7 5800HS	49 %
AMD Ryzen 7 5800U	55 %
AMD Ryzen 7 5825C	31 %
AMD Ryzen 7 5825U	48 %
AMD Ryzen 7 6800H	83 %
AMD Ryzen 7 6800HS	78 %
AMD Ryzen 7 6800U	87 %
AMD Ryzen 7 Pro 2700U 	7 %
AMD Ryzen 7 Pro 4750U	21 %
AMD Ryzen 7 Pro 5750G	53 %
AMD Ryzen 7 Pro 5850U	61 %
AMD Ryzen 7 Pro 5875U	70 %
AMD Ryzen 7 Pro 6850H	75 %
AMD Ryzen 7 Pro 6850HS	92 %
AMD Ryzen 7 Pro 6850U	87 %
AMD Ryzen 7 Pro 6860Z	96 %
AMD Ryzen 9 4900H	36 %
AMD Ryzen 9 4900HS	40 %
AMD Ryzen 9 5900HS	50 %
AMD Ryzen 9 5900HX	49 %
AMD Ryzen 9 5980HS	58 %
AMD Ryzen 9 5980HX	58 %
AMD Ryzen 9 6900HS	98 %
AMD Ryzen 9 6900HX	88 %
AMD Ryzen 9 6980HS	99 %
AMD Ryzen 9 6980HX	89 %
AMD Ryzen 9 Pro 6950H	88 %
AMD Ryzen 9 Pro 6950HS	98 %
Intel Core i3-1220P	21 %
Intel Core i5-10200H	3 %
Intel Core i5-10210U	4 %
Intel Core i5-10300H	18 %
Intel Core i5-11260H	5 %
Intel Core i5-11300H	26 %
Intel Core i5-1130G7	23 %
Intel Core i5-11320H	45 %
Intel Core i5-1135G7	27 %
Intel Core i5-11400H	6 %
Intel Core i5-1140G7	19 %
Intel Core i5-1145G7	31 %
Intel Core i5-11500H	13 %
Intel Core i5-1155G7	36 %
Intel Core i5-1230U	32 %
Intel Core i5-1235U	50 %
Intel Core i5-1240P	54 %
Intel Core i5-12450H	22 %
Intel Core i5-1245U	56 %
Intel Core i5-12500H	50 %
Intel Core i5-1250P	56 %
Intel Core i5-12600K	20 %
Intel Core i5-3317U	0 %
Intel Core i5-8350U	3 %
Intel Core i5-9600K	5 %
Intel Core i7-10510U	4 %
Intel Core i7-10610U	9 %
Intel Core i7-1065G7	8 %
Intel Core i7-10710U	5 %
Intel Core i7-10750H	6 %
Intel Core i7-10810U	11 %
Intel Core i7-10870H	8 %
Intel Core i7-11370H	44 %
Intel Core i7-11375H	53 %
Intel Core i7-11390H	52 %
Intel Core i7-11600H	11 %
Intel Core i7-1160G7	31 %
Intel Core i7-1165G7	43 %
Intel Core i7-11800H	17 %
Intel Core i7-1180G7	35 %
Intel Core i7-11850H	18 %
Intel Core i7-1185G7	50 %
Intel Core i7-1195G7	44 %
Intel Core i7-1250U	41 %
Intel Core i7-1255U	49 %
Intel Core i7-1260P	93 %
Intel Core i7-1260U	41 %
Intel Core i7-12650H	46 %
Intel Core i7-1265U	77 %
Intel Core i7-12700H	76 %
Intel Core i7-1270P	83 %
Intel Core i7-12800H	77 %
Intel Core i7-12800HX	77 %
Intel Core i7-1280P	96 %
Intel Core i7-12850HX	20 %
Intel Core i7-1370P	20 %
Intel Core i7-7820HQ	2 %
Intel Core i7-8705G	22 %
Intel Core i7-8706G	20 %
Intel Core i7-8850H	3 %
Intel Core i9-11900H	18 %
Intel Core i9-11950H	16 %
Intel Core i9-11980HK	18 %
Intel Core i9-12900H	82 %
Intel Core i9-12900HK	83 %
Intel Core i9-12900HX	21 %
Intel Core i9-12950HX	21 %
Intel Pentium Gold 7505	6 %
Intel Pentium Silver N6000	3 %`
/* eslint-enable no-tabs */

data.split('\n').forEach(line => {
  const [cpuRaw, scoreRaw] = line.split('\t')
  const cpu = cleanCpuName(cpuRaw)
  const score = Number.parseInt(scoreRaw, 10)
  scoresByKeyword[cpu] = score
})

// eslint-disable-next-line max-statements
function LaptopHelper () {
  /* global Shuutils, RoughNotation */
  const app = {
    id: 'lpt-hlp',
    debug: true,
  }
  const cls = {
    mark: `${app.id}-mark`,
  }
  const selectors = {
    clearLinks: '.comparo_table_description a, .contenttable td a',
    desc: [
      'h1', '.specs > li', 'dd', '.product_details_item', '.infos_strenghts > li',
      '.techSpecs-table td', '.cd-features-list > li', '.no-checkbox', '.checkbox > a',
      '.ProductShowcase__title__SBCBw', 'h1 + .a-unordered-list > li > span.a-list-item',
      '.configuratorItem-mtmTable-description', '.text-start label',
      '.see-more > div > span', '.tech-spec-content', '.sd-ps-spec-item > div',
      '.userHtml', '.ps-iconography-specs-label', '.c-product__description',
      '.wp-block-table td', '.keypoints__item', '.comparo_table_description',
      '.search tr > td', '.secondary-title', '.description p', 'p > strong',
      '.prodDetAttrValue', '.v-list-item[role="listitem"]', '.value > p',
      '.contenttable td', '.td-spec > span', '.prod_details > li', '.specs_details',
      '.product-item-short-specs > p', '.resulspace', '.colorTipContent', '.desc',
      '.short_desc', 'div[data-asin] span.a-text-normal', '.c-product__title',
      '.pdt-info .title-3 a', '.thread-title--list', 'article .libelle h3',
    ].map(sel => `${sel}:not(.${cls.mark})`).join(','),
  }
  const utils = new Shuutils(app)

  const keywords = Object.keys(scoresByKeyword)
  utils.log(keywords.length, 'keywords with associated scores')
  // eslint-disable-next-line security/detect-non-literal-regexp
  const keywordRegex = new RegExp(keywords.join('|'), 'giu')

  // eslint-disable-next-line max-statements, consistent-return
  function annotate (/** @type HTMLElement */ element) {
    let { keyword } = element.dataset
    keyword = scoresByKeyword[keyword] === undefined ? keyword.toLowerCase() : keyword
    const score = scoresByKeyword[keyword]
    if (score === undefined) return utils.error('no score found for', keyword)
    utils.log('found score', score, 'for', keyword)
    // eslint-disable-next-line no-param-reassign
    element.dataset.score = score
    // eslint-disable-next-line no-param-reassign
    element.title = `Score : ${score}%`
    const color = getColorForScore(score)
    let annotation = RoughNotation.annotate(element, { type: 'highlight', color })
    annotation.show()
    // eslint-disable-next-line no-magic-numbers
    if (score >= 80) {
      annotation = RoughNotation.annotate(element.parentElement, { type: 'bracket', color: 'darkgreen' })
      annotation.show()
    }
  }

  function checkItems () {
    utils.findAll(selectors.desc, document, true).forEach((/** @type HTMLElement */descElement) => {
      descElement.classList.add(cls.mark)
      // first close last opened console group, else closing nothing without throwing error
      console.groupEnd()
      // eslint-disable-next-line no-param-reassign
      descElement.innerHTML = descElement.innerHTML.replace(/&nbsp;/gu, '')
      const text = utils.readableString(descElement.textContent).toLowerCase().trim()
      // eslint-disable-next-line no-magic-numbers
      console.groupCollapsed(utils.ellipsisWords(text, 15))
      utils.log('checking :', text)
      // eslint-disable-next-line no-param-reassign
      descElement.innerHTML = descElement.innerHTML.replace(keywordRegex, match => `<span class="${cls.mark}" style="display: inline-block" data-keyword="${match.replace('"', '”')}">${match}</span>`)
      utils.findAll(`.${cls.mark}`, descElement, true).forEach(markElement => { annotate(markElement) })
    })
    console.groupEnd()
  }
  function clearLinks () {
    utils.findAll(selectors.clearLinks, document, true).forEach((/** @type HTMLAnchorElement */ link) => {
      // eslint-disable-next-line no-magic-numbers
      if (typeof link.href !== 'string' || link.href.length < 2) return
      // eslint-disable-next-line no-param-reassign
      link.dataset.url = stringToBase64(link.href)
      // eslint-disable-next-line no-param-reassign
      link.href = '#'
      link.parentElement.addEventListener('mouseup', event => {
        if (event.button !== 1) return
        event.preventDefault()
        window.open(base64ToString(link.dataset.url), '_blank')
      })
      link.removeAttribute('title')
    })
  }
  function process () {
    utils.log('processing')
    clearLinks()
    checkItems()
  }
  // eslint-disable-next-line no-magic-numbers
  const processDebounced = utils.debounce(process, 500)
  document.addEventListener('scroll', processDebounced)
  utils.onPageChange(processDebounced)
  // eslint-disable-next-line no-magic-numbers
  setTimeout(processDebounced, 1000)
}

// eslint-disable-next-line new-cap
LaptopHelper()
