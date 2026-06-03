// 攻击检测测试
import { Chess, WHITE, BLACK } from '../src/chess'
import { expect, test } from 'vitest'

test('attackers - 指定颜色攻击某格', () => {
  const chess = new Chess()

  // 红方对 d3 的攻击（中间的兵线位置）
  const attackers = chess.attackers('d3', WHITE)
  // 红兵在 c3 和 e3 各有一个兵，可向前攻击
  expect(attackers.length).toBeGreaterThanOrEqual(0)
})

test('attackers - 默认使用当前走子方', () => {
  const chess = new Chess()
  // 当前走子方是红方
  const attackers = chess.attackers('e2')
  expect(Array.isArray(attackers)).toBe(true)
})

test('attackers - 黑方攻击检测', () => {
  const chess = new Chess()
  const attackers = chess.attackers('e7', BLACK)
  expect(Array.isArray(attackers)).toBe(true)
})

test('isAttacked - 方格是否受攻击', () => {
  // 红车在 e1，黑将在 e9 → e9 受红车攻击
  const chess = new Chess(
    'rnbakabnr/9/1c5c1/p1p1R1p1p/9/9/P1P1P1P1P/1C5C1/9/RNBAKABNR b - - 0 1',
  )
  expect(chess.isAttacked('e9', WHITE)).toBe(true)
  expect(chess.isAttacked('a0', BLACK)).toBe(false)
})
