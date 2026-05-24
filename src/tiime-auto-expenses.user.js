// ==UserScript==
// @name         Tiime Auto Expenses Filler
// @author       Romain Racamier-Lafon
// @description  Generate expenses automatically
// @downloadURL  https://github.com/Shuunen/user-scripts/raw/master/src/tiime-auto-expenses.user.js
// @updateURL    https://github.com/Shuunen/user-scripts/raw/master/src/tiime-auto-expenses.user.js
// @match        https://apps.tiime.fr/companies/*/expense/*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=tiime.fr
// @namespace    https://github.com/Shuunen
// @require      https://cdn.jsdelivr.net/gh/Shuunen/monorepo@latest/apps/user-scripts/src/utils.js
// @version      1.2.0
// ==/UserScript==

// cSpell:disable

/**
 * @typedef {import('./tiime-auto-expenses.types').Expense} Expense
 */

const id = 'tim-aex'

const delays = {
  large: 500,
  medium: 300,
  small: 100,
}

const doOnlyOneExpense = false

/**
 * Create a button element
 * @param {string} label the button label
 * @returns {HTMLButtonElement} the button element
 */
function createButton(label = '') {
  const button = document.createElement('button')
  button.id = id
  button.textContent = label
  button.type = 'button'
  button.setAttribute('tiime-button', '')
  return button
}

function TiimeAutoExpenses() {
  const utils = new Shuutils(id)
  const elements = {
    createNdfBtn: createButton(''),
    newExpenseBtn: createButton(''),
  }
  // oxlint-disable-next-line sort-keys
  const selectors = {
    /** "Ajouter une dépense" dans la popup après avoir cliqué sur "Creer une note de frais" */
    chooseExpenseBtn: 'span + .tiime-background-secondary-surface',
    /** "Creer une note de frais" le bouton sur la page de demarrage */
    createNdfBtn: '.action-bar-actions > [tiime-button][accent]',
    /** Ajouter un label */
    formAddLabelBtn: 'app-advanced-expense-side-panel button[data-cy="label__btn-add"]',
    /** Montant TTC */
    formInputAmount: 'app-advanced-expense-side-panel [formcontrolname="amount"]',
    /** Montant TVA */
    formInputTva: 'app-advanced-expense-side-panel [formcontrolname="vatAmount"]',
    /** Commentaire de la dépense */
    formInputComment: 'app-advanced-expense-side-panel [formcontrolname="comment"]',
    /** Date de la dépense */
    formInputDate: 'app-advanced-expense-side-panel [formcontrolname="date"]',
    /** Nom de la dépense */
    formInputName: 'app-advanced-expense-side-panel [formcontrolname="expenseName"]',
    /** Montant de la TVA */
    formInputVatAmount: 'app-advanced-expense-side-panel [formcontrolname="vatAmount"]',
    /** (+) Nouvelle dépense */
    newExpenseBtn: 'app-expense-report-advanced-expenses button[tiime-button][neutral]',
    /** Suivant */
    nextButton: 'app-fixed-footer-bar > button + button[tiime-button][accent]',
    /** "Enregistrer", permet d'enregistrer la dépense */
    saveButton: 'app-fixed-footer-bar > button + button[tiime-button][accent].mr-auto',
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
    /** Title of the expense report */
    titleNdf: "app-document-editor-container form [formcontrolname='name']",
  }
  function setDate() {
    utils.log('setting date to last day of previous month')
    const input = utils.findOne(selectors.formInputDate)
    if (input === undefined) {
      utils.showError('formInputDate not found')
      return
    }
    const currentValue = input instanceof HTMLInputElement ? input.value : ''
    if (currentValue !== '') {
      utils.log('date already set to', currentValue)
      return
    }
    utils.showError('setting date is not implemented yet, please set it manually')
  }
  /**
   * Set the name of the expense
   * @param {Expense["label"]} name the name to set, like "Abonnement Internet"
   * @returns {Promise<void>}
   */
  async function setName(name) {
    utils.log(`setting name "${name}"`)
    const input = await utils.waitToDetect(selectors.formInputName)
    if (input === undefined) {
      utils.showError('formInputName not found')
      return
    }
    if (!(input instanceof HTMLInputElement)) {
      utils.showError('formInputName is not an input element')
      return
    }
    // input.value = name
    // input.dispatchEvent(new Event('input'))
    await utils.fillLikeHuman(input, name)
    utils.log('name set to', input.value)
  }
  /**
   * Set the amount TTC
   * @param {Expense["amount"]} amount the amount to set, like 22.47
   */
  async function setTtcAmount(amount) {
    utils.log(`setting amount "${amount}"`)
    const input = utils.findOne(selectors.formInputAmount)
    if (input === undefined) {
      utils.showError('formInputAmount not found')
      return
    }
    if (!(input instanceof HTMLInputElement)) {
      utils.showError('formInputAmount is not an input element')
      return
    }
    // await utils.fillLikeHuman(input, amount.toString().replace('.', ',')) // fail with "The specified value "25," cannot be parsed, or is out of range."
    // await utils.fillLikeHuman(input, amount.toString()) // fail with "The specified value "25." cannot be parsed, or is out of range."
    // await utils.fillLikeHuman(input, '42')
    input.focus()
    input.value = amount.toString()
    await utils.sleep(delays.small)
    input.dispatchEvent(new Event('input', { bubbles: true, cancelable: true }))
    await utils.sleep(delays.small)
    input.blur()
    utils.log('amount set to', input.value)
  }
  /**
   * Set the TVA amount
   * @param {Expense["tva"]} tva the TVA amount to set, like "0" or "4.5"
   */
  async function setTvaAmount(tva) {
    utils.log(`setting tva "${tva}"`)
    const input = utils.findOne(selectors.formInputTva)
    if (input === undefined) {
      utils.showError('formInputTva not found')
      return
    }
    if (!(input instanceof HTMLInputElement)) {
      utils.showError('formInputTva is not an input element')
      return
    }
    input.focus()
    input.value = tva.toString()
    await utils.sleep(delays.small)
    input.dispatchEvent(new Event('input', { bubbles: true, cancelable: true }))
    await utils.sleep(delays.small)
    input.blur()
    utils.log('tva set to', input.value)
  }

  /**
   * Set the label for an expense
   * @param {Expense["label"]} label the label to set
   */
  async function setLabel(label) {
    utils.log(`setting label "${label}"`)
    const addLabelBtn = await utils.waitToDetect(selectors.formAddLabelBtn)
    if (addLabelBtn === undefined) {
      utils.showError('formAddLabelBtn not found')
      return
    }
    addLabelBtn.click()
    const input = await utils.waitToDetect(selectors.tableRowLabelInput)
    if (input === undefined) {
      utils.showError('tableRowLabelInput not found')
      return
    }
    if (!(input instanceof HTMLInputElement)) {
      utils.showError('tableRowLabelInput is not an input element')
      return
    }
    await utils.fillLikeHuman(input, label)
    await utils.sleep(delays.small)
    const firstChip = await utils.waitToDetect(selectors.tableRowLabelFirstChip)
    if (firstChip === undefined) {
      utils.showError('tableRowLabelFirstChip not found')
      return
    }
    firstChip.click()
    utils.log('label set to', label)
  }

  /**
   * Set the comment for an expense
   * @param {Expense["comment"]} comment the comment to set
   */
  async function setComment(comment) {
    utils.log(`setting comment "${comment}"`)
    const textarea = utils.findOne(selectors.formInputComment)
    if (textarea === undefined) {
      utils.showError('formInputComment not found')
      return
    }
    if (!(textarea instanceof HTMLTextAreaElement)) {
      utils.showError('formInputComment is not a textarea element')
      return
    }
    // await utils.fillLikeHuman(textarea, comment) // fail : nothing appears
    await utils.sleep(delays.small)
    textarea.value = comment
    await utils.sleep(delays.small)
    textarea.dispatchEvent(new Event('input', { bubbles: true, cancelable: true }))
    await utils.sleep(delays.small)
    textarea.blur()
    utils.log('comment set to', textarea.value)
  }
  /**
   * Check if an expense is already filled
   * @param {Expense["label"]} label the label to check
   * @returns {boolean} true if the expense is already filled
   */
  function isExpenseFilled(label) {
    return utils.findAll('app-expense-report-advanced-expenses tbody tr td:nth-child(2)').some(labelCell => {
      const thisLabel = labelCell.textContent?.trim() ?? ''
      utils.log(`checking existing expense label "${thisLabel}" against "${label}"`)
      return thisLabel === label
    })
  }

  async function createNdf() {
    elements.createNdfBtn.click()
    const addExpenseOptionBtn = await utils.waitToDetect(selectors.chooseExpenseBtn)
    if (addExpenseOptionBtn === undefined) {
      utils.showError('addExpenseOptionBtn not found')
      return
    }
    addExpenseOptionBtn.click()
    const nextButton = await utils.waitToDetect(selectors.nextButton)
    if (nextButton === undefined) {
      utils.showError('nextButton not found')
      return
    }
    nextButton.click()
    const newExpenseBtn = await utils.waitToDetect(selectors.newExpenseBtn)
    if (newExpenseBtn === undefined) {
      utils.log('no add expense button found on this page')
      return
    }
    if (!(newExpenseBtn instanceof HTMLButtonElement)) {
      utils.showError('newExpenseBtn is not a button element')
      return
    }
    elements.newExpenseBtn = newExpenseBtn
    utils.log('newExpenseBtn found and stored', elements.newExpenseBtn)
    utils.log('ndf created')
  }

  async function saveExpense() {
    utils.log('saving expense')
    const saveButton = await utils.waitToDetect(selectors.saveButton)
    if (saveButton === undefined) {
      utils.showError('saveButton not found')
      return
    }
    if (!(saveButton instanceof HTMLButtonElement)) {
      utils.showError('saveButton is not a button element')
      return
    }
    if (saveButton.disabled) {
      utils.showError('saveButton is disabled, cannot save expense')
      return
    }
    saveButton.click()
    await utils.sleep(delays.large)
    utils.log('expense saved')
  }

  /**
   * Add an expense to the page
   * @param {Expense} data the expense details
   */
  async function addExpense({ label, comment, amount, tva }) {
    // console.groupEnd()
    await utils.sleep(delays.large)
    if (isExpenseFilled(label)) {
      utils.log(`expense already filled : ${label}`)
      return
    }
    elements.newExpenseBtn.click()
    await setName(label)
    setDate()
    await setTtcAmount(amount)
    await setTvaAmount(tva)
    await setLabel(label)
    await setComment(comment)
    await saveExpense()
  }

  /**
   * Get expenses from the clipboard
   * @returns {Promise<Expense[]>} the expenses found
   */
  async function getExpenses() {
    const lines = await utils.readClipboard()
    if (lines.trim() === '') {
      utils.showError('no data found in clipboard')
      return []
    }
    if (!lines.includes('\t')) {
      utils.showError('tabs not found in data, does not seems like you copied spreadsheet cells')
      return []
    }
    const [headers, ...expensesLines] = lines.split('\n').map(line => line.split('\t'))
    const headerHash = headers?.join('').trim() ?? ''
    const headerHashExpected = 'FraisCommentaireMontant TTCMontant TVA'
    if (headerHash !== headerHashExpected) {
      utils.showError(`header not found or not matching, expected "${headerHashExpected}" but got "${headerHash}"`)
      return []
    }
    if (expensesLines.length === 0) return []

    const expenses = expensesLines.map(([label = '', comment = '', amount = '', tva = '']) => {
      const amountNumber = Number.parseFloat(amount.replace(',', '.'))
      const tvaNumber = Number.parseFloat(tva.replace(',', '.'))
      return { amount: amountNumber, comment, label, tva: tvaNumber }
    })
    if (doOnlyOneExpense) {
      utils.log('doOnlyOneExpense is true, only first expense will be processed', expenses[0])
      return expenses.slice(0, 1)
    }
    return expenses
  }

  /**
   * Set the title of the expense report
   */
  async function setNdfTitle() {
    const titleInput = await utils.waitToDetect(selectors.titleNdf)
    if (titleInput === undefined) {
      utils.showError('titleNdf not found')
      return
    }
    if (!(titleInput instanceof HTMLInputElement)) {
      utils.showError('titleNdf is not an input element')
      return
    }
    const now = new Date()
    const month = now.getMonth() + 1
    const year = now.getFullYear()
    const title = `Note de frais ${month}/${year}`
    titleInput.value = title
    titleInput.dispatchEvent(new Event('input', { bubbles: true, cancelable: true }))
    utils.log('expense report title set to', title)
  }

  /**
   * Add multiple expenses from the clipboard
   */
  async function addExpenses() {
    const expenses = await getExpenses()
    if (expenses.length === 0) {
      utils.showError('no expenses found to add')
      return
    }
    utils.log('adding expenses...', expenses)
    // oxlint-disable-next-line no-await-in-loop
    for (const expense of expenses) await addExpense(expense)
    await setNdfTitle()
    utils.showSuccess(`${doOnlyOneExpense ? 'single expense' : 'expenses'} added 😎`)
  }

  /**
   * Initialize the script
   * @param {string} reason the reason for initialization
   */
  async function init(reason = 'unknown') {
    utils.log(`init reason :`, reason)
    const createNdfBtn = await utils.waitToDetect(selectors.createNdfBtn)
    if (createNdfBtn === undefined) {
      utils.log('no add expense button found on this page')
      return
    }
    if (!(createNdfBtn instanceof HTMLButtonElement)) {
      utils.showError('createNdfBtn is not a button element')
      return
    }
    elements.createNdfBtn = createNdfBtn
    const hasAddAll = utils.findOne(`#${id}`, document.body, true)
    if (hasAddAll !== undefined) {
      utils.log('button already injected')
      return
    }
    const addAll = createButton('Ajouter les dépenses courantes 😎')
    addAll.addEventListener('click', async () => {
      await createNdf()
      await addExpenses()
    })
    if (createNdfBtn.parentElement === null) {
      utils.showError('button parent element not found')
      return
    }
    createNdfBtn.parentElement.append(addAll)
    utils.showLog('button injected')
  }
  const initDebounced = utils.debounce(init, delays.large)
  initDebounced()
  utils.onPageChange(initDebounced)

  /**
   * Handles page mutations
   * @param {MutationRecord[]} mutations the mutations that occurred
   */
  function onMutation(mutations) {
    // const { target } = event
    const element = mutations[0]?.addedNodes[0]
    if (element === null || element === undefined) return
    if (!(element instanceof HTMLElement)) return
    if (element.className.includes('shu-toast')) return
    if (elements.createNdfBtn.parentElement) return // already init
    utils.debug('mutation detected', mutations[0])
    initDebounced('mutation')
  }
  const observer = new MutationObserver(onMutation)
  observer.observe(document.body, { childList: true, subtree: true })
}

if (globalThis.window) TiimeAutoExpenses()
else module.exports = { createButton }
