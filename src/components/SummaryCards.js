'use client'

function formatAmount(n) {
  return Math.abs(n).toLocaleString('th-TH', { minimumFractionDigits: 0, maximumFractionDigits: 2 })
}

function PlantIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22V10" />
      <path d="M7 14c-2-3 0-7 5-8" />
      <path d="M17 14c2-3 0-7-5-8" />
      <path d="M5 18c0-3 3-5 7-5" />
      <path d="M19 18c0-3-3-5-7-5" />
    </svg>
  )
}

function FlowerIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="3" />
      <path d="M12 2c1 3 1 5 0 7" />
      <path d="M12 15c-1 3-1 5 0 7" />
      <path d="M2 12c3-1 5-1 7 0" />
      <path d="M15 12c3 1 5 1 7 0" />
      <path d="M4.93 4.93c2.12 1.41 3.54 2.83 3.54 4.95" />
      <path d="M15.54 14.12c1.41 2.12 2.82 3.54 4.93 4.95" />
      <path d="M19.07 4.93c-2.12 1.41-3.54 2.83-3.54 4.95" />
      <path d="M8.46 14.12c-1.41 2.12-2.82 3.54-4.93 4.95" />
    </svg>
  )
}

export default function SummaryCards({ income = 0, expense = 0 }) {
  const balance = income - expense

  return (
    <div className="space-y-3 mb-5">
      {/* Balance card - full width, larger */}
      <div
        className="relative overflow-hidden rounded-2xl p-5 pb-4
                    bg-gradient-to-br from-[#fce7f3] via-[#fdf2f8] to-[#f9a8d4]
                    shadow-[0_4px_24px_-4px_rgba(249,168,212,0.35)]"
        style={{ transform: 'rotate(-0.3deg)' }}
      >
        {/* Decorative blob */}
        <div className="absolute -top-6 -right-6 w-28 h-28 bg-[#f9a8d4]/20 rounded-full blur-xl" />
        <div className="absolute bottom-1 left-4 w-16 h-16 bg-[#fbcfe8]/25 rounded-full blur-lg" />

        <p className="text-[13px] text-[#9d5c8a] font-medium mb-1 relative z-10">
          คงเหลือ
        </p>
        <p className={`text-3xl font-extrabold relative z-10 tracking-tight ${
          balance >= 0 ? 'text-[#6d3a5c]' : 'text-[#be185d]'
        }`}>
          {balance < 0 ? '-' : ''}฿{formatAmount(balance)}
        </p>
        <div className="mt-2 h-1 w-12 bg-[#f9a8d4]/50 rounded-full" />
      </div>

      {/* Income and Expense side by side */}
      <div className="grid grid-cols-2 gap-3">
        {/* Income */}
        <div
          className="rounded-2xl p-4 bg-[#d1fae5]/60 border border-[#a7f3d0]/40
                      shadow-[0_2px_12px_-2px_rgba(167,243,208,0.3)]"
          style={{ transform: 'rotate(0.4deg)' }}
        >
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-lg bg-[#a7f3d0]/50 flex items-center justify-center text-[#059669]">
              <PlantIcon />
            </div>
            <span className="text-[11px] text-[#047857] font-medium uppercase tracking-wider">
              รายรับ
            </span>
          </div>
          <p className="text-xl font-bold text-[#065f46]">
            +฿{formatAmount(income)}
          </p>
        </div>

        {/* Expense */}
        <div
          className="rounded-2xl p-4 bg-[#fce7f3]/50 border border-[#fbcfe8]/40
                      shadow-[0_2px_12px_-2px_rgba(252,231,243,0.3)]"
          style={{ transform: 'rotate(-0.5deg)' }}
        >
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-lg bg-[#fbcfe8]/50 flex items-center justify-center text-[#db2777]">
              <FlowerIcon />
            </div>
            <span className="text-[11px] text-[#9d174d] font-medium uppercase tracking-wider">
              รายจ่าย
            </span>
          </div>
          <p className="text-xl font-bold text-[#9d174d]">
            -฿{formatAmount(expense)}
          </p>
        </div>
      </div>
    </div>
  )
}
