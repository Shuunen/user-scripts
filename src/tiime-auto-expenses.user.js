// ==UserScript==
// @name         Tiime Auto Expenses Filler
// @namespace    https://github.com/Shuunen
// @version      1.0.0
// @description  Generate expenses automatically
// @author       Romain Racamier-Lafon
// @match        https://apps.tiime.fr/companies/*/expense/advanced-expenses
// @require      https://cdn.jsdelivr.net/gh/Shuunen/user-scripts@master/src/utils.js
// ==/UserScript==

/* eslint-disable max-statements */

function createButton (label = '') {
  const button = document.createElement('button')
  button.textContent = label
  button.type = 'button'
  button.setAttribute('tiime-button', '')
  return button
}

(function TiimeAutoExpenses () {
  /* global Shuutils */
  const marker = 'tim-aex'
  const app = {
    addOneBtn: document.createElement('button'),
    debug: false, // eslint-disable-line @typescript-eslint/naming-convention
    id: marker,
  }
  /** @type {import('./utils.js').Shuutils} */
  // @ts-ignore
  const utils = new Shuutils(app)
  const selectors = {
    addExpenseBtn: '.right [tiime-button]',
    tableRow: 'tbody > tr',
    tableRowAmountInput: '[placeholder="Montant"]',
    tableRowDate: '.mat-datepicker-input',
    tableRowDateLastDay: 'tbody.mat-calendar-body > tr:last-of-type > td:last-of-type > button',
    tableRowDatePrevMonth: '.mat-calendar-previous-button',
    tableRowHasCommentIcon: 'mat-icon.icon-tag-and-comment',
    tableRowLabel: '[data-cy="label__btn-add"]',
    tableRowLabelFirstChip: '[data-cy="label__search-result-0"]',
    tableRowLabelInput: '[data-cy="label__input-search"]',
    tableRowMenu: 'button.mat-mdc-menu-trigger',
    tableRowMenuComment: '.mat-mdc-menu-item:nth-child(2)',
    textareaComment: 'textarea[placeholder="Ajouter un commentaire"]',
    textareaCommentValidate: '.mat-mdc-dialog-actions button[tiime-button][accent]',
  }
  const classes = {
    tableRowActive: 'row-active',
  }
  /**
   * @param {HTMLElement} row
   */
  async function setDate (row) {
    utils.log('setting date to last day of previous month')
    const input = utils.findOne(selectors.tableRowDate, row)
    if (input === undefined) { utils.error('tableRowDate not found'); return }
    input.click()
    const previous = await utils.waitToDetect(selectors.tableRowDatePrevMonth)
    if (previous === undefined) { utils.error('previous button not found'); return }
    previous.click()
    const lastDay = await utils.waitToDetect(selectors.tableRowDateLastDay)
    if (lastDay === undefined) { utils.error('lastDay not found'); return }
    lastDay.click()
    utils.log('date set to the', lastDay.textContent, 'of previous month')
  }

  /**
   * @param {HTMLElement} row the row to set the label for
   * @param {string} label the label to set, like "Abonnement Internet"
   */
  async function setLabel (row, label) {
    utils.log(`setting label "${label}"`)
    const chip = row.querySelector('[data-cy="label-chip__txt-label-name"]')
    if (chip !== null) { utils.log('label already set'); return }
    const button = utils.findOne(selectors.tableRowLabel, row)
    if (button === undefined) { utils.error('tableRowLabel not found'); return }
    button.click()
    /** @type {HTMLInputElement | undefined} */
    // @ts-ignore
    const input = await utils.waitToDetect(selectors.tableRowLabelInput)
    if (input === undefined) { utils.error('tableRowLabelInput not found'); return }
    input.value = label
    input.dispatchEvent(new Event('input'))
    const firstChip = await utils.waitToDetect(selectors.tableRowLabelFirstChip)
    if (firstChip === undefined) { utils.error('tableRowLabelFirstChip not found'); return }
    firstChip.click()
    utils.log('label set to', firstChip.textContent)
  }

  /**
   * @param {HTMLElement} row the row to set the amount for
   * @param {number} amount the amount to set, like 22.47
   */
  async function setAmount (row, amount) {
    utils.log(`setting amount "${amount}"`)
    /** @type {HTMLInputElement | undefined} */
    // @ts-ignore
    const input = utils.findOne(selectors.tableRowAmountInput, row)
    if (input === undefined) { utils.error('tableRowAmountInput not found'); return }
    if (input.value !== '') { utils.log('amount already set'); return }
    input.parentElement?.click()
    input.focus()
    input.value = amount.toString()
    await utils.sleep(100) // eslint-disable-line no-magic-numbers
    input.dispatchEvent(new Event('input', { bubbles: true, cancelable: true })) // eslint-disable-line @typescript-eslint/naming-convention
    await utils.sleep(100) // eslint-disable-line no-magic-numbers
    input.blur()
    utils.log('amount set to', input.value)
  }

  /**
   * Set the comment for an expense
   * @param {string} comment the comment to set
   */
  async function setComment (comment) {
    utils.log(`setting comment "${comment}"`)
    const icon = await utils.waitToDetect(`${selectors.tableRow}.${classes.tableRowActive} ${selectors.tableRowHasCommentIcon}`)
    if (icon !== undefined) { utils.log('comment already set'); return }
    const button = await utils.waitToDetect(`${selectors.tableRow}.${classes.tableRowActive} ${selectors.tableRowMenu}`)
    if (button === undefined) { utils.error('tableRowMenu not found'); return }
    button.click()
    const entry = await utils.waitToDetect(selectors.tableRowMenuComment)
    if (entry === undefined) { utils.error('tableRowMenuComment not found'); return }
    const entryText = entry.textContent?.trim() ?? ''
    if (entryText !== 'Ajouter un commentaire') { utils.error(`tableRowMenuComment found but wrong text inside : ${entryText}`); return }
    entry.click()
    /** @type {HTMLTextAreaElement | undefined} */
    // @ts-ignore
    const textarea = await utils.waitToDetect(selectors.textareaComment)
    if (textarea === undefined) { utils.error('textareaComment not found'); return }
    textarea.value = comment
    await utils.sleep(100) // eslint-disable-line no-magic-numbers
    textarea.dispatchEvent(new Event('input', { bubbles: true, cancelable: true })) // eslint-disable-line @typescript-eslint/naming-convention
    await utils.sleep(100) // eslint-disable-line no-magic-numbers
    textarea.blur()
    const validate = await utils.waitToDetect(selectors.textareaCommentValidate)
    if (validate === undefined) { utils.error('textareaCommentValidate not found'); return }
    validate.click()
  }

  /**
   * Check if an expense is already filled
   * @param {string} label the label to check
   * @param {number} amount the amount to check
   * @returns {boolean} true if the expense is already filled
   */
  function isExpenseFilled (label, amount) {
    return utils.findAll('[data-cy="label-chip__txt-label-name"]').some(chip => {
      const text = chip.textContent?.trim() ?? ''
      const hasSameLabel = text === label
      if (!hasSameLabel) return false
      const row = chip.closest('tr')
      if (row === null) { utils.error('row closest to chip not found'); return false }
      /** @type {HTMLInputElement | null} */
      const input = row.querySelector(selectors.tableRowAmountInput)
      if (input === null) { utils.error('amount input not found'); return false }
      const hasSameAmount = input.value === amount.toString()
      if (!hasSameAmount) utils.error(`found label "${label}" but current amount is ${input.value} instead of ${amount.toString()}`)
      return hasSameLabel // still return hasSameLabel/true even if amount is different because we want to skip this expense
      // so we consider it as already filled
    })
  }

  /**
   * Add an expense to the page
   * @param {string} label
   * @param {string} comment
   * @param {number} amount
   */
  async function addExpense (label, comment, amount) {
    // console.groupEnd() // eslint-disable-line no-console
    await utils.sleep(300) // eslint-disable-line no-magic-numbers
    if (isExpenseFilled(label, amount)) { utils.log(`expense already filled : ${label}`); return }
    console.groupCollapsed(`addExpense "${label}" with ${amount}€ (${comment})`) // eslint-disable-line no-console
    app.addOneBtn.click()
    const row = await utils.waitToDetect(selectors.tableRow)
    if (row === undefined) { utils.error('row not found'); return }
    row.classList.add(classes.tableRowActive)
    await setDate(row)
    await setLabel(row, label)
    await setAmount(row, amount)
    if (comment !== '') await setComment(comment)
    row.classList.remove(classes.tableRowActive)
    console.groupEnd() // eslint-disable-line no-console
  }

  async function addExpenses () {
    const lines = await utils.readClipboard()
    if (lines.trim() === '') { utils.error('no data found in clipboard'); return }
    if (!lines.includes('\t')) { utils.error('tabs not found in data, does not seems like you copied spreadsheet cells'); return }
    const [headers, ...expenses] = lines.split('\n').map(line => line.split('\t'))
    const headerHash = headers?.join('').trim() ?? ''
    const headerHashExpected = 'FraisCommentaireMontant'
    if (headerHash !== headerHashExpected) { utils.error(`header not found or not matching, expected "${headerHashExpected}" but got "${headerHash}"`); return }
    if (expenses.length === 0) { utils.error('no expenses found'); return }
    utils.log('adding expenses...', expenses)
    const subset = expenses
    for (const [label = '', comment = '', amount = ''] of subset) {
      const amountNumber = Number.parseFloat(amount.replace(',', '.'))
      // eslint-disable-next-line no-await-in-loop
      await addExpense(label, comment, amountNumber)
    }
  }

  async function init () {
    /** @type {HTMLButtonElement | undefined} */
    // @ts-ignore
    const addOne = await utils.waitToDetect(selectors.addExpenseBtn)
    if (addOne === undefined) { utils.log('no add expense button found on this page'); return }
    app.addOneBtn = addOne
    const addAll = createButton('Add common expenses')
    addAll.addEventListener('click', () => { void addExpenses() })
    if (addOne.parentElement === null) { utils.error('button parent element not found'); return }
    addOne.parentElement.append(addAll)
    utils.log('button injected')
  }

  const initDebounced = utils.debounce(init, 300) // eslint-disable-line no-magic-numbers
  initDebounced()
})()
