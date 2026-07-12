# 沙盒模块彻底优化计划

## Summary

本轮优化将修复沙盒模块当前剩余的两个生产构建错误，同时完善 Gizmo 交互、快捷键保护、属性面板提交体验和场景持久化的健壮性，确保 TypeScript、ESLint 和生产构建全部通过，并使编辑器操作更符合专业物理沙盒的预期体验。

## Current State Analysis

沙盒模块已完成核心功能：基于 Zustand 的物品状态管理、Rapier3D 物理集成、Three.js 渲染、TransformControls Gizmo、属性面板、快捷键系统、localStorage 自动保存与 JSON 导入导出。

当前存在两类问题：

1. **构建阻断错误**
   - `src/features/sandbox/SandboxItemRenderer.tsx:295` 使用了未解构的 `gizmoMode`。
   - `src/features/sandbox/SelectionGizmo.tsx:52-56` 使用了 `@react-three/drei` v10 中 `TransformControls` 不支持的 `onDragStart`/`onDragEnd` 属性。

2. **体验与健壮性可优化点**
   - `useSandboxShortcuts.ts` 中 `Delete`/`Backspace` 在无选中项时仍会 `preventDefault()`，可能意外拦截浏览器默认行为。
   - `PropertiesPanel.tsx` 中重力三轴分别提交，导致 undo 需要三次才能恢复完整重力。
   - `sceneStorage.ts` 对导入未来版本（`version > CURRENT_VERSION`）的场景缺少明确提示。

## Proposed Changes

### 1. 修复 `SandboxItemRenderer.tsx` 的 `gizmoMode` 解构

**文件：** `src/features/sandbox/SandboxItemRenderer.tsx`

**What：** 在组件参数解构中添加 `gizmoMode`。

**Why：** 接口 `SandboxItemRendererProps` 已声明该字段，`Sandbox.tsx` 也已作为 prop 传入，但组件内部解构遗漏，导致构建失败 `Cannot find name 'gizmoMode'`。

**How：**

```tsx
export function SandboxItemRenderer({
  item,
  selected,
  editingEnabled,
  gizmoMode, // 新增
  snapEnabled,
  snapSize,
  angleSnapEnabled,
  angleSnapSize,
  onClick,
  onChange,
  onCommit,
}: SandboxItemRendererProps) {
```

### 2. 修复 `SelectionGizmo.tsx` 的拖拽事件

**文件：** `src/features/sandbox/SelectionGizmo.tsx`

**What：** 用 `onMouseDown` / `onMouseUp` 替换 `onDragStart` / `onDragEnd`。

**Why：** 当前使用的 `@react-three/drei` v10.7.7 的 `TransformControls` 类型不支持 `onDragStart`/`onDragEnd`，导致 TypeScript 构建失败。`onMouseDown`/`onMouseUp` 在 TransformControls 上可正确捕获拖拽起止。

**How：**

```tsx
<TransformControls
  object={mesh}
  mode={mode}
  enabled={enabled}
  translationSnap={snapEnabled && mode === 'translate' ? snapSize : undefined}
  rotationSnap={angleSnapEnabled && mode === 'rotate' ? angleSnapSize : undefined}
  data-gizmo={isDragging ? 'dragging' : 'idle'}
  onMouseDown={() => setIsDragging(true)}
  onMouseUp={() => {
    setIsDragging(false)
    onCommit(readTransform())
  }}
  onObjectChange={() => {
    onChange(readTransform())
  }}
/>
```

保留 `data-gizmo` 属性，因为 `useSandboxShortcuts` 依赖它判断 Gizmo 是否处于拖拽状态。

### 3. 优化 `useSandboxShortcuts.ts` 的 Delete 行为

**文件：** `src/features/sandbox/useSandboxShortcuts.ts` 与 `src/pages/Sandbox.tsx`

**What：** 仅在确实选中物体时才拦截 `Delete`/`Backspace` 并执行删除。

**Why：** 当前无选中项时也会 `preventDefault()`，可能误拦截浏览器后退/输入删除等行为。

**How：**

- 为 `useSandboxShortcuts` 增加 `hasSelection: boolean` 参数。
- 在 `Delete`/`Backspace` 处理中增加判断：

```ts
if ((event.key === 'Delete' || event.key === 'Backspace') && hasSelection) {
  event.preventDefault()
  onDelete()
  return
}
```

- 在 `Sandbox.tsx` 中传入 `hasSelection={!!selectedId}`。

### 4. 优化 `PropertiesPanel.tsx` 的重力提交

**文件：** `src/features/sandbox/PropertiesPanel.tsx`

**What：** 将重力三轴调整合并为单次历史提交。

**Why：** 当前每个轴的 Slider `onValueCommit` 都会调用 `setGravity` 并 `commitHistory()`，用户 undo 时需要三次才能恢复原来的重力向量，体验割裂。

**How：**

- 使用本地状态暂存三轴重力值。
- 在任一轴 `onValueCommit` 时，将完整 `[x, y, z]` 一次性提交给 store 并写入历史。
- 避免 Slider 拖拽过程中频繁写入历史，只在释放时提交。

### 5. 增强 `sceneStorage.ts` 的版本兼容性提示

**文件：** `src/features/sandbox/sceneStorage.ts`

**What：** 对导入高于当前版本号的场景给出明确错误提示。

**Why：** 当前 `migrateScene` 对 `version > CURRENT_VERSION` 会静默返回 `null`，用户无法区分"格式错误"和"版本过新"。

**How：**

```ts
if (versioned.version > CURRENT_VERSION) {
  throw new Error(`SCENE_VERSION_TOO_NEW:${versioned.version}:${CURRENT_VERSION}`)
}
```

- `importScene` 捕获该错误并向上返回包含 `versionTooNew` 标志的错误信息，便于 UI 显示对应 i18n 提示。

## Assumptions & Decisions

- 使用 `@react-three/drei` v10.7.7 的 `TransformControls` API，事件采用 `onMouseDown`/`onMouseUp` 而非 `onDragStart`/`onDragEnd`。
- `data-gizmo` 属性继续用于快捷键判断 Gizmo 拖拽状态，不可移除。
- 重力三轴合并提交可显著改善 undo 体验，且不影响实时物理模拟（store 中重力仍是统一向量）。
- 沙盒当前无选中项时，`Delete`/`Backspace` 应交还浏览器默认行为。

## Verification Steps

1. 类型检查：`npm run typecheck` 0 错误。
2. 代码规范：`npm run lint` 0 警告。
3. 生产构建：`npm run build` 成功。
4. 手动验证：
   - 在沙盒中选中物体，切换 Gizmo 模式（T/R/S），拖拽物体并释放，观察 transform 正确更新。
   - 执行 undo/redo，确认 transform 和历史栈行为正确。
   - 调整重力三轴，undo 一次即可恢复原重力。
   - 无选中时按 `Delete`/`Backspace`，确认不拦截浏览器行为。
   - 导入高于当前版本的 JSON 场景，确认看到明确的版本过新提示。
   - 保存/导出/导入普通场景，确认数据完整。
