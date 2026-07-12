import { useEffect, useRef, useState } from 'react'
import { useI18n } from '@/shared/hooks/useI18n'
import { Scene } from '@/features/canvas/Scene'
import { LabTable } from '@/features/canvas/LabTable'
import { PhysicsProvider } from '@/features/physics/PhysicsProvider'
import { useSandboxStore, type SandboxScene } from '@/features/sandbox/sandboxStore'
import { EquipmentPalette } from '@/features/sandbox/EquipmentPalette'
import { PropertiesPanel } from '@/features/sandbox/PropertiesPanel'
import { SandboxItemRenderer } from '@/features/sandbox/SandboxItemRenderer'
import {
  saveScene,
  loadStoredScene,
  exportScene,
  importScene,
} from '@/features/sandbox/sceneStorage'
import { Button } from '@/shared/ui/Button'
import { Download, Upload, Play, Pause, RotateCcw } from 'lucide-react'

export function Sandbox() {
  const { t } = useI18n()
  const items = useSandboxStore((s) => s.items)
  const gravity = useSandboxStore((s) => s.gravity)
  const selectedId = useSandboxStore((s) => s.selectedId)
  const selectItem = useSandboxStore((s) => s.selectItem)
  const resetScene = useSandboxStore((s) => s.resetScene)
  const loadScene = useSandboxStore((s) => s.loadScene)
  const [isRunning, setIsRunning] = useState(true)

  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const stored = loadStoredScene()
    if (stored) {
      loadScene(stored)
    }
  }, [loadScene])

  useEffect(() => {
    const scene: SandboxScene = { items, gravity }
    saveScene(scene)
  }, [items, gravity])

  const handleExport = () => {
    exportScene({ items, gravity })
  }

  const handleImportClick = () => {
    fileInputRef.current?.click()
  }

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    try {
      const scene = await importScene(file)
      loadScene(scene)
    } catch {
      alert('导入失败：文件格式不正确')
    }
    e.target.value = ''
  }

  return (
    <div className="py-6">
      <div className="mb-4 flex items-start justify-between gap-4">
        <div>
          <h1 className="font-heading text-3xl text-text-primary">{t('nav.sandbox')}</h1>
          <p className="mt-2 text-text-secondary">{t('app.tagline')}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button
            size="sm"
            variant={isRunning ? 'secondary' : 'primary'}
            onClick={() => setIsRunning((r) => !r)}
            leftIcon={
              isRunning ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />
            }
          >
            {isRunning ? '暂停' : '运行'}
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={resetScene}
            leftIcon={<RotateCcw className="h-3.5 w-3.5" />}
          >
            重置
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={handleExport}
            leftIcon={<Download className="h-3.5 w-3.5" />}
          >
            导出
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={handleImportClick}
            leftIcon={<Upload className="h-3.5 w-3.5" />}
          >
            导入
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            accept="application/json"
            onChange={handleFileChange}
            className="hidden"
          />
        </div>
      </div>

      <div className="flex h-[72vh] gap-4">
        <div className="hidden w-56 flex-shrink-0 lg:block">
          <EquipmentPalette />
        </div>

        <div className="relative flex-1 overflow-hidden rounded-xl border border-border bg-paper-tertiary">
          <Scene cameraPosition={[8, 6, 8]} cameraView="free" showGrid>
            <PhysicsProvider config={{ gravity }} autoStep={isRunning}>
              <LabTable position={[0, 0, 0]} size={[6, 4]} height={0.8} />
              {items.map((item) => (
                <SandboxItemRenderer
                  key={item.id}
                  item={item}
                  selected={item.id === selectedId}
                  onClick={() => selectItem(item.id)}
                />
              ))}
            </PhysicsProvider>
          </Scene>

          {items.length === 0 && (
            <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
              <p className="rounded-lg border border-border bg-paper/90 px-4 py-2 text-sm text-text-tertiary shadow-sm">
                从左侧器材库添加器材开始搭建场景
              </p>
            </div>
          )}
        </div>

        <div className="hidden w-64 flex-shrink-0 md:block">
          <PropertiesPanel />
        </div>
      </div>

      <div className="mt-4 lg:hidden">
        <EquipmentPalette />
      </div>
      <div className="mt-4 md:hidden">
        <PropertiesPanel />
      </div>
    </div>
  )
}
