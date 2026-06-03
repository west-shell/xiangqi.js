// 加载 FEN 测试
import { Chess } from '../src/chess'
import { expect, test } from 'vitest'

test('load - 加载初始局面', () => {
  const chess = new Chess()
  expect(chess.fen()).toBe(
    'rnbakabnr/9/1c5c1/p1p1p1p1p/9/9/P1P1P1P1P/1C5C1/9/RNBAKABNR w - - 0 1',
  )
})

test('load - 加载中局局面', () => {
  const fen =
    'rnbakabnr/9/1c5c1/p1p1p1p1p/9/9/P1P1P1P1P/1CN4C1/9/R1BAKABNR b - - 1 1'
  const chess = new Chess(fen)
  expect(chess.fen()).toBe(fen)
  expect(chess.turn()).toBe('b')
})

test('load - 加载仅有双将的局面', () => {
  const fen = '4k4/9/9/9/9/9/9/9/9/4K4 w - - 0 1'
  const chess = new Chess(fen)
  expect(chess.fen()).toBe(fen)
})

test('load - 无效 FEN 抛出错误', () => {
  const chess = new Chess()
  expect(() => chess.load('invalid fen')).toThrow()
})

test('load - 保留头部加载', () => {
  const chess = new Chess()
  chess.setHeader('White', '胡荣华')
  const fen = '4k4/9/9/9/9/9/9/9/9/4K4 w - - 0 1'
  chess.load(fen, { preserveHeaders: true })
  expect(chess.fen()).toBe(fen)
  expect(chess.getHeaders().White).toBe('胡荣华')
})
