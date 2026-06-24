'use client'

import { useEffect, useState } from 'react'
import CategoryIcon from '@/components/CategoryIcon'

function formatAmount(n) {
  return Math.abs(n).toLocaleString('th-TH', { minimumFractionDigits: 0, maximumFractionDigits: 2 })
}

function formatDate(dateStr) {
  const d = new Date(dateStr)
  const day = d.getDate()
  const months = ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.']
  return `${day} ${months[d.getMonth()]}`
}

export default function TransactionList({ transactions = [] }) {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 60)
    return () => clearTimeout(t)
  }, [])

  if (transactions.length === 0) {
    return (
      <div className="py-12 text-center">
        <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-[#fef3c7]/60 flex items-center justify-center">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#d97706" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
            <polyline points="14 2 14 8 20 8" />
            <line x1="9" y1="13" x2="15" y2="13" />
            <line x1="9" y1="17" x2="12" y2="17" />
          </svg>
        </div>
        <p className="text-sm text-gray-400 font-medium">ยังไม่มีรายการ</p>
        <p className="text-xs text-gray-300 mt-1">กดปุ่ม + เพื่อเพิ่มรายการ</p>
      </div>
    )
  }

  return (
    <div className="mt-1 mb-28">
      <div className="flex items-center justify-between mb-3 px-1">
        <h2 className="text-[15px] font-bold text-gray-700">รายการล่าสุด</h2>
        <div className="h-px flex-1 ml-3 bg-gradient-to-r from-[#f9a8d4]/40 to-transparent" />
      </div>

      <div className="space-y-2">
        {transactions.map((tx, i) => {
          const isIncome = tx.type === 'income'
          return (
            <div
              key={tx.id || i}
              className="flex items-center gap-3 bg-white rounded-xl px-3.5 py-3
                         shadow-[0_1px_8px_-2px_rgba(0,0,0,0.06)] border border-gray-50
                         hover:shadow-md transition-all duration-300"
              style={{
                opacity: mounted ? 1 : 0,
                transform: mounted ? 'translateY(0)' : 'translateY(12px)',
                transition: `all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1) ${i * 60}ms`,
              }}
            >
              <CategoryIcon category={tx.category} />

              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-700 truncate">
                  {tx.description || tx.category}
                </p>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className="text-[11px] text-gray-400">{formatDate(tx.date)}</span>
                  <span className="w-1 h-1 rounded-full bg-gray-200" />
                  <span className="text-[11px] text-gray-400">{tx.category}</span>
                </div>
              </div>

              <p className={`text-sm font-bold whitespace-nowrap ${
                isIncome ? 'text-[#059669]' : 'text-[#e11d48]'
              }`}>
                {isIncome ? '+' : '-'}฿{formatAmount(tx.amount)}
              </p>
            </div>
          )
        })}
      </div>
    </div>
  )
}
