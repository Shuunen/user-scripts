// Global type declarations for userscript dependencies

/**
 * Shuutils class that's globally available through userscript @require directive
 * Uses the same class definition as the local utils.js file
 * @see utils.js
 */
declare const Shuutils: typeof import('./utils.js').Shuutils

/**
 * RoughNotation library that's globally available through userscript @require directive
 * Uses types from the installed rough-notation package
 * @see https://unpkg.com/rough-notation/lib/rough-notation.iife.js
 */
declare const RoughNotation: typeof import('rough-notation')

declare const idbKeyval: {
  get: <Type>(key: string) => Promise<Type>
  set: (key: string, value: unknown) => Promise<void>
  clear: () => Promise<void>
}

declare const tailwind: {
  config: Record<string, unknown>
}

declare const Appwrite: typeof import('appwrite')

/**
 * Objects exposed by the qBittorrent web ui on the page, only the bits used by qbit-aio are declared here
 * @see https://github.com/qbittorrent/qBittorrent/tree/master/src/webui/www/private
 */
declare const torrentsTable: {
  columns: TorrentsTableColumn[] & Record<string, TorrentsTableColumn | undefined>
  getCurrentTorrentID: () => string | undefined
  newColumn: (...args: [name: string, style: string, caption: string, defaultWidth: number, defaultVisible: boolean]) => void
  fixedTableHeader: HTMLElement
  rerender: () => void
  rows: Map<string, { full_data: { added_on: number; last_activity?: number; ratio: number } }>
  setSortedColumn: (name: string) => void
  setupHeaderMenu: () => void
  updateTableHeaders: () => void
}

/** A column of the qBittorrent torrents table, `getRowValue` & `updateTd` are meant to be overridden */
declare type TorrentsTableColumn = {
  dataProperties: string[]
  getRowValue: (row: { full_data: { added_on: number; last_activity?: number; ratio: number } }) => number
  updateTd: (td: HTMLElement, row: { full_data: { added_on: number; last_activity?: number; ratio: number } }) => void
}

declare const qBittorrent: {
  PropTrackers: {
    updateData: () => void
  }
}
