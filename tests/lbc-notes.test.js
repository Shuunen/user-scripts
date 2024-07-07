import { expect, it } from 'vitest'
import { getListingId } from '../src/lbc-notes.user.js'

it('getListingId A', () => {
  expect(getListingId('https://www.lbc.co.uk/coronavirus/')).toBeUndefined()
})

it('getListingId B', () => {
  expect(getListingId('https://www.lesuperfoin.fr/ventes_immo/2350010138.htm')).toBe(2_350_010_138)
})

it('getListingId C', () => {
  expect(getListingId('https://www.lebonpoing.fr/sextoys/z350010138.htm')).toBeUndefined()
})
