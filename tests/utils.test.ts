import { expect, it } from 'vitest'
import { Shuutils } from '../src/utils'
import { check } from './utils'

// eslint-disable-next-line @typescript-eslint/naming-convention
const utils = new Shuutils({ debug: false, id: 'tst' })

check('utils is defined', typeof utils, 'object')

check('readableString A', utils.readableString('How.to.format.(2023)-[R34dy!orN0t]_x265'), 'How to format 2023 R34dyorN0t x265')
check('readableString B', utils.readableString(' another_Pretty.??complicated__name '), 'another Pretty complicated name')

check('ellipsisWords A', utils.ellipsisWords('This is a test', 3), 'This is a...')
check('ellipsisWords B', utils.ellipsisWords('This is a test', 4), 'This is a test')

const priceRules = { isHigherBetter: false, scoreMax: 2, scoreMin: 0, valueMax: 10_000, valueMin: 5000 }
it('rangedScore price A', () => { expect(utils.rangedScore(priceRules, 2000)).toBe(2) })
it('rangedScore price B', () => { expect(utils.rangedScore(priceRules, 5000)).toBe(2) })
it('rangedScore price C', () => { expect(utils.rangedScore(priceRules, 6000)).toBe(1.6) })
it('rangedScore price D', () => { expect(utils.rangedScore(priceRules, 7500)).toBe(1) })
it('rangedScore price E', () => { expect(utils.rangedScore(priceRules, 8000)).toBe(0.8) })
it('rangedScore price F', () => { expect(utils.rangedScore(priceRules, 10_000)).toBe(0) })
it('rangedScore price G', () => { expect(utils.rangedScore(priceRules, 11_000)).toBe(0) })

const batteryRules = { isHigherBetter: true, scoreMax: 100, scoreMin: 0, valueMax: 10, valueMin: 0 }
it('rangedScore battery A', () => { expect(utils.rangedScore(batteryRules, 0)).toBe(0) })
it('rangedScore battery B', () => { expect(utils.rangedScore(batteryRules, 1)).toBe(10) })
it('rangedScore battery C', () => { expect(utils.rangedScore(batteryRules, 2)).toBe(20) })
it('rangedScore battery D', () => { expect(utils.rangedScore(batteryRules, 3)).toBe(30) })
it('rangedScore battery E', () => { expect(utils.rangedScore(batteryRules, 4)).toBe(40) })
it('rangedScore battery F', () => { expect(utils.rangedScore(batteryRules, 5)).toBe(50) })
it('rangedScore battery G', () => { expect(utils.rangedScore(batteryRules, 6)).toBe(60) })
it('rangedScore battery H', () => { expect(utils.rangedScore(batteryRules, 7)).toBe(70) })
it('rangedScore battery I', () => { expect(utils.rangedScore(batteryRules, 8)).toBe(80) })
it('rangedScore battery J', () => { expect(utils.rangedScore(batteryRules, 9)).toBe(90) })
it('rangedScore battery K', () => { expect(utils.rangedScore(batteryRules, 10)).toBe(100) })

const weightRules = { isHigherBetter: false, scoreMax: 100, scoreMin: 0, valueMax: 5, valueMin: -5 }
it('rangedScore weight A', () => { expect(utils.rangedScore(weightRules, -5)).toBe(100) })
it('rangedScore weight B', () => { expect(utils.rangedScore(weightRules, -4)).toBe(90) })
it('rangedScore weight C', () => { expect(utils.rangedScore(weightRules, 0)).toBe(50) })
it('rangedScore weight D', () => { expect(utils.rangedScore(weightRules, 4)).toBe(10) })

