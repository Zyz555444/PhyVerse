/**
 * @deprecated ExperimentAnalyzer 已被 AiAgentPanel + agentTools 替代。
 * 旧版基于规则匹配的场景分析器，功能已整合到 LLM 驱动的 Agent 工具系统中。
 * 该文件将在后续版本中移除。
 */
import type { SandboxItem, SandboxJoint, TelemetrySample } from '@/features/sandbox/sandboxStore'

export interface AIInsight {
  type: 'info' | 'warning' | 'success' | 'error'
  title: string
  detail: string
  timestamp: number
}

export interface SceneAnalysis {
  insights: AIInsight[]
  summary: string
}

export function analyzeScene(
  items: SandboxItem[],
  joints: SandboxJoint[],
  gravity: [number, number, number],
  telemetry: TelemetrySample | null,
  isRunning: boolean,
  simTime: number
): SceneAnalysis {
  const insights: AIInsight[] = []
  const dynamicItems = items.filter((it) => it.isDynamic)
  const gY = Math.abs(gravity[1])

  if (dynamicItems.length === 0) {
    insights.push({
      type: 'info',
      title: '场景为空',
      detail: '当前场景中没有动态物体。请从器材库添加物体（如小球、方块），然后点击运行开始实验。',
      timestamp: Date.now(),
    })
    return { insights, summary: '场景中没有动态物体，请添加器材开始实验。' }
  }

  // Check falling objects
  for (const item of dynamicItems) {
    if (item.position[1] > 0.5 && !isRunning) {
      insights.push({
        type: 'info',
        title: `物体 "${item.displayName || item.shape}" 悬空`,
        detail: `位于 y=${item.position[1].toFixed(2)}m，运行后将以约 ${gY.toFixed(2)} m/s² 加速度下落。`,
        timestamp: Date.now(),
      })
    }
  }

  // Spring analysis
  const springJoints = joints.filter((j) => j.type === 'spring')
  for (const joint of springJoints) {
    const a = items.find((it) => it.id === joint.bodyA)
    const b = items.find((it) => it.id === joint.bodyB)
    if (a && b) {
      const dist = Math.hypot(
        b.position[0] - a.position[0],
        b.position[1] - a.position[1],
        b.position[2] - a.position[2]
      )
      const restLen = joint.restLength ?? 1
      const stiffness = joint.stiffness ?? 100
      insights.push({
        type: 'info',
        title: '弹簧分析',
        detail: `原长 ${restLen.toFixed(2)}m，当前距离 ${dist.toFixed(2)}m，劲度系数 ${stiffness} N/m。${dist > restLen ? '正处于拉伸状态' : '正处于压缩状态'}`,
        timestamp: Date.now(),
      })
    }
  }

  // Pendulum
  const revoluteJoints = joints.filter((j) => j.type === 'revolute')
  for (const joint of revoluteJoints) {
    const item = items.find((it) => it.id === joint.bodyB)
    if (item) {
      const pivotY = joint.anchorA?.[1] ?? 0
      const length = Math.abs(pivotY - item.position[1])
      if (length > 0.1) {
        const period = 2 * Math.PI * Math.sqrt(length / gY)
        insights.push({
          type: 'info',
          title: '单摆分析',
          detail: `摆长约 ${length.toFixed(2)}m，理论周期 T ≈ ${period.toFixed(2)}s。`,
          timestamp: Date.now(),
        })
      }
    }
  }

  // Slope analysis
  for (const item of items) {
    if (item.shape === 'slope') {
      const angle = Math.abs(item.rotation?.[0] ?? 0)
      if (angle > 0.01) {
        const a = gY * Math.sin(angle)
        insights.push({
          type: 'info',
          title: '斜面运动',
          detail: `斜面角度约 ${Math.round((angle * 180) / Math.PI)}°，无摩擦下滑加速度约 ${a.toFixed(2)} m/s²。`,
          timestamp: Date.now(),
        })
      }
    }
  }

  // Real-time telemetry
  if (telemetry && isRunning) {
    const { speed, ke, pe, accel } = telemetry
    const totalE = ke + pe

    if (speed > 10) {
      insights.push({
        type: 'warning',
        title: '高速运动',
        detail: `追踪物体速度 ${speed.toFixed(1)} m/s。考虑减小时间倍率以便观察。`,
        timestamp: Date.now(),
      })
    }

    if (accel < 0.01 && speed < 0.01 && simTime > 1) {
      insights.push({
        type: 'info',
        title: '物体趋于静止',
        detail: '追踪物体已基本停止运动，可能已到达平衡位置。',
        timestamp: Date.now(),
      })
    }

    if (simTime > 0.5 && totalE > 0) {
      insights.push({
        type: 'info',
        title: '能量分析',
        detail: `动能 ${ke.toFixed(2)} J，势能 ${pe.toFixed(2)} J，总机械能 ${totalE.toFixed(2)} J。${ke > pe ? '动能占主导' : '势能占主导'}`,
        timestamp: Date.now(),
      })
    }
  }

  // Pulley
  const pulleys = items.filter((it) => it.shape === 'pulley')
  if (pulleys.length > 0) {
    insights.push({
      type: 'info',
      title: '滑轮系统',
      detail: `包含 ${pulleys.length} 个滑轮。定滑轮改变力的方向，动滑轮可省力一半。`,
      timestamp: Date.now(),
    })
  }

  const warnings = insights.filter((i) => i.type === 'warning').length
  const infos = insights.filter((i) => i.type === 'info').length
  let summary = `分析完成：${dynamicItems.length} 个动态物体`
  if (simTime > 0) {
    summary += `，已运行 ${simTime.toFixed(1)}s`
  }
  summary += `。${infos} 条信息，${warnings} 条提醒。`

  return { insights, summary }
}
