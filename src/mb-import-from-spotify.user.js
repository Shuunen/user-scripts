// ==UserScript==
// @name        Spotify - Export to MusicBrainz
// @namespace   https://github.com/Shuunen
// @match       https://open.spotify.com/album/*
// @match       https://open.spotify.com/playlist/*
// @grant       none
// @require     https://raw.githubusercontent.com/Shuunen/user-scripts/master/src/mb-import-utils.js
// @version     1.0.1
// @author      Shuunen
// @description This script let you import releases on Spotify to the great MusicBrainz db <3
// ==/UserScript==

/* global textFromSelector, insertMbForm */

function mbImport () {
  const getTracks = () => Array.from(document.querySelectorAll('.tracklist-row')).map((el, index) => ({
    number: (index + 1) + '',
    name: textFromSelector('.track-name, .tracklist-name', el),
    artist: textFromSelector('.artists-inline, .tracklist-row__artist-name-link', el),
    duration: textFromSelector('.total-duration, .tracklist-duration', el),
  }))
  const data = {
    app: {
      id: 'mb-import-from-spotify',
      title: 'Spotify to MB',
    },
    title: textFromSelector('.entity-info.media h1, section.content h1'),
    artist: textFromSelector('.entity-info.media h2 a, section.content a[href^="/artist/"]') || textFromSelector('.entity-info.media h2').match(/^.+\b\s(.+)$/)[1],
    date: { year: 0, month: 0, day: 0 },
    label: (textFromSelector('.copyrights li, section.content p[as="p"]').match(/[©\s℗]+\s(?:\d{4}\s)?(.*)/) || [])[1] || '',
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
    clearInterval(spotifyNotFullyLoaded);
    insertMbForm(data);
  }
}

var spotifyNotFullyLoaded = setInterval(mbImport, 1000);
