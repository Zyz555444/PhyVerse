import { Link } from 'react-router-dom'
import { Rocket, Box, Atom, FlaskConical, ArrowRight } from 'lucide-react'
import { Card } from '@/shared/ui/Card'
import { useI18n } from '@/shared/hooks/useI18n'
import { cn } from '@/shared/utils/cn'

interface QuickStartItem {
  icon: typeof Rocket
  title: { zh: string; en: string }
  description: { zh: string; en: string }
  to: string
  accent: string
}

const quickStartItems: QuickStartItem[] = [
  {
    icon: Box,
    title: { zh: '自由落体', en: 'Free Fall' },
    description: {
      zh: '验证真空中重物下落规律，理解重力加速度',
      en: 'Verify free fall motion and gravitational acceleration',
    },
    to: '/experiment/mechanics/MECH-03',
    accent: 'text-blue-500 bg-blue-50',
  },
  {
    icon: Atom,
    title: { zh: '胡克定律', en: "Hooke's Law" },
    description: {
      zh: '探究弹簧弹力与形变量的关系',
      en: 'Explore the relationship between spring force and deformation',
    },
    to: '/experiment/mechanics/MECH-06',
    accent: 'text-purple-500 bg-purple-50',
  },
  {
    icon: FlaskConical,
    title: { zh: '平抛运动', en: 'Projectile Motion' },
    description: {
      zh: '分解水平匀速与竖直自由落体运动',
      en: 'Decompose horizontal uniform and vertical free fall motion',
    },
    to: '/experiment/mechanics/MECH-14',
    accent: 'text-emerald-500 bg-emerald-50',
  },
  {
    icon: Rocket,
    title: { zh: '自由沙盒', en: 'Free Sandbox' },
    description: {
      zh: '自由放置器材，调整参数，探索物理世界',
      en: 'Place equipment freely, adjust parameters, explore physics',
    },
    to: '/sandbox',
    accent: 'text-amber-500 bg-amber-50',
  },
]

export function QuickStart() {
  const { language } = useI18n()

  return (
    <section className="py-12">
      <div className="mb-6 flex items-center gap-2">
        <Rocket className="h-5 w-5 text-accent" />
        <h2 className="font-heading text-xl font-medium text-text-primary">
          {language === 'zh' ? '快速开始' : 'Quick Start'}
        </h2>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {quickStartItems.map((item) => {
          const Icon = item.icon
          return (
            <Link key={item.to} to={item.to} className="block">
              <Card isHoverable className="h-full">
                <div
                  className={cn(
                    'mb-3 inline-flex h-10 w-10 items-center justify-center rounded-lg',
                    item.accent
                  )}
                >
                  <Icon className="h-5 w-5" />
                </div>
                <h3 className="mb-1 font-heading text-base font-medium text-text-primary">
                  {item.title[language]}
                </h3>
                <p className="text-xs leading-relaxed text-text-secondary">
                  {item.description[language]}
                </p>
                <div className="mt-3 inline-flex items-center gap-1 text-xs text-accent">
                  {language === 'zh' ? '开始' : 'Start'}
                  <ArrowRight className="h-3 w-3" />
                </div>
              </Card>
            </Link>
          )
        })}
      </div>
    </section>
  )
}
