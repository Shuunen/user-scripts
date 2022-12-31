// ==UserScript==
// @name         Laptop Helper
// @namespace    https://github.com/Shuunen
// @version      1.0.1
// @description  Add annotations on displayed informations
// @author       Romain Racamier-Lafon
// @match        https://bestware.com/*
// @match        https://noteb.com/*
// @match        https://www.amazon.fr/*
// @match        https://www.dealabs.com/*
// @match        https://www.laptoparena.net/*
// @match        https://www.ldlc.com/*
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

function getScoresForScreen (screen, score) {
  const scores = {}
  scores[`${screen} pouce`] = score
  scores[`${screen}"`] = score
  scores[`${String(screen).replace('.', ',')}"`] = score
  scores[`${screen}”`] = score
  scores[`${String(screen).replace('.', ',')}”`] = score
  scores[`${screen} inch`] = score
  scores[`${screen}in`] = score
  return scores
}

function getScoresForWifi (wifi, score) {
  const scores = {}
  scores[`wifi ${wifi}`] = score
  scores[`wifi${wifi}`] = score
  scores[`wi-fi ${wifi}`] = score
  return scores
}

const scoresByKeyword = {
  'gtx': 70,
  'ips': 70,
  'led': 70,
  'lg gram': 70,
  'oled': 70,
  'Schenker': 70,
  'Tuxedo': 70,
  'Lenovo Legion': 0,
  'lenovo': 70,
  'nvme': 80,
  'rtx': 70,
  'backlit': 70,
  'fingerprint': 70,
  'power delivery': 70,
  'Keyboard Light': 70,
  'ssd': 70,
  'lock': 70,
  ' tn ': 50,
  '1080': 50,
  '1600': 70,
  '1800': 70,
  ...getScoresForWifi(6, 70),
  ...getScoresForWifi('ax', 70),
  ...getScoresForWifi(5, 50),
  ...getScoresForWifi('ac', 50),
  ...getScoresForRam(16, 70),
  ...getScoresForRam(32, 70),
  ...getScoresForRam(8, 50),
  ...getScoresForScreen(12, 0),
  ...getScoresForScreen(13, 50),
  ...getScoresForScreen(13.6, 50),
  ...getScoresForScreen(14, 70),
  ...getScoresForScreen(15, 70),
  ...getScoresForScreen(15.6, 70),
  ...getScoresForScreen(16, 50),
  ...getScoresForScreen(17, 0),
  ...getScoresForScreen(17.3, 0),
}

// prepare cpu data
function cleanCpuName (name) {
  return name.replace(/(AMD|Ryzen \d|Core i\d-|Intel|Pro|Pentium|Gold|Silver)/giu, '').trim()
}
const data = `AMD Ryzen 3 5125C	1 %
AMD Ryzen 3 5300U	6 %
AMD Ryzen 3 5400U	5 %
AMD Ryzen 3 5425C	5 %
AMD Ryzen 3 5425U	6 %
AMD Ryzen 3 7320U	3 %
AMD Ryzen 3 Pro 5450U	4 %
AMD Ryzen 3 Pro 5475U	6 %
AMD Ryzen 5 4600H	9 %
AMD Ryzen 5 4680U	9 %
Amd Ryzen 5 5500U	14 %
Amd Ryzen 5 5500U	15 %
AMD Ryzen 5 5600H	11 %
AMD Ryzen 5 5600HS	11 %
AMD Ryzen 5 5600U	17 %
AMD Ryzen 5 5625C	8 %
AMD Ryzen 5 5625U	12 %
AMD Ryzen 5 6600H	21 %
AMD Ryzen 5 6600HS	25 %
AMD Ryzen 5 6600U	26 %
AMD Ryzen 5 7520U	3 %
AMD Ryzen 5 Pro 5650U	18 %
AMD Ryzen 5 Pro 5675U	14 %
AMD Ryzen 5 Pro 6650H	25 %
AMD Ryzen 5 Pro 6650HS	27 %
AMD Ryzen 5 Pro 6650U	22 %
AMD Ryzen 7 4800U	20 %
AMD Ryzen 7 4980U	34 %
AMD Ryzen 7 5700G	52 %
AMD Ryzen 7 5700U	28 %
AMD Ryzen 7 5800H	24 %
AMD Ryzen 7 5800HS	27 %
AMD Ryzen 7 5800U	40 %
AMD Ryzen 7 5825C	24 %
AMD Ryzen 7 5825U	24 %
AMD Ryzen 7 6800H	62 %
AMD Ryzen 7 6800HS	57 %
AMD Ryzen 7 6800U	53 %
AMD Ryzen 7 Pro 2700U 	4 %
AMD Ryzen 7 Pro 4750U	8 %
AMD Ryzen 7 Pro 5750G	43 %
AMD Ryzen 7 Pro 5850U	44 %
AMD Ryzen 7 Pro 5875U	50 %
AMD Ryzen 7 Pro 6850H	51 %
AMD Ryzen 7 Pro 6850HS	63 %
AMD Ryzen 7 Pro 6850U	53 %
AMD Ryzen 7 Pro 6860Z	59 %
AMD Ryzen 9 4900H	20 %
AMD Ryzen 9 4900HS	22 %
AMD Ryzen 9 5900HS	28 %
AMD Ryzen 9 5900HX	40 %
AMD Ryzen 9 5980HS	48 %
AMD Ryzen 9 5980HX	50 %
AMD Ryzen 9 6900HS	77 %
AMD Ryzen 9 6900HX	73 %
AMD Ryzen 9 6980HS	82 %
AMD Ryzen 9 6980HX	74 %
AMD Ryzen 9 Pro 6950H	62 %
AMD Ryzen 9 Pro 6950HS	69 %
Intel Core i3-1220P	10 %
Intel Core i5-10200H	4 %
Intel Core i5-10210U	4 %
Intel Core i5-10300H	11 %
Intel Core i5-11260H	8 %
Intel Core i5-11300H	16 %
Intel Core i5-1130G7	9 %
Intel Core i5-11320H	35 %
Intel Core i5-1135G7	15 %
Intel Core i5-11400H	8 %
Intel Core i5-1140G7	7 %
Intel Core i5-1145G7	17 %
Intel Core i5-11500H	9 %
Intel Core i5-1155G7	19 %
Intel Core i5-1230U	15 %
Intel Core i5-1235U	18 %
Intel Core i5-1240P	30 %
Intel Core i5-12450H	11 %
Intel Core i5-1245U	21 %
Intel Core i5-12500H	38 %
Intel Core i5-1250P	29 %
Intel Core i5-12600K	18 %
Intel Core i5-3317U	1 %
Intel Core i5-8350U	3 %
Intel Core i7-10510U	4 %
Intel Core i7-10610U	4 %
Intel Core i7-1065G7	4 %
Intel Core i7-10810U	5 %
Intel Core i7-10870H	8 %
Intel Core i7-11370H	35 %
Intel Core i7-11375H	42 %
Intel Core i7-11390H	39 %
Intel Core i7-11600H	7 %
Intel Core i7-1160G7	16 %
Intel Core i7-1165G7	32 %
Intel Core i7-11800H	12 %
Intel Core i7-1180G7	19 %
Intel Core i7-11850H	13 %
Intel Core i7-1185G7	35 %
Intel Core i7-1195G7	30 %
Intel Core i7-1250U	16 %
Intel Core i7-1255U	37 %
Intel Core i7-1260P	70 %
Intel Core i7-1260U	15 %
Intel Core i7-12650H	24 %
Intel Core i7-1265U	63 %
Intel Core i7-12700H	80 %
Intel Core i7-1270P	57 %
Intel Core i7-12800H	83 %
Intel Core i7-12800HX	83 %
Intel Core i7-1280P	81 %
Intel Core i7-12850HX	17 %
Intel Core i7-1370P	16 %
Intel Core i7-7820HQ	3 %
Intel Core i7-8705G	16 %
Intel Core i7-8706G	15 %
Intel Core i7-8850H	4 %
Intel Core i9-11900H	13 %
Intel Core i9-11950H	11 %
Intel Core i9-11980HK	13 %
Intel Core i9-12900H	89 %
Intel Core i9-12900HK	96 %
Intel Core i9-12900HX	31 %
Intel Core i9-12950HX	24 %
Intel Pentium Gold 7505	2 %
Intel Pentium Silver N6000	1 %
Intel Core i7-10750H	7 %
Intel Core i7-10710U	5 %`
const scoresByCpu = {}
data.split('\n').forEach(line => {
  const [cpuRaw, scoreRaw] = line.split('\t')
  const cpu = cleanCpuName(cpuRaw)
  const score = Number.parseInt(scoreRaw)
  scoresByKeyword[cpu] = score
})

function LaptopHelper () {
  /* global Shuutils, RoughNotation */
  const app = {
    id: 'lpt-hlp',
    debug: true,
  }
  const cls = {
    mark: app.id + '-mark',
  }
  const selectors = {
    desc: ['h1', 'p > strong', '.v-list-item[role="listitem"]', '.contenttable td', '.td-spec > span', '.prod_details > li', '.specs_details', '.product-item-short-specs > p', '.resulspace', '.colorTipContent', '.desc', '.short_desc', 'div[data-asin] span.a-text-normal', '.c-product__title', '.pdt-info .title-3 a', '.thread-title--list', 'article .libelle h3'].map(sel => `${sel}:not(.${cls.mark})`).join(','),
  }
  const utils = new Shuutils(app)

  const keywords = Object.keys(scoresByKeyword)
  utils.log(keywords.length, 'keywords with associated scores')
  const keywordRegex = new RegExp(keywords.join('|'), 'igu')

  function annotate (/** @type HTMLElement */ element) {
    let keyword = element.dataset.keyword
    keyword = scoresByKeyword[keyword] === undefined ? keyword.toLowerCase() : keyword
    const score = scoresByKeyword[keyword]
    if (score === undefined) return utils.error('no score found for', keyword)
    utils.log('found score', score, 'for', keyword)
    element.dataset.score = score
    element.title = `Score : ${score}%`
    const color = getColorForScore(score)
    let annotation = RoughNotation.annotate(element, { type: 'highlight', color })
    annotation.show()
    if (score >= 80) {
      annotation = RoughNotation.annotate(element.parentElement, { type: 'bracket', color: 'darkgreen' })
      annotation.show()
    }
  }

  function checkItems () {
    utils.findAll(selectors.desc, document, true).forEach(descElement => {
      descElement.classList.add(cls.mark)
      // first close last opened console group, else closing nothing without throwing error
      console.groupEnd()
      const text = utils.readableString(descElement.textContent).toLowerCase().trim()
      console.groupCollapsed(utils.ellipsisWords(text, 15))
      utils.log('checking :', text)
      descElement.innerHTML = descElement.innerHTML.replace(keywordRegex, match => `<span class="${cls.mark}" style="display: inline-block" data-keyword="${match.replace('"', '”')}">${match}</span>`)
      utils.findAll(`.${cls.mark}`, descElement, true).forEach(markElement => annotate(markElement))
    })
    console.groupEnd()
  }
  async function process () {
    utils.log('processing')
    checkItems()
  }
  const processDebounced = utils.debounce(process, 500)
  document.addEventListener('scroll', processDebounced)
  utils.onPageChange(processDebounced)
  setTimeout(processDebounced, 1000)
}

LaptopHelper()
