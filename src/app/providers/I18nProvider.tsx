import { useCallback, useEffect, useState, type ReactNode } from 'react'
import { I18nContext } from '@/app/providers/I18nContext'
import type { Language } from '@/app/providers/I18nContext'

const STORAGE_KEY = 'phyverse-language'

const translations: Record<Language, Record<string, string>> = {
  zh: {
    'app.name': 'PhyVerse',
    'app.tagline': '物理宇宙 — 3D 高中物理实验引擎',
    'nav.home': '首页',
    'nav.sandbox': '自由实验',
    'nav.settings': '设置',
    'theme.light': '浅色',
    'theme.dark': '深色',
    'language.zh': '中文',
    'language.en': 'English',
    'experiment.mechanics': '力学',
    'experiment.electromagnetism': '电磁学',
    'experiment.optics': '光学',
    'experiment.thermal': '热学',
    'experiment.modern': '近代物理',
    'experiment.difficulty.easy': '简单',
    'experiment.difficulty.medium': '中等',
    'experiment.difficulty.hard': '困难',
    'experiment.start': '开始实验',
    'experiment.params': '参数',
    'experiment.data': '数据',
    'experiment.guide': '引导',
    'experiment.reset': '重置',
    'experiment.run': '运行',
    'experiment.pause': '暂停',
    'sandbox.run': '运行',
    'sandbox.pause': '暂停',
    'sandbox.reset': '重置',
    'sandbox.duplicate': '复制',
    'sandbox.delete': '删除',
    'sandbox.clear': '清空',
    'sandbox.export': '导出',
    'sandbox.import': '导入',
    'sandbox.saved': '已自动保存',
    'sandbox.empty': '从左侧器材库添加器材或选择预设开始搭建场景',
    'sandbox.importError': '导入失败：文件格式不正确',
    'sandbox.properties': '属性',
    'sandbox.gravity': '全局重力',
    'sandbox.resetGravity': '恢复默认重力',
    'sandbox.selectHint': '在场景中点击器材以编辑属性。',
    'sandbox.position': '位置',
    'sandbox.rotation': '旋转',
    'sandbox.scale': '缩放',
    'sandbox.size': '尺寸',
    'sandbox.physics': '物理属性',
    'sandbox.mass': '质量',
    'sandbox.friction': '摩擦',
    'sandbox.restitution': '弹性',
    'sandbox.material': '材质',
    'sandbox.color': '颜色',
    'sandbox.dynamic': '受物理影响（动态）',
    'sandbox.equipment': '器材库',
    'sandbox.presets': '预设场景',
    'sandbox.paletteHint': '点击器材或预设添加到场景。暂停后可在场景中直接拖动器材。',
    'sandbox.clearConfirm': '确定要清空当前场景吗？',
    'sandbox.gizmoTranslate': '平移',
    'sandbox.gizmoRotate': '旋转',
    'sandbox.gizmoScale': '缩放',
    'sandbox.shape.box': '长方体',
    'sandbox.shape.sphere': '球体',
    'sandbox.shape.cylinder': '圆柱',
    'sandbox.shape.capsule': '胶囊',
    'sandbox.shape.cone': '圆锥',
    'sandbox.shape.plane': '平面',
    'sandbox.shape.torus': '圆环',
    'sandbox.shape.spring': '弹簧',
    'sandbox.editorSettings': '编辑器设置',
    'sandbox.snap': '网格吸附',
    'sandbox.snapSize': '吸附步长',
    'sandbox.angleSnap': '角度吸附',
    'sandbox.angleSnapSize': '角度步长',
    'sandbox.timeScale': '模拟速度',
    'sandbox.cameraView': '相机视角',
    'sandbox.viewFree': '自由',
    'sandbox.viewTop': '顶视',
    'sandbox.viewFront': '正视',
    'sandbox.viewSide': '侧视',
    'sandbox.presetConfirm': '加载预设“{name}”将覆盖当前场景，是否继续？',
    'sandbox.copy': '复制',
    'sandbox.paste': '粘贴',
    'sandbox.deselect': '取消选择',
    'common.search': '搜索实验...',
    'common.loading': '加载中...',
    'common.empty': '暂无内容',
    'common.menu': '菜单',
    'common.close': '关闭',
    'settings.theme': '主题',
    'settings.language': '语言',
    'settings.physics': '物理设置',
    'settings.gravity': '重力加速度',
    'settings.timestep': '物理帧率',
    'settings.maxSubSteps': '最大子步数',
    'settings.friction': '默认摩擦系数',
    'settings.restitution': '默认弹性系数',
    'settings.allowSleep': '允许刚体休眠',
    'settings.resetDefaults': '恢复默认',
    'settings.about': '关于',
    'settings.version': '版本',
    'settings.description':
      'PhyVerse — 基于 Web 的 3D 高中物理实验引擎，覆盖力学、电磁学、光学、热学与近代物理。',
    'settings.install': '安装应用',
    'settings.installPrompt': '将 PhyVerse 安装到桌面，离线也能使用。',
    'settings.installButton': '安装',
    'settings.installed': '已安装',
  },
  en: {
    'app.name': 'PhyVerse',
    'app.tagline': 'Physical Universe — 3D High School Physics Lab',
    'nav.home': 'Home',
    'nav.sandbox': 'Sandbox',
    'nav.settings': 'Settings',
    'theme.light': 'Light',
    'theme.dark': 'Dark',
    'language.zh': '中文',
    'language.en': 'English',
    'experiment.mechanics': 'Mechanics',
    'experiment.electromagnetism': 'Electromagnetism',
    'experiment.optics': 'Optics',
    'experiment.thermal': 'Thermal',
    'experiment.modern': 'Modern Physics',
    'experiment.difficulty.easy': 'Easy',
    'experiment.difficulty.medium': 'Medium',
    'experiment.difficulty.hard': 'Hard',
    'experiment.start': 'Start Experiment',
    'experiment.params': 'Parameters',
    'experiment.data': 'Data',
    'experiment.guide': 'Guide',
    'experiment.reset': 'Reset',
    'experiment.run': 'Run',
    'experiment.pause': 'Pause',
    'sandbox.run': 'Run',
    'sandbox.pause': 'Pause',
    'sandbox.reset': 'Reset',
    'sandbox.duplicate': 'Duplicate',
    'sandbox.delete': 'Delete',
    'sandbox.clear': 'Clear',
    'sandbox.export': 'Export',
    'sandbox.import': 'Import',
    'sandbox.saved': 'Auto-saved',
    'sandbox.empty': 'Add equipment from the palette or choose a preset to start building a scene.',
    'sandbox.importError': 'Import failed: invalid file format',
    'sandbox.properties': 'Properties',
    'sandbox.gravity': 'Gravity',
    'sandbox.resetGravity': 'Reset gravity',
    'sandbox.selectHint': 'Click an object in the scene to edit its properties.',
    'sandbox.position': 'Position',
    'sandbox.rotation': 'Rotation',
    'sandbox.scale': 'Scale',
    'sandbox.size': 'Size',
    'sandbox.physics': 'Physics',
    'sandbox.mass': 'Mass',
    'sandbox.friction': 'Friction',
    'sandbox.restitution': 'Restitution',
    'sandbox.material': 'Material',
    'sandbox.color': 'Color',
    'sandbox.dynamic': 'Affected by physics (dynamic)',
    'sandbox.equipment': 'Equipment',
    'sandbox.presets': 'Presets',
    'sandbox.paletteHint': 'Click equipment or a preset to add it. Pause to drag objects directly.',
    'sandbox.clearConfirm': 'Are you sure you want to clear the current scene?',
    'sandbox.gizmoTranslate': 'Move',
    'sandbox.gizmoRotate': 'Rotate',
    'sandbox.gizmoScale': 'Scale',
    'sandbox.shape.box': 'Box',
    'sandbox.shape.sphere': 'Sphere',
    'sandbox.shape.cylinder': 'Cylinder',
    'sandbox.shape.capsule': 'Capsule',
    'sandbox.shape.cone': 'Cone',
    'sandbox.shape.plane': 'Plane',
    'sandbox.shape.torus': 'Torus',
    'sandbox.shape.spring': 'Spring',
    'sandbox.editorSettings': 'Editor Settings',
    'sandbox.snap': 'Grid Snap',
    'sandbox.snapSize': 'Snap Size',
    'sandbox.angleSnap': 'Angle Snap',
    'sandbox.angleSnapSize': 'Angle Snap Size',
    'sandbox.timeScale': 'Sim Speed',
    'sandbox.cameraView': 'Camera View',
    'sandbox.viewFree': 'Free',
    'sandbox.viewTop': 'Top',
    'sandbox.viewFront': 'Front',
    'sandbox.viewSide': 'Side',
    'sandbox.presetConfirm': 'Loading preset "{name}" will overwrite the current scene. Continue?',
    'sandbox.copy': 'Copy',
    'sandbox.paste': 'Paste',
    'sandbox.deselect': 'Deselect',
    'common.search': 'Search experiments...',
    'common.loading': 'Loading...',
    'common.empty': 'No content',
    'common.menu': 'Menu',
    'common.close': 'Close',
    'settings.theme': 'Theme',
    'settings.language': 'Language',
    'settings.physics': 'Physics Settings',
    'settings.gravity': 'Gravity',
    'settings.timestep': 'Physics FPS',
    'settings.maxSubSteps': 'Max Substeps',
    'settings.friction': 'Default Friction',
    'settings.restitution': 'Default Restitution',
    'settings.allowSleep': 'Allow Rigid Body Sleep',
    'settings.resetDefaults': 'Reset to Defaults',
    'settings.about': 'About',
    'settings.version': 'Version',
    'settings.description':
      'PhyVerse — a Web-based 3D high-school physics lab engine covering mechanics, electromagnetism, optics, thermal and modern physics.',
    'settings.install': 'Install App',
    'settings.installPrompt': 'Install PhyVerse to your device for offline access.',
    'settings.installButton': 'Install',
    'settings.installed': 'Installed',
  },
}

function getInitialLanguage(): Language {
  if (typeof window === 'undefined') {
    return 'zh'
  }

  const stored = window.localStorage.getItem(STORAGE_KEY) as Language | null
  if (stored === 'zh' || stored === 'en') {
    return stored
  }

  const browserLang = navigator.language.toLowerCase()
  return browserLang.startsWith('zh') ? 'zh' : 'en'
}

export function I18nProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>(getInitialLanguage)

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEY, language)
    document.documentElement.lang = language === 'zh' ? 'zh-CN' : 'en'
  }, [language])

  const setLanguage = useCallback((next: Language) => {
    setLanguageState(next)
  }, [])

  const t = useCallback(
    (key: string, values?: Record<string, string | number>) => {
      let text = translations[language][key] ?? key
      if (values) {
        for (const [k, v] of Object.entries(values)) {
          text = text.replace(new RegExp(`\\{${k}\\}`, 'g'), String(v))
        }
      }
      return text
    },
    [language]
  )

  return (
    <I18nContext.Provider value={{ language, setLanguage, t }}>{children}</I18nContext.Provider>
  )
}
