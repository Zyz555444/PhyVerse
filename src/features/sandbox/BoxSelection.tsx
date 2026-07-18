import { useCallback, useEffect, useRef } from 'react'
import { useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { useSandboxStore } from './sandboxStore'

const DRAG_THRESHOLD = 4

export function BoxSelection() {
  const { gl, camera, size } = useThree()
  const selectItem = useSandboxStore((s) => s.selectItem)
  const selectItems = useSandboxStore((s) => s.selectItems)
  const items = useSandboxStore((s) => s.items)

  const startRef = useRef<{ x: number; y: number } | null>(null)
  const multiRef = useRef(false)
  const overlayRef = useRef<HTMLDivElement | null>(null)

  const createOverlay = useCallback(() => {
    if (overlayRef.current) return overlayRef.current
    overlayRef.current = document.createElement('div')
    overlayRef.current.className =
      'pointer-events-none absolute z-10 rounded-sm border border-accent bg-accent-soft/20'
    return overlayRef.current
  }, [])

  const removeOverlay = useCallback(() => {
    if (overlayRef.current) {
      overlayRef.current.remove()
      overlayRef.current = null
    }
  }, [])

  const updateOverlay = useCallback(
    (x1: number, y1: number, x2: number, y2: number) => {
      const el = createOverlay()
      const parent = gl.domElement.parentElement
      if (!parent || !parent.contains(el)) {
        parent?.appendChild(el)
      }
      Object.assign(el.style, {
        left: `${Math.min(x1, x2)}px`,
        top: `${Math.min(y1, y2)}px`,
        width: `${Math.abs(x2 - x1)}px`,
        height: `${Math.abs(y2 - y1)}px`,
      })
    },
    [gl, createOverlay]
  )

  const getPoint = useCallback(
    (e: PointerEvent) => {
      const rect = gl.domElement.getBoundingClientRect()
      return { x: e.clientX - rect.left, y: e.clientY - rect.top }
    },
    [gl]
  )

  useEffect(() => {
    const dom = gl.domElement

    const handlePointerDown = (e: PointerEvent) => {
      if (e.button !== 0) return
      if (e.target !== dom) return
      startRef.current = getPoint(e)
      multiRef.current = e.ctrlKey || e.metaKey || e.shiftKey
      updateOverlay(startRef.current.x, startRef.current.y, startRef.current.x, startRef.current.y)
    }

    const handlePointerMove = (e: PointerEvent) => {
      if (!startRef.current) return
      const point = getPoint(e)
      updateOverlay(startRef.current.x, startRef.current.y, point.x, point.y)
    }

    const handlePointerUp = (e: PointerEvent) => {
      if (!startRef.current) return
      const point = getPoint(e)
      const dx = point.x - startRef.current.x
      const dy = point.y - startRef.current.y
      const isClick = Math.hypot(dx, dy) < DRAG_THRESHOLD

      if (isClick) {
        if (!multiRef.current) {
          selectItem(null)
        }
      } else {
        const minX = Math.min(startRef.current.x, point.x)
        const minY = Math.min(startRef.current.y, point.y)
        const maxX = Math.max(startRef.current.x, point.x)
        const maxY = Math.max(startRef.current.y, point.y)

        const selectedIds: string[] = []
        const temp = new THREE.Vector3()
        items.forEach((item) => {
          temp.set(item.position[0], item.position[1], item.position[2])
          temp.project(camera)
          const screenX = ((temp.x + 1) / 2) * size.width
          const screenY = ((-temp.y + 1) / 2) * size.height
          if (screenX >= minX && screenX <= maxX && screenY >= minY && screenY <= maxY) {
            selectedIds.push(item.id)
          }
        })

        if (selectedIds.length > 0) {
          if (multiRef.current) {
            selectItems(selectedIds, true)
          } else {
            selectItems(selectedIds, false)
          }
        } else if (!multiRef.current) {
          selectItem(null)
        }
      }

      startRef.current = null
      removeOverlay()
    }

    dom.addEventListener('pointerdown', handlePointerDown)
    window.addEventListener('pointermove', handlePointerMove)
    window.addEventListener('pointerup', handlePointerUp)
    return () => {
      dom.removeEventListener('pointerdown', handlePointerDown)
      window.removeEventListener('pointermove', handlePointerMove)
      window.removeEventListener('pointerup', handlePointerUp)
      removeOverlay()
    }
  }, [gl, camera, size, items, selectItem, selectItems, getPoint, updateOverlay, removeOverlay])

  return null
}
