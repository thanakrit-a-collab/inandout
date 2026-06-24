'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import MonthSelector from '@/components/MonthSelector'
import SummaryCards from '@/components/SummaryCards'
import TransactionList from '@/components/TransactionList'
import AddTransaction from '@/components/AddTransaction'

function getMonthRange(date) {
  const y = date.getFullYear()
  const m = date.getMonth()
  const start = new Date(y, m, 1)
  const end = new Date(y, m + 1, 0, 23, 59, 59)
  const fmt = (d) =>
    d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0')
  return { start: fmt(start), end: fmt(end) }
}
export default function DashboardPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [isAdmin, setIsAdmin] = useState(false)
  const [currentMonth, setCurrentMonth] = useState(() => {
    const now = new Date()
    return new Date(now.getFullYear(), now.getMonth(), 1)
  })
  const [transactions, setTransactions] = useState([])
  const [showAdd, setShowAdd] = useState(false)

  // Auth check
  useEffect(() => {
    async function checkAuth() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.replace('/login')
      } else {
        // Log visit event
        await supabase.from('user_logs').insert({
          user_id: user.id,
          email: user.email,
          action: 'visit'
        })

        // Check if user is admin
        const { data: adminData } = await supabase
          .from('admins')
          .select('id')
          .eq('id', user.id)
          .maybeSingle()

        if (adminData) {
          setIsAdmin(true)
        }

        setLoading(false)
      }
    }
    checkAuth()
  }, [router])

  const fetchTransactions = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { start, end } = getMonthRange(currentMonth)

    const { data, error } = await supabase
      .from('transactions')
      .select('*')
      .eq('user_id', user.id)
      .gte('date', start)
      .lte('date', end)
      .order('date', { ascending: false })

    if (!error && data) {
      setTransactions(data)
    }
  }, [currentMonth])

  useEffect(() => {
    if (!loading) {
      fetchTransactions()
    }
  }, [loading, fetchTransactions])

  // Calculate totals
  const income = transactions
    .filter((t) => t.type === 'income')
    .reduce((sum, t) => sum + (Number(t.amount) || 0), 0)

  const expense = transactions
    .filter((t) => t.type === 'expense')
    .reduce((sum, t) => sum + (Number(t.amount) || 0), 0)

  if (loading) {
    return (
      <div className="min-h-screen bg-[#fffbeb] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-3 border-[#f9a8d4] border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-gray-400 font-medium">กำลังโหลด...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#fffbeb] via-[#fff7ed] to-[#fef3c7]/30">
      <div className="mx-auto max-w-lg px-4 pt-6 pb-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-xs text-gray-400 font-medium">สวัสดี</p>
            <h1 className="text-xl font-extrabold text-gray-800 -mt-0.5"
                style={{ letterSpacing: '-0.02em' }}>
              สรุปรายรับรายจ่าย
            </h1>
          </div>

          <div className="flex items-center gap-2">
            {isAdmin && (
              <button
                onClick={() => router.push('/admin')}
                className="w-9 h-9 rounded-full bg-[#fce7f3] shadow-sm flex items-center justify-center
                           hover:shadow-md active:scale-90 transition-all text-[#be185d] border border-[#fbcfe8]"
                title="ระบบหลังบ้าน"
                aria-label="ระบบหลังบ้าน"
              >
                <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="3" width="7" height="9" />
                  <rect x="14" y="3" width="7" height="5" />
                  <rect x="14" y="12" width="7" height="9" />
                  <rect x="3" y="16" width="7" height="5" />
                </svg>
              </button>
            )}

            {/* Logout button */}
            <button
              onClick={async () => {
                await supabase.auth.signOut()
                router.replace('/login')
              }}
              className="w-9 h-9 rounded-full bg-white shadow-sm flex items-center justify-center
                         hover:shadow-md active:scale-90 transition-all"
              aria-label="ออกจากระบบ"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4" />
                <polyline points="16 17 21 12 16 7" />
                <line x1="21" y1="12" x2="9" y2="12" />
              </svg>
            </button>
          </div>
        </div>

        <MonthSelector
          currentMonth={currentMonth}
          onMonthChange={setCurrentMonth}
          transactionCount={transactions.length}
        />

        <SummaryCards income={income} expense={expense} />

        <TransactionList transactions={transactions} />
      </div>

      {/* Floating add button */}
      <button
        onClick={() => setShowAdd(true)}
        className="fixed bottom-6 left-1/2 -translate-x-1/2 z-30
                   w-14 h-14 rounded-full
                   bg-gradient-to-br from-[#f9a8d4] to-[#ec4899]
                   shadow-[0_4px_20px_-2px_rgba(236,72,153,0.45)]
                   flex items-center justify-center
                   hover:shadow-[0_6px_28px_-2px_rgba(236,72,153,0.55)]
                   active:scale-90 transition-all duration-200"
        aria-label="เพิ่มรายการ"
      >
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round">
          <line x1="12" y1="5" x2="12" y2="19" />
          <line x1="5" y1="12" x2="19" y2="12" />
        </svg>
      </button>

      <AddTransaction
        isOpen={showAdd}
        onClose={() => setShowAdd(false)}
        onSaved={fetchTransactions}
      />
    </div>
  )
}
