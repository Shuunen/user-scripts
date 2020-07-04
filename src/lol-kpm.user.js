// ==UserScript==
// @name        LoL - KPM Counter - Kills per minutes
// @namespace   https://github.com/Shuunen
// @description Show how many kills per minutes you did, isn't the title that obvious ?
// @author      Romain Racamier-Lafon
// @match       https://matchhistory.euw.leagueoflegends.com/*
// @grant       none
// @version     1.1
// ==/UserScript==

const maxKpm = 1.8

const coolPercents = kpm => Math.min(Math.max(Math.round(kpm / maxKpm * 100), 0), 100)

const showKpmOnRow = (row) => {
  let kills = null
  try { kills = parseInt(row.querySelector('.kda-plate').textContent.split('/')[0]) } catch (e) { console.error(e) }
  if (!kills) return
  let min = null
  try { min = parseInt(row.querySelector('.date-duration').textContent.split(':')[0]) } catch (e) { console.error(e) }
  if (!min) return
  const el = document.createElement('div')
  const kpm = Math.round(kills / min * 10) / 10
  const score = coolPercents(kpm) // 5% ur bad, 100% super good
  el.textContent = `${kpm} kills/min`
  el.title = `You're ${score}% awesome`
  el.style = `
    white-space: nowrap;
    padding-right: 15px;
    font-size: ${kpm * 10 + 5}px;
    color: hsl(120, 100%, ${score}%);
    background-color: hsl(0, 0%, ${100 - score}%);
  `
  row.appendChild(el)
  row.classList.add('kpm-handled')
}

window.addEventListener('DOMNodeInserted', event => {
  if (event.relatedNode.matches('ul[id^=match-history]')) {
    const rows = Array.from(event.relatedNode.querySelectorAll('div[id^=game-summary]:not(.kpm-handled)'))
    rows.forEach(row => showKpmOnRow(row))
  }
})
