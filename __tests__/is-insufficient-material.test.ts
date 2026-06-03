// 子力不足测试（中国象棋）
import { Chess } from '../src/chess'
import { expect, test } from 'vitest'

test('子力不足 - 将 vs 将', () => {
  const chess = new Chess('4k4/9/9/9/9/9/9/9/9/4K4 w - - 0 1')
  expect(chess.isInsufficientMaterial()).toBe(true)
})

test('子力不足 - 将+士 vs 将', () => {
  const chess = new Chess('4k4/9/9/9/9/9/9/9/4A4/4K4 w - - 0 1')
  expect(chess.isInsufficientMaterial()).toBe(true)
})

test('子力不足 - 将+象 vs 将', () => {
  const chess = new Chess('4k4/9/9/9/9/9/9/9/4E4/4K4 w - - 0 1')
  expect(chess.isInsufficientMaterial()).toBe(true)
})

test('不是子力不足 - 初始局面', () => {
  const chess = new Chess()
  expect(chess.isInsufficientMaterial()).toBe(false)
})

test('不是子力不足 - 将+马 vs 将', () => {
  const chess = new Chess('4k4/9/9/9/9/9/9/4N4/9/4K4 w - - 0 1')
  expect(chess.isInsufficientMaterial()).toBe(false)
})

test('不是子力不足 - 将+炮 vs 将', () => {
  const chess = new Chess('4k4/9/9/9/9/9/9/4C4/9/4K4 w - - 0 1')
  expect(chess.isInsufficientMaterial()).toBe(false)
})

test('不是子力不足 - 将+兵 vs 将', () => {
  const chess = new Chess('4k4/9/9/9/9/9/9/4P4/9/4K4 w - - 0 1')
  expect(chess.isInsufficientMaterial()).toBe(false)
})
