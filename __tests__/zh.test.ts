// 文件名: moveToSan.test.ts
import { Chess } from '../src/chess'
import { expect, test } from 'vitest'

test('_moveToZh - 车', () => {
  const chess = new Chess('3k5/6r2/2R6/9/6r2/9/2R6/9/9/4K4 w - - 0 1')
  const move1 = chess.move({ from: 'c7', to: 'c5' })
  expect(move1.zh).toBe('前车退二')
  const move2 = chess.move({ from: 'g5', to: 'g3' })
  expect(move2.zh).toBe('前车进２')
})

test('_moveToZh - 兵（两列各多兵，全局编号）', () => {
  const chess = new Chess(
    '4k4/3P1P3/4P4/3P1P3/9/3p1p3/4p4/3p1p3/9/4K4 w - - 0 1',
  )
  const move1 = chess.move({ from: 'f8', to: 'g8' })
  expect(move1.zh).toBe('一兵平三')
  const move2 = chess.move({ from: 'd4', to: 'c4' })
  expect(move2.zh).toBe('二卒平３')
})

test('_moveToZh - 兵（同列前后两兵，红前兵横移）', () => {
  const chess = new Chess('5k3/4P4/4P4/9/9/9/4p4/4p4/9/4K4 w - - 0 1')
  const move = chess.move({ from: 'e8', to: 'f8' })
  expect(move.zh).toBe('前兵平四')
})

test('_moveToZh - 兵（同列前后两兵，黑后卒横移）', () => {
  const chess = new Chess('5k3/4P4/4P4/9/9/9/4p4/4p4/9/4K4 b - - 0 1')
  const move = chess.move({ from: 'e3', to: 'f3' })
  expect(move.zh).toBe('后卒平６')
})

test('_moveToZh - 兵（同列三兵，红前兵横移）', () => {
  const chess = new Chess('5k3/4P4/4P4/4P4/9/4p4/4p4/4p4/9/4K4 w - - 0 1')
  const move = chess.move({ from: 'e8', to: 'f8' })
  expect(move.zh).toBe('前兵平四')
})

test('_moveToZh - 兵（单列独兵用列号，红兵前进）', () => {
  const chess = new Chess('5k3/9/4P4/9/9/9/4p4/9/9/4K4 w - - 0 1')
  const move = chess.move({ from: 'e7', to: 'e8' })
  expect(move.zh).toBe('兵五进一')
})

test('_moveToZh - 兵（单列独兵用列号，黑卒前进）', () => {
  const chess = new Chess('5k3/9/4P4/9/9/9/4p4/9/9/4K4 b - - 0 1')
  const move = chess.move({ from: 'e3', to: 'e2' })
  expect(move.zh).toBe('卒５进１')
})

test('_moveToZh - 士象', () => {
  const chess = new Chess('2bak4/9/3ab4/9/9/6B2/9/9/4A4/4KAB2 w - - 0 1')
  const move1 = chess.move({ from: 'g0', to: 'e2' })
  expect(move1.zh).toBe('相三进五')
  const move2 = chess.move({ from: 'd7', to: 'e8' })
  expect(move2.zh).toBe('士４退５')
})

test('FEN - 只传棋子排列，默认红方先行', () => {
  const chess = new Chess(
    'rnbakabnr/9/1c5c1/p1p1p1p1p/9/9/P1P1P1P1P/1C5C1/9/RNBAKABNR',
  )
  expect(chess.fen()).toBe(
    'rnbakabnr/9/1c5c1/p1p1p1p1p/9/9/P1P1P1P1P/1C5C1/9/RNBAKABNR w - - 0 1',
  )
})

test('FEN - 只传棋子排列+走子方', () => {
  const chess = new Chess(
    'rnbakabnr/9/1c5c1/p1p1p1p1p/9/9/P1P1P1P1P/1C5C1/9/RNBAKABNR b',
  )
  expect(chess.fen()).toBe(
    'rnbakabnr/9/1c5c1/p1p1p1p1p/9/9/P1P1P1P1P/1C5C1/9/RNBAKABNR b - - 0 1',
  )
})

test('move - 直行棋子退（红车退一）', () => {
  const chess = new Chess('4k4/9/9/9/4R4/9/9/9/9/4K4 w - - 0 1')
  const move = chess.move('车五退一')
  expect(move).not.toBeNull()
  expect(`${move!.from}${move!.to}`).toBe('e5e4')
})

test('move - 直行棋子退（黑车退１）', () => {
  const chess = new Chess('3k5/8r/9/9/9/9/9/9/9/4K4 b - - 0 1')
  const move = chess.move('车９退１')
  expect(move).not.toBeNull()
  expect(`${move!.from}${move!.to}`).toBe('i8i9')
})

test('move - 直行棋子退（红帅退一）', () => {
  const chess = new Chess('3k5/9/9/9/9/9/9/9/4K4/9 w - - 0 1')
  const move = chess.move('帅五退一')
  expect(move).not.toBeNull()
  expect(`${move!.from}${move!.to}`).toBe('e1e0')
})

test('move - 斜行棋子进退同列需辨向（红马）', () => {
  const chess = new Chess('3k5/9/9/9/4N4/9/9/9/9/4K4 w - - 0 1')
  const advance = chess.move('马五进四')
  expect(advance).not.toBeNull()
  expect(`${advance!.from}${advance!.to}`).toBe('e5f7')
  chess.undo()
  const retreat = chess.move('马五退四')
  expect(retreat).not.toBeNull()
  expect(`${retreat!.from}${retreat!.to}`).toBe('e5f3')
})

test('move - 斜行棋子进退同列需辨向（黑士）', () => {
  const chess = new Chess('3k5/4a4/9/9/9/9/9/9/9/4K4 b - - 0 1')
  const retreat = chess.move('士５退６')
  expect(retreat).not.toBeNull()
  expect(`${retreat!.from}${retreat!.to}`).toBe('e8f9')
  chess.undo()
  const advance = chess.move('士５进６')
  expect(advance).not.toBeNull()
  expect(`${advance!.from}${advance!.to}`).toBe('e8f7')
})

test('move - 前后缀直行棋子退（前车退二）', () => {
  const chess = new Chess('3k5/6r2/2R6/9/6r2/9/2R6/9/9/4K4 w - - 0 1')
  const move = chess.move('前车退二')
  expect(move).not.toBeNull()
  expect(`${move!.from}${move!.to}`).toBe('c7c5')
})

test('move - 前后缀直行棋子进（黑前车进２）', () => {
  const chess = new Chess('3k5/6r2/2R6/9/6r2/9/2R6/9/9/4K4 b - - 0 1')
  const move = chess.move('前车进２')
  expect(move).not.toBeNull()
  expect(`${move!.from}${move!.to}`).toBe('g5g3')
})

test('move - 百变象棋谱「八阵图」整局中文着法', () => {
  const chess = new Chess(
    '2bak3C/4a4/4b4/3P3R1/9/6R2/9/3p1p3/4K4/3r1r3 w - - 0 1',
  )
  const moves = [
    '车三进五',
    '士５退６',
    '车三退一',
    '士６进５',
    '车二进三',
    '士５退６',
    '车三平五',
    '士４进５',
    '车二退一',
    '象５退７',
    '车二平五',
    '将５平４',
    '车五进一',
    '将４进１',
    '兵六进一',
    '将４进１',
    '车五平六',
  ]
  for (const zh of moves) {
    const move = chess.move(zh)
    expect(move, zh).not.toBeNull()
  }
  expect(chess.fen()).toBe('2bR1ab1C/9/3k5/9/9/9/9/3p1p3/4K4/3r1r3 b - - 1 9')
})

test('move - 将军被牵制时前后缀按棋盘消歧（后炮退５）', () => {
  // 黑方正被红炮 h9（借红兵 f9 作炮架）将军，唯一合法应着是后炮 e4 垫将。
  // e3 炮无合法走法，前/后消歧必须依据棋盘位置而非合法走法列表。
  const chess = new Chess(
    '3k1P1C1/9/bN7/1P4p2/9/2p1cp3/4c4/2p1R1p2/2nrRrn2/2BAKAB2 b - - 0 7',
  )
  expect(chess.moves().length).toBe(1)
  const move = chess.move('后炮退５')
  expect(move).not.toBeNull()
  expect(`${move!.from}${move!.to}`).toBe('e4e9')
})

test('move - 百变象棋谱「二十八宿闹昆阳」整局中文着法', () => {
  const chess = new Chess(
    '5a3/4aP3/b2kb1NC1/1P4p2/9/N1p1cp3/4c4/2p1R1p2/2nrRrn2/2BAKAB2 w - - 0 1',
  )
  const moves = [
    '马九进七',
    '将４退１',
    '马三进四',
    '士５退６',
    '马七进八',
    '将４退１',
    '炮二进二',
    '士６进５',
    '兵四进一',
    '象５退７',
    '兵四平三',
    '士５退６',
    '兵三平四',
    '后炮退５',
    '兵四平五',
    '将４平５',
    '前车进一',
    '将５平６',
    '前车进六',
    '将６进１',
    '后车进七',
    '将６进１',
    '前车平四',
  ]
  for (const zh of moves) {
    const move = chess.move(zh)
    expect(move, zh).not.toBeNull()
  }
  expect(chess.fen()).toBe(
    '5R1C1/4R4/bN3k3/1P4p2/9/2p2p3/9/2p3p2/2nr1rn2/2BAKAB2 b - - 6 12',
  )
})
