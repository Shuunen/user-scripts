// ==UserScript==
// @name        LoL - KPM Counter - Kills per minutes
// @namespace   https://github.com/Shuunen
// @description Show how many kills per minutes you did, isn't the title that obvious ?
// @author      Romain Racamier-Lafon
// @match       https://matchhistory.euw.leagueoflegends.com/*
// @grant       none
// @version     1.1.1
// ==/UserScript==

const maxKpm = 1.8

const coolPercents = kpm => Math.min(Math.max(Math.round(kpm / maxKpm * 100), 0), 100)

const showKpmOnRow = (row) => {
  let kills
  try { kills = Number.parseInt(row.querySelector('.kda-plate').textContent.split('/')[0]) } catch (error) { console.error(error) }
  if (!kills) return
  let min
  try { min = Number.parseInt(row.querySelector('.date-duration').textContent.split(':')[0]) } catch (error) { console.error(error) }
  if (!min) return
  const element = document.createElement('div')
  const kpm = Math.round(kills / min * 10) / 10
  const score = coolPercents(kpm) // 5% ur bad, 100% super good
  element.textContent = `${kpm} kills/min`
  element.title = `You're ${score}% awesome`
  element.style = `
    white-space: nowrap;
    padding-right: 15px;
    font-size: ${kpm * 10 + 5}px;
    color: hsl(120, 100%, ${score}%);
    background-color: hsl(0, 0%, ${100 - score}%);
  `
  row.append(element)
  row.classList.add('kpm-handled')
}

window.addEventListener('DOMNodeInserted', event => {
  if (event.relatedNode.matches('ul[id^=match-history]')) {
    const rows = [...event.relatedNode.querySelectorAll('div[id^=game-summary]:not(.kpm-handled)')]
    rows.forEach(row => showKpmOnRow(row))
  }
})
