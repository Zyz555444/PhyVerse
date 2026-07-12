import {
  Box,
  Circle,
  Cylinder,
  Cone,
  Square,
  Hexagon,
  Spline,
  LucideIcon,
} from 'lucide-react'
import { useSandboxStore, type SandboxShape } from './sandboxStore'
import { cn } from '@/shared/utils/cn'

interface PaletteItem {
  shape: SandboxShape
  label: string
  icon: LucideIcon
}

const paletteItems: PaletteItem[] = [
  { shape: 'box', label: '长方体', icon: Box },
  { shape: 'sphere', label: