// 将军检测测试
import { Chess } from '../src/chess'
import { expect, test } from 'vitest'

test('isCheck - 初始局面不是将军', () => {
  const chess = new Chess()
  expect(chess.isCheck()).toBe(false)
  expect(chess.inCheck()).toBe(false)
})

test('isCheck - 炮将军', () => {
  // 红炮在 e4，黑将在 e9，同列无子阻挡
  const chess = new Chess(
    'rnbakabnr/9/1c5c1/p1p1p1p1p/4C4/9/P1P1P1P1P/1C5C1/9/RNBAKABNR b - - 0 1',
  )
  expect(chess.isCheck()).toBe(true)
})

test('isCheck - 车将军', () => {
  // 红车在 e1，黑将在 e9，同列无阻挡
  const chess = new Chess(
    'rnbakabnr/9/1c5c1/p1p1R1p1p/9/9/P1P1P1P1P/1C5C1/9/RNBAKABNR b - - 0 1',
  )
  expect(chess.isCheck()).toBe(true)
})

test('isCheck - 马将军', () => {
  // 红马在 d7，可以跳到 e9 将军（日字形，蹩脚格 d8 为空）
  const chess = new Chess(
    'rnbakabnr/9/1c1N3c1/p1p1p1p1p/9/9/P1P1P1P1P/1C5C1/9/RNBAKABNR b - - 0 1',
  )
  expect(chess.isCheck()).toBe(true)
})
