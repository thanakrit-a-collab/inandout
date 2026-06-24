'use client'

import { useState } from 'react'

const PASTEL_COLORS = [
  '#f9a8d4', // Soft Pink
  '#a7f3d0', // Mint Green
  '#c084fc', // Soft Purple
  '#fde047', // Light Yellow
  '#93c5fd', // Soft Blue
  '#fed7aa', // Peach
  '#cbd5e1', // Soft Gray
  '#a5f3fc', // Soft Cyan
]

const polarToCartesian = (centerX, centerY, radius, angleInDegrees) => {
  const angleInRadians = ((angleInDegrees - 90) * Math.PI) / 180.0
  return {
    x: centerX + radius * Math.cos(angleInRadians),
    y: centerY + radius * Math.sin(angleInRadians),
  }
}

export default function DonutChart({ data = [], title = '', unit = 'บาท', showRanking = true }) {
  const [hoveredIndex, setHoveredIndex] = useState(null)

  // Filter out zero or negative values
  const validData = data.filter((item) => item.value > 0)
  const total = validData.reduce((sum, item) => sum + item.value, 0)

  // SVG parameters
  const cx = 150
  const cy = 150
  const ri = 65 // Inner radius
  const ro = 100 // Outer radius
  const hoverExtraRadius = 8 // Extra outer radius on hover
  const shiftDistance = 6 // Shift slice outward on hover

  // Calculations for slices
  let accumulatedPercent = 0
  const slices = validData.map((item, index) => {
    const value = item.value
    const percent = total > 0 ? value / total : 0
    const startAngle = accumulatedPercent * 360
    accumulatedPercent += percent
    const endAngle = accumulatedPercent * 360

    // Prevent full 360 angle issue by limiting to 359.99
    const displayEndAngle = endAngle - startAngle >= 360 ? startAngle + 359.99 : endAngle

    return {
      ...item,
      percent,
      startAngle,
      endAngle: displayEndAngle,
      color: PASTEL_COLORS[index % PASTEL_COLORS.length],
    }
  })

  // Format amount to currency
  const formatAmount = (num) => {
    return new Intl.NumberFormat('th-TH', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(num)
  }

  // Draw slice path
  const getSlicePath = (slice, isHovered) => {
    const start = slice.startAngle
    const end = slice.endAngle
    const activeRo = isHovered ? ro + hoverExtraRadius : ro

    const x1_out = polarToCartesian(cx, cy, activeRo, start)
    const x2_out = polarToCartesian(cx, cy, activeRo, end)
    const x2_in = polarToCartesian(cx, cy, ri, end)
    const x1_in = polarToCartesian(cx, cy, ri, start)

    const largeArcFlag = end - start > 180 ? 1 : 0

    return `
      M ${x1_out.x} ${x1_out.y}
      A ${activeRo} ${activeRo} 0 ${largeArcFlag} 1 ${x2_out.x} ${x2_out.y}
      L ${x2_in.x} ${x2_in.y}
      A ${ri} ${ri} 0 ${largeArcFlag} 0 ${x1_in.x} ${x1_in.y}
      Z
    `
  }

  return (
    <div className="flex flex-col sm:flex-row items-center justify-center gap-6 p-4 bg-white rounded-3xl shadow-sm border border-gray-100/60">
      {/* SVG Chart */}
      <div className="relative w-[300px] h-[300px] flex-shrink-0">
        {total === 0 ? (
          <div className="absolute inset-0 flex items-center justify-center flex-col">
            <svg width="200" height="200" viewBox="0 0 200 200">
              <circle cx="100" cy="100" r="75" fill="none" stroke="#f3f4f6" strokeWidth="30" />
            </svg>
            <p className="absolute text-xs text-gray-400 font-medium">ไม่มีข้อมูล</p>
          </div>
        ) : (
          <svg width="300" height="300" viewBox="0 0 300 300" className="overflow-visible">
            {/* Background drop shadow filter */}
            <defs>
              <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
                <feDropShadow dx="0" dy="4" stdDeviation="6" floodColor="#000000" floodOpacity="0.04" />
              </filter>
            </defs>

            {/* Slices */}
            {slices.map((slice, index) => {
              const isHovered = hoveredIndex === index
              const middleAngle = slice.startAngle + (slice.endAngle - slice.startAngle) / 2
              const middleAngleRad = ((middleAngle - 90) * Math.PI) / 180.0
              
              const tx = isHovered ? shiftDistance * Math.cos(middleAngleRad) : 0
              const ty = isHovered ? shiftDistance * Math.sin(middleAngleRad) : 0

              return (
                <g
                  key={index}
                  onMouseEnter={() => setHoveredIndex(index)}
                  onMouseLeave={() => setHoveredIndex(null)}
                  style={{
                    transform: `translate(${tx}px, ${ty}px)`,
                    transition: 'transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)',
                  }}
                >
                  <path
                    d={getSlicePath(slice, isHovered)}
                    fill={slice.color}
                    style={{
                      transition: 'd 0.3s ease, fill-opacity 0.2s ease',
                      fillOpacity: hoveredIndex === null || isHovered ? 1 : 0.82,
                      cursor: 'pointer',
                    }}
                  />
                </g>
              )
            })}

            {/* Central circle */}
            <circle
              cx={cx}
              cy={cy}
              r={ri - 2}
              fill="#ffffff"
              filter="url(#shadow)"
            />

            {/* Central Label */}
            <g transform={`translate(${cx}, ${cy})`} textAnchor="middle" style={{ pointerEvents: 'none' }}>
              <text
                y="-10"
                style={{
                  fontFamily: 'Nunito, sans-serif',
                  fontSize: '11px',
                  fontWeight: 600,
                  fill: '#9ca3af',
                  letterSpacing: '0.05em',
                }}
              >
                {hoveredIndex !== null ? slices[hoveredIndex].name : title || 'ยอดรวม'}
              </text>
              <text
                y="12"
                style={{
                  fontFamily: 'Nunito, sans-serif',
                  fontSize: '15px',
                  fontWeight: 800,
                  fill: '#4a3728',
                }}
              >
                {hoveredIndex !== null
                  ? `${formatAmount(slices[hoveredIndex].value)}`
                  : `${formatAmount(total)}`}
              </text>
              <text
                y="27"
                style={{
                  fontFamily: 'Nunito, sans-serif',
                  fontSize: '9px',
                  fontWeight: 500,
                  fill: '#a3a3a3',
                }}
              >
                {hoveredIndex !== null
                  ? `${(slices[hoveredIndex].percent * 100).toFixed(1)}%`
                  : unit}
              </text>
            </g>
          </svg>
        )}
      </div>

      {/* Rankings / Legend */}
      {showRanking && slices.length > 0 && (
        <div className="flex-1 w-full max-h-[250px] overflow-y-auto pr-1">
          <p className="text-xs font-bold text-gray-500 mb-2">จัดอันดับข้อมูล</p>
          <div className="space-y-2">
            {slices
              .sort((a, b) => b.value - a.value)
              .map((slice, index) => {
                const isHovered = hoveredIndex !== null && slices[hoveredIndex]?.name === slice.name
                return (
                  <div
                    key={index}
                    className={`flex items-center justify-between p-2 rounded-xl transition-all duration-200
                      ${isHovered ? 'bg-[#fff7ed] scale-[1.02]' : 'hover:bg-gray-50'}`}
                    onMouseEnter={() => {
                      const idx = slices.findIndex(s => s.name === slice.name)
                      if (idx !== -1) setHoveredIndex(idx)
                    }}
                    onMouseLeave={() => setHoveredIndex(null)}
                  >
                    <div className="flex items-center gap-2">
                      <div
                        className="w-3 h-3 rounded-full flex-shrink-0"
                        style={{ backgroundColor: slice.color }}
                      />
                      <span className="text-xs font-semibold text-gray-700 truncate max-w-[130px]">
                        {slice.name}
                      </span>
                      {slice.count && (
                        <span className="text-[10px] text-gray-400">
                          ({slice.count} ครั้ง)
                        </span>
                      )}
                    </div>
                    <div className="text-right">
                      <p className="text-xs font-extrabold text-[#4a3728]">
                        ฿{formatAmount(slice.value)}
                      </p>
                      <p className="text-[9px] text-gray-400">
                        {(slice.percent * 100).toFixed(1)}%
                      </p>
                    </div>
                  </div>
                )
              })}
          </div>
        </div>
      )}
    </div>
  )
}
