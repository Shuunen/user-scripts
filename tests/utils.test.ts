import { Shuutils } from '../src/utils'
import { check } from './utils'

// eslint-disable-next-line @typescript-eslint/naming-convention
const utils = new Shuutils({ id: 'tst', debug: false })

check('utils is defined', typeof utils, 'object')

check('readableString A', utils.readableString('How.to.format.(2023)-[R34dy!orN0t]_x265'), 'How to format 2023 R34dyorN0t x265')
check('readableString B', utils.readableString(' another_Pretty.??complicated__name '), 'another Pretty complicated name')

check('ellipsisWords A', utils.ellipsisWords('This is a test', 3), 'This is a...')
check('ellipsisWords B', utils.ellipsisWords('This is a test', 4), 'This is a test')
