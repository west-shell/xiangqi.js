// 撤销着法测试
import { Chess } from '../src/chess'
import { expect, test } from 'vitest'

test('undo - 基本撤销', () => {
  const chess = new Chess()

  chess.move('b0c2')
  chess.move('b9a7')
  expect(chess.undo()?.san).toBe('马2进1')
  expect(chess.undo()?.san).toBe('马八进七')
  expect(chess.undo()).toBeNull()
})

test('undo - 撤销后局面恢复', () => {
  const chess = new Chess()
  const startFen = chess.fen()

  chess.move('b0c2')
  chess.undo()
  expect(chess.fen()).toBe(startFen)
})
