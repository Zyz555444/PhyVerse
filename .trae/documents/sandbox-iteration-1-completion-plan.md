# 自由沙盒迭代一 · 收尾计划（任务 10-13）

## Context

迭代一计划（`sandbox-iteration-1-teacher-workflow.md`）的 13 项任务中，**任务 1-9 已完成**（store 扩展、renderer bug 修复、joints 修复、PropertiesPanel、SceneHierarchyPanel、HelpOverlay、useSandboxShortcuts、Controls focusTarget）。本计划覆盖剩余 **4 项任务**，使整个迭代达到可交付状态。

**当前阻塞问题**：`Sandbox.tsx` 仍是旧版本，未传递 `impulseMode`/`impulseStrength`/`showTrajectory` 给 `SandboxItemRenderer`（这些 props 已在 renderer 接口中定义为必填），导致 TypeScript 编译失败。任务 10 首要解决此问题。

***

## 任务 10：更新 Sandbox.tsx + Scene.tsx（核心集成）

### 10a. 扩展 Scene.tsx 传递 focusTarget/focusKey

**文件**：`src/features/canvas/Scene.tsx`

**改动**：

* `SceneProps` 新增 `focusTarget?: [number, number, number]` 和 `focusKey?: number`

* `<CameraController>` 传入这两个 props（保留现有 `key={cameraResetKey}` 不变，focus 与 reset 是独立机制）

```tsx
// SceneProps 新增：
focusTarget?: [number, number, number]
focusKey?: number

// CameraController 渲染改为：
<CameraController key={cameraResetKey} view={cameraView} focusTarget={focusTarget} focusKey={focusKey} />
```

### 10b. 大幅更新 Sandbox.tsx

**文件**：`src/pages/Sandbox.tsx`

#### 新增 imports

```tsx
import { SceneHierarchyPanel } from '@/features/sandbox/SceneHierarchyPanel'
import { HelpOverlay } from '@/features/sandbox/HelpOverlay'
import { getFriendlyName } from '@/features/sandbox/friendlyName'
import { SANDBOX_PRESETS } from '@/features/sandbox/presets'
import { usePhysics } from '@/features/physics/usePhysics'
import { useFrame } from '@react-three/fiber'
// 新图标：SkipForward, Crosshair, Zap, HelpCircle, Route, Gauge
```

#### 新增 ManualStepper 组件（内联在 Sandbox.tsx 中）

```tsx
function ManualStepper() {
  const { world } = usePhysics()
  const stepRequested = useSandboxStore((s) => s.stepRequested)
  const lastSeenRef = useRef(stepRequested)

  useFrame(() => {
    if (stepRequested !== lastSeenRef.current) {
      lastSeenRef.current = stepRequested
      if (world.isReady) {
        world.step()
      }
    }
  })
  return null
}
```

* 放在 `<PhysicsProvider>` 内部，与 `SandboxJoints`/`SandboxItemRenderer` 同级

* 仅在 `!isRunning` 时渲染（暂停态才需要手动步进）

#### 新增 FPS 计数 hook（内联）

```tsx
function useFps(): number {
  const [fps, setFps] = useState(0)
  useEffect(() => {
    let frames = 0
    let raf = 0
    let last = performance.now()
    const tick = () => {
      frames++
      const now = performance.now()
      if (now - last >= 1000) {
        setFps(frames)
        frames = 0
        last = now
      }
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [])
  return fps
}
```

* 在 `Sandbox` 组件中调用 `const fps = useFps()`

* 状态栏显示 `FPS: {fps}`

#### 新增状态

```tsx
const [cameraFocusKey, setCameraFocusKey] = useState(0)
const [showPresetMenu, setShowPresetMenu] = useState(false)
```

#### 新增 store 订阅

```tsx
const stepRequested = useSandboxStore((s) => s.stepRequested)  // 仅用于 ManualStepper，实际在 ManualStepper 内部订阅
const requestStep = useSandboxStore((s) => s.requestStep)
const impulseMode = editorConfig.impulseMode
const impulseStrength = editorConfig.impulseStrength
const showTrajectory = editorConfig.showTrajectory
```

#### focusTarget 计算

```tsx
const focusTarget = useMemo<[number, number, number] | undefined>(() => {
  if (!selectedId) return undefined
  const item = items.find((it) => it.id === selectedId)
  return item ? item.position : undefined
}, [items, selectedId])
```

#### 替换内联 friendlyName

删除 L210-226 的内联 `useSandboxStore` friendlyName 计算，改为：

```tsx
const friendlyName = useMemo(() => {
  if (!selectedId) return ''
  return getFriendlyName(items, selectedId)
}, [items, selectedId])
```

#### 更新 useSandboxShortcuts 调用

新增两个回调：

```tsx
onToggleHelp: () => setUI({ isHelpOpen: !ui.isHelpOpen }),
onStep: () => requestStep(),
```

#### 传递新 props 给 SandboxItemRenderer（修复编译错误）

```tsx
<SandboxItemRenderer
  ...现有 props...
  impulseMode={impulseMode}
  impulseStrength={impulseStrength}
  showTrajectory={showTrajectory}
  ...
/>
```

#### 传 focusTarget/focusKey 给 Scene

```tsx
<Scene
  cameraPosition={[10, 8, 10]}
  cameraView={editorConfig.cameraView}
  cameraResetKey={cameraResetKey}
  focusTarget={focusTarget}
  focusKey={cameraFocusKey}
  showGrid
>
```

#### 在 PhysicsProvider 内渲染 ManualStepper

```tsx
<PhysicsProvider config={{ gravity }} autoStep={isRunning} timeScale={editorConfig.timeScale}>
  <DeselectOnEmpty onSelect={() => selectItem(null)} />
  {!isRunning && <ManualStepper />}
  <LabTable ... />
  ...
</PhysicsProvider>
```

#### 工具栏新增按钮

**1. 单步按钮**（Undo2/Redo2 旁，Divider 之后）：

* 图标：`SkipForward`

* `onClick={requestStep}`

* `disabled={isRunning}`（仅暂停态可用）

* title: `t('sandbox.step')`

**2. 聚焦选中按钮**（相机重置旁）：

* 图标：`Crosshair`

* `onClick={() => setCameraFocusKey((k) => k + 1)}`

* `disabled={!selectedId}`

* title: `t('sandbox.focusSelected')`

**3. 施力模式 + 强度**（运行态替代 gizmo 模式按钮组）：
当 `isRunning` 时，显示施力模式 toggle + 强度滑块（替代 translate/rotate/scale 按钮组）：

```tsx
{isRunning && (
  <div className="flex items-center gap-2 rounded-lg border border-border bg-paper px-2 py-1">
    <ToolButton
      icon={Zap}
      onClick={() => setEditorConfig({ impulseMode: !impulseMode })}
      title={t('sandbox.impulseMode')}
      active={impulseMode}
    />
    {impulseMode && (
      <>
        <span className="text-xs text-text-secondary">{t('sandbox.impulseStrength')}</span>
        <input type="range" min={1} max={20} step={0.5}
          value={impulseStrength}
          onChange={(e) => setEditorConfig({ impulseStrength: Number(e.target.value) })}
          className="h-1.5 w-16 ..." />
        <span className="w-8 text-right text-xs font-mono">{impulseStrength.toFixed(1)}</span>
      </>
    )}
  </div>
)}
```

**4. 轨迹开关**（运行态，施力旁）：

* 图标：`Route`

* `onClick={() => setEditorConfig({ showTrajectory: !showTrajectory })}`

* `active={showTrajectory}`

* title: `t('sandbox.trajectory')`

* 仅 `isRunning` 时显示

**5. 帮助按钮**（右侧面板开关旁）：

* 图标：`HelpCircle`

* `onClick={() => setUI({ isHelpOpen: !ui.isHelpOpen })}`

* title: `t('sandbox.help')`

#### 状态栏增强

在现有状态栏追加 FPS：

```tsx
<span className="ml-auto font-mono">FPS: {fps}</span>
```

#### 空场景重写为三按钮

替换 L522-531 的空场景分支：

```tsx
{items.length === 0 && (
  <div className="absolute inset-0 flex flex-col items-center justify-center gap-4">
    <p className="text-sm text-text-tertiary">{t('sandbox.empty')}</p>
    <div className="flex gap-3">
      <button onClick={() => setUI({ isLeftPanelOpen: true })}
        className="rounded-lg border border-accent bg-accent-soft px-4 py-2 text-sm font-medium text-accent hover:bg-accent hover:text-white transition-colors">
        {t('sandbox.emptyBuild')}
      </button>
      <div className="relative">
        <button onClick={() => setShowPresetMenu((s) => !s)}
          className="rounded-lg border border-border bg-paper px-4 py-2 text-sm font-medium text-text-primary hover:border-border-strong transition-colors">
          {t('sandbox.emptyLoadPreset')}
        </button>
        {showPresetMenu && (
          <div className="absolute left-0 top-full z-20 mt-1 w-40 rounded-lg border border-border bg-paper py-1 shadow-lg">
            {SANDBOX_PRESETS.map(({ id, label, scene }) => (
              <button key={id} onClick={() => { loadScene(scene); setShowPresetMenu(false) }}
                className="block w-full px-3 py-1.5 text-left text-xs text-text-primary hover:bg-accent-soft hover:text-accent">
                {label}
              </button>
            ))}
          </div>
        )}
      </div>
      <button onClick={() => setUI({ isHelpOpen: true })}
        className="rounded-lg border border-border bg-paper px-4 py-2 text-sm font-medium text-text-primary hover:border-border-strong transition-colors">
        {t('sandbox.emptyTutorial')}
      </button>
    </div>
  </div>
)}
```

#### 右栏集成 SceneHierarchyPanel

```tsx
{rightOpen && !isFullscreen && (
  <div className="w-64 flex-shrink-0 flex flex-col gap-2">
    <SceneHierarchyPanel />
    <div className="flex-1 min-h-0">
      <PropertiesPanel />
    </div>
  </div>
)}
```

* PropertiesPanel 需要可滚动，已有 `overflow-y-auto`

* SceneHierarchyPanel 自带折叠，max-h 40%

#### 渲染 HelpOverlay

在组件根 `<div>` 末尾（所有内容之后）添加：

```tsx
<HelpOverlay />
```

***

## 任务 11：更新 I18nProvider.tsx

**文件**：`src/app/providers/I18nProvider.tsx`

在 `zh` 和 `en` 两个语言对象中新增以下 key（约 40 个）：

### 层级面板

| key                      | zh   | en              |
| ------------------------ | ---- | --------------- |
| `sandbox.hierarchy`      | 场景层级 | Scene Hierarchy |
| `sandbox.hierarchyEmpty` | 暂无物体 | No objects      |

### 属性面板补充（PropertiesPanel 已使用但 key 缺失）

| key                    | zh  | en             |
| ---------------------- | --- | -------------- |
| `sandbox.shapeLabel`   | 形状  | Shape          |
| `sandbox.show`         | 显示  | Show           |
| `sandbox.hide`         | 隐藏  | Hide           |
| `sandbox.lock`         | 锁定  | Lock           |
| `sandbox.unlock`       | 解锁  | Unlock         |
| `sandbox.snapToGround` | 落地  | Snap to Ground |
| `sandbox.locked`       | 已锁定 | Locked         |
| `sandbox.hidden`       | 已隐藏 | Hidden         |

### 工具栏新功能

| key                       | zh   | en               |
| ------------------------- | ---- | ---------------- |
| `sandbox.step`            | 单步   | Step             |
| `sandbox.focusSelected`   | 聚焦选中 | Focus Selected   |
| `sandbox.impulseMode`     | 施力模式 | Impulse Mode     |
| `sandbox.impulseStrength` | 冲量大小 | Impulse Strength |
| `sandbox.trajectory`      | 轨迹追踪 | Trajectory       |
| `sandbox.help`            | 帮助   | Help             |
| `sandbox.fps`             | FPS  | FPS              |

### 空场景引导

| key                       | zh   | en            |
| ------------------------- | ---- | ------------- |
| `sandbox.emptyBuild`      | 自由搭建 | Build Freely  |
| `sandbox.emptyLoadPreset` | 加载预设 | Load Preset   |
| `sandbox.emptyTutorial`   | 查看教程 | View Tutorial |

### 帮助浮层

| key                       | zh                   | en                                                     |
| ------------------------- | -------------------- | ------------------------------------------------------ |
| `sandbox.helpTitle`       | 快捷键与操作指南             | Shortcuts & Guide                                      |
| `sandbox.helpDescription` | 熟悉这些快捷键可以大幅提升搭建效率    | Master these shortcuts to build scenes faster          |
| `sandbox.helpSimulation`  | 模拟控制                 | Simulation                                             |
| `sandbox.helpTransform`   | 变换工具                 | Transform                                              |
| `sandbox.helpEdit`        | 编辑操作                 | Editing                                                |
| `sandbox.helpOther`       | 其他                   | Other                                                  |
| `sandbox.helpRunPause`    | 运行 / 暂停              | Run / Pause                                            |
| `sandbox.helpStep`        | 单步模拟                 | Single Step                                            |
| `sandbox.helpFullscreen`  | 全屏切换                 | Toggle Fullscreen                                      |
| `sandbox.helpTranslate`   | 平移模式                 | Translate Mode                                         |
| `sandbox.helpRotate`      | 旋转模式                 | Rotate Mode                                            |
| `sandbox.helpScale`       | 缩放模式                 | Scale Mode                                             |
| `sandbox.helpSnap`        | 网格吸附开关               | Toggle Grid Snap                                       |
| `sandbox.helpUndo`        | 撤销                   | Undo                                                   |
| `sandbox.helpRedo`        | 重做                   | Redo                                                   |
| `sandbox.helpDuplicate`   | 复制选中                 | Duplicate                                              |
| `sandbox.helpCopyPaste`   | 复制 / 粘贴              | Copy / Paste                                           |
| `sandbox.helpDelete`      | 删除选中                 | Delete                                                 |
| `sandbox.helpDeselect`    | 取消选择                 | Deselect                                               |
| `sandbox.helpToggleHelp`  | 打开此帮助                | Toggle this help                                       |
| `sandbox.helpTipsTitle`   | 使用提示                 | Tips                                                   |
| `sandbox.helpTip1`        | 暂停模式下可直接拖动物体调整位置     | Drag objects directly in pause mode                    |
| `sandbox.helpTip2`        | 多选物体后可创建弹簧、绳索或固定连接   | Select 2+ objects to create joints                     |
| `sandbox.helpTip3`        | 运行模式下开启施力模式，点击物体施加冲量 | Enable Impulse Mode in run mode to kick objects        |
| `sandbox.helpTip4`        | 层级面板中双击物体名可重命名       | Double-click an object name in the hierarchy to rename |

***

## 任务 12：单元测试

**目录**：`src/features/sandbox/__tests__/`（新建）

参照 `src/shared/ui/__tests__/Button.test.tsx` 的 vitest + @testing-library 模式，使用 `renderWithProviders` from `@/test/utils`。

### 12a. `getFriendlyName.test.ts`

```typescript
import { describe, it, expect } from 'vitest'
import { getFriendlyName } from '../friendlyName'
import type { SandboxItem } from '../sandboxStore'

// 测试用例：
// 1. 空 items 数组 → 返回 id slice
// 2. 未知 id → 返回 id slice
// 3. 有 displayName → 返回 displayName
// 4. 无 displayName → 返回 "形状名 序号"
// 5. 多个同形状物体 → 序号正确递增
// 6. displayName 为空字符串 → 回退到自动名
```

### 12b. `sandboxStore.test.ts`

```typescript
import { describe, it, expect, beforeEach } from 'vitest'
import { useSandboxStore } from '../sandboxStore'

// 测试用例：
// beforeEach: 重置 store 到初始状态
// 1. snapToGround: 物体 y 被设为半高
// 2. toggleLock: locked 字段切换
// 3. toggleVisibility: hidden 字段切换
// 4. setDisplayName: 设置/清除 displayName
// 5. updateItemAndCommit: push 历史
// 6. undo/redo: 能恢复 updateItemAndCommit 前的状态
// 7. addJoint + removeJoint: joints 数组正确增减
// 8. requestStep: stepRequested 递增
```

### 12c. `SceneHierarchyPanel.test.tsx`

```typescript
import { describe, it, expect, vi } from 'vitest'
import { renderWithProviders, screen } from '@/test/utils'
import { SceneHierarchyPanel } from '../SceneHierarchyPanel'
import { useSandboxStore } from '../sandboxStore'

// 测试用例：
// 1. 渲染空场景 → 显示 "暂无物体"
// 2. 渲染有物体 → 显示友好名
// 3. 点击行 → 调用 selectItem
// 4. 点击眼睛图标 → 调用 toggleVisibility
// 5. 点击锁图标 → 调用 toggleLock
// 6. 点击删除 → 调用 removeItem
```

注意：测试中直接操作 `useSandboxStore.setState()` 来设置初始状态，无需 mock。

***

## 任务 13：验证 build / lint / test 全通过

依次执行（在 `d:\1\phyverse` 目录下）：

1. **TypeScript 编译 + 构建**：`npm run build`

   * 预期：无类型错误（特别是 SandboxItemRenderer 的必填 props 已传递）
2. **Lint**：`npm run lint --max-warnings=0`

   * 预期：无 lint 错误
3. **单元测试**：`npm run test`

   * 预期：现有测试 + 新增 3 个测试文件全部通过
4. **E2E（如有）**：`npm run e2e`

   * 预期：现有 4 项 sandbox spec 通过

***

## 关键文件清单

| 文件                                                            | 改动类型                             | 任务  |
| ------------------------------------------------------------- | -------------------------------- | --- |
| `src/features/canvas/Scene.tsx`                               | 扩展 props 传递 focusTarget/focusKey | 10a |
| `src/pages/Sandbox.tsx`                                       | 大幅更新：新组件集成、工具栏、空场景、状态栏           | 10b |
| `src/app/providers/I18nProvider.tsx`                          | 新增 \~40 个 i18n key               | 11  |
| `src/features/sandbox/__tests__/getFriendlyName.test.ts`      | 新建                               | 12a |
| `src/features/sandbox/__tests__/sandboxStore.test.ts`         | 新建                               | 12b |
| `src/features/sandbox/__tests__/SceneHierarchyPanel.test.tsx` | 新建                               | 12c |

***

## 验证计划

1. **核心 bug 验证**：暂停态拖动位置/旋转/缩放滑块 → 物体跟随移动（任务 2 已修复，任务 10 传递 props 后可验证）
2. **新功能验证**：

   * 单步按钮：暂停态点击 → 物理前进一帧

   * 聚焦选中：选中物体后点击 → 相机对准该物体

   * 施力模式：运行态开启 → 点击物体 → 物体被推动

   * 轨迹追踪：运行态开启 → 选中物体移动时留下轨迹线

   * 帮助浮层：点击 ? 或按 ? 键 → 弹出快捷键面板

   * 空场景三按钮：分别触发面板展开 / 预设菜单 / 帮助

   * 层级面板：右栏顶部显示，点击选中，双击重命名
3. **编译验证**：`npm run build` 通过（当前因缺 props 会失败，任务 10 修复后通过）

***

## 执行顺序

1. 任务 10a（Scene.tsx，1 分钟）
2. 任务 10b（Sandbox.tsx，核心工作）
3. 任务 11（I18nProvider.tsx）
4. 任务 12a-12c（测试文件）
5. 任务 13（构建验证 + 修复）

