import { Shuutils } from './utils.js'

const utils = new Shuutils()

describe('utils', () => {
  it('parsePrice A', () => {
    expect(utils.parsePrice('12,34 €')).toMatchInlineSnapshot(`
      {
        "amount": 12.34,
        "currency": "€",
        "normalizedInput": "12,34 €",
      }
    `)
  })
  it('parsePrice B', () => {
    expect(utils.parsePrice('56.78 €')).toMatchInlineSnapshot(`
      {
        "amount": 56.78,
        "currency": "€",
        "normalizedInput": "56.78 €",
      }
    `)
  })
  it('parsePrice C', () => {
    expect(utils.parsePrice('9,87 $')).toMatchInlineSnapshot(`
      {
        "amount": 9.87,
        "currency": "$",
        "normalizedInput": "9,87 $",
      }
    `)
  })
  it('parsePrice D', () => {
    expect(utils.parsePrice('65.43 $')).toMatchInlineSnapshot(`
      {
        "amount": 65.43,
        "currency": "$",
        "normalizedInput": "65.43 $",
      }
    `)
  })
  it('parsePrice E', () => {
    expect(utils.parsePrice('1000 €')).toMatchInlineSnapshot(`
      {
        "amount": 1000,
        "currency": "€",
        "normalizedInput": "1000 €",
      }
    `)
  })
  it('parsePrice F', () => {
    expect(utils.parsePrice('1,000.99 $')).toMatchInlineSnapshot(`
      {
        "amount": 1000.99,
        "currency": "$",
        "normalizedInput": "1,000.99 $",
      }
    `)
  })
  it('parsePrice G', () => {
    expect(utils.parsePrice('433€29')).toMatchInlineSnapshot(`
      {
        "amount": 0,
        "currency": "",
        "normalizedInput": "433€29",
      }
    `)
  })
})
