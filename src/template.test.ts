import { cleanTitle } from './template.user'

test('template clean title A', () => {
  expect(cleanTitle('Nice product')).toBe('Nice product')
})

test('template clean title B', () => {
  expect(cleanTitle('  Nice   product  ')).toBe('Nice product')
})

test('template clean title C', () => {
  expect(cleanTitle('Nice product [new] (2024)')).toBe('Nice product')
})

test('template clean title D', () => {
  expect(cleanTitle('   ')).toBe('')
})
