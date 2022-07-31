// @ts-nocheck
// eslint-disable-next-line no-unused-vars, @typescript-eslint/no-unused-vars
class Shuutils {
  constructor (app) {
    Object.apply(app, { id: 'shu-app', debug: true })
    this.app = app
    this.version = '1.4.0'
    if (this.debug) this.log('using Shuutils', this.version)
    this.accentsIn = 'ÀÁÂÃÄÅĄàáâãäåąßÒÓÔÕÕÖØÓòóôõöøóÈÉÊËĘèéêëęðÇĆçćÐÌÍÎÏìíîïÙÚÛÜùúûüÑŃñńŠŚšśŸÿýŽŻŹžżź'
    this.accentsOut = 'AAAAAAAaaaaaaaBOOOOOOOOoooooooEEEEEeeeeeeCCccDIIIIiiiiUUUUuuuuNNnnSSssYyyZZZzzz'
  }

  log (...stuff) {
    stuff.unshift(this.app.id + ' :')
    console.log.apply(console, stuff)
  }

  warn (...stuff) {
    stuff.unshift(this.app.id + ' :')
    console.warn.apply(console, stuff)
  }

  error (...stuff) {
    stuff.unshift(this.app.id + ' :')
    console.error.apply(console, stuff)
  }

  readableString (string) {
    return [...string] // string to letters
      .map(letter => {
        const index = this.accentsIn.indexOf(letter)
        return index === -1 ? letter : this.accentsOut[index]
      }) // fix accents
      .join('') // letters to string
      .replace(/<.+?>/g, ' ') // remove content in tags
      .replace(/(\W|-)/gi, ' ') // remove non words
      .replace(/\s+/g, ' ') // replace spaces with single space
  }

  ellipsisWords (stringIn = '', maxWords = 5) {
    const stringOut = stringIn.split(' ').splice(0, maxWords).join(' ')
    if (stringOut === stringIn) return stringIn
    return stringOut + '...'
  }

  ellipsis (stringIn = '', maxLength = 50) {
    const stringOut = stringIn.slice(0, maxLength)
    if (stringOut === stringIn) return stringIn
    return stringOut + '...'
  }

  debounce (callback, waitFor) {
    let timeout
    return async (...parameters) => new Promise((resolve) => {
      clearTimeout(timeout)
      timeout = setTimeout(() => {
        resolve(callback(...parameters))
      }, waitFor)
    })
  }

  throttle (function_, timeout) {
    let ready = true
    return (...parameters) => {
      if (!ready)
        return
      ready = false
      function_(...parameters)
      setTimeout(() => {
        ready = true
      }, timeout)
    }
  }

  findOne (selector, context, dontYell) {
    context = context || document
    const item = context.querySelector(selector)
    if (item && this.app.debug) this.log('found element matching "' + selector + '"')
    else if (!item && !dontYell) this.warn('found no element for selector "' + selector + '"')
    return item
  }

  findFirst (selector, context, dontYell) {
    return this.findAll(selector, context, dontYell)[0]
  }

  findAll (selector, context, dontYell) {
    if (!selector || selector.length === 0 || selector.length === 1) this.error('incorrect selector : ', selector)
    context = context || document
    const items = Array.prototype.slice.call(context.querySelectorAll(selector))
    if (items.length > 0 && this.app.debug) this.log('found', items.length, 'elements matching "' + selector + '"')
    else if (items.length <= 0 && !dontYell) this.warn('found no elements for selector "' + selector + '"')
    return items
  }

  async sleep (ms) {
    return new Promise(resolve => {
      setTimeout(resolve, ms)
    })
  }

  async waitToDetect (selector, wait = 500, nbTries = 0) {
    await this.sleep(wait)
    const element = this.findOne(selector)
    if (element) return element
    if (nbTries > 5) {
      this.log(`stop searching after 5 fails to detect : "${selector}"`)
      return
    }
    return this.waitToDetect(selector, wait, ++nbTries)
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
