// ==UserScript==
// @name        Amazon Music - Export to MusicBrainz
// @namespace   https://github.com/Shuunen
// @match       https://www.amazon.fr/*
// @grant       none
// @version     1.0.3
// @require     https://raw.githubusercontent.com/Shuunen/user-scripts/master/src/mb-import-utils.js
// @author      Shuunen
// @description This script let you import releases on Amazon Music to the great MusicBrainz db <3
// ==/UserScript==

// @ts-nocheck

(function AmazonMusicBrainzExport () {
  /* global textFromSelector, insertMbForm, Shuutils */
  /** @type {import('./utils.js').Shuutils} */
  const utils = new Shuutils({ id: 'amazon-mb-export', debug: false })
  const selectors = {
    title: '[data-feature-name="dmusicProductTitle"]',
    artist: '[data-feature-name="artistLink"',
  }
  function getTracks () {
    return utils.findAll('[id^="dmusic_tracklist_player_row"]').map((element, index) => ({
      number: String(index + 1),
      name: textFromSelector('.TitleLink', element),
      duration: textFromSelector('[id^="dmusic_tracklist_duration"]', element),
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
      title: textFromSelector(selectors.title),
      artist: textFromSelector(selectors.artist),
      date: { year: 0, month: 0, day: 0 },
      label: (details.match(/Label: (?<name>\S+)/u) || [])[1] || '',
      url: document.location.href,
      urlType: '77',
      tracks: getTracks(),
    }
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
  utils.onPageChange(init)
})()
