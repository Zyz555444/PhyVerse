# PhyVerse 性能全面提升优化计划

## 一、总览

本项目是一个基于 React 19 + Three.js + Rapier 的 3D 物理实验引擎。核心性能瓶颈集中在三个方向：Zustand 订阅碎片化导致 React 层过度 re-render、物理模拟与渲染同步的帧预算分配、3D 渲染管线中缺少主动剔除策略。优化目标是将沙盒 30+ 物体的场景从当前约 25-35 FPS 提升至稳定 60 FPS，首页加载时间（LCP）控制在 2s 以内。

---

## 二、渲染性能优化

### 2.1 Canvas Renderer 参数调优（P0）

**现状**：`Scene.tsx` 默认开启 `antialias: true`、`toneMapping` 后处理、`shadows='percentage'`，高 dpr 场景下开销叠加。

**方案**：
- 对 `Canvas` 增加 `frameloop='demand'` 支持：编辑态（无物理运行）时按需渲染
- `dpr` 根据 FPS 动态降级：当连续 3 秒 FPS < 30 时，临时将 `dpr` 上限从 1.5 降至 1.0
- 将 `precision` 设为 `'mediump'` 减少移动端 GPU 带宽压力

**目标文件**：`src/features/canvas/Scene.tsx`、`src/pages/Sandbox.tsx`

### 2.2 Three.js InstancedMesh 替代逐物体渲染（P0）

**现状**：沙盒中每个 `SandboxItem` 是一个独立 `<mesh>` 节点，30 个物体 = 30 次 draw call。

**方案**：
- 按材质分组（StandardMaterial → 正常物体、LambertMaterial → 静态表面、BasicMaterial → 线框/辅助物体）
- 每个材质组用一个 `InstancedMesh`，通过 `instanceMatrix` 更新位置/旋转/缩放
- 保留 `key` 对应 `item.id → instanceIndex` 的映射，供选择高亮回写

**影响文件**：新增 `src/features/sandbox/BatchedRenderer.tsx`、修改 `SandboxItemRenderer.tsx`

### 2.3 视锥体剔除与 LOD（P1）

**方案**：
- `useFrame` 中利用 `camera.frustum.containsPoint` 做 CPU 侧粗剔除
- 距离摄像机 >50 单位的物体设置 `visible=false`
- 每帧物体数 >50 时按距离分 3 级 LOD

**目标文件**：`src/features/sandbox/BatchedRenderer.tsx`

### 2.4 阴影质量动态降级（P1）

**方案**：
- 增加"阴影质量"三档选项（高/中/低），移动端自动降为"低"
- 阴影贴图显式设置分辨率为 1024×1024

**目标文件**：`src/features/canvas/Scene.tsx`、`src/features/canvas/Lighting.tsx`

### 2.5 PostProcessing 按需启用（P2）

**方案**：
- SSAO samples 从默认 21 降至 9~13
- 仅实验报告截图或录制模式时启用全效果

**目标文件**：`src/features/canvas/PostProcessing.tsx`

---

## 三、物理引擎性能优化

### 3.1 物理时间步自适应（P0）

**现状**：`PhysicsProvider` 统一使用 1/120s 固定 timestep，maxSubSteps=8。

**方案**：
- 当 FPS < 30 时，将 `timestep` 从 1/120 调整为 1/60，maxSubSteps 从 8 降至 4
- 轻物体最小质量 clamp 到 0.05（避免数值不稳定）
- 高 restitution 物体（>0.9）增加 `contactSkin` 到 0.01

**目标文件**：`src/features/physics/PhysicsProvider.tsx`、`src/features/physics/PhysicsWorld.ts`

### 3.2 碰撞体优化（P1）

**方案**：
- 静态物体统一设为 `RigidBodyType.Fixed`
- 大量同形状动态物体可合并为 `Compound` 碰撞体

**目标文件**：`src/features/physics/RigidBodyFactory.ts`

### 3.3 力场计算节流 + 空间索引（P1）

**现状**：`ForceFieldRenderer.tsx` 每帧 O(n*m) 遍历所有力场 × 动态物体。

**方案**：
- `useFrame` 中力场计算降为每 3 帧执行一次（约 20Hz）
- 用 `THREE.Box3` 做粗筛选预过滤

**目标文件**：`src/features/sandbox/ForceFieldRenderer.tsx`

### 3.4 Rapier 休眠参数调优（P2）

**方案**：
- `normalizedAllowedLinearError` 从 0.001 调至 0.005
- 增加 `normalizedAllowedAngularError=0.001`
- `sleepThreshold` 从默认 1 秒调至 2 秒

**目标文件**：`src/features/physics/PhysicsWorld.ts`

---

## 四、状态管理性能优化

### 4.1 Zustand 订阅碎片化聚合（P0）

**现状**：`Sandbox.tsx` 有 40 个独立 `useSandboxStore(s => s.xxx)` 调用。

**方案**：
- 用 `zustand/shallow` 的 `useShallow` 将相关字段聚合成 object selector
- 将 `Sandbox.tsx` 按布局拆分为独立面板组件

**目标文件**：`src/pages/Sandbox.tsx`、各新增面板组件

### 4.2 sandboxStore 按职责拆分（P1）

**方案**：
- 拆分为 `sceneStore`、`taskStore`、`telemetryStore`、`editorConfigStore`
- 各 store 之间通过 Public API 通信

**影响文件**：新建 4 个 store 文件，更新所有引用者（约 15 个文件）

### 4.3 高频更新字段单独管理（P1）

**方案**：
- 将 `telemetry.live` 提取到独立 `liveTelemetryStore`
- 其他组件只订阅 `telemetry.history`（变化频率远低于 live）

### 4.4 I18nProvider 翻译数据按需加载（P2）

**方案**：
- 将翻译拆分为按页面/模块分文件
- 按路由 `React.lazy` 动态导入模块翻译

---

## 五、构建与加载性能优化

### 5.1 代码分割细化（P0）

**方案**：
- 将 `@react-three/drei` 和 `@react-three/postprocessing` 各分独立 chunk
- 将 `recharts` 和 `framer-motion` 各分独立 chunk
- 确认所有页面路由使用 `React.lazy` + `Suspense`

### 5.2 Three.js 路径导入（P1）

**现状**：大量文件使用 `import * as THREE from 'three'` 全量导入。

**方案**：改为按需路径导入（`import { Vector3, Euler } from 'three'`）

### 5.3 Rapier WASM 预加载（P1）

**方案**：
- 在 `index.html` 中通过 `<link rel="preload">` 预加载 WASM
- 或在 `Landing` 页面的 `useEffect` 中提前初始化 `RAPIER.init()`

### 5.4 Service Worker 缓存策略优化（P2）

**方案**：
- 静态资源 Cache-First，带版本化缓存名
- API 请求 Network-First
- WASM 文件单独缓存键

### 5.5 Tailwind CSS v4 扫描范围限制（P2）

**方案**：限制 `@tailwindcss/vite` 插件只扫描 `src/` 目录

---

## 六、内存性能优化

### 6.1 几何体/材质缓存池（P0）

**方案**：
- 全局几何体缓存 `Map<string, BufferGeometry>`
- 材质缓存 `Map<MaterialPreset, MeshStandardMaterial>`
- `dispose` 时引用计数管理

### 6.2 遥测数据内存管理（P1）

**方案**：
- `MAX_SAMPLES_PER_BODY = 3600`
- `MAX_RECORDING_FRAMES = 1800`
- 使用 TypedArray 存储遥测数据

### 6.3 Undo/Redo 增量 diff（P2）

**方案**：
- 环形缓冲区替代 splice/shift
- 增量 diff 替代完整快照
- 每 20 次 commit 插入关键帧

---

## 七、API 与网络性能

### 7.1 场景自动保存节流优化（P1）

**方案**：改为 throttle（每 2 秒最多保存一次）

### 7.2 IndexedDB 替代 localStorage（P2）

**方案**：
- `idb-keyval` 迁移场景存储
- localStorage 做缓存层，IndexedDB 做持久层

### 7.3 AI 聊天虚拟滚动（P2）

**方案**：使用 `@tanstack/react-virtual` 渲染 AI 消息列表

---

## 八、实验页性能优化

### 8.1 ExperimentSetup 重挂载优化（P0）

**方案**：`PhysicsProvider` 增加 `reset()` 方法，避免 WASM 重初始化

### 8.2 实验资源预缓存（P2）

**方案**：`registry.ts` 增加 `preloadHints` 字段，后台预加载 3D 模型

---

## 九、实施路线图

### 第一阶段：低风险、高收益（12h）

| 序号 | 优化项 | 收益 | 风险 |
|------|--------|------|------|
| 1 | Zustand 订阅聚合 + useShallow | re-render 降 80% | 低 |
| 2 | Canvas frameloop=demand（编辑态） | GPU 闲置时降功耗 | 低 |
| 3 | 几何体/材质缓存池 | 内存降 30% | 低 |
| 4 | 物理 timestep 自适应 | 低帧率下物理平滑 | 低 |
| 5 | 代码分割细化 | 首屏 JS -40% | 中 |

### 第二阶段：架构重构（18h）

| 序号 | 优化项 | 收益 | 风险 |
|------|--------|------|------|
| 6 | sandboxStore 按职责拆分 | 可维护性提升 | 中 |
| 7 | Sandbox.tsx 巨型组件拆分 | re-render 范围缩小 | 中 |
| 8 | InstancedMesh 批量渲染 | draw call 降 70% | 中 |
| 9 | 力场计算节流 + 预过滤 | 物理 CPU 降 40% | 低 |
| 10 | Three.js 路径导入 | bundle -15% | 低 |

### 第三阶段：深度优化（15h）

| 序号 | 优化项 | 收益 | 风险 |
|------|--------|------|------|
| 11 | 视锥体剔除 + LOD | 大场景 +10 FPS | 中 |
| 12 | Rapier 休眠参数调优 | 静态场景物理降 50% | 低 |
| 13 | Rapier WASM 预加载 | 实验页切入 -500ms | 低 |
| 14 | 遥测 TypedArray 存储 | 内存 -70% | 中 |
| 15 | 阴影质量动态降级 | 移动端 +5 FPS | 低 |

### 第四阶段：体验打磨（12h）

| 序号 | 优化项 | 收益 | 风险 |
|------|--------|------|------|
| 16 | IndexedDB 迁移 | 存储容量突破 | 中 |
| 17 | I18n 翻译按需加载 | 非沙盒页 JS -100KB | 低 |
| 18 | Undo/Redo 增量 diff | 内存 -60% | 中 |
| 19 | Service Worker 缓存优化 | 离线体验 | 低 |
| 20 | 消息列表虚拟滚动 | AI 长列表优化 | 低 |

---

## 十、监控与验证

### 定量指标

| 指标 | 当前值 | 目标值 | 测量工具 |
|------|--------|--------|---------|
| 30 物体场景 FPS | 25-35 | 55-60 | useFps + Chrome DevTools |
| 首屏 LCP | ~3.5s | <2s | Lighthouse |
| 首屏 JS 体积 | ~800KB (gzip) | <400KB | rollup-plugin-visualizer |
| 初始内存 | ~120MB | <60MB | Chrome Memory Profiler |
| Store 订阅触发/帧 | ~40 次 | <10 次 | Zustand subscribe |
