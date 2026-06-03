// 着法执行测试
import { Chess } from '../src/chess'
import { expect, test } from 'vitest'

test('move - ICCS 记谱法执行着法', () => {
  const chess = new Chess()
  const move = chess.move('b0c2')
  expect(move.piece).toBe('n')
  expect(move.from).toBe('b0')
  expect(move.to).toBe('c2')
  expect(move.isCapture()).toBe(false)

  chess.undo()
  expect(chess.fen()).toBe(
    'rnbakabnr/9/1c5c1/p1p1p1p1p/9/9/P1P1P1P1P/1C5C1/9/RNBAKABNR w - - 0 1',
  )
})

test('move - 将军局面下黑方着法不为空', () => {
  // 红车在 e7 将军黑将
  const chess = new Chess(
    'rnbakabnr/9/1c2R2c1/p1p1p1p1p/9/9/P1P1P1P1P/1C5C1/9/RNBAKABNR b - - 0 1',
  )
  const moves = chess.moves()
  expect(moves.length).toBeGreaterThan(0)
})

test('move - 抛出错误 - 非法着法', () => {
  const chess = new Chess()
  expect(() => chess.move('e0e5')).toThrowError()
})

test('move - 详细格式', () => {
  const chess = new Chess()
  const move = chess.move({ from: 'b0', to: 'c2' })
  expect(move.piece).toBe('n')
  expect(move.from).toBe('b0')
  expect(move.to).toBe('c2')

  chess.undo()
  expect(chess.fen()).toBe(
    'rnbakabnr/9/1c5c1/p1p1p1p1p/9/9/P1P1P1P1P/1C5C1/9/RNBAKABNR w - - 0 1',
  )
})

test('move - 抛出错误 - 详细格式非法着法', () => {
  const chess = new Chess()
  expect(() => chess.move({ from: 'b0', to: 'c5' })).toThrowError()
})
