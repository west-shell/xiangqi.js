// 放置棋子测试
import { Chess, Square, CANNON, WHITE } from '../src/chess'
import { expect, test } from 'vitest'

test('put - 在空格上放置棋子', () => {
  const chess = new Chess()
  expect(chess.put({ type: CANNON, color: WHITE }, 'e4' as Square)).toBe(true)
  expect(chess.get('e4' as Square)).toEqual({ type: CANNON, color: WHITE })
})

test('put - 覆盖已有棋子', () => {
  const chess = new Chess()
  expect(chess.put({ type: CANNON, color: WHITE }, 'a0' as Square)).toBe(true)
  expect(chess.get('a0' as Square)).toEqual({ type: CANNON, color: WHITE })
})

test('put - 无效位置返回 false', () => {
  const chess = new Chess()
  expect(chess.put({ type: CANNON, color: WHITE }, 'j9' as Square)).toBe(false)
})

test('put - 无效棋子返回 false', () => {
  const chess = new Chess()
  expect(chess.put({ type: 'x' as any, color: WHITE }, 'e4' as Square)).toBe(
    false,
  )
})

test('put - 不能放置超过一个将', () => {
  const chess = new Chess()
  expect(chess.put({ type: 'k' as any, color: WHITE }, 'e4' as Square)).toBe(
    false,
  )
})

test('put - 放子后 FEN 正确', () => {
  const chess = new Chess('9/9/9/9/9/4k4/9/9/9/4K4 w - - 0 1')
  chess.put({ type: CANNON, color: WHITE }, 'e4' as Square)
  expect(chess.fen()).toContain('4C4')
})
