'use client'

import { useState, useEffect, useRef } from 'react'
import { supabase } from '@/lib/supabase'

const EXPENSE_CATEGORIES = ['อาหาร', 'ช้อปปิ้ง', 'เดินทาง', 'ค่าน้ำไฟ', 'สุขภาพ', 'บันเทิง', 'อื่นๆ']
const INCOME_CATEGORIES = ['เงินเดือน', 'งานพิเศษ', 'โบนัส', 'อื่นๆ']

function todayStr() {
  const d = new Date()
  return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0')
}

export default function AddTransaction({ isOpen, onClose, onSaved }) {
  const [type, setType] = useState('expense')
  const [amount, setAmount] = useState('')
  const [category, setCategory] = useState('')
  const [description, setDescription] = useState('')
  const [date, setDate] = useState(todayStr)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const panelRef = useRef(null)

  const categories = type === 'income' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES

  useEffect(() => {
    if (isOpen) {
      setType('expense')
      setAmount('')
      setCategory('')
      setDescription('')
      setDate(todayStr())
      setError('')
    }
  }, [isOpen])

  // Set default category when type changes
  useEffect(() => {
    setCategory(categories[0])
  }, [type])

  // Close on outside click
  useEffect(() => {
    function handleClick(e) {
      if (panelRef.current && !panelRef.current.contains(e.target)) {
        onClose()
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClick)
      return () => document.removeEventListener('mousedown', handleClick)
    }
  }, [isOpen, onClose])

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')

    const parsedAmount = parseFloat(amount)
    if (!parsedAmount || parsedAmount <= 0) {
      setError('กรุณาระบุจำนวนเงิน')
      return
    }

    setSaving(true)

    try {
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        setError('กรุณาเข้าสู่ระบบก่อน')
        setSaving(false)
        return
      }

      const { error: insertError } = await supabase
        .from('transactions')
        .insert({
          user_id: user.id,
          type,
          amount: parsedAmount,
          category,
          description: description.trim() || category,
          date,
        })

      if (insertError) {
        setError('บันทึกไม่สำเร็จ ลองอีกครั้ง')
        setSaving(false)
        return
      }

      onSaved()
      onClose()
    } catch {
      setError('เกิดข้อผิดพลาด ลองอีกครั้ง')
    } finally {
      setSaving(false)
    }
  }

  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 bg-black/25 backdrop-blur-[2px] z-40 transition-opacity duration-300
          ${isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
      />

      {/* Panel */}
      <div
        ref={panelRef}
        className={`fixed bottom-0 left-0 right-0 z-50 transition-transform duration-500
          ${isOpen ? 'translate-y-0' : 'translate-y-full'}`}
        style={{ transitionTimingFunction: 'cubic-bezier(0.34, 1.56, 0.64, 1)' }}
      >
        <div className="mx-auto max-w-lg bg-white rounded-t-3xl shadow-[0_-8px_40px_-4px_rgba(0,0,0,0.12)] px-5 pt-4 pb-8">
          {/* Handle bar */}
          <div className="flex justify-center mb-4">
            <div className="w-10 h-1 rounded-full bg-gray-200" />
          </div>

          <h2 className="text-lg font-bold text-gray-700 mb-4">เพิ่มรายการ</h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Type toggle */}
            <div className="flex bg-gray-100 rounded-xl p-1 gap-1">
              <button
                type="button"
                onClick={() => setType('expense')}
                className={`flex-1 py-2.5 rounded-lg text-sm font-semibold transition-all duration-300
                  ${type === 'expense'
                    ? 'bg-[#fce7f3] text-[#be185d] shadow-sm'
                    : 'text-gray-400 hover:text-gray-500'
                  }`}
              >
                รายจ่าย
              </button>
              <button
                type="button"
                onClick={() => setType('income')}
                className={`flex-1 py-2.5 rounded-lg text-sm font-semibold transition-all duration-300
                  ${type === 'income'
                    ? 'bg-[#d1fae5] text-[#065f46] shadow-sm'
                    : 'text-gray-400 hover:text-gray-500'
                  }`}
              >
                รายรับ
              </button>
            </div>

            {/* Amount */}
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1.5 ml-1">จำนวนเงิน</label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 text-sm font-medium">
                  ฿
                </span>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0.00"
                  className="w-full pl-8 pr-4 py-3 rounded-xl bg-[#fffbeb] border border-[#fef3c7]
                             text-gray-700 text-lg font-semibold
                             focus:outline-none focus:ring-2 focus:ring-[#f9a8d4]/40 focus:border-[#f9a8d4]
                             transition-all placeholder:text-gray-300"
                />
              </div>
            </div>

            {/* Category */}
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1.5 ml-1">หมวดหมู่</label>
              <div className="flex flex-wrap gap-2">
                {categories.map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setCategory(cat)}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-200
                      ${category === cat
                        ? (type === 'expense'
                            ? 'bg-[#fce7f3] text-[#be185d] shadow-sm ring-1 ring-[#f9a8d4]'
                            : 'bg-[#d1fae5] text-[#065f46] shadow-sm ring-1 ring-[#a7f3d0]')
                        : 'bg-gray-50 text-gray-400 hover:bg-gray-100'
                      }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            {/* Description */}
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1.5 ml-1">รายละเอียด</label>
              <input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="เพิ่มโน้ต (ไม่จำเป็น)"
                className="w-full px-4 py-2.5 rounded-xl bg-white border border-gray-200
                           text-sm text-gray-700
                           focus:outline-none focus:ring-2 focus:ring-[#f9a8d4]/30 focus:border-[#fbcfe8]
                           transition-all placeholder:text-gray-300"
              />
            </div>

            {/* Date */}
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1.5 ml-1">วันที่</label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl bg-white border border-gray-200
                           text-sm text-gray-700
                           focus:outline-none focus:ring-2 focus:ring-[#f9a8d4]/30 focus:border-[#fbcfe8]
                           transition-all"
              />
            </div>

            {/* Error */}
            {error && (
              <p className="text-xs text-[#e11d48] font-medium bg-[#ffe4e6] px-3 py-2 rounded-lg">
                {error}
              </p>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={saving}
              className={`w-full py-3.5 rounded-xl font-bold text-sm shadow-md
                         transition-all duration-300 active:scale-[0.97]
                ${type === 'expense'
                  ? 'bg-gradient-to-r from-[#f9a8d4] to-[#ec4899] text-white shadow-pink-200/50 hover:shadow-lg hover:shadow-pink-200/60'
                  : 'bg-gradient-to-r from-[#a7f3d0] to-[#34d399] text-[#065f46] shadow-green-200/50 hover:shadow-lg hover:shadow-green-200/60'
                }
                disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              {saving ? 'กำลังบันทึก...' : 'บันทึกรายการ'}
            </button>
          </form>
        </div>
      </div>
    </>
  )
}
