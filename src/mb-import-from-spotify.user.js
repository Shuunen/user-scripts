// ==UserScript==
// @name        Spotify - Export to MusicBrainz
// @namespace   https://github.com/Shuunen
// @match       https://open.spotify.com/album/*
// @match       https://open.spotify.com/playlist/*
// @grant       none
// @require     https://raw.githubusercontent.com/Shuunen/user-scripts/master/src/mb-import-utils.js
// @require     https://raw.githubusercontent.com/Shuunen/user-scripts/master/src/utils.js
// @version     1.0.3
// @author      Shuunen
// @description This script let you import releases on Spotify to the great MusicBrainz db <3
// ==/UserScript==

(function SpotifyMusicBrainzExport() {
  /* global document, textFromSelector, insertMbForm, Shuutils */
  const utils = new Shuutils({ id: 'spotify-mb-export', debug: false })
  const getTracks = () => utils.findAll('.tracklist-row, [data-testid="tracklist-row"]').map((element, index) => ({
    number: String(index + 1),
    name: textFromSelector('.track-name, .tracklist-name, [as="div"]', element),
    artist: textFromSelector('.artists-inline, .tracklist-row__artist-name-link, a[href^="/artist/"]', element),
    duration: textFromSelector('.total-duration, .tracklist-duration, [as="div"][style]', element),
  }))
  function mbImport() {
    const data = {
      app: {
        id: 'mb-import-from-spotify',
        title: 'Spotify to MB',
      },
      title: textFromSelector('.entity-info.media h1, .os-content h1[as="h1"]'),
      artist: textFromSelector('.entity-info.media h2 a, .os-content a[href^="/artist/"]') || (textFromSelector('.entity-info.media h2').match(/^.+\b\s(.+)$/) || [])[1],
      date: { year: 0, month: 0, day: 0 },
      label: (textFromSelector('.copyrights li, .os-content p[as="p"]').match(/[\d\s©℗]+(.*)/) || [])[1] || '',
      url: document.location.href,
      urlType: '85', // music streaming link
      tracks: getTracks(),
    }
    const dateMatches = textFromSelector('script[type="application/ld+json"]').match(/datePublished":"(\d{4})-(\d{2})-(\d{2})/) || []
    if (dateMatches.length === 4) {
      data.date.year = dateMatches[1]
      data.date.month = dateMatches[2]
      data.date.day = dateMatches[3]
    }
    if (data.title && data.artist) {
      clearInterval(spotifyNotFullyLoaded)
      insertMbForm(data)
    }
  }
  const spotifyNotFullyLoaded = setInterval(mbImport, 1000)
})()
