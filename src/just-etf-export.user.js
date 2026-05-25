// ==UserScript==
// @name         JustETF Export - Get data with you
// @author       Shuunen
// @description  This script help me improve my JustETF user experience
// @downloadURL  https://github.com/Shuunen/user-scripts/raw/master/src/just-etf-export.user.js
// @updateURL    https://github.com/Shuunen/user-scripts/raw/master/src/just-etf-export.user.js
// @grant        none
// @match        https://www.justetf.com/fr/search.html?*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=justetf.com
// @namespace    https://github.com/Shuunen
// @require      https://cdn.jsdelivr.net/gh/Shuunen/monorepo@latest/apps/user-scripts/src/utils.js
// @version      1.2.0
// ==/UserScript==

/* TODO :
- Add export button to export data as CSV to clipboard
- Check column headers to be sure we are on the right page with the right table structure
*/

const options = {
  clickWaitTime: 300,
}

const expectedHeaders = ['Nom du fonds', 'Monnaie fonds', 'Frais p.a.', '1A en %', '3A en %', '5A en %', 'Rend./Risque 1A', 'Rend./Risque 3A', 'Rend./Risque 5A', 'Distribution', 'Positions', 'Réplication', 'ISIN', 'Ticker']

// Provider	ISIN	Ticker	Ticker alt	ETF / Stock	Acc	Shares	plan	PEA	Fees	1Y Perf	3Y Perf	5Y Perf	10Y Perf	R/Risk 1Y	R/Risk 3Y	R/Risk 5Y	Quantalys	Score	Perf. ann.	Volatilité	Sharpe	Date
const csvHeaders = [
  'Provider', // extracted from the fund name, like Amundi, Lyxor, iShares, etc.
  'ISIN', // International Securities Identification Number
  'Ticker', // ticker from JustETF
  'Ticker alt', // empty for now, ticker from Shares
  'ETF / Stock', // name of the ETF or stock, extracted from the fund name
  'Acc', // true if the fund is accumulating, false if distributing
  'Shares', // false for now, indicate if the share is available on Shares or not
  'plan', // empty for now, can be in the free Shares recurring investment plan
  'PEA', // empty for now, eligibility for the French PEA tax advantaged account
  'Fees', // annual fees / TER / Ongoing Charges in percentage
  '1Y Perf',
  '3Y Perf',
  '5Y Perf',
  '10Y Perf', // empty for now, as JustETF does not provide it
  'R/Risk 1Y',
  'R/Risk 3Y',
  'R/Risk 5Y',
  'Quantalys', // empty for now, as JustETF does not provide it
  'Score', // empty for now, as JustETF does not provide it
  'Perf. ann.', // empty for now, as JustETF does not provide it
  'Volatilité', // empty for now, as JustETF does not provide it
  'Sharpe', // empty for now, as JustETF does not provide it
]

/**
 * Map CSV header to data property
 * @param {string} header - CSV header name
 * @param {JustEtfExportData} row - data row
 * @returns {string} mapped value or empty string
 */
function mapHeaderToProperty(header, row) {
  const isAccumulating = row.distribution.toLowerCase().includes('capitalisation')
  const mapping = {
    '10Y Perf': '',
    '1Y Perf': row.perf1y,
    '3Y Perf': row.perf3y,
    '5Y Perf': row.perf5y,
    Acc: isAccumulating ? 'TRUE' : 'FALSE',
    'ETF / Stock': row.name,
    Fees: row.fees,
    ISIN: row.isin,
    PEA: '',
    'Perf. ann.': '',
    Provider: row.provider,
    Quantalys: '',
    'R/Risk 1Y': row.perfRisk1y,
    'R/Risk 3Y': row.perfRisk3y,
    'R/Risk 5Y': row.perfRisk5y,
    Score: '',
    Shares: '',
    Sharpe: '',
    Ticker: row.ticker,
    'Ticker alt': '',
    Volatilité: '',
    plan: '',
  }
  // @ts-expect-error - header is guaranteed to be a valid key from csvHeaders
  return mapping[header] || ''
}

const selectors = {
  cells: 'td',
  columnSelector: '.buttons-collection.buttons-colvis',
  columnToggle: '.buttons-columnVisibility',
  currency: 'td:nth-child(3)',
  distribution: 'td:nth-child(11)',
  fees: 'td:nth-child(4)',
  fundName: 'td:nth-child(2) a.link',
  isin: 'td:nth-child(14)',
  perf1y: 'td:nth-child(5)',
  perf3y: 'td:nth-child(6)',
  perf5y: 'td:nth-child(7)',
  positions: 'td:nth-child(12)',
  replication: 'td:nth-child(13)',
  risk1y: 'td:nth-child(8)',
  risk3y: 'td:nth-child(9)',
  risk5y: 'td:nth-child(10)',
  rows: 'table#etfsTable tbody tr',
  table: 'table#etfsTable',
  ticker: 'td:nth-child(15)',
}

/**
 * Inject export button into the page
 * @returns {HTMLButtonElement} injected button element
 */
function injectButton() {
  const button = document.createElement('button')
  button.textContent = 'Copy table data'
  button.style.position = 'fixed'
  button.style.top = '20px'
  button.style.right = button.style.top
  button.style.zIndex = '2000'
  button.style.borderRadius = '10px'
  button.style.fontWeight = 'bold'
  button.classList.add('btn', 'btn-primary')
  document.body.append(button)
  return button
}

/**
 * @typedef {import('./just-etf-export.types').JustEtfExportData} JustEtfExportData
 */

function JustEtfExport() {
  /* globals Shuutils, RoughNotation */
  const utils = new Shuutils('just-etf-export', true)
  const marker = `${utils.id}-marker`

  /**
   * Extract table cell data
   * @param {string} name - cell name or identifier
   * @param {Element | undefined} cell - table cell element
   * @returns {string} extracted text content
   */
  function extractCellData(name, cell) {
    if (!cell) {
      utils.error('Cell not found', { cell, name })
      return ''
    }
    const text = cell.innerHTML.replaceAll('<br>', ' ').trim()
    if (text === '') {
      utils.error('cell is empty', { cell, name, text })
      utils.showError(`Data extraction failed for cell "${name}"`)
    }
    return text
  }

  /**
   * Extract table row data
   * @param {Element} row - table row element
   * @returns {JustEtfExportData | undefined} extracted data or undefined if extraction failed
   */
  function extractRowData(row) {
    /** @type {HTMLAnchorElement | null} */
    const fundNameLink = row.querySelector(selectors.fundName)
    if (!fundNameLink) return undefined
    const cells = row.querySelectorAll(selectors.cells)
    const fundName = fundNameLink.textContent.trim()
    const provider = fundName.split(' ').at(0) ?? '' // crude way to extract provider from fund name, can be improved
    const name = fundName.replace(provider, '').trim()
    return {
      currency: extractCellData('currency', cells[2]),
      distribution: extractCellData('distribution', cells[10]),
      fees: extractCellData('fees', cells[3]),
      fundName,
      fundUrl: fundNameLink.href,
      isin: extractCellData('isin', cells[13]),
      name,
      perf1y: extractCellData('perf1y', cells[4]),
      perf3y: extractCellData('perf3y', cells[5]),
      perf5y: extractCellData('perf5y', cells[6]),
      perfRisk1y: extractCellData('perfRisk1y', cells[7]),
      perfRisk3y: extractCellData('perfRisk3y', cells[8]),
      perfRisk5y: extractCellData('perfRisk5y', cells[9]),
      positions: extractCellData('positions', cells[11]),
      provider,
      replication: extractCellData('replication', cells[12]),
      ticker: extractCellData('ticker', cells[14]),
    }
  }

  /**
   * Extract table data
   * @returns {Array<JustEtfExportData>} extracted data
   */
  function extractTableData() {
    const rows = document.querySelectorAll(selectors.rows)
    /** @type {Array<JustEtfExportData>} */
    const data = []
    for (const row of rows) {
      const rowData = extractRowData(row)
      if (rowData) data.push(rowData)
    }
    return data
  }

  /**
   * Check table headers to ensure correct page structure
   * @returns {boolean} true if headers match expected structure, false otherwise
   */
  function checkTableHeaders() {
    const headerCells = document.querySelectorAll(`${selectors.table} thead tr th`)
    const actualHeaders = Array.from(headerCells)
      .map(cell => cell.textContent.trim())
      .filter(text => text !== '')
    const headersMatch = expectedHeaders.every((header, index) => header === actualHeaders[index])
    if (headersMatch) {
      utils.log('Table headers match expected structure')
      return true
    }
    utils.error('Table headers do not match expected structure', { actualHeaders, expectedHeaders })
    utils.showError('Table structure has changed or you did not selected the correct columns')
    return false
  }

  /**
   * Get column toggle elements from the column selector menu
   * @returns {Promise<Array<HTMLElement>>} column toggle html elements
   */
  async function getTableColumnToggles() {
    const columnSelector = utils.findOne(selectors.columnSelector)
    if (!columnSelector) {
      utils.showError('Column selector not found, the page structure might have changed')
      return []
    }
    columnSelector.click()
    await utils.sleep(options.clickWaitTime)
    const toggles = utils.findAll(selectors.columnToggle)
    if (toggles.length === 0) {
      utils.showError('Column toggles not found, the page structure might have changed')
      return []
    }
    return toggles
  }

  /**
   * Check table columns visibility to ensure correct data extraction
   */
  async function checkTableColumns() {
    const toggles = await getTableColumnToggles()
    for (const toggle of toggles) {
      const columnName = toggle.textContent.trim()
      const shouldClickEnable = expectedHeaders.includes(columnName) && !toggle.classList.contains('active')
      const shouldClickDisable = !expectedHeaders.includes(columnName) && toggle.classList.contains('active')
      if (shouldClickEnable || shouldClickDisable) {
        utils.log(`${shouldClickEnable ? 'Enabling' : 'Disabling'} column`, { columnName })
        toggle.click()
        // oxlint-disable-next-line no-await-in-loop
        await utils.sleep(options.clickWaitTime)
      }
    }
  }

  /**
   * Check if the page should be processed based on the presence of the table and marker class
   * @returns {boolean} true if the page should be processed, false otherwise
   */
  function shouldProcess() {
    const table = utils.findOne(selectors.table)
    if (!table) {
      utils.log('Table not found, skipping processing')
      return false
    }
    if (table.classList.contains(marker)) return false
    table.classList.add(marker)
    return true
  }

  /**
   * Copy extracted table data to clipboard in CSV format
   * @param {Array<JustEtfExportData>} tableData - data to be copied
   * @returns {Promise<void>} promise that resolves when data is copied
   */
  async function copyTableData(tableData) {
    if (tableData.length === 0) {
      utils.showError('No data to copy')
      return
    }
    const csvContent = tableData.map(row => csvHeaders.map(header => mapHeaderToProperty(header, row)).join('\t')).join('\n')
    try {
      await utils.copyToClipboard(csvContent)
      utils.showSuccess('CSV data copied to clipboard')
    } catch (error) {
      utils.error('Failed to copy table data to clipboard', { error })
      utils.showError('Failed to copy data to clipboard')
    }
  }

  /**
   * Process the page
   */
  async function start() {
    if (!shouldProcess()) return
    utils.log('starting processing', { csvHeaders })
    const headersOk = checkTableHeaders()
    if (!headersOk) {
      await checkTableColumns()
      checkTableHeaders()
    }
    const tableData = extractTableData()
    const button = injectButton()
    button.addEventListener('click', () => copyTableData(tableData))
    utils.showSuccess(`${tableData.length} rows available for csv export`)
    utils.log('stop processing')
  }

  /**
   * Prepare processing on page load and scroll with debouncing to avoid excessive processing
   */
  const startDebounceTime = 500
  const startDebounced = utils.debounce(start, startDebounceTime)
  document.addEventListener('scroll', () => startDebounced())
  utils.onPageChange(startDebounced)
  setTimeout(startDebounced, startDebounceTime)
}

if (globalThis.window) JustEtfExport()
else module.exports = { injectButton, mapHeaderToProperty }
