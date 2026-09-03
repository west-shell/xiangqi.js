// 查找棋子位置测试
import { Chess, Piece, WHITE, BLACK, KING, HORSE, PAWN } from '../src/chess'
import { expect, test } from 'vitest'

test('findPiece - 查找唯一的棋子', () => {
  const chess = new Chess()
  expect(chess.findPiece({ type: KING, color: WHITE })).toEqual(['e0'])
  expect(chess.findPiece({ type: KING, color: BLACK })).toEqual(['e9'])
})

test('findPiece - 查找多个棋子', () => {
  const chess = new Chess()
  // 红方有两个马
  expect(chess.findPiece({ type: HORSE, color: WHITE })).toEqual(['b0', 'h0'])
  // 红方有五个兵
  expect(chess.findPiece({ type: PAWN, color: WHITE })).toEqual([
    'a3',
    'c3',
    'e3',
    'g3',
    'i3',
  ])
})

test('findPiece - 无此棋子返回空数组', () => {
  const chess = new Chess('4k4/9/9/9/9/9/9/9/9/3K5 w - - 0 1')
  expect(chess.findPiece({ type: PAWN, color: WHITE })).toEqual([])
})

test('findPiece - 无效棋子返回空数组', () => {
  const chess = new Chess()
  expect(
    chess.findPiece({
      type: 'bad-piece',
      color: 'bad-color',
    } as unknown as Piece),
  ).toEqual([])
})
