# 自由沙盒 · 对标市面成熟产品详尽优化计划方案

## 一、摘要

本文档基于对 **PhET Interactive Simulations**（科罗拉多大学）、**Algodoo**（Algoryx）、**NOBOOK 虚拟实验室**、**Physics Lab AR**（TurtleSim）、**phyphox**（亚琛工大）、**EGK PhysicsLab AR** 六大主流物理仿真实验产品的深度调研，结合当前 Phyverse 自由沙盒的实际代码实现状态（Three.js + Rapier3D 3D 物理沙盒），从**教学闭环、实验深度、内容生态、交互体验、数据分析、协作共享、技术架构、AI 赋能、移动端体验、可访问性**十大维度，制定系统性的优化路线图。

> **当前版本迭代状态**：截至 2026-07-17，已完成迭代一（稳定性 + 教师核心工作流）的全部 13 项任务，包括录制回放、AI Agent、云端同步、力可视化、能量条、力场渲染、测量工具、配方系统、任务系统、遥测数据面板、场景层级面板、盒选多选、关节系统（7 种）、轨迹追踪、施力模式、移动端底部 Sheet 等。

---

## 二、市场对标总览（更新版）

| 维度 | PhET | Algodoo | NOBOOK | Physics Lab AR | phyphox | **Phyverse 现状** |
|------|------|---------|--------|---------------|---------|-------------------|
| 物理引擎 | 2D 简化 | 2D 真实物理 | 3D 自研引擎 | 3D 电路 | 真机传感器 | **3D Rapier（刚体+关节）** |
| 自由搭建 | 无 | 丰富(自由绘制) | 有限(DIY) | 电路搭建 | 无 | **器材库 13 种形状 + 自由摆放** |
| 课程对齐 | 170+ 实验 | 无 | 2000+ 实验 | 100+ 电路 | 预置实验 | **50+ 导向式实验 + 配方系统** |
| 数据采集 | 基础图表 | 图表+可视化 | 实验数据 | 实时数据 | 传感器数据 | **遥测采集 + DataPanel + CSV 导出** |
| 教学任务 | PhET Studio | 无 | 考试+评分 | 无 | 无 | **TaskPanel + 步骤引导 + 数据记录** |
| AI 能力 | 无 | 无 | AI纠错+评分 | 无 | 无 | **AI Agent Panel（工具调用+流式对话）** |
| 社区共享 | 预设分享 | Algobox 5万+ | 教案库 | 无 | 实验分享 | **云端同步（保存/加载/公开/私有）** |
| 录制回放 | 无 | 视频/GIF | 微课录制 | 无 | 无 | **录制回放 + WebM 导出** |
| AR 支持 | 无 | 无 | 无 | 有 | 无 | **无** |
| 多语言 | 130种 | 有限 | 中文 | 英文 | 多语言 | **中/英（i18n 框架完备）** |
| 离线 | 部分 | 客户端 | 支持 | 客户端 | 支持 | **Web PWA + localStorage 自动保存** |
| 可访问性 | 屏幕阅读器 | 无 | 无 | 无 | 无障碍 | **无** |
| 力/能量可视化 | 无 | 力/速度/动量 | 无 | 无 | 无 | **力矢量 + 能量条 + 矢量叠加** |
| 关节系统 | 无 | 弹簧/铰链 | 有限 | 无 | 无 | **7种关节（spring/rope/fixed/revolute/prismatic/motor/gear）** |
| 移动端 | HTML5 响应式 | 桌面客户端 | Android/iPad | iOS/Android | Android/iOS | **PWA + 底部 Sheet（触控手势缺失）** |
| 测量工具 | 内置 | 无 | 实验器材读数 | 虚拟仪表 | 传感器 | **直尺/秒表/量角器/打点计时器 + 实时遥测** |

### 核心差距识别（更新版）

| # | 差距项 | 严重度 | 对标产品 | 当前状态 |
|---|--------|--------|----------|----------|
| 1 | **社区场景画廊** | 极高 | Algodoo Algobox 5 万+ | 仅有云端同步（缺浏览/搜索/点赞/Fork） |
| 2 | **教师工作台** | 极高 | NOBOOK 班级管理+考试+成绩 | 完全缺失 |
| 3 | **跨学科内容** | 高 | PhET 物理+化学+数学+生物+地球科学 | 仅有物理 |
| 4 | **移动端 3D 触控手势** | 高 | NOBOOK 原生客户端 | 仅有底部 Sheet，无 3D 手势 |
| 5 | **AR 增强现实** | 中 | Physics Lab AR | 无 |
| 6 | **可访问性(A11y)** | 中 | PhET 屏幕阅读器+声波化 | 零支持 |
| 7 | **AI 智能评分** | 高 | NOBOOK AI 纠错+自动评分 | 仅有对话 Agent，无评分引擎 |
| 8 | **GIF/视频导出增强** | 中 | Algodoo GIF 导出 | 仅有 WebM 导出 |
| 9 | **流体/电磁场/光学模拟** | 中 | Algodoo/Physics Lab AR | 仅有力场渲染器 |
| 10 | **课堂投屏/演示模式** | 中 | NOBOOK 微课+投屏 | 无 |
| 11 | **教材版本对齐** | 高 | NOBOOK 2000+ 教材同步 | 仅有标签分类 |
| 12 | **考试/评估模式** | 高 | NOBOOK 考试+评分 | 无 |
| 13 | **数据回归分析** | 中 | phyphox 传感器数据分析 | 仅有基础图表 |
| 14 | **实验模板/教案库** | 高 | NOBOOK 教案库 | 仅有 3 个预设 + 配方系统 |
| 15 | **多语言覆盖** | 低 | PhET 130 种语言 | 仅中/英 |

---

## 三、分阶段优化路线图

### 第一阶段：核心能力补齐（1-3 个月）—— 追平关键差距

#### 1.1 社区场景画廊（Community Scene Gallery）⭐⭐⭐⭐⭐

**对标产品**：Algodoo Algobox（5 万+场景）、PhET（预设分享链接）

**现状**：已有 `CloudSyncPanel` 支持场景云端保存/加载/公开/私有，但缺少**浏览发现**、**搜索筛选**、**社交互动**等社区功能。用户无法探索他人公开的场景。

**实现方案**：

```
修改/新增模块：
├── src/features/cloud/
│   ├── CloudSyncPanel.tsx        # 增强：增加"探索社区"入口
│   ├── SceneGallery.tsx           # 新增：社区场景画廊（浏览/搜索/排序）
│   ├── SceneCard.tsx              # 新增：场景卡片（缩略图/标题/作者/标签/点赞数）
│   ├── SceneDetail.tsx            # 新增：场景详情页（大图预览/评论/派生链）
│   ├── UserProfile.tsx            # 新增：用户主页（发布的场景列表）
│   ├── cloudApi.ts                # 增强：新增 listPublicScenes/searchScenes/likeScene/forkScene
│   └── cloudTypes.ts              # 新增：GalleryItem, Comment, Like 等类型
```

**详细功能**：

**a) 场景画廊**：
- 浏览所有公开分享的场景，支持分页/无限滚动
- 按标签筛选：力学/电磁学/光学/热学/近代物理/教学/娱乐/机械
- 按热度（点赞数）/时间（最新）/评分排序
- 场景预览缩略图（自动生成 3D 截图，使用 `OffscreenCanvas` + `gl` 渲染）
- 关键词搜索（标题/描述/标签）
- 一键加载到本地沙盒（复用现有 `loadScene`）

**b) 社交互动**：
- 点赞/取消点赞场景
- 评论与讨论（文本评论，支持 Markdown）
- Fork 场景（基于此场景修改并发布新版本，保留 `forkedFrom` 引用链）
- 场景派生链可视化（显示 Fork 关系图）
- 用户主页（展示该用户发布的所有公开场景）

**c) 场景质量保障**：
- 官方认证标签（`verified` flag）
- 举报不适内容
- 场景预览自动生成（首次保存时在后端异步生成缩略图）
- 场景下载计数

**d) 后端 API 扩展**（Supabase 或自建）：

```sql
-- 场景表（扩展现有 scenes 表）
ALTER TABLE scenes ADD COLUMN tags text[];
ALTER TABLE scenes ADD COLUMN likes_count integer DEFAULT 0;
ALTER TABLE scenes ADD COLUMN downloads_count integer DEFAULT 0;
ALTER TABLE scenes ADD COLUMN forks_count integer DEFAULT 0;
ALTER TABLE scenes ADD COLUMN forked_from_id uuid REFERENCES scenes(id);
ALTER TABLE scenes ADD COLUMN thumbnail_url text;
ALTER TABLE scenes ADD COLUMN verified boolean DEFAULT false;
ALTER TABLE scenes ADD COLUMN category text;

-- 新增表
CREATE TABLE scene_likes (
  scene_id uuid REFERENCES scenes(id) ON DELETE CASCADE,
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  PRIMARY KEY (scene_id, user_id)
);

CREATE TABLE scene_comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  scene_id uuid REFERENCES scenes(id) ON DELETE CASCADE,
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  content text NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
```

**关键文件**：
- 新建 `src/features/cloud/SceneGallery.tsx`
- 新建 `src/features/cloud/SceneCard.tsx`
- 新建 `src/features/cloud/SceneDetail.tsx`
- 新建 `src/features/cloud/UserProfile.tsx`
- 修改 `src/features/cloud/cloudApi.ts`
- 修改 `src/app/router.tsx`（新增 `/gallery` 和 `/user/:id` 路由）

---

#### 1.2 AI 智能评分引擎（Auto Scoring & Error Detection）⭐⭐⭐⭐⭐

**对标产品**：NOBOOK（AI 纠错+自动评分+智能评语）

**现状**：已有 `AiAgentPanel` 支持流式对话和工具调用（`agentTools.ts`），但缺少**自动评分**、**实验纠错**、**操作评估**等教学评估能力。当前 AI Agent 可以回答问题和执行工具，但不会主动分析实验质量。

**实现方案**：

```
修改/新增模块：
├── src/features/ai/
│   ├── AiAgentPanel.tsx          # 增强：新增"评分"快捷操作按钮
│   ├── AutoScorer.ts             # 新增：自动评分引擎
│   ├── PhysicsValidator.ts       # 新增：物理规律验证器
│   ├── ErrorDetector.ts          # 新增：实验操作纠错检测器
│   ├── ScoreReport.tsx            # 新增：评分报告面板
│   ├── agentTools.ts             # 增强：新增 score_experiment 工具
│   └── aiConfigTypes.ts          # 增强：新增评分规则类型
```

**详细功能**：

**a) 自动评分引擎（AutoScorer）**：

```typescript
// src/features/ai/AutoScorer.ts
interface ScoreRubric {
  id: string
  taskId: string
  criteria: ScoreCriterion[]
  totalScore: number
}

interface ScoreCriterion {
  name: string           // 评分项名称（如"器材选择正确性"）
  weight: number         // 权重（0-1）
  maxScore: number       // 满分
  evaluator: 'llm' | 'rule' | 'comparison'  // 评估方式
  // LLM 评估：发送给 AI 分析
  llmPrompt?: string
  // 规则评估：基于物理规律验证
  ruleChecks?: RuleCheck[]
  // 对比评估：与理论值比较
  comparisonTarget?: ComparisonTarget
}

interface RuleCheck {
  type: 'short_circuit' | 'spring_overextension' | 'mass_out_of_range' | 'collision_penetration'
  params: Record<string, number>
}
```

**评分流程**：
1. 用户在任务完成后点击"AI 评分"
2. 系统收集实验数据：操作步骤记录、遥测数据、当前场景状态
3. 规则引擎先执行本地检查（短路检测、弹簧超出弹性限度等）
4. 将规则检查结果 + 遥测数据 + 任务描述打包发送给 LLM
5. LLM 返回各维度评分 + 详细评语 + 改进建议
6. 渲染评分报告面板（雷达图 + 逐项评语）

**b) 物理规律验证器（PhysicsValidator）**：

```typescript
// src/features/ai/PhysicsValidator.ts
interface ValidationRule {
  id: string
  name: string
  description: string
  // 验证函数：接收遥测样本数组，返回是否通过及偏差
  validate: (samples: TelemetrySample[], expected: ExpectedResult) => ValidationResult
}

interface ValidationResult {
  passed: boolean
  deviation: number        // 偏差百分比
  actual: number
  expected: number
  message: string
}
```

**内置验证规则**：
- 自由落体：v² = 2gh，验证 v-t 线性关系
- 牛顿第二定律：F = ma，验证 a-F 线性关系
- 动量守恒：m₁v₁ + m₂v₂ = m₁v₁' + m₂v₂'（碰撞前后）
- 机械能守恒：KE + PE = 常数（无摩擦情况）
- 胡克定律：F = -kx，验证 F-x 线性关系
- 欧姆定律：V = IR，验证 V-I 线性关系
- 单摆周期：T = 2π√(L/g)，验证 T 与 √L 成正比

**c) 实验纠错检测器（ErrorDetector）**：

实时监测（在 `useFrame` 中低频率检查，约 2Hz）：
- 电路短路警告（两个带电体直接接触）
- 弹簧超出弹性限度（拉伸量 > 原长 50%）
- 物体质量设置不合理（如 0.001kg 的球体体积过大）
- 碰撞体穿透检测（两个 collider 重叠深度 > 阈值）
- 重力方向不一致（非标准重力向量时提示）
- 非物理参数设置（如摩擦系数 > 1、弹性系数 > 1）

弹出轻提示（Toast），引导学生自主修正。

**d) 评分报告面板（ScoreReport）**：

```
┌─────────────────────────────────┐
│  📊 实验评分报告                 │
│  ─────────────────────────────── │
│  总分：85/100                    │
│                                  │
│  [雷达图：器材选择/操作规范/     │
│   数据采集/结果分析/实验报告]     │
│                                  │
│  ✅ 器材选择 (18/20)             │
│    · 器材选择合理，满足实验需求   │
│    · 建议：增加一个挡板防止小球   │
│      滚出实验台                  │
│                                  │
│  ⚠️ 数据采集 (15/20)             │
│    · 采集点数量不足，建议至少     │
│      采集 10 个数据点            │
│    · 第 5 个数据点疑似异常值      │
│                                  │
│  ❌ 结果分析 (12/20)             │
│    · 未计算实验值与理论值偏差     │
│    · 建议：绘制 v-t 图并做线性   │
│      回归                       │
│                                  │
│  💡 改进建议                     │
│    1. 增加重复实验次数取平均值    │
│    2. 使用更精确的测量工具        │
│    3. 记录实验环境条件            │
└─────────────────────────────────┘
```

**关键文件**：
- 新建 `src/features/ai/AutoScorer.ts`
- 新建 `src/features/ai/PhysicsValidator.ts`
- 新建 `src/features/ai/ErrorDetector.ts`
- 新建 `src/features/ai/ScoreReport.tsx`
- 修改 `src/features/ai/agentTools.ts`
- 修改 `src/features/ai/AiAgentPanel.tsx`
- 修改 `src/pages/Sandbox.tsx`（集成 ErrorDetector Toast）

---

#### 1.3 教师工作台（Teacher Dashboard）⭐⭐⭐⭐⭐

**对标产品**：NOBOOK（班级管理+考试发布+成绩统计+学情分析）、PhET Studio（预设管理+学生链接）

**现状**：完全缺失。无教师端管理功能，无班级/作业/成绩概念。

**实现方案**：

```
新增模块：
├── src/features/teacher/
│   ├── Dashboard.tsx             # 教师仪表盘（概览）
│   ├── ClassManager.tsx          # 班级管理（创建/编辑/删除班级）
│   ├── ClassDetail.tsx           # 班级详情（学生列表/邀请码）
│   ├── AssignmentCreator.tsx     # 作业创建器（基于实验配方/任务）
│   ├── AssignmentList.tsx        # 作业列表
│   ├── GradingView.tsx           # 批改视图（学生提交详情 + AI 评分）
│   ├── GradeBook.tsx             # 成绩册（班级成绩汇总）
│   ├── StudentProgress.tsx       # 学生进度追踪（完成率/知识点掌握）
│   ├── PresentationMode.tsx      # 课堂演示模式
│   └── teacherService.ts         # 后端 API 服务层
```

**详细功能**：

**a) 班级管理**：
- 创建/编辑/删除班级
- 生成班级邀请码（6 位字母数字，可重置）
- 学生通过邀请码加入班级
- 学生列表管理（姓名/学号/加入时间/最近活跃）
- 批量导入学生（CSV 上传）
- 分组管理（为不同组布置不同作业）

**b) 作业系统**：
- 基于实验配方（Recipe）或教学任务（Task）创建作业
- 设置截止日期、提交要求、评分标准
- 发布到班级（可定时发布）
- 预览学生视角（以学生身份查看作业）
- 查看学生完成情况（未开始/进行中/已提交/已批改）
- 自动评分（基于 AI 评分引擎）+ 教师手动调整
- 批量批改（快速浏览所有学生提交）

**c) 学情分析**：
- 每位学生的实验完成率（饼图）
- 班级整体掌握情况热力图（知识点 × 学生）
- 常见错误分析（哪些步骤/知识点学生最容易出错）
- 学习时长统计（总时长/实验次数/平均时长）
- 进步趋势图（历次作业成绩变化）
- 薄弱知识点预警（自动标记正确率 < 60% 的知识点）

**d) 课堂演示模式**：
- 一键进入全屏演示模式
- 激光笔/标注工具（在 3D 场景中画线/圈/箭头）
- 板书功能（浮动文字/公式面板）
- 实时投屏（学生端同步观看，通过 WebSocket 同步相机状态）
- 学生举手提问（学生端发送提问，教师端显示通知）
- 快速加载/切换预设场景（演示用场景库）

**e) 后端数据结构**：

```sql
-- 班级表
CREATE TABLE classes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  teacher_id uuid REFERENCES users(id) NOT NULL,
  name text NOT NULL,
  subject text,
  grade text,
  invite_code text UNIQUE NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 班级成员
CREATE TABLE class_members (
  class_id uuid REFERENCES classes(id) ON DELETE CASCADE,
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  role text DEFAULT 'student',  -- 'student' | 'assistant'
  display_name text,
  joined_at timestamptz DEFAULT now(),
  PRIMARY KEY (class_id, user_id)
);

-- 作业
CREATE TABLE assignments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  class_id uuid REFERENCES classes(id) ON DELETE CASCADE,
  teacher_id uuid REFERENCES users(id) NOT NULL,
  title text NOT NULL,
  description text,
  recipe_id text,               -- 对应的实验配方 ID
  task_id text,                 -- 对应的教学任务 ID
  rubric jsonb,                 -- 评分标准
  due_date timestamptz,
  published boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 作业提交
CREATE TABLE submissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  assignment_id uuid REFERENCES assignments(id) ON DELETE CASCADE,
  student_id uuid REFERENCES users(id) ON DELETE CASCADE,
  scene_data jsonb,             -- 学生提交的场景 JSON
  telemetry_data jsonb,         -- 遥测数据
  task_records jsonb,           -- 任务记录
  ai_score jsonb,               -- AI 评分结果
  teacher_score numeric,
  teacher_comment text,
  status text DEFAULT 'draft',  -- 'draft' | 'submitted' | 'graded' | 'returned'
  submitted_at timestamptz,
  graded_at timestamptz,
  created_at timestamptz DEFAULT now()
);

-- 知识点掌握记录
CREATE TABLE knowledge_mastery (
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  knowledge_point text NOT NULL,
  mastery_level numeric DEFAULT 0,  -- 0-100
  attempts integer DEFAULT 0,
  last_practiced_at timestamptz,
  PRIMARY KEY (user_id, knowledge_point)
);
```

**关键文件**：
- 新建 `src/features/teacher/` 完整目录
- 修改 `src/app/router.tsx`（新增 `/teacher/*` 路由）
- 新建后端 API：`api/teacher/` 和 `api/classes/` 和 `api/assignments/`

---

#### 1.4 移动端 3D 触控手势（Mobile Touch Gestures）⭐⭐⭐⭐

**对标产品**：NOBOOK（Android/iPad 原生客户端）、PhET（HTML5 跨平台响应式）

**现状**：已有 `MobileBottomSheet` 处理器材面板/属性面板的移动端适配，`useIsMobile` hook 检测移动端。但 **3D 画布上的触控手势完全缺失**——无法在移动端旋转/缩放/平移 3D 场景，无法触控选中/拖拽物体。

**实现方案**：

```
修改/新增模块：
├── src/features/canvas/Controls.tsx    # 增强：移动端触控手势
├── src/features/canvas/Scene.tsx       # 增强：传入手势配置
├── src/pages/Sandbox.tsx               # 增强：移动端工具栏布局优化
├── src/styles/globals.css              # 增强：移动端断点样式优化
└── src/features/sandbox/               # 新增：移动端手势 hook
    └── useMobileGestures.ts
```

**详细功能**：

**a) 3D 画布触控手势**：

```typescript
// src/features/sandbox/useMobileGestures.ts
interface MobileGestureConfig {
  // 单指滑动：旋转相机
  rotateSpeed: number        // 默认 0.005
  // 双指捏合：缩放
  zoomSpeed: number          // 默认 0.01
  zoomMin: number            // 默认 0.5
  zoomMax: number            // 默认 10
  // 双指滑动：平移
  panSpeed: number           // 默认 0.01
  // 长按物体：选中
  longPressDuration: number  // 默认 500ms
  // 双击物体：聚焦
  doubleTapDelay: number     // 默认 300ms
  // 单指点击：放置/选择
  tapThreshold: number       // 默认 10px（移动距离阈值）
}
```

**手势映射表**：

| 手势 | 操作 | 备注 |
|------|------|------|
| 单指滑动 | 旋转相机 | 围绕目标点 Orbit |
| 双指捏合 | 缩放 | Pinch zoom |
| 双指滑动 | 平移相机 | 水平/垂直移动 |
| 单指点击 | 选中物体 | 射线检测（raycasting） |
| 长按物体 | 显示上下文菜单 | 复制/删除/属性/落地 |
| 双击物体 | 聚焦该物体 | 相机平滑移动到物体位置 |
| 三指点击 | 运行/暂停 | 快速切换 |
| 双指旋转 | 旋转选中物体 | 仅在编辑态 |

**b) 移动端 UI 优化**：
- 工具栏自适应：小屏（< 640px）只显示核心按钮（运行/暂停/撤销/重做/器材库/属性）
- 其他按钮收入"更多"菜单（三点菜单）
- 大屏（>= 1024px）保持现有布局
- 中等屏幕（640-1024px）折叠部分次要按钮
- 横屏自动调整：横屏隐藏底部工具栏，改为侧边栏
- 安全区域适配：使用 `env(safe-area-inset-*)` 适配刘海屏

**c) 移动端专有功能**：
- 陀螺仪控制相机视角（手机倾斜旋转场景，可选开关）
- 摇一摇撤销（`DeviceMotionEvent`，可选）
- 触觉反馈（`navigator.vibrate`，选中物体时短振动）
- 移动端专用预设（移动端优化的场景，器材更少、更简洁）

**关键文件**：
- 新建 `src/features/sandbox/useMobileGestures.ts`
- 修改 `src/features/canvas/Controls.tsx`
- 修改 `src/pages/Sandbox.tsx`
- 修改 `src/styles/globals.css`

---

#### 1.5 教材同步与课程对齐（Curriculum Alignment）⭐⭐⭐⭐

**对标产品**：NOBOOK（2000+ 教材同步实验）、PhET（170+ 课程对齐实验）

**现状**：已有 50+ 导向式实验和配方系统，但**缺少与教材版本的系统性对应**。实验标签仅为基础分类（力学/电磁学等），无教材版本/章节/知识点映射。

**实现方案**：

```
修改/新增模块：
├── src/features/recipe/
│   ├── recipeTypes.ts          # 增强：增加 curriculum 字段
│   ├── recipeLibrary.ts        # 增强：按教材版本筛选
│   └── RecipePanel.tsx          # 增强：教材版本选择器
├── src/features/experiments/
│   └── registry.ts             # 增强：增加 curriculum 元数据
└── src/shared/constants/
    └── curriculum.ts            # 新增：教材版本与章节映射表
```

**详细功能**：

**a) 教材版本映射**：

```typescript
// src/shared/constants/curriculum.ts
interface CurriculumMapping {
  textbook: string              // 教材名称（如"人教版高中物理必修一"）
  grade: 'junior' | 'senior' | 'college'
  chapters: CurriculumChapter[]
}

interface CurriculumChapter {
  name: string                  // 章节名称（如"第一章 运动的描述"）
  sections: CurriculumSection[]
}

interface CurriculumSection {
  name: string                  // 节名称（如"1.4 实验：用打点计时器测速度"）
  knowledgePoints: string[]     // 知识点（如"瞬时速度", "平均速度", "v-t 图像"）
  experimentIds: string[]       // 关联的实验 ID
  recipeIds: string[]           // 关联的配方 ID
}
```

**支持的教材版本（初期）**：
- 人教版高中物理（必修一/二/三、选修一/二/三）
- 人教版初中物理（八年级上/下、九年级全）
- 鲁科版（山东）/ 粤教版（广东）/ 沪科版（上海）
- 苏科版（江苏）/ 教科版（四川）/ 北师大版

**b) 实验标签增强**：

每个实验/配方增加 `curriculum` 字段：
```typescript
interface ExperimentMeta {
  curriculum?: {
    textbook: string           // 教材版本
    grade: string              // 年级
    chapter: string            // 章节
    section: string            // 节
    knowledgePoints: string[]  // 对应知识点
    isRequired: boolean        // 是否为必做实验
  }
}
```

**c) 教材同步浏览**：
- 在配方面板中增加"教材版本"下拉选择器
- 选择教材版本后，配方按章节分组显示
- 高亮显示当前章节对应的实验
- 显示知识点覆盖进度（该章节已完成实验数/总实验数）

**关键文件**：
- 新建 `src/shared/constants/curriculum.ts`
- 修改 `src/features/recipe/recipeTypes.ts`
- 修改 `src/features/recipe/recipeLibrary.ts`
- 修改 `src/features/experiments/registry.ts`

---

### 第二阶段：体验升级与差异化（4-8 个月）—— 建立竞争壁垒

#### 2.1 跨学科扩展（Cross-discipline Content）⭐⭐⭐⭐⭐

**对标产品**：PhET（物理+化学+数学+生物+地球科学）、NOBOOK（物理+化学+生物）

**现状**：仅有物理（力学、电磁学、热学、光学、近代物理），无化学、生物、数学。

**实现方案**：

```
新增模块：
├── src/features/experiments/
│   ├── chemistry/                 # 化学实验模块
│   │   ├── AcidBaseTitration.ts   # 酸碱滴定
│   │   ├── ChemicalReaction.ts    # 化学反应（质量守恒）
│   │   ├── MolecularStructure.ts  # 分子结构 3D 可视化
│   │   ├── Electrolysis.ts        # 电解实验
│   │   ├── GasLaw.ts              # 气体定律（PV=nRT）
│   │   ├── PeriodicTable.ts       # 元素周期表交互
│   │   ├── ChemicalBonding.ts     # 化学键可视化
│   │   └── index.ts
│   ├── biology/                   # 生物实验模块
│   │   ├── CellDivision.ts        # 细胞分裂（有丝/减数分裂）
│   │   ├── DNAStructure.ts        # DNA 双螺旋 3D 模型
│   │   ├── NaturalSelection.ts    # 自然选择模拟
│   │   ├── FoodWeb.ts             # 食物链/食物网
│   │   ├── Microscope.ts          # 显微镜模拟
│   │   ├── CellStructure.ts       # 细胞结构 3D 模型
│   │   └── index.ts
│   ├── math/                      # 数学可视化模块
│   │   ├── FunctionGraph.ts       # 函数图像动态绘制
│   │   ├── GeometricTransform.ts  # 几何变换
│   │   ├── ProbabilitySim.ts      # 概率模拟（硬币/骰子/高尔顿板）
│   │   ├── VectorField.ts         # 向量场 3D 可视化
│   │   ├── SolidGeometry.ts       # 立体几何 3D 模型
│   │   ├── ConicSections.ts       # 圆锥曲线
│   │   └── index.ts
│   └── earth_science/             # 地球科学模块
│       ├── SolarSystem.ts         # 太阳系 3D 模型
│       ├── PlateTectonics.ts      # 板块构造
│       ├── WaterCycle.ts          # 水循环
│       ├── Seasons.ts             # 四季成因
│       └── index.ts
```

**各学科详细功能**：

**a) 化学实验**：
- **酸碱滴定**：pH 实时变化曲线、指示剂颜色渐变、滴定终点判定
- **化学反应**：反应物→产物粒子动画、质量守恒自动验证、反应速率调节
- **分子结构**：3D 球棍模型、原子/离子/分子可视化、键角测量
- **电解实验**：电极反应可视化、气体收集动画、离子迁移方向
- **气体定律**：PV=nRT 实时验证、等温/等压/等容过程曲线
- **化学器材库**：烧杯、试管、滴管、酒精灯、量筒、锥形瓶、冷凝管等

**b) 生物实验**：
- **细胞分裂**：有丝分裂/减数分裂各阶段动画、染色体行为可视化
- **DNA 结构**：双螺旋 3D 旋转模型、碱基配对（A-T, C-G）、复制/转录动画
- **自然选择**：种群演化模拟、基因频率变化曲线、环境选择压力调节
- **食物链/食物网**：物种间能量流动箭头、种群数量动态平衡
- **显微镜模拟**：虚拟玻片、焦距调节、放大倍数切换

**c) 数学可视化**：
- **函数图像**：一次/二次/三次/三角/指数/对数函数动态绘制，参数滑块实时调节
- **几何变换**：平移/旋转/反射/缩放/剪切变换 3D 可视化
- **概率模拟**：大数定律验证、正态分布逼近、贝叶斯推断可视化
- **向量场**：3D 向量场（梯度/旋度/散度）、流线可视化
- **立体几何**：多面体、旋转体、截面、展开图

**关键技术**：
- 化学器材需要新的 3D 模型和 `SandboxShape` 扩展
- 粒子系统需要独立于 Rapier 的轻量级粒子引擎（用于化学反应动画）
- 部分内容（数学、生物）对物理引擎依赖较低，可复用现有 Three.js 渲染管线

**关键文件**：
- 新建 `src/features/experiments/chemistry/`
- 新建 `src/features/experiments/biology/`
- 新建 `src/features/experiments/math/`
- 新建 `src/features/experiments/earth_science/`
- 修改 `src/features/experiments/registry.ts`
- 修改 `src/shared/types/experiment.ts`
- 修改 `src/features/sandbox/sandboxStore.ts`（新增化学器材形状）
- 修改 `src/app/providers/I18nProvider.tsx`（新增学科分类翻译）

---

#### 2.2 物理现象增强（Advanced Physics Phenomena）⭐⭐⭐⭐

**对标产品**：Algodoo（流体、光学、推力器）、Physics Lab AR（电磁场线可视化）

**现状**：刚体力学 + 7 种关节已较完善，已有 `ForceFieldRenderer` 支持点引力/斥力场。但缺少**流体模拟**、**电磁场线可视化**、**光线追踪**、**热传导**等高级物理现象。

**实现方案**：

```
新增/修改模块：
├── src/features/sandbox/
│   ├── FluidSimulation.tsx         # 新增：简化 SPH 流体模拟
│   ├── EMFieldVisualizer.tsx       # 新增：电磁场线可视化
│   ├── LightRayTracer.tsx          # 新增：光线追踪（反射/折射/色散）
│   ├── HeatConduction.tsx          # 新增：热传导可视化
│   ├── ForceFieldRenderer.tsx      # 增强：支持更多力场类型
│   └── sandboxStore.ts             # 增强：新增流体/电磁/光学器材类型
```

**a) 简化流体模拟（SPH）**：

使用 2D SPH（Smoothed Particle Hydrodynamics）在 Web Worker 中计算，Three.js 渲染粒子：

```typescript
// src/features/sandbox/FluidSimulation.ts
interface FluidConfig {
  particleCount: number       // 粒子数量（默认 500）
  particleRadius: number      // 粒子半径
  restDensity: number         // 静止密度
  viscosity: number           // 黏度
  surfaceTension: number      // 表面张力
  gravity: [number, number]   // 重力
  bounds: {                   // 容器边界
    min: [number, number]
    max: [number, number]
  }
}
```

- 在场景中放置"水槽"区域（2D 平面）
- 物体落入水中产生浮力（基于排水体积）和阻力
- 可视化水面波动和飞溅粒子
- 支持不同液体（水/油/蜂蜜）通过调节黏度参数
- 粒子与现有刚体系统交互（刚体推开水粒子）

**b) 电磁场可视化**：

```typescript
// 新增器材类型
type SandboxShape = /* existing */ | 'charge_positive' | 'charge_negative' | 'magnet_n' | 'magnet_s' | 'wire' | 'coil'

// 电场线计算
function computeElectricFieldLines(
  charges: Array<{ position: Vec3; charge: number }>,
  resolution: number
): FieldLine[]
```

- 添加"电荷"器材（正电荷/负电荷，可调节电荷量）
- 可视化电场线（从正电荷出发，终止于负电荷）
- 带电粒子在电场中的运动轨迹（洛伦兹力）
- 添加"磁铁"器材（N极/S极，可调节磁感应强度）
- 可视化磁感线
- 电流导线产生环形磁场（右手定则可视化）
- 电磁感应：线圈切割磁感线产生感应电流

**c) 光线追踪**：

```typescript
// 新增器材类型
type SandboxShape = /* existing */ | 'light_source' | 'convex_lens' | 'concave_lens' | 'plane_mirror' | 'concave_mirror' | 'prism' | 'screen'

// 光线追踪
function traceRays(
  source: LightSource,
  elements: OpticalElement[],
  numRays: number
): RayPath[]
```

- 添加"光源"器材（点光源、平行光源、可调节波长/颜色）
- 添加"光学元件"器材（凸透镜、凹透镜、平面镜、凹面镜、凸面镜、棱镜、光屏）
- 光线追踪渲染（反射、折射、全反射、色散）
- 可视化光路和成像位置（实像/虚像）
- 支持透镜公式自动验证：1/f = 1/u + 1/v
- 近视/远视矫正模拟（凹透镜/凸透镜矫正）

**d) 热传导可视化**：

- 物体间接触传热（温度梯度颜色映射）
- 热平衡过程可视化
- 比热容/热导率等参数可调节
- 温度计器材显示实时温度

**关键文件**：
- 新建 `src/features/sandbox/FluidSimulation.tsx`
- 新建 `src/features/sandbox/EMFieldVisualizer.tsx`
- 新建 `src/features/sandbox/LightRayTracer.tsx`
- 新建 `src/features/sandbox/HeatConduction.tsx`
- 修改 `src/features/sandbox/sandboxStore.ts`
- 修改 `src/features/sandbox/EquipmentPalette.tsx`

---

#### 2.3 数据可视化增强（Advanced Data Visualization）⭐⭐⭐⭐

**对标产品**：Algodoo（力/速度/动量可视化）、NOBOOK（实验数据图表）、phyphox（传感器数据分析）

**现状**：已有 `DataPanel`（遥测数据图表）、`ForceVisualizer`（力矢量箭头）、`EnergyBar`（能量条）、`VectorOverlay`（速度矢量）。但缺少**数据回归分析**、**公式叠加对比**、**多通道对比**、**数据统计**等高级分析功能。

**实现方案**：

```
修改/新增模块：
├── src/features/sandbox/
│   ├── DataPanel.tsx               # 增强：数据回归分析、公式叠加
│   ├── ComparisonChart.tsx         # 新增：多通道数据对比图表
│   ├── RegressionAnalysis.tsx      # 新增：回归分析面板
│   ├── FormulaOverlay.tsx          # 增强：图表上叠加理论公式曲线
│   └── StatisticsPanel.tsx         # 新增：数据统计面板
```

**a) 数据回归分析**：

```typescript
// src/features/sandbox/RegressionAnalysis.ts
interface RegressionResult {
  type: 'linear' | 'quadratic' | 'exponential' | 'logarithmic' | 'power'
  equation: string          // 如 "y = 2.13x + 0.05"
  coefficients: number[]    // 系数
  rSquared: number          // 拟合优度 R²
  rmse: number              // 均方根误差
  prediction: (x: number) => number
}
```

- 线性回归（y = ax + b）
- 二次回归（y = ax² + bx + c）
- 指数回归（y = a·e^(bx)）
- 对数回归（y = a·ln(x) + b）
- 幂回归（y = a·x^b）
- 自动选择最佳拟合类型（R² 最大）
- 显示拟合曲线叠加在数据点上
- 残差图（Residual Plot）

**b) 公式叠加对比**：

- 在图表上叠加显示理论公式曲线
- 例如：自由落体 v-t 图叠加 v = gt 参考线
- 实时计算理论与实验值的偏差百分比
- 偏差随时间/位置变化的图表
- 多种理论模型对比（如不同摩擦系数下的理论曲线）

**c) 多通道数据对比**：

- 同时显示多个物体的同类型数据（如两个球的速度对比）
- 颜色编码区分不同物体
- 同步/异步时间轴
- 差分通道（显示两个信号的差值）

**d) 数据统计面板**：

- 均值、中位数、标准差、方差
- 最大值、最小值、范围
- 数据点数量、采样率
- 正态性检验（Shapiro-Wilk）
- 不确定度分析（Type A/B 不确定度）

**关键文件**：
- 新建 `src/features/sandbox/RegressionAnalysis.tsx`
- 新建 `src/features/sandbox/ComparisonChart.tsx`
- 新建 `src/features/sandbox/StatisticsPanel.tsx`
- 修改 `src/features/sandbox/DataPanel.tsx`
- 修改 `src/features/sandbox/FormulaOverlay.tsx`

---

#### 2.4 录制与回放增强（Recording & Playback Enhancement）⭐⭐⭐

**对标产品**：Algodoo（视频/GIF 导出）、NOBOOK（微课录制+标注）

**现状**：已有 `RecorderControls` + `RecorderSampler` + `PlaybackRunner` + `RecordingExporter`（WebM 导出）。但缺少**GIF 导出**、**时间轴编辑**、**画中画录制**、**录制标注**、**帧序列导出**等。

**实现方案**：

```
修改/新增模块：
├── src/features/recording/
│   ├── RecorderControls.tsx       # 增强：新增 GIF 导出、帧率选择
│   ├── RecorderSampler.tsx        # 增强：支持画中画模式
│   ├── RecordingExporter.ts       # 增强：新增 GIF 导出、帧序列导出
│   ├── Timeline.tsx               # 新增：时间轴编辑器（裁剪/标记）
│   ├── RecordingAnnotation.tsx    # 新增：录制标注工具
│   └── GIFExporter.ts             # 新增：GIF 导出（基于 gif.js）
```

**a) GIF 导出**：

```typescript
// src/features/recording/GIFExporter.ts
// 使用 gif.js 或自研 Canvas 逐帧合成
interface GIFExportOptions {
  fps: number              // 帧率（默认 15）
  width: number            // 宽度（默认 480）
  height: number           // 高度（默认 270）
  quality: number          // 质量（1-30，默认 10）
  loop: boolean            // 是否循环（默认 true）
  startTime: number        // 起始时间（秒）
  endTime: number          // 结束时间（秒）
}
```

- 从录制帧数据中渲染 Canvas，逐帧合成 GIF
- 支持裁剪起止时间
- 可调节输出尺寸和质量
- 显示预估文件大小和导出进度

**b) 时间轴编辑器**：

```
┌────────────────────────────────────────────┐
│  [◀◀] [▶] [⏸] [▶▶]  00:05.2 / 00:30.0    │
│  ───────────────────────────────────────── │
│  ▓▓▓▓▓▓▓▓░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░ │ ← 时间轴
│  ▲               ▲                         │ ← 起止标记
│  ───────────────────────────────────────── │
│  📍 00:02.0  碰撞事件                      │ ← 书签
│  📍 00:05.2  小球到达最高点                  │
│  📍 00:08.1  小球落地                       │
└────────────────────────────────────────────┘
```

- 拖拽设置起止裁剪点
- 添加/删除书签标记
- 自动检测关键事件（碰撞、速度突变、方向改变）并建议标签
- 时间轴缩放/平移

**c) 画中画录制**：

- 主画面：全场景录制
- 小画面：追踪选中的物体（相机跟随）
- 可调节小画面位置（四角）和大小
- 同时导出两个画面合成的视频

**d) 录制标注**：

- 录制过程中可在画面上添加文字标注
- 箭头/圆形/矩形标注
- 标注时间轴（标注在指定时间出现和消失）
- 导出时合成标注

**关键文件**：
- 新建 `src/features/recording/Timeline.tsx`
- 新建 `src/features/recording/GIFExporter.ts`
- 新建 `src/features/recording/RecordingAnnotation.tsx`
- 修改 `src/features/recording/RecorderControls.tsx`
- 修改 `src/features/recording/RecordingExporter.ts`

---

### 第三阶段：生态构建与行业领先（9-18 个月）

#### 3.1 AR 增强现实模式（Augmented Reality）⭐⭐⭐⭐

**对标产品**：Physics Lab AR、EGK PhysicsLab AR

**详细方案**（与已有计划一致，此处补充技术细节）：

**技术选型**：
- WebXR Device API（浏览器原生 AR）
- 回退方案：`@mediapipe/hands` + `three.js` 自定义 AR（非 WebXR 设备）
- 目标平台：支持 WebXR 的 Android Chrome、HoloLens 2、Meta Quest

**核心实现**：

```typescript
// src/features/ar/ARProvider.tsx
interface ARSessionState {
  mode: 'vr' | 'ar' | 'none'
  supported: boolean
  active: boolean
  hitTestResults: XRHitTestResult[]
  planes: ARPlane[]
}

// src/features/ar/ARScene.tsx
// 使用 Three.js 的 ARButton + WebXRManager
// 检测真实桌面/地面作为实验台
// 将虚拟实验器材锚定在真实空间
```

**AR 教学模式**：
- 在真实桌面上叠加虚拟实验器材
- 虚拟器材与真实桌面碰撞（利用平面检测点云）
- 手势拖拽虚拟器材（`@mediapipe/hands` 手势识别）
- 真实空间中的 3D 力场可视化
- AR 模式下保留完整沙盒编辑能力

**降级策略**：
- 不支持 WebXR 的设备回退到"伪 AR"模式：使用摄像头作为背景，叠加 3D 场景
- 无摄像头的桌面设备回退到标准 3D 模式

---

#### 3.2 可访问性（A11y）⭐⭐⭐

**对标产品**：PhET（屏幕阅读器支持、替代输入、高对比度、声波化）

**详细方案**（与已有计划一致，补充具体实现）：

**a) 屏幕阅读器支持**：
- 所有 UI 元素添加 ARIA 标签和 `role` 属性
- 3D 场景状态通过 `aria-live` region 实时播报
- 物体选中/移动/碰撞时播报状态变化
- 图表数据提供 `aria-describedby` 文本替代描述

**b) 键盘完整导航**：
- Tab 键在 UI 元素间导航（焦点环可见）
- 方向键在 3D 场景中移动选中物体（微调位置）
- 完整的键盘操作映射表（不依赖鼠标）
- Skip-to-content 链接

**c) 数据声波化（Sonification）**：
```typescript
// src/features/a11y/SonificationEngine.ts
// 使用 Web Audio API 将物理量映射为声音
interface SonificationMapping {
  parameter: 'speed' | 'acceleration' | 'energy' | 'position'
  audioParam: 'frequency' | 'volume' | 'pan' | 'filter'
  range: [number, number]       // 输入范围
  audioRange: [number, number]  // 输出范围
  scale: 'linear' | 'logarithmic'
}
```

- 盲人学生通过听觉判断物理过程
- 碰撞事件发出不同音色的声音
- 速度变化映射为音高变化
- 能量转换映射为音量变化

**d) 视觉辅助**：
- 高对比度主题（WCAG AA 标准，对比度 ≥ 4.5:1）
- 色盲友好配色方案（基于 ColorBrewer/Okabe-Ito）
- 可调节字体大小（12px-24px）
- 减少动画/运动模式（`prefers-reduced-motion`）
- 焦点指示器增强

---

#### 3.3 协作与实时同步（Real-time Collaboration）⭐⭐⭐

**对标产品**：Google Docs 风格实时协作（无直接竞品实现，但教育场景强需求）

**现状**：无协作功能。云端同步仅支持异步保存/加载。

**实现方案**：

```
新增模块：
├── src/features/collaboration/
│   ├── CollaborationProvider.tsx   # WebSocket/WebRTC 连接管理
│   ├── CursorOverlay.tsx           # 协作者光标显示
│   ├── CollaborationPanel.tsx      # 协作面板（邀请/权限管理）
│   └── collaborationStore.ts       # 协作状态管理
```

**详细功能**：
- 多人同时编辑同一个沙盒场景
- 实时同步：器材增删改、位置变换、运行状态
- 协作者光标显示（不同颜色标记不同用户）
- 权限管理：只读/编辑/管理员
- 聊天面板（内置文本聊天）
- 冲突解决：Last-Write-Wins + 操作转换（OT）

**技术方案**：
- 使用 Supabase Realtime（WebSocket）或 Yjs + WebRTC
- 操作粒度：每次 `updateItem`/`addItem`/`removeItem` 作为独立操作广播
- 物理运行状态不广播（每个客户端独立运行物理引擎，仅同步初始条件）

---

#### 3.4 考试模式（Exam Mode）⭐⭐⭐⭐

**对标产品**：NOBOOK（考试+评分+防作弊）

**详细功能**：
- 教师创建考试（选择题/填空题/实验操作题）
- 限时答题（倒计时）
- 防作弊：全屏锁定、禁止切换标签页、禁止复制粘贴
- 自动评分（选择题/填空题自动判分，操作题 AI 评分）
- 成绩分析报告（班级排名、知识点得分率、题目难度分析）
- 错题本（自动收集学生错题，生成个性化练习）

**关键文件**：
- 新建 `src/features/exam/` 完整模块
- 新建后端 API：`api/exam/`

---

## 四、技术架构升级

### 4.1 后端服务架构

当前 Phyverse 已有部分后端服务（通过 Vercel Functions + Supabase），为支持社区、教师工作台、协作等功能，需要扩展：

```
推荐架构：Supabase（开源 BaaS）+ Vercel Edge Functions
├── 数据库（PostgreSQL）：
│   ├── 用户表（已有）
│   ├── 场景表（已有，需扩展）
│   ├── 班级表（新增）
│   ├── 作业表（新增）
│   ├── 提交表（新增）
│   ├── 评论/点赞表（新增）
│   └── 知识点掌握表（新增）
├── 认证（已有）：邮箱/Google 登录
├── 存储（已有）：场景 JSON、缩略图
├── Realtime（新增）：协作编辑、课堂投屏
├── Edge Functions（已有，需扩展）：
│   ├── AI Chat API 代理（已有）
│   ├── AI 评分计算（新增）
│   ├── 缩略图生成（新增）
│   └── 数据统计聚合（新增）
```

### 4.2 性能优化

| 优化项 | 方案 | 预期收益 |
|--------|------|----------|
| 物理计算 | Web Worker 中运行 Rapier（已有 `PhysicsWorld` 类，可迁移） | 主线程不阻塞，稳定 60fps |
| 渲染优化 | InstancedMesh 渲染大量相同物体（如化学粒子） | 万级物体渲染 |
| 场景加载 | 懒加载预设场景 + 渐进式渲染 | 首屏加载 < 2s |
| 内存管理 | 场景卸载时完整清理 GPU 资源（已实现 geometry/material dispose） | 避免内存泄漏 |
| 录屏性能 | OffscreenCanvas + WebCodecs API（替代 MediaRecorder） | 录制不卡顿，CPU 占用降低 50% |
| 包体积 | 代码分割（lazy import 实验模块、AR 模块） | 初始包体积 < 500KB |
| 流体模拟 | SPH 计算放入 Web Worker | 主线程 60fps 不受影响 |

### 4.3 技术栈扩展

| 新增依赖 | 用途 | 大小 |
|----------|------|------|
| `gif.js` 或 `modern-gif` | GIF 导出 | ~15KB |
| `@mediapipe/hands` | 手势识别（AR 回退方案） | ~5MB（WASM） |
| `yjs` + `y-webrtc` | 实时协作 | ~50KB |
| `webxr` types | AR 类型定义 | 仅 dev |
| `regression` (npm) | 数据回归分析 | ~10KB |
| `mathjs` | 数学表达式解析和公式验证 | ~200KB（可按需引入） |

---

## 五、优先级矩阵（更新版）

| 优先级 | 功能 | 阶段 | 开发量 | 用户价值 | 竞争差异 | 依赖 |
|--------|------|------|--------|----------|----------|------|
| P0 | 社区场景画廊 | 一 | 大 | 极高 | 强 | 已有 CloudSync 基础 |
| P0 | AI 智能评分引擎 | 一 | 大 | 极高 | 强 | 已有 AI Agent |
| P0 | 教师工作台 | 一 | 极大 | 极高 | 强 | 需新建后端 |
| P0 | 移动端 3D 触控手势 | 一 | 中 | 高 | 弱 | 无 |
| P0 | 教材同步与课程对齐 | 一 | 中 | 高 | 强 | 需内容团队 |
| P1 | 跨学科扩展（化学/生物/数学） | 二 | 极大 | 高 | 强 | 需内容团队 |
| P1 | 物理现象增强（流体/电磁/光学） | 二 | 大 | 中 | 强 | 无 |
| P1 | 数据可视化增强（回归分析） | 二 | 中 | 高 | 中 | 已有 DataPanel |
| P1 | 录制与回放增强（GIF/时间轴） | 二 | 中 | 中 | 中 | 已有录制系统 |
| P2 | AR 增强现实 | 三 | 大 | 中 | 强 | WebXR 支持 |
| P2 | 可访问性（A11y） | 三 | 大 | 中 | 中 | 无 |
| P2 | 协作与实时同步 | 三 | 大 | 中 | 强 | 需 WebSocket |
| P2 | 考试模式 | 三 | 大 | 高 | 强 | 依赖教师工作台 |

---

## 六、验证计划

### 6.1 质量保障

- TypeScript 严格模式：`npx tsc --noEmit` 零错误
- ESLint 零警告：`npm run lint --max-warnings=0`
- 单元测试覆盖率 > 80%（关键模块必测）
- E2E 测试覆盖核心用户流程（教师布置作业→学生完成→AI 评分→教师查看成绩）
- 性能基准：录制状态下 60fps 不掉帧，移动端 30fps+
- 可访问性审计：Lighthouse A11y 评分 > 90
- 包体积监控：初始 JS < 500KB（gzipped）

### 6.2 用户验证

- 邀请 10-20 位物理教师进行可用性测试
- 在 2-3 所学校课堂试用（至少 100 名学生参与）
- 收集 NPS 评分（目标 > 50）
- A/B 测试 AI 评分功能的有效性（AI 评分 vs 教师评分的相关性）
- 社区场景数量增长指标（目标：6 个月内 > 1000 个公开场景）

### 6.3 对照验证清单

| 对标功能 | 来源 | 当前状态 | 目标状态 |
|----------|------|----------|----------|
| 社区场景共享 | Algodoo Algobox | 基础云端同步 | 完整画廊+社交 |
| AI 纠错评分 | NOBOOK | 对话 Agent | 自动评分+纠错 |
| 教师工作台 | NOBOOK | 无 | 班级+作业+成绩 |
| 移动端适配 | NOBOOK | 基础 PWA | 完整 3D 触控 |
| 教材同步 | NOBOOK | 标签分类 | 章节级对应 |
| 跨学科内容 | PhET | 仅物理 | 物理+化学+生物+数学 |
| 流体模拟 | Algodoo | 无 | SPH 粒子流体 |
| 电磁场可视化 | Physics Lab AR | 力场渲染器 | 电场线+磁感线 |
| 光线追踪 | Algodoo | 无 | 反射/折射/色散 |
| AR 模式 | Physics Lab AR | 无 | WebXR AR |
| 屏幕阅读器 | PhET | 无 | ARIA 全覆盖 |
| 数据声波化 | PhET | 无 | Web Audio API |
| 课堂投屏 | NOBOOK | 无 | WebSocket 实时同步 |
| 考试模式 | NOBOOK | 无 | 限时+防作弊+AI 评分 |
| 数据回归分析 | phyphox | 基础图表 | 回归+统计+公式叠加 |
| GIF 导出 | Algodoo | 仅 WebM | GIF + 帧序列 |
| 实时协作 | 无直接竞品 | 无 | Yjs 多人协同 |

---

## 七、总结

当前 Phyverse 自由沙盒在以下方面已建立坚实基础：

1. **3D 物理引擎**：Rapier3D + Three.js，支持刚体、7 种关节、力场
2. **编辑体验**：Gizmo、吸附、撤销/重做、快捷键、多选、盒选
3. **数据采集**：遥测采样、实时图表、CSV 导出、测量工具
4. **AI 集成**：流式对话 Agent、工具调用（场景操作）
5. **录制回放**：帧录制、回放、WebM 导出
6. **云端能力**：场景保存/加载、公开/私有、用户认证

但在以下关键维度与市面成熟产品存在显著差距：

1. **社区生态**：缺少场景画廊和社交互动（Algodoo Algobox 5 万+场景）
2. **教学闭环**：缺少教师端管理和作业/考试系统（NOBOOK 完整教学闭环）
3. **内容广度**：缺少跨学科内容和教材同步（PhET 5 大学科、NOBOOK 2000+ 实验）
4. **移动端体验**：3D 触控手势缺失（NOBOOK 原生客户端）
5. **AI 深度**：缺少自动评分和实验纠错（NOBOOK AI 评分）
6. **高级物理**：缺少流体/电磁场/光学模拟（Algodoo/Physics Lab AR）

建议按照三阶段路线图推进，**第一阶段（1-3 个月）集中攻克社区画廊、AI 评分、教师工作台、移动端触控、教材同步五大核心短板**，快速追平市场基线；**第二阶段（4-8 个月）构建跨学科内容和物理现象增强**，建立差异化优势；**第三阶段（9-18 个月）实现 AR 模式、可访问性、实时协作和考试模式**，达到行业领先水平。