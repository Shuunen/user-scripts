/* eslint-disable no-console */
/* eslint-disable promise/avoid-new */
/* eslint-disable sonarjs/elseif-without-else */
// @ts-nocheck

class Shuutils {
  constructor (app) {
    Object.apply(app, { id: 'shu-app', debug: true })
    this.app = app
    this.version = '1.4.1'
    if (this.debug) this.log('using Shuutils', this.version)
  }

  debug (...stuff) {
    if (!this.app.debug) return
    stuff.unshift(`${this.app.id} :`)
    console.log(...stuff)
  }

  log (...stuff) {
    stuff.unshift(`${this.app.id} :`)
    console.log(...stuff)
  }

  warn (...stuff) {
    stuff.unshift(`${this.app.id} :`)
    console.warn(...stuff)
  }

  error (...stuff) {
    stuff.unshift(`${this.app.id} :`)
    console.error(...stuff)
  }

  readableString (string) {
    return string
      .trim().replace(/['’_.-]/gu, ' ').normalize('NFD').replace(/[^\d\sa-z]/giu, '').replace(/\s{2,}/gu, ' ') // from shuutils sanitize
      // eslint-disable-next-line regexp/no-super-linear-move
      .replace(/<.+?>/gu, ' ') // remove content in tags
      .replace(/\W/gu, ' ') // remove non words
      .replace(/\s+/gu, ' ') // replace spaces with single space
      .trim() // final trim
  }

  ellipsisWords (stringIn = '', maxWords = 5) {
    const stringOut = stringIn.split(' ').splice(0, maxWords).join(' ')
    if (stringOut === stringIn) return stringIn
    return `${stringOut}...`
  }

  ellipsis (stringIn = '', maxLength = 50) {
    const stringOut = stringIn.slice(0, maxLength)
    if (stringOut === stringIn) return stringIn
    return `${stringOut}...`
  }

  debounce (callback, waitFor) {
    // eslint-disable-next-line init-declarations
    let timeout
    return (...parameters) => new Promise((resolve) => {
      clearTimeout(timeout)
      timeout = setTimeout(() => {
        resolve(callback(...parameters))
      }, waitFor)
    })
  }

  throttle (callback, timeout) {
    let ready = true
    return (...parameters) => {
      if (!ready) return
      ready = false
      callback(...parameters)
      setTimeout(() => {
        ready = true
      }, timeout)
    }
  }

  findOne (selector, context, dontYell) {
    const scope = context || document
    const item = scope.querySelector(selector)
    if (item && this.app.debug) this.log(`found element matching "${selector}"`)
    else if (!item && !dontYell) this.warn(`found no element for selector "${selector}"`)
    return item
  }

  findFirst (selector, context, dontYell) {
    return this.findAll(selector, context, dontYell)[0]
  }

  findAll (selector, context, dontYell) {
    if (!selector || selector.length === 0 || selector.length === 1) this.error('incorrect selector : ', selector)
    const scope = context || document
    const items = Array.prototype.slice.call(scope.querySelectorAll(selector))
    if (items.length > 0 && this.app.debug) this.log('found', items.length, `elements matching "${selector}"`)
    else if (items.length <= 0 && !dontYell) this.warn(`found no elements for selector "${selector}"`)
    return items
  }

  sleep (ms) {
    return new Promise(resolve => {
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
    return this.waitToDetect(selector, wait, nbTries + 1)
  }

  copyToClipboard (stuff) {
    const element = document.createElement('textarea')
    const text = typeof stuff === 'string' ? stuff : JSON.stringify(stuff)
    this.log(`copying to clipboard : ${this.ellipsis(text)}`)
    element.value = text
    document.body.append(element)
    element.select()
    document.execCommand('copy')
    element.remove()
  }

  async readClipboard () {
    this.log('reading clipboard...')
    const text = await navigator.clipboard.readText()
    this.log(`got this text from clipboard : ${this.ellipsis(text)}`)
    return text
  }

  async onPageChange (callback = () => { console.log('empty callback') }, last = '', wait = 1000) {
    await this.sleep(wait)
    const current = document.location.href
    if (current !== last) callback(current)
    this.onPageChange(callback, current, wait)
  }
}

// eslint-disable-next-line no-undef
if (module) module.exports = {
  Shuutils,
}
