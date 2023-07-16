/* eslint-disable userscripts/filename-user */
/* eslint-disable userscripts/no-invalid-metadata */
/* eslint-disable no-console */
/* eslint-disable promise/avoid-new */
/* eslint-disable sonarjs/elseif-without-else */
// @ts-nocheck

'use strict'

class Shuutils {

  version = '2.1.1'

  /**
   * The ShuUserScriptUtils constructor
   * @param {object} app the user script app infos
   * @param {string} app.id the user script id/name/marker like "lbc-dpe", "amz-aio"
   * @param {boolean} app.debug if true, will log more stuff
   * @returns {Shuutils} the Shuutils instance
   * @example const utils = new Shuutils({ id: 'lbc-dpe', debug: true })
   */
  constructor (app) {
    // eslint-disable-next-line @typescript-eslint/naming-convention
    Object.apply(app, { debug: true, id: 'shu-app' })
    this.app = app
    if (this.debug) this.log('using Shuutils', this.version)
  }

  /**
   * Console.log stuff with app id if debug is true
   * @param  {...any} stuff the stuff to log
   * @returns {void}
   * @example utils.debug('hello', 'world')
   */
  debug (...stuff) {
    if (!this.app.debug) return
    stuff.unshift(`${this.app.id} :`)
    console.log(...stuff)
  }

  /**
   * Console.log stuff with app id
   * @param  {...any} stuff the stuff to log
   * @returns {void}
   */
  log (...stuff) {
    stuff.unshift(`${this.app.id} :`)
    console.log(...stuff)
  }

  /**
   * Console.warn stuff with app id
   * @param  {...any} stuff the stuff to log
   * @returns {void}
   */
  warn (...stuff) {
    stuff.unshift(`${this.app.id} :`)
    console.warn(...stuff)
  }

  /**
   * Console.error stuff with app id
   * @param  {...any} stuff the stuff to log
   * @returns {void}
   * @example utils.error('hello', 'world')
   */
  error (...stuff) {
    stuff.unshift(`${this.app.id} :`)
    console.error(...stuff)
  }

  /**
   * Make a string more readable for humans
   * @param {string} string the string to sanitize
   * @returns {string} the sanitized string
   * @example utils.readableString('hello_world') // returns 'hello world'
   */
  readableString (string) {
    return string
      .trim().replace(/['’_.-]/gu, ' ').normalize('NFD').replace(/[^\d\sa-z]/giu, '').replace(/\s{2,}/gu, ' ') // from shuutils sanitize
      // eslint-disable-next-line regexp/no-super-linear-move
      .replace(/<.+?>/gu, ' ') // remove content in tags
      .replace(/\W/gu, ' ') // remove non words
      .replace(/\s+/gu, ' ') // replace spaces with single space
      .trim() // final trim
  }

  /**
   * Ellipsis a string to a given number of words
   * @param {string} stringIn the string to ellipsis
   * @param {number} maxWords the number of words to keep
   * @returns {string} the string shortened or not
   * @example utils.ellipsisWords('hello world', 1) // returns 'hello...'
   * @example utils.ellipsisWords('hello world', 2) // returns 'hello world'
   */
  ellipsisWords (stringIn = '', maxWords = 5) {
    const stringOut = stringIn.split(' ').splice(0, maxWords).join(' ')
    if (stringOut === stringIn) return stringIn
    return `${stringOut}...`
  }

  /**
   * Ellipsis a string to a given number of characters
   * @param {string} stringIn the string to ellipsis
   * @param {number} maxLength the number of characters to keep
   * @returns {string} the string shortened or not
   * @example utils.ellipsis('hello world', 5) // returns 'hello...'
   * @example utils.ellipsis('hello world', 11) // returns 'hello world'
   */
  ellipsis (stringIn = '', maxLength = 50) {
    const stringOut = stringIn.slice(0, maxLength)
    if (stringOut === stringIn) return stringIn
    return `${stringOut}...`
  }

  /**
   * Debounce a function
   * @param {function} callback the function to debounce
   * @param {number} waitFor the time to wait before calling the function
   * @returns {function} the debounced function
   * @example const debounced = utils.debounce(() => { console.log('hello world') }, 1000)
   * @example const debounced = utils.debounce(myFunction, 500)
   */
  debounce (callback, waitFor) {
    // eslint-disable-next-line init-declarations
    let timeout
    return async (...parameters) => await new Promise((resolve) => {
      clearTimeout(timeout)
      timeout = setTimeout(() => {
        resolve(callback(...parameters))
      }, waitFor)
    })
  }

  /**
   * Throttle a function
   * @param {function} callback the function to throttle
   * @param {number} timeout the time to wait before calling the function again
   * @returns {function} the throttled function
   * @example const throttled = utils.throttle(() => { console.log('hello world') }, 1000)
   * @example const throttled = utils.throttle(myFunction, 500)
   */
  throttle (callback, timeout) {
    let isReady = true
    return (...parameters) => {
      if (!isReady) return
      isReady = false
      callback(...parameters)
      setTimeout(() => {
        isReady = true
      }, timeout)
    }
  }

  /**
   * Find the first element in the DOM
   * @param {string} selector the css selector to find
   * @param {HTMLElement|Document} scope the context to search in
   * @param {boolean} canFail if true, will not log a warning if not found
   * @returns {HTMLElement|undefined} the element found or undefined
   * @example utils.findOne('div') // returns the first div found
   */
  findOne (selector, scope = document, canFail = false) {
    return this.findAll(selector, scope, canFail)[0]
  }

  /**
 * Find the first element in the DOM
 * @param {string} selector the css selector to find
 * @param {HTMLElement|Document} scope the context to search in
 * @param {boolean} canFail if true, will not log a warning if not found
 * @returns {HTMLElement|undefined} the element found or undefined
 * @example utils.findFirst('div') // returns the first div found
 */
  findFirst (selector, scope = document, canFail = false) {
    return this.findAll(selector, scope, canFail)[0]
  }

  /**
   * Find all elements in the DOM
   * @param {string} selector the css selector to find
   * @param {HTMLElement|Document} scope the scope/context to search in
   * @param {boolean} canFail if true, will not log a warning if not found
   * @returns {HTMLElement[]} the elements found
   * @example utils.findAll('div') // returns all div found
   * @example utils.findAll('.not-exits') // returns an empty array
   */
  findAll (selector, scope = document, canFail = false) {
    if (!selector || selector.length === 0 || selector.length === 1) this.error('incorrect selector : ', selector)
    const items = Array.prototype.slice.call(scope.querySelectorAll(selector))
    if (items.length > 0 && this.app.debug) this.log('found', items.length, `elements matching "${selector}"`)
    else if (items.length <= 0 && !canFail) this.warn(`found no elements for selector "${selector}"`)
    return items
  }

  /**
     * Get a random number between min and max
     * @param {number} min the minimum number
     * @param {number} max the maximum number
     * @returns {number} the random number
     * @example utils.getRandomNumber(0, 100) // returns a number between 0 and 100
     */
  getRandomNumber (min = 0, max = 100) {
    return Math.floor(Math.random() * (max - min + 1) + min)
  }

  /**
     * Enable tailwindcss intellisense and return an array of classes
     * @param {string} classes the classes to split, e.g. 'h-56 w-96 rounded-md'
     * @returns {string[]} the array of classes, e.g. ['h-56', 'w-96', 'rounded-md']
     */
  tw (classes) { return classes.split(' ') }

  /**
   * Copy data to the clipboard
   * @param {string} stuff the data to copy
   * @returns {Promise<void>} nothing
   * @example await utils.copyToClipboard('hello world') // copies 'hello world' to the clipboard
   */
  async copyToClipboard (stuff) {
    const text = typeof stuff === 'string' ? stuff : JSON.stringify(stuff)
    console.log(`copying to clipboard : ${this.ellipsis(text)}`)
    await navigator.clipboard.writeText(text)
  }

  /**
   * Sleep for a given time
   * @param {number} ms the time to sleep in ms
   * @returns {Promise<void>} nothing
   * @example await utils.sleep(1000) // sleep for 1 second
   */
  async sleep (ms) {
    await new Promise(resolve => {
      setTimeout(resolve, ms)
    })
  }

  /**
   * WaitToDetect will wait for an element to be detected in the DOM and return it
   * @param {string} selector the css selector to detect
   * @param {number} wait in ms, the time to wait between each try
   * @param {number} nbTries the number of tries already done, don't use it
   * @returns {Promise<HTMLElement|undefined>} the element found or undefined
   */
  async waitToDetect (selector, wait = 500, nbTries = 0) {
    await this.sleep(wait)
    const element = this.findOne(selector)
    if (element) return element
    if (nbTries > 5) { this.log(`stop searching after 5 fails to detect : "${selector}"`); return undefined } // eslint-disable-line unicorn/no-useless-undefined, no-magic-numbers
    return await this.waitToDetect(selector, wait, nbTries + 1)
  }

  /**
   * Read clipboard content
   * @returns {Promise<string>} the clipboard content
   * @example const text = await utils.readClipboard()
   */
  async readClipboard () {
    this.log('reading clipboard...')
    const text = await navigator.clipboard.readText()
    this.log(`got this text from clipboard : ${this.ellipsis(text)}`)
    return text
  }

  /**
   * Wait for location.href to change and call a callback
   * @param {function} callback the callback to call when location.href changes
   * @param {string} last the last location.href, don't use it
   * @param {number} wait the time to wait between each try
   * @returns {Promise<void>} nothing
   * @example utils.onPageChange((url) => { console.log('new url :', url) })
   */
  async onPageChange (callback = () => { console.log('empty callback') }, last = '', wait = 1000) {
    await this.sleep(wait)
    const current = document.location.href
    if (current !== last) callback(current)
    void this.onPageChange(callback, current, wait)
  }

  /**
   * Fill an input like a human would do
   * @param {HTMLInputElement} input the input to fill
   * @param {string} value the value to fill
   * @returns {Promise<void>} nothing
   * @example await utils.fillLikeHuman(input, 'hello world')
   */
  async fillLikeHuman (input, value) {
    this.debug('fillLikeHuman', input, value)
    input.focus()
    for (const char of value) {
      input.value += char // eslint-disable-line no-param-reassign
      await this.sleep(this.getRandomNumber(40, 80)) // eslint-disable-line no-await-in-loop, no-magic-numbers
    }
    input.dispatchEvent(new Event('input', { bubbles: true })) // eslint-disable-line @typescript-eslint/naming-convention
    input.dispatchEvent(new Event('change', { bubbles: true })) // eslint-disable-line @typescript-eslint/naming-convention
    input.dispatchEvent(new Event('blur', { bubbles: true })) // eslint-disable-line @typescript-eslint/naming-convention
    input.blur()
  }
}

// eslint-disable-next-line no-undef, putout/putout
if (module) module.exports = {
  // eslint-disable-next-line @typescript-eslint/naming-convention
  Shuutils,
}
