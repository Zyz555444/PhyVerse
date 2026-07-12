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
    (key: string) => {
      return translations[language][key] ?? key
    },
    [language]
  )

  return (
    <I18nContext.Provider value={{ language, setLanguage, t }}>{children}</I18nContext.Provider>
  )
}
