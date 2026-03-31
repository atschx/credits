import { useState, useRef, useEffect, useCallback } from 'react'
import { createPortal } from 'react-dom'
import type { EntityStatus } from '../types'

// ---------------------------------------------------------------------------
// Style mappings
// ---------------------------------------------------------------------------

const colors: Record<EntityStatus, string> = {
  active: 'bg-green-100 text-green-700',
  draft: 'bg-yellow-100 text-yellow-700',
  archived: 'bg-gray-100 text-gray-600',
  suspended: 'bg-amber-100 text-amber-700',
  closed: 'bg-gray-200 text-gray-600',
}

const dotColors: Record<EntityStatus, string> = {
  active: 'bg-green-500',
  draft: 'bg-yellow-500',
  archived: 'bg-gray-400',
  suspended: 'bg-amber-500',
  closed: 'bg-gray-400',
}

const labels: Record<EntityStatus, string> = {
  active: '正常 Active',
  draft: '草稿 Draft',
  archived: '已归档 Archived',
  suspended: '已冻结 Frozen',
  closed: '已注销 Closed',
}

// ---------------------------------------------------------------------------
// Account lifecycle: transitions + capabilities
// ---------------------------------------------------------------------------

interface Transition {
  to: EntityStatus
  label: string
}

interface Capability {
  allowed: boolean
  label: string
}

interface StatusLifecycle {
  transitions: Transition[]
  capabilities: Capability[]
}

const accountLifecycle: Partial<Record<EntityStatus, StatusLifecycle>> = {
  active: {
    transitions: [
      { to: 'suspended', label: '冻结 Freeze' },
      { to: 'closed', label: '注销 Close' },
    ],
    capabilities: [
      { allowed: true, label: '可授予额度 Grant credits' },
      { allowed: true, label: '可消耗额度 Consume credits' },
      { allowed: true, label: '可调用 API API access' },
      { allowed: true, label: '可申请退款 Refund eligible' },
    ],
  },
  suspended: {
    transitions: [
      { to: 'active', label: '解冻 Reactivate' },
      { to: 'closed', label: '注销 Close' },
    ],
    capabilities: [
      { allowed: true, label: '可授予额度 Grant credits' },
      { allowed: false, label: '消耗已暂停 Consumption paused' },
      { allowed: false, label: 'API 已暂停 API paused' },
      { allowed: true, label: '余额保留 Balance preserved' },
    ],
  },
  closed: {
    transitions: [
      { to: 'active', label: '重新激活 Reactivate' },
    ],
    capabilities: [
      { allowed: false, label: '不可授予 Grants blocked' },
      { allowed: false, label: '不可消耗 Consumption blocked' },
      { allowed: false, label: '不可调用 API blocked' },
      { allowed: false, label: '余额已终止 Balance terminated' },
    ],
  },
}

const transitionDotColors: Partial<Record<EntityStatus, string>> = {
  active: 'bg-green-400',
  suspended: 'bg-amber-400',
  closed: 'bg-gray-400',
}

// ---------------------------------------------------------------------------
// Tooltip position helpers
// ---------------------------------------------------------------------------

interface TooltipPos {
  top: number
  left: number
  arrowSide: 'top' | 'bottom' | 'left'
  arrowOffset: number
}

function calcPosition(anchor: DOMRect, tooltip: DOMRect): TooltipPos {
  const gap = 8
  const pad = 12

  // Prefer below
  let top = anchor.bottom + gap
  let left = anchor.left + anchor.width / 2 - tooltip.width / 2
  let arrowSide: TooltipPos['arrowSide'] = 'top'

  // If overflows bottom, show above
  if (top + tooltip.height > window.innerHeight - pad) {
    top = anchor.top - tooltip.height - gap
    arrowSide = 'bottom'
  }

  // Clamp horizontally
  if (left < pad) left = pad
  if (left + tooltip.width > window.innerWidth - pad) {
    left = window.innerWidth - pad - tooltip.width
  }

  // If still clipped by left sidebar, show to the right
  if (left < pad) {
    left = anchor.right + gap
    top = anchor.top + anchor.height / 2 - tooltip.height / 2
    arrowSide = 'left'
  }

  const arrowOffset = anchor.left + anchor.width / 2 - left

  return { top, left, arrowSide, arrowOffset }
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

interface StatusBadgeProps {
  status: EntityStatus
  /** Show dot indicator before label */
  dot?: boolean
  /** Show account lifecycle hover tooltip */
  showTransitions?: boolean
}

export default function StatusBadge({ status, dot, showTransitions }: StatusBadgeProps) {
  const [hovered, setHovered] = useState(false)
  const [pos, setPos] = useState<TooltipPos | null>(null)
  const badgeRef = useRef<HTMLSpanElement>(null)
  const tooltipRef = useRef<HTMLDivElement>(null)
  const cls = colors[status] || 'bg-gray-100 text-gray-600'
  const label = labels[status] || status
  const lifecycle = showTransitions ? accountLifecycle[status] : undefined

  const updatePosition = useCallback(() => {
    if (!badgeRef.current || !tooltipRef.current) return
    const anchor = badgeRef.current.getBoundingClientRect()
    const tooltip = tooltipRef.current.getBoundingClientRect()
    setPos(calcPosition(anchor, tooltip))
  }, [])

  useEffect(() => {
    if (hovered) {
      // Defer so tooltip is rendered and measurable
      requestAnimationFrame(updatePosition)
    }
  }, [hovered, updatePosition])

  return (
    <span
      ref={badgeRef}
      className="relative inline-block"
      onMouseEnter={() => lifecycle && setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${cls} ${lifecycle ? 'cursor-default' : ''}`}>
        {dot && <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${dotColors[status] || 'bg-gray-400'}`} />}
        {label}
      </span>

      {/* Portal tooltip */}
      {lifecycle && hovered && createPortal(
        <div
          ref={tooltipRef}
          className="fixed z-[9999] animate-tooltip-in"
          style={pos ? { top: pos.top, left: pos.left } : { top: -9999, left: -9999 }}
          onMouseEnter={() => setHovered(true)}
          onMouseLeave={() => setHovered(false)}
        >
          <div className="relative bg-gray-900 text-white rounded-lg shadow-xl px-3.5 py-3 whitespace-nowrap text-xs">
            {/* Arrow */}
            {pos && pos.arrowSide === 'top' && (
              <span
                className="absolute -top-1.5 w-3 h-3 bg-gray-900 rotate-45 rounded-sm"
                style={{ left: Math.max(12, Math.min(pos.arrowOffset - 6, 280)) }}
              />
            )}
            {pos && pos.arrowSide === 'bottom' && (
              <span
                className="absolute -bottom-1.5 w-3 h-3 bg-gray-900 rotate-45 rounded-sm"
                style={{ left: Math.max(12, Math.min(pos.arrowOffset - 6, 280)) }}
              />
            )}
            {pos && pos.arrowSide === 'left' && (
              <span className="absolute top-1/2 -translate-y-1/2 -left-1.5 w-3 h-3 bg-gray-900 rotate-45 rounded-sm" />
            )}

            {/* Capabilities */}
            <div className="text-[10px] text-gray-400 uppercase tracking-wider mb-1.5">当前状态 Current State</div>
            <div className="flex flex-col gap-1">
              {lifecycle.capabilities.map((cap) => (
                <span key={cap.label} className="flex items-center gap-2">
                  {cap.allowed ? (
                    <span className="text-green-400 text-[11px]">●</span>
                  ) : (
                    <span className="text-red-400 text-[11px]">✗</span>
                  )}
                  <span className={cap.allowed ? 'text-gray-200' : 'text-gray-500'}>{cap.label}</span>
                </span>
              ))}
            </div>

            {/* Divider */}
            <div className="border-t border-gray-700 my-2" />

            {/* Transitions */}
            <div className="text-[10px] text-gray-400 uppercase tracking-wider mb-1.5">可切换状态 Transitions</div>
            <div className="flex flex-col gap-1.5">
              {lifecycle.transitions.map((t) => (
                <span key={t.to} className="flex items-center gap-2">
                  <span className="flex items-center gap-1">
                    <span className={`w-1.5 h-1.5 rounded-full ${dotColors[status]}`} />
                    <span className="text-gray-400">{labels[status]?.split(' ')[0]}</span>
                  </span>
                  <span className="text-gray-500">→</span>
                  <span className="flex items-center gap-1">
                    <span className={`w-1.5 h-1.5 rounded-full ${transitionDotColors[t.to] || 'bg-gray-400'}`} />
                    <span className="text-white font-medium">{t.label}</span>
                  </span>
                </span>
              ))}
            </div>
          </div>
        </div>,
        document.body,
      )}
    </span>
  )
}
