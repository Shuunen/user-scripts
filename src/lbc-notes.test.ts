import { getListingId } from './lbc-notes.user.js'

test('getListingId A', () => {
  expect(getListingId('https://www.lbc.co.uk/coronavirus/')).toBeUndefined()
})

test('getListingId B', () => {
  expect(getListingId('https://www.lesuperfoin.fr/ventes_immo/2350010138.htm')).toBe(2_350_010_138)
})

test('getListingId C', () => {
  expect(getListingId('https://www.lebonpoing.fr/sextoys/z350010138.htm')).toBeUndefined()
})
