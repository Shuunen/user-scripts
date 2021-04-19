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

(function AmazonMusicBrainzExport() {
  /* global document, textFromSelector, insertMbForm, Shuutils */
  const utils = new Shuutils({ id: 'amazon-mb-export', debug: false })
  const selectors = {
    title: '[data-feature-name="dmusicProductTitle"]',
    artist: '[data-feature-name="artistLink"',
  }
  const getTracks = () => utils.findAll('[id^="dmusic_tracklist_player_row"]').map((element, index) => ({
    number: String(index + 1),
    name: textFromSelector('.TitleLink', element),
    duration: textFromSelector('[id^="dmusic_tracklist_duration"]', element),
  }))
  const mbImport = () => {
    const details = textFromSelector('#productDetailsTable')
    const data = {
      app: {
        id: 'mb-import-from-amazon-music',
        title: 'Amazon to MB',
      },
      title: textFromSelector(selectors.title),
      artist: textFromSelector(selectors.artist),
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
    if (data.title && data.artist) return insertMbForm(data)
    utils.warn('cannot insert MB form without title & artist')
  }
  const init = async () => {
    const title = await utils.waitToDetect(selectors.title)
    if (title === undefined) return utils.log('no music title found on this page')
    mbImport()
  }
  utils.onPageChange(init)
})()
