# 沙盒模块彻底优化计划

## 背景与目标

当前 `src/pages/Sandbox.tsx` 及配套模块已具备器材库、属性面板、导入/导出和 localStorage 自动保存的雏形，但存在一个核心缺陷：**所有器材只是纯 Three.js 网格，未接入 Rapier 物理引擎**。`SandboxItem.isDynamic` 等属性在 store 中保存，却没有任何渲染或物理代码读取它，导致沙盒本质上只是一个静态 3D 摆放器。

本次优化目标是让沙盒成为真正的“物理沙盒”：器材受重力、碰撞、摩擦和弹性影响，支持场景内直接操控、快捷操作、稳定保存，并具备良好的扩展性。

## 优化范围

### 1. 器材物理化（核心）

重写 `src/features/sandbox/SandboxItemRenderer.tsx`，让每件器材：
- 根据 `isDynamic` 注册为 `dynamic` / `static` / `kinematic` 刚体；
- 按照 `RigidBodyFactory.ts` 的维度约定，把 `SandboxItem.size` 映射为对应碰撞体尺寸：
  - box → 半长 `[w/2, h/2, d/2]`
  - sphere → 半径 `[r, 0, 0]`
  - cylinder / capsule / cone → `[半径, 半高, 0]`
  - plane → `[长/2, 0, 宽/2]`（沿用现有 plane 处理）
  - spring → 用圆柱/胶囊近似
  - torus → 用立方体近似或仅作视觉静态体
- 把欧拉角 `rotation` 转换为四元数传给刚体；
- 使用 `useFrame` 或 `usePhysicsSync` 每帧同步刚体位姿到 mesh；
- 当 `position / rotation / scale / size / isDynamic / material` 变化时，销毁并重建刚体；
- 组件卸载时调用 `world.removeBody(label)` 清理。

### 2. 场景内交互（TransformControls）

新增 `src/features/sandbox/SelectionGizmo.tsx`：
- 使用 `@react-three/drei` 的 `TransformControls`；
- 仅当选中单个对象且场景处于“编辑/暂停”状态时显示；
- 拖拽时把变换实时写回 `sandboxStore.updateItem`；
- 避免与 `OrbitControls` 冲突：TransformControls 拖拽时禁用 OrbitControls。

### 3. 选中与高亮

- 为选中器材渲染一个半透明白色线框包围盒（`lineGeometry` 或 drei `Box`），提升选中可见性；
- `SandboxItemRenderer` 仅在非选中时使用器材自身颜色，选中时使用高亮色，避免颜色冲突。

### 4. 快捷操作与键盘

新增 `src/features/sandbox/useSandboxShortcuts.ts`：
- `Delete` / `Backspace`：删除当前选中器材；
- `Ctrl/Cmd + D`：复制选中器材；
- `Space`：运行 / 暂停物理；
- `Ctrl/Cmd + Z`：撤销上一次场景变更（基于快照的简单栈，最多 20 步）。

同时在 `Sandbox.tsx` 工具栏增加对应图标按钮：复制、删除、清空场景。

### 5. 属性面板扩展

扩展 `src/features/sandbox/PropertiesPanel.tsx`：
- 增加 `mass`、`friction`、`restitution` 滑块；
- 重力调节增加 X / Z 轴（目前只有 Y），并支持一键恢复默认；
- 增加“复制器材”和“删除器材”按钮；
- 滑块交互期间自动暂停物理，释放后恢复（可选）。

### 6. 自动保存优化

新增 `src/shared/hooks/useDebounce.ts`：
- `Sandbox.tsx` 中把 `saveScene` 调用改为防抖 800ms，避免频繁操作写 localStorage；
- 保存成功后显示一个 2 秒消失的“已自动保存”轻提示。

### 7. 导入校验强化

改写 `src/features/sandbox/sceneStorage.ts`：
- 手写类型守卫 `isSandboxScene(obj: unknown): obj is SandboxScene`，逐项校验 `id`、`shape`、`position` 等字段；
- 导入失败时给出明确错误（文件损坏、字段缺失、类型错误）；
- `loadStoredScene` 同样使用该校验，避免损坏数据污染 store。

### 8. 场景预设

新增 `src/features/sandbox/presets.ts`：
- 提供 3 个内置预设数据：`stackedBoxes`（堆叠方块）、`slopeBall`（斜坡滚球）、`springPendulum`（弹簧摆）；
- 在 `EquipmentPalette.tsx` 底部增加“预设场景”区域，点击即 `loadScene(preset)`。

### 9. 国际化与 UI 细节

更新 `src/app/providers/I18nProvider.tsx`：
- 补充沙盒相关键：`sandbox.empty`、`sandbox.run`、`sandbox.pause`、`sandbox.reset`、`sandbox.duplicate`、`sandbox.delete`、`sandbox.saved`、`sandbox.importError` 等；
- `Sandbox.tsx` 中所有中文硬编码替换为 `t(...)`。

响应式：
- 小屏下左侧器材库和右侧面板改为可折叠抽屉，避免在页面底部堆叠过多面板。

### 10. 测试

更新 `e2e/sandbox.spec.ts`：
- 验证添加器材后场景提示消失；
- 验证运行/暂停按钮切换；
- 验证删除器材（按钮和 Delete 键）；
- 验证导入/导出 JSON 的端到端流程。

最后执行完整验证：
```bash
npm run lint
npm run test
npm run build
```

## 涉及文件

### 修改
- `src/features/sandbox/SandboxItemRenderer.tsx`
- `src/features/sandbox/sandboxStore.ts`
- `src/features/sandbox/PropertiesPanel.tsx`
- `src/features/sandbox/EquipmentPalette.tsx`
- `src/features/sandbox/sceneStorage.ts`
- `src/pages/Sandbox.tsx`
- `src/app/providers/I18nProvider.tsx`
- `e2e/sandbox.spec.ts`

### 新增
- `src/features/sandbox/SelectionGizmo.tsx`
- `src/features/sandbox/useSandboxShortcuts.ts`
- `src/features/sandbox/presets.ts`
- `src/shared/hooks/useDebounce.ts`

## 验证方式
1. 进入 `/sandbox`，添加长方体并点击“运行”，观察物体下落并与实验台碰撞；
2. 选中物体，用 TransformControls 拖动，确认 store 与物理体同步；
3. 调节质量、摩擦、弹性，观察碰撞行为变化；
4. 点击“导出”后刷新页面，确认场景自动恢复；
5. 导入一个损坏 JSON，确认出现明确错误提示；
6. 运行 `npm run lint && npm run test && npm run build`，全部通过。
