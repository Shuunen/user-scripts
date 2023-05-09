// ==UserScript==
// @name        LeBonCoin Notes
// @namespace   https://github.com/Shuunen
// @description Add notes to LeBonCoin listings (for personal use only) (WIP) (not working yet) (not even started) (just a copy of lbc-dpe) (I'm lazy)
// @author      Romain Racamier-Lafon
// @match       https://www.leboncoin.fr/*
// @grant       none
// @require     https://raw.githubusercontent.com/Shuunen/user-scripts/master/src/utils.js
// @require     https://cdn.tailwindcss.com
// @version     0.0.1
// ==/UserScript==

/**
 * @param {string} str
 */
function tw (str) { return str }

function getListingId (url = document.location.href) {
  return /(?<id>\d{5,15})\.htm/u.exec(url)?.groups?.id
}

// @ts-nocheck
// eslint-disable-next-line max-statements
(function LeBonCoinNotes () {
  /* global Shuutils, tailwind */
  // @ts-ignore
  tailwind.config = {
    corePlugins: {
      preflight: false,
    },
  }
  // @ts-ignore
  const utils = new Shuutils({ id: 'lbc-nts', debug: true })
  const cls = {
    marker: `${utils.app.id}-processed`,
  }
  /**
   * @param {string} id
   * @param {string} note
   */
  function saveNote (id, note) {
    // eslint-disable-next-line no-console
    console.log(`note ${id} saved with content : ${note}`)
    localStorage.setItem(`lbc-nts-${id}`, note)
  }
  // eslint-disable-next-line no-magic-numbers
  const saveNoteDebounced = utils.debounce(saveNote, 300)
  /**
   * @param {string} id
   */
  function loadNote (id) {
    return localStorage.getItem(`lbc-nts-${id}`)
  }
  /**
   * @param {string} id
   */
  function createNoteElement (id) {
    const note = document.createElement('textarea')
    // eslint-disable-next-line unicorn/no-keyword-prefix
    note.className = tw('fixed top-56 right-5 z-10 w-96 h-56 px-2 py-1 border border-gray-400 rounded-md bg-gray-100')
    note.addEventListener('keypress', () => saveNoteDebounced(id, note.value))
    note.textContent = loadNote(id)
    return note
  }
  function addNotesToList () {
    utils.log('addNotesToList')
  }
  /**
   * @param {string} id
   */
  function addNotesToPage (id) {
    if (document.body.classList.contains(cls.marker)) return
    document.body.classList.add(cls.marker)
    utils.log('addNotesToPage', id)
    const note = createNoteElement(id)
    document.body.append(note)
  }
  function process () {
    const id = getListingId()
    if (id === undefined) addNotesToList()
    else addNotesToPage(id)
  }
  // eslint-disable-next-line no-magic-numbers
  const processDebounced = utils.debounce(process, 300)
  window.addEventListener('scroll', processDebounced)
  window.addEventListener('load', processDebounced)
  utils.onPageChange(processDebounced)
})()
