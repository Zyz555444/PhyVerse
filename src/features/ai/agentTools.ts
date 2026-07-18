import type { SandboxItem, SandboxShape } from '@/features/sandbox/sandboxStore'

export interface AgentToolParameter {
  type: string
  description: string
  enum?: string[]
  items?: Partial<AgentToolParameter>
}

export interface AgentTool {
  type: 'function'
  function: {
    name: string
    description: string
    parameters: {
      type: 'object'
      properties: Record<string, AgentToolParameter>
      required: string[]
    }
  }
}

export interface ToolCallResult {
  success: boolean
  message: string
  data?: unknown
}

export interface AgentToolContext {
  items: SandboxItem[]
  selectedId: string | null
  isRunning: boolean
  gravity: [number, number, number]
  measurements: {
    speed: number
    ke: number
    pe: number
    totalEnergy: number
    posY: number
    distance: number
    distanceTargets: [string, string] | null
  }
  actions: {
    addItem: (
      shape: SandboxShape,
      position: [number, number, number],
      patch?: Partial<SandboxItem>
    ) => void
    run: () => void
    pause: () => void
    reset: () => void
    setTimeScale: (scale: number) => void
    clearScene: () => void
    selectItem: (id: string | null) => void
    setGravity: (gravity: [number, number, number]) => void
    applyImpulse: (id: string, impulse: [number, number, number]) => void
    saveScene: (name: string, description?: string) => Promise<void>
  }
}

export const AGENT_TOOLS: AgentTool[] = [
  {
    type: 'function',
    function: {
      name: 'get_scene_info',
      description: '获取当前沙盒场景的完整信息，包括所有物体、重力设置、运行状态和选中物体。',
      parameters: {
        type: 'object',
        properties: {},
        required: [],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_measurement_summary',
      description:
        '获取当前场景或选中物体的测量数据摘要，包括速度、动能、势能、总能量、高度和距离。',
      parameters: {
        type: 'object',
        properties: {
          itemId: {
            type: 'string',
            description: '可选，指定物体的 ID。不提供则返回选中物体或整体摘要。',
          },
        },
        required: [],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'add_object',
      description: '在当前场景中添加一个物理物体。支持方块、球体、圆柱体、斜坡等。',
      parameters: {
        type: 'object',
        properties: {
          shape: {
            type: 'string',
            description: '物体类型：box, sphere, cylinder, ramp',
            enum: ['box', 'sphere', 'cylinder', 'ramp'],
          },
          name: {
            type: 'string',
            description: '物体显示名称',
          },
          position: {
            type: 'array',
            items: { type: 'number' },
            description: '位置坐标 [x, y, z]，例如 [0, 2, 0]',
          },
          size: {
            type: 'array',
            items: { type: 'number' },
            description: '尺寸 [width, height, depth]，例如 [1, 1, 1]',
          },
          color: {
            type: 'string',
            description: '颜色十六进制，例如 #3b82f6',
          },
          mass: {
            type: 'number',
            description: '质量（千克），默认 1.0',
          },
          isDynamic: {
            type: 'boolean',
            description: '是否可运动，默认 true',
          },
        },
        required: ['shape', 'position'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'run_simulation',
      description: '开始或继续运行物理模拟。',
      parameters: {
        type: 'object',
        properties: {},
        required: [],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'pause_simulation',
      description: '暂停物理模拟。',
      parameters: {
        type: 'object',
        properties: {},
        required: [],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'reset_scene',
      description: '清空当前场景中的所有物体，恢复初始状态。',
      parameters: {
        type: 'object',
        properties: {
          confirm: {
            type: 'boolean',
            description: '必须设置为 true 才会执行清空操作',
          },
        },
        required: ['confirm'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'set_time_scale',
      description: '设置模拟时间缩放倍率，影响物理运行速度。',
      parameters: {
        type: 'object',
        properties: {
          scale: {
            type: 'number',
            description: '时间缩放倍率，例如 0.5 表示半速，2.0 表示两倍速',
          },
        },
        required: ['scale'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'set_gravity',
      description: '设置全局重力加速度。',
      parameters: {
        type: 'object',
        properties: {
          x: { type: 'number', description: 'X 轴重力分量' },
          y: { type: 'number', description: 'Y 轴重力分量' },
          z: { type: 'number', description: 'Z 轴重力分量' },
        },
        required: ['x', 'y', 'z'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'apply_impulse',
      description: '对指定物体施加一个瞬时冲量，使其产生运动。',
      parameters: {
        type: 'object',
        properties: {
          itemId: {
            type: 'string',
            description: '目标物体 ID 或名称',
          },
          force: {
            type: 'array',
            items: { type: 'number' },
            description: '冲量向量 [x, y, z]，例如 [5, 0, 0]',
          },
        },
        required: ['itemId', 'force'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'save_experiment',
      description: '将当前场景保存到云端实验库。',
      parameters: {
        type: 'object',
        properties: {
          name: {
            type: 'string',
            description: '实验名称',
          },
          description: {
            type: 'string',
            description: '实验描述',
          },
        },
        required: ['name'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'select_object',
      description: '选中或取消选中一个物体，以便查看其测量数据。',
      parameters: {
        type: 'object',
        properties: {
          itemId: {
            type: 'string',
            description: '物体 ID 或名称。不提供则取消选中。',
          },
        },
        required: [],
      },
    },
  },
]

function findItemByIdOrName(items: SandboxItem[], idOrName: string): SandboxItem | undefined {
  return items.find((it) => it.id === idOrName || (it.displayName ?? it.id) === idOrName)
}

function parseVector(raw: string | unknown[] | undefined, defaultValue: number[]): number[] {
  if (!raw) return defaultValue
  if (Array.isArray(raw) && raw.every((v) => typeof v === 'number')) {
    return raw as number[]
  }
  if (typeof raw === 'string') {
    try {
      const parsed = JSON.parse(raw)
      if (Array.isArray(parsed) && parsed.every((v) => typeof v === 'number')) {
        return parsed
      }
    } catch {
      // ignore
    }
  }
  return defaultValue
}

export async function executeTool(
  name: string,
  args: Record<string, unknown>,
  ctx: AgentToolContext
): Promise<ToolCallResult> {
  switch (name) {
    case 'get_scene_info': {
      return {
        success: true,
        message: `当前场景包含 ${ctx.items.length} 个物体，重力为 [${ctx.gravity.join(', ')}]，模拟${ctx.isRunning ? '运行中' : '已暂停'}。`,
        data: {
          itemCount: ctx.items.length,
          gravity: ctx.gravity,
          isRunning: ctx.isRunning,
          selectedId: ctx.selectedId,
          items: ctx.items.map((it) => ({
            id: it.id,
            name: it.displayName ?? it.id,
            type: it.shape,
            position: it.position,
            mass: it.mass,
            isDynamic: it.isDynamic,
          })),
        },
      }
    }

    case 'get_measurement_summary': {
      const itemId = typeof args.itemId === 'string' ? args.itemId : ctx.selectedId
      const item = itemId ? findItemByIdOrName(ctx.items, itemId) : undefined
      if (item) {
        return {
          success: true,
          message: `物体 "${item.displayName ?? item.id}" 的测量摘要：速度 ${ctx.measurements.speed.toFixed(2)} m/s，高度 ${ctx.measurements.posY.toFixed(2)} m，动能 ${ctx.measurements.ke.toFixed(2)} J，势能 ${ctx.measurements.pe.toFixed(2)} J，总能量 ${ctx.measurements.totalEnergy.toFixed(2)} J。`,
          data: {
            itemId: item.id,
            name: item.displayName ?? item.id,
            speed: ctx.measurements.speed,
            height: ctx.measurements.posY,
            kineticEnergy: ctx.measurements.ke,
            potentialEnergy: ctx.measurements.pe,
            totalEnergy: ctx.measurements.totalEnergy,
            distance: ctx.measurements.distance,
          },
        }
      }
      return {
        success: true,
        message: `场景整体测量摘要：总能量 ${ctx.measurements.totalEnergy.toFixed(2)} J，当前距离测量 ${ctx.measurements.distance.toFixed(2)} m。`,
        data: ctx.measurements,
      }
    }

    case 'add_object': {
      const type = args.shape as SandboxShape | undefined
      if (!type) {
        return { success: false, message: '缺少物体类型参数' }
      }
      const position = parseVector(args.position as unknown[] | string | undefined, [0, 2, 0]) as [
        number,
        number,
        number,
      ]
      const size = parseVector(args.size as unknown[] | string | undefined, [1, 1, 1]) as [
        number,
        number,
        number,
      ]
      const name = typeof args.name === 'string' ? args.name : `${type}-${Date.now()}`
      ctx.actions.addItem(type, position, {
        size: size as [number, number, number],
        displayName: name,
        color: typeof args.color === 'string' ? args.color : '#3b82f6',
        mass: typeof args.mass === 'number' ? args.mass : 1,
        isDynamic: typeof args.isDynamic === 'boolean' ? args.isDynamic : true,
      })
      return { success: true, message: `已添加 ${name} (${type}) 到场景。` }
    }

    case 'run_simulation': {
      ctx.actions.run()
      return { success: true, message: '已开始运行模拟。' }
    }

    case 'pause_simulation': {
      ctx.actions.pause()
      return { success: true, message: '已暂停模拟。' }
    }

    case 'reset_scene': {
      if (args.confirm !== true) {
        return { success: false, message: '请设置 confirm: true 以确认清空场景。' }
      }
      ctx.actions.clearScene()
      return { success: true, message: '场景已清空。' }
    }

    case 'set_time_scale': {
      const scale = typeof args.scale === 'number' ? args.scale : 1
      ctx.actions.setTimeScale(Math.max(0.1, Math.min(scale, 5)))
      return { success: true, message: `时间缩放已设置为 ${scale}x。` }
    }

    case 'set_gravity': {
      const gx = typeof args.x === 'number' ? args.x : 0
      const gy = typeof args.y === 'number' ? args.y : -9.81
      const gz = typeof args.z === 'number' ? args.z : 0
      ctx.actions.setGravity([gx, gy, gz])
      return { success: true, message: `重力已设置为 [${gx}, ${gy}, ${gz}]。` }
    }

    case 'apply_impulse': {
      const itemId = typeof args.itemId === 'string' ? args.itemId : ''
      const item = findItemByIdOrName(ctx.items, itemId)
      if (!item) {
        return { success: false, message: `未找到物体 "${itemId}"。` }
      }
      const force = parseVector(args.force as unknown[] | string | undefined, [1, 0, 0]) as [
        number,
        number,
        number,
      ]
      ctx.actions.applyImpulse(item.id, force)
      return {
        success: true,
        message: `已对 "${item.displayName ?? item.id}" 施加冲量 [${force.join(', ')}]。`,
      }
    }

    case 'save_experiment': {
      const name = typeof args.name === 'string' ? args.name : ''
      if (!name) {
        return { success: false, message: '实验名称不能为空。' }
      }
      await ctx.actions.saveScene(
        name,
        typeof args.description === 'string' ? args.description : undefined
      )
      return { success: true, message: `实验 "${name}" 已保存到云端。` }
    }

    case 'select_object': {
      const itemId = typeof args.itemId === 'string' ? args.itemId : null
      if (!itemId) {
        ctx.actions.selectItem(null)
        return { success: true, message: '已取消选中。' }
      }
      const item = findItemByIdOrName(ctx.items, itemId)
      if (!item) {
        return { success: false, message: `未找到物体 "${itemId}"。` }
      }
      ctx.actions.selectItem(item.id)
      return { success: true, message: `已选中 "${item.displayName ?? item.id}"。` }
    }

    default:
      return { success: false, message: `未知工具：${name}` }
  }
}
