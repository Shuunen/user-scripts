// ==UserScript==
// @name         LeBonCoin Notes
// @namespace    https://github.com/Shuunen
// @description  Add notes to LeBonCoin listings
// @author       Romain Racamier-Lafon
// @match        https://www.leboncoin.fr/*
// @grant        GM_addStyle
// @require      https://cdn.jsdelivr.net/gh/Shuunen/user-scripts@master/src/utils.js
// @require      https://cdn.jsdelivr.net/npm/appwrite@10.1.0
// @require      https://cdn.jsdelivr.net/npm/idb-keyval@6/dist/umd.js
// @require      https://cdn.tailwindcss.com
// @version      0.0.4
// ==/UserScript==

'use strict'

const config = {
  averageNote: {
    class: 'bg-yellow-200',
    isDisplayed: false,
    keyword: 'Bof',
  },
  badNote: {
    class: 'bg-red-200',
    isDisplayed: false,
    keyword: 'Nope',
  },
  loading: {
    class: 'loading',
  },
  normalNote: {
    class: 'bg-gray-100',
    isDisplayed: true,
  }
}

/**
 * @typedef {import('./lbc.types').IdbKeyvalGetter<LbcNote>} IdbKeyvalNoteGetter
 */

/**
  @typedef LbcNote
  @type {Object}
  @property {string} noteId the note id in AppWrite
  @property {number} listingId the listing id in LeBonCoin
  @property {string} noteContent the note content
 */

/**
 * Return the listing id from the given url
 * @param {string} url the url to parse
 * @returns {number|undefined} the listing id
 */
function getListingId (url = document.location.href) {
  const id = /\/(?<id>\d{5,15})\b/u.exec(url)?.groups?.id
  return id ? Number.parseInt(id, 10) : undefined
}

/**
 * Return true if multiple ads are shown on the current page
 * @returns {boolean} true if multiple ads are shown on the current page
 */
function multipleAdDisplayed () {
  return getListingId() === undefined
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

// @ts-nocheck
// eslint-disable-next-line max-statements, sonarjs/cognitive-complexity
(function LeBonCoinNotes () {
  if (typeof window === 'undefined') return
  /* global Shuutils, tailwind, Appwrite, idbKeyval, GM_addStyle */
  /** @type {{get: IdbKeyvalNoteGetter, set: function, clear: function}} */ // @ts-ignore
  const { clear: clearStore, get: getNoteFromStore, set: setInStore } = idbKeyval
  // @ts-ignore
  tailwind.config = {
    corePlugins: {
      // eslint-disable-next-line @typescript-eslint/naming-convention
      preflight: false,
    },
  }
  /** @type {import('./utils.js').Shuutils} */
  // @ts-ignore
  const utils = new Shuutils({ debug: false, id: 'lbc-nts' }) // eslint-disable-line @typescript-eslint/naming-convention
  // Remove me one day :)
  // eslint-disable-next-line @typescript-eslint/unbound-method
  utils.tw ||= (classes) => classes.split(' ')
  const cls = {
    marker: `${utils.app.id}-processed`,
  }
  /* Init DB */
  // @ts-ignore
  const { Client, Databases, ID, Query } = Appwrite // eslint-disable-line @typescript-eslint/naming-convention
  const db = { // eslint-disable-line unicorn/prevent-abbreviations
    databaseId: localStorage.getItem('lbcNotes_databaseId'),
    endpoint: 'https://cloud.appwrite.io/v1',
    notesCollectionId: localStorage.getItem('lbcNotes_notesCollectionId'),
    project: localStorage.getItem('lbcNotes_project'),
  }
  if (!db.databaseId || !db.notesCollectionId) { utils.error('missing lbcNotes_databaseId or lbcNotes_notesCollectionId in localStorage'); return }
  const client = new Client()
  const databases = new Databases(client)
  client.setEndpoint(db.endpoint).setProject(db.project)

  /**
   * Clear all notes from local store
   * @param {function} clearStoreCallback the clear store function
   * @returns {HTMLButtonElement} the clear store button
   */
  function getClearStoreButton (clearStoreCallback) {
    const button = document.createElement('button')
    button.textContent = 'Clear notes store'
    button.classList.add(...utils.tw('fixed bottom-5 right-5 z-10 rounded-md border border-gray-600 bg-gray-100 px-2 py-1 opacity-30 transition-all duration-500 ease-in-out hover:opacity-100'))
    button.addEventListener('click', () => {
      if (!confirm('Are you sure you want to clear all notes ?')) return // eslint-disable-line no-alert, no-restricted-globals
      clearStoreCallback()
      window.location.reload()
    })
    return button
  }

  /**
   * Hide the ad element
   * @param {Element?} element the element to hide
   * @param {string} cause the cause of the hide
   * @param {boolean} willHide true if the hide is active
   * @returns {void}
   */
  function hideAdElement (element, cause = 'unknown', willHide = true) {
    const id = 'lbc-nts'
    if (!element) throw new Error(`no element to hide for cause "${cause}"`)
    element.classList.add(...utils.tw('overflow-hidden transition-all duration-500 ease-in-out hover:h-[215px] hover:opacity-100 hover:filter-none'))
    element.classList.toggle('h-24', willHide)
    element.classList.toggle('grayscale', willHide)
    element.classList.toggle('opacity-50', willHide)
    element.parentElement?.classList.toggle(`${id}-hidden`, willHide)
    element.parentElement?.classList.toggle(`${id}-hidden-cause-${cause}`, willHide)
  }

  /**
   * Update note style
   * @param {HTMLTextAreaElement} noteElement the note element
   * @returns {void}
   */
  function updateNoteStyle (noteElement) {
    const noteContent = noteElement.value
    const isAverage = noteContent.includes(config.averageNote.keyword)
    const isBad = noteContent.includes(config.badNote.keyword)
    noteElement.classList.toggle(config.averageNote.class, isAverage)
    noteElement.classList.toggle(config.badNote.class, isBad)
    if (!multipleAdDisplayed()) return
    if (!config.averageNote.isDisplayed) hideAdElement(noteElement.previousElementSibling, 'average-keyword', isAverage)
    if (isBad && !config.badNote.isDisplayed) hideAdElement(noteElement.previousElementSibling, 'bad-keyword')
  }

  /**
   * Save a note to local store
   * @param {LbcNote} note the note to save
   * @returns {void}
   */
  function saveNoteToStore (note) {
    if (note.noteContent === '') return
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
    noteElement.classList.remove(config.loading.class)
    noteElement.classList.add(...utils.tw('bg-green-200'))
    setTimeout(() => { noteElement.classList.remove(...utils.tw('bg-green-200')); updateNoteStyle(noteElement) }, 1000) // eslint-disable-line no-magic-numbers
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
    noteElement.classList.remove(config.loading.class)
    noteElement.classList.add(...utils.tw('border-4 border-red-500'))
  }
  /**
   * Save a note
   * @param {HTMLTextAreaElement} noteElement the note element
   * @returns {Promise<void>} a promise
   */
  async function saveNote (noteElement) {
    noteElement.classList.add(config.loading.class)
    const noteContent = noteElement.value
    const noteId = getNoteIdFromNote(noteElement)
    const listingId = getListingIdFromNote(noteElement)
    utils.log(`${noteId ? 'update' : 'create'} note for listing ${listingId} with content : ${noteContent}`)
    try {
      const response = await (noteId ? databases.updateDocument(db.databaseId, db.notesCollectionId, noteId, { note: noteContent }) : databases.createDocument(db.databaseId, db.notesCollectionId, ID.unique(), { listingId, note: noteContent }))
      saveNoteSuccess({ listingId, noteContent, noteId: response.$id }, noteElement)
      updateNoteStyle(noteElement) /* @ts-ignore */
    } catch (/** @type Error */ error) { saveNoteFailure({ listingId, noteContent, noteId: '' }, noteElement, error) }
  }
  const saveNoteDebounced = utils.debounce(saveNote, 2000) // eslint-disable-line no-magic-numbers

  /**
   * Load a note from AppWrite
   * @param {number} listingId the listing id
   * @returns {Promise<LbcNote>} a promise
   */
  async function loadNoteFromAppWrite (listingId) {
    const notesByListingId = await databases.listDocuments(db.databaseId, db.notesCollectionId, [Query.equal('listingId', listingId)])
    /** @type [{ note: string; $id: string } | undefined] */
    const [first] = notesByListingId.documents
    const note = { listingId, noteContent: first?.note || '', noteId: first?.$id || '' }
    if (note) utils.debug(`loaded note for listing ${listingId} from AppWrite`, note)
    else utils.debug(`no note found for listing ${listingId} in AppWrite`)
    saveNoteToStore(note)
    return note
  }

  /**
   * Load a note from local store
   * @param {number} listingId the listing id
   * @returns {Promise<LbcNote|undefined>} a promise
   */
  async function loadNoteFromLocalStore (listingId) {
    const note = await getNoteFromStore(`lbcNotes_${listingId}`)
    utils.debug(`${note?.noteId ? 'loaded note' : 'found no note'} for listing ${listingId} from local store :`, note)
    return note?.noteId ? note : undefined
  }

  /**
   * Load a note
   * @param {HTMLTextAreaElement} noteElement the note element
   * @returns {Promise<void>} a promise
   */
  async function loadNote (noteElement) {
    const listingId = getListingIdFromNote(noteElement)
    utils.debug(`loading note for listing ${listingId}...`)
    const { noteContent, noteId } = await loadNoteFromLocalStore(listingId) ?? await loadNoteFromAppWrite(listingId)
    noteElement.dataset.noteId = noteId // eslint-disable-line require-atomic-updates, no-param-reassign
    noteElement.textContent = noteContent // eslint-disable-line require-atomic-updates, no-param-reassign
    noteElement.classList.add(...utils.tw('h-56 w-96'))
    noteElement.classList.remove(config.loading.class)
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
    note.placeholder = 'Add a note...'
    note.dataset.listingId = listingId.toString()
    note.classList.add(`${utils.app.id}--note`, config.loading.class, ...utils.tw('z-10 h-8 w-16 rounded-md border border-gray-400 bg-gray-100 p-2 transition-all duration-500 ease-in-out hover:z-20'))
    note.addEventListener('keyup', () => saveNoteDebounced(note)) // keypress will not detect backspace
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
    utils.debug('add the note to listing', listingId)
    const note = createNoteElement(listingId)
    listingElement.parentElement?.classList.add(...utils.tw('relative'))
    listingElement.parentElement?.append(note)
    note.classList.add(...utils.tw('absolute top-0 translate-x-[350%]'))
  }
  function addNotesToListings () {
    utils.log('add note to each listing')
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
    utils.log('addNoteToPage', listingId)
    const note = createNoteElement(listingId)
    note.classList.add(...utils.tw('fixed right-5 top-56'))
    document.body.append(note)
  }
  let isProcessing = false
  /**
   * Start the process
   * @param {string} reason the reason to process
   * @returns {void}
   */
  function process (reason = 'unknown') {
    if (isProcessing) return
    isProcessing = true
    utils.log('process cause :', reason)
    const id = getListingId()
    if (id) addNoteToPage(id)
    else addNotesToListings()
    document.body.append(getClearStoreButton(clearStore))
  }
  // @ts-ignore
  // eslint-disable-next-line new-cap
  GM_addStyle(`
    .${utils.app.id}--note.loading {
      background: linear-gradient(-45deg, #ee7752, #e73c7e, #23a6d5, #23d5ab);
      background-size: 400% 400%;
      animation: gradient 5s ease infinite;
    }
    @keyframes gradient {
      0% {
        background-position: 0% 50%;
      }
      50% {
        background-position: 100% 50%;
      }
      100% {
        background-position: 0% 50%;
      }
    }
    .${utils.app.id}-hidden .${utils.app.id}--note,
    .lbc-lpp-hidden .${utils.app.id}--note {
      max-height: 60px;
    }
    .${utils.app.id}-hidden .${utils.app.id}--note:hover,
    .lbc-lpp-hidden .${utils.app.id}--note:hover {
      max-height: 140px;
    }
  `)
  const processDebounced = utils.debounce(process, 300) // eslint-disable-line no-magic-numbers
  window.addEventListener('scroll', () => processDebounced('scroll-event'))
  window.addEventListener('load', () => processDebounced('load-event'))
  void utils.onPageChange(() => processDebounced('page-change-event'))
})()

// eslint-disable-next-line no-undef
if (module) module.exports = { getListingId }
