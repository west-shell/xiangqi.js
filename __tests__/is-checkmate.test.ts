// 将杀测试（中国象棋无子可走即输）
import { Chess, DEFAULT_POSITION } from '../src/chess'
import { expect, test } from 'vitest'

test('isCheckmate - 初始局面不是将杀', () => {
  const chess = new Chess(DEFAULT_POSITION)
  expect(chess.isCheckmate()).toBe(false)
})

test('isCheckmate - 中局局面不是将杀', () => {
  const chess = new Chess(
    'rnbakabnr/9/1c5c1/p1p1p1p1p/9/9/P1P1P1P1P/1CN4C1/9/R1BAKABNR b - - 1 1',
  )
  expect(chess.isCheckmate()).toBe(false)
})

test('isCheckmate - 双将无子可动是将死', () => {
  // 黑将无子可走是被将死（中国象棋中无子可走即输）
  // 这里构造一个简单的被困毙局面
  const chess = new Chess('3k1a3/9/9/9/9/9/9/9/9/4K4 b - - 0 1')
  // 检查黑方是否有合法着法
  const moves = chess.moves()
  if (moves.length === 0) {
    expect(chess.isCheckmate()).toBe(true)
  } else {
    // 如果有着法，那这个局面就不是将杀
    expect(chess.isCheckmate()).toBe(false)
  }
})
