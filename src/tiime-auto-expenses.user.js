// ==UserScript==
// @name         Tiime Auto Expenses Filler
// @author       Romain Racamier-Lafon
// @description  Generate expenses automatically
// @downloadURL  https://github.com/Shuunen/user-scripts/raw/master/src/tiime-auto-expenses.user.js
// @updateURL    https://github.com/Shuunen/user-scripts/raw/master/src/tiime-auto-expenses.user.js
// @match        https://apps.tiime.fr/companies/*/expense/*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=tiime.fr
// @namespace    https://github.com/Shuunen
// @require      https://cdn.jsdelivr.net/gh/Shuunen/user-scripts@master/src/utils.js
// @version      1.4.0
// ==/UserScript==

// cSpell:disable

/**
 * @typedef {import('./tiime-auto-expenses.types').Expense} Expense
 * @typedef {import('./utils.js').MessageResult} Result
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
  const { Result } = utils
  const elements = {
    createNdfBtn: createButton(''),
    newExpenseBtn: createButton(''),
  }
  // oxlint-disable-next-line sort-keys
  const selectors = {
    /** "Ajouter une dépense" dans la popup après avoir cliqué sur "Creer une note de frais" */
    chooseExpenseBtn: 'span + .tiime-background-secondary-surface',
    /** "Creer une note de frais" le bouton sur la page de demarrage */
    createNdfBtn: 'app-boxed-action-bar button[tds-button].tds-button-color-primary',
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
  /**
   * Set the date of the expense
   * @returns {Promise<Result>} the result
   */
  async function setDate() {
    utils.log('setting date to last day of previous month')
    const { error, value: input } = Result.unwrap(await utils.getElement(selectors.formInputDate, HTMLInputElement, false))
    if (error !== undefined) return Result.error(error)
    if (input.value !== '') {
      utils.log('date already set to', input.value)
      return Result.ok('')
    }
    return Result.error('setting date is not implemented yet, please set it manually')
  }
  /**
   * Set the name of the expense
   * @param {Expense["label"]} name the name to set, like "Abonnement Internet"
   * @returns {Promise<Result>} the result
   */
  async function setName(name) {
    utils.log(`setting name "${name}"`)
    const { error, value: input } = Result.unwrap(await utils.getElement(selectors.formInputName, HTMLInputElement))
    if (error !== undefined) return Result.error(error)
    await utils.fillLikeHuman(input, name)
    utils.log('name set to', input.value)
    return Result.ok('')
  }
  /**
   * Set the amount TTC
   * @param {Expense["amount"]} amount the amount to set, like 22.47
   * @returns {Promise<Result>} the result
   */
  async function setTtcAmount(amount) {
    utils.log(`setting amount "${amount}"`)
    const { error, value: input } = Result.unwrap(await utils.getElement(selectors.formInputAmount, HTMLInputElement, false))
    if (error !== undefined) return Result.error(error)
    await utils.fillInput(input, amount)
    utils.log('amount set to', input.value)
    return Result.ok('')
  }
  /**
   * Set the TVA amount
   * @param {Expense["tva"]} tva the TVA amount to set, like 0 or 4.5
   * @returns {Promise<Result>} the result
   */
  async function setTvaAmount(tva) {
    utils.log(`setting tva "${tva}"`)
    const { error, value: input } = Result.unwrap(await utils.getElement(selectors.formInputTva, HTMLInputElement, false))
    if (error !== undefined) return Result.error(error)
    await utils.fillInput(input, tva)
    utils.log('tva set to', input.value)
    return Result.ok('')
  }
  /**
   * Set the label for an expense
   * @param {Expense["label"]} label the label to set
   * @returns {Promise<Result>} the result
   */
  async function setLabel(label) {
    utils.log(`setting label "${label}"`)
    const { error: buttonError, value: addLabelBtn } = Result.unwrap(await utils.getElement(selectors.formAddLabelBtn, HTMLElement))
    if (buttonError !== undefined) return Result.error(buttonError)
    addLabelBtn.click()
    const { error: inputError, value: input } = Result.unwrap(await utils.getElement(selectors.tableRowLabelInput, HTMLInputElement))
    if (inputError !== undefined) return Result.error(inputError)
    await utils.fillLikeHuman(input, label)
    await utils.sleep(delays.small)
    const { error: chipError, value: firstChip } = Result.unwrap(await utils.getElement(selectors.tableRowLabelFirstChip, HTMLElement))
    if (chipError !== undefined) return Result.error(chipError)
    firstChip.click()
    utils.log('label set to', label)
    return Result.ok('')
  }
  /**
   * Set the comment for an expense
   * @param {Expense["comment"]} comment the comment to set
   * @returns {Promise<Result>} the result
   */
  async function setComment(comment) {
    utils.log(`setting comment "${comment}"`)
    const { error, value: textarea } = Result.unwrap(await utils.getElement(selectors.formInputComment, HTMLTextAreaElement, false))
    if (error !== undefined) return Result.error(error)
    await utils.fillInput(textarea, comment) // fillLikeHuman fails here : nothing appears
    utils.log('comment set to', textarea.value)
    return Result.ok('')
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
  /**
   * Create the expense report
   * @returns {Promise<Result>} the result
   */
  async function createNdf() {
    elements.createNdfBtn.click()
    const { error: optionError, value: addExpenseOptionBtn } = Result.unwrap(await utils.getElement(selectors.chooseExpenseBtn, HTMLElement))
    if (optionError !== undefined) return Result.error(optionError)
    addExpenseOptionBtn.click()
    const { error: nextError, value: nextButton } = Result.unwrap(await utils.getElement(selectors.nextButton, HTMLElement))
    if (nextError !== undefined) return Result.error(nextError)
    nextButton.click()
    const { error: newError, value: newExpenseBtn } = Result.unwrap(await utils.getElement(selectors.newExpenseBtn, HTMLButtonElement))
    if (newError !== undefined) return Result.error(newError)
    elements.newExpenseBtn = newExpenseBtn
    utils.log('newExpenseBtn found and stored', elements.newExpenseBtn)
    utils.log('ndf created')
    return Result.ok('')
  }
  /**
   * Save the current expense
   * @returns {Promise<Result>} the result
   */
  async function saveExpense() {
    utils.log('saving expense')
    const { error, value: saveButton } = Result.unwrap(await utils.getElement(selectors.saveButton, HTMLButtonElement))
    if (error !== undefined) return Result.error(error)
    if (saveButton.disabled) return Result.error('saveButton is disabled, cannot save expense')
    saveButton.click()
    await utils.sleep(delays.large)
    utils.log('expense saved')
    return Result.ok('')
  }
  /**
   * Add an expense to the page
   * @param {Expense} data the expense details
   * @returns {Promise<Result>} the result
   */
  async function addExpense({ label, comment, amount, tva }) {
    await utils.sleep(delays.large)
    if (isExpenseFilled(label)) {
      utils.log(`expense already filled : ${label}`)
      return Result.ok('')
    }
    elements.newExpenseBtn.click()
    utils.showResult(await setDate()) // date is not blocking, it can be set manually
    return utils.runSteps([() => setName(label), () => setTtcAmount(amount), () => setTvaAmount(tva), () => setLabel(label), () => setComment(comment), saveExpense])
  }
  /**
   * Get expenses from the clipboard
   * @returns {Promise<{ ok: true, value: Expense[] } | { ok: false, error: string }>} the expenses found
   */
  async function getExpenses() {
    const lines = await utils.readClipboard()
    if (lines.trim() === '') return Result.error('no data found in clipboard')
    if (!lines.includes('\t')) return Result.error('tabs not found in data, does not seems like you copied spreadsheet cells')
    const [headers, ...expensesLines] = lines.split('\n').map(line => line.split('\t'))
    const headerHash = headers?.join('').trim() ?? ''
    const headerHashExpected = 'FraisCommentaireMontant TTCMontant TVA'
    if (headerHash !== headerHashExpected) return Result.error(`header not found or not matching, expected "${headerHashExpected}" but got "${headerHash}"`)
    const expenses = expensesLines.map(([label = '', comment = '', amount = '', tva = '']) => ({ amount: utils.parsePrice(amount).amount, comment, label, tva: utils.parsePrice(tva).amount }))
    if (expenses.length === 0) return Result.error('no expenses found to add')
    if (doOnlyOneExpense) {
      utils.log('doOnlyOneExpense is true, only first expense will be processed', expenses[0])
      return Result.ok(expenses.slice(0, 1))
    }
    return Result.ok(expenses)
  }
  /**
   * Set the title of the expense report
   * @returns {Promise<Result>} the result
   */
  async function setNdfTitle() {
    const { error, value: titleInput } = Result.unwrap(await utils.getElement(selectors.titleNdf, HTMLInputElement))
    if (error !== undefined) return Result.error(error)
    const now = new Date()
    const title = `Note de frais ${now.getMonth() + 1}/${now.getFullYear()}`
    await utils.fillInput(titleInput, title)
    utils.log('expense report title set to', title)
    return Result.ok('')
  }
  /**
   * Validate the expenses array
   * @param {Expense[]} expenses the expenses to validate
   * @returns {Result} the result
   */
  function validateExpenses(expenses) {
    for (const { label, comment, amount, tva } of expenses) {
      if (typeof label !== 'string' || label.trim() === '') return Result.error('invalid expense label')
      if (typeof comment !== 'string') return Result.error('invalid expense comment')
      if (typeof amount !== 'number' || Number.isNaN(amount)) return Result.error('invalid expense amount')
      if (typeof tva !== 'number' || Number.isNaN(tva)) return Result.error('invalid expense tva')
    }
    return Result.ok('')
  }
  /**
   * Add multiple expenses from the clipboard
   * @returns {Promise<Result>} the result
   */
  async function addExpenses() {
    const { error: clipboardError, value: expenses } = Result.unwrap(await getExpenses())
    if (clipboardError !== undefined) return Result.error(clipboardError)
    const { error: invalidError } = Result.unwrap(validateExpenses(expenses))
    if (invalidError !== undefined) return Result.error(invalidError)
    utils.log('adding expenses...', expenses)
    const { error: addError } = Result.unwrap(await utils.runSteps([...expenses.map(expense => () => addExpense(expense)), setNdfTitle]))
    if (addError !== undefined) return Result.error(addError)
    return Result.ok(`${doOnlyOneExpense ? 'single expense' : 'expenses'} added 😎`)
  }
  /**
   * Initialize the script
   * @param {string} reason the reason for initialization
   * @returns {Promise<Result>} the result
   */
  async function init(reason = 'unknown') {
    utils.log(`init reason :`, reason)
    const { error, value: createNdfBtn } = Result.unwrap(await utils.getElement(selectors.createNdfBtn, HTMLButtonElement))
    if (error !== undefined) {
      utils.log('no create ndf button found on this page')
      return Result.ok('')
    }
    elements.createNdfBtn = createNdfBtn
    if (utils.findOne(`#${id}`, document.body, true) !== undefined) {
      utils.log('button already injected')
      return Result.ok('')
    }
    if (createNdfBtn.parentElement === null) return Result.error('button parent element not found')
    const addAll = createButton('Ajouter les dépenses courantes 😎')
    addAll.addEventListener('click', async () => {
      const { error: createError } = Result.unwrap(await createNdf())
      if (createError !== undefined) {
        utils.showError(createError)
        return
      }
      utils.showResult(await addExpenses())
    })
    createNdfBtn.parentElement.append(addAll)
    return Result.ok('button injected')
  }
  const initDebounced = utils.debounce(async (/** @type {string} */ reason) => {
    utils.showResult(await init(reason))
  }, delays.large)
  initDebounced()
  utils.onPageChange(initDebounced)
  utils.onPageMutation(() => {
    if (elements.createNdfBtn.parentElement) return // already init
    initDebounced('mutation')
  })
}

if (globalThis.window) TiimeAutoExpenses()
else module.exports = { createButton }
