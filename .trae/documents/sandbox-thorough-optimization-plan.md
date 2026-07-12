# 沙盒模块彻底优化计划

## 1. 摘要

本次优化把沙盒从“可运行但编辑体验粗糙”的状态升级为**稳定、流畅、可扩展的物理沙盒编辑器**。核心思路是：

- **解耦视觉与物理**：编辑态下用 kinematic 刚体/纯视觉同步，避免每拖动一次就销毁重建刚体。
- **历史栈精确控制**：只在“有意义操作”结束时提交历史，Slider/Gizmo 拖拽中间态不入栈。
- **补齐编辑器能力**：复制粘贴、网格吸附、相机视角切换、模拟速度、Esc 取消选择、预设加载确认等。
- **健壮持久化**：场景 JSON 增加版本号与迁移逻辑，导入导出更可靠。

## 2. 当前状态分析

### 2.1 已完成功能
- 器材添加/删除/复制、平移/旋转/缩放 Gizmo、运行/暂停物理、撤销/重做、本地自动保存、JSON 导入导出、3 个预设场景、材质/颜色/物理属性面板、空格/Delete/Ctrl+D/Ctrl+Z 快捷键。

### 2.2 关键问题

| 文件 | 问题 | 影响 |
|---|---|---|
| `sandboxStore.ts` | `idCounter` 为模块级变量，加载场景后可能重复；`updateItem` 每次调用都 `pushHistory` | ID 冲突、历史栈被 Slider/Gizmo 快速压爆 |
| `SandboxItemRenderer.tsx` | `useEffect` 依赖整个 `item`；Gizmo 拖拽每帧 `updateItem` 触发重建刚体 | 编辑抖动、性能浪费、历史栈爆炸 |
| `SelectionGizmo.tsx` | 无 `onDragStart/End`，直接同步到 store | 同上 |
| `PropertiesPanel.tsx` | Slider 使用 `onValueChange` 实时提交 | 拖拽一次产生几十条历史 |
| `useSandboxShortcuts.ts` | 无 Esc、Ctrl+C/V、无 Gizmo 焦点保护、Delete/Backspace 在输入框外也生效 | 误操作、能力缺失 |
| `EquipmentPalette.tsx` | 器材标签写死中文，sphere/torus 共用 `Circle` 图标；预设直接 `loadScene` 无确认 | i18n 缺失、图标歧义、数据丢失风险 |
| `sceneStorage.ts` | 无 `version` 字段，未来结构变更无法迁移；导出未 `try/finally` | 可维护性、内存泄漏风险 |
| `Sandbox.tsx` | 缺少网格吸附、相机视角、模拟速度控制 | 编辑效率低 |

## 3. 拟议改动

### 3.1 状态层重构：`src/features/sandbox/sandboxStore.ts`

**目标**：解决 ID 冲突、历史栈爆炸、补充编辑器状态。

**具体改动**：

1. ID 生成改用 `crypto.randomUUID()`，移除模块级 `idCounter`。
2. 拆分更新动作：
   - `updateItem(id, patch)`：更新数据**但不入历史栈**（用于 Slider/Gizmo 实时拖拽）。
   - `commitHistory()`：显式提交当前 `items+gravity` 到历史栈。
   - `updateItemAndCommit(id, patch)`：组合上面两者，用于按钮/切换等离散操作。
3. 在 store 中新增编辑器配置状态：
   ```ts
   interface SandboxEditorConfig {
     snapEnabled: boolean
     snapSize: number          // 默认 0.1
     angleSnapEnabled: boolean
     angleSnapSize: number     // 默认 Math.PI / 12 (15°)
     timeScale: number         // 默认 1
     cameraView: CameraView    // 'free' | 'top' | 'front' | 'side'
   }
   ```
   提供 `setEditorConfig(patch)`。
4. 新增剪贴板状态：
   ```ts
   clipboard: SandboxItem | null
   copyItem(id: string): void
   pasteItem(): void
   ```
5. `loadScene` 改为：先 `pushHistory` 保存当前场景，再加载新场景，并清空 `future`。
6. `resetScene` 与 `clearScene` 也先 `pushHistory`。
7. 历史栈容量从 20 提升到 50。

### 3.2 视觉-物理解耦：`src/features/sandbox/SandboxItemRenderer.tsx`

**目标**：编辑态不再频繁重建刚体，运行态稳定同步。

**具体改动**：

1. **材质缓存**：`useMemo` 依赖改为 `[item.material, item.color, selected]`，避免整个 `item` 变化重建材质。
2. **几何体缓存**：`useMemo` 依赖改为 `[item.shape, item.size]`。
3. **刚体生命周期**：
   - `editingEnabled=true`（暂停）时：
     - 如果原先是 dynamic，改为创建 `kinematicPositionBased` 刚体（或仍创建 dynamic 但每帧 setTranslation/setRotation）。
     - 推荐方案：创建 `kinematicPositionBased`，在 `useEffect` 中当 `editingEnabled` 切换时重新创建刚体（状态切换低频，可接受）。
   - `editingEnabled=false`（运行）时：正常创建 `dynamic`/`static` 刚体。
4. **编辑态同步**：在 `useFrame` 或 `useEffect` 中，当 `editingEnabled=true` 时，把 mesh 的 position/rotation 回写到 kinematic 刚体，保持物理世界与视觉一致。
5. **运行态同步**：保留现有 `useFrame` 读取刚体坐标到 mesh。
6. **依赖数组修正**：移除 `item` 整体依赖，仅保留 `item.id, item.shape, item.size, item.isDynamic, item.mass, item.friction, item.restitution` 及 `editingEnabled`。
7. **选择框修复**：当前选择框使用 `item.size` 未考虑 `scale`，改为 `item.size * item.scale`。

### 3.3 Gizmo 精确控制：`src/features/sandbox/SelectionGizmo.tsx`

**目标**：拖拽中间态不入历史，释放后一次性提交。

**具体改动**：

1. 扩展 props：
   ```ts
   interface SelectionGizmoProps {
     mesh: Object3D | null
     mode: GizmoMode
     snapEnabled: boolean
     snapSize: number
     angleSnapEnabled: boolean
     angleSnapSize: number
     onChange: (patch: Partial<SandboxItem>) => void      // 拖拽中实时调用
     onCommit: (patch: Partial<SandboxItem>) => void      // 拖拽结束调用
     enabled: boolean
   }
   ```
2. 使用 `TransformControls` 的 `onMouseDown` / `onMouseUp`（或 `onDragStart` / `onDragEnd`）区分拖拽中/结束。
3. 拖拽中：读取 mesh transform，应用吸附逻辑后调用 `onChange`。
   - 平移吸附：`Math.round(v / snapSize) * snapSize`。
   - 旋转吸附：`Math.round(v / angleSnapSize) * angleSnapSize`。
4. 拖拽结束：调用 `onCommit`，由父组件触发 `commitHistory()`。
5. 修复旋转读取：使用 `mesh.rotation.toVector3()` 后再写回 Euler；或在 store 中直接存储四元数。本次保持 Euler，但通过 `mesh.rotation` 读取即可。

### 3.4 属性面板：`src/features/sandbox/PropertiesPanel.tsx`

**目标**：Slider 不再压爆历史栈，新增编辑器配置入口。

**具体改动**：

1. Slider 同时监听：
   - `onValueChange`：调用 `updateItem`（实时视觉反馈，不入历史）。
   - `onValueCommit`（Radix Slider 原生支持）：调用 `updateItemAndCommit` 或 `commitHistory()`。
2. 新增“编辑器设置”区域：
   - 网格吸附开关 + 步长 Slider（0.01 ~ 1）。
   - 角度吸附开关 + 步长 Slider（5° ~ 45°）。
   - 模拟速度 Slider（0 ~ 2，步长 0.1）。
   - 相机视角按钮组（free/top/front/side）。
3. 显示选中器材 ID 时，过长截断显示。

### 3.5 主页面：`src/pages/Sandbox.tsx`

**目标**：把编辑器配置暴露到工具栏，统一状态来源。

**具体改动**：

1. 从 store 读取 `editorConfig`、`setEditorConfig`、`clipboard`、`copyItem`、`pasteItem`。
2. 工具栏新增：
   - 网格吸附 toggle 按钮（快捷键 `G`）。
   - 相机视角下拉/按钮组（free/top/front/side）。
   - 模拟速度 Slider 或 0.25x/0.5x/1x/2x 按钮。
3. 把 `gizmoMode` 状态也迁移到 store（便于快捷键与工具栏同步）。
4. `PhysicsProvider` 的 `autoStep={isRunning}`，并通过 `fixedTimestep` 或自定义 hook 应用 `timeScale`。
   - 方案：在 `Sandbox.tsx` 中用 `useFrame` 控制步进，或扩展 `PhysicsProvider` 支持 `timeScale`。推荐扩展 `PhysicsProvider` 更简单。
5. 导入错误使用更友好的 UI 提示（可在页面内用 `useState` 管理错误 toast）。
6. 空场景提示增加“加载预设”入口。

### 3.6 物理提供层扩展：`src/features/physics/PhysicsProvider.tsx`

**目标**：支持模拟速度缩放。

**具体改动**：

1. 新增 prop `timeScale?: number`（默认 1）。
2. 在 `useFrame` 中：
   ```ts
   const scaledDelta = delta * timeScale
   accumulatorRef.current += Math.min(scaledDelta, 0.1)
   ```
3. 保持现有 fixed timestep 逻辑不变。

### 3.7 快捷键：`src/features/sandbox/useSandboxShortcuts.ts`

**目标**：补齐能力并防止误触。

**具体改动**：

1. 扩展接口：
   ```ts
   interface SandboxShortcuts {
     onRunToggle: () => void
     onDelete: () => void
     onDuplicate: () => void
     onUndo: () => void
     onRedo: () => void
     onSetGizmoMode: (mode: GizmoMode) => void
     onDeselect?: () => void
     onCopy?: () => void
     onPaste?: () => void
     onToggleSnap?: () => void
   }
   ```
2. 增加焦点保护：判断 `event.target.closest('[data-sandbox-canvas]')` 或 `data-gizmo`，当 Gizmo 激活时空间键不暂停。
3. 新增快捷键：
   - `Esc`：取消选择。
   - `Ctrl+C`：复制选中器材。
   - `Ctrl+V`：粘贴。
   - `G`：切换网格吸附。
   - `T/R/S`：切换 Gizmo 模式。
   - `Space`：运行/暂停。
   - `Delete/Backspace`：删除（保留，但增加 `event.target` 不是 `input` 的判断）。

### 3.8 器材面板：`src/features/sandbox/EquipmentPalette.tsx`

**目标**：国际化、图标去重、预设加载安全。

**具体改动**：

1. 器材标签改为 `t(`sandbox.shape.${shape}`)`，在 `I18nProvider` 中补充翻译。
2. `sphere` 图标改用 `Circle`（实心），`torus` 改用 `Donut` 或自定义 SVG；若 `lucide-react` 无 `Donut`，使用 `Hexagon` 避免与 capsule 重复，或引入 `CircleDashed`。
3. 预设加载按钮增加 `window.confirm` 确认（防止覆盖当前工作）。
4. 给器材按钮增加 tooltip/hint（使用现有 `title` 属性即可）。

### 3.9 场景持久化：`src/features/sandbox/sceneStorage.ts`

**目标**：版本化、可迁移、导出安全。

**具体改动**：

1. 定义版本化结构：
   ```ts
   interface VersionedScene {
     version: number
     gravity: [number, number, number]
     items: SandboxItem[]
   }
   ```
2. `saveScene` 写入 `{ version: 1, ...scene }`。
3. `loadStoredScene` 读取后：
   - 若无 `version` 字段，按旧结构兼容解析。
   - 根据 `version` 调用迁移函数 `migrateScene`。
4. `exportScene` 导出带 `version` 的 JSON。
5. `importScene` 使用 `try/finally` 确保 `URL.revokeObjectURL(url)`。
6. 使用之前定义的 `ImportSceneError` 类型，统一错误信息。

### 3.10 翻译补充：`src/app/providers/I18nProvider.tsx`

新增/修改键（zh/en 双语）：

```
sandbox.shape.box / sphere / cylinder / capsule / cone / plane / torus / spring
sandbox.gizmoTranslate / gizmoRotate / gizmoScale
sandbox.snap / sandbox.snapSize / sandbox.angleSnap / sandbox.angleAngleSnap
sandbox.timeScale / sandbox.cameraView
sandbox.presetConfirm
sandbox.importError
sandbox.copy / sandbox.paste
sandbox.deselect
sandbox.viewFree / viewTop / viewFront / viewSide
sandbox.simulationSpeed
```

## 4. 假设与决策

- **不引入外部库**：剪贴板、吸附、历史栈全部用现有 React/Zustand 实现，避免新增依赖。
- **不实现多选**：本次只保留单选 + 剪贴板；多选涉及 Gizmo、属性面板批量编辑，超出本次范围。
- **kinematic 方案**：编辑态暂停时使用 `kinematicPositionBased`，运行时切换回 `dynamic`。状态切换时重建刚体可接受（用户点击运行/暂停频率低）。
- **timeScale 通过 PhysicsProvider**：改动最小，且实验页也能受益。
- **版本号从 1 开始**：旧数据无 `version` 时视为版本 0 并兼容读取。

## 5. 验证步骤

1. **TypeScript**：`npx tsc --noEmit` 无错误。
2. **ESLint**：`npx eslint src/features/sandbox src/pages/Sandbox.tsx src/features/physics/PhysicsProvider.tsx --ext .ts,.tsx` 无警告。
3. **构建**：`npm run build` 成功。
4. **功能验证清单**：
   - [ ] 添加多个器材，ID 不重复。
   - [ ] 拖动 Gizmo，历史栈只在释放后增加一条。
   - [ ] 拖动 Slider，历史栈只在释放后增加一条。
   - [ ] 切换运行/暂停，物体正常下落/静止，无抖动。
   - [ ] 编辑态拖动物体后点击运行，物体从当前位置开始物理模拟。
   - [ ] 复制粘贴（Ctrl+C/V）正常工作。
   - [ ] 网格吸附开启后，Gizmo 平移按步长吸附。
   - [ ] 相机视角切换正常。
   - [ ] 模拟速度 0.5x/2x 运行正常。
   - [ ] 导出/导入 JSON 成功，且文件包含 `version` 字段。
   - [ ] 刷新页面后自动恢复上次场景。
   - [ ] 撤销/重做 50 步内可用。
   - [ ] 加载预设时弹出确认框。
