/* eslint-disable no-magic-numbers */
// ==UserScript==
// @name         Trade Republic AIO
// @downloadURL  https://github.com/Shuunen/user-scripts/raw/master/src/trade-republic-aio.user.js
// @namespace    https://github.com/Shuunen
// @version      1.0.0
// @description  Add some features to Trade Republic like investment report
// @match        https://app.traderepublic.com/profile/transactions
// @author       Romain Racamier-Lafon
// @require      https://cdn.jsdelivr.net/gh/Shuunen/user-scripts@latest/src/utils.min.js
// ==/UserScript==

// eslint-disable-next-line max-statements
(function TradeRepublicAio () {
  const data = {
    currentYear: new Date().getFullYear(),
  }
  const elements = {
    meter: document.createElement('div'),
  }
  const selectors = {
    entries: '.timeline__entry',
    entryInjectedIcon: 'img[data-testid="logos/timeline_plus_circle/v2"]',
    entryPrice: '.timelineV2Event__price p',
    entrySubtitle: '.timelineV2Event__subtitle',
  }
  /** @type {import('./utils.js').Shuutils} */// @ts-ignore
  const utils = new Shuutils('trep-aio')

  /**
   * Get the meter text based on the data
   * @param {number} injected the total amount injected, added
   * @param {number} spent the total amount spent via Trade Republic Card
   * @param {string} date the date of the first investment, like "26/07"
   * @returns {string} the meter text
   */
  function meterText (injected, spent, date) {
    const [day, month] = date.split('/')
    const readableDate = new Date(data.currentYear, Number(month) - 1, Number(day)).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
    return `since ${readableDate.toLowerCase()} : ${injected.toFixed(2).replace('.', ',')} € injected and ${spent.toFixed(2).replace('.', ',')} € spent`
  }

  /**
   * Inject the elements needed for the script
   */
  function injectElements () {
    elements.meter.style.position = 'fixed'
    elements.meter.style.top = '0'
    elements.meter.style.left = '0'
    elements.meter.style.border = '2px solid'
    elements.meter.style.padding = '5px 10px'
    elements.meter.style.fontSize = '1.1rem'
    elements.meter.style.transition = 'all 0.3s'
    elements.meter.style.backgroundColor = 'black'
    elements.meter.textContent = ''
    document.body.append(elements.meter)
  }

  /**
   * Show the invested amount and times
   */
  // eslint-disable-next-line max-statements, complexity
  function showInvested () {
    let injected = 0
    let spent = 0
    const entries = utils.findAll(selectors.entries)
    for (const entry of entries) {
      if (entry.getAttribute('aria-hidden') === 'true') continue // skip month section titles
      const amountElement = utils.findOne(selectors.entryPrice, entry)
      if (amountElement === undefined) continue // skip entries without amount, happens for card verification for example
      const amountText = amountElement.textContent ?? ''
      if (amountText === '') continue // skip empty amounts

      const subtitleElement = utils.findOne(selectors.entrySubtitle, entry)
      if (subtitleElement === undefined) { utils.showError('check logs'); utils.error('subtitle element not found for entry', entry); return }
      const subtitleText = subtitleElement.textContent ?? ''
      if (subtitleText === '') { utils.showError('check logs'); utils.error('subtitle text empty for entry', entry); return }
      const date = subtitleText.trim()

      const isInternal = subtitleText.includes(' - ')
      if (isInternal) continue // skip internal transactions

      const isInjected = utils.findOne(selectors.entryInjectedIcon, entry) !== undefined // money I transferred to my Trade Republic account

      const isPositive = amountText.includes('+')
      const { bottom, right, top } = amountElement.getBoundingClientRect()
      if (window.innerHeight < bottom) continue // avoid putting the meter outside the screen ^^
      elements.meter.style.left = `${right + 20}px`
      elements.meter.style.top = `${top - 7}px`
      const amount = Number.parseFloat(amountText.replace(/[+€\s]/gu, '').replace(',', '.').trim()) * (isPositive ? 1 : -1)
      utils.log('adding', amount, '€ to', isInjected ? 'injected' : 'spent', 'on', date)
      if (isInjected) injected += amount
      else spent += amount
      elements.meter.textContent = meterText(injected, spent, date)
    }
  }
  /**
   * Initializes the script.
   */
  function init () {
    utils.log('Trade Republic AIO start...')
    showInvested()
  }
  const initDebounced = utils.debounce(init, 500)
  initDebounced()
  /**
   * Handles page mutations
   * @param {MutationRecord[]} mutations the mutations that occurred
   */
  function onMutation (mutations) {
    // const { target } = event
    const element = mutations[0]?.addedNodes[0]
    if (element === null || element === undefined) return
    if (element.nodeName === '#text') return // avoid triggering on our own text nodes edits
    if (element instanceof HTMLElement && element.className.includes('shu-toast')) return
    utils.debug('mutation detected', mutations[0])
    initDebounced()
  }
  const observer = new MutationObserver(onMutation)
  observer.observe(document.body, { childList: true, subtree: true })
  document.addEventListener('scroll', () => initDebounced())
  utils.onPageChange(injectElements)
})()
