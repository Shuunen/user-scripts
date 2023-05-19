// ==UserScript==
// @name        LeBonCoin Notes
// @namespace   https://github.com/Shuunen
// @description Add notes to LeBonCoin listings
// @author      Romain Racamier-Lafon
// @match       https://www.leboncoin.fr/*
// @grant       none
// @require     https://raw.githubusercontent.com/Shuunen/user-scripts/master/src/utils.js
// @require     https://cdn.jsdelivr.net/npm/appwrite@10.1.0
// @require     https://cdn.tailwindcss.com
// @version     0.0.2
// ==/UserScript==

'use strict'

/**
 * A fake function to enable tailwindcss intellisense
 * @param {string} classes the string to translate
 * @returns {string} the translated string
 */
function tw (classes) { return classes }

/**
 * Return the listing id from the given url
 * @param {string} url the url to parse
 * @returns {number|undefined} the listing id
 */
function getListingId (url = document.location.href) {
  const id = /(?<id>\d{5,15})\.htm/u.exec(url)?.groups?.id
  return id ? Number.parseInt(id, 10) : undefined
}

// @ts-nocheck
// eslint-disable-next-line max-statements, sonarjs/cognitive-complexity
(function LeBonCoinNotes () {
  /* global Shuutils, tailwind, Appwrite */
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
    activeNoteId: '',
  }
  if (!db.databaseId || !db.notesCollectionId) { utils.error('missing lbcNotes_databaseId or lbcNotes_notesCollectionId in localStorage'); return }
  const client = new Client()
  const databases = new Databases(client)
  client.setEndpoint(db.endpoint).setProject(db.project)

  /**
   * Save a note
   * @param {number} listingId the listing id
   * @param {HTMLTextAreaElement} noteElement the note element
   * @returns {Promise<void>} a promise
   */
  async function saveNote (listingId, noteElement) {
    const note = noteElement.value
    const noteId = db.activeNoteId
    utils.log(`${noteId ? 'update' : 'create'} note for listing ${listingId} with content : ${note}`)
    try {
      const response = await (noteId ? databases.updateDocument(db.databaseId, db.notesCollectionId, noteId, { note }) : databases.createDocument(db.databaseId, db.notesCollectionId, ID.unique(), { listingId, note })) // eslint-disable-line putout/putout
      db.activeNoteId = response.$id // eslint-disable-line require-atomic-updates
    } catch (error) {
      utils.error(`failed to ${noteId ? 'update' : 'create'} note for listing ${listingId}`, error)
    }
  }
  // eslint-disable-next-line no-magic-numbers
  const saveNoteDebounced = utils.debounce(saveNote, 500)
  /**
   * Load a note from storage
   * @param {number} listingId the listing id
   * @returns {Promise<string>} the note content for the given listing
   */
  async function loadNote (listingId) {
    utils.log(`loading note for listing ${listingId}`)
    const notesByListingId = await databases.listDocuments(db.databaseId, db.notesCollectionId, [Query.equal('listingId', getListingId())])
    const [first] = notesByListingId.documents
    db.activeNoteId = first?.$id || '' // eslint-disable-line require-atomic-updates
    return first?.note || ''
  }
  /**
   * Create a note element
   * @param {number} listingId the listing id
   * @returns {HTMLTextAreaElement} the note element
   */
  function createNoteElement (listingId) {
    const note = document.createElement('textarea')
    note.className = tw('fixed right-5 top-56 z-10 h-56  w-96 rounded-md border border-gray-400 bg-gray-100 px-2 py-1') // eslint-disable-line unicorn/no-keyword-prefix
    note.addEventListener('keypress', () => saveNoteDebounced(listingId, note))
    note.textContent = 'Loading...'
    void loadNote(listingId).then((content) => { note.textContent = content }) // eslint-disable-line promise/always-return, promise/prefer-await-to-then
    return note
  }
  function addNotesToList () {
    utils.log('addNotesToList')
  }
  /**
   * Add a note to the current page
   * @param {number} listingId the listing id
   * @returns {void}
   */
  function addNoteToPage (listingId) {
    utils.log('addNotesToPage', listingId)
    const note = createNoteElement(listingId)
    document.body.append(note)
  }
  function process () {
    if (document.body.classList.contains(cls.marker)) return
    document.body.classList.add(cls.marker)
    const id = getListingId()
    if (id === undefined) addNotesToList()
    else addNoteToPage(id)
  }
  const processDebounced = utils.debounce(process, 300) // eslint-disable-line no-magic-numbers
  window.addEventListener('scroll', () => processDebounced())
  window.addEventListener('load', () => processDebounced())
  void utils.onPageChange(processDebounced)
})()
