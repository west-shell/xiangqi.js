// 对局结束检测测试
import { Chess } from '../src/chess'
import { expect, test } from 'vitest'

test('isGameOver - 初始局面未结束', () => {
  const chess = new Chess()
  expect(chess.isGameOver()).toBe(false)
})

test('isGameOver - 子力不足时结束', () => {
  // 双方各只剩将（不同列，子力不足和棋）
  const chess = new Chess('4k4/9/9/9/9/9/9/9/9/3K5 w - - 0 1')
  expect(chess.isGameOver()).toBe(true)
})

test('isGameOver - 三次重复时结束', () => {
  const chess = new Chess()
  // 来回走子产生三次重复
  chess.move('b0c2')
  chess.move('b9a7')
  chess.move('c2b0')
  chess.move('a7b9')
  chess.move('b0c2')
  chess.move('b9a7')
  chess.move('c2b0')
  chess.move('a7b9')
  expect(chess.isThreefoldRepetition()).toBe(true)
  expect(chess.isDraw()).toBe(true)
  expect(chess.isGameOver()).toBe(true)
})
