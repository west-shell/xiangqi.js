// 空着测试
import { Chess } from '../src/chess'
import { test, expect } from 'vitest'

test('nullmove - 开局时空着', () => {
  const chess = new Chess()
  chess.move('--')
  expect(chess.fen()).toBe(
    'rnbakabnr/9/1c5c1/p1p1p1p1p/9/9/P1P1P1P1P/1C5C1/9/RNBAKABNR b - - 1 1',
  )
})

test('nullmove - 传递 null 对象空着', () => {
  const chess = new Chess()
  chess.move(null)
  expect(chess.turn()).toBe('b')
})

test('nullmove - 被将军时不能空着', () => {
  const fn = () => {
    const chess = new Chess(
      'rnbakabnr/9/1c5c1/p1p1R1p1p/9/9/P1P1P1P1P/1C5C1/9/RNBAKABNR b - - 0 1',
    )
    chess.move('--')
  }
  expect(fn).toThrow('Null move not allowed when in check')
})

test('nullmove - PGN 中正确显示空着', () => {
  const chess = new Chess()
  chess.move('b0c2')
  chess.move('b9a7')
  chess.move('--')
  chess.move('h9g7')
  const pgn = chess.pgn()
  expect(pgn).toContain('--')
})
