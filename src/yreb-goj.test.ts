import { computeGbPerDay, computeTopThreshold, formatGbPerDay, isFreeleech, parseAgeToDays, parseSizeToGb } from './yreb-goj.user'

test('yreb-goj is freeleech A', () => {
  expect(isFreeleech('?freeleech=1')).toBe(true)
})

test('yreb-goj is freeleech B', () => {
  expect(isFreeleech('?page=2&freeleech=1&order=desc')).toBe(true)
})

test('yreb-goj is freeleech C', () => {
  expect(isFreeleech('?freeleech=0')).toBe(false)
})

test('yreb-goj is freeleech D', () => {
  expect(isFreeleech('')).toBe(false)
})

test('yreb-goj parse size A', () => {
  expect(parseSizeToGb('1.5 Go')).toBe(1.5)
})

test('yreb-goj parse size B', () => {
  expect(parseSizeToGb('1,5 GB')).toBe(1.5)
})

test('yreb-goj parse size C', () => {
  expect(parseSizeToGb('512 Mo')).toBe(0.5)
})

test('yreb-goj parse size D', () => {
  expect(parseSizeToGb('2 To')).toBe(2048)
})

test('yreb-goj parse size E', () => {
  expect(parseSizeToGb('1024 Ko')).toBe(1 / 1024)
})

test('yreb-goj parse size F', () => {
  expect(parseSizeToGb('what ?')).toBeUndefined()
})

test('yreb-goj parse age A', () => {
  expect(parseAgeToDays('3d')).toBe(3)
})

test('yreb-goj parse age B', () => {
  expect(parseAgeToDays('2mo')).toBe(60)
})

test('yreb-goj parse age C', () => {
  expect(parseAgeToDays('1y')).toBe(365)
})

test('yreb-goj parse age D', () => {
  expect(parseAgeToDays('2w')).toBe(14)
})

test('yreb-goj parse age E', () => {
  expect(parseAgeToDays('12h')).toBe(0.5)
})

test('yreb-goj parse age F', () => {
  expect(parseAgeToDays('36m')).toBe(0.025)
})

test('yreb-goj parse age G', () => {
  expect(parseAgeToDays('30s')).toBeCloseTo(30 / 86_400)
})

test('yreb-goj parse age H', () => {
  expect(parseAgeToDays('soon')).toBeUndefined()
})

test('yreb-goj compute gb per day A', () => {
  expect(computeGbPerDay('10 Go', '2d', '4')).toBe(20)
})

test('yreb-goj compute gb per day B', () => {
  expect(computeGbPerDay('10 Go', '2d', '1 234')).toBe(6170)
})

test('yreb-goj compute gb per day C, younger than a day', () => {
  // else a one hour old torrent would get a x24 boost over the older ones
  expect(computeGbPerDay('3 Go', '1h', '8')).toBe(24)
})

test('yreb-goj compute gb per day D, unparsable size', () => {
  expect(computeGbPerDay('', '2d', '4')).toBeUndefined()
})

test('yreb-goj compute gb per day E, unparsable age', () => {
  expect(computeGbPerDay('10 Go', '', '4')).toBeUndefined()
})

test('yreb-goj compute gb per day F, unparsable completions', () => {
  expect(computeGbPerDay('10 Go', '2d', '-')).toBeUndefined()
})

test('yreb-goj format gb per day A', () => {
  expect(formatGbPerDay(1234.5)).toBe('1235')
})

test('yreb-goj format gb per day B', () => {
  expect(formatGbPerDay(12.345)).toBe('12')
})

test('yreb-goj format gb per day C', () => {
  expect(formatGbPerDay(1.2345)).toBe('1')
})

test('yreb-goj format gb per day D', () => {
  expect(formatGbPerDay(0.005)).toBe('0')
})

test('yreb-goj format gb per day E', () => {
  expect(formatGbPerDay(undefined)).toBe('—')
})

test('yreb-goj compute top threshold A', () => {
  expect(computeTopThreshold([1, 2, 3, 4, 5, 6, 7, 8, 9, 10])).toBe(9)
})

test('yreb-goj compute top threshold B, unusable values are ignored', () => {
  expect(computeTopThreshold([10, 20, 0, Number.NEGATIVE_INFINITY, Number.NaN])).toBe(20)
})

test('yreb-goj compute top threshold C, nothing to highlight', () => {
  expect(computeTopThreshold([])).toBe(Number.POSITIVE_INFINITY)
})
