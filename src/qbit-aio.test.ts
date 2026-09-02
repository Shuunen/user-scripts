import { countPeers, encodeTrackerUrl, getRemovedTrackers, getTrackersToRemove, getUselessTrackers, isRealTracker, isUselessTracker } from './qbit-aio.user'

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
