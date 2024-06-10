// ==UserScript==
// @name         Spotify - Export to MusicBrainz
// @namespace    https://github.com/Shuunen
// @match        https://open.spotify.com/album/*
// @match        https://open.spotify.com/playlist/*
// @grant        none
// @require      https://cdn.jsdelivr.net/gh/Shuunen/user-scripts@2.6.1/src/mb-import-utils.js
// @require      https://cdn.jsdelivr.net/gh/Shuunen/user-scripts@2.6.1/src/utils.min.js
// @version      1.0.4
// @author       Shuunen
// @description  This script let you import releases on Spotify to the great MusicBrainz db <3
// ==/UserScript==

// @ts-nocheck

(function SpotifyMusicBrainzExport () {
  /** @type {import('./utils.js').Shuutils} */// @ts-ignore
  const utils = new Shuutils('spotify-mb-export')
  const selectors = {
    title: '.entity-info.media h1, .os-content h1[as="h1"]',
  }
  function getTracks () {
    return utils.findAll('.tracklist-row, [data-testid="tracklist-row"]').map((element, index) => ({
      artist: textFromSelector('.artists-inline, .tracklist-row__artist-name-link, a[href^="/artist/"]', element),
      duration: textFromSelector('.total-duration, .tracklist-duration, [as="div"][style]', element),
      name: textFromSelector('.track-name, .tracklist-name, [as="div"]', element),
      number: String(index + 1),
    }))
  }
  function mbImport () {
    const data = {
      app: {
        id: 'mb-import-from-spotify',
        title: 'Spotify to MB',
      },
      // eslint-disable-next-line regexp/prefer-regexp-exec
      artist: textFromSelector('.entity-info.media h2 a, .os-content a[href^="/artist/"]') || textFromSelector('.entity-info.media h2').match(/^.+\b\s(?<artist>.+)$/u)?.groups?.artist || '',
      date: { day: 0, month: 0, year: 0 },
      // eslint-disable-next-line regexp/prefer-regexp-exec
      label: textFromSelector('.copyrights li, .os-content p[as="p"]').match(/[\d\s©℗]+(?<label>.*)/u)?.groups?.label || '',
      title: textFromSelector(selectors.title),
      tracks: getTracks(),
      url: document.location.href,
      urlType: '85',
    }
    // eslint-disable-next-line regexp/prefer-regexp-exec
    const dateMatches = textFromSelector('script[type="application/ld+json"]').match(/datePublished":"(?<year>\d{4})-(?<month>\d{2})-(?<day>\d{2})/u)
    if (dateMatches.groups?.day) {
      data.date.year = dateMatches.groups.year
      data.date.month = dateMatches.groups.month
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
