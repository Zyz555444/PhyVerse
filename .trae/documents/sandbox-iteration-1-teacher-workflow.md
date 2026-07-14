# 自由沙盒模块 · 迭代一：稳定性 + 教师核心工作流

## Context（背景）

上一轮迭代（2026-07-13）已完成：全屏模式、可折叠侧栏、关节创建 UI、6 个预设场景、撤销/重做修复、画布扩容、暂停指示器、友好命名、工具栏重整。本轮基于教师课堂使用反馈，目标是解决"**编辑看不见效果、复杂场景难管理、演示缺工具**"三类痛点，达到生产级可用标准。

通过逐行审计当前实现，发现 **7 个稳定性缺陷**（其中 1 个为严重视觉 bug），并规划 **9 项面向教师工作流的新功能**。本迭代不引入破坏性架构变更，所有改动在现有 `sandboxStore` / `SandboxItemRenderer` / `Sandbox.tsx` 框架内完成。**范围确认（用户已选）**：7 项 bug 修复 + 全部 9 项新功能一次推进到位。

---

## 一、稳定性缺陷修复（必修）

### 1.1 严重：滑块编辑 transform 不生效
- **现象**：暂停模式下，在属性面板拖动"位置/旋转/缩放"滑块，物体视觉上完全不动。
- **根因**：[SandboxItemRenderer.tsx](file:///d:/1/phyverse/src/features/sandbox/SandboxItemRenderer.tsx) 中 `<mesh>` 未绑定 `position`/`rotation`/`scale` props；`useFrame` 在编辑态写入 `meshNode→body`，每帧把 body 覆盖回 mesh 的旧位置。store 的变更只更新了 body，但 mesh 从未被同步。
- **修复**：在已有的"Sync body transform from store" effect 中（约 L274-284），同时把 `item.position`/`item.rotation`/`item.scale` 写入 meshNode。仅在 `editingEnabled` 时写 mesh，避免与运行态 `useFrame` 冲突。该 effect 本身只在 `item.position/rotation/scale` 变化时触发，运行态不会误触。

### 1.2 严重：mesh 缩放永远不反映 item.scale
- **现象**：缩放滑块和缩放数值无效；选择框却放大（因 `SelectionOutline` 用了 `size*scale`），导致选择框与物体脱节。
- **根因**：`getVisualGeometry` 只用 `item.size` 生成几何体；mesh.scale 恒为 `[1,1,1]`。
- **修复**：在上述同步 effect 中一并设置 `meshNode.scale.set(...item.scale)`。Gizmo 缩放与滑块缩放路径一致，无冲突。

### 1.3 内存泄漏：material / geometry 未释放
- **位置**：[SandboxItemRenderer.tsx](file:///d:/1/phyverse/src/features/sandbox/SandboxItemRenderer.tsx) L195-201（material）、L110-143（SelectionOutline 的 EdgesGeometry）、L152-169（SpringGeometry 的 TubeGeometry）。
- **修复**：每个 `useMemo` 旁挂一个 `useEffect(() => () => geometry.dispose(), [geometry])`，material 同理。模式与项目内 `Materials.ts` 一致。

### 1.4 关节全量重建抖动
- **位置**：[SandboxJoints.tsx](file:///d:/1/phyverse/src/features/sandbox/SandboxJoints.tsx) L96-133。
- **现象**：`useEffect` 依赖 `[world, joints]`，每次 joints 变化都先 cleanup 全部移除再重建，造成物理瞬态抖动。
- **修复**：去掉 return cleanup 的全量移除，改为 diff：仅 `removeJoint` 不在新集合中的 label，仅 `addJoint` 新增的。Unmount 时通过单独的 `useEffect(() => () => { 全量移除 }, [world])` 清理。

### 1.5 SpringLine 每帧新建 BufferGeometry
- **位置**：[SandboxJoints.tsx](file:///d:/1/phyverse/src/features/sandbox/SandboxJoints.tsx) L62-83。
- **修复**：用 `useRef<THREE.BufferGeometry>` 持久化几何体，每帧 `setAttribute('position', new Float32BufferAttribute(...))` 并 `computeBoundingSphere()`；unmount 时 dispose。

### 1.6 绳索 / 固定关节无视觉指示
- **现象**：教师创建 rope/fixed 后场景中看不到连线，难以讲解。
- **修复**：扩展 `SpringLine` 为通用 `JointLine`，所有 3 种关节都画连线：spring 用灰虚线、rope 用棕色实线、fixed 用蓝色短点线。`SandboxJoints` 渲染时不再 filter 只保留 spring。

### 1.7 友好命名逻辑三处重复
- **位置**：[sandboxStore.ts](file:///d:/1/phyverse/src/features/sandbox/sandboxStore.ts) L436-452、[PropertiesPanel.tsx](file:///d:/1/phyverse/src/features/sandbox/PropertiesPanel.tsx) L18-34、[Sandbox.tsx](file:///d:/1/phyverse/src/pages/Sandbox.tsx) L210-226。
- **修复**：导出 `sandboxStore` 的 `getFriendlyName` 为独立工具函数 `getFriendlyName(items, id)`，三处统一调用。

---

## 二、新功能（教师工作流）

### 2.1 场景层级面板（Scene Hierarchy）
- **价值**：教师管理复杂场景时最大的痛点。当前只能点击 3D 物体选择，难以精准操作重叠或小物体。
- **位置**：右栏顶部（在 `PropertiesPanel` 之上），与属性面板共享右栏。高度可折叠，默认展开约占右栏 40%。
- **实现**：新建 `SceneHierarchyPanel`，由 `Sandbox.tsx` 右栏先渲染层级面板再渲染属性面板（用 flex-col + 各自 overflow-y-auto）。每行显示：形状小图标 / 友好名（可点击重命名，双击进入编辑）/ 可见性眼睛按钮 / 锁定按钮 / 删除按钮。点击行=选中；Ctrl/Shift+点击=多选；与 3D 点击选中状态双向同步。
- **新 store 字段**：`SandboxItem` 增加 `hidden?: boolean`、`locked?: boolean`、`displayName?: string`（用户自定义名覆盖友好名）。`SandboxItemRenderer` 在 `hidden` 时 `return null`；`locked` 时禁用 gizmo（`enabled={selected && editingEnabled && !item.locked}`）。
- **文件**：新建 `src/features/sandbox/SceneHierarchyPanel.tsx`；改 `sandboxStore.ts`、`SandboxItemRenderer.tsx`、`Sandbox.tsx`。

### 2.2 单步模拟（Step Simulation）
- **价值**：碰撞、弹跳过程的逐帧分析，是物理教学核心需求。
- **实现**：`PhysicsProvider` 已支持 `autoStep=false`。新增"单步"按钮，调用 `world.step()` 一次。但当前 `autoStep={isRunning}` 切换会重置 accumulator，单步需独立路径：
  - 新增 store 状态 `stepRequested: number`（计数器）
  - `Sandbox.tsx` 在 `PhysicsProvider` 外层包一个 `ManualStepper` 组件，监听 `stepRequested` 变化时调用 `useFrame` 内 `world.step()`
  - 或更简单：保持 `autoStep=false`（暂停态），按钮 onClick 时通过 ref 调用 `world.step()` 一次
- **文件**：改 `Sandbox.tsx`、新建 `src/features/sandbox/ManualStepper.tsx`（或在 `Sandbox.tsx` 内联）。

### 2.3 施加冲量模式（Apply Impulse）
- **价值**：教师演示动量/碰撞时，需要"踢一下"物体来触发现象。
- **实现**：工具栏新增"施力"模式开关（与平移/旋转/缩放并列）。开启后，点击 3D 物体不选中而是 `body.rigidBody.applyImpulse({x,y,z}, true)`，冲量方向沿相机视线向内、大小由 `editorConfig.impulseStrength` 控制（默认 5）。仅在 `isRunning` 时可用。
- **文件**：改 `Sandbox.tsx`（工具栏 + 模式）、`SandboxItemRenderer.tsx`（onClick 分支）、`sandboxStore.ts`（`editorConfig.impulseMode`、`impulseStrength`）。

### 2.4 轨迹追踪（Trajectory Tracing）
- **价值**：抛体运动、单摆等演示需要可视化运动路径。
- **实现**：选中物体时显示"轨迹"开关。开启后 `SandboxItemRenderer` 内部维护 `positions: THREE.Vector3[]`，`useFrame` 在运行态每 N 帧采样 `body.translation()` 推入；用 `Line2`/`lineSegments` 渲染。轨迹长度上限 300 点，超出 shift。停止运行或取消选中时清空。
- **文件**：改 `SandboxItemRenderer.tsx`；`sandboxStore.ts` 增加 `editorConfig.showTrajectory`。

### 2.5 聚焦选中物体（Focus Selected）
- **价值**：大场景中相机难以找到选中物体。
- **实现**：工具栏"重置相机"旁加"聚焦选中"按钮。点击后通过新的 `cameraFocusKey` 计数器传入 `CameraController`，后者在 focus 变化时把 target 设为选中物体的 position。需要 `CameraController` 扩展 `focusTarget?: [number,number,number]` prop。
- **文件**：改 `src/features/canvas/Controls.tsx`、`Sandbox.tsx`。

### 2.6 一键落地（Snap to Ground）
- **价值**：教师布置场景时，物体悬浮在 y=3 不便定位。
- **实现**：右键菜单或属性面板按钮"落地"。计算物体底部到地面的距离（基于 `getPhysicsDimensions` 的 y 半高 + 当前 y），`updateItemAndCommit({ position: [x, groundY, z] })`。`groundY = 半高`（桌面在 y=0.8，但桌面高度可由 LabTable 推断；简化为落到 y= 物体半高）。
- **文件**：改 `PropertiesPanel.tsx`、`sandboxStore.ts`（新增 `snapToGround(id)` action）。

### 2.7 帮助浮层（Help Overlay）
- **价值**：快捷键当前仅显示在空场景提示中，发现性差。
- **实现**：工具栏右侧加"？"按钮，点击打开 `Dialog`（复用 `@/shared/ui/Dialog`），分组展示全部快捷键 + 操作说明。按 `?` 键也触发。
- **文件**：新建 `src/features/sandbox/HelpOverlay.tsx`；改 `useSandboxShortcuts.ts`、`Sandbox.tsx`、`I18nProvider.tsx`。

### 2.8 锁定 / 隐藏（Lock & Hide）
- **价值**：教师布置好背景物体后，锁定防误移；隐藏临时不用的物体。
- **实现**：见 2.1 的 `locked`/`hidden` 字段。属性面板增加两个 checkbox。层级面板每行有眼睛/锁图标。
- **文件**：改 `PropertiesPanel.tsx`、`SandboxItemRenderer.tsx`、`SceneHierarchyPanel.tsx`。

### 2.9 改进空场景引导
- **现象**：当前空场景只显示两行文字。教师初次进入不知道从哪开始。
- **实现**：空场景提示改为 3 个大按钮：[自由搭建]（高亮左侧器材库）/ [加载预设]（弹出预设网格）/ [查看教程]（打开 Help Overlay）。预设网格复用 `SANDBOX_PRESETS`。
- **文件**：改 `Sandbox.tsx` 的空场景分支。

---

## 三、UX 打磨

### 3.1 状态栏增强
在已有"X 个物体 / Y 个连接"基础上，追加"已选: 友好名"（已有）、"FPS: xx"（基于 `useFrame` 累计）。FPS 仅在 dev 或调试开关开启时显示，避免干扰。

### 3.2 i18n 完整覆盖
为所有新功能添加 zh/en 翻译键，集中在 `I18nProvider.tsx` 的 `sandbox.*` 命名空间。预计新增约 25 个 key。

### 3.3 测试
在 `src/features/sandbox/__tests__/` 新建：
- `sandboxStore.test.ts`：覆盖 `snapToGround`、`lock`/`hide` toggle、`updateItemAndCommit` 历史、joint 增量 add/remove 不影响其他 joint
- `SceneHierarchyPanel.test.tsx`：渲染、点击选中、visibility/lock 按钮调用 store
- `getFriendlyName.test.ts`：边界情况（空 items、未知 id、重名形状）

参照 [Button.test.tsx](file:///d:/1/phyverse/src/shared/ui/__tests__/Button.test.tsx) 的 vitest + testing-library 模式。

---

## 四、关键文件清单

| 文件 | 改动类型 |
|------|----------|
| [src/features/sandbox/sandboxStore.ts](file:///d:/1/phyverse/src/features/sandbox/sandboxStore.ts) | 扩展 `SandboxItem`/`SandboxEditorConfig`、新增 actions、抽取 `getFriendlyName` |
| [src/features/sandbox/SandboxItemRenderer.tsx](file:///d:/1/phyverse/src/features/sandbox/SandboxItemRenderer.tsx) | 修 bug 1.1/1.2/1.3、加轨迹、加 hidden/locked、加冲量点击 |
| [src/features/sandbox/SandboxJoints.tsx](file:///d:/1/phyverse/src/features/sandbox/SandboxJoints.tsx) | 修 bug 1.4/1.5/1.6 |
| [src/features/sandbox/PropertiesPanel.tsx](file:///d:/1/phyverse/src/features/sandbox/PropertiesPanel.tsx) | 用工具函数、加 lock/hide、加落地按钮 |
| [src/features/sandbox/SelectionGizmo.tsx](file:///d:/1/phyverse/src/features/sandbox/SelectionGizmo.tsx) | locked 时禁用 |
| [src/features/sandbox/useSandboxShortcuts.ts](file:///d:/1/phyverse/src/features/sandbox/useSandboxShortcuts.ts) | 加 `?` 帮助、`Step` 单步快捷键 |
| [src/pages/Sandbox.tsx](file:///d:/1/phyverse/src/pages/Sandbox.tsx) | 工具栏新按钮、单步、聚焦、空场景重写、状态栏 |
| [src/features/canvas/Controls.tsx](file:///d:/1/phyverse/src/features/canvas/Controls.tsx) | `focusTarget` prop |
| [src/app/providers/I18nProvider.tsx](file:///d:/1/phyverse/src/app/providers/I18nProvider.tsx) | 新 i18n key |
| 新建 `src/features/sandbox/SceneHierarchyPanel.tsx` | 层级面板 |
| 新建 `src/features/sandbox/HelpOverlay.tsx` | 帮助浮层 |
| 新建 `src/features/sandbox/__tests__/*.test.ts(x)` | 单元测试 |

---

## 五、验证计划

1. **TypeScript**：`npm run build`（含 `tsc -b`）通过，无类型错误。
2. **Lint**：`npm run lint --max-warnings=0` 通过。
3. **单元测试**：`npm run test` 全部通过（现有 15 项 + 新增项）。
4. **E2E**：`npm run e2e` 现有 4 项 sandbox spec 通过；新增 1 项"层级面板选中物体"spec。
5. **手动回归**：
   - 暂停态拖动位置/旋转/缩放滑块，物体跟随移动（核心 bug 验证）
   - 创建 3 种关节均可见连线
   - 复杂场景（10+ 物体）操作流畅，无明显卡顿；切换/删除物体不抖动
   - 单步、施力、轨迹、聚焦、落地、帮助各功能正常
   - 锁定物体后 gizmo 不可拖；隐藏物体后不可见且不参与点击
6. **性能**：DevTools Performance 录制 30s 交互，无 geometry/material 泄漏（heap snapshot 对比）。

---

## 六、迭代节奏

本迭代完成后，规划中的下一迭代方向（不在本次范围）：
- **迭代二**：录制与回放（保存仿真过程）、数据图表（速度/位置随时间）、相机关键帧
- **迭代三**：移动端触控、教案模板库、课堂投屏模式、学生远程查看
