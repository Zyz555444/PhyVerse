# PhyVerse Sandbox 不足之处与改进优化方案

## 项目现状概述

Sandbox 模块共 20+ 个文件，约 8000+ 行代码，基于 Zustand + React Three Fiber + Rapier 构建了一个功能丰富的 3D 物理沙盒。已具备以下能力：

- 器材添加、删除、变换（平移/旋转/缩放 Gizmo）
- 7 种关节类型（弹簧、固定、绳索、旋转、棱柱、马达、齿轮）
- 力场系统（吸引力/排斥力、逆平方律）
- 遥测数据采集（位置、速度、加速度、能量）
- 教学任务引导与实验配方案
- 场景持久化（localStorage 保存/加载/导入/导出）
- 历史操作（撤销/重做，上限 50 步）
- 多选/框选、力/速度向量可视化
- 录制/回放框架（数据结构已定义，UI 未完善）
- 中英双语国际化、深色/浅色主题

---

## 一、架构层面的不足与改进

### 1.1 Zustand 订阅碎片化（P0）

**现状**: `Sandbox.tsx` 中有 30+ 个独立 `useSandboxStore(s => s.xxx)` 调用，每次 store 任意字段更新都会触发所有 selector 逐一执行，导致大量无效 re-render。

**改进方案**:
- 使用 `useShallow` 合并相关 selector 为一组，例如将 `isRunning`、`selectedId`、`isPlaying`、`isRecording` 等编排状态合并为一个 object selector
- 将 `Sandbox.tsx` 拆分为多个独立的更小子组件（`Toolbar`、`StatusBar`、`LeftPanel`、`CanvasArea`、`RightPanel`、`BottomPanel`），每个子组件只订阅自己的数据
- 使用 Zustand 的 `useStore` API + selector 缓存避免不必要更新

**目标文件**: `src/pages/Sandbox.tsx`

### 1.2 Sandbox.tsx 巨型组件（P0）

**现状**: 1506 行单文件，27 个本地状态变量，包含 `ManualStepper`、`ImpulseApplier`、`TelemetrySampler` 三个内联子组件。

**改进方案**:
- 提取 `ManualStepper`、`ImpulseApplier`、`TelemetrySampler` 到独立文件
- 按布局区域拆分为:
  - `<SandboxToolbar />` — 顶部工具栏
  - `<SandboxLeftPanel />` — 左侧器材/任务/配方面板
  - `<SandboxRightPanel />` — 右侧层级/属性面板
  - `<SandboxCanvasArea />` — 3D 画布 + 上下文菜单
  - `<SandboxBottomPanel />` — 底部遥测数据面板
- 将 `useFps` hook 移到 `src/shared/hooks/` 目录
- 使用 `useReducer` 管理 UI 状态（tab 切换、面板开关等），替代 27 个 `useState`

**目标文件**: `src/pages/Sandbox.tsx`

### 1.3 字段语义重载（P1）

**现状**: `friction` 字段在 `force_field` shape 中表示力场类型（>0.5 排斥，<=0.5 吸引），`mass` 表示力场强度。这是类型不安全的设计，增加了维护和理解的复杂度。

**改进方案**: 将 `SandboxItem` 改为联合类型:

```typescript
type SandboxItem =
  | {
      shape: 'force_field'
      forceField: { type: 'attract' | 'repel'; strength: number; radius: number }
    }
  | {
      shape: Exclude<SandboxShape, 'force_field'>
      // 现有字段保持不变
    }
```

同步修改 `ForceFieldRenderer.tsx` 中基于 `friction` 判断力场类型的逻辑，改为读取 `forceField.type`。

**目标文件**:
- `src/features/sandbox/sandboxStore.ts`
- `src/features/sandbox/ForceFieldRenderer.tsx`
- `src/features/sandbox/SandboxItemRenderer.tsx`
- `src/features/sandbox/sceneStorage.ts`

### 1.4 Recipe 与 Task 重复实现（P1）

**现状**: `RecipePanel` 和 `TaskPanel` 有大量重复逻辑：步骤进度条、当前步骤展示、前进/后退/重置操作、完成标记机制。

**改进方案**:
- 提取共享组件 `<StepNavigator>` 和 `<StepProgress>` 到 `src/shared/ui/`
- 统一 `RecipeStep` 和 `TaskStep` 接口（目前前者有 `setupDescription` 字段，后者没有）
- 将 `completedRecipeIds` 迁移到 `sandboxStore` 中统一管理（目前存储在 `RecipePanel` 的组件本地 state，页面刷新后丢失）

**目标文件**:
- `src/features/recipe/RecipePanel.tsx`
- `src/features/sandbox/TaskPanel.tsx`
- `src/features/recipe/recipeTypes.ts`
- `src/features/sandbox/sandboxStore.ts`

### 1.5 录制/回放功能半成品（P2）

**现状**: `RecordingState` 在 `sandboxStore.ts` 中定义了完整的类型（`isRecording`、`isPlaying`、`frames`、`fps`），但 Sandbox 页面无录制/回放 UI 控件，用户无法使用。

**改进方案**:
- 在 Toolbar 添加录制按钮（红点图标）和回放按钮（播放/暂停）
- 播放时使用 `useFrame` 插值渲染关键帧之间的状态
- 添加导出为 JSON 帧数据的功能（用于后续转为 GIF/视频）
- 限制录制时长（建议 30 秒）或帧数上限（建议 1800 帧 @60fps）

**目标文件**:
- `src/pages/Sandbox.tsx`
- `src/features/recording/RecorderControls.tsx`
- `src/features/recording/PlaybackControls.tsx`

---

## 二、数据一致性缺陷与修复

### 2.1 sceneStorage.ts 遗漏 force_field 类型（P0）

**现状**: `SANDBOX_SHAPES` 常量数组中未包含 `force_field`，导致包含力场物品的导入场景被 `isSandboxItem` 类型守卫拒绝。

**修复**: 在 `SANDBOX_SHAPES` 数组中添加 `'force_field'`。

```typescript
// 修复前
const SANDBOX_SHAPES = ['box', 'sphere', 'cylinder', 'capsule', 'cone',
  'plane', 'torus', 'spring', 'pulley', 'slope', 'barrier', 'force_meter']

// 修复后
const SANDBOX_SHAPES = ['box', 'sphere', 'cylinder', 'capsule', 'cone',
  'plane', 'torus', 'spring', 'pulley', 'slope', 'barrier', 'force_meter', 'force_field']
```

**目标文件**: `src/features/sandbox/sceneStorage.ts`

### 2.2 accelY 指标语义错误（P0）

**现状**: `useTaskMonitor.ts` 中 `getSampleMetric('accelY')` 返回的是 `Math.abs(sample.accel)`（总加速度大小），而非 Y 轴分量。这导致自由落体任务中的加速度测量结果不正确（实际应接近 9.81，但代码返回的是总加速度的绝对值）。

**修复方案**:

方案一（推荐）: 扩展 `TelemetrySample` 结构，添加 `accelX`、`accelY`、`accelZ` 分量字段:

```typescript
interface TelemetrySample {
  t: number
  pos: [number, number, number]
  vel: [number, number, number]
  speed: number
  accel: number
  accelX: number
  accelY: number
  accelZ: number
  ke: number
  pe: number
}
```

方案二: 在 `getSampleMetric` 中从 `vel` 历史数据计算 Y 分量加速度（`deltaVy / deltaT`）。

**目标文件**:
- `src/features/sandbox/sandboxStore.ts`（类型定义 + 遥测采样逻辑）
- `src/features/sandbox/useTaskMonitor.ts`
- `src/features/sandbox/taskRegistry.ts`

### 2.3 pendulumTask 的 period 指标未实现（P1）

**现状**: `TaskObjectiveMetric` 类型中定义了 `'period'` 指标，但 `getSampleMetric` 函数中缺少 `case 'period'` 分支，单摆周期实验的任务评估无法工作。

**修复**: 实现周期计算逻辑:

```typescript
case 'period': {
  // 检测 Y 位置过零点，计算相邻同向过零点时间差
  const samples = telemetry.history[itemId] || []
  if (samples.length < 10) return 0
  // 找最近两个上升过零点
  const zeroCrossings: number[] = []
  for (let i = 1; i < samples.length; i++) {
    if (samples[i - 1].vel[1] > 0 && samples[i].vel[1] <= 0) continue
    if (samples[i - 1].pos[1] < centerY && samples[i].pos[1] >= centerY) {
      zeroCrossings.push(samples[i].t)
    }
  }
  if (zeroCrossings.length < 2) return 0
  return zeroCrossings[zeroCrossings.length - 1] - zeroCrossings[zeroCrossings.length - 2]
}
```

**目标文件**: `src/features/sandbox/useTaskMonitor.ts`

### 2.4 useTaskMonitor 重复触发风险（P1）

**现状**:
- 依赖 `telemetry.live` 每 100ms 更新触发评估，无防抖机制
- `getSample` 函数忽略了 `itemId` 不匹配的情况，始终返回当前 live 读数
- 自动推进步骤后没有重置遥测或记录数据，用户数据可能跨步骤混淆

**改进方案**:
- 添加 500ms 防抖，或"连续 3 次采样满足条件才推进"的确认机制
- 修复 `getSample` 函数：当 `itemId` 不匹配时返回 `null`，`evaluateObjective` 收到 `null` 时不判定为目标达成
- 自动推进步骤后调用 `clearTelemetry()` 清空遥测数据，避免跨步骤混淆

**目标文件**: `src/features/sandbox/useTaskMonitor.ts`

### 2.5 预设标签未国际化（P2）

**现状**: `presets.ts` 中 6 个预设场景的 `label` 字段使用硬编码中文:

```typescript
{ id: 'stackedBoxes', label: '堆叠方块', ... }
{ id: 'slopeBall', label: '斜坡滚球', ... }
{ id: 'springPendulum', label: '弹簧摆', ... }
// ...
```

**修复**: 全部改用 i18n key:

```typescript
{ id: 'stackedBoxes', labelKey: 'sandbox.presets.stackedBoxes', ... }
```

**目标文件**:
- `src/features/sandbox/presets.ts`
- 对应的 i18n 翻译文件

---

## 三、性能优化

### 3.1 力场计算 O(n*m) 复杂度（P1）

**现状**: `ForceFieldRenderer.tsx` 中每个力场源在 `useFrame` 中遍历所有 `dynamicItems`，时间复杂度 O(n*m)（n=力场数，m=动态物体数）。

**改进方案**:
- 力场添加 `maxDistance` 配置参数，物体距离超过该值时直接跳过力计算
- 使用 `useFrame` 节流，每 2-3 帧计算一次力场（物理效果无明显差异）
- 中长期方案: 在 Rapier 物理世界中使用空间哈希或 BVH 进行近邻查询

**目标文件**: `src/features/sandbox/ForceFieldRenderer.tsx`

### 3.2 编辑模式每帧设置变换（P1）

**现状**: `SandboxItemRenderer.tsx` 编辑模式下 `useFrame` 每帧无条件执行 `setNextKinematicTranslation` 和 `setNextKinematicRotation`，即使物体未移动。

**改进方案**: 使用 `useRef` 缓存上一次的变换值，只在当前值与缓存值不同时才调用 Rapier API。

```typescript
const prevTranslation = useRef(new THREE.Vector3())
const prevRotation = useRef(new THREE.Quaternion())

useFrame(() => {
  if (!editing || !bodyRef.current) return
  meshRef.current.getWorldPosition(worldPos)
  meshRef.current.getWorldQuaternion(worldQuat)
  if (!worldPos.equals(prevTranslation.current)) {
    bodyRef.current.setNextKinematicTranslation(worldPos)
    prevTranslation.current.copy(worldPos)
  }
  if (!worldQuat.equals(prevRotation.current)) {
    bodyRef.current.setNextKinematicRotation(worldQuat)
    prevRotation.current.copy(worldQuat)
  }
})
```

**目标文件**: `src/features/sandbox/SandboxItemRenderer.tsx`

### 3.3 SVG 图表大数据量性能（P2）

**现状**: `DataPanel.tsx` 中 `buildPolyline` 每次渲染时重建所有点坐标字符串（`points.map(...).join(' ')`），600 个样本点时字符串拼接开销大。

**改进方案**:
- 短期: 使用 `useMemo` 缓存 polyline 字符串，只在 `samples` 变化时重建
- 中期: 对超过图表宽度的点数进行降采样（如图表宽度 320px，至多 320 个可见点）
- 长期: 使用 Canvas 替代 SVG 渲染图表（性能更好，适合大数据量交互）

**目标文件**: `src/features/sandbox/DataPanel.tsx`

### 3.4 框选物体事件监听器频繁重建（P2）

**现状**: `BoxSelection.tsx` 的 `useEffect` 依赖 `items` 数组，物品数量多时频繁重建事件监听器。

**改进方案**: 使用 `useRef` 存储 items，事件处理器中读取 ref 当前值:

```typescript
const itemsRef = useRef(items)
itemsRef.current = items

useEffect(() => {
  // 事件处理器中使用 itemsRef.current 而非闭包中的 items
  const handlePointerDown = (e: PointerEvent) => { ... }
  // 依赖项移除 items
}, [camera, domElement])
```

**目标文件**: `src/features/sandbox/BoxSelection.tsx`

---

## 四、功能缺口与新增

### 4.1 场景模板保存/管理（P1）

**现状**: 用户可加载预设和加载配方，但无法将自定义搭建的场景保存为可复用的模板。

**方案**:
- 在 Toolbar 添加"保存为模板"按钮
- 模板存储到 localStorage（key: `phyverse-scene-templates`）
- 在 `EquipmentPalette` 的 presets tab 中展示用户保存的模板（区分于内置预设）
- 支持删除和重命名模板
- 模板数据格式复用 `SandboxScene` 类型

**目标文件**:
- `src/pages/Sandbox.tsx`（添加按钮和保存逻辑）
- `src/features/sandbox/EquipmentPalette.tsx`（模板展示）

### 4.2 遥测数据图表交互增强（P1）

**现状**: SVG 速度-时间图表完全静态，无缩放、无平移、无悬停提示。用户只能看到纯图形。

**方案**:
- 鼠标悬停时显示十字光标和浮动数据标签（时间、速度、位置）
- 滚轮缩放时间轴（横向缩放）
- 拖拽平移图表视口
- 在图表上标记物理事件点（碰撞时刻、最大速度点、方向改变点）

**目标文件**: `src/features/sandbox/DataPanel.tsx`

### 4.3 移动端体验完善（P1）

**现状**: 底部弹出面板（`MobileBottomSheet`）只支持器材/层级/属性三个 tab，无数据面板和 AI 面板入口。

**方案**:
- `MobileBottomSheet` 增加"数据"tab（遥测数据面板）和"AI"tab（AI 助手面板）
- 针对触摸操作优化 Gizmo 控件（增大触摸区域，最小 44x44px）
- 添加双指旋转/缩放场景的手势支持（使用 `@react-three/drei` 的触摸事件）
- 移动端底部面板高度自适应（使用 `dvh` 单位）

**目标文件**:
- `src/pages/Sandbox.tsx`
- `src/shared/ui/MobileBottomSheet.tsx`

### 4.4 导入/导出增强（P2）

**现状**:
- 导出 JSON 包含完整内部状态（`id` 字段暴露），可读性差
- 版本迁移只有框架（`migrateScene` 未实现实际迁移逻辑）
- 大型场景（含录制帧数据）可能超出 localStorage 5-10MB 限制

**方案**:
- 导出时生成匿名化 id，添加元数据（场景名称、创建时间、物体数量）
- 大型场景改用 IndexedDB 替代 localStorage
- 导入时在面板中显示场景预览缩略图（用 Canvas 渲染场景俯视图）
- 支持从剪贴板粘贴 JSON 导入

**目标文件**: `src/features/sandbox/sceneStorage.ts`

### 4.5 实验设备交互反馈（P2）

**现状**: `Equipment.tsx` 中实验设备有 3D 模型（测力计、滑轮、斜面等），但缺乏与物理状态联动的交互反馈。

**方案**:
- 测力计: 实时更新刻度标记位置（根据所连接弹簧的力大小），数值显示在设备上方
- 滑轮: 根据连接的绳索物体运动显示旋转动画
- 斜面: 在斜面旁显示角度标注

**目标文件**:
- `src/features/canvas/Equipment.tsx`
- `src/features/sandbox/SandboxItemRenderer.tsx`

### 4.6 粒子效果系统集成（P3）

**现状**: `src/features/physics/ParticleSystem.ts` 文件存在（定义了粒子系统类），但未集成到 Sandbox 中。

**方案**:
- 将 `ParticleSystem` 接入 Sandbox 的 `Scene` 组件
- 用于以下场景:
  - 碰撞时生成火花粒子
  - 力场范围内显示引力流粒子
  - 运动物体后方显示拖尾粒子（替代或增强现有的轨迹线）

**目标文件**:
- `src/features/canvas/Scene.tsx`
- `src/features/physics/ParticleSystem.ts`
- `src/features/sandbox/SandboxItemRenderer.tsx`

---

## 五、测试覆盖补齐

### 5.1 单元测试缺口（P1）

当前仅 4 个测试文件，覆盖了 store 基础操作、层级面板渲染、友好名称生成、场景序列化。以下核心模块完全缺失:

| 模块 | 优先级 | 建议测试内容 |
|------|--------|-------------|
| `taskRegistry` 评估逻辑 | P0 | `evaluateObjective` 三种目标类型（measure/compare/record）的正确性 |
| `useTaskMonitor` hook | P1 | 目标满足时自动推进、itemId 不匹配时正确忽略 |
| `sceneStorage` 版本迁移 | P1 | 旧格式兼容、未知版本拒绝、force_field 导入导出 |
| `PropertiesPanel` 属性修改 | P2 | JointEditor 参数同步、Vector3Group onChange/onCommit 正确性 |
| `BoxSelection` 框选 | P2 | 框选交集检测、Ctrl/Shift 多选、拖拽阈值 |
| `useSandboxShortcuts` 快捷键 | P2 | Space、Delete、Ctrl+Z/Y、箭头微移等触发正确性 |
| `ForceFieldRenderer` 力场 | P2 | 力向量方向和大小计算正确性 |

**方案**: 使用 `vitest` + `@testing-library/react`，设定行覆盖率目标 > 70%。

**目标文件**: 在对应模块目录下新增 `__tests__/*.test.ts(x)` 文件

### 5.2 E2E 测试缺口（P1）

当前 `e2e/sandbox.spec.ts` 仅 4 个测试（页面加载、器材添加、运行/暂停、删除），缺少以下关键流程:

| 用例 | 说明 |
|------|------|
| 场景保存/加载持久化 | 搭建场景 -> 刷新页面 -> 验证场景恢复 |
| 撤销 (Ctrl+Z) / 重做 (Ctrl+Y) | 添加器材 -> 撤销 -> 验证消失 -> 重做 -> 验证恢复 |
| 关节创建 | 选取两个物体 -> 关节菜单 -> 添加弹簧关节 -> 验证 |
| 多选和框选 | Ctrl+Click 多选、Shift+Click 范围选择、鼠标拖拽框选 |
| 键盘快捷键 | Space 运行/暂停、Delete 删除选中、Ctrl+A 全选、Esc 取消 |
| 移动端响应式 | 小视口下验证底部面板切换和触摸操作 |
| 配方加载和步骤导航 | 选择配方 -> 加载场景 -> 步骤前进/后退 -> 完成 |
| 任务流程完整性 | 选择任务 -> 运行 -> 目标自动评估 -> 步骤推进 -> 标记完成 |
| 遥测数据采样 | 开始采样 -> 运行场景 -> 验证图表有数据点 -> 清除数据 |

**方案**: 使用 Playwright，按上述用例扩展 `e2e/sandbox.spec.ts`。

**目标文件**: `e2e/sandbox.spec.ts`

---

## 六、实施路线图

### 第一阶段: 关键 Bug 修复（预估 1 小时）

| 序号 | 条目 | 优先级 | 预估 |
|------|------|--------|------|
| 1 | `SANDBOX_SHAPES` 添加 `force_field` | P0 | 0.5h |
| 2 | `accelY` 语义修复 | P0 | 0.5h |

### 第二阶段: 架构重构（预估 10 小时）

| 序号 | 条目 | 优先级 | 预估 |
|------|------|--------|------|
| 3 | Zustand 订阅碎片化重构 + `useShallow` | P0 | 4h |
| 4 | `Sandbox.tsx` 巨型组件拆分 | P0 | 6h |

### 第三阶段: 功能与测试补齐（预估 35 小时）

| 序号 | 条目 | 优先级 | 预估 |
|------|------|--------|------|
| 5 | 字段语义重载修复（力场类型） | P1 | 3h |
| 6 | Recipe/Task 共享组件提取 | P1 | 4h |
| 7 | `period` 指标实现 | P1 | 2h |
| 8 | `useTaskMonitor` 防抖优化 | P1 | 1h |
| 9 | 力场 O(n*m) 性能优化 | P1 | 3h |
| 10 | 编辑模式每帧变换优化 | P1 | 1h |
| 11 | 场景模板保存/管理 | P1 | 4h |
| 12 | 遥测图表交互增强 | P1 | 5h |
| 13 | 移动端体验完善 | P1 | 4h |
| 14 | 单元测试补齐 | P1 | 4h |
| 15 | E2E 测试补齐 | P1 | 6h |

### 第四阶段: 体验打磨（预估 15 小时）

| 序号 | 条目 | 优先级 | 预估 |
|------|------|--------|------|
| 16 | 预设标签 i18n | P2 | 1h |
| 17 | SVG 图表 Canvas 迁移 | P2 | 3h |
| 18 | 导入/导出增强 | P2 | 4h |
| 19 | 录制/回放 UI 完善 | P2 | 4h |
| 20 | 实验设备交互反馈 | P3 | 3h |
| 21 | 粒子效果集成 | P3 | 4h |

**总预估工作量**: 约 61 小时

---

## 七、涉及文件总览

| 文件路径 | 涉及阶段 |
|----------|---------|
| `src/pages/Sandbox.tsx` | 第二阶段、第三阶段、第四阶段 |
| `src/features/sandbox/sandboxStore.ts` | 第一阶段、第三阶段 |
| `src/features/sandbox/sceneStorage.ts` | 第一阶段、第四阶段 |
| `src/features/sandbox/useTaskMonitor.ts` | 第一阶段、第三阶段 |
| `src/features/sandbox/taskRegistry.ts` | 第一阶段、第三阶段 |
| `src/features/sandbox/ForceFieldRenderer.tsx` | 第三阶段 |
| `src/features/sandbox/SandboxItemRenderer.tsx` | 第三阶段 |
| `src/features/sandbox/EquipmentPalette.tsx` | 第三阶段 |
| `src/features/sandbox/DataPanel.tsx` | 第三阶段 |
| `src/features/sandbox/BoxSelection.tsx` | 第三阶段 |
| `src/features/sandbox/PropertiesPanel.tsx` | 第三阶段 |
| `src/features/sandbox/presets.ts` | 第四阶段 |
| `src/features/sandbox/TaskPanel.tsx` | 第三阶段 |
| `src/features/recipe/RecipePanel.tsx` | 第三阶段 |
| `src/features/recipe/recipeTypes.ts` | 第三阶段 |
| `src/features/recording/RecorderControls.tsx` | 第四阶段 |
| `src/features/recording/PlaybackControls.tsx` | 第四阶段 |
| `src/features/canvas/Equipment.tsx` | 第四阶段 |
| `src/features/canvas/Scene.tsx` | 第四阶段 |
| `src/features/physics/ParticleSystem.ts` | 第四阶段 |
| `src/shared/ui/MobileBottomSheet.tsx` | 第三阶段 |
| `e2e/sandbox.spec.ts` | 第三阶段 |
| 各模块 `__tests__/` 目录 | 第三阶段 |
