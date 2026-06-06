// 文件名: moveToSan.test.ts
import { Chess, WHITE, BLACK, ROOK, PAWN, KING } from '../src/chess'
import { expect, test } from 'vitest'

test('_moveToZh - 车', () => {
    const chess = new Chess("3k5/6r2/2R6/9/6r2/9/2R6/9/9/4K4 w - - 0 1")
    const move1 = chess.move({ from: 'c7', to: 'c5' })
    expect(move1.zh).toBe('前车退二')
    const move2 = chess.move({ from: 'g5', to: 'g3' })
    expect(move2.zh).toBe('前车进2')
})

test('_moveToZh - 兵（两列各多兵，全局编号）', () => {
    const chess = new Chess("4k4/3P1P3/4P4/3P1P3/9/3p1p3/4p4/3p1p3/9/4K4 w - - 0 1")
    const move1 = chess.move({ from: 'f8', to: 'g8' })
    expect(move1.zh).toBe('一兵平三')
    const move2 = chess.move({ from: 'd4', to: 'c4' })
    expect(move2.zh).toBe('二卒平3')
})

test('_moveToZh - 兵（同列前后两兵，红前兵横移）', () => {
    const chess = new Chess("5k3/4P4/4P4/9/9/9/4p4/4p4/9/4K4 w - - 0 1")
    const move = chess.move({ from: 'e8', to: 'f8' })
    expect(move.zh).toBe('前兵平四')
})

test('_moveToZh - 兵（同列前后两兵，黑后卒横移）', () => {
    const chess = new Chess("5k3/4P4/4P4/9/9/9/4p4/4p4/9/4K4 b - - 0 1")
    const move = chess.move({ from: 'e3', to: 'f3' })
    expect(move.zh).toBe('后卒平6')
})

test('_moveToZh - 兵（同列三兵，红前兵横移）', () => {
    const chess = new Chess("5k3/4P4/4P4/4P4/9/4p4/4p4/4p4/9/4K4 w - - 0 1")
    const move = chess.move({ from: 'e8', to: 'f8' })
    expect(move.zh).toBe('前兵平四')
})

test('_moveToZh - 兵（单列独兵用列号，红兵前进）', () => {
    const chess = new Chess("5k3/9/4P4/9/9/9/4p4/9/9/4K4 w - - 0 1")
    const move = chess.move({ from: 'e7', to: 'e8' })
    expect(move.zh).toBe('兵五进一')
})

test('_moveToZh - 兵（单列独兵用列号，黑卒前进）', () => {
    const chess = new Chess("5k3/9/4P4/9/9/9/4p4/9/9/4K4 b - - 0 1")
    const move = chess.move({ from: 'e3', to: 'e2' })
    expect(move.zh).toBe('卒5进1')
})

test('_moveToZh - 士象', () => {
    const chess = new Chess("2bak4/9/3ab4/9/9/6B2/9/9/4A4/4KAB2 w - - 0 1")
    const move1 = chess.move({ from: 'g0', to: 'e2' })
    expect(move1.zh).toBe('相三进五')
    const move2 = chess.move({ from: 'd7', to: 'e8' })
    expect(move2.zh).toBe('士4退5')
})
