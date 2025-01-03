// ==UserScript==
// @author       Romain Racamier-Lafon
// @description  Show how many kills per minutes you did, isn't the title that obvious ?
// @downloadURL  https://github.com/Shuunen/user-scripts/raw/master/src/lol-kpm.user.js
// @grant        none
// @match        https://matchhistory.euw.leagueoflegends.com/*
// @name         LoL - KPM Counter - Kills per minutes
// @namespace    https://github.com/Shuunen
// @require      https://cdn.jsdelivr.net/gh/Shuunen/user-scripts/src/utils.js
// @version      1.1.5
// ==/UserScript==

// @ts-nocheck
/* eslint-disable jsdoc/require-jsdoc */

(function LolKpmCounter () {
  /** @type {import('./utils.js').Shuutils} */// @ts-ignore
  const utils = new Shuutils('lol-kpm')
  const maxKpm = 1.8
  function coolPercents (kpm) {
    // eslint-disable-next-line no-magic-numbers
    return Math.min(Math.max(Math.round(kpm / maxKpm * 100), 0), 100)
  }
  // eslint-disable-next-line max-statements
  function showKpmOnRow (row) {
    const kills = Number.parseInt(row.querySelector('.kda-plate').textContent.split('/')[0], 10)
    const time = row.querySelector('.date-duration').textContent.split(' ')[0].split(':').map(string => Number.parseInt(string, 10))
    // eslint-disable-next-line no-magic-numbers
    const minutes = time.length === 3 ? ((60 * time[0]) + time[1]) : time[0]
    const element = document.createElement('div')
    // eslint-disable-next-line no-magic-numbers
    const kpm = Math.round(kills / minutes * 10) / 10
    const score = coolPercents(kpm) // 5% ur bad, 100% super good
    element.textContent = `${kpm} kills/min`
    element.title = `You're ${score}% awesome`
    // eslint-disable-next-line no-magic-numbers
    element.style = `white-space: nowrap; padding-right: 15px; font-size: ${(kpm * 10) + 5}px; color: hsl(120, 100%, ${score}%); background-color: hsl(0, 0%, ${100 - score}%);`
    row.append(element)
    row.classList.add('kpm-handled')
  }
  globalThis.addEventListener('DOMNodeInserted', event => {
    if (!event.relatedNode.matches('ul[id^=match-history]')) return
    const rows = utils.findAll('div[id^=game-summary]:not(.kpm-handled)', event.relatedNode, true)
    for (const row of rows) showKpmOnRow(row)
  })
})()

