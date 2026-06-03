// 设置走子方测试
import { Chess } from '../src/chess'
import { test, expect } from 'vitest'

test('setTurn - 当前走子方不变返回 false', () => {
  const chess = new Chess()
  expect(chess.setTurn('w')).toBe(false)
  expect(chess.turn()).toBe('w')
})

test('setTurn - 切换走子方返回 true', () => {
  const chess = new Chess()
  expect(chess.setTurn('b')).toBe(true)
  expect(chess.turn()).toBe('b')
})

test('setTurn - 被将军时试图空着（setTurn 检测到同色会先返回 false）', () => {
  // 红车将军黑将，黑方被将军
  const chess = new Chess(
    'rnbakabnr/9/1c5c1/p1p1R1p1p/9/9/P1P1P1P1P/1C5C1/9/RNBAKABNR b - - 0 1',
  )
  // setTurn('b') 先检查：this._turn == 'b'，返回 false，不调用 move
  expect(chess.setTurn('b')).toBe(false)
})
