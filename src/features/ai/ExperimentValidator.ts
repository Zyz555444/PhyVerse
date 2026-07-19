import type { ExperimentScenario } from './ExperimentGenerator'

export interface ValidationResult {
  valid: boolean
  errors: string[]
  warnings: string[]
  suggestions: string[]
}

export interface ValidationRule {
  id: string
  name: string
  description: string
  severity: 'error' | 'warning' | 'info'
  validate: (scenario: ExperimentScenario) => ValidationResult
}

class ExperimentValidator {
  private rules: ValidationRule[] = []

  constructor() {
    this.initializeRules()
  }

  private initializeRules(): void {
    // Rule: Check for required fields
    this.rules.push({
      id: 'required_fields',
      name: '必填字段检查',
      description: '确保实验场景包含所有必需字段',
      severity: 'error',
      validate: (scenario) => {
        const errors: string[] = []
        if (!scenario.name || scenario.name.trim() === '') {
          errors.push('实验名称不能为空')
        }
        if (!scenario.description || scenario.description.trim() === '') {
          errors.push('实验描述不能为空')
        }
        if (!scenario.setup || !scenario.setup.objects) {
          errors.push('实验设置必须包含物体')
        }
        if (!scenario.steps || scenario.steps.length === 0) {
          errors.push('实验必须包含至少一个步骤')
        }
        return { valid: errors.length === 0, errors, warnings: [], suggestions: [] }
      },
    })

    // Rule: Check object count
    this.rules.push({
      id: 'object_count',
      name: '物体数量检查',
      description: '确保物体数量在合理范围内',
      severity: 'warning',
      validate: (scenario) => {
        const warnings: string[] = []
        const objectCount = scenario.setup.objects.length
        if (objectCount === 0) {
          warnings.push('实验没有包含任何物体')
        } else if (objectCount > 20) {
          warnings.push(`物体数量过多 (${objectCount})，可能影响性能`)
        }
        return { valid: true, errors: [], warnings, suggestions: [] }
      },
    })

    // Rule: Check gravity
    this.rules.push({
      id: 'gravity_check',
      name: '重力检查',
      description: '确保重力设置合理',
      severity: 'warning',
      validate: (scenario) => {
        const warnings: string[] = []
        const suggestions: string[] = []
        const [gx, gy, gz] = scenario.setup.gravity
        const gMagnitude = Math.sqrt(gx * gx + gy * gy + gz * gz)
        
        if (gMagnitude === 0) {
          warnings.push('重力为零，物体会漂浮')
          suggestions.push('如果需要重力，建议设置为 [0, -9.81, 0]')
        } else if (gMagnitude > 20) {
          warnings.push(`重力过大 (${gMagnitude.toFixed(2)} m/s²)，可能导致不稳定`)
          suggestions.push('建议将重力设置为接近地球重力 9.81 m/s²')
        }
        
        return { valid: true, errors: [], warnings, suggestions }
      },
    })

    // Rule: Check for ground plane
    this.rules.push({
      id: 'ground_plane',
      name: '地面检查',
      description: '确保有地面或基准面',
      severity: 'warning',
      validate: (scenario) => {
        const warnings: string[] = []
        const suggestions: string[] = []
        const hasPlane = scenario.setup.objects.some(obj => obj.shape === 'plane')
        const hasDynamicObjects = scenario.setup.objects.some(obj => obj.isDynamic)
        
        if (hasDynamicObjects && !hasPlane) {
          warnings.push('场景中没有地面，动态物体可能无限下落')
          suggestions.push('建议添加一个平面作为地面')
        }
        
        return { valid: true, errors: [], warnings, suggestions }
      },
    })

    // Rule: Check object positions
    this.rules.push({
      id: 'object_positions',
      name: '物体位置检查',
      description: '检查物体位置是否合理',
      severity: 'warning',
      validate: (scenario) => {
        const warnings: string[] = []
        const suggestions: string[] = []
        
        for (const obj of scenario.setup.objects) {
          const [x, y, z] = obj.position
          
          if (y < -10) {
            warnings.push(`物体位置过低 (${obj.shape} at y=${y})`)
            suggestions.push('建议将物体位置调整到合理高度')
          }
          
          if (Math.abs(x) > 50 || Math.abs(y) > 50 || Math.abs(z) > 50) {
            warnings.push(`物体位置过远 (${obj.shape} at [${x}, ${y}, ${z}])`)
          }
        }
        
        return { valid: true, errors: [], warnings, suggestions }
      },
    })

    // Rule: Check mass合理性
    this.rules.push({
      id: 'mass_check',
      name: '质量检查',
      description: '检查物体质量是否合理',
      severity: 'warning',
      validate: (scenario) => {
        const warnings: string[] = []
        const suggestions: string[] = []
        
        for (const obj of scenario.setup.objects) {
          if (obj.isDynamic && obj.mass !== undefined) {
            if (obj.mass <= 0) {
              warnings.push(`动态物体质量必须大于零 (${obj.shape})`)
            } else if (obj.mass > 1000) {
              warnings.push(`物体质量过大 (${obj.shape}: ${obj.mass}kg)`)
              suggestions.push('建议减小质量以提高模拟稳定性')
            }
          }
        }
        
        return { valid: true, errors: [], warnings, suggestions }
      },
    })

    // Rule: Check step validity
    this.rules.push({
      id: 'step_validity',
      name: '步骤有效性检查',
      description: '检查实验步骤是否有效',
      severity: 'warning',
      validate: (scenario) => {
        const warnings: string[] = []
        
        for (let i = 0; i < scenario.steps.length; i++) {
          const step = scenario.steps[i]
          if (!step.description || step.description.trim() === '') {
            warnings.push(`步骤 ${i + 1} 缺少描述`)
          }
          if (!step.action || step.action.trim() === '') {
            warnings.push(`步骤 ${i + 1} 缺少操作`)
          }
        }
        
        return { valid: true, errors: [], warnings, suggestions: [] }
      },
    })

    // Rule: Check estimated duration
    this.rules.push({
      id: 'duration_check',
      name: '时长检查',
      description: '检查实验预计时长是否合理',
      severity: 'info',
      validate: (scenario) => {
        const warnings: string[] = []
        const suggestions: string[] = []
        
        if (scenario.estimatedDuration <= 0) {
          warnings.push('实验时长必须大于零')
        } else if (scenario.estimatedDuration > 300) {
          warnings.push(`实验时长过长 (${scenario.estimatedDuration}秒)`)
          suggestions.push('建议将实验时长控制在5分钟以内')
        }
        
        return { valid: true, errors: [], warnings, suggestions }
      },
    })

    // Rule: Check difficulty level
    this.rules.push({
      id: 'difficulty_check',
      name: '难度检查',
      description: '检查难度级别是否有效',
      severity: 'error',
      validate: (scenario) => {
        const errors: string[] = []
        const validDifficulties = ['beginner', 'intermediate', 'advanced']
        
        if (!validDifficulties.includes(scenario.difficulty)) {
          errors.push(`无效的难度级别: ${scenario.difficulty}`)
        }
        
        return { valid: errors.length === 0, errors, warnings: [], suggestions: [] }
      },
    })

    // Rule: Check for collision setup
    this.rules.push({
      id: 'collision_setup',
      name: '碰撞设置检查',
      description: '检查碰撞实验的设置',
      severity: 'info',
      validate: (scenario) => {
        const suggestions: string[] = []
        const isCollisionExperiment = 
          scenario.name.includes('碰撞') || 
          scenario.name.includes('collision') ||
          scenario.description.includes('碰撞') ||
          scenario.description.includes('collision')
        
        if (isCollisionExperiment) {
          const dynamicCount = scenario.setup.objects.filter(obj => obj.isDynamic).length
          if (dynamicCount < 2) {
            suggestions.push('碰撞实验建议至少包含2个动态物体')
          }
        }
        
        return { valid: true, errors: [], warnings: [], suggestions }
      },
    })

    // Rule: Check measurement setup
    this.rules.push({
      id: 'measurement_setup',
      name: '测量设置检查',
      description: '检查测量配置是否合理',
      severity: 'info',
      validate: (scenario) => {
        const warnings: string[] = []
        const suggestions: string[] = []
        
        if (scenario.measurements && scenario.measurements.length > 0) {
          for (const measurement of scenario.measurements) {
            if (measurement.targetId) {
              const targetExists = scenario.setup.objects.some(obj => 
                obj.shape === measurement.targetId || 
                (measurement.targetId.startsWith('box-') && obj.shape === 'box')
              )
              if (!targetExists) {
                warnings.push(`测量目标不存在: ${measurement.targetId}`)
              }
            }
          }
        }
        
        return { valid: true, errors: [], warnings, suggestions }
      },
    })
  }

  validate(scenario: ExperimentScenario): ValidationResult {
    const allErrors: string[] = []
    const allWarnings: string[] = []
    const allSuggestions: string[] = []

    for (const rule of this.rules) {
      const result = rule.validate(scenario)
      allErrors.push(...result.errors)
      allWarnings.push(...result.warnings)
      allSuggestions.push(...result.suggestions)
    }

    return {
      valid: allErrors.length === 0,
      errors: allErrors,
      warnings: allWarnings,
      suggestions: allSuggestions,
    }
  }

  validateQuick(scenario: ExperimentScenario): boolean {
    const result = this.validate(scenario)
    return result.valid && result.warnings.length === 0
  }

  getRule(id: string): ValidationRule | undefined {
    return this.rules.find(rule => rule.id === id)
  }

  getAllRules(): ValidationRule[] {
    return [...this.rules]
  }
}

export const experimentValidator = new ExperimentValidator()
