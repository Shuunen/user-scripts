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

'use strict'

/**
 * A fake function to enable tailwindcss intellisense
 * @param {string} classes the string to translate
 * @returns {string} the translated string
 */
function tw (classes) { return classes }

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
      // eslint-disable-next-line @typescript-eslint/naming-convention
      preflight: false,
    },
  }
  /** @type {import('./utils.js').Shuutils} */
  // @ts-ignore
  // eslint-disable-next-line @typescript-eslint/naming-convention
  const utils = new Shuutils({ id: 'lbc-nts', debug: true })
  const cls = {
    marker: `${utils.app.id}-processed`,
  }
  /**
   * Save a note to storage
   * @param {string} id the note id
   * @param {string} note the note content to save
   * @returns {void}
   */
  function saveNote (id, note) {
    // eslint-disable-next-line no-console
    console.log(`note ${id} saved with content : ${note}`)
    localStorage.setItem(`lbc-nts-${id}`, note)
  }
  // eslint-disable-next-line no-magic-numbers
  const saveNoteDebounced = utils.debounce(saveNote, 300)
  /**
   * Load a note from storage
   * @param {string} id the note id
   * @returns {string} the note content
   */
  function loadNote (id) {
    return localStorage.getItem(`lbc-nts-${id}`) || ''
  }
  /**
   * Create a note element
   * @param {string} id the note id
   * @returns {HTMLTextAreaElement} the note element
   */
  function createNoteElement (id) {
    const note = document.createElement('textarea')
    // eslint-disable-next-line unicorn/no-keyword-prefix
    note.className = tw('fixed right-5 top-56 z-10 h-56  w-96 rounded-md border border-gray-400 bg-gray-100 px-2 py-1')
    note.addEventListener('keypress', () => saveNoteDebounced(id, note.value))
    note.textContent = loadNote(id)
    return note
  }
  function addNotesToList () {
    utils.log('addNotesToList')
  }
  /**
   * Add a note to the current page
   * @param {string} id the note id
   * @returns {void}
   */
  function addNoteToPage (id) {
    utils.log('addNotesToPage', id)
    const note = createNoteElement(id)
    document.body.append(note)
  }
  function process () {
    if (document.body.classList.contains(cls.marker)) return
    document.body.classList.add(cls.marker)
    const id = getListingId()
    if (id === undefined) addNotesToList()
    else addNoteToPage(id)
  }
  // eslint-disable-next-line no-magic-numbers
  const processDebounced = utils.debounce(process, 300)
  window.addEventListener('scroll', () => processDebounced())
  window.addEventListener('load', () => processDebounced())
  void utils.onPageChange(processDebounced)
})()
