import { maxScore, calcScore as score, score20Styled } from './amazon-aio.user.js'

/**
 * Checks if the score calculated from rating and reviews for two items is greater for the first item.
 * @param {string} title - The title of the test case.
 * @param {number} ratingA - The rating of the first item.
 * @param {number} reviewsA - The number of reviews for the first item.
 * @param {number} ratingB - The rating of the second item.
 * @param {number} reviewsB - The number of reviews for the second item.
 * @returns {void}
 */
function checkGreaterThan(title: string, ratingA: number, reviewsA: number, ratingB: number, reviewsB: number) {
  const scoreA = score(ratingA, reviewsA)
  const scoreB = Number(score(ratingB, reviewsB).toString())
  test(`${title}, expect ${score(ratingA, reviewsA, true)} to be greater than ${score(ratingB, reviewsB, true)}`, () => {
    expect(scoreA).toBeGreaterThan(scoreB)
  })
}

checkGreaterThan('amazon-aio same ratings is better with more reviews A', 4.2, 30, 4.2, 15)
checkGreaterThan('amazon-aio same ratings is better with more reviews B', 4.2, 10, 4.2, 5)

checkGreaterThan('amazon-aio same reviews is better with more ratings A', 4.3, 30, 4.2, 30)
checkGreaterThan('amazon-aio same reviews is better with more ratings B', 4.4, 30, 4.3, 30)
checkGreaterThan('amazon-aio same reviews is better with more ratings C', 4.5, 30, 4.4, 30)
checkGreaterThan('amazon-aio same reviews is better with more ratings D', 4, 30, 3, 30)

checkGreaterThan('amazon-aio fewer reviews but better ratings is better A', 4.3, 20, 4.2, 30)
checkGreaterThan('amazon-aio fewer reviews but better ratings is better B', 4.4, 20, 4.3, 30)
checkGreaterThan('amazon-aio fewer reviews but better ratings is better C', 4.5, 20, 4.4, 30)
checkGreaterThan('amazon-aio fewer reviews but better ratings is better D', 4.6, 20, 4.5, 25)

checkGreaterThan('amazon-aio too few reviews with great ratings are not better A', 4.5, 30, 4.6, 7)
checkGreaterThan('amazon-aio too few reviews with great ratings are not better B', 4.4, 45, 4.6, 8)
checkGreaterThan('amazon-aio too few reviews with great ratings are not better C', 4.5, 10, 5, 1)

checkGreaterThan('amazon-aio lots of reviews with bad ratings are not better A', 4.4, 40, 4.3, 200)
checkGreaterThan('amazon-aio lots of reviews with bad ratings are not better B', 4.3, 40, 4.2, 400)
checkGreaterThan('amazon-aio lots of reviews with bad ratings are not better C', 4.2, 40, 4.1, 800)
checkGreaterThan('amazon-aio lots of reviews with bad ratings are not better D', 4.1, 40, 4, 50)

test(`amazon-aio max score is ${maxScore} A`, () => {
  expect(score(5, 100)).toBe(maxScore)
})
test(`amazon-aio max score is ${maxScore} B`, () => {
  expect(score(5, 1000)).toBe(maxScore)
})
test(`amazon-aio max score is ${maxScore} C`, () => {
  expect(score(5, 10_000)).toBe(maxScore)
})
test(`amazon-aio max score is ${maxScore} D`, () => {
  expect(score(5, 40)).toBe(maxScore)
})

test('amazon-aio min score is 0 A', () => {
  expect(score(0, 0)).toBe(0)
})
test('amazon-aio min score is 0 B', () => {
  expect(score(0, 1)).toBe(0)
})
test('amazon-aio min score is 0 C', () => {
  expect(score(0, 10)).toBe(0)
})
test('amazon-aio min score is 0 D', () => {
  expect(score(0, 100)).toBe(0)
})

test('amazon-aio a 5 star rating score 5/20 with 1 review', () => {
  expect(score20Styled(5, 1).score).toBe(5)
})
test('amazon-aio a 5 star rating score 5/20 with 4 reviews', () => {
  expect(score20Styled(5, 4).score).toBe(5)
})
test('amazon-aio a 5 star rating score 8/20 with 5 reviews', () => {
  expect(score20Styled(5, 5).score).toBe(8)
})
test('amazon-aio a 5 star rating score 18/20 with 10 reviews', () => {
  expect(score20Styled(5, 10).score).toBe(18)
})
test('amazon-aio a 5 star rating score 19/20 with 20 reviews', () => {
  expect(score20Styled(5, 20).score).toBe(19)
})
test('amazon-aio a 5 star rating score 20/20 with 40 reviews', () => {
  expect(score20Styled(5, 40).score).toBe(20)
})

const score2020 = score20Styled(5, 100)
test('amazon-aio 20/20 score', () => {
  expect(score2020.score).toBe(20)
})
test('amazon-aio 20/20 score is darkgreen', () => {
  expect(score2020.color).toBe('darkgreen')
})
test('amazon-aio 20/20 score is bigger', () => {
  expect(score2020.size).toBe(4)
})

const score1820 = score20Styled(4.8, 90)
test('amazon-aio 18/20 score', () => {
  expect(score1820.score).toBe(18)
})
test('amazon-aio 18/20 score is darkgreen', () => {
  expect(score1820.color).toBe('darkgreen')
})
test('amazon-aio 18/20 score is bigger', () => {
  expect(score1820.size).toBe(4)
})

const score1620 = score20Styled(4.7, 100)
test('amazon-aio 16/20 score', () => {
  expect(score1620.score).toBe(16)
})
test('amazon-aio 16/20 score is black', () => {
  expect(score1620.color).toBe('black')
})
test('amazon-aio 16/20 score is big', () => {
  expect(score1620.size).toBe(3)
})

const score1420 = score20Styled(4.5, 100)
test('amazon-aio 14/20 score', () => {
  expect(score1420.score).toBe(14)
})
test('amazon-aio 14/20 score is black', () => {
  expect(score1420.color).toBe('black')
})
test('amazon-aio 14/20 score is big', () => {
  expect(score1420.size).toBe(3)
})

const score1120 = score20Styled(4.3, 100)
test('amazon-aio 11/20 score', () => {
  expect(score1120.score).toBe(11)
})
test('amazon-aio 11/20 score is darkorange', () => {
  expect(score1120.color).toBe('darkorange')
})
test('amazon-aio 11/20 score is medium', () => {
  expect(score1120.size).toBe(2)
})

const score1020 = score20Styled(4.2, 100)
test('amazon-aio 10/20 score', () => {
  expect(score1020.score).toBe(10)
})
test('amazon-aio 10/20 score is darkorange', () => {
  expect(score1020.color).toBe('darkorange')
})
test('amazon-aio 10/20 score is medium', () => {
  expect(score1020.size).toBe(2)
})

const score820 = score20Styled(3.7, 100)
test('amazon-aio 8/20 score', () => {
  expect(score820.score).toBe(8)
})
test('amazon-aio 8/20 score is red', () => {
  expect(score820.color).toBe('red')
})
test('amazon-aio 8/20 score is small', () => {
  expect(score820.size).toBe(1)
})

const score620 = score20Styled(3.5, 20)
test('amazon-aio 6/20 score', () => {
  expect(score620.score).toBe(6)
})
test('amazon-aio 6/20 score is red', () => {
  expect(score620.color).toBe('red')
})
test('amazon-aio 6/20 score is small', () => {
  expect(score620.size).toBe(1)
})

const score020 = score20Styled(0, 0)
test('amazon-aio 0/20 score', () => {
  expect(score020.score).toBe(0)
})
test('amazon-aio 0/20 score is red', () => {
  expect(score020.color).toBe('red')
})
test('amazon-aio 0/20 score is small', () => {
  expect(score020.size).toBe(1)
})

test('amazon-aio from 4.4 to 5 spectrum', () => {
  expect(score20Styled(4.4, 315).score).toBe(13)
  expect(score20Styled(4.5, 315).score).toBe(14)
  expect(score20Styled(4.6, 315).score).toBe(15)
  expect(score20Styled(4.7, 315).score).toBe(16)
  expect(score20Styled(4.8, 315).score).toBe(18)
  expect(score20Styled(4.9, 315).score).toBe(19)
  expect(score20Styled(5, 315).score).toBe(20)
})
