export interface ExperimentScenario {
  name: string
  description: string
  learningObjectives: string[]
  setup: {
    gravity: [number, number, number]
    objects: Array<{
      shape: string
      position: [number, number, number]
      size?: [number, number, number]
      mass?: number
      isDynamic?: boolean
      color?: string
    }>
  }
  steps: Array<{
    description: string
    action: string
    expectedOutcome: string
  }>
  measurements: Array<{
    name: string
    type: 'speed' | 'energy' | 'distance' | 'angle'
    targetId?: string
  }>
  estimatedDuration: number // in seconds
  difficulty: 'beginner' | 'intermediate' | 'advanced'
}

export interface GenerationOptions {
  difficulty?: 'beginner' | 'intermediate' | 'advanced'
  duration?: number // max duration in seconds
  includeMeasurements?: boolean
  targetTopic?: string // e.g., 'energy', 'collision', 'gravity'
}

class ExperimentGenerator {
  private templates: Map<string, ExperimentScenario> = new Map()

  constructor() {
    this.initializeTemplates()
  }

  private initializeTemplates(): void {
    // Free fall experiment
    this.templates.set('free-fall', {
      name: '自由落体实验',
      description: '研究物体在重力作用下的自由落体运动',
      learningObjectives: [
        '理解重力加速度对物体运动的影响',
        '学习测量下落距离和时间',
        '验证自由落体运动规律',
      ],
      setup: {
        gravity: [0, -9.81, 0],
        objects: [
          {
            shape: 'box',
            position: [0, 10, 0],
            size: [0.5, 0.5, 0.5],
            mass: 1,
            isDynamic: true,
            color: '#3b82f6',
          },
          {
            shape: 'plane',
            position: [0, 0, 0],
            size: [10, 0.1, 10],
            mass: 0,
            isDynamic: false,
            color: '#8b7355',
          },
        ],
      },
      steps: [
        {
          description: '开始模拟',
          action: 'run_simulation',
          expectedOutcome: '物体开始下落',
        },
        {
          description: '观察物体下落',
          action: 'get_measurement_summary',
          expectedOutcome: '记录速度和高度变化',
        },
        {
          description: '分析运动数据',
          action: 'analyze_energy',
          expectedOutcome: '查看能量转换过程',
        },
      ],
      measurements: [
        { name: '速度', type: 'speed', targetId: 'box-1' },
        { name: '高度', type: 'distance' },
        { name: '动能', type: 'energy', targetId: 'box-1' },
        { name: '势能', type: 'energy', targetId: 'box-1' },
      ],
      estimatedDuration: 10,
      difficulty: 'beginner',
    })

    // Collision experiment
    this.templates.set('collision', {
      name: '弹性碰撞实验',
      description: '研究两个物体之间的弹性碰撞',
      learningObjectives: [
        '理解动量守恒定律',
        '观察碰撞前后的速度变化',
        '学习弹性系数的影响',
      ],
      setup: {
        gravity: [0, -9.81, 0],
        objects: [
          {
            shape: 'sphere',
            position: [-3, 1, 0],
            size: [0.4, 0, 0],
            mass: 1,
            isDynamic: true,
            color: '#ef4444',
          },
          {
            shape: 'sphere',
            position: [3, 1, 0],
            size: [0.4, 0, 0],
            mass: 1,
            isDynamic: true,
            color: '#22c55e',
          },
          {
            shape: 'plane',
            position: [0, 0, 0],
            size: [10, 0.1, 10],
            mass: 0,
            isDynamic: false,
            color: '#8b7355',
          },
        ],
      },
      steps: [
        {
          description: '对左侧球体施加向右的冲量',
          action: 'apply_impulse',
          expectedOutcome: '球体开始向右运动',
        },
        {
          description: '开始模拟',
          action: 'run_simulation',
          expectedOutcome: '两球发生碰撞',
        },
        {
          description: '测量碰撞后的速度',
          action: 'get_measurement_summary',
          expectedOutcome: '记录速度变化',
        },
      ],
      measurements: [
        { name: '速度', type: 'speed' },
        { name: '动能', type: 'energy' },
      ],
      estimatedDuration: 15,
      difficulty: 'intermediate',
    })

    // Pendulum experiment
    this.templates.set('pendulum', {
      name: '单摆实验',
      description: '研究单摆的周期性运动',
      learningObjectives: [
        '理解单摆的周期公式',
        '观察摆长对周期的影响',
        '学习简谐运动的基本概念',
      ],
      setup: {
        gravity: [0, -9.81, 0],
        objects: [
          {
            shape: 'sphere',
            position: [2, 5, 0],
            size: [0.3, 0, 0],
            mass: 1,
            isDynamic: true,
            color: '#8b5cf6',
          },
          {
            shape: 'box',
            position: [2, 8, 0],
            size: [0.2, 0.2, 0.2],
            mass: 0,
            isDynamic: false,
            color: '#6b7280',
          },
          {
            shape: 'plane',
            position: [0, 0, 0],
            size: [10, 0.1, 10],
            mass: 0,
            isDynamic: false,
            color: '#8b7355',
          },
        ],
      },
      steps: [
        {
          description: '将球体向左移动并释放',
          action: 'modify_object',
          expectedOutcome: '球体开始摆动',
        },
        {
          description: '开始模拟',
          action: 'run_simulation',
          expectedOutcome: '球体进行周期性摆动',
        },
        {
          description: '测量摆动周期',
          action: 'get_measurement_summary',
          expectedOutcome: '记录运动数据',
        },
      ],
      measurements: [
        { name: '速度', type: 'speed' },
        { name: '高度', type: 'distance' },
        { name: '动能', type: 'energy' },
        { name: '势能', type: 'energy' },
      ],
      estimatedDuration: 20,
      difficulty: 'intermediate',
    })

    // Ramp experiment
    this.templates.set('ramp', {
      name: '斜面滑块实验',
      description: '研究物体在斜面上的运动',
      learningObjectives: [
        '理解重力沿斜面的分量',
        '学习摩擦力对运动的影响',
        '测量加速度',
      ],
      setup: {
        gravity: [0, -9.81, 0],
        objects: [
          {
            shape: 'box',
            position: [0, 3, 0],
            size: [0.5, 0.5, 0.5],
            mass: 1,
            isDynamic: true,
            color: '#f59e0b',
          },
          {
            shape: 'slope',
            position: [0, 1.5, 0],
            size: [5, 0.1, 2],
            mass: 0,
            isDynamic: false,
            color: '#8b7355',
          },
          {
            shape: 'plane',
            position: [0, 0, 0],
            size: [10, 0.1, 10],
            mass: 0,
            isDynamic: false,
            color: '#8b7355',
          },
        ],
      },
      steps: [
        {
          description: '开始模拟',
          action: 'run_simulation',
          expectedOutcome: '滑块沿斜面下滑',
        },
        {
          description: '测量下滑速度',
          action: 'get_measurement_summary',
          expectedOutcome: '记录速度变化',
        },
        {
          description: '分析能量转换',
          action: 'analyze_energy',
          expectedOutcome: '查看能量守恒',
        },
      ],
      measurements: [
        { name: '速度', type: 'speed' },
        { name: '动能', type: 'energy' },
        { name: '势能', type: 'energy' },
      ],
      estimatedDuration: 15,
      difficulty: 'beginner',
    })
  }

  generateFromDescription(
    description: string,
    options: GenerationOptions = {}
  ): ExperimentScenario | null {
    const lowerDesc = description.toLowerCase()

    // Try to match with existing templates
    for (const [key, template] of this.templates.entries()) {
      if (lowerDesc.includes(key) || this.matchesKeywords(lowerDesc, key)) {
        return this.customizeTemplate(template, options)
      }
    }

    // Generate custom experiment based on keywords
    return this.generateCustomExperiment(description, options)
  }

  private matchesKeywords(description: string, templateKey: string): boolean {
    const keywords: Record<string, string[]> = {
      'free-fall': ['下落', '重力', '自由', 'fall', 'gravity'],
      'collision': ['碰撞', '撞击', 'collision', 'impact', 'momentum'],
      'pendulum': ['摆', '周期', 'pendulum', 'oscillation', 'swing'],
      'ramp': ['斜面', '滑块', 'ramp', 'slope', 'incline'],
    }

    const templateKeywords = keywords[templateKey] || []
    return templateKeywords.some(kw => description.includes(kw))
  }

  private customizeTemplate(
    template: ExperimentScenario,
    options: GenerationOptions
  ): ExperimentScenario {
    const customized = { ...template }

    if (options.difficulty) {
      customized.difficulty = options.difficulty
    }

    if (options.duration && customized.estimatedDuration > options.duration) {
      customized.estimatedDuration = options.duration
    }

    if (!options.includeMeasurements) {
      customized.measurements = []
    }

    return customized
  }

  private generateCustomExperiment(
    description: string,
    options: GenerationOptions
  ): ExperimentScenario | null {
    // Basic custom experiment generation
    const hasCollision = description.includes('碰撞') || description.includes('collision')
    const hasEnergy = description.includes('能量') || description.includes('energy')

    if (hasCollision) {
      return this.customizeTemplate(this.templates.get('collision')!, options)
    }

    if (hasEnergy) {
      return this.customizeTemplate(this.templates.get('free-fall')!, options)
    }

    // Default to free fall
    return this.customizeTemplate(this.templates.get('free-fall')!, {
      ...options,
      difficulty: options.difficulty || 'beginner',
    })
  }

  getAvailableTemplates(): ExperimentScenario[] {
    return Array.from(this.templates.values())
  }

  getTemplateByName(name: string): ExperimentScenario | undefined {
    return Array.from(this.templates.values()).find(t => t.name === name)
  }
}

export const experimentGenerator = new ExperimentGenerator()
