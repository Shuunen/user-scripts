
/* eslint-disable class-methods-use-this */
/* eslint-disable no-magic-numbers */

/**
 * Collection of utility functions to help with common tasks in my user scripts.
 */
// eslint-disable-next-line no-restricted-syntax
class Shuutils {
  id = ''
  version = '2.6.4'
  willDebug = false
  /**
   * The ShuUserScriptUtils constructor
   * @param {string} id the user script id/name/marker like "lbc-dpe", "amz-aio"
   * @param {boolean} willDebug if true, will log more stuff
   * @example const utils = new Shuutils('lbc-dpe', true)
   */
  constructor(id = 'shu-app', willDebug = false) {
    this.id = id
    this.willDebug = willDebug
    this.debug('using Shuutils', this.version)
  }
  /**
   * Adds a toast notification to the document body.
   * @param {'success'|'error'} type - The type of the toast notification.
   * @param {string} message - The message to be displayed in the toast notification.
   * @param {number} delay - The delay in milliseconds before the toast notification is removed.
   * @param {number} padding - The padding in pixels between the toast and the bottom of the window.
   * @example utils.#toastAdd('error', 'hello world', 4000, 20)
   */
  // eslint-disable-next-line max-params, max-statements
  #toastAdd (type, message, delay = 0, padding = 14) {
    const element = document.createElement('div')
    element.setAttribute('class', 'shu-toast')
    const last = document.querySelector('.shu-toast:nth-last-child(1 of .shu-toast)')?.getBoundingClientRect().top
    const bottom = last === undefined ? 0 : globalThis.innerHeight - last
    const backgrounds = type === 'success' ? ['MediumSeaGreen', 'SeaGreen'] : ['FireBrick', 'Brown']
    const icon = type === 'success' ? '&check;' : '&cross;'
    const iconStyle = type === 'success' ? 'line-height: 21px; text-indent: 1px;' : 'line-height: 21.5px;' // @ts-expect-error it works (๑◕ܫ◕๑)
    element.style = `position: fixed; display: flex; align-items: center; gap: 9px; bottom: ${bottom + padding}px; right: ${padding}px; z-index: 99999; padding: 12px 20px 11px 14px; background: linear-gradient(45deg, ${backgrounds[0]}, 20%, ${backgrounds[1]}); color: white; border-radius: 5px; box-shadow: 0 3px 7px 0 rgba(0,0,0,.5); font-size: 18px; opacity: 0; transition: opacity 0.3s ease-in-out, transform 0.3s ease-in-out; transform: translateX(300px);`
    element.innerHTML = `<span style="${iconStyle}border-radius: 50%; color: ${backgrounds[1]}; background-color: #ffffff90; width: 20px; height: 20px; text-align: center; font-weight: bolder; font-size: 12px;">${icon}</span><span style="margin-top: -1px;">${message}</span>`
    this.#toastShow(element)
    if (delay > 0) setTimeout(() => this.#toastHide(element), delay)
  }
  /**
   * Hides the toast element by applying a transform and removing it after a delay.
   * @param {HTMLElement} element - The toast element to hide.
   * @param {number} [delay] - The delay in milliseconds before removing the element.
   */
  #toastHide (element, delay = 200) {
    element.style.opacity = '0'
    element.style.transform = 'translateX(300px)'
    setTimeout(() => { element.remove() }, delay)
  }
  /**
   * Shows a toast element with a specified delay.
   * @param {HTMLElement} element - The toast element to be shown.
   * @param {number} [delay] - The delay in milliseconds before showing the toast.
   */
  #toastShow (element, delay = 100) {
    document.body.append(element)
    setTimeout(() => {
      element.style.opacity = '1'
      element.style.transform = 'translateX(0)'
    }, delay)
  }
  /**
   * Animate an element with animate.css
   * @param {HTMLElement} element the element to animate
   * @param {string} animation the name of the animation to use like 'bounce', 'fadeIn', 'zoomOut'
   * @param {boolean} canRemoveAfter if true, will remove the animation classes after the animation ends
   * @returns {Promise<void>} nothing
   */
  async animateCss (element, animation, canRemoveAfter = true) {
    await new Promise((resolve) => {
      const animationName = `animate__${animation}`
      element.classList.add('animate__animated', animationName)
      if (!canRemoveAfter) { resolve('Animation ended, no need to remove'); return }
      // When the animation ends, we clean the classes and resolve the Promise
      /**
       * Handle the animation end event
       * @param {{ stopPropagation: () => void; }} event the event
       */
      function handleAnimationEnd (event) {
        event.stopPropagation()
        element.classList.remove('animate__animated', animationName)
        resolve('Animation ended')
      }
      element.addEventListener('animationend', handleAnimationEnd, { once: true })
    })
  }
  /**
   * Capitalizes the first letter of a string, does not change the rest /!\
   * @param {string} string - The input string like 'hello World'
   * @returns {string} The capitalized string like 'Hello World'
   */
  capitalize (string) {
    return string.charAt(0).toUpperCase() + string.slice(1)
  }
  /**
   * Copy data to the clipboard
   * @param {unknown} stuff the data to copy
   * @returns {Promise<void>} nothing
   * @example await utils.copyToClipboard('hello world') // copies 'hello world' to the clipboard
   */
  async copyToClipboard (stuff) {
    const text = typeof stuff === 'string' ? stuff : JSON.stringify(stuff)
    this.log(`copying to clipboard : ${this.ellipsis(text)}`)
    await navigator.clipboard.writeText(text)
  }
  /**
   * Debounce a function
   * @param {Function} callback the function to debounce
   * @param {number} waitFor the time to wait before calling the function
   * @returns {Function} the debounced function
   * @example const debounced = utils.debounce(() => { console.log('hello world') }, 1000)
   * @example const debounced = utils.debounce(myFunction, 500)
   */
  debounce (callback, waitFor) { // @ts-ignore
    // eslint-disable-next-line init-declarations
    let timeout // @ts-ignore
    return async (...parameters) => await new Promise((resolve) => { // @ts-ignore
      clearTimeout(timeout)
      timeout = setTimeout(() => {
        resolve(callback(...parameters))
      }, waitFor)
    })
  }
  /**
   * Console.log stuff with app id if debug is true
   * @param  {...any} stuff the stuff to log
   * @returns {void}
   * @example utils.debug('hello', 'world')
   */
  debug (...stuff) {
    if (!this.willDebug) return
    if (this.id.length > 0) stuff.unshift(`${this.id} :`)
    console.log(...stuff) // eslint-disable-line no-console
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
   * Console.error stuff with app id
   * @param  {...any} stuff the stuff to log
   * @returns {void}
   * @example utils.error('hello', 'world')
   */
  error (...stuff) {
    if (this.id.length > 0) stuff.unshift(`${this.id} :`)
    console.error(...stuff) // eslint-disable-line no-console
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
      input.value += char
      await this.sleep(this.getRandomNumber(40, 80)) // eslint-disable-line no-await-in-loop
    }
    input.dispatchEvent(new Event('input', { bubbles: true }))
    input.dispatchEvent(new Event('change', { bubbles: true }))
    input.dispatchEvent(new Event('blur', { bubbles: true }))
    input.blur()
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
  // eslint-disable-next-line complexity
  findAll (selector, scope = document, canFail = false) {
    if (!selector || selector.length === 0 || selector.length === 1) this.error('incorrect selector : ', selector)
    const items = Array.prototype.slice.call(scope.querySelectorAll(selector))
    if (items.length > 0 && this.willDebug) this.log('found', items.length, `elements matching "${selector}"`)
    else if (items.length <= 0 && !canFail) this.warn(`found no elements for selector "${selector}"`)
    return items
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
   * Hide an element for a reason
   * @param {HTMLElement} element the element to hide
   * @param {string} reason the reason why the element is hidden
   * @returns {void}
   */
  hideElement (element, reason) {
    if (this.willDebug) {
      element.style.backgroundColor = 'red !important'
      element.style.color = 'white !important'
      element.style.boxShadow = '0 0 10px red'
      element.style.visibility = 'visible'
      element.style.opacity = '70'
    } else {
      element.style.display = 'none'
      element.style.visibility = 'hidden'
      element.style.opacity = '0'
    }
    element.dataset.hiddenCause = reason
  }
  /**
   * Hide elements for a reason
   * @param {object} selectors the selectors to hide, like { sidebar: 'main > div > div + div', ads: '.ad, .ads' }
   * @param {string} reason the reason why the elements are hidden
   * @returns {void}
   */
  hideElements (selectors, reason) {
    let nb = 0
    for (const selector of Object.values(selectors)) for (const node of this.findAll(`${selector}:not([data-hidden-cause])`, document, true)) {
      this.hideElement(node, reason)
      nb += 1
    }
    if (nb > 0) this.debug(`hideUseless has hidden ${nb} elements`)
  }
  /**
   * Inject styles in the DOM
   * @param {string} string the string to inject, can be a url or a css string
   * @returns {void}
   */
  injectStyles (string = '') {
    if (string.length === 0) { this.log('cannot inject empty style stuff'); return }
    if (string.includes('://') && !string.includes('\n') && string.includes('.css')) {
      document.querySelector('head')?.insertAdjacentHTML('beforeend', `<link rel="stylesheet" href="${string}" />`)
      return
    }
    document.body.insertAdjacentHTML('beforeend', `<style>${string}</style>`)
  }
  /**
   * Console.log stuff with app id
   * @param  {...any} stuff the stuff to log
   * @returns {void}
   */
  log (...stuff) {
    if (this.id.length > 0) stuff.unshift(`${this.id} :`)
    console.log(...stuff) // eslint-disable-line no-console
  }
  /**
   * Wait for location.href to change and call a callback
   * @param {Function} callback the callback to call when location.href changes
   * @param {string} last the last location.href, don't use it
   * @param {number} wait the time to wait between each try
   * @returns {Promise<void>} nothing
   * @example utils.onPageChange((url) => { console.log('new url :', url) })
   */
  async onPageChange (callback = () => { this.log('empty callback') }, last = '', wait = 1000) {
    await this.sleep(wait)
    const current = document.location.href
    if (current !== last) callback(current)
    this.onPageChange(callback, current, wait)
  }
  /**
   * Parse a price from a string
   * @param {string} input the string to parse, like "12,34 €" or "$12.34"
   * @returns {{amount: number, currency: string}} the parsed price, like { amount: 12.34, currency: '€' } or { amount: -12.34, currency: '$' }
   */
  parsePrice (input) {
    const { currencyEnd, currencyStart, decimals, integers, integersOnly, sign = '' } = /^(?<sign>-)?\+?(?<currencyStart>[$€])? ?(?:(?<integers>[\d .,]+)(?<decimals>[.,]\d{2})|(?<integersOnly>[\d .,]+)) ?(?<currencyEnd>[$€])?$/u.exec(input.trim())?.groups ?? {}
    const integer = (integers ?? integersOnly ?? '').replace(/\D/gu, '')
    const fraction = decimals ? decimals.slice(1) : '00'
    const currency = currencyStart ?? currencyEnd ?? ''
    const amount = Number.parseFloat(`${sign + integer}.${fraction}`)
    return { amount, currency };
  }
  /**
   * Pick a random element from an array
   * @param {unknown[]} array the array to pick from
   * @returns {unknown} the random element
   * @example utils.pickRandom([1, 2, 3, 4, 5]) // returns 3
   * @example utils.pickRandom(['hello', 'world']) // returns 'world'
   */
  pickRandom (array) {
    return array[Math.floor(Math.random() * array.length)]
  }
  /**
   * Get a ranged score
   * @param {{ isHigherBetter: boolean, valueMin: number, valueMax: number, scoreMin: number, scoreMax: number }} rules the rules to apply
   * @param {number} value the value to score
   * @returns {number} the ranged score
   */
  rangedScore ({ isHigherBetter, scoreMax, scoreMin, valueMax, valueMin }, value) {
    const lineA = (scoreMin - scoreMax) / (valueMin - valueMax)
    const lineB = scoreMax - valueMax * lineA
    const score = value * lineA + lineB
    if (score < scoreMin) return isHigherBetter ? scoreMin : scoreMax
    if (score > scoreMax) return isHigherBetter ? scoreMax : scoreMin
    const nbDecimals = (scoreMax - scoreMin) > 10 ? 0 : 2
    const finalScore = isHigherBetter ? score : scoreMax - score
    return this.round(finalScore, nbDecimals)
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
      .replace(/<.+?>/gu, ' ') // remove content in tags
      .replace(/\W/gu, ' ') // remove non words
      .replace(/\s+/gu, ' ') // replace spaces with single space
      .trim() // final trim
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
   * Remove accents from a string
   * @param {string} string the string to remove accents from
   * @returns {string} the string without accents
   * @example utils.removeAccents('éàù') // returns 'eau'
   */
  removeAccents (string) {
    // biome-ignore lint/suspicious/noMisleadingCharacterClass: <explanation>
    return string.normalize('NFD').replace(/[\u0300-\u036F]/gu, '')
  }
  /**
   * Round a number to a given number of decimals
   * @param {number} number the number to round
   * @param {number} nbDecimals the number of decimals to keep
   * @returns {number} the rounded number
   * @example utils.round(1.2345, 2) // returns 1.23
   */
  round (number, nbDecimals = 2) {
    return Math.round(number * 10 ** nbDecimals) / 10 ** nbDecimals
  }
  /**
   * Display an error both in the console and as a toast
   * @param {string} message the message to display
   * @returns {void}
   */
  showError (message) {
    this.toastError(message)
    this.error(message)
  }
  /**
   * Display a log both in the console and as a toast
   * @param {string} message the message to display
   * @returns {void}
   */
  showLog (message) {
    this.toastSuccess(message)
    this.log(message)
  }
  /**
   * Display a success both in the console and as a toast
   * @param {string} message the message to display
   * @returns {void}
   */
  showSuccess (message) {
    this.toastSuccess(message)
    this.log(message)
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
   * Throttle a function
   * @param {Function} callback the function to throttle
   * @param {number} timeout the time to wait before calling the function again
   * @returns {Function} the throttled function
   * @example const throttled = utils.throttle(() => { console.log('hello world') }, 1000)
   * @example const throttled = utils.throttle(myFunction, 500)
   */
  throttle (callback, timeout) {
    let isReady = true // @ts-ignore
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
   * Displays an error toast message.
   * @param {string} message - The error message to display.
   * @param {number} [delay] - The delay in milliseconds before the toast disappears. Default is 4000ms.
   * @example utils.toastError('hello world')
   */
  toastError (message, delay = 4000) { this.#toastAdd('error', message, delay) }
  /**
   * Displays a success toast message.
   * @param {string} message - The success message to display.
   * @param {number} [delay] - The delay in milliseconds before the toast disappears. Default is 2000ms.
   * @example utils.toastSuccess('hello world')
   */
  toastSuccess (message, delay = 2000) { this.#toastAdd('success', message, delay) }
  /**
   * Enable tailwindcss intellisense and return an array of classes
   * @param {string} classes the classes to split, e.g. 'h-56 w-96 rounded-md'
   * @returns {string[]} the array of classes, e.g. ['h-56', 'w-96', 'rounded-md']
   */
  tw (classes) { return classes.split(' ') }
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
    if (nbTries > 5) { this.log(`stop searching after 5 fails to detect : "${selector}"`); return undefined } // eslint-disable-line unicorn/no-useless-undefined
    return await this.waitToDetect(selector, wait, nbTries + 1)
  }
  /**
   * Console.warn stuff with app id
   * @param  {...any} stuff the stuff to log
   * @returns {void}
   */
  warn (...stuff) {
    if (this.id.length > 0) stuff.unshift(`${this.id} :`)
    console.warn(...stuff) // eslint-disable-line no-console
  }
}

if (module) module.exports = {
  Shuutils,
}
