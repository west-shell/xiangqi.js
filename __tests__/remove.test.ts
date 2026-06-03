// 移除棋子测试
import { Chess, Square, CANNON, WHITE } from '../src/chess'
import { expect, test } from 'vitest'

test('remove - 移除棋子并返回被移除的棋子', () => {
  const chess = new Chess()
  const piece = chess.remove('a0' as Square)
  expect(piece).toEqual({ type: 'r', color: WHITE })
  expect(chess.get('a0' as Square)).toBeUndefined()
})

test('remove - 空格返回 undefined', () => {
  const chess = new Chess()
  const piece = chess.remove('e4' as Square)
  expect(piece).toBeUndefined()
})

test('remove - 移子后更新 FEN', () => {
  const chess = new Chess()
  chess.remove('a0' as Square)
  expect(chess.fen()).not.toBe(
    'rnbakabnr/9/1c5c1/p1p1p1p1p/9/9/P1P1P1P1P/1C5C1/9/RNBAKABNR w - - 0 1',
  )
})

test('remove - 移除将后 kings 状态更新', () => {
  const chess = new Chess()
  chess.remove('e0' as Square)
  // 没有红将，_isKingAttacked 应返回 false（不会崩溃）
  expect(chess.isCheck()).toBe(false)
})
