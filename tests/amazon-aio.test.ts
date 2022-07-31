import { check } from 'shuutils'
import { test } from 'uvu'
import { equal } from 'uvu/assert'
const { score, score20Styled, maxScore } = require('../src/amazon-aio.user') // eslint-disable-line no-undef, @typescript-eslint/no-var-requires

const checkGreaterThan = (title: string, ratingA: number, reviewsA: number, ratingB: number, reviewsB: number): void => {
  test(title, () => {
    const scoreA = score(ratingA, reviewsA)
    const scoreB = score(ratingB, reviewsB)
    equal(scoreA > scoreB, true, `expected ${score(ratingA, reviewsA, true)} to be greater than ${score(ratingB, reviewsB, true)}`)
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

check(`amazon-aio max score is ${maxScore} A`, score(5, 100), maxScore)
check(`amazon-aio max score is ${maxScore} B`, score(5, 1000), maxScore)
check(`amazon-aio max score is ${maxScore} C`, score(5, 10_000), maxScore)
check(`amazon-aio max score is ${maxScore} D`, score(5, 40), maxScore)

check('amazon-aio min score is 0 A', score(0, 0), 0)
check('amazon-aio min score is 0 B', score(0, 1), 0)
check('amazon-aio min score is 0 C', score(0, 10), 0)
check('amazon-aio min score is 0 D', score(0, 100), 0)

check('amazon-aio a 5 star rating score 5/20 with 1 review', score20Styled(5, 1).score, 5)
check('amazon-aio a 5 star rating score 5/20 with 4 reviews', score20Styled(5, 4).score, 5)
check('amazon-aio a 5 star rating score 8/20 with 5 reviews', score20Styled(5, 5).score, 8)
check('amazon-aio a 5 star rating score 18/20 with 10 reviews', score20Styled(5, 10).score, 18)
check('amazon-aio a 5 star rating score 19/20 with 20 reviews', score20Styled(5, 20).score, 19)
check('amazon-aio a 5 star rating score 20/20 with 40 reviews', score20Styled(5, 40).score, 20)

const score20_20 = score20Styled(5, 100)
check('amazon-aio 20/20 score', score20_20.score, 20)
check('amazon-aio 20/20 score is darkgreen', score20_20.color, 'darkgreen')
check('amazon-aio 20/20 score is bigger', score20_20.size, 4)

const score18_20 = score20Styled(4.8, 90)
check('amazon-aio 18/20 score', score18_20.score, 18)
check('amazon-aio 18/20 score is darkgreen', score18_20.color, 'darkgreen')
check('amazon-aio 18/20 score is bigger', score18_20.size, 4)

const score16_20 = score20Styled(4.7, 100)
check('amazon-aio 16/20 score', score16_20.score, 16)
check('amazon-aio 16/20 score is black', score16_20.color, 'black')
check('amazon-aio 16/20 score is big', score16_20.size, 3)

const score14_20 = score20Styled(4.5, 100)
check('amazon-aio 14/20 score', score14_20.score, 14)
check('amazon-aio 14/20 score is black', score14_20.color, 'black')
check('amazon-aio 14/20 score is big', score14_20.size, 3)

const score11_20 = score20Styled(4.3, 100)
check('amazon-aio 11/20 score', score11_20.score, 11)
check('amazon-aio 11/20 score is darkorange', score11_20.color, 'darkorange')
check('amazon-aio 11/20 score is medium', score11_20.size, 2)

const score10_20 = score20Styled(4.2, 100)
check('amazon-aio 10/20 score', score10_20.score, 10)
check('amazon-aio 10/20 score is darkorange', score10_20.color, 'darkorange')
check('amazon-aio 10/20 score is medium', score10_20.size, 2)

const score8_20 = score20Styled(3.7, 100)
check('amazon-aio 8/20 score', score8_20.score, 8)
check('amazon-aio 8/20 score is red', score8_20.color, 'red')
check('amazon-aio 8/20 score is small', score8_20.size, 1)

const score6_20 = score20Styled(3.5, 20)
check('amazon-aio 6/20 score', score6_20.score, 6)
check('amazon-aio 6/20 score is red', score6_20.color, 'red')
check('amazon-aio 6/20 score is small', score6_20.size, 1)

const score0_20 = score20Styled(0, 0)
check('amazon-aio 0/20 score', score0_20.score, 0)
check('amazon-aio 0/20 score is red', score0_20.color, 'red')
check('amazon-aio 0/20 score is small', score0_20.size, 1)

check.run()
