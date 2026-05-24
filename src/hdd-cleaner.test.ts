import { getSize } from './hdd-cleaner.user.js'

describe('hdd-cleaner', () => {
  it('getSize A', () => {
    expect(getSize('seagate skyhawk ai 24 to st24000ve002')).toMatchInlineSnapshot(`
      {
        "mSize": "24",
        "mUnit": "to",
        "size": 24000,
      }
    `)
  })
  it('getSize B', () => {
    expect(getSize('2 to')).toMatchInlineSnapshot(`
      {
        "mSize": "2",
        "mUnit": "to",
        "size": 2000,
      }
    `)
  })
  it('getSize C', () => {
    expect(getSize('1tb')).toMatchInlineSnapshot(`
      {
        "mSize": "1",
        "mUnit": "tb",
        "size": 1000,
      }
    `)
  })
  it('getSize D', () => {
    expect(getSize('500 gb')).toMatchInlineSnapshot(`
      {
        "mSize": "500",
        "mUnit": "gb",
        "size": 500,
      }
    `)
  })
  it('getSize E', () => {
    expect(getSize('12500GB')).toMatchInlineSnapshot(`
      {
        "mSize": "12500",
        "mUnit": "GB",
        "size": 12500,
      }
    `)
  })
})
