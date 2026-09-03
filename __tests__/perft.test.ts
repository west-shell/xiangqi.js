// 性能测试（节点计数）
import { Chess } from '../src/chess'
import { expect, test } from 'vitest'

test('perft - 初始局面 depth 1', () => {
  const chess = new Chess()
  expect(chess.perft(1)).toBe(44)
})

test('perft - 只有双将 depth 1', () => {
  // 红将在 e0，可走到 e1, f0（2 步）；走 d0 会与黑将 d9 对脸（白脸将），非法
  const chess = new Chess('3k5/9/9/9/9/9/9/9/9/4K4 w - - 0 1')
  const moves = chess.moves()
  // perft(1) 只统计行棋方（红方）的合法走法
  expect(chess.perft(1)).toBe(moves.length)
  expect(chess.perft(1)).toBe(2)
})
