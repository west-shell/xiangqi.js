// 历史记录测试
import { Chess } from '../src/chess'
import { expect, test } from 'vitest'

test('history - 初始局面无历史记录', () => {
  const chess = new Chess()
  expect(chess.history()).toEqual([])
})

test('history - 走子后记录正确的着法字符串', () => {
  const chess = new Chess()
  chess.move('b0c2')
  chess.move('b9a7')
  const history = chess.history()
  expect(history).toHaveLength(2)
  expect(history[0]).toBe('b0c2')
  expect(history[1]).toBe('b9a7')
})

test('history - 详解模式输出完整着法信息', () => {
  const chess = new Chess()
  chess.move('b0c2')
  const history = chess.history({ verbose: true })
  expect(history).toHaveLength(1)
  expect(history[0].piece).toBe('n')
  expect(history[0].from).toBe('b0')
  expect(history[0].to).toBe('c2')
})

test('history - 空着出现在历史记录中', () => {
  const chess = new Chess()
  chess.move('b0c2')
  chess.move('--')
  const history = chess.history()
  expect(history).toHaveLength(2)
  expect(history[1]).toBe('--')
})
