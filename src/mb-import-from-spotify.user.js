// ==UserScript==
// @name         Spotify - Export to MusicBrainz
// @author       Shuunen
// @description  This script let you import releases on Spotify to the great MusicBrainz db <3
// @downloadURL  https://github.com/Shuunen/user-scripts/raw/master/src/mb-import-from-spotify.user.js
// @updateURL    https://github.com/Shuunen/user-scripts/raw/master/src/mb-import-from-spotify.user.js
// @grant        none
// @match        https://open.spotify.com/album/*
// @match        https://open.spotify.com/playlist/*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=spotify.com
// @namespace    https://github.com/Shuunen
// @require      https://cdn.jsdelivr.net/gh/Shuunen/user-scripts/src/mb-import-utils.js
// @require      https://cdn.jsdelivr.net/gh/Shuunen/monorepo@latest/apps/user-scripts/src/utils.js
// @version      1.0.6
// ==/UserScript==

function MbImportFromSpotify() {
  const utils = new Shuutils('spotify-mb-export')
  const selectors = {
    title: '.entity-info.media h1, .os-content h1[as="h1"]',
  }
  function getTracks() {
    return utils.findAll('.tracklist-row, [data-testid="tracklist-row"]').map((element, index) => ({
      artist: textFromSelector('.artists-inline, .tracklist-row__artist-name-link, a[href^="/artist/"]', element),
      duration: textFromSelector('.total-duration, .tracklist-duration, [as="div"][style]', element),
      name: textFromSelector('.track-name, .tracklist-name, [as="div"]', element),
      number: String(index + 1),
    }))
  }
  function mbImport() {
    const data = {
      app: {
        id: 'mb-import-from-spotify',
        title: 'Spotify to MB',
      },
      artist: textFromSelector('.entity-info.media h2 a, .os-content a[href^="/artist/"]') || /^.+\b\s(?<artist>.+)$/u.exec(textFromSelector('.entity-info.media h2'))?.groups?.artist || '',
      date: { day: '0', month: '0', year: '0' },
      label: /[\d\s©℗]+(?<label>.*)/u.exec(textFromSelector('.copyrights li, .os-content p[as="p"]'))?.groups?.label || '',
      title: textFromSelector(selectors.title),
      tracks: getTracks(),
      url: document.location.href,
      urlType: '85',
    }
    const dateMatches = /datePublished":"(?<year>\d{4})-(?<month>\d{2})-(?<day>\d{2})/u.exec(textFromSelector('script[type="application/ld+json"]'))
    if (dateMatches?.groups?.day && dateMatches?.groups?.month && dateMatches?.groups?.year) {
      data.date.year = dateMatches.groups.year
      data.date.month = dateMatches.groups.month
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

if (globalThis.window) MbImportFromSpotify()
