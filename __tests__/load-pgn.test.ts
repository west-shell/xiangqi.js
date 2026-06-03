// PGN 加载测试（中国象棋）
import { Chess } from '../src/chess'
import { expect, test } from 'vitest'

test('loadPgn - 加载基本对局', () => {
  const chess = new Chess()
  const pgn = `[White "棋手A"]
[Black "棋手B"]
[Result "*"]

1. b0c2 b9a7 2. h0g2 *`

  chess.loadPgn(pgn)
  expect(chess.fen()).toBeTruthy()
})

test('loadPgn - 无头部加载', () => {
  const chess = new Chess()
  const pgn = '1. b0c2 b9a7 2. h0g2 *'
  chess.loadPgn(pgn)
  expect(chess.fen()).toBeTruthy()
})

test('loadPgn - 空对局（无着法）', () => {
  const chess = new Chess()
  chess.loadPgn('*')
  expect(chess.fen()).toBe(
    'rnbakabnr/9/1c5c1/p1p1p1p1p/9/9/P1P1P1P1P/1C5C1/9/RNBAKABNR w - - 0 1',
  )
})

test('loadPgn - 空对局（仅头部）', () => {
  const chess = new Chess()
  const pgn = `[White "棋手"]\n[Black "黑方"]\n*`
  chess.loadPgn(pgn)
  expect(chess.getHeaders().White).toBe('棋手')
})

test('loadPgn - 带注释的对局', () => {
  const chess = new Chess()
  const pgn = `[White "棋手A"]
[Black "棋手B"]

{这是一步好棋} 1. b0c2 {黑方应对} b9a7 *`

  chess.loadPgn(pgn)
  expect(chess.fen()).toBeTruthy()
})

test('loadPgn - 非法着法抛出错误', () => {
  const chess = new Chess()
  expect(() => chess.loadPgn('1. e0e5 *')).toThrow()
})

test('loadPgn - 宽松解析器接受 ICCS 格式', () => {
  const chess = new Chess()
  chess.loadPgn('1. b0c2 b9a7 *')
  expect(chess.fen()).toBeTruthy()
})
