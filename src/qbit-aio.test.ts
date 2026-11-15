import {
  buildRankIndex,
  countPeers,
  encodeTrackerUrl,
  getRatioPerPeriod,
  getSeedingScore,
  getSeedingScores,
  getTierBounds,
  getTierEmoji,
  getRemovedTrackers,
  getTrackersToRemove,
  getUselessTrackers,
  isRealTracker,
  isUselessTracker,
} from './qbit-aio.user'

test('qbit-aio is real tracker A', () => {
  expect(isRealTracker('http://tracker.org/announce')).toBe(true)
})

test('qbit-aio is real tracker B', () => {
  expect(isRealTracker('** [DHT] **')).toBe(false)
})

test('qbit-aio is real tracker C', () => {
  expect(isRealTracker('')).toBe(false)
})

test('qbit-aio get trackers to remove A', () => {
  const urls = ['** [DHT] **', '** [PeX] **', '** [LSD] **', 'http://a.org/announce', 'http://b.org/announce']
  expect(getTrackersToRemove(urls, 'http://a.org/announce')).toStrictEqual(['http://b.org/announce'])
})

test('qbit-aio get trackers to remove B', () => {
  expect(getTrackersToRemove(['** [DHT] **', 'http://a.org/announce'], 'http://a.org/announce')).toStrictEqual([])
})

test('qbit-aio get trackers to remove C', () => {
  expect(getTrackersToRemove([], 'http://a.org/announce')).toStrictEqual([])
})

test('qbit-aio is real tracker D', () => {
  expect(isRealTracker('endpoint|http://a.org/announce|1.2.3.4:6881|1')).toBe(false)
})

test('qbit-aio get trackers to remove D', () => {
  const urls = ['** [DHT] **', 'http://a.org/announce', 'endpoint|http://a.org/announce|1.2.3.4:6881|1', 'http://b.org/announce', 'endpoint|http://b.org/announce|1.2.3.4:6881|1']
  expect(getTrackersToRemove(urls, 'http://a.org/announce')).toStrictEqual(['http://b.org/announce'])
})

const tracker = (url: string, status: number, peers: number, seeds: number, leeches: number) => ({ num_leeches: leeches, num_peers: peers, num_seeds: seeds, status, url })

test('qbit-aio count peers A', () => {
  expect(countPeers(tracker('http://a.org/announce', 2, 5, 2, 3))).toBe(10)
})

test('qbit-aio count peers B', () => {
  expect(countPeers(tracker('http://a.org/announce', 2, 0, 0, 0))).toBe(0)
})

test('qbit-aio count peers C : the api reports -1 for the unknown counts', () => {
  expect(countPeers(tracker('http://a.org/announce', 4, -1, -1, -1))).toBe(0)
})

test('qbit-aio get useless trackers A : keeps a working tracker with peers', () => {
  expect(getUselessTrackers([tracker('http://a.org/announce', 2, 5, 2, 3)])).toStrictEqual([])
})

test('qbit-aio get useless trackers B : drops a non working tracker', () => {
  expect(getUselessTrackers([tracker('http://a.org/announce', 4, 5, 2, 3)])).toStrictEqual(['http://a.org/announce'])
})

test('qbit-aio get useless trackers B2 : drops a tracker in error', () => {
  expect(getUselessTrackers([tracker('http://a.org/announce', 5, -1, -1, -1)])).toStrictEqual(['http://a.org/announce'])
})

test('qbit-aio get useless trackers B3 : drops an unreachable tracker', () => {
  expect(getUselessTrackers([tracker('http://a.org/announce', 6, -1, -1, -1)])).toStrictEqual(['http://a.org/announce'])
})

test('qbit-aio get useless trackers C : drops a working tracker without any peer', () => {
  expect(getUselessTrackers([tracker('http://a.org/announce', 2, 0, 0, 0)])).toStrictEqual(['http://a.org/announce'])
})

test('qbit-aio get useless trackers D : never drops the pseudo trackers', () => {
  expect(getUselessTrackers([tracker('** [DHT] **', 0, 0, 0, 0), tracker('** [PeX] **', 2, 0, 0, 0)])).toStrictEqual([])
})

test('qbit-aio get useless trackers E : mixed list', () => {
  const trackers = [tracker('** [LSD] **', 0, 0, 0, 0), tracker('http://ok.org/announce', 2, 1, 0, 0), tracker('http://dead.org/announce', 4, -1, -1, -1), tracker('http://empty.org/announce', 2, 0, 0, 0)]
  expect(getUselessTrackers(trackers)).toStrictEqual(['http://dead.org/announce', 'http://empty.org/announce'])
})

test('qbit-aio get useless trackers G : keeps the trackers not contacted yet', () => {
  expect(getUselessTrackers([tracker('http://fresh.org/announce', 1, -1, -1, -1)])).toStrictEqual([])
})

test('qbit-aio get useless trackers H : keeps the trackers still updating', () => {
  expect(getUselessTrackers([tracker('http://slow.org/announce', 3, 0, 0, 0)])).toStrictEqual([])
})

test('qbit-aio is useless tracker A : a working tracker with peers is kept', () => {
  expect(isUselessTracker(tracker('http://a.org/announce', 2, 1, 0, 0))).toBe(false)
})

test('qbit-aio is useless tracker B : a disabled pseudo tracker is not judged on its peers', () => {
  expect(isUselessTracker(tracker('** [DHT] **', 0, 0, 0, 0))).toBe(false)
})

test('qbit-aio get useless trackers F : empty list', () => {
  expect(getUselessTrackers([])).toStrictEqual([])
})

test('qbit-aio get removed trackers A : all gone', () => {
  expect(getRemovedTrackers(['http://a.org/announce', 'http://b.org/announce'], ['http://c.org/announce'])).toStrictEqual(['http://a.org/announce', 'http://b.org/announce'])
})

test('qbit-aio get removed trackers B : none gone, the api matched nothing', () => {
  expect(getRemovedTrackers(['http://a.org/announce'], ['http://a.org/announce', 'http://b.org/announce'])).toStrictEqual([])
})

test('qbit-aio get removed trackers C : partially gone', () => {
  expect(getRemovedTrackers(['http://a.org/announce', 'http://b.org/announce'], ['http://b.org/announce'])).toStrictEqual(['http://a.org/announce'])
})

test('qbit-aio encode tracker url A : plain url is untouched', () => {
  expect(encodeTrackerUrl('udp://tracker.org:6969/announce')).toBe('udp://tracker.org:6969/announce')
})

test('qbit-aio encode tracker url B : a zero width space becomes its percent form', () => {
  expect(encodeTrackerUrl('udp://tracker.fnix.net:6969/​announce')).toBe('udp://tracker.fnix.net:6969/%E2%80%8Bannounce')
})

test('qbit-aio encode tracker url C : several non ascii chars', () => {
  expect(encodeTrackerUrl('http://a.org/​​announce')).toBe('http://a.org/%E2%80%8B%E2%80%8Bannounce')
})

test('qbit-aio ratio per period A : 2 ratio in 14 days is 1 per week', () => {
  expect(getRatioPerPeriod(2, 14 * 86_400, 7)).toBe(1)
})

test('qbit-aio ratio per period B : 3 ratio in 60 days is 1.5 per month', () => {
  expect(getRatioPerPeriod(3, 60 * 86_400, 30)).toBe(1.5)
})

test('qbit-aio ratio per period C : a torrent younger than the period is not extrapolated', () => {
  expect(getRatioPerPeriod(1, 60, 7)).toBe(1)
})

test('qbit-aio ratio per period E : 3 days old with 3 ratio gives 3 per week, not 7', () => {
  expect(getRatioPerPeriod(3, 3 * 86_400, 7)).toBe(3)
})

test('qbit-aio ratio per period D : unknown ratio gives 0', () => {
  expect(getRatioPerPeriod(-1, 14 * 86_400, 7)).toBe(0)
})

test('qbit-aio tier bounds A : 8 values give a quarter each', () => {
  expect(getTierBounds([8, 1, 2, 3, 4, 5, 6, 7])).toStrictEqual([2, 4, 6])
})

test('qbit-aio tier bounds B : no value gives no bounds', () => {
  expect(getTierBounds([])).toStrictEqual([])
})

test('qbit-aio tier emoji A : worst, mid and best values', () => {
  const bounds = getTierBounds([1, 2, 3, 4, 5, 6, 7, 8])
  expect([1, 2, 3, 4, 5, 6, 7, 8].map(value => getTierEmoji(value, bounds)).join('')).toBe('🔴🔴🟠🟠🟡🟡🟢🟢')
})

test('qbit-aio tier emoji B : a pile of zeros is all red', () => {
  const bounds = getTierBounds([0, 0, 0, 0, 0, 5, 6, 7])
  expect(getTierEmoji(0, bounds)).toBe('🔴')
})

test('qbit-aio tier emoji C : no bounds gives no emoji', () => {
  expect(getTierEmoji(3, [])).toBe('')
})

test('qbit-aio seeding scores A : the best on every criterion scores 100, the worst 0', () => {
  expect(
    getSeedingScores([
      [1, 1, 1],
      [2, 2, 2],
      [3, 3, 3],
    ]),
  ).toStrictEqual([0, 50, 100])
})

test('qbit-aio seeding scores B : criteria are averaged', () => {
  expect(
    getSeedingScores([
      [1, 2],
      [2, 1],
    ]),
  ).toStrictEqual([50, 50])
})

test('qbit-aio seeding scores C : a single torrent is neutral', () => {
  expect(getSeedingScores([[5, 5, 5]])).toStrictEqual([50])
})

test('qbit-aio seeding scores D : equal values rank as the worst', () => {
  expect(getSeedingScores([[0], [0], [4]])).toStrictEqual([0, 0, 100])
})

test('qbit-aio tier emoji D : three tiers with their own emojis', () => {
  const values = [1, 2, 3, 4, 5, 6]
  const bounds = getTierBounds(values, 3)
  expect(values.map(value => getTierEmoji(value, bounds, ['a', 'b', 'c'])).join('')).toBe('aabbcc')
})

test('qbit-aio tier bounds C : fewer values than tiers gives no verdict', () => {
  expect(getTierBounds([5])).toStrictEqual([])
  expect(getTierBounds([1, 2, 3], 4)).toStrictEqual([])
})

test('qbit-aio tier emoji E : a lone torrent gets no tier', () => {
  expect(getTierEmoji(5, getTierBounds([5]))).toBe('')
})

test('qbit-aio seeding scores E : a torrent missing from the index is ranked fairly', () => {
  const index = buildRankIndex([[1], [2], [3]])
  expect(getSeedingScore([10], index)).toBe(100)
  expect(getSeedingScore([0], index)).toBe(0)
})

test('qbit-aio seeding scores F : the index ranks like the plain scores', () => {
  const metrics = [
    [3, 1],
    [1, 5],
    [2, 2],
    [2, 2],
    [9, 0],
  ]
  const index = buildRankIndex(metrics)
  expect(metrics.map(own => getSeedingScore(own, index))).toStrictEqual(getSeedingScores(metrics))
})
