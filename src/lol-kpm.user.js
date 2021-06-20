// ==UserScript==
// @name        LoL - KPM Counter - Kills per minutes
// @namespace   https://github.com/Shuunen
// @description Show how many kills per minutes you did, isn't the title that obvious ?
// @author      Romain Racamier-Lafon
// @match       https://matchhistory.euw.leagueoflegends.com/*
// @require     https://raw.githubusercontent.com/Shuunen/user-scripts/master/src/utils.js
// @grant       none
// @version     1.1.3
// ==/UserScript==

(function LolKpmCounter () {
  /* global Shuutils */
  const utils = new Shuutils({ id: 'lol-kpm', debug: false })
  const maxKpm = 1.8
  const coolPercents = kpm => Math.min(Math.max(Math.round(kpm / maxKpm * 100), 0), 100)
  const showKpmOnRow = row => {
    const kills = Number.parseInt(row.querySelector('.kda-plate').textContent.split('/')[0], 10)
    const time = row.querySelector('.date-duration').textContent.split(' ')[0].split(':').map(string => Number.parseInt(string, 10))
    const minutes = time.length === 3 ? ((60 * time[0]) + time[1]) : time[0]
    const element = document.createElement('div')
    const kpm = Math.round(kills / minutes * 10) / 10
    const score = coolPercents(kpm) // 5% ur bad, 100% super good
    element.textContent = `${kpm} kills/min`
    element.title = `You're ${score}% awesome`
    element.style = `white-space: nowrap; padding-right: 15px; font-size: ${(kpm * 10) + 5}px; color: hsl(120, 100%, ${score}%); background-color: hsl(0, 0%, ${100 - score}%);`
    row.append(element)
    row.classList.add('kpm-handled')
  }
  window.addEventListener('DOMNodeInserted', event => {
    if (!event.relatedNode.matches('ul[id^=match-history]')) return
    utils.findAll('div[id^=game-summary]:not(.kpm-handled)', event.relatedNode, true).forEach(row => showKpmOnRow(row))
  })
})()

