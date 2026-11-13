// @vitest-environment happy-dom

import './utils.js'

/**
 * Load a fresh utils.js with window hidden, because the module only exports when there is no window
 * @returns the module exports and fresh instances
 */
async function setup() {
  vi.useRealTimers()
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
  document.body.innerHTML = ''
  document.head.innerHTML = ''
  vi.resetModules()
  vi.stubGlobal('window', undefined)
  const { Result, Shuutils: Utils } = await import('./utils.js')
  vi.unstubAllGlobals()
  return { Result, Utils, debugUtils: new Utils('', true), utils: new Utils('test', false) }
}

describe('utils module', () => {
  it('does not export anything when a window exists', async () => {
    await setup()
    vi.resetModules()
    const loaded = (await import('./utils.js')) as Record<string, unknown>
    expect(loaded.Shuutils).toBeUndefined()
  })

  it('uses default constructor values', async () => {
    const { Utils } = await setup()
    const defaults = new Utils()
    expect(defaults.id).toBe('shu-app')
    expect(defaults.willDebug).toBe(false)
  })
})

describe('utils Result', () => {
  it('ok and error', async () => {
    const { Result } = await setup()
    expect(Result.ok(42)).toStrictEqual({ ok: true, value: 42 })
    expect(Result.error('oh no')).toStrictEqual({ error: 'oh no', ok: false })
  })

  it('trySafe with a function', async () => {
    const { Result } = await setup()
    expect(Result.trySafe(() => 1)).toStrictEqual({ ok: true, value: 1 })
    expect(
      Result.trySafe(() => {
        throw new Error('boom')
      }).ok,
    ).toBe(false)
  })

  it('trySafe with a promise', async () => {
    const { Result } = await setup()
    await expect(Result.trySafe(Promise.resolve(2))).resolves.toStrictEqual({ ok: true, value: 2 })
    const rejected = Promise.reject(new Error('nope'))
    await expect(Result.trySafe(rejected)).resolves.toMatchObject({ ok: false })
  })

  it('unwrap', async () => {
    const { Result } = await setup()
    expect(Result.unwrap(Result.ok('a'))).toStrictEqual({ error: undefined, value: 'a' })
    expect(Result.unwrap(Result.error('b'))).toStrictEqual({ error: 'b', value: undefined })
  })
})

describe('utils logging', () => {
  it('debug logs only when debugging, with or without id', async () => {
    const { Utils, debugUtils, utils } = await setup()
    const log = vi.spyOn(console, 'log').mockReturnValue(undefined)
    utils.debug('hidden')
    expect(log).not.toHaveBeenCalledWith('test :', 'hidden')
    new Utils('abc', true).debug('shown')
    expect(log).toHaveBeenCalledWith('abc :', 'shown')
    debugUtils.debug('no id')
    expect(log).toHaveBeenCalledWith('no id')
  })

  it('log, error, warn, groupCollapsed, groupEnd with and without id', async () => {
    const { debugUtils, utils } = await setup()
    const log = vi.spyOn(console, 'log').mockReturnValue(undefined)
    const error = vi.spyOn(console, 'error').mockReturnValue(undefined)
    const warn = vi.spyOn(console, 'warn').mockReturnValue(undefined)
    const group = vi.spyOn(console, 'groupCollapsed').mockReturnValue(undefined)
    const groupEnd = vi.spyOn(console, 'groupEnd').mockReturnValue(undefined)
    utils.log('a')
    debugUtils.log('b')
    utils.error('c')
    debugUtils.error('d')
    utils.warn('e')
    debugUtils.warn('f')
    utils.groupCollapsed('g')
    debugUtils.groupCollapsed('h')
    utils.groupEnd()
    expect(log).toHaveBeenCalledWith('test :', 'a')
    expect(log).toHaveBeenCalledWith('b')
    expect(error).toHaveBeenCalledWith('test :', 'c')
    expect(error).toHaveBeenCalledWith('d')
    expect(warn).toHaveBeenCalledWith('test :', 'e')
    expect(warn).toHaveBeenCalledWith('f')
    expect(group).toHaveBeenCalledWith('test :', 'g')
    expect(group).toHaveBeenCalledWith('h')
    expect(groupEnd).toHaveBeenCalledOnce()
  })

  it('showError, showLog, showSuccess', async () => {
    const { utils } = await setup()
    vi.useFakeTimers()
    const log = vi.spyOn(console, 'log').mockReturnValue(undefined)
    const error = vi.spyOn(console, 'error').mockReturnValue(undefined)
    utils.showError('bad')
    utils.showLog('fine')
    utils.showSuccess('yay')
    expect(error).toHaveBeenCalledWith('test :', 'bad')
    expect(log).toHaveBeenCalledWith('test :', 'fine')
    expect(log).toHaveBeenCalledWith('test :', 'yay')
    expect(document.querySelectorAll('.shu-toast')).toHaveLength(3)
  })

  it('showResult', async () => {
    const { Result, utils } = await setup()
    vi.useFakeTimers()
    const showError = vi.spyOn(utils, 'showError').mockReturnValue(undefined)
    const showLog = vi.spyOn(utils, 'showLog').mockReturnValue(undefined)
    utils.showResult(Result.error('bad'))
    utils.showResult(Result.ok('good'))
    utils.showResult(Result.ok(''))
    expect(showError).toHaveBeenCalledExactlyOnceWith('bad')
    expect(showLog).toHaveBeenCalledExactlyOnceWith('good')
  })
})

describe('utils toasts', () => {
  it('adds, shows and hides toasts of each type', async () => {
    const { utils } = await setup()
    vi.useFakeTimers()
    utils.toastError('e')
    utils.toastInfo('i')
    utils.toastSuccess('s')
    expect(document.querySelectorAll('.shu-toast')).toHaveLength(3)
    await vi.advanceTimersByTimeAsync(150)
    const first = document.querySelector<HTMLElement>('.shu-toast')
    expect(first?.style.opacity).toBe('1')
    await vi.advanceTimersByTimeAsync(5000)
    expect(document.querySelectorAll('.shu-toast')).toHaveLength(0)
  })

  it('keeps a toast without delay', async () => {
    const { utils } = await setup()
    vi.useFakeTimers()
    utils.toastInfo('stay', 0)
    await vi.advanceTimersByTimeAsync(10_000)
    expect(document.querySelectorAll('.shu-toast')).toHaveLength(1)
  })
})

describe('utils strings and numbers', () => {
  it('capitalize', async () => {
    const { utils } = await setup()
    expect(utils.capitalize('hello World')).toBe('Hello World')
  })

  it('ellipsis', async () => {
    const { utils } = await setup()
    expect(utils.ellipsis('hello world', 5)).toBe('hello...')
    expect(utils.ellipsis('hello world', 11)).toBe('hello world')
    expect(utils.ellipsis()).toBe('')
  })

  it('ellipsisWords', async () => {
    const { utils } = await setup()
    expect(utils.ellipsisWords('hello world', 1)).toBe('hello...')
    expect(utils.ellipsisWords('hello world', 2)).toBe('hello world')
    expect(utils.ellipsisWords()).toBe('')
  })

  it('getRandomNumber', async () => {
    const { utils } = await setup()
    vi.spyOn(Math, 'random').mockReturnValue(0)
    expect(utils.getRandomNumber()).toBe(0)
    expect(utils.getRandomNumber(5, 10)).toBe(5)
  })

  it('pickRandom', async () => {
    const { utils } = await setup()
    vi.spyOn(Math, 'random').mockReturnValue(0.99)
    expect(utils.pickRandom([1, 2, 3])).toBe(3)
  })

  it('readableString', async () => {
    const { utils } = await setup()
    expect(utils.readableString('  Hello_world-Élan <b>bold</b> ok.  ')).toBe('Hello world Elan bboldb ok')
  })

  it('removeAccents', async () => {
    const { utils } = await setup()
    expect(utils.removeAccents('éàù')).toBe('eau')
  })

  it('round', async () => {
    const { utils } = await setup()
    expect(utils.round(1.2345)).toBe(1.23)
    expect(utils.round(1.2345, 0)).toBe(1)
  })

  it('tw', async () => {
    const { utils } = await setup()
    expect(utils.tw('h-56 w-96')).toStrictEqual(['h-56', 'w-96'])
  })

  it('parsePrice with sign, plus, currency position and garbage', async () => {
    const { utils } = await setup()
    expect(utils.parsePrice('-€12,34')).toMatchObject({ amount: -12.34, currency: '€' })
    expect(utils.parsePrice('+$12.34')).toMatchObject({ amount: 12.34, currency: '$' })
    expect(utils.parsePrice('12 345,67 €')).toMatchObject({ amount: 12_345.67, currency: '€' })
    expect(utils.parsePrice('42')).toMatchObject({ amount: 42, currency: '' })
    expect(utils.parsePrice('abc')).toMatchObject({ amount: 0, currency: '' })
  })

  it('rangedScore', async () => {
    const { utils } = await setup()
    const small = { isHigherBetter: true, scoreMax: 10, scoreMin: 0, valueMax: 100, valueMin: 0 }
    const big = { ...small, scoreMax: 100 }
    const lower = { ...small, isHigherBetter: false }
    expect(utils.rangedScore(small, 55)).toBe(5.5)
    expect(utils.rangedScore(lower, 55)).toBe(4.5)
    expect(utils.rangedScore(big, 55.5)).toBe(56)
    expect(utils.rangedScore(small, -10)).toBe(0)
    expect(utils.rangedScore(lower, -10)).toBe(10)
    expect(utils.rangedScore(small, 200)).toBe(10)
    expect(utils.rangedScore(lower, 200)).toBe(0)
  })
})

describe('utils async helpers', () => {
  it('sleep', async () => {
    const { utils } = await setup()
    vi.useFakeTimers()
    const promise = utils.sleep(1000)
    await vi.advanceTimersByTimeAsync(1000)
    await expect(promise).resolves.toBeUndefined()
  })

  it('debounce', async () => {
    const { utils } = await setup()
    vi.useFakeTimers()
    const callback = vi.fn<(...parameters: unknown[]) => void>()
    const debounced = utils.debounce(callback, 100) as (...parameters: unknown[]) => Promise<void>
    void debounced(1)
    const second = debounced(2)
    await vi.advanceTimersByTimeAsync(100)
    await second
    expect(callback).toHaveBeenCalledExactlyOnceWith(2)
  })

  it('throttle', async () => {
    const { utils } = await setup()
    vi.useFakeTimers()
    const callback = vi.fn<(...parameters: unknown[]) => void>()
    const throttled = utils.throttle(callback, 100) as (...parameters: unknown[]) => void
    throttled(1)
    throttled(2)
    await vi.advanceTimersByTimeAsync(100)
    throttled(3)
    expect(callback.mock.calls).toStrictEqual([[1], [3]])
  })

  it('runSteps stops at the first error', async () => {
    const { Result, utils } = await setup()
    const after = vi.fn<() => { ok: true; value: string }>(() => Result.ok(''))
    await expect(utils.runSteps([() => Result.ok(''), () => Result.ok('')])).resolves.toStrictEqual({ ok: true, value: '' })
    await expect(utils.runSteps([() => Result.error('stop'), after])).resolves.toStrictEqual({ error: 'stop', ok: false })
    expect(after).not.toHaveBeenCalled()
  })

  it('onPageChange calls back on change then keeps watching', async () => {
    const { utils } = await setup()
    vi.useFakeTimers()
    const log = vi.spyOn(console, 'log').mockReturnValue(undefined)
    const callback = vi.fn<(...parameters: unknown[]) => void>()
    void utils.onPageChange(callback, '', 10)
    await vi.advanceTimersByTimeAsync(10)
    expect(callback).toHaveBeenCalledExactlyOnceWith(document.location.href)
    await vi.advanceTimersByTimeAsync(10)
    expect(callback).toHaveBeenCalledOnce()
    void utils.onPageChange(undefined, '', 10)
    await vi.advanceTimersByTimeAsync(10)
    expect(log).toHaveBeenCalledWith('test :', 'empty callback')
  })

  it('clipboard', async () => {
    const { utils } = await setup()
    const writeText = vi.fn<(text: string) => Promise<void>>().mockResolvedValue(undefined)
    const readText = vi.fn<() => Promise<string>>().mockResolvedValue('from clipboard')
    vi.spyOn(console, 'log').mockReturnValue(undefined)
    vi.stubGlobal('navigator', { clipboard: { readText, writeText } })
    await utils.copyToClipboard('text')
    await utils.copyToClipboard({ answer: 1 })
    expect(writeText.mock.calls).toStrictEqual([['text'], ['{"answer":1}']])
    await expect(utils.readClipboard()).resolves.toBe('from clipboard')
  })
})

describe('utils loadTs', () => {
  it('refuses to load without Babel', async () => {
    const { utils } = await setup()
    const error = vi.spyOn(console, 'error').mockReturnValue(undefined)
    await expect(utils.loadTs('a.ts')).resolves.toBe(utils)
    expect(error).toHaveBeenCalledWith('test :', 'Babel is not loaded, cannot load utils')
  })

  it('loads files, handles http errors and import errors', async () => {
    const { Utils } = await setup()
    const log = vi.spyOn(console, 'log').mockReturnValue(undefined)
    const error = vi.spyOn(console, 'error').mockReturnValue(undefined)
    const target = new Utils('loader', false)
    const fetchMock = vi.fn<(url: string) => Promise<unknown>>(url => {
      if (url.endsWith('missing.ts')) return Promise.resolve({ ok: false, status: 404 })
      return Promise.resolve({ ok: true, text: () => Promise.resolve('export const answer = 42') })
    })
    vi.stubGlobal('fetch', fetchMock)
    vi.stubGlobal('Babel', { transform: (code: string) => ({ code }) })
    vi.spyOn(URL, 'createObjectURL').mockReturnValue('data:text/javascript,export const answer = 42')
    vi.spyOn(URL, 'revokeObjectURL').mockReturnValue(undefined)
    await target.loadTs(['good.ts', 'missing.ts'])
    expect((target as unknown as Record<string, unknown>).answer).toBe(42)
    expect(log).toHaveBeenCalledWith('loader :', 'Loaded : good.ts')
    expect(error).toHaveBeenCalledWith('loader :', 'Failed to load missing.ts', expect.any(Error))
    await target.loadTs('single.ts')
    expect(fetchMock).toHaveBeenCalledTimes(3)
  })
})

describe('utils dom', () => {
  it('animateCss with and without cleanup', async () => {
    const { utils } = await setup()
    const element = document.createElement('div')
    await utils.animateCss(element, 'bounce', false)
    expect(element.classList.contains('animate__bounce')).toBe(true)
    const promise = utils.animateCss(element, 'bounce')
    element.dispatchEvent(new Event('animationend'))
    await promise
    expect(element.classList.contains('animate__bounce')).toBe(false)
  })

  it('fillInput', async () => {
    const { utils } = await setup()
    vi.useFakeTimers()
    const input = document.createElement('input')
    const onInput = vi.fn<() => void>()
    input.addEventListener('input', onInput)
    const promise = utils.fillInput(input, 22.47)
    await vi.advanceTimersByTimeAsync(300)
    await promise
    expect(input.value).toBe('22.47')
    expect(onInput).toHaveBeenCalledOnce()
  })

  it('fillLikeHuman', async () => {
    const { utils } = await setup()
    vi.spyOn(utils, 'sleep').mockResolvedValue(undefined)
    const input = document.createElement('input')
    const onChange = vi.fn<() => void>()
    input.addEventListener('change', onChange)
    await utils.fillLikeHuman(input, 'abc')
    expect(input.value).toBe('abc')
    expect(onChange).toHaveBeenCalledOnce()
  })

  it('findAll, findFirst, findOne', async () => {
    const { debugUtils, utils } = await setup()
    const warn = vi.spyOn(utils, 'warn').mockReturnValue(undefined)
    const error = vi.spyOn(utils, 'error').mockReturnValue(undefined)
    const log = vi.spyOn(debugUtils, 'log').mockReturnValue(undefined)
    document.body.innerHTML = '<p class="a">1</p><p class="a">2</p>'
    expect(utils.findAll('.a')).toHaveLength(2)
    expect(warn).not.toHaveBeenCalled()
    expect(utils.findAll('.none')).toHaveLength(0)
    expect(warn).toHaveBeenCalledOnce()
    expect(utils.findAll('.none', document, true)).toHaveLength(0)
    expect(warn).toHaveBeenCalledOnce()
    expect(debugUtils.findAll('.a')).toHaveLength(2)
    expect(log).toHaveBeenCalledOnce()
    expect(utils.findFirst('.a')?.textContent).toBe('1')
    expect(utils.findOne('.a')?.textContent).toBe('1')
    utils.findAll('p.a', document, true)
    expect(error).not.toHaveBeenCalled()
    expect(() => utils.findAll('', document, true)).toThrow(/empty/u)
    utils.findAll('a', document, true)
    expect(error).toHaveBeenCalledTimes(2)
  })

  it('getElement', async () => {
    const { utils } = await setup()
    document.body.innerHTML = '<input id="name" /><div id="box"></div>'
    vi.spyOn(utils, 'warn').mockReturnValue(undefined)
    vi.spyOn(utils, 'waitToDetect').mockImplementation(selector => Promise.resolve(utils.findOne(selector, document, true)))
    const found = await utils.getElement('#name', HTMLInputElement)
    expect(found.ok).toBe(true)
    await expect(utils.getElement('#none', HTMLInputElement)).resolves.toStrictEqual({ error: 'no element found for selector "#none"', ok: false })
    await expect(utils.getElement('#box', HTMLInputElement)).resolves.toStrictEqual({ error: 'element found for selector "#box" is not a HTMLInputElement', ok: false })
    const direct = await utils.getElement('#name', HTMLInputElement, false)
    expect(direct.ok).toBe(true)
  })

  it('waitToDetect finds or gives up', async () => {
    const { utils } = await setup()
    vi.spyOn(utils, 'warn').mockReturnValue(undefined)
    const log = vi.spyOn(console, 'log').mockReturnValue(undefined)
    document.body.innerHTML = '<span id="here"></span>'
    await expect(utils.waitToDetect('#here', 1)).resolves.toBeInstanceOf(HTMLElement)
    await expect(utils.waitToDetect('#gone', 1)).resolves.toBeUndefined()
    expect(log).toHaveBeenCalledWith('test :', 'stop searching after 5 fails to detect : "#gone"')
  })

  it('hideElement in normal and debug mode', async () => {
    const { debugUtils, utils } = await setup()
    const element = document.createElement('div')
    utils.hideElement(element, 'because')
    expect(element.style.display).toBe('none')
    expect(element.style.visibility).toBe('hidden')
    expect(element.dataset.hiddenCause).toBe('because')
    const other = document.createElement('div')
    debugUtils.hideElement(other, 'debug')
    expect(other.style.visibility).toBe('visible')
    expect(other.style.opacity).toBe('1')
    expect(other.style.boxShadow).toBe('0 0 10px red')
  })

  it('hideElements', async () => {
    const { utils } = await setup()
    const debug = vi.spyOn(utils, 'debug').mockReturnValue(undefined)
    document.body.innerHTML = '<p class="x">1</p><p class="y">2</p>'
    utils.hideElements({ first: '.x', second: '.y' }, 'ads')
    expect(document.querySelectorAll('[data-hidden-cause="ads"]')).toHaveLength(2)
    expect(debug).toHaveBeenCalledWith('hideElements has hidden 2 elements')
    debug.mockClear()
    utils.hideElements({ first: '.x' }, 'ads')
    expect(debug).not.toHaveBeenCalled()
  })

  it('injectStyles', async () => {
    const { utils } = await setup()
    const log = vi.spyOn(console, 'log').mockReturnValue(undefined)
    utils.injectStyles()
    expect(log).toHaveBeenCalledWith('test :', 'cannot inject empty style stuff')
    const insert = vi.spyOn(document.head, 'insertAdjacentHTML').mockReturnValue(undefined)
    utils.injectStyles('https://example.com/style.css')
    expect(insert).toHaveBeenCalledWith('beforeend', '<link rel="stylesheet" href="https://example.com/style.css" />')
    utils.injectStyles('https://example.com/a.css\nbody { color: red }')
    utils.injectStyles('https://example.com/image')
    utils.injectStyles('body { color: red }')
    expect(document.body.querySelectorAll('style')).toHaveLength(3)
  })

  it('onPageMutation ignores toasts, text nodes and removals', async () => {
    const { utils } = await setup()
    const callback = vi.fn<(...parameters: unknown[]) => void>()
    const observer = utils.onPageMutation(callback)
    const added = document.createElement('div')
    document.body.append(added)
    await utils.sleep(5)
    expect(callback).toHaveBeenCalledExactlyOnceWith(added)
    const toast = document.createElement('div')
    toast.className = 'shu-toast'
    document.body.append(toast)
    await utils.sleep(5)
    document.body.append('some text')
    await utils.sleep(5)
    added.remove()
    await utils.sleep(5)
    observer.disconnect()
    expect(callback).toHaveBeenCalledOnce()
  })
})
