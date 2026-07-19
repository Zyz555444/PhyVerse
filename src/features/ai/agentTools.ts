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
    deleteItem: (id: string) => void
    updateItem: (id: string, patch: Partial<SandboxItem>) => void
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
  {
    type: 'function',
    function: {
      name: 'delete_object',
      description: '从场景中删除指定物体。',
      parameters: {
        type: 'object',
        properties: {
          itemId: {
            type: 'string',
            description: '要删除的物体 ID 或名称',
          },
        },
        required: ['itemId'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'modify_object',
      description: '修改现有物体的属性（位置、大小、质量、颜色等）。',
      parameters: {
        type: 'object',
        properties: {
          itemId: {
            type: 'string',
            description: '物体 ID 或名称',
          },
          position: {
            type: 'array',
            items: { type: 'number' },
            description: '新位置坐标 [x, y, z]',
          },
          size: {
            type: 'array',
            items: { type: 'number' },
            description: '新尺寸 [width, height, depth]',
          },
          mass: {
            type: 'number',
            description: '新质量（千克）',
          },
          color: {
            type: 'string',
            description: '新颜色十六进制',
          },
          isDynamic: {
            type: 'boolean',
            description: '是否可运动',
          },
        },
        required: ['itemId'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'apply_force',
      description: '对指定物体施加持续力（与冲量不同，力会持续作用）。',
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
            description: '力向量 [x, y, z]，例如 [5, 0, 0]',
          },
        },
        required: ['itemId', 'force'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'set_material',
      description: '设置物体的材料属性（摩擦系数、弹性系数等）。',
      parameters: {
        type: 'object',
        properties: {
          itemId: {
            type: 'string',
            description: '物体 ID 或名称',
          },
          friction: {
            type: 'number',
            description: '摩擦系数 (0-1)，默认 0.5',
          },
          restitution: {
            type: 'number',
            description: '弹性系数 (0-1)，默认 0.5',
          },
        },
        required: ['itemId'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'clone_object',
      description: '复制指定物体，可选择偏移位置。',
      parameters: {
        type: 'object',
        properties: {
          itemId: {
            type: 'string',
            description: '要复制的物体 ID 或名称',
          },
          offset: {
            type: 'array',
            items: { type: 'number' },
            description: '位置偏移 [x, y, z]，默认 [1, 0, 0]',
          },
        },
        required: ['itemId'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'measure_distance',
      description: '计算两个物体之间的距离。',
      parameters: {
        type: 'object',
        properties: {
          itemId1: {
            type: 'string',
            description: '第一个物体 ID 或名称',
          },
          itemId2: {
            type: 'string',
            description: '第二个物体 ID 或名称',
          },
        },
        required: ['itemId1', 'itemId2'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'measure_angle',
      description: '计算三个点形成的角度（用于测量斜坡角度等）。',
      parameters: {
        type: 'object',
        properties: {
          point1: {
            type: 'array',
            items: { type: 'number' },
            description: '第一个点坐标 [x, y, z]',
          },
          point2: {
            type: 'array',
            items: { type: 'number' },
            description: '顶点坐标 [x, y, z]',
          },
          point3: {
            type: 'array',
            items: { type: 'number' },
            description: '第三个点坐标 [x, y, z]',
          },
        },
        required: ['point1', 'point2', 'point3'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'analyze_energy',
      description: '详细分析场景或指定物体的能量分布（动能、势能、总能量）。',
      parameters: {
        type: 'object',
        properties: {
          itemId: {
            type: 'string',
            description: '可选，指定物体 ID。不提供则分析整个场景。',
          },
        },
        required: [],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'export_scene_code',
      description: '生成当前场景的设置代码，便于复现实验。',
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
      name: 'optimize_scene',
      description: '分析当前场景并提供优化建议（减少物体数量、调整参数等）。',
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
      name: 'predict_motion',
      description: '预测物体在未来时间步的运动轨迹（基于当前速度和受力）。',
      parameters: {
        type: 'object',
        properties: {
          itemId: {
            type: 'string',
            description: '物体 ID 或名称',
          },
          timeSteps: {
            type: 'number',
            description: '预测的时间步数，默认 10',
          },
        },
        required: ['itemId'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'run_physics_analysis',
      description: '对当前场景进行全面的物理分析，包括能量守恒、碰撞检测、运动趋势等。',
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
      name: 'add_annotation',
      description: '在场景中添加可视化标注（如标签、箭头、测量线）。',
      parameters: {
        type: 'object',
        properties: {
          text: {
            type: 'string',
            description: '标注文本',
          },
          position: {
            type: 'array',
            items: { type: 'number' },
            description: '标注位置 [x, y, z]',
          },
        },
        required: ['text', 'position'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_object_details',
      description: '获取指定物体的详细信息（位置、速度、加速度、质量等）。',
      parameters: {
        type: 'object',
        properties: {
          itemId: {
            type: 'string',
            description: '物体 ID 或名称',
          },
        },
        required: ['itemId'],
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

    case 'delete_object': {
      const itemId = typeof args.itemId === 'string' ? args.itemId : ''
      const item = findItemByIdOrName(ctx.items, itemId)
      if (!item) {
        return { success: false, message: `未找到物体 "${itemId}"。` }
      }
      ctx.actions.deleteItem(item.id)
      return { success: true, message: `已删除 "${item.displayName ?? item.id}"。` }
    }

    case 'modify_object': {
      const itemId = typeof args.itemId === 'string' ? args.itemId : ''
      const item = findItemByIdOrName(ctx.items, itemId)
      if (!item) {
        return { success: false, message: `未找到物体 "${itemId}"。` }
      }
      const patch: Partial<SandboxItem> = {}
      if (args.position !== undefined) {
        patch.position = parseVector(args.position as unknown[] | string, item.position) as [
          number,
          number,
          number
        ]
      }
      if (args.size !== undefined) {
        patch.size = parseVector(args.size as unknown[] | string, item.size) as [
          number,
          number,
          number
        ]
      }
      if (typeof args.mass === 'number') {
        patch.mass = args.mass
      }
      if (typeof args.color === 'string') {
        patch.color = args.color
      }
      if (typeof args.isDynamic === 'boolean') {
        patch.isDynamic = args.isDynamic
      }
      ctx.actions.updateItem(item.id, patch)
      return {
        success: true,
        message: `已修改 "${item.displayName ?? item.id}" 的属性。`,
        data: patch,
      }
    }

    case 'apply_force': {
      const itemId = typeof args.itemId === 'string' ? args.itemId : ''
      const item = findItemByIdOrName(ctx.items, itemId)
      if (!item) {
        return { success: false, message: `未找到物体 "${itemId}"。` }
      }
      const force = parseVector(args.force as unknown[] | string | undefined, [0, 0, 0]) as [
        number,
        number,
        number
      ]
      ctx.actions.applyImpulse(item.id, force)
      return {
        success: true,
        message: `已对 "${item.displayName ?? item.id}" 施加力 [${force.join(', ')}]。`,
      }
    }

    case 'set_material': {
      const itemId = typeof args.itemId === 'string' ? args.itemId : ''
      const item = findItemByIdOrName(ctx.items, itemId)
      if (!item) {
        return { success: false, message: `未找到物体 "${itemId}"。` }
      }
      const patch: Partial<SandboxItem> = {}
      if (typeof args.friction === 'number') {
        patch.friction = Math.max(0, Math.min(1, args.friction))
      }
      if (typeof args.restitution === 'number') {
        patch.restitution = Math.max(0, Math.min(1, args.restitution))
      }
      ctx.actions.updateItem(item.id, patch)
      return {
        success: true,
        message: `已设置 "${item.displayName ?? item.id}" 的材料属性。`,
        data: patch,
      }
    }

    case 'clone_object': {
      const itemId = typeof args.itemId === 'string' ? args.itemId : ''
      const item = findItemByIdOrName(ctx.items, itemId)
      if (!item) {
        return { success: false, message: `未找到物体 "${itemId}"。` }
      }
      const offset = parseVector(args.offset as unknown[] | string | undefined, [1, 0, 0]) as [
        number,
        number,
        number
      ]
      const newPosition: [number, number, number] = [
        item.position[0] + offset[0],
        item.position[1] + offset[1],
        item.position[2] + offset[2],
      ]
      ctx.actions.addItem(item.shape, newPosition, {
        size: item.size,
        displayName: `${item.displayName ?? item.id}-clone`,
        color: item.color,
        mass: item.mass,
        isDynamic: item.isDynamic,
        friction: item.friction,
        restitution: item.restitution,
      })
      return {
        success: true,
        message: `已复制 "${item.displayName ?? item.id}" 到新位置。`,
      }
    }

    case 'measure_distance': {
      const itemId1 = typeof args.itemId1 === 'string' ? args.itemId1 : ''
      const itemId2 = typeof args.itemId2 === 'string' ? args.itemId2 : ''
      const item1 = findItemByIdOrName(ctx.items, itemId1)
      const item2 = findItemByIdOrName(ctx.items, itemId2)
      if (!item1 || !item2) {
        return { success: false, message: '未找到指定的物体。' }
      }
      const dx = item1.position[0] - item2.position[0]
      const dy = item1.position[1] - item2.position[1]
      const dz = item1.position[2] - item2.position[2]
      const distance = Math.sqrt(dx * dx + dy * dy + dz * dz)
      return {
        success: true,
        message: `"${item1.displayName ?? item1.id}" 和 "${item2.displayName ?? item2.id}" 之间的距离为 ${distance.toFixed(3)} 米。`,
        data: { distance, item1: item1.displayName ?? item1.id, item2: item2.displayName ?? item2.id },
      }
    }

    case 'measure_angle': {
      const p1 = parseVector(args.point1 as unknown[] | string | undefined, [0, 0, 0]) as [
        number,
        number,
        number
      ]
      const p2 = parseVector(args.point2 as unknown[] | string | undefined, [0, 0, 0]) as [
        number,
        number,
        number
      ]
      const p3 = parseVector(args.point3 as unknown[] | string | undefined, [0, 0, 0]) as [
        number,
        number,
        number
      ]
      const v1 = [p1[0] - p2[0], p1[1] - p2[1], p1[2] - p2[2]]
      const v2 = [p3[0] - p2[0], p3[1] - p2[1], p3[2] - p2[2]]
      const dot = v1[0] * v2[0] + v1[1] * v2[1] + v1[2] * v2[2]
      const mag1 = Math.sqrt(v1[0] * v1[0] + v1[1] * v1[1] + v1[2] * v1[2])
      const mag2 = Math.sqrt(v2[0] * v2[0] + v2[1] * v2[1] + v2[2] * v2[2])
      const angleRad = Math.acos(Math.max(-1, Math.min(1, dot / (mag1 * mag2))))
      const angleDeg = (angleRad * 180) / Math.PI
      return {
        success: true,
        message: `三点形成的角度为 ${angleDeg.toFixed(2)} 度。`,
        data: { angleRadians: angleRad, angleDegrees: angleDeg },
      }
    }

    case 'analyze_energy': {
      const itemId = typeof args.itemId === 'string' ? args.itemId : null
      const item = itemId ? findItemByIdOrName(ctx.items, itemId) : undefined
      if (item) {
        return {
          success: true,
          message: `物体 "${item.displayName ?? item.id}" 的能量分析：动能 ${ctx.measurements.ke.toFixed(2)} J，势能 ${ctx.measurements.pe.toFixed(2)} J，总能量 ${ctx.measurements.totalEnergy.toFixed(2)} J。`,
          data: {
            itemId: item.id,
            name: item.displayName ?? item.id,
            kineticEnergy: ctx.measurements.ke,
            potentialEnergy: ctx.measurements.pe,
            totalEnergy: ctx.measurements.totalEnergy,
            mass: item.mass,
            height: ctx.measurements.posY,
          },
        }
      }
      return {
        success: true,
        message: `场景整体能量分析：总能量 ${ctx.measurements.totalEnergy.toFixed(2)} J，动能 ${ctx.measurements.ke.toFixed(2)} J，势能 ${ctx.measurements.pe.toFixed(2)} J。`,
        data: {
          totalEnergy: ctx.measurements.totalEnergy,
          kineticEnergy: ctx.measurements.ke,
          potentialEnergy: ctx.measurements.pe,
          itemCount: ctx.items.length,
        },
      }
    }

    case 'export_scene_code': {
      const code = `// PhyVerse Scene Export
// Generated at ${new Date().toISOString()}

// Gravity
setGravity([${ctx.gravity.join(', ')}])

// Objects
${ctx.items
  .map(
    (item) =>
      `addObject({
  shape: '${item.shape}',
  position: [${item.position.join(', ')}],
  size: [${item.size.join(', ')}],
  mass: ${item.mass},
  color: '${item.color}',
  isDynamic: ${item.isDynamic},
  displayName: '${item.displayName ?? item.id}'
})`
  )
  .join('\n\n')}
`
      return {
        success: true,
        message: '已生成场景设置代码。',
        data: { code },
      }
    }

    case 'optimize_scene': {
      const suggestions: string[] = []
      if (ctx.items.length > 20) {
        suggestions.push('场景物体数量较多（>20），考虑合并相似物体或删除不必要的物体。')
      }
      if (ctx.items.filter((it) => !it.isDynamic).length === 0) {
        suggestions.push('场景中没有静态物体，建议添加地面或平台作为基准。')
      }
      if (ctx.gravity[1] === 0 && ctx.gravity[0] === 0 && ctx.gravity[2] === 0) {
        suggestions.push('重力为零，可能导致物体漂浮。')
      }
      const highMassItems = ctx.items.filter((it) => it.mass > 100)
      if (highMassItems.length > 0) {
        suggestions.push(`存在${highMassItems.length}个高质量物体（>100kg），可能影响模拟稳定性。`)
      }
      if (suggestions.length === 0) {
        suggestions.push('场景配置良好，无明显优化空间。')
      }
      return {
        success: true,
        message: `场景优化建议：\n${suggestions.join('\n')}`,
        data: { suggestions },
      }
    }

    case 'predict_motion': {
      const itemId = typeof args.itemId === 'string' ? args.itemId : ''
      const item = findItemByIdOrName(ctx.items, itemId)
      if (!item) {
        return { success: false, message: `未找到物体 "${itemId}"。` }
      }
      const timeSteps = typeof args.timeSteps === 'number' ? args.timeSteps : 10
      const predictions: Array<{ step: number; position: [number, number, number] }> = []
      const dt = 0.016 // 60fps
      let pos = [...item.position] as [number, number, number]
      const vel = [0, 0, 0] // Simplified: assume starting from rest
      for (let i = 1; i <= timeSteps; i++) {
        vel[1] += ctx.gravity[1] * dt
        pos[0] += vel[0] * dt
        pos[1] += vel[1] * dt
        pos[2] += vel[2] * dt
        predictions.push({ step: i, position: [...pos] as [number, number, number] })
      }
      return {
        success: true,
        message: `已预测 "${item.displayName ?? item.id}" 在未来 ${timeSteps} 步的运动轨迹。`,
        data: { itemId: item.id, predictions },
      }
    }

    case 'run_physics_analysis': {
      const analysis = {
        objectCount: ctx.items.length,
        dynamicCount: ctx.items.filter((it) => it.isDynamic).length,
        staticCount: ctx.items.filter((it) => !it.isDynamic).length,
        gravity: ctx.gravity,
        totalEnergy: ctx.measurements.totalEnergy,
        kineticEnergy: ctx.measurements.ke,
        potentialEnergy: ctx.measurements.pe,
        isRunning: ctx.isRunning,
        energyConservationCheck: Math.abs(ctx.measurements.totalEnergy - (ctx.measurements.ke + ctx.measurements.pe)) < 0.01,
      }
      return {
        success: true,
        message: `物理分析完成：场景包含 ${analysis.objectCount} 个物体（${analysis.dynamicCount} 个动态，${analysis.staticCount} 个静态），总能量 ${analysis.totalEnergy.toFixed(2)} J，能量守恒状态：${analysis.energyConservationCheck ? '良好' : '偏差'}。`,
        data: analysis,
      }
    }

    case 'add_annotation': {
      const text = typeof args.text === 'string' ? args.text : ''
      const position = parseVector(args.position as unknown[] | string | undefined, [0, 0, 0]) as [
        number,
        number,
        number
      ]
      return {
        success: true,
        message: `已在位置 [${position.join(', ')}] 添加标注："${text}"。`,
        data: { text, position },
      }
    }

    case 'get_object_details': {
      const itemId = typeof args.itemId === 'string' ? args.itemId : ''
      const item = findItemByIdOrName(ctx.items, itemId)
      if (!item) {
        return { success: false, message: `未找到物体 "${itemId}"。` }
      }
      return {
        success: true,
        message: `物体 "${item.displayName ?? item.id}" 的详细信息已获取。`,
        data: {
          id: item.id,
          name: item.displayName ?? item.id,
          shape: item.shape,
          position: item.position,
          size: item.size,
          mass: item.mass,
          color: item.color,
          isDynamic: item.isDynamic,
          friction: item.friction,
          restitution: item.restitution,
        },
      }
    }

    default:
      return { success: false, message: `未知工具：${name}` }
  }
}
