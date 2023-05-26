// ==UserScript==
// @name        LeBonCoin Notes
// @namespace   https://github.com/Shuunen
// @description Add notes to LeBonCoin listings
// @author      Romain Racamier-Lafon
// @match       https://www.leboncoin.fr/*
// @grant       none
// @require     https://raw.githubusercontent.com/Shuunen/user-scripts/master/src/utils.js
// @require     https://cdn.jsdelivr.net/npm/appwrite@10.1.0
// @require     https://cdn.jsdelivr.net/npm/idb-keyval@6/dist/umd.js
// @require     https://cdn.tailwindcss.com
// @version     0.0.3
// ==/UserScript==

'use strict'

/**
  @typedef LbcNote
  @type {Object}
  @property {string} noteId the note id in AppWrite
  @property {number} listingId the listing id in LeBonCoin
  @property {string} noteContent the note content
 */

/**
 * Enable tailwindcss intellisense and return an array of classes
 * @param {string} classes the classes to split, e.g. 'h-56 w-96 rounded-md'
 * @returns {string[]} the array of classes, e.g. ['h-56', 'w-96', 'rounded-md']
 */
function tw (classes) { return classes.split(' ') }

/**
 * Return the listing id from the given url
 * @param {string} url the url to parse
 * @returns {number|undefined} the listing id
 */
function getListingId (url = document.location.href) {
  const id = /\/(?<id>\d{5,15})\.htm$/u.exec(url)?.groups?.id
  return id ? Number.parseInt(id, 10) : undefined
}

/**
 * Return the listing id from the given note element
 * @param {HTMLTextAreaElement} noteElement the note element
 * @returns {number} the listing id
 */
function getListingIdFromNote (noteElement) {
  const listingIdString = noteElement.dataset.listingId
  if (listingIdString === undefined) { console.error('no listing id found on', noteElement); return 0 } // eslint-disable-line no-console
  return Number.parseInt(listingIdString, 10)
}

/**
 * Return the note id from the given note element
 * @param {HTMLTextAreaElement} noteElement the note element
 * @returns {string} the note id
 */
function getNoteIdFromNote (noteElement) {
  const noteIdString = noteElement.dataset.noteId
  if (noteIdString === undefined) { console.error('no note id found on', noteElement); return '' } // eslint-disable-line no-console
  return noteIdString
}

/**
 * Clear all notes from local store
 * @param {function} clearStoreCallback the clear store function
 * @returns {HTMLButtonElement} the clear store button
 */
function getClearStoreButton (clearStoreCallback) {
  const button = document.createElement('button')
  button.textContent = 'Clear notes store'
  button.classList.add(...tw('fixed bottom-5 right-5 z-10 rounded-md border border-gray-400 bg-gray-100 px-2 py-1 opacity-30 transition-opacity duration-500 ease-in-out hover:opacity-100'))
  button.addEventListener('click', () => {
    if (!confirm('Are you sure you want to clear all notes ?')) return // eslint-disable-line no-alert, no-restricted-globals
    clearStoreCallback()
    window.location.reload()
  })
  return button
}

/**
 * Update note style
 * @param {HTMLTextAreaElement} noteElement the note element
 * @returns {void}
 */
function updateNoteStyle (noteElement) {
  const noteContent = noteElement.value
  noteElement.classList.toggle('bg-orange-100', noteContent.includes('Bof'))
  noteElement.classList.toggle('bg-red-100', noteContent.includes('Nope'))
}

// @ts-nocheck
// eslint-disable-next-line max-statements, sonarjs/cognitive-complexity
(function LeBonCoinNotes () {
  if (typeof window === 'undefined') return
  /* global Shuutils, tailwind, Appwrite, idbKeyval */
  // @ts-ignore
  const { get: getFromStore, set: setInStore, clear: clearStore } = idbKeyval
  // @ts-ignore
  tailwind.config = {
    corePlugins: {
      // eslint-disable-next-line @typescript-eslint/naming-convention
      preflight: false,
    },
  }
  /** @type {import('./utils.js').Shuutils} */
  // @ts-ignore
  const utils = new Shuutils({ id: 'lbc-nts', debug: true }) // eslint-disable-line @typescript-eslint/naming-convention
  const cls = {
    marker: `${utils.app.id}-processed`,
  }
  /* Init DB */
  // @ts-ignore
  const { Client, Query, Databases, ID } = Appwrite // eslint-disable-line @typescript-eslint/naming-convention
  const db = { // eslint-disable-line unicorn/prevent-abbreviations
    endpoint: 'https://cloud.appwrite.io/v1',
    project: localStorage.getItem('lbcNotes_project'),
    databaseId: localStorage.getItem('lbcNotes_databaseId'),
    notesCollectionId: localStorage.getItem('lbcNotes_notesCollectionId'),
  }
  if (!db.databaseId || !db.notesCollectionId) { utils.error('missing lbcNotes_databaseId or lbcNotes_notesCollectionId in localStorage'); return }
  const client = new Client()
  const databases = new Databases(client)
  client.setEndpoint(db.endpoint).setProject(db.project)
  /**
   * Save a note to local store
   * @param {LbcNote} note the note to save
   * @returns {void}
   */
  function saveNoteToStore (note) {
    utils.debug('save note to local store', note)
    setInStore(`lbcNotes_${note.listingId}`, note)
  }
  /**
   * Callback when a note is saved successfully
   * @param {LbcNote} note the note that was saved successfully
   * @param {HTMLTextAreaElement} noteElement the note element
   * @returns {void}
   */
  function saveNoteSuccess (note, noteElement) {
    saveNoteToStore(note)
    noteElement.dataset.noteId = note.noteId // eslint-disable-line no-param-reassign
    noteElement.classList.remove(...tw('bg-yellow-200'))
    noteElement.classList.add(...tw('bg-green-200'))
    setTimeout(() => { noteElement.classList.remove(...tw('bg-green-200')); updateNoteStyle(noteElement) }, 1000) // eslint-disable-line no-magic-numbers
  }
  /**
   * Callback when a note failed to save
   * @param {LbcNote} note the note that failed to save
   * @param {HTMLTextAreaElement} noteElement the note element
   * @param {Error} error the error that occurred
   * @returns {void}
   */
  function saveNoteFailure (note, noteElement, error) {
    utils.error(`failed to ${note.noteId ? 'update' : 'create'} note for listing ${note.listingId}`, error)
    noteElement.classList.remove(...tw('bg-yellow-200'))
    noteElement.classList.add(...tw('bg-red-200'))
  }
  /**
   * Save a note
   * @param {HTMLTextAreaElement} noteElement the note element
   * @returns {Promise<void>} a promise
   */
  async function saveNote (noteElement) {
    noteElement.classList.add(...tw('bg-yellow-200'))
    const noteContent = noteElement.value
    const noteId = getNoteIdFromNote(noteElement)
    const listingId = getListingIdFromNote(noteElement)
    utils.log(`${noteId ? 'update' : 'create'} note for listing ${listingId} with content : ${noteContent}`)
    try {
      const response = await (noteId ? databases.updateDocument(db.databaseId, db.notesCollectionId, noteId, { note: noteContent }) : databases.createDocument(db.databaseId, db.notesCollectionId, ID.unique(), { listingId, note: noteContent })) // eslint-disable-line putout/putout
      saveNoteSuccess({ noteId: response.$id, listingId, noteContent }, noteElement) /* @ts-ignore */
    } catch (/** @type Error */ error) { saveNoteFailure({ noteId: '', listingId, noteContent }, noteElement, error) }
  }
  const saveNoteDebounced = utils.debounce(saveNote, 2000) // eslint-disable-line no-magic-numbers
  /**
   * Load a note from AppWrite
   * @param {number} listingId the listing id
   * @returns {Promise<LbcNote>} a promise
   */
  async function loadNoteFromAppWrite (listingId) {
    const notesByListingId = await databases.listDocuments(db.databaseId, db.notesCollectionId, [Query.equal('listingId', listingId)])
    const [first] = notesByListingId.documents
    const note = { listingId, noteContent: first?.note || '', noteId: first?.$id || '' }
    utils.debug(`loaded note for listing ${listingId} from AppWrite`, { first, note })
    saveNoteToStore(note)
    return note
  }
  /**
   * Load a note from local store
   * @param {number} listingId the listing id
   * @returns {Promise<LbcNote>} a promise
   */
  async function loadNoteFromLocalStore (listingId) {
    const note = await getFromStore(`lbcNotes_${listingId}`)
    if (note) utils.debug(`loaded note for listing ${listingId} from local store`)
    return note
  }
  /**
   * Load a note
   * @param {HTMLTextAreaElement} noteElement the note element
   * @returns {Promise<void>} a promise
   */
  async function loadNote (noteElement) {
    const listingId = getListingIdFromNote(noteElement)
    utils.log(`loading note for listing ${listingId}`)
    const { noteId, noteContent } = await loadNoteFromLocalStore(listingId) ?? await loadNoteFromAppWrite(listingId)
    noteElement.dataset.noteId = noteId // eslint-disable-line require-atomic-updates, no-param-reassign
    noteElement.textContent = noteContent // eslint-disable-line require-atomic-updates, no-param-reassign
    noteElement.classList.add(...tw('h-56 w-96'))
    noteElement.disabled = false // eslint-disable-line no-param-reassign
    updateNoteStyle(noteElement)
  }
  /**
   * Create a note element
   * @param {number} listingId the listing id
   * @returns {HTMLTextAreaElement} the note element
   */
  function createNoteElement (listingId) {
    const note = document.createElement('textarea')
    note.id = `${utils.app.id}--note`
    note.placeholder = 'Add a note...'
    note.dataset.listingId = listingId.toString()
    note.classList.add(...tw('z-10 h-8 w-16 rounded-md border border-gray-400 bg-gray-100 p-2 transition-all duration-500 ease-in-out'))
    note.addEventListener('keyup', () => saveNoteDebounced(note)) // keypress will not detect backspace
    note.textContent = 'Loading...'
    note.disabled = true
    void loadNote(note)
    return note
  }
  /**
   * Add a note to a listing
   * @param {HTMLAnchorElement} listingElement the listing element
   * @param {number} listingId the listing id
   * @returns {void}
   */
  function addNoteToListing (listingElement, listingId) {
    utils.log('addNotesToListing', listingId)
    const note = createNoteElement(listingId)
    listingElement.parentElement?.classList.add(...tw('relative'))
    listingElement.parentElement?.append(note)
    note.classList.add(...tw('absolute top-0 translate-x-[350%]'))
  }
  function addNotesToListings () {
    utils.log('addNotesToList')
    /** @type HTMLAnchorElement[] */
    // @ts-ignore
    const listings = utils.findAll(`a[data-test-id="ad"]:not(.${cls.marker})`)
    for (const listing of listings) {
      listing.classList.add(cls.marker)
      const listingId = getListingId(listing.href)
      if (listingId === undefined) utils.error('no listing id found for', listing)
      else addNoteToListing(listing, listingId)
    }
  }
  /**
   * Add a note to the current page
   * @param {number} listingId the listing id
   * @returns {void}
   */
  function addNoteToPage (listingId) {
    utils.log('addNotesToPage', listingId)
    const note = createNoteElement(listingId)
    note.classList.add(...tw('fixed right-5 top-56'))
    document.body.append(note)
  }
  function process () {
    if (document.body.classList.contains(cls.marker)) return
    document.body.classList.add(cls.marker)
    const id = getListingId()
    if (id === undefined) addNotesToListings()
    else addNoteToPage(id)
    document.body.append(getClearStoreButton(clearStore))
  }
  const processDebounced = utils.debounce(process, 300) // eslint-disable-line no-magic-numbers
  window.addEventListener('scroll', () => processDebounced())
  window.addEventListener('load', () => processDebounced())
  void utils.onPageChange(processDebounced)
})()

// eslint-disable-next-line no-undef, putout/putout
if (module) module.exports = {
  getListingId
}
