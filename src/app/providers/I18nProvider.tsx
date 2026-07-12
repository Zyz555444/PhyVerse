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
    'settings.theme': '主题',
    'settings.language': '语言',
    'settings.physics': '物理设置',
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
    'settings.theme': 'Theme',
    'settings.language': 'Language',
    'settings.physics': 'Physics Settings',
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
