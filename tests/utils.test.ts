import { check, checksRun } from 'shuutils'
import { Shuutils } from '../src/utils'

// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/naming-convention
const utils = new Shuutils({ id: 'tst', debug: false })

check('utils is defined', typeof utils, 'object')

checksRun()
