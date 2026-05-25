// ==UserScript==
// @name         Amazon Music - Export to MusicBrainz
// @author       Shuunen
// @description  This script let you import releases on Amazon Music to the great MusicBrainz db <3
// @downloadURL  https://github.com/Shuunen/user-scripts/raw/master/src/mb-import-from-amazon-music.user.js
// @updateURL    https://github.com/Shuunen/user-scripts/raw/master/src/mb-import-from-amazon-music.user.js
// @grant        none
// @match        https://www.amazon.fr/*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=amazon.fr
// @namespace    https://github.com/Shuunen
// @require      https://cdn.jsdelivr.net/gh/Shuunen/user-scripts/src/mb-import-utils.js
// @version      1.0.5
// ==/UserScript==

function MbImportFromAmazonMusic() {
  const utils = new Shuutils('amazon-mb-export')
  const selectors = {
    artist: '[data-feature-name="artistLink"]',
    title: '[data-feature-name="dmusicProductTitle"]',
  }
  function getTracks() {
    return utils.findAll('[id^="dmusic_tracklist_player_row"]').map((element, index) => ({
      artist: '',
      duration: textFromSelector('[id^="dmusic_tracklist_duration"]', element),
      name: textFromSelector('.TitleLink', element),
      number: String(index + 1),
    }))
  }
  function mbImport() {
    const details = textFromSelector('#productDetailsTable')
    const data = {
      app: {
        id: 'mb-import-from-amazon-music',
        title: 'Amazon to MB',
      },
      artist: textFromSelector(selectors.artist),
      date: { day: '0', month: '0', year: '0' },
      label: (/Label: (?<name>\S+)/u.exec(details) || [])[1] || '',
      title: textFromSelector(selectors.title),
      tracks: getTracks(),
      url: document.location.href,
      urlType: '77',
    }
    const dateMatches = /origine : (?<day>\d{1,2}) (?<month>\S+) (?<year>\d{4})/u.exec(details)
    if (dateMatches?.groups?.year && dateMatches?.groups?.month && dateMatches?.groups?.day) {
      const months = ['janvier', 'février', 'mars', 'avril', 'mai', 'juin', 'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre']
      data.date.year = dateMatches.groups.year
      data.date.month = String(months.indexOf(dateMatches.groups.month) + 1)
      data.date.day = dateMatches.groups.day
    }
    if (data.title && data.artist) {
      insertMbForm(data)
      return
    }
    utils.warn('cannot insert MB form without title & artist')
  }
  async function init() {
    const title = await utils.waitToDetect(selectors.title)
    if (title === undefined) {
      utils.log('no music title found on this page')
      return
    }
    mbImport()
  }
  utils.onPageChange(init)
}

if (globalThis.window) MbImportFromAmazonMusic()
