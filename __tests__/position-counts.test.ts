// 局面重复计数测试
import { Chess as ChessClass, DEFAULT_POSITION } from '../src/chess'
import { expect, test } from 'vitest'

const Chess = ChessClass as any
const defaultHash = BigInt('0x' + new Chess(DEFAULT_POSITION).hash())
const afterMoveFen =
  'rnbakabnr/9/1c5c1/p1p1p1p1p/9/9/P1P1P1P1P/1CN4C1/9/R1BAKABNR b - - 1 1'
const afterMoveHash = BigInt('0x' + new Chess(afterMoveFen).hash())

test('positionCount - 初始局面计数为 1', () => {
  const chess = new Chess()
  expect(chess._getPositionCount(defaultHash)).toBe(1)
})

test('positionCount - 走子后计数更新', () => {
  const chess = new Chess()
  chess.move('b0c2')
  expect(chess._getPositionCount(afterMoveHash)).toBe(1)
})

test('positionCount - 撤销后计数移除', () => {
  const chess = new Chess()
  chess.move('b0c2')
  chess.undo()
  expect(chess._getPositionCount(afterMoveHash)).toBe(0)
  expect(chess._positionCount.size).toBe(1)
})

test('positionCount - 清空后计数重置', () => {
  const chess = new Chess()
  chess.move('b0c2')
  chess.clear()
  expect(chess._getPositionCount(defaultHash)).toBe(0)
  expect(chess._positionCount.size).toBe(0)
})
