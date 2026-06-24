'use client'

const THAI_MONTHS = [
  'ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.',
  'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.',
]

function toBuddhistYear(year) {
  return year + 543
}

export default function MonthSelector({ currentMonth, onMonthChange, transactionCount = 0 }) {
  const month = currentMonth.getMonth()
  const year = currentMonth.getFullYear()

  function goPrev() {
    const d = new Date(year, month - 1, 1)
    onMonthChange(d)
  }

  function goNext() {
    const d = new Date(year, month + 1, 1)
    onMonthChange(d)
  }

  return (
    <div className="flex items-center justify-between px-1 py-3">
      <div className="flex items-center gap-1">
        <button
          onClick={goPrev}
          className="w-9 h-9 rounded-full bg-white flex items-center justify-center
                     shadow-sm hover:shadow-md active:scale-90 transition-all duration-200"
          aria-label="เดือนก่อน"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </button>

        <div className="px-4 py-1.5 min-w-[140px] text-center">
          <span className="text-[15px] font-bold text-gray-700 tracking-wide">
            {THAI_MONTHS[month]} {toBuddhistYear(year)}
          </span>
        </div>

        <button
          onClick={goNext}
          className="w-9 h-9 rounded-full bg-white flex items-center justify-center
                     shadow-sm hover:shadow-md active:scale-90 transition-all duration-200"
          aria-label="เดือนถัดไป"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="9 18 15 12 9 6" />
          </svg>
        </button>
      </div>

      <div className="bg-[#fce7f3] text-[#d946a8] text-xs font-semibold px-3 py-1 rounded-full mr-1">
        {transactionCount} รายการ
      </div>
    </div>
  )
}
