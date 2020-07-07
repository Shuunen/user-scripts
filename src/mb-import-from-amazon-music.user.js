// ==UserScript==
// @name        Amazon Music - Export to MusicBrainz
// @namespace   https://github.com/Shuunen
// @match       https://www.amazon.fr/*
// @grant       none
// @version     1.0.1
// @require     https://raw.githubusercontent.com/Shuunen/user-scripts/master/src/mb-import-utils.js
// @author      Shuunen
// @description This script let you import releases on Amazon Music to the great MusicBrainz db <3
// ==/UserScript==

/* global textFromSelector, insertMbForm */

function mbImport () {
  const getTracks = () => Array.from(document.querySelectorAll('[id^="dmusic_tracklist_player_row"]')).map((el, index) => ({
    number: (index + 1) + '',
    name: textFromSelector('.TitleLink', el),
    duration: textFromSelector('[id^="dmusic_tracklist_duration"]', el),
  }))
  const details = textFromSelector('#productDetailsTable')
  const data = {
    app: {
      id: 'mb-import-from-amazon-music',
      title: 'Amazon to MB',
    },
    title: textFromSelector('[data-feature-name="dmusicProductTitle"]'),
    artist: textFromSelector('[data-feature-name="artistLink"'),
    date: { year: 0, month: 0, day: 0 },
    label: (details.match(/Label: (\S+)/) || [])[1] || '',
    url: document.location.href,
    urlType: '77', // amazon link
    tracks: getTracks(),
  }
  const dateMatches = details.match(/origine : (\d{1,2}) (\S+) (\d{4})/) || []
  if (dateMatches.length === 4) {
    const months = ['janvier', 'février', 'mars', 'avril', 'mai', 'juin', 'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre']
    data.date.year = dateMatches[3]
    data.date.month = months.indexOf(dateMatches[2]) + 1
    data.date.day = dateMatches[1]
  }
  insertMbForm(data)
}

window.addEventListener('load', () => mbImport())
