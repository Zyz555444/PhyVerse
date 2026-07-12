# PhyVerse（物理宇宙）

> 基于 Web 的 3D 高中物理实验引擎 — 在浏览器中构建真实、流畅、可交互的物理世界。

PhyVerse 覆盖中国高中物理全部核心实验（力学/电学/光学/热学/近代物理），学生可以自由拖拽、调整参数、实时观察物理现象，教师可用于课堂演示。基于 Rapier WASM 物理引擎与 Three.js 渲染，60fps 稳定运行。

## 核心特性

- **3D 物理模拟** — 基于 Rapier WASM 的刚体动力学、碰撞检测、约束系统
- **实时数据采集** — 位置/速度/加速度/力/能量曲线实时绘制
- **参数可调** — 质量、摩擦系数、初速度等参数滑块实时调节
- **引导式实验** — 分步引导，按教材流程完成实验
- **Yohaku 设计系统** — 留白美学，衬线标题，克制用色
- **中英双语** — 完整国际化支持
- **深色/浅色主题** — 遵循 Yohaku 双主题规范

## 技术栈

| 分类 | 技术 | 版本 |
|------|------|------|
| UI 框架 | React | 19 |
| 构建工具 | Vite | 8 |
| 类型系统 | TypeScript | 6 |
| 3D 渲染 | Three.js + @react-three/fiber + @react-three/drei | latest |
| 物理引擎 | @dimforge/rapier3d（WASM 同步构建） | 0.19 |
| 状态管理 | Zustand | 5 |
| 样式 | Tailwind CSS | 4 |
| 组件库 | Radix UI | latest |
| 图表 | Recharts | 3 |
| 动画 | Framer Motion | 12 |

## 快速开始

### 前置要求

- Node.js ≥ 20
- npm ≥ 10

### 安装与运行

```bash
# 克隆仓库
git clone https://github.com/Zyz555444/PhyVerse.git
cd PhyVerse

# 安装依赖
npm install

# 启动开发服务器
npm run dev

# 构建生产版本
npm run build

# 预览生产构建
npm run preview
```

开发服务器默认运行在 `http://localhost:5173`。

## 实验列表

### 力学实验（已实现 19 个）

| ID | 实验名称 | 核心物理 | 难度 |
|----|---------|---------|------|
| MECH-01 | 打点计时器测量平均速度 | v = Δx/Δt | ★ |
| MECH-03 | 验证真空中重物下落快慢 | 自由落体 | ★ |
| MECH-04 | 判断重力的方向 | 重力竖直向下 | ★ |
| MECH-05 | 桌面微小形变 | 力的形变效果 | ★ |
| MECH-06 | 胡克定律 | F = kx | ★★ |
| MECH-07 | 平行四边形定则 | 力的合成 | ★★ |
| MECH-08 | 伽利略斜面实验 | 惯性定律 | ★★ |
| MECH-09 | 牛顿第二定律 | F = ma | ★★ |
| MECH-10 | 失重与超重 | 视重 vs 实重 | ★★ |
| MECH-11 | 验证牛顿第三定律 | 作用力与反作用力 | ★ |
| MECH-12 | 曲线运动速度方向 | 切线方向 | ★★ |
| MECH-13 | 运动的合成与分解 | 独立性原理 | ★★ |
| MECH-14 | 描绘平抛运动的轨迹 | x=vt, y=½gt² | ★★ |
| MECH-15 | 探究向心力与质量、角速度、半径的关系 | F = mω²r | ★★ |
| MECH-16 | 探究动能定理 | W = ΔEk | ★★★ |
| MECH-17 | 验证机械能守恒定律 | Ek + Ep = const | ★★★ |
| MECH-18 | 验证动量守恒定律（平抛法） | m₁v₁ = m₁v₁' + m₂v₂' | ★★★ |
| MECH-19 | 用单摆测定重力加速度 | T = 2π√(L/g) | ★★ |

### 规划中的实验

- **电学实验**（12 个）— 欧姆定律、伏安特性、惠斯通电桥、电磁感应等
- **光学实验**（7 个）— 光的折射、双缝干涉、透镜成像等
- **热学实验**（4 个）— 油膜法估测分子大小、玻意耳定律等
- **近代物理实验**（3 个）— 光电效应、氢原子光谱等

## 项目结构

```
phyverse/
├── src/
│   ├── app/                    # 应用层
│   │   ├── layouts/           # 布局组件
│   │   ├── providers/          # 全局 Provider（主题/国际化/物理）
│   │   └── router.tsx          # 路由配置
│   ├── pages/                  # 页面组件
│   │   ├── Landing.tsx         # 首页 — 实验选择
│   │   ├── Experiment.tsx      # 实验页 — 3D 画布
│   │   ├── Sandbox.tsx          # 自由沙盒模式
│   │   └── Settings.tsx        # 设置页
│   ├── features/
│   │   ├── canvas/             # 3D 画布核心（场景/光照/网格/控制）
│   │   ├── physics/            # 物理引擎封装（Rapier）
│   │   │   ├── PhysicsWorld.ts # 物理世界管理
│   │   │   ├── RigidBodyFactory.ts
│   │   │   ├── JointFactory.ts
│   │   │   └── ...
│   │   └── experiments/        # 实验定义
│   │       ├── registry.ts     # 实验注册表
│   │       └── mechanics/      # 力学实验（19 个）
│   ├── shared/
│   │   ├── types/              # TypeScript 类型定义
│   │   ├── ui/                 # Yohaku 通用 UI 组件
│   │   ├── hooks/              # 自定义 Hooks
│   │   └── utils/              # 工具函数
│   └── styles/                 # 全局样式 + Yohaku 设计令牌
├── public/                     # 静态资源
└── package.json
```

## 架构设计

```
┌─────────────────────────────────────────────────┐
│           UI 层 (React 19 + Radix UI + Tailwind) │
├─────────────────────────────────────────────────┤
│      3D 渲染层 (React Three Fiber 9 + Three.js) │
├─────────────────────────────────────────────────┤
│        物理模拟层 (Rapier 3D WASM)               │
│  刚体动力学 · 碰撞检测 · 约束系统 · 自定义力场    │
├─────────────────────────────────────────────────┤
│        状态管理层 (Zustand 5)                    │
├─────────────────────────────────────────────────┤
│        数据与分析层 (Recharts)                   │
└─────────────────────────────────────────────────┘
```

## 开发脚本

| 命令 | 说明 |
|------|------|
| `npm run dev` | 启动开发服务器（HMR） |
| `npm run build` | TypeScript 检查 + 生产构建 |
| `npm run lint` | ESLint 代码检查 |
| `npm run lint:fix` | ESLint 自动修复 |
| `npm run format` | Prettier 格式化 |
| `npm run format:check` | Prettier 格式检查 |
| `npm run preview` | 预览生产构建 |

## 设计系统

PhyVerse 遵循 **Yohaku Design System（余白）** 设计规范：

- **留白哲学** — 界面像实验报告纸一样克制、纯净，让物理现象成为视觉焦点
- **克制用色** — 仅使用强调色（浅葱 `#33A6B8`）作为交互提示
- **呼吸式动画** — 所有元素随状态变化自然过渡
- **衬线标题** — 页面标题使用 Noto Serif SC 衬线字体
- **8px 网格** — 间距系统基于 8px 网格

## License

MIT
