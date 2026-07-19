export interface PhysicsFormula {
  id: string
  name: string
  formula: string
  variables: Record<string, string>
  description: string
  category: 'mechanics' | 'energy' | 'dynamics' | 'kinematics' | 'waves'
  difficulty: 'beginner' | 'intermediate' | 'advanced'
}

export interface PhysicsConcept {
  id: string
  name: string
  description: string
  keyPoints: string[]
  relatedFormulas: string[]
  commonMisconceptions: string[]
  examples: string[]
  category: string
}

export interface PhysicsExperiment {
  id: string
  name: string
  objective: string
  materials: string[]
  procedure: string[]
  expectedResults: string
  analysis: string
  category: string
}

class PhysicsKnowledgeBase {
  private formulas: Map<string, PhysicsFormula> = new Map()
  private concepts: Map<string, PhysicsConcept> = new Map()
  private experiments: Map<string, PhysicsExperiment> = new Map()

  constructor() {
    this.initializeFormulas()
    this.initializeConcepts()
    this.initializeExperiments()
  }

  private initializeFormulas(): void {
    // Kinematics
    this.formulas.set('velocity', {
      id: 'velocity',
      name: '速度',
      formula: 'v = Δx / Δt',
      variables: {
        v: '速度 (m/s)',
        Δx: '位移 (m)',
        Δt: '时间间隔 (s)',
      },
      description: '速度是位移随时间的变化率，表示物体运动的快慢和方向。',
      category: 'kinematics',
      difficulty: 'beginner',
    })

    this.formulas.set('acceleration', {
      id: 'acceleration',
      name: '加速度',
      formula: 'a = Δv / Δt',
      variables: {
        a: '加速度 (m/s²)',
        Δv: '速度变化 (m/s)',
        Δt: '时间间隔 (s)',
      },
      description: '加速度是速度随时间的变化率，表示速度变化的快慢。',
      category: 'kinematics',
      difficulty: 'beginner',
    })

    this.formulas.set('displacement', {
      id: 'displacement',
      name: '匀加速直线运动位移',
      formula: 'x = v0*t + 0.5*a*t^2',
      variables: {
        x: '位移 (m)',
        v0: '初速度 (m/s)',
        t: '时间 (s)',
        a: '加速度 (m/s^2)',
      },
      description: '在匀加速直线运动中，位移与初速度、加速度和时间的关系。',
      category: 'kinematics',
      difficulty: 'intermediate',
    })

    this.formulas.set('velocity_squared', {
      id: 'velocity_squared',
      name: '速度-位移关系',
      formula: 'v^2 = v0^2 + 2ax',
      variables: {
        v: '末速度 (m/s)',
        v0: '初速度 (m/s)',
        a: '加速度 (m/s^2)',
        x: '位移 (m)',
      },
      description: '在匀加速运动中，速度平方与位移的关系，不涉及时间。',
      category: 'kinematics',
      difficulty: 'intermediate',
    })

    // Dynamics
    this.formulas.set('newton_second', {
      id: 'newton_second',
      name: '牛顿第二定律',
      formula: 'F = ma',
      variables: {
        F: '合外力 (N)',
        m: '质量 (kg)',
        a: '加速度 (m/s²)',
      },
      description: '物体的加速度与所受合外力成正比，与质量成反比。',
      category: 'dynamics',
      difficulty: 'beginner',
    })

    this.formulas.set('gravity_force', {
      id: 'gravity_force',
      name: '重力',
      formula: 'Fg = mg',
      variables: {
        Fg: '重力 (N)',
        m: '质量 (kg)',
        g: '重力加速度 (m/s²)',
      },
      description: '地球表面附近物体受到的重力，g ≈ 9.81 m/s²。',
      category: 'dynamics',
      difficulty: 'beginner',
    })

    this.formulas.set('friction', {
      id: 'friction',
      name: '摩擦力',
      formula: 'f = μN',
      variables: {
        f: '摩擦力 (N)',
        μ: '摩擦系数',
        N: '正压力 (N)',
      },
      description: '滑动摩擦力与正压力成正比，μ为摩擦系数。',
      category: 'dynamics',
      difficulty: 'intermediate',
    })

    // Energy
    this.formulas.set('kinetic_energy', {
      id: 'kinetic_energy',
      name: '动能',
      formula: 'Ek = 0.5*m*v^2',
      variables: {
        Ek: '动能 (J)',
        m: '质量 (kg)',
        v: '速度 (m/s)',
      },
      description: '物体由于运动而具有的能量，与质量和速度平方成正比。',
      category: 'energy',
      difficulty: 'beginner',
    })

    this.formulas.set('potential_energy', {
      id: 'potential_energy',
      name: '重力势能',
      formula: 'Ep = mgh',
      variables: {
        Ep: '重力势能 (J)',
        m: '质量 (kg)',
        g: '重力加速度 (m/s²)',
        h: '高度 (m)',
      },
      description: '物体由于高度而具有的能量，与质量、高度和重力加速度成正比。',
      category: 'energy',
      difficulty: 'beginner',
    })

    this.formulas.set('conservation_energy', {
      id: 'conservation_energy',
      name: '机械能守恒',
      formula: 'E = Ek + Ep = 常数',
      variables: {
        E: '总机械能 (J)',
        Ek: '动能 (J)',
        Ep: '势能 (J)',
      },
      description: '在只有重力或弹力做功的系统内，机械能保持不变。',
      category: 'energy',
      difficulty: 'intermediate',
    })

    this.formulas.set('work', {
      id: 'work',
      name: '功',
      formula: 'W = F·d·cosθ',
      variables: {
        W: '功 (J)',
        F: '力 (N)',
        d: '位移 (m)',
        θ: '力与位移的夹角',
      },
      description: '力对物体做的功等于力、位移和它们夹角余弦的乘积。',
      category: 'energy',
      difficulty: 'intermediate',
    })

    // Momentum
    this.formulas.set('momentum', {
      id: 'momentum',
      name: '动量',
      formula: 'p = mv',
      variables: {
        p: '动量 (kg·m/s)',
        m: '质量 (kg)',
        v: '速度 (m/s)',
      },
      description: '动量是质量和速度的乘积，是矢量。',
      category: 'mechanics',
      difficulty: 'intermediate',
    })

    this.formulas.set('impulse', {
      id: 'impulse',
      name: '冲量',
      formula: 'I = FΔt = Δp',
      variables: {
        I: '冲量 (N·s)',
        F: '力 (N)',
        Δt: '时间间隔 (s)',
        Δp: '动量变化 (kg·m/s)',
      },
      description: '冲量等于力与时间的乘积，也等于动量的变化。',
      category: 'mechanics',
      difficulty: 'intermediate',
    })

    this.formulas.set('conservation_momentum', {
      id: 'conservation_momentum',
      name: '动量守恒',
      formula: 'p1 + p2 = p1_prime + p2_prime',
      variables: {
        p1: '物体1初始动量',
        p2: '物体2初始动量',
        p1_prime: '物体1末动量',
        p2_prime: '物体2末动量',
      },
      description: '在不受外力或合外力为零的系统内，总动量守恒。',
      category: 'mechanics',
      difficulty: 'advanced',
    })

    // Circular Motion
    this.formulas.set('centripetal_acceleration', {
      id: 'centripetal_acceleration',
      name: '向心加速度',
      formula: 'ac = v²/r = ω²r',
      variables: {
        ac: '向心加速度 (m/s²)',
        v: '线速度 (m/s)',
        r: '半径 (m)',
        ω: '角速度 (rad/s)',
      },
      description: '做圆周运动的物体具有指向圆心的加速度。',
      category: 'mechanics',
      difficulty: 'advanced',
    })

    this.formulas.set('centripetal_force', {
      id: 'centripetal_force',
      name: '向心力',
      formula: 'Fc = mv²/r = mω²r',
      variables: {
        Fc: '向心力 (N)',
        m: '质量 (kg)',
        v: '线速度 (m/s)',
        r: '半径 (m)',
        ω: '角速度 (rad/s)',
      },
      description: '使物体做圆周运动所需的指向圆心的力。',
      category: 'mechanics',
      difficulty: 'advanced',
    })

    // Pendulum
    this.formulas.set('pendulum_period', {
      id: 'pendulum_period',
      name: '单摆周期',
      formula: 'T = 2π√(l/g)',
      variables: {
        T: '周期 (s)',
        l: '摆长 (m)',
        g: '重力加速度 (m/s²)',
      },
      description: '单摆的周期与摆长的平方根成正比，与重力加速度的平方根成反比。',
      category: 'waves',
      difficulty: 'intermediate',
    })

    // Spring
    this.formulas.set('hooke_law', {
      id: 'hooke_law',
      name: '胡克定律',
      formula: 'F = -kx',
      variables: {
        F: '弹力 (N)',
        k: '劲度系数 (N/m)',
        x: '形变量 (m)',
      },
      description: '弹簧的弹力与形变量成正比，方向相反。',
      category: 'mechanics',
      difficulty: 'beginner',
    })

    this.formulas.set('spring_energy', {
      id: 'spring_energy',
      name: '弹性势能',
      formula: 'Es = 0.5*k*x^2',
      variables: {
        Es: '弹性势能 (J)',
        k: '劲度系数 (N/m)',
        x: '形变量 (m)',
      },
      description: '弹簧由于形变而具有的能量。',
      category: 'energy',
      difficulty: 'intermediate',
    })
  }

  private initializeConcepts(): void {
    this.concepts.set('inertia', {
      id: 'inertia',
      name: '惯性',
      description: '物体保持其运动状态不变的属性，质量是惯性的量度。',
      keyPoints: [
        '一切物体都有惯性',
        '质量越大，惯性越大',
        '惯性不是力',
        '惯性只与质量有关，与速度无关',
      ],
      relatedFormulas: ['newton_second'],
      commonMisconceptions: [
        '速度越大惯性越大（错误）',
        '不受力时物体没有惯性（错误）',
      ],
      examples: [
        '汽车刹车时乘客前倾',
        '拍打衣服除尘',
        '锤头松了撞击锤柄',
      ],
      category: 'dynamics',
    })

    this.concepts.set('free_fall', {
      id: 'free_fall',
      name: '自由落体',
      description: '物体只在重力作用下从静止开始下落的运动。',
      keyPoints: [
        '初速度为零',
        '加速度为g（约9.81m/s²）',
        '只受重力作用',
        '与物体质量无关',
      ],
      relatedFormulas: ['velocity', 'acceleration', 'displacement', 'gravity_force'],
      commonMisconceptions: [
        '重的物体下落更快（错误）',
        '自由落体不受空气阻力（理想情况）',
      ],
      examples: [
        '苹果从树上落下',
        '雨滴下落',
        '抛体运动的竖直分量',
      ],
      category: 'kinematics',
    })

    this.concepts.set('energy_conservation', {
      id: 'energy_conservation',
      name: '能量守恒',
      description: '能量既不会凭空产生，也不会凭空消失，只能从一种形式转化为另一种形式。',
      keyPoints: [
        '总能量保持不变',
        '能量可以相互转化',
        '机械能守恒是有条件的',
        '能量转化过程遵循守恒定律',
      ],
      relatedFormulas: ['conservation_energy', 'kinetic_energy', 'potential_energy'],
      commonMisconceptions: [
        '能量消失（错误）',
        '机械能总是守恒（错误）',
      ],
      examples: [
        '摆锤摆动',
        '过山车运动',
        '弹性碰撞',
      ],
      category: 'energy',
    })

    this.concepts.set('momentum_conservation', {
      id: 'momentum_conservation',
      name: '动量守恒',
      description: '在不受外力或合外力为零的系统内，总动量保持不变。',
      keyPoints: [
        '系统不受外力或合外力为零',
        '动量是矢量',
        '适用于碰撞、爆炸等过程',
        '内力不改变总动量',
      ],
      relatedFormulas: ['momentum', 'impulse', 'conservation_momentum'],
      commonMisconceptions: [
        '动量守恒就是速度守恒（错误）',
        '碰撞后动量一定不变（错误）',
      ],
      examples: [
        '台球碰撞',
        '火箭发射',
        '人从船上跳下',
      ],
      category: 'mechanics',
    })

    this.concepts.set('friction', {
      id: 'friction',
      name: '摩擦力',
      description: '两个接触物体之间阻碍相对运动的力。',
      keyPoints: [
        '方向与相对运动方向相反',
        '静摩擦力可变，最大为μsN',
        '滑动摩擦力为μkN',
        '与接触面积无关',
      ],
      relatedFormulas: ['friction'],
      commonMisconceptions: [
        '摩擦力总是阻碍运动（错误）',
        '接触面积越大摩擦力越大（错误）',
      ],
      examples: [
        '走路时鞋底与地面的摩擦',
        '刹车时轮胎与地面的摩擦',
        '传送带运输物体',
      ],
      category: 'dynamics',
    })
  }

  private initializeExperiments(): void {
    this.experiments.set('measure_g', {
      id: 'measure_g',
      name: '测量重力加速度',
      objective: '通过自由落体实验测量当地的重力加速度g',
      materials: ['自由落体装置', '计时器', '刻度尺', '小球'],
      procedure: [
        '调整自由落体装置，确保小球从静止释放',
        '测量小球下落高度h',
        '记录小球下落时间t',
        '重复多次取平均值',
        '用公式g = 2h/t²计算g值',
      ],
      expectedResults: '测得的g值应接近9.81 m/s²',
      analysis: '分析误差来源，包括空气阻力、计时误差、高度测量误差等',
      category: 'kinematics',
    })

    this.experiments.set('verify_newton_second', {
      id: 'verify_newton_second',
      name: '验证牛顿第二定律',
      objective: '验证加速度与合外力成正比，与质量成反比',
      materials: ['滑块', '气垫导轨', '砝码', '细线', '光电门', '计时器'],
      procedure: [
        '安装气垫导轨和滑块',
        '用细线连接滑块和砝码',
        '改变砝码质量（改变拉力）',
        '测量滑块加速度',
        '保持拉力不变，改变滑块质量',
        '测量加速度变化',
      ],
      expectedResults: 'a-F图像应为过原点的直线，a-1/m图像也应为直线',
      analysis: '验证F=ma的关系，分析摩擦力等误差因素',
      category: 'dynamics',
    })

    this.experiments.set('conservation_momentum', {
      id: 'conservation_momentum',
      name: '动量守恒实验',
      objective: '验证碰撞过程中的动量守恒',
      materials: ['两个小球', '气垫导轨', '光电门', '天平'],
      procedure: [
        '测量两个小球的质量',
        '让一个小球静止，另一个小球以已知速度碰撞',
        '测量碰撞后两球的速度',
        '计算碰撞前后的总动量',
        '比较动量是否守恒',
      ],
      expectedResults: '碰撞前后总动量应基本相等',
      analysis: '分析误差，包括摩擦力、测量误差等',
      category: 'mechanics',
    })

    this.experiments.set('pendulum_period', {
      id: 'pendulum_period',
      name: '单摆周期实验',
      objective: '研究单摆周期与摆长的关系，验证T=2π√(l/g)',
      materials: ['单摆装置', '秒表', '刻度尺'],
      procedure: [
        '测量单摆摆长l',
        '让单摆做小角度摆动',
        '测量摆动n个周期的时间',
        '计算周期T',
        '改变摆长，重复实验',
        '绘制T²-l图像',
      ],
      expectedResults: 'T²-l图像应为过原点的直线',
      analysis: '验证周期公式，计算g值',
      category: 'waves',
    })
  }

  getFormula(id: string): PhysicsFormula | undefined {
    return this.formulas.get(id)
  }

  getFormulasByCategory(category: PhysicsFormula['category']): PhysicsFormula[] {
    return Array.from(this.formulas.values()).filter(f => f.category === category)
  }

  searchFormulas(query: string): PhysicsFormula[] {
    const lowerQuery = query.toLowerCase()
    return Array.from(this.formulas.values()).filter(
      f =>
        f.name.toLowerCase().includes(lowerQuery) ||
        f.description.toLowerCase().includes(lowerQuery) ||
        f.formula.toLowerCase().includes(lowerQuery)
    )
  }

  getConcept(id: string): PhysicsConcept | undefined {
    return this.concepts.get(id)
  }

  searchConcepts(query: string): PhysicsConcept[] {
    const lowerQuery = query.toLowerCase()
    return Array.from(this.concepts.values()).filter(
      c =>
        c.name.toLowerCase().includes(lowerQuery) ||
        c.description.toLowerCase().includes(lowerQuery) ||
        c.keyPoints.some(kp => kp.toLowerCase().includes(lowerQuery))
    )
  }

  getExperiment(id: string): PhysicsExperiment | undefined {
    return this.experiments.get(id)
  }

  getExperimentsByCategory(category: string): PhysicsExperiment[] {
    return Array.from(this.experiments.values()).filter(e => e.category === category)
  }

  getRelatedConcepts(formulaId: string): PhysicsConcept[] {
    const formula = this.formulas.get(formulaId)
    if (!formula) return []
    return Array.from(this.concepts.values()).filter(c =>
      c.relatedFormulas.includes(formulaId)
    )
  }

  getExplanationForTopic(topic: string): {
    formulas: PhysicsFormula[]
    concepts: PhysicsConcept[]
    experiments: PhysicsExperiment[]
  } {
    const lowerTopic = topic.toLowerCase()
    return {
      formulas: this.searchFormulas(lowerTopic),
      concepts: this.searchConcepts(lowerTopic),
      experiments: Array.from(this.experiments.values()).filter(
        e =>
          e.name.toLowerCase().includes(lowerTopic) ||
          e.objective.toLowerCase().includes(lowerTopic)
      ),
    }
  }
}

export const physicsKnowledgeBase = new PhysicsKnowledgeBase()
