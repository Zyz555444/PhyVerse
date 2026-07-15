import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { useSandboxStore } from './sandboxStore'

const DRAG_THRESHOLD = 4

export function BoxSelection() {
  const { gl, camera, size } = useThree()
  const selectItem = useSandboxStore((s) => s.selectItem)
  const selectItems = useSandboxStore((s) => s.selectItems)
  const items = useSandboxStore((s) => s.items)

  const [dragging, setDragging] = useState(false)
  const [rect, setRect] = useState<{
    left: number
    top: number
    width: number
    height: number
  } | null>(null)
  const startRef = useRef<{ x: number; y: number } | null>(null)
  const multiRef = useRef(false)

  const parent = gl.domElement.parentElement

  useEffect(() => {
    const dom = gl.domElement
    if (!parent) return

    const getPoint = (e: PointerEvent) => {
      const rect = dom.getBoundingClientRect()
      return { x: e.clientX - rect.left, y: e.clientY - rect.top }
    }

    const handlePointerDown = (e: PointerEvent) => {
      if (e.button !== 0) return
      if (e.target !== dom) return
      startRef.current = getPoint(e)
      multiRef.current = e.ctrlKey || e.metaKey || e.shiftKey
      setDragging(true)
      setRect({ left: startRef.current.x, top: startRef.current.y, width: 0, height: 0 })
    }

    const handlePointerMove = (e: PointerEvent) => {
      if (!startRef.current) return
      const point = getPoint(e)
      setRect({
        left: Math.min(startRef.current.x, point.x),
        top: Math.min(startRef.current.y, point.y),
        width: Math.abs(point.x - startRef.current.x),
        height: Math.abs(point.y - startRef.current.y),
      })
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
      setDragging(false)
      setRect(null)
    }

    dom.addEventListener('pointerdown', handlePointerDown)
    window.addEventListener('pointermove', handlePointerMove)
    window.addEventListener('pointerup', handlePointerUp)
    return () => {
      dom.removeEventListener('pointerdown', handlePointerDown)
      window.removeEventListener('pointermove', handlePointerMove)
      window.removeEventListener('pointerup', handlePointerUp)
    }
  }, [gl, camera, size, items, selectItem, selectItems, parent])

  if (!dragging || !rect || !parent) return null

  return createPortal(
    <div
      className="pointer-events-none absolute z-10 rounded-sm border border-accent bg-accent-soft/20"
      style={{
        left: rect.left,
        top: rect.top,
        width: rect.width,
        height: rect.height,
      }}
    />,
    parent
  )
}
