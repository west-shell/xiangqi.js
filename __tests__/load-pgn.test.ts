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

test('loadPgn - 中文着法 PGN', () => {
  const chess = new Chess()
  chess.loadPgn(`[Event "测试"]

1. 炮二平五 炮８平５ 2. 马二进三 马８进７ 3. 车一平二 车９平８ *`)
  expect(chess.history()).toHaveLength(6)
})

test('loadPgn - 中文着法带变着与注释', () => {
  const chess = new Chess()
  chess.loadPgn(
    `1. 炮二平五 {中炮} 马８进７ (1... 炮８平５ 2. 马二进三) 2. 马二进三 *`,
  )
  expect(chess.history()).toHaveLength(3)
})

test('loadPgn - 繁体与全角数字混排', () => {
  const chess = new Chess()
  chess.loadPgn('1. 包二平伍 馬８進７ 2. 車一進一 卒９進１ *')
  expect(chess.history()).toHaveLength(4)
  expect(chess.history()).toEqual(['h2e2', 'h9g7', 'i0i1', 'i6i5'])
})

test('loadPgn - 大写带横线 ICCS（B0-C2）', () => {
  const chess = new Chess()
  chess.loadPgn('1. B0-C2 H9-G7 *')
  expect(chess.history()).toHaveLength(2)
})

test('loadPgn - 大写无横线 ICCS（B0C2）', () => {
  const chess = new Chess()
  chess.loadPgn('1. B0C2 H9G7 *')
  expect(chess.history()).toHaveLength(2)
})

test('loadPgn - 混合格式（ICCS + 中文 + WXF）', () => {
  const chess = new Chess()
  chess.loadPgn('1. b0c2 炮８平５ 2. h0g2 卒３进１ 3. R1+1 *')
  expect(chess.history()).toHaveLength(5)
})
