import {
  BadgeCheck, Barcode, ChartLine, ChartNoAxesGantt, CircleCheck, Columns2, Gauge, Heading, Hexagon, Image, LayoutList,
  MessageSquareWarning, Minus, MoveVertical, Pilcrow, QrCode, Ruler, SeparatorHorizontal, Signature, SquareStack, Table,
  type LucideIcon,
} from 'lucide-react'
import { blockInfo } from '../lib/blocks'
import type { BlockType } from '../lib/types'

const ICONS: Record<string, LucideIcon> = {
  Heading, Pilcrow, MessageSquareWarning, LayoutList, Table, Ruler, BadgeCheck, CircleCheck, ChartLine, Gauge,
  ChartNoAxesGantt, Image, Hexagon, QrCode, Barcode, Signature, Columns2, SquareStack, Minus, MoveVertical, SeparatorHorizontal,
}

export function BlockIcon({ type, size = 15 }: { type: BlockType; size?: number }) {
  const I = ICONS[blockInfo(type).icon] ?? Pilcrow
  return <I size={size} strokeWidth={1.75} />
}
