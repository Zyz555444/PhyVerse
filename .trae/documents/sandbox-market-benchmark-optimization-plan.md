# 自由沙盒 · 对标市面成熟产品优化计划方案

## 一、摘要

本文档基于对 PhET Interactive Simulations（科罗拉多大学）、Algodoo（Algoryx）、NOBOOK 虚拟实验室、Physics Lab AR（TurtleSim）、phyphox（亚琛工大）、EGK PhysicsLab AR 等主流物理仿真实验产品的深度调研，结合当前 Phyverse 自由沙盒的现有能力（Three.js + Rapier3D 3D 物理沙盒），从**教学闭环、实验深度、内容生态、交互体验、数据分析、协作共享、技术架构、AI 赋能**八大维度，制定系统性的优化路线图。

## 二、市场对标总览

| 维度 | PhET | Algodoo | NOBOOK | Physics Lab AR | phyphox | **Phyverse 现状** |
|------|------|---------|--------|---------------|---------|-------------------|
| 物理引擎 | 2D 简化 | 2D 真实物理 | 3D 自研引擎 | 3D 电路 | 真机传感器 | **3D Rapier** |
| 自由搭建 | 无 | 丰富(自由绘制) | 有限(DIY) | 电路搭建 | 无 | **器材库 + 自由摆放** |
| 课程对齐 | 170+ 实验 | 无 | 2000+ 实验 | 100+ 电路 | 预置实验 | **50+ 实验(导向式)** |
| 数据采集 | 基础图表 | 图表+可视化 | 实验数据 | 实时数据 | 传感器数据 | **遥测+DataPanel** |
| 教学任务 | PhET Studio | 无 | 考试+评分 | 无 | 无 | **TaskPanel+步骤引导** |
| AI 能力 | 无 | 无 | AI纠错+评分 | 无 | 无 | **无** |
| 社区共享 | 预设分享 | Algobox 5万+ | 教案库 | 无 | 实验分享 | **JSON导入导出** |
| 录制回放 | 无 | 视频/GIF | 微课录制 | 无 | 无 | **无** |
| AR 支持 | 无 | 无 | 无 | 有 | 无 | **无** |
| 多语言 | 130种 | 有限 | 中文 | 英文 | 多语言 | **中/英** |
| 离线 | 部分 | 客户端 | 支持 | 客户端 | 支持 | **Web PWA** |
| 可访问性 | 屏幕阅读器 | 无 | 无 | 无 | 无障碍 | **无** |

### 核心差距识别

1. **AI 赋能空白**：Phyverse 完全没有 AI 辅助教学能力，而 NOBOOK 已实现 AI 纠错与智能评分
2. **录制回放缺失**：Algodoo 可导出视频/GIF，NOBOOK 可录制微课，Phyverse 无此能力
3. **内容生态薄弱**：Algodoo 有 Algobox 5 万+社区场景，Phyverse 仅靠 JSON 导入导出
4. **教学闭环不完整**：PhET 有 Studio 预设管理 + 学生链接，NOBOOK 有考试+评分+班级管理
5. **实验覆盖不均衡**：当前导向式实验 50+ 个，但缺少化学、生物、数学等跨学科内容
6. **可视化不够丰富**：Algodoo 有力/速度/动量可视化，Phyverse 仅有轨迹和向量叠加
7. **移动端触控缺失**：当前完全为桌面端设计，无触控手势优化
8. **可访问性为零**：PhET 已支持屏幕阅读器和替代输入设备

---

## 三、优化路线图

### 第一阶段：能力补齐（3-6 个月）—— 追平市场基线

#### 1.1 录制与回放系统 ⭐⭐⭐⭐⭐

**对标产品**：Algodoo（视频/GIF 导出）、NOBOOK（微课录制）

**现状**：完全缺失。教师无法录制演示过程，学生无法回放实验。

**实现方案**：

```
新增模块：src/features/recording/
├── Recorder.ts          # 录制引擎（基于 requestAnimationFrame 快照）
├── RecorderControls.tsx  # 录制/停止/回放工具栏
├── PlaybackEngine.ts    # 回放引擎（逐帧还原刚体状态）
├── Timeline.tsx          # 时间轴编辑器（裁剪、标记）
├── GIFExporter.ts        # GIF 导出（基于 gif.js 或纯 Canvas 逐帧合成）
└── VideoExporter.ts      # WebM 导出（MediaRecorder API）
```

**详细功能**：
- **场景快照录制**：以固定帧率（可配置 15/30/60fps）记录所有刚体的 position/rotation/velocity
- **回放控制**：播放/暂停/快进/慢放/逐帧/循环
- **时间轴**：可视化时间轴，支持拖拽裁剪起止点、添加书签标记
- **导出**：WebM 视频（MediaRecorder）、GIF 动图（gif.js 或自研）、帧序列 PNG
- **录制模式**：
  - 全场景录制（所有物体）
  - 追踪录制（仅追踪选中物体，相机跟随）
  - 画中画录制（全场景 + 追踪物体特写）

**关键文件**：
- 新建 `src/features/recording/Recorder.ts`
- 新建 `src/features/recording/RecorderControls.tsx`
- 新建 `src/features/recording/PlaybackEngine.ts`
- 新建 `src/features/recording/Timeline.tsx`
- 修改 `src/pages/Sandbox.tsx`（集成录制工具栏）
- 修改 `src/features/sandbox/sandboxStore.ts`（录制状态）

---

#### 1.2 AI 辅助教学系统 ⭐⭐⭐⭐⭐

**对标产品**：NOBOOK（AI 纠错+自动评分+智能评语）

**现状**：零 AI 能力。无任何智能反馈或辅助。

**实现方案**：

```
新增模块：src/features/ai/
├── AITutor.ts            # AI 导师核心逻辑（LLM API 调用）
├── AITutorPanel.tsx       # AI 对话面板（悬浮侧边栏）
├── ExperimentAnalyzer.ts  # 实验过程分析器
├── AutoScorer.ts          # 自动评分引擎
├── PhysicsValidator.ts    # 物理规律验证器
└── HintGenerator.ts       # 提示生成器
```

**详细功能**：

**a) AI 实验导师**：
- 在实验运行中/暂停后，点击"AI 分析"按钮
- 自动收集当前场景的物理状态（物体位置、速度、能量、关节状态）
- 发送给 LLM 分析，生成自然语言反馈：
  - "你当前的斜面角度为 30°，小球加速度约为 4.9 m/s²，符合 a = g·sin(30°) = 4.9 m/s² 的理论预测"
  - "弹簧的振动周期约为 0.63s，根据 T = 2π√(m/k)，理论值应为 0.63s，实验值与理论吻合"
  - "注意：当前碰撞为非弹性碰撞，动能损失约 35%"

**b) 自动评分引擎**：
- 针对教学任务（TaskPanel 中的任务），定义评分规则
- 在任务完成后自动评估：
  - 操作步骤完成度（是否按步骤执行）
  - 数据准确性（测量值与理论值的偏差）
  - 实验规范性（是否有违规操作）
- 输出评分报告：得分 + 失分点 + 改进建议

**c) 实验纠错提示**：
- 实时监测实验设置中的常见错误：
  - 电路短路警告
  - 弹簧超出弹性限度
  - 物体质量设置不合理
  - 碰撞体穿透检测
- 弹出轻提示，引导学生自主修正

**d) 智能问答**：
- 侧边栏 AI 对话面板
- 学生可自由提问："为什么小球会停下来？"
- AI 结合当前场景的物理参数给出解释
- 支持上下文记忆（对话历史）

**关键文件**：
- 新建 `src/features/ai/AITutorPanel.tsx`
- 新建 `src/features/ai/ExperimentAnalyzer.ts`
- 新建 `src/features/ai/AutoScorer.ts`
- 修改 `src/pages/Sandbox.tsx`（集成 AI 面板）
- 修改 `src/features/sandbox/sandboxStore.ts`（AI 状态）
- 新增后端 API 或使用 LLM 边缘函数

---

#### 1.3 数据可视化增强 ⭐⭐⭐⭐

**对标产品**：Algodoo（力/速度/动量可视化）、NOBOOK（实验数据图表）、PhET（实时图表）

**现状**：已有遥测数据面板（DataPanel）和矢量叠加（VectorOverlay），但可视化不够丰富。

**实现方案**：

```
新增/修改模块：
├── src/features/sandbox/
│   ├── ForceVisualizer.tsx     # 力矢量可视化（重力、支持力、摩擦力、合力）
│   ├── EnergyBar.tsx            # 能量条（动能/势能/热能 实时占比）
│   ├── FieldVisualizer.tsx      # 场可视化（引力场、电场、磁场）
│   ├── DataPanel.tsx            # 增强：多通道对比、公式叠加
│   └── VectorOverlay.tsx        # 增强：可配置显示内容
```

**详细功能**：

**a) 力矢量可视化**：
- 在物体上叠加显示实时受力分析：
  - 重力（↓ 黄色箭头）
  - 支持力（⊥ 表面 蓝色箭头）
  - 摩擦力（↔ 表面 红色箭头）
  - 弹簧力（←→ 绿色箭头）
  - 合力（加粗白色箭头）
- 箭头长度与力的大小成正比
- 工具栏开关，可独立控制每种力的显示

**b) 能量可视化**：
- 选中物体时，在属性面板或 3D 场景中显示能量仪表盘
- 实时显示：动能（KE）、重力势能（PE）、弹性势能（Epe）、总机械能
- 能量条动画（类似游戏血条），直观展示能量转换
- 碰撞时显示能量损失（红色闪烁）

**c) 多通道数据对比**：
- 在 DataPanel 中支持同时显示多个物体的同类型数据
- 对比两个物体的速度曲线、位移曲线
- 颜色编码区分不同物体

**d) 公式叠加显示**：
- 在图表上叠加显示理论公式曲线
- 例如：自由落体 v-t 图叠加 v = gt 参考线
- 实时计算理论与实验值的偏差百分比

**关键文件**：
- 新建 `src/features/sandbox/ForceVisualizer.tsx`
- 新建 `src/features/sandbox/EnergyBar.tsx`
- 修改 `src/features/sandbox/SandboxItemRenderer.tsx`
- 修改 `src/features/sandbox/DataPanel.tsx`
- 修改 `src/features/sandbox/sandboxStore.ts`

---

#### 1.4 物理现象增强 ⭐⭐⭐⭐

**对标产品**：Algodoo（流体、光学、推力器）、Physics Lab AR（电磁场线可视化）

**现状**：刚体力学较完善，但缺少流体、电磁场、光学等物理现象。

**实现方案**：

```
新增模块：
├── src/features/sandbox/
│   ├── FluidSimulation.tsx      # 简化流体模拟（粒子系统）
│   ├── EMFieldVisualizer.tsx    # 电磁场可视化
│   ├── LightRayTracer.tsx       # 光线追踪（反射/折射）
│   └── ParticleForceField.tsx   # 粒子力场（引力/斥力/风力）
```

**详细功能**：

**a) 粒子力场**：
- 在场景中放置"力场源"（点引力源、点斥力源、均匀风场）
- 可调节力场强度和衰减模式（1/r²、线性、恒定）
- 可视化力场范围（半透明球体/箭头）
- 与现有刚体系统交互：力场对 dynamic 物体施加力

**b) 电磁场可视化**：
- 添加"电荷"器材（正电荷/负电荷）
- 可视化电场线（从正电荷出发，终止于负电荷）
- 带电粒子在电场中的运动轨迹
- 使用流线（streamline）或箭头场表示

**c) 光线模拟**：
- 添加"光源"器材（点光源、平行光源）
- 添加"光学元件"器材（凸透镜、凹透镜、平面镜、棱镜）
- 光线追踪渲染（反射、折射、色散）
- 可视化光路和成像位置

**d) 简化流体**：
- 使用 SPH（Smoothed Particle Hydrodynamics）粒子系统
- 在场景中放置"水槽"区域
- 物体落入水中产生浮力和阻力
- 可视化水面波动

**关键文件**：
- 新建 `src/features/sandbox/ParticleForceField.tsx`
- 新建 `src/features/sandbox/EMFieldVisualizer.tsx`
- 新建 `src/features/sandbox/LightRayTracer.tsx`
- 新建 `src/features/sandbox/FluidSimulation.tsx`
- 修改 `src/features/sandbox/sandboxStore.ts`（新增器材类型和物理属性）

---

### 第二阶段：体验升级（6-9 个月）—— 建立差异化优势

#### 2.1 社区生态与场景共享 ⭐⭐⭐⭐⭐

**对标产品**：Algodoo（Algobox 5 万+场景）、PhET（预设分享链接）

**现状**：仅支持本地 JSON 导入导出，无云端共享能力。

**实现方案**：

```
新增模块：
├── src/features/community/
│   ├── SceneGallery.tsx          # 场景画廊（浏览/搜索/排序）
│   ├── ScenePublisher.tsx        # 场景发布（标题/描述/标签/截图）
│   ├── SceneCard.tsx             # 场景卡片
│   ├── UserProfile.tsx           # 用户主页
│   └── communityService.ts       # 后端 API 服务
```

**详细功能**：

**a) 场景画廊**：
- 浏览社区公开分享的场景
- 按标签筛选：力学/电磁学/光学/热学/教学/娱乐/机械
- 按热度/时间/评分排序
- 场景预览缩略图（自动生成 3D 截图）
- 一键加载到本地沙盒

**b) 场景发布**：
- 用户可发布自己的场景到社区
- 填写标题、描述、标签、学科分类
- 自动生成场景缩略图
- 可选择公开/私有/仅链接可见

**c) 社交互动**：
- 点赞/收藏场景
- 评论与讨论
- Fork 场景（基于此场景修改并发布新版本）
- 场景引用链（显示派生关系）

**d) 教师专属功能**：
- 创建班级空间
- 布置场景作业
- 查看学生提交的场景
- 场景模板库（官方精选 + 教师贡献）

**关键文件**：
- 新建 `src/features/community/SceneGallery.tsx`
- 新建 `src/features/community/ScenePublisher.tsx`
- 新建 `src/features/community/communityService.ts`
- 修改 `src/app/router.tsx`（新增路由）
- 新建后端 API 服务（或使用 Supabase/Firebase）

---

#### 2.2 移动端适配与触控优化 ⭐⭐⭐⭐

**对标产品**：NOBOOK（Android/iPad 原生客户端）、PhET（HTML5 跨平台）

**现状**：完全为桌面端设计，移动端无法使用。

**实现方案**：

```
修改模块：
├── src/pages/Sandbox.tsx           # 响应式布局
├── src/features/canvas/Controls.tsx # 触控手势
├── src/features/sandbox/EquipmentPalette.tsx # 移动端 drawer
├── src/features/sandbox/PropertiesPanel.tsx  # 移动端底部 sheet
└── src/styles/globals.css          # 移动端断点样式
```

**详细功能**：

**a) 响应式布局**：
- 小屏（<768px）：器材库和属性面板改为底部 Sheet（上滑弹出）
- 工具栏折叠为汉堡菜单 + 关键按钮（运行/暂停/撤销）
- 画布区域占满全屏
- 横屏自动切换为左右分栏

**b) 触控手势**：
- 单指滑动：旋转相机
- 双指捏合：缩放
- 双指滑动：平移
- 长按物体：选中
- 双击物体：聚焦
- 单指点击：放置/选择

**c) 移动端特有功能**：
- 陀螺仪控制相机视角（手机倾斜旋转场景）
- 摇一摇撤销
- 触觉反馈（选中物体时振动）

**d) PWA 增强**：
- 完善 Service Worker 离线缓存
- 添加到主屏幕提示
- 推送通知（场景更新/作业提醒）

**关键文件**：
- 修改 `src/pages/Sandbox.tsx`
- 修改 `src/features/canvas/Controls.tsx`
- 修改 `src/features/sandbox/EquipmentPalette.tsx`
- 修改 `src/features/sandbox/PropertiesPanel.tsx`
- 修改 `src/styles/globals.css`
- 修改 `public/sw.js`

---

#### 2.3 实验配方系统（Experiment Recipe）⭐⭐⭐⭐

**对标产品**：PhET（预设配置）、NOBOOK（教材同步实验）

**现状**：有任务面板（TaskPanel），但缺少开放式的"实验配方"概念。

**实现方案**：

```
新增模块：
├── src/features/recipes/
│   ├── RecipeEditor.tsx         # 配方编辑器
│   ├── RecipeLibrary.tsx        # 配方库浏览器
│   ├── RecipeRunner.tsx         # 配方执行器（逐步引导）
│   ├── RecipeTemplate.ts        # 配方模板规范
│   └── recipeRegistry.ts        # 配方注册表
```

**详细功能**：

**a) 配方结构**：
```typescript
interface ExperimentRecipe {
  id: string
  title: string
  description: string
  subject: 'mechanics' | 'electromagnetism' | 'optics' | 'thermal' | 'modern'
  grade: 'junior' | 'senior' | 'college'
  curriculum?: string[] // 对应教材章节
  scene: SandboxScene   // 初始场景
  steps: RecipeStep[]   // 操作步骤
  expectedResults?: ExpectedResult[] // 预期结果(用于评分)
  tips: string[]        // 提示
  videoUrl?: string     // 教学视频链接
}
```

**b) 配方执行**：
- 加载配方 → 自动搭建初始场景
- 左侧显示步骤说明（当前步骤高亮）
- 每完成一步自动检测（通过物理状态验证）
- 完成后给出评分和总结
- 支持"自由探索"模式（跳过步骤，自由实验）

**c) 配方编辑器**：
- 可视化编辑实验步骤
- 设置初始场景 → 录制操作 → 设为步骤
- 定义检查点（怎样的物理状态算"完成"）
- 添加提示文本和教学说明
- 导出/分享配方

**d) 配方库**：
- 按学科/年级/教材版本分类浏览
- 官方认证配方 + 社区贡献配方
- 与教材章节精确对应

**关键文件**：
- 新建 `src/features/recipes/RecipeEditor.tsx`
- 新建 `src/features/recipes/RecipeLibrary.tsx`
- 新建 `src/features/recipes/recipeRegistry.ts`
- 修改 `src/features/sandbox/TaskPanel.tsx`（整合配方系统）
- 修改 `src/features/sandbox/sandboxStore.ts`

---

#### 2.4 测量工具系统 ⭐⭐⭐⭐

**对标产品**：NOBOOK（实验器材的数据读数）、PhET（内置测量工具）

**现状**：已有 VirtualRuler、VirtualStopwatch、VirtualProtractor、DotTimer，但集成度不够。

**实现方案**：

```
修改/新增模块：
├── src/features/measurement/
│   ├── MeasurementToolbar.tsx    # 测量工具栏
│   ├── VirtualRuler.tsx          # 增强：绑定到物体表面
│   ├── VirtualStopwatch.tsx      # 增强：多通道计时
│   ├── VirtualProtractor.tsx     # 增强：自动吸附
│   ├── DotTimer.tsx              # 增强：可导出数据
│   ├── VirtualThermometer.tsx    # 新增：温度计
│   ├── VirtualAmmeter.tsx        # 新增：电流表
│   ├── VirtualVoltmeter.tsx      # 新增：电压表
│   └── VirtualSpringScale.tsx    # 新增：弹簧测力计
```

**详细功能**：

**a) 测量工具增强**：
- 直尺支持绑定到物体表面（贴面测量）
- 秒表支持多通道（同时测量多个物体的运动时间）
- 量角器自动吸附到物体边缘
- 所有测量工具可拖拽到场景任意位置
- 测量数据实时显示在旁边，可一键复制

**b) 新增虚拟仪表**：
- **温度计**：显示物体温度（用于热学实验）
- **电流表**：串联在电路中显示电流
- **电压表**：并联在电路中显示电压
- **弹簧测力计**：显示当前拉力/弹力

**c) 智能测量**：
- 测距工具：点击两点自动计算距离
- 测速工具：追踪物体，显示实时速度
- 测角工具：三点确定角度
- 自动面积/体积计算

**关键文件**：
- 新建 `src/features/measurement/MeasurementToolbar.tsx`
- 新建 `src/features/measurement/VirtualThermometer.tsx`
- 新建 `src/features/measurement/VirtualAmmeter.tsx`
- 新建 `src/features/measurement/VirtualVoltmeter.tsx`
- 新建 `src/features/measurement/VirtualSpringScale.tsx`
- 修改 `src/features/measurement/VirtualRuler.tsx`
- 修改 `src/features/measurement/VirtualStopwatch.tsx`

---

### 第三阶段：生态构建（9-15 个月）—— 行业领先

#### 3.1 跨学科扩展 ⭐⭐⭐⭐⭐

**对标产品**：PhET（物理+化学+数学+生物+地球科学）、NOBOOK（物理+化学+生物）

**现状**：仅有物理（力学、电磁学、热学、光学、近代物理），无化学、生物、数学。

**实现方案**：

```
新增模块：
├── src/features/experiments/
│   ├── chemistry/              # 化学实验模块
│   │   ├── AcidBaseTitration.ts
│   │   ├── ChemicalReaction.ts
│   │   ├── MolecularStructure.ts
│   │   ├── Electrolysis.ts
│   │   └── index.ts
│   ├── biology/                # 生物实验模块
│   │   ├── CellDivision.ts
│   │   ├── DNAStructure.ts
│   │   ├── NaturalSelection.ts
│   │   ├── FoodWeb.ts
│   │   └── index.ts
│   └── math/                   # 数学可视化模块
│       ├── FunctionGraph.ts
│       ├── GeometricTransform.ts
│       ├── ProbabilitySim.ts
│       ├── VectorField.ts
│       └── index.ts
```

**详细功能**：

**a) 化学实验**：
- 酸碱滴定（颜色变化 + pH 曲线）
- 化学反应模拟（反应物→产物，质量守恒）
- 分子结构 3D 可视化（原子球棍模型）
- 电解实验（电极反应 + 气体收集）
- 化学器材库（烧杯、试管、滴管、酒精灯等）

**b) 生物实验**：
- 细胞分裂模拟（有丝分裂/减数分裂）
- DNA 双螺旋结构 3D 模型
- 自然选择模拟（种群演化）
- 食物链/食物网可视化
- 显微镜模拟

**c) 数学可视化**：
- 函数图像动态绘制（一次/二次/三角/指数）
- 几何变换（平移/旋转/反射/缩放）
- 概率模拟（抛硬币/掷骰子/高尔顿板）
- 向量场 3D 可视化
- 立体几何 3D 模型

**关键文件**：
- 新建 `src/features/experiments/chemistry/`
- 新建 `src/features/experiments/biology/`
- 新建 `src/features/experiments/math/`
- 修改 `src/features/experiments/registry.ts`
- 修改 `src/shared/types/experiment.ts`
- 修改 `src/app/providers/I18nProvider.tsx`

---

#### 3.2 AR 增强现实模式 ⭐⭐⭐⭐

**对标产品**：Physics Lab AR、EGK PhysicsLab AR

**现状**：全虚拟 3D 场景，无 AR 能力。

**实现方案**：

```
新增模块：
├── src/features/ar/
│   ├── ARProvider.tsx           # WebXR 会话管理
│   ├── ARScene.tsx              # AR 场景渲染
│   ├── ARPlaneDetector.tsx      # 平面检测
│   ├── ARAnchor.tsx             # 空间锚点
│   ├── ARControls.tsx           # AR 手势交互
│   └── useARSession.ts          # AR 会话 Hook
```

**详细功能**：

**a) WebXR 集成**：
- 使用 WebXR Device API 实现浏览器端 AR
- 检测真实桌面/地面作为物理实验台
- 将虚拟实验器材锚定在真实空间
- 支持 HoloLens / Quest / AR 手机

**b) AR 教学模式**：
- 在真实桌面上叠加虚拟实验器材
- 虚拟器材与真实桌面碰撞（利用平面检测）
- 手势拖拽虚拟器材
- 真实空间中的 3D 力场可视化

**c) 混合模式**：
- 切换纯虚拟 / AR 模式
- AR 模式下保留完整沙盒编辑能力
- 真实环境光照影响虚拟物体渲染

**关键文件**：
- 新建 `src/features/ar/ARProvider.tsx`
- 新建 `src/features/ar/ARScene.tsx`
- 新建 `src/features/ar/useARSession.ts`
- 修改 `src/pages/Sandbox.tsx`（AR 模式切换）

---

#### 3.3 可访问性（A11y）⭐⭐⭐

**对标产品**：PhET（屏幕阅读器支持、替代输入、高对比度、声波化）

**现状**：零可访问性支持。

**实现方案**：

```
新增/修改模块：
├── src/features/a11y/
│   ├── ScreenReaderAnnouncer.ts  # ARIA live region 通知
│   ├── SceneDescription.ts       # 场景语义描述生成
│   ├── KeyboardNavigation.ts     # 完整键盘导航
│   ├── SonificationEngine.ts     # 数据声波化（听声音判断物理量）
│   └── HighContrastTheme.ts      # 高对比度主题
```

**详细功能**：

**a) 屏幕阅读器支持**：
- 所有 UI 元素添加 ARIA 标签
- 3D 场景状态通过 ARIA live region 实时播报
- 物体选中/移动/碰撞时播报状态变化
- 图表数据提供文本替代描述

**b) 键盘导航**：
- Tab 键在 UI 元素间导航
- 方向键在 3D 场景中移动选中物体
- 完整的键盘操作映射（不依赖鼠标）

**c) 数据声波化（Sonification）**：
- 将速度/加速度/能量等物理量映射为声音频率/音量
- 盲人学生通过听觉判断物理过程
- 碰撞事件发出不同音色的声音

**d) 视觉辅助**：
- 高对比度主题（满足 WCAG AA 标准）
- 色盲友好配色方案
- 可调节字体大小
- 运动减少模式

**关键文件**：
- 新建 `src/features/a11y/ScreenReaderAnnouncer.ts`
- 新建 `src/features/a11y/SonificationEngine.ts`
- 新建 `src/features/a11y/HighContrastTheme.ts`
- 修改 `src/pages/Sandbox.tsx`

---

#### 3.4 教师工作台 ⭐⭐⭐⭐

**对标产品**：NOBOOK（班级管理+考试发布+成绩统计）、PhET Studio（预设管理+学生链接）

**现状**：有 TaskPanel 和预设系统，但无教师端管理功能。

**实现方案**：

```
新增模块：
├── src/features/teacher/
│   ├── Dashboard.tsx             # 教师仪表盘
│   ├── ClassManager.tsx          # 班级管理
│   ├── AssignmentCreator.tsx     # 作业创建器
│   ├── GradeBook.tsx             # 成绩册
│   ├── StudentProgress.tsx       # 学生进度追踪
│   └── teacherService.ts         # 后端 API
```

**详细功能**：

**a) 班级管理**：
- 创建/管理班级
- 邀请学生加入（链接/邀请码）
- 学生名单管理
- 分组管理

**b) 作业系统**：
- 基于实验配方创建作业
- 设置截止日期和评分标准
- 发布到班级
- 查看学生完成情况
- 自动评分（基于 AI 评分引擎）

**c) 学习分析**：
- 每位学生的实验完成率
- 班级整体掌握情况热力图
- 常见错误分析（哪些步骤学生最容易出错）
- 学习时长统计

**d) 课堂演示模式**：
- 一键全屏演示
- 激光笔/标注工具
- 实时投屏（学生端同步观看）
- 学生举手提问

**关键文件**：
- 新建 `src/features/teacher/Dashboard.tsx`
- 新建 `src/features/teacher/AssignmentCreator.tsx`
- 新建 `src/features/teacher/teacherService.ts`
- 修改 `src/app/router.tsx`
- 新建后端 API 服务

---

## 四、技术架构升级

### 4.1 后端服务架构

目前 Phyverse 为纯前端应用，为支持社区、AI、教师工作台等功能，需要引入后端服务：

```
推荐方案：Supabase（开源 BaaS）
- 数据库：用户、场景、班级、作业、评论
- 认证：邮箱/Google/微信登录
- 存储：场景 JSON 文件、截图缩略图
- Realtime：实时协作（未来）
- Edge Functions：AI API 代理、评分计算
```

### 4.2 性能优化

| 优化项 | 方案 | 预期收益 |
|--------|------|----------|
| 物理计算 | Web Worker 中运行 Rapier | 主线程不阻塞，稳定 60fps |
| 渲染优化 | InstancedMesh 渲染大量相同物体 | 万级物体渲染 |
| 场景加载 | 懒加载预设场景 + 渐进式渲染 | 首屏加载 < 2s |
| 内存管理 | 场景卸载时完整清理 GPU 资源 | 避免内存泄漏 |
| 录屏性能 | OffscreenCanvas + WebCodecs API | 录制不卡顿 |

### 4.3 技术栈扩展

| 新增依赖 | 用途 | 替代方案 |
|----------|------|----------|
| `gif.js` 或 `modern-gif` | GIF 导出 | 自研 Canvas 合成 |
| `@mediapipe/hands` | 手势识别（AR） | 无 |
| `@supabase/supabase-js` | 后端服务 | Firebase |
| `openai` / `anthropic-sdk` | AI 对话 | 自建 LLM |
| `webxr` types | AR 类型定义 | 无 |

---

## 五、优先级矩阵

| 优先级 | 功能 | 开发量 | 用户价值 | 竞争差异 |
|--------|------|--------|----------|----------|
| P0 | AI 辅助教学 | 大 | 极高 | 强 |
| P0 | 录制与回放 | 中 | 极高 | 中 |
| P0 | 数据可视化增强 | 中 | 高 | 中 |
| P1 | 移动端适配 | 大 | 高 | 弱 |
| P1 | 社区生态 | 大 | 高 | 强 |
| P1 | 实验配方系统 | 中 | 高 | 强 |
| P1 | 物理现象增强 | 大 | 中 | 强 |
| P2 | 测量工具系统 | 中 | 中 | 弱 |
| P2 | 教师工作台 | 大 | 高 | 强 |
| P2 | 跨学科扩展 | 极大 | 高 | 强 |
| P3 | AR 增强现实 | 大 | 中 | 强 |
| P3 | 可访问性 | 中 | 中 | 中 |

---

## 六、验证计划

### 6.1 质量保障

- TypeScript 严格模式：`npx tsc --noEmit` 零错误
- ESLint 零警告：`npm run lint --max-warnings=0`
- 单元测试覆盖率 > 80%
- E2E 测试覆盖核心用户流程
- 性能基准：录制状态下 60fps 不掉帧
- 可访问性审计：Lighthouse A11y 评分 > 90

### 6.2 用户验证

- 邀请 5-10 位物理教师进行可用性测试
- 收集课堂使用反馈
- A/B 测试 AI 功能的有效性
- 社区场景数量增长指标

### 6.3 对照验证清单

| 对标功能 | 来源 | 实现状态 |
|----------|------|----------|
| 场景录制导出 | Algodoo | 待实现 |
| AI 纠错评分 | NOBOOK | 待实现 |
| 社区场景共享 | Algodoo Algobox | 待实现 |
| 力/速度可视化 | Algodoo | 部分实现 |
| 实验配方引导 | PhET Studio | 待实现 |
| 移动端适配 | NOBOOK | 待实现 |
| 教师工作台 | NOBOOK | 待实现 |
| 跨学科内容 | PhET | 待实现 |
| AR 模式 | Physics Lab AR | 待实现 |
| 屏幕阅读器 | PhET | 待实现 |
| 数据声波化 | PhET | 待实现 |
| 课堂投屏 | NOBOOK | 待实现 |
| 考试模式 | NOBOOK | 待实现 |
| 流体模拟 | Algodoo | 待实现 |
| 电磁场可视化 | Physics Lab AR | 待实现 |
| 光线追踪 | Algodoo | 待实现 |

---

## 七、总结

当前 Phyverse 自由沙盒在 **3D 物理引擎能力**（Rapier3D + Three.js）和 **自由搭建体验** 方面已具备坚实基础，但在以下关键维度与市面成熟产品存在显著差距：

1. **AI 赋能**：零能力，而 NOBOOK 已实现 AI 纠错评分
2. **录制回放**：完全缺失，Algodoo/NOBOOK 均支持
3. **内容生态**：仅本地 JSON 导入导出，而 Algodoo 有 Algobox 5 万+场景
4. **教学闭环**：缺少教师端管理和作业系统
5. **跨学科覆盖**：仅有物理，而 PhET 覆盖 5 大学科
6. **移动端体验**：完全为桌面设计
7. **可访问性**：零支持

建议按照三阶段路线图推进，**第一阶段（3-6 个月）集中攻克 AI 辅助教学和录制回放两大核心短板**，快速追平市场基线；**第二阶段（6-9 个月）构建社区生态和移动端体验**，建立差异化优势；**第三阶段（9-15 个月）实现跨学科扩展和 AR 模式**，达到行业领先水平。