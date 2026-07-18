import { describe, it, expect } from 'vitest'
import { analyzeScene } from '../ExperimentAnalyzer'
import type { SandboxItem, SandboxJoint, TelemetrySample } from '@/features/sandbox/sandboxStore'

function makeItem(overrides: Partial<SandboxItem> = {}): SandboxItem {
  return {
    id: 'item-1',
    shape: 'box',
    position: [0, 0, 0],
    rotation: [0, 0, 0],
    scale: [1, 1, 1],
    size: [1, 1, 1],
    material: 'plastic',
    color: '#ffffff',
    isDynamic: true,
    mass: 1,
    friction: 0.5,
    restitution: 0.3,
    ...overrides,
  }
}

function makeTelemetry(overrides: Partial<TelemetrySample> = {}): TelemetrySample {
  return {
    t: 1,
    pos: [0, 0, 0],
    vel: [0, 0, 0],
    speed: 0,
    accel: 0,
    ke: 0,
    pe: 0,
    ...overrides,
  }
}

const GRAVITY: [number, number, number] = [0, -9.81, 0]

describe('analyzeScene', () => {
  it('reports an empty scene when there are no dynamic items', () => {
    const result = analyzeScene([], [], GRAVITY, null, false, 0)

    expect(result.insights).toHaveLength(1)
    expect(result.insights[0].type).toBe('info')
    expect(result.insights[0].title).toBe('场景为空')
    expect(result.summary).toContain('没有动态物体')
  })

  it('treats static-only scenes as empty', () => {
    const staticItem = makeItem({ isDynamic: false })
    const result = analyzeScene([staticItem], [], GRAVITY, null, false, 0)

    expect(result.insights).toHaveLength(1)
    expect(result.insights[0].title).toBe('场景为空')
  })

  it('flags a suspended object when not running', () => {
    const ball = makeItem({ shape: 'sphere', position: [0, 3, 0], displayName: '红球' })
    const result = analyzeScene([ball], [], GRAVITY, null, false, 0)

    const suspended = result.insights.find((i) => i.title.includes('悬空'))
    expect(suspended).toBeDefined()
    expect(suspended?.title).toContain('红球')
    expect(suspended?.detail).toContain('9.81')
  })

  it('does not flag a suspended object while running', () => {
    const ball = makeItem({ shape: 'sphere', position: [0, 3, 0] })
    const result = analyzeScene([ball], [], GRAVITY, null, true, 0)

    expect(result.insights.some((i) => i.title.includes('悬空'))).toBe(false)
  })

  it('analyzes spring joints and detects stretch vs compression', () => {
    const a = makeItem({ id: 'a', position: [0, 0, 0] })
    const b = makeItem({ id: 'b', position: [0, 0, 3] })
    const stretchedJoint: SandboxJoint = {
      id: 'j1',
      type: 'spring',
      bodyA: 'a',
      bodyB: 'b',
      restLength: 1,
      stiffness: 200,
    }

    const stretched = analyzeScene([a, b], [stretchedJoint], GRAVITY, null, false, 0)
    const springInsight = stretched.insights.find((i) => i.title === '弹簧分析')
    expect(springInsight).toBeDefined()
    expect(springInsight?.detail).toContain('拉伸')
    expect(springInsight?.detail).toContain('200')

    const compressed = analyzeScene(
      [makeItem({ id: 'a', position: [0, 0, 0] }), makeItem({ id: 'b', position: [0, 0, 0.5] })],
      [stretchedJoint],
      GRAVITY,
      null,
      false,
      0
    )
    expect(compressed.insights.find((i) => i.title === '弹簧分析')?.detail).toContain('压缩')
  })

  it('uses default rest length and stiffness for springs when unspecified', () => {
    const a = makeItem({ id: 'a', position: [0, 0, 0] })
    const b = makeItem({ id: 'b', position: [0, 0, 2] })
    const joint: SandboxJoint = { id: 'j', type: 'spring', bodyA: 'a', bodyB: 'b' }

    const result = analyzeScene([a, b], [joint], GRAVITY, null, false, 0)
    const spring = result.insights.find((i) => i.title === '弹簧分析')
    expect(spring?.detail).toContain('100')
    expect(spring?.detail).toContain('拉伸')
  })

  it('ignores spring joints referencing missing bodies', () => {
    const a = makeItem({ id: 'a' })
    const joint: SandboxJoint = { id: 'j', type: 'spring', bodyA: 'a', bodyB: 'missing' }
    const result = analyzeScene([a], [joint], GRAVITY, null, false, 0)
    expect(result.insights.some((i) => i.title === '弹簧分析')).toBe(false)
  })

  it('computes pendulum period for revolute joints', () => {
    const bob = makeItem({ id: 'bob', position: [0, 0, 0] })
    const joint: SandboxJoint = {
      id: 'r',
      type: 'revolute',
      bodyA: 'pivot',
      bodyB: 'bob',
      anchorA: [0, 4, 0],
    }
    const result = analyzeScene([bob], [joint], GRAVITY, null, false, 0)
    const pendulum = result.insights.find((i) => i.title === '单摆分析')
    expect(pendulum).toBeDefined()
    const expectedPeriod = 2 * Math.PI * Math.sqrt(4 / 9.81)
    expect(pendulum?.detail).toContain(expectedPeriod.toFixed(2))
  })

  it('skips pendulum analysis for negligible lengths', () => {
    const bob = makeItem({ id: 'bob', position: [0, 0, 0] })
    const joint: SandboxJoint = {
      id: 'r',
      type: 'revolute',
      bodyA: 'pivot',
      bodyB: 'bob',
      anchorA: [0, 0.05, 0],
    }
    const result = analyzeScene([bob], [joint], GRAVITY, null, false, 0)
    expect(result.insights.some((i) => i.title === '单摆分析')).toBe(false)
  })

  it('computes slope descent acceleration', () => {
    const slope = makeItem({ id: 's', shape: 'slope', rotation: [Math.PI / 6, 0, 0] })
    const ball = makeItem({ id: 'ball', shape: 'sphere' })
    const result = analyzeScene([slope, ball], [], GRAVITY, null, false, 0)
    const slopeInsight = result.insights.find((i) => i.title === '斜面运动')
    expect(slopeInsight).toBeDefined()
    expect(slopeInsight?.detail).toContain('30°')
    const expectedAccel = 9.81 * Math.sin(Math.PI / 6)
    expect(slopeInsight?.detail).toContain(expectedAccel.toFixed(2))
  })

  it('warns about high-speed motion from telemetry', () => {
    const ball = makeItem({ shape: 'sphere' })
    const telemetry = makeTelemetry({ speed: 15, ke: 100, pe: 10, accel: 5 })
    const result = analyzeScene([ball], [], GRAVITY, telemetry, true, 2)

    const warning = result.insights.find((i) => i.title === '高速运动')
    expect(warning).toBeDefined()
    expect(warning?.type).toBe('warning')
  })

  it('detects an object coming to rest', () => {
    const ball = makeItem({ shape: 'sphere' })
    const telemetry = makeTelemetry({ speed: 0.001, accel: 0.001 })
    const result = analyzeScene([ball], [], GRAVITY, telemetry, true, 2)
    expect(result.insights.some((i) => i.title === '物体趋于静止')).toBe(true)
  })

  it('reports energy dominance from telemetry', () => {
    const ball = makeItem({ shape: 'sphere' })
    const keDominant = analyzeScene([ball], [], GRAVITY, makeTelemetry({ ke: 50, pe: 10 }), true, 1)
    expect(keDominant.insights.find((i) => i.title === '能量分析')?.detail).toContain('动能占主导')

    const peDominant = analyzeScene([ball], [], GRAVITY, makeTelemetry({ ke: 5, pe: 40 }), true, 1)
    expect(peDominant.insights.find((i) => i.title === '能量分析')?.detail).toContain('势能占主导')
  })

  it('does not use telemetry insights when not running', () => {
    const ball = makeItem({ shape: 'sphere' })
    const telemetry = makeTelemetry({ speed: 15, ke: 100, pe: 10 })
    const result = analyzeScene([ball], [], GRAVITY, telemetry, false, 2)
    expect(result.insights.some((i) => i.title === '高速运动')).toBe(false)
    expect(result.insights.some((i) => i.title === '能量分析')).toBe(false)
  })

  it('describes pulley systems', () => {
    const pulley = makeItem({ id: 'p', shape: 'pulley' })
    const ball = makeItem({ id: 'ball', shape: 'sphere' })
    const result = analyzeScene([pulley, ball], [], GRAVITY, null, false, 0)
    const pulleyInsight = result.insights.find((i) => i.title === '滑轮系统')
    expect(pulleyInsight).toBeDefined()
    expect(pulleyInsight?.detail).toContain('1 个滑轮')
  })

  it('summarizes counts of dynamic items, warnings and infos', () => {
    const fast = makeItem({ id: 'fast', shape: 'sphere' })
    const telemetry = makeTelemetry({ speed: 15, ke: 100, pe: 10, accel: 5 })
    const result = analyzeScene([fast], [], GRAVITY, telemetry, true, 3)

    const warnings = result.insights.filter((i) => i.type === 'warning').length
    const infos = result.insights.filter((i) => i.type === 'info').length
    expect(result.summary).toContain('1 个动态物体')
    expect(result.summary).toContain('已运行 3.0s')
    expect(result.summary).toContain(`${infos} 条信息`)
    expect(result.summary).toContain(`${warnings} 条提醒`)
  })
})
