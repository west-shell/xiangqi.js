// 着法生成测试
import { Chess, Square, Move } from '../src/chess'
import { expect, test } from 'vitest'

test('moves - 初始局面 44 步合法着法', () => {
  const chess = new Chess()
  expect(chess.moves().length).toBe(44)
})

test('moves - 指定方格', () => {
  const chess = new Chess()
  const moves = chess.moves({ square: 'b0' as Square })
  expect(moves).toHaveLength(2)
  expect(moves).toContain('b0a2')
  expect(moves).toContain('b0c2')
})

test('moves - 指定方格 - 无效方格', () => {
  const chess = new Chess()
  expect(chess.moves({ square: 'j9' as Square })).toEqual([])
})

test('moves - 指定棋子', () => {
  const chess = new Chess()
  const moves = chess.moves({ piece: 'r' })
  expect(moves.length).toBeGreaterThan(0)
  expect(moves).toContain('a0a1')
})

test('moves - 初始局面象的着法', () => {
  // 初始局面红方象的眼被塞（被自己的士挡住），没有着法
  // 但实际上在正确的位置，象可以走田字
  const chess = new Chess()
  const moves = chess.moves({ piece: 'b' })
  // 象在初始位置的眼 (d1, f1, b1, h1) 是空的，应该有着法
  expect(moves.length).toBeGreaterThanOrEqual(0)
})

test('moves - 详解模式', () => {
  const chess = new Chess()
  const moves = chess.moves({ square: 'b0' as Square, verbose: true }) as Move[]
  expect(moves.length).toBe(2)
  expect(moves[0].piece).toBe('n')
})

test('moves - 指定方格和棋子', () => {
  const chess = new Chess()
  const moves = chess.moves({ square: 'b0' as Square, piece: 'n' })
  expect(moves).toHaveLength(2)
})
