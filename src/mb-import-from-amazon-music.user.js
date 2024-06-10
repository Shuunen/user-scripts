// ==UserScript==
// @name         Amazon Music - Export to MusicBrainz
// @downloadURL  https://github.com/Shuunen/user-scripts/raw/master/src/mb-import-from-amazon-music.user.js
// @namespace    https://github.com/Shuunen
// @match        https://www.amazon.fr/*
// @grant        none
// @version      1.0.3
// @require      https://cdn.jsdelivr.net/gh/Shuunen/user-scripts@2.6.1/src/mb-import-utils.js
// @author       Shuunen
// @description  This script let you import releases on Amazon Music to the great MusicBrainz db <3
// ==/UserScript==

// @ts-nocheck

(function AmazonMusicBrainzExport () {
  /** @type {import('./utils.js').Shuutils} */// @ts-ignore
  const utils = new Shuutils('amazon-mb-export')
  const selectors = {
    artist: '[data-feature-name="artistLink"',
    title: '[data-feature-name="dmusicProductTitle"]',
  }
  function getTracks () {
    return utils.findAll('[id^="dmusic_tracklist_player_row"]').map((element, index) => ({
      duration: textFromSelector('[id^="dmusic_tracklist_duration"]', element),
      name: textFromSelector('.TitleLink', element),
      number: String(index + 1),
    }))
  }
  // eslint-disable-next-line max-statements
  function mbImport () {
    const details = textFromSelector('#productDetailsTable')
    const data = {
      app: {
        id: 'mb-import-from-amazon-music',
        title: 'Amazon to MB',
      },
      artist: textFromSelector(selectors.artist),
      date: { day: 0, month: 0, year: 0 },
      // eslint-disable-next-line regexp/prefer-regexp-exec
      label: (details.match(/Label: (?<name>\S+)/u) || [])[1] || '',
      title: textFromSelector(selectors.title),
      tracks: getTracks(),
      url: document.location.href,
      urlType: '77',
    }
    // eslint-disable-next-line regexp/prefer-regexp-exec
    const dateMatches = details.match(/origine : (?<day>\d{1,2}) (?<month>\S+) (?<year>\d{4})/u)
    if (dateMatches.groups?.year) {
      const months = ['janvier', 'février', 'mars', 'avril', 'mai', 'juin', 'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre']
      data.date.year = dateMatches.groups.year
      data.date.month = months.indexOf(dateMatches.groups.month) + 1
      data.date.day = dateMatches.groups.day
    }
    if (data.title && data.artist) { insertMbForm(data); return }
    utils.warn('cannot insert MB form without title & artist')
  }
  async function init () {
    const title = await utils.waitToDetect(selectors.title)
    if (title === undefined) { utils.log('no music title found on this page'); return }
    mbImport()
  }
  void utils.onPageChange(init)
})()
