// ==UserScript==
// @name         Laptop Helper
// @namespace    https://github.com/Shuunen
// @version      1.0.0
// @description  Add annotations on displayed informations
// @author       Romain Racamier-Lafon
// @match        https://www.amazon.fr/*
// @match        https://www.dealabs.com/*
// @match        https://www.topachat.com/*
// @match        https://www.materiel.net/*
// @match        https://www.ldlc.com/*
// @require      https://raw.githubusercontent.com/Shuunen/user-scripts/master/src/utils.js
// @require      https://unpkg.com/rough-notation/lib/rough-notation.iife.js
// @grant        none
// ==/UserScript==

// @ts-nocheck

function getColorForScore (percent) {
  const alpha = 40
  if (percent <= 20) return `hsl(0deg 100% 50% / ${alpha}%)` // red
  if (percent <= 50) return `hsl(35deg 100% 50% / ${alpha}%)` // orange
  if (percent <= 70) return `hsl(55deg 100% 50% / ${alpha}%)` // yellow
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
  'gtx': 100,
  'ips': 100,
  'led': 100,
  'oled': 100,
  'Lenovo Legion': 0,
  'lenovo': 100,
  'nvme': 100,
  'rtx': 100,
  'ssd': 70,
  'tn': 50,
  ...getScoresForWifi(6, 100),
  ...getScoresForWifi('ax', 100),
  ...getScoresForWifi(5, 50),
  ...getScoresForWifi('ac', 50),
  ...getScoresForRam(16, 100),
  ...getScoresForRam(32, 100),
  ...getScoresForRam(8, 50),
  ...getScoresForScreen(12, 0),
  ...getScoresForScreen(13, 50),
  ...getScoresForScreen(13.6, 50),
  ...getScoresForScreen(14, 100),
  ...getScoresForScreen(15, 100),
  ...getScoresForScreen(15.6, 100),
  ...getScoresForScreen(16, 50),
  ...getScoresForScreen(17, 0),
  ...getScoresForScreen(17.3, 0),
}

// prepare cpu data
function cleanCpuName (name) {
  return name.replace(/(AMD|Ryzen \d|Core i\d-|Intel|Pro|Pentium|Gold|Silver)/giu, '').trim()
}
const data = `AMD Ryzen 3 5125C	3,79%
  AMD Ryzen 3 5300U	12,16%
  AMD Ryzen 3 5400U	11,77%
  AMD Ryzen 3 5425C	11,74%
  AMD Ryzen 3 5425U	12,80%
  AMD Ryzen 3 7320U	3,55%
  AMD Ryzen 3 PRO 5450U	9,75%
  AMD Ryzen 3 PRO 5475U	13,66%
  AMD Ryzen 5 4600H	17,09%
  AMD Ryzen 5 4680U	22,16%
  Amd Ryzen 5 5500U	27,19%
  Amd Ryzen 5 5500U	26,38%
  AMD Ryzen 5 5600H	22,19%
  AMD Ryzen 5 5600HS	26,08%
  AMD Ryzen 5 5600U	31,82%
  AMD Ryzen 5 5625C	20,94%
  AMD Ryzen 5 5625U	31,95%
  AMD Ryzen 5 6600H	33,45%
  AMD Ryzen 5 6600HS	43,54%
  AMD Ryzen 5 6600U	45,25%
  AMD Ryzen 5 7520U	3,75%
  AMD Ryzen 5 PRO 5650U	33,10%
  AMD Ryzen 5 PRO 5675U	25,02%
  AMD Ryzen 5 PRO 6650H	38,44%
  AMD Ryzen 5 PRO 6650HS	48,05%
  AMD Ryzen 5 PRO 6650U	38,18%
  AMD Ryzen 7 4800U	41,37%
  AMD Ryzen 7 4980U	48,57%
  AMD Ryzen 7 5700G	60,07%
  AMD Ryzen 7 5700U	39,50%
  AMD Ryzen 7 5800H	44,33%
  AMD Ryzen 7 5800HS	55,83%
  AMD Ryzen 7 5800U	51,45%
  AMD Ryzen 7 5825C	32,20%
  AMD Ryzen 7 5825U	49,35%
  AMD Ryzen 7 6800H	106,14%
  AMD Ryzen 7 6800HS	135,28%
  AMD Ryzen 7 6800HS	113,88%
  AMD Ryzen 7 6800U	102,85%
  AMD Ryzen 7 Pro 2700U 	6,94%
  AMD Ryzen 7 PRO 5750G	49,27%
  AMD Ryzen 7 PRO 5850U	57,46%
  AMD Ryzen 7 PRO 5875U	65,58%
  AMD Ryzen 7 PRO 6850H	87,53%
  AMD Ryzen 7 PRO 6850HS	157,72%
  AMD Ryzen 7 Pro 6850HS	112,19%
  AMD Ryzen 7 Pro 6850U	102,85%
  AMD Ryzen 7 Pro 6860Z	113,36%
  AMD Ryzen 9 4900H	36,75%
  AMD Ryzen 9 4900HS	45,54%
  AMD Ryzen 9 5900HS	60,50%
  AMD Ryzen 9 5900HS	55,83%
  AMD Ryzen 9 5900HX	48,13%
  AMD Ryzen 9 5900HX	53,49%
  AMD Ryzen 9 5980HS	68,21%
  AMD Ryzen 9 5980HS	65,74%
  AMD Ryzen 9 5980HX	61,59%
  AMD Ryzen 9 6900HS	161,42%
  AMD Ryzen 9 6900HX	136,06%
  AMD Ryzen 9 6980HS	172,43%
  AMD Ryzen 9 6980HX	137,94%
  AMD Ryzen 9 PRO 6950H	115,42%
  AMD Ryzen 9 PRO 6950HS	144,28%
  Intel Core i3-1220P	21,77%
  Intel Core i5-10200H	3,59%
  Intel Core i5-10210U	4,94%
  Intel Core i5-10300H	18,47%
  Intel Core i5-11260H	6,88%
  Intel Core i5-11300H	30,21%
  Intel Core i5-1130G7	23,59%
  Intel Core i5-11320H	46,22%
  Intel Core i5-1135G7	27,34%
  Intel Core i5-11400H	7,53%
  Intel Core i5-1140G7	19,73%
  Intel Core i5-1145G7	32,02%
  Intel Core i5-11500H	16,54%
  Intel Core i5-1155G7	36,86%
  Intel Core i5-1230U	32,86%
  Intel Core i5-1235U	51,60%
  Intel Core i5-1240P	55,92%
  Intel Core i5-12450H	25,04%
  Intel Core i5-1245U	59,73%
  Intel Core i5-12500H	61,83%
  Intel Core i5-1250P	57,12%
  Intel Core i5-12600K	34,68%
  Intel Core i5-3317U	0,46%
  Intel Core i5-8350U	4,07%
  Intel Core i7-10510U	4,66%
  Intel Core i7-10610U	9,35%
  Intel Core i7-1065G7	8,61%
  Intel Core i7-10810U	10,91%
  Intel Core i7-10870H	9,67%
  Intel Core i7-11370H	45,91%
  Intel Core i7-11375H	55,03%
  Intel Core i7-11390H	53,68%
  Intel Core i7-11600H	14,03%
  Intel Core i7-1160G7	31,53%
  Intel Core i7-1165G7	44,70%
  Intel Core i7-11800H	22,02%
  Intel Core i7-1180G7	36,10%
  Intel Core i7-11850H	24,29%
  Intel Core i7-1185G7	46,47%
  Intel Core i7-1195G7	41,30%
  Intel Core i7-1250U	41,66%
  Intel Core i7-1255U	50,38%
  Intel Core i7-1260P	95,36%
  Intel Core i7-1260U	42,49%
  Intel Core i7-12650H	54,49%
  Intel Core i7-12650H	60,57%
  Intel Core i7-1265U	86,66%
  Intel Core i7-12700H	97,03%
  Intel Core i7-1270P	77,34%
  Intel Core i7-12800H	100,01%
  Intel Core i7-12800HX	101,00%
  Intel Core i7-1280P	114,91%
  Intel Core i7-12850HX	32,12%
  Intel Core i7-1370P	29,74%
  Intel Core i7-7820HQ	3,52%
  Intel Core i7-8705G	21,50%
  Intel Core i7-8706G	19,72%
  Intel Core i7-8850H	4,24%
  Intel Core i9-11900H	24,66%
  Intel Core i9-11950H	20,41%
  Intel Core i9-11980HK	25,07%
  Intel Core i9-12900H	111,42%
  Intel Core i9-12900HK	120,68%
  Intel Core i9-12900HX	59,25%
  Intel Core i9-12950HX	44,36%
  Intel Pentium Gold 7505	6,67%
  Intel Pentium Silver N6000	3,19%`
const scoresByCpu = {}
data.split('\n').forEach(line => {
  const [cpuRaw, scoreRaw] = line.split('\t')
  const cpu = cleanCpuName(cpuRaw)
  const score = Number.parseFloat(scoreRaw)
  scoresByCpu[cpu] = score
})
const maxScore = Math.max(...Object.values(scoresByCpu))
const minScore = Math.min(...Object.values(scoresByCpu))
Object.keys(scoresByCpu).forEach(cpu => {
  const score = scoresByCpu[cpu]
  const scoreNormalized = (score - minScore) / (maxScore - minScore)
  scoresByKeyword[cpu] = Math.round(scoreNormalized * 100)
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
    desc: ['h1', '.colorTipContent', 'p.desc', 'div[data-asin] span.a-text-normal', '.c-product__title', '.pdt-info .title-3 a', '.thread-title--list', 'article .libelle h3'].map(sel => `${sel}:not(.${cls.mark})`).join(','),
  }
  const utils = new Shuutils(app)

  const keywords = Object.keys(scoresByKeyword)
  utils.log(keywords.length, 'keywords with associated scores')
  const keywordRegex = new RegExp(keywords.join('|'), 'igu')

  function annotate (element) {
    let keyword = element.dataset.keyword
    keyword = scoresByKeyword[keyword] === undefined ? keyword.toLowerCase() : keyword
    const score = scoresByKeyword[keyword]
    if (score === undefined) return utils.error('no score found for', keyword)
    utils.log('found score', score, 'for', keyword)
    const color = getColorForScore(score)
    const annotation = RoughNotation.annotate(element, { type: 'highlight', color })
    annotation.show()
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
  setTimeout(processDebounced, 1000)
}

LaptopHelper()
