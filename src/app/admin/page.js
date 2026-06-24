'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import DonutChart from '@/components/DonutChart'

export default function AdminPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [isAdmin, setIsAdmin] = useState(false)
  const [userLogs, setUserLogs] = useState([])
  const [transactions, setTransactions] = useState([])
  
  // Navigation Tabs
  const [mainTab, setMainTab] = useState('global') // 'global' | 'users'
  const [globalTab, setGlobalTab] = useState('expenses') // 'expenses' | 'incomes' | 'audit'
  const [expensePeriod, setExpensePeriod] = useState('monthly') // 'monthly' | 'yearly'

  // User Management Directory State
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedUserId, setSelectedUserId] = useState(null)

  // Verification & Fetching
  useEffect(() => {
    async function verifyAndFetch() {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) {
          router.replace('/login')
          return
        }

        // Check if user is in admins table
        const { data: adminData } = await supabase
          .from('admins')
          .select('id')
          .eq('id', user.id)
          .maybeSingle()

        if (!adminData) {
          router.replace('/dashboard')
          return
        }

        setIsAdmin(true)

        // Fetch logs
        const { data: logs, error: logsError } = await supabase
          .from('user_logs')
          .select('*')
          .order('created_at', { ascending: false })

        if (!logsError && logs) {
          setUserLogs(logs)
        }

        // Fetch all transactions
        const { data: txs, error: txsError } = await supabase
          .from('transactions')
          .select('*')

        if (!txsError && txs) {
          setTransactions(txs)
        }
      } catch (err) {
        console.error('Admin page initial load error:', err)
      } finally {
        setLoading(false)
      }
    }

    verifyAndFetch()
  }, [router])

  // Formatting currency
  const formatAmount = (num) => {
    return new Intl.NumberFormat('th-TH', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(num)
  }

  // Formatting date
  const formatDate = (dateStr, includeTime = true) => {
    if (!dateStr) return ''
    const d = new Date(dateStr)
    return d.toLocaleDateString('th-TH', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      ...(includeTime && { hour: '2-digit', minute: '2-digit' }),
    })
  }

  // 1. Process unique users from logs
  const getUniqueUsers = () => {
    const usersMap = new Map()
    
    // Sort logs chronologically to capture the first activity as creation date
    const sortedLogs = [...userLogs].sort((a, b) => new Date(a.created_at) - new Date(b.created_at))
    
    sortedLogs.forEach((log) => {
      if (log.user_id && log.email) {
        if (!usersMap.has(log.user_id)) {
          usersMap.set(log.user_id, {
            id: log.user_id,
            email: log.email,
            joinedAt: log.created_at, // capture earliest log time
          })
        }
      }
    })

    return Array.from(usersMap.values())
  }

  const allUsers = getUniqueUsers()

  // Filter users by search query
  const filteredUsers = allUsers.filter((u) =>
    u.email.toLowerCase().includes(searchQuery.toLowerCase())
  )

  // 2. Individual user analysis calculations
  const getSelectedUserDetails = () => {
    if (!selectedUserId) return null
    const user = allUsers.find((u) => u.id === selectedUserId)
    if (!user) return null

    const userTxs = transactions.filter((t) => t.user_id === selectedUserId)
    const userLogsFiltered = userLogs.filter((log) => log.user_id === selectedUserId)

    // Calculate personal totals
    const income = userTxs
      .filter((t) => t.type === 'income')
      .reduce((sum, t) => sum + (Number(t.amount) || 0), 0)

    const expense = userTxs
      .filter((t) => t.type === 'expense')
      .reduce((sum, t) => sum + (Number(t.amount) || 0), 0)

    const balance = income - expense

    // Log counts
    const logins = userLogsFiltered.filter((log) => log.action === 'login').length
    const visits = userLogsFiltered.filter((log) => log.action === 'visit').length

    // Personal Expense Donut Data
    const expenseGrouped = {}
    userTxs
      .filter((t) => t.type === 'expense')
      .forEach((t) => {
        if (!expenseGrouped[t.category]) {
          expenseGrouped[t.category] = { value: 0, count: 0 }
        }
        expenseGrouped[t.category].value += Number(t.amount) || 0
        expenseGrouped[t.category].count += 1
      })

    const expenseChart = Object.keys(expenseGrouped).map((cat) => ({
      name: cat,
      value: expenseGrouped[cat].value,
      count: expenseGrouped[cat].count,
    }))

    // Personal Income Donut Data
    const incomeGrouped = {}
    userTxs
      .filter((t) => t.type === 'income')
      .forEach((t) => {
        const sourceName = t.description ? t.description.trim() : t.category
        if (!incomeGrouped[sourceName]) {
          incomeGrouped[sourceName] = { value: 0, count: 0 }
        }
        incomeGrouped[sourceName].value += Number(t.amount) || 0
        incomeGrouped[sourceName].count += 1
      })

    const incomeChart = Object.keys(incomeGrouped).map((source) => ({
      name: source,
      value: incomeGrouped[source].value,
      count: incomeGrouped[source].count,
    }))

    // Personal transactions ordered by date desc and created_at desc
    const sortedTxs = [...userTxs].sort((a, b) => {
      const dateA = new Date(a.date)
      const dateB = new Date(b.date)
      if (dateA.getTime() !== dateB.getTime()) {
        return dateB - dateA
      }
      return new Date(b.created_at) - new Date(a.created_at)
    })

    return {
      email: user.email,
      joinedAt: user.joinedAt,
      income,
      expense,
      balance,
      logins,
      visits,
      expenseChart,
      incomeChart,
      transactions: sortedTxs,
    }
  }

  const selectedUser = getSelectedUserDetails()

  // 3. Process Global Traffic by hour
  const getTrafficData = () => {
    const traffic = { morning: 0, afternoon: 0, evening: 0, night: 0 }

    userLogs.forEach((log) => {
      const hour = new Date(log.created_at).getHours()
      if (hour >= 6 && hour < 12) {
        traffic.morning++
      } else if (hour >= 12 && hour < 18) {
        traffic.afternoon++
      } else if (hour >= 18 && hour < 24) {
        traffic.evening++
      } else {
        traffic.night++
      }
    })

    const totalLogs = userLogs.length || 1
    return [
      { name: 'เช้า (06:00 - 12:00)', count: traffic.morning, pct: (traffic.morning / totalLogs) * 100 },
      { name: 'บ่าย (12:00 - 18:00)', count: traffic.afternoon, pct: (traffic.afternoon / totalLogs) * 100 },
      { name: 'เย็น (18:00 - 24:00)', count: traffic.evening, pct: (traffic.evening / totalLogs) * 100 },
      { name: 'ดึก (00:00 - 06:00)', count: traffic.night, pct: (traffic.night / totalLogs) * 100 },
    ]
  }

  // 4. Process Global Expense Frequency Data
  const getGlobalExpenseChartData = () => {
    const now = new Date()
    const currentYear = now.getFullYear()
    const currentMonth = now.getMonth()

    const filteredExpenses = transactions.filter((t) => {
      if (t.type !== 'expense') return false
      const d = new Date(t.date)
      if (expensePeriod === 'monthly') {
        return d.getFullYear() === currentYear && d.getMonth() === currentMonth
      } else {
        return d.getFullYear() === currentYear
      }
    })

    const grouped = {}
    filteredExpenses.forEach((t) => {
      if (!grouped[t.category]) {
        grouped[t.category] = { value: 0, count: 0 }
      }
      grouped[t.category].value += Number(t.amount) || 0
      grouped[t.category].count += 1
    })

    return Object.keys(grouped).map((cat) => ({
      name: cat,
      value: grouped[cat].value,
      count: grouped[cat].count,
    }))
  }

  // 5. Process Global Income Sources
  const getGlobalIncomeChartData = () => {
    const incomes = transactions.filter((t) => t.type === 'income')
    const grouped = {}
    incomes.forEach((t) => {
      const sourceName = t.description ? t.description.trim() : t.category
      if (!grouped[sourceName]) {
        grouped[sourceName] = { value: 0, count: 0 }
      }
      grouped[sourceName].value += Number(t.amount) || 0
      grouped[sourceName].count += 1
    })

    return Object.keys(grouped).map((source) => ({
      name: source,
      value: grouped[source].value,
      count: grouped[source].count,
    }))
  }

  const trafficData = getTrafficData()
  const globalExpenseChartData = getGlobalExpenseChartData()
  const globalIncomeChartData = getGlobalIncomeChartData()

  // General counters
  const uniqueUsersCount = allUsers.length
  const registerCount = userLogs.filter((log) => log.action === 'register').length
  const loginCount = userLogs.filter((log) => log.action === 'login').length
  const visitCount = userLogs.filter((log) => log.action === 'visit').length

  if (loading) {
    return (
      <div className="min-h-screen bg-[#fffbeb] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-3 border-[#be185d] border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-gray-400 font-medium">กำลังโหลดข้อมูลแอดมิน...</p>
        </div>
      </div>
    )
  }

  if (!isAdmin) return null

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#fffbeb] via-[#fff7ed] to-[#fef3c7]/20 pb-16 relative overflow-hidden">
      {/* Decorative background blobs */}
      <div className="absolute rounded-full blur-3xl opacity-20 pointer-events-none" style={{ width: '350px', height: '350px', background: '#a7f3d0', top: '-100px', left: '-100px' }} />
      <div className="absolute rounded-full blur-3xl opacity-25 pointer-events-none" style={{ width: '350px', height: '350px', background: '#f9a8d4', bottom: '-50px', right: '-100px' }} />

      <div className="mx-auto max-w-6xl px-4 pt-6 relative z-10">
        
        {/* Top Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.push('/dashboard')}
              className="w-10 h-10 rounded-full bg-white shadow-sm flex items-center justify-center
                         hover:shadow-md hover:scale-105 active:scale-95 transition-all text-gray-500 border border-gray-100"
              title="กลับหน้าหลัก"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="19" y1="12" x2="5" y2="12" />
                <polyline points="12 19 5 12 12 5" />
              </svg>
            </button>
            <div>
              <span className="text-[10px] text-[#be185d] font-bold tracking-wider uppercase bg-[#fce7f3] px-2 py-0.5 rounded-full">แอดมิน</span>
              <h1 className="text-2xl font-extrabold text-gray-800 -mt-0.5">
                ระบบจัดการหลังบ้าน
              </h1>
            </div>
          </div>
          
          {/* Main 2-Level Navbar: Level 1 */}
          <div className="flex bg-white/70 backdrop-blur-md p-1 rounded-2xl border border-white/60 shadow-sm self-stretch sm:self-auto">
            <button
              onClick={() => setMainTab('global')}
              className={`flex-1 sm:flex-none px-5 py-2.5 rounded-xl text-xs font-bold transition-all duration-300
                ${mainTab === 'global'
                  ? 'bg-gradient-to-r from-[#f9a8d4] to-[#f472b6] text-white shadow-sm shadow-pink-200'
                  : 'text-gray-500 hover:text-gray-700'}`}
            >
              สถิติรวมของแอป
            </button>
            <button
              onClick={() => setMainTab('users')}
              className={`flex-1 sm:flex-none px-5 py-2.5 rounded-xl text-xs font-bold transition-all duration-300
                ${mainTab === 'users'
                  ? 'bg-gradient-to-r from-[#f9a8d4] to-[#f472b6] text-white shadow-sm shadow-pink-200'
                  : 'text-gray-500 hover:text-gray-700'}`}
            >
              ผู้ใช้งาน
            </button>
          </div>
        </div>

        {/* Global Summary Cards - only visible on MainTab Global */}
        {mainTab === 'global' && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-white/80 backdrop-blur-md p-4 rounded-2xl border border-white/50 shadow-sm">
              <p className="text-[11px] text-gray-400 font-bold uppercase">ผู้ใช้ทั้งหมดในระบบ</p>
              <p className="text-2xl font-extrabold text-[#be185d] mt-1">{uniqueUsersCount} คน</p>
            </div>
            <div className="bg-white/80 backdrop-blur-md p-4 rounded-2xl border border-white/50 shadow-sm">
              <p className="text-[11px] text-gray-400 font-bold uppercase">สมัครสมาชิกสะสม</p>
              <p className="text-2xl font-extrabold text-[#059669] mt-1">{registerCount} ครั้ง</p>
            </div>
            <div className="bg-white/80 backdrop-blur-md p-4 rounded-2xl border border-white/50 shadow-sm">
              <p className="text-[11px] text-gray-400 font-bold uppercase">การเข้าสู่ระบบ (Login)</p>
              <p className="text-2xl font-extrabold text-[#2563eb] mt-1">{loginCount} ครั้ง</p>
            </div>
            <div className="bg-white/80 backdrop-blur-md p-4 rounded-2xl border border-white/50 shadow-sm">
              <p className="text-[11px] text-gray-400 font-bold uppercase">เปิดใช้งานแอป (Visit)</p>
              <p className="text-2xl font-extrabold text-[#d97706] mt-1">{visitCount} ครั้ง</p>
            </div>
          </div>
        )}

        {/* ==================== TAB 1: GLOBAL APP STATS ==================== */}
        {mainTab === 'global' && (
          <div className="space-y-6">
            {/* Level 2 Sub Tabs Navbar */}
            <div className="flex flex-wrap gap-2 pb-1 border-b border-gray-200/60">
              <button
                onClick={() => setGlobalTab('expenses')}
                className={`px-4 py-2 rounded-full text-xs font-bold transition-all
                  ${globalTab === 'expenses'
                    ? 'bg-[#fce7f3] text-[#be185d] border border-[#fbcfe8]'
                    : 'bg-white/50 text-gray-500 hover:bg-white border border-transparent'}`}
              >
                สถิติหมวดหมู่รายจ่ายยอดนิยม
              </button>
              <button
                onClick={() => setGlobalTab('incomes')}
                className={`px-4 py-2 rounded-full text-xs font-bold transition-all
                  ${globalTab === 'incomes'
                    ? 'bg-[#fce7f3] text-[#be185d] border border-[#fbcfe8]'
                    : 'bg-white/50 text-gray-500 hover:bg-white border border-transparent'}`}
              >
                สถิติรายรับจัดอันดับผู้จ่าย
              </button>
              <button
                onClick={() => setGlobalTab('audit')}
                className={`px-4 py-2 rounded-full text-xs font-bold transition-all
                  ${globalTab === 'audit'
                    ? 'bg-[#fce7f3] text-[#be185d] border border-[#fbcfe8]'
                    : 'bg-white/50 text-gray-500 hover:bg-white border border-transparent'}`}
              >
                ประวัติกิจกรรมล่าสุดในระบบ (Audit Trail)
              </button>
            </div>

            {/* Sub-tab 1: Expense Donut Chart */}
            {globalTab === 'expenses' && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 bg-white/80 backdrop-blur-md p-6 rounded-3xl border border-white/60 shadow-sm">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h2 className="text-md font-bold text-gray-700">สถิติรวมรายจ่ายของแอป</h2>
                      <p className="text-[10px] text-gray-400">ภาพรวมค่าใช้จ่ายของผู้ใช้งานทุกคนในระบบรวมกัน</p>
                    </div>
                    {/* Toggle Period */}
                    <div className="flex bg-gray-100 p-0.5 rounded-lg text-[9px] font-bold">
                      <button
                        onClick={() => setExpensePeriod('monthly')}
                        className={`px-2.5 py-1 rounded-md transition-all ${expensePeriod === 'monthly' ? 'bg-white shadow-sm text-[#be185d]' : 'text-gray-400'}`}
                      >
                        รายเดือน
                      </button>
                      <button
                        onClick={() => setExpensePeriod('yearly')}
                        className={`px-2.5 py-1 rounded-md transition-all ${expensePeriod === 'yearly' ? 'bg-white shadow-sm text-[#be185d]' : 'text-gray-400'}`}
                      >
                        รายปี
                      </button>
                    </div>
                  </div>
                  <DonutChart data={globalExpenseChartData} title={expensePeriod === 'monthly' ? 'รายจ่ายรวมเดือนนี้' : 'รายจ่ายรวมปีนี้'} unit="บาท" />
                </div>

                {/* Side Traffic Widget */}
                <div className="bg-white/80 backdrop-blur-md p-6 rounded-3xl border border-white/60 shadow-sm h-fit">
                  <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-4">ช่วงเวลาเข้าใช้งานแอปสะสม</h3>
                  <div className="space-y-4">
                    {trafficData.map((t, index) => (
                      <div key={index} className="space-y-1">
                        <div className="flex justify-between text-xs">
                          <span className="font-semibold text-gray-600">{t.name}</span>
                          <span className="font-bold text-gray-800">{t.count} ครั้ง</span>
                        </div>
                        <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all duration-500"
                            style={{
                              width: `${t.pct}%`,
                              background: index === 0 ? '#f9a8d4' : index === 1 ? '#a7f3d0' : index === 2 ? '#c084fc' : '#93c5fd',
                            }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Sub-tab 2: Income Donut Chart */}
            {globalTab === 'incomes' && (
              <div className="bg-white/80 backdrop-blur-md p-6 rounded-3xl border border-white/60 shadow-sm">
                <div className="mb-4">
                  <h2 className="text-md font-bold text-gray-700">สถิติแหล่งที่มาของรายรับ (รวมทั้งระบบ)</h2>
                  <p className="text-[10px] text-gray-400">จัดอันดับตามแหล่งที่มาและผู้จ่ายเงิน เรียงลำดับจากสูงที่สุดลงมา</p>
                </div>
                <DonutChart data={globalIncomeChartData} title="รายรับรวมทั้งหมด" unit="บาท" />
              </div>
            )}

            {/* Sub-tab 3: Audit Trail Table */}
            {globalTab === 'audit' && (
              <div className="bg-white/80 backdrop-blur-md rounded-3xl border border-white/60 shadow-sm overflow-hidden">
                <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
                  <h3 className="text-xs font-bold text-gray-700 uppercase tracking-wider">บันทึกกิจกรรมล่าสุด</h3>
                  <span className="text-[9px] bg-[#fce7f3] text-[#be185d] font-bold px-2.5 py-0.5 rounded-full">
                    {userLogs.length} กิจกรรม
                  </span>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-gray-50/50 text-gray-400 font-semibold border-b border-gray-100">
                        <th className="px-5 py-3">เวลา</th>
                        <th className="px-5 py-3">อีเมล</th>
                        <th className="px-5 py-3">ประเภทกิจกรรม</th>
                        <th className="px-5 py-3 font-mono">User ID</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100/50 text-gray-600">
                      {userLogs.slice(0, 20).map((log, index) => (
                        <tr key={index} className="hover:bg-gray-50/30">
                          <td className="px-5 py-3.5 whitespace-nowrap font-medium">{formatDate(log.created_at)}</td>
                          <td className="px-5 py-3.5 font-bold text-gray-700">{log.email || 'ผู้เยี่ยมชม'}</td>
                          <td className="px-5 py-3.5">
                            <span className={`inline-block px-2 py-0.5 rounded-full text-[9px] font-bold
                              ${log.action === 'register' ? 'bg-green-50 text-green-600' :
                                log.action === 'login' ? 'bg-blue-50 text-blue-600' : 'bg-amber-50 text-amber-600'}`}>
                              {log.action === 'register' ? 'สมัครสมาชิกสำเร็จ' :
                               log.action === 'login' ? 'เข้าสู่ระบบสำเร็จ' : 'เยี่ยมชมแดชบอร์ด'}
                            </span>
                          </td>
                          <td className="px-5 py-3.5 font-mono text-[9px] text-gray-400 max-w-[120px] truncate">
                            {log.user_id || 'N/A'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ==================== TAB 2: USER DIRECTORY ==================== */}
        {mainTab === 'users' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            {/* Left Column: User List & Search */}
            <div className="bg-white/80 backdrop-blur-md p-5 rounded-3xl border border-white/60 shadow-sm flex flex-col h-[600px]">
              <h3 className="text-sm font-bold text-gray-700 mb-3">รายชื่อผู้ใช้งานระบบ</h3>
              
              {/* Search bar */}
              <div className="relative mb-4">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="11" cy="11" r="8" />
                    <line x1="21" y1="21" x2="16.65" y2="16.65" />
                  </svg>
                </span>
                <input
                  type="text"
                  placeholder="ค้นหาชื่ออีเมล..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-8 pr-4 py-2.5 rounded-xl border border-gray-200 text-xs text-gray-700
                             focus:outline-none focus:ring-2 focus:ring-[#f9a8d4]/30 focus:border-[#fbcfe8]
                             transition-all"
                />
              </div>

              {/* Users scroll container */}
              <div className="flex-1 overflow-y-auto pr-1 space-y-2">
                {filteredUsers.map((user) => {
                  const isSelected = selectedUserId === user.id
                  return (
                    <button
                      key={user.id}
                      onClick={() => setSelectedUserId(user.id)}
                      className={`w-full text-left p-3.5 rounded-2xl border transition-all duration-200 flex flex-col gap-1
                        ${isSelected
                          ? 'bg-[#fce7f3] border-[#fbcfe8] shadow-sm shadow-pink-100 scale-[1.01]'
                          : 'bg-white hover:bg-gray-50 border-gray-100 hover:border-gray-200'}`}
                    >
                      <p className="text-xs font-bold text-gray-800 truncate">{user.email}</p>
                      <p className="text-[9px] text-gray-400">สมัครเมื่อ: {formatDate(user.joinedAt, false)}</p>
                    </button>
                  )
                })}
                {filteredUsers.length === 0 && (
                  <div className="text-center py-12 text-gray-400 text-xs">
                    ไม่พบอีเมลผู้ใช้งานที่ค้นหา
                  </div>
                )}
              </div>
            </div>

            {/* Right Column: User Detail Profile */}
            <div className="md:col-span-2 h-[600px] flex flex-col">
              {!selectedUser ? (
                // Selected User Placeholder
                <div className="flex-1 bg-white/60 backdrop-blur-md rounded-3xl border border-white/50 shadow-sm flex flex-col items-center justify-center p-6 text-center">
                  <div className="w-16 h-16 rounded-full bg-[#fce7f3] flex items-center justify-center mb-4 text-[#be185d] shadow-sm shadow-pink-100">
                    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                      <circle cx="12" cy="7" r="4" />
                    </svg>
                  </div>
                  <h3 className="text-sm font-bold text-gray-700">ดูสถิติและประวัติรายบุคคล</h3>
                  <p className="text-xs text-gray-400 max-w-[280px] mt-1 leading-relaxed">
                    กรุณาเลือกผู้ใช้งานจากแถบรายชื่อด้านซ้าย เพื่อตรวจสอบประวัติกิจกรรม ยอดเงินสะสม กราฟDonut และรายงานธุรกรรมอย่างละเอียด
                  </p>
                </div>
              ) : (
                // Selected User Detail Display
                <div className="flex-1 bg-white/80 backdrop-blur-md rounded-3xl border border-white/60 shadow-sm p-6 overflow-y-auto space-y-6 flex flex-col">
                  
                  {/* User Profile Header */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-gray-100 pb-4 gap-2 flex-shrink-0">
                    <div>
                      <h2 className="text-md font-extrabold text-gray-800">{selectedUser.email}</h2>
                      <p className="text-[10px] text-gray-400 mt-0.5">
                        รหัส: <span className="font-mono">{selectedUserId}</span>
                      </p>
                    </div>
                    <div className="text-left sm:text-right">
                      <p className="text-[10px] text-[#059669] font-bold bg-green-50 px-2.5 py-0.5 rounded-full inline-block">
                        วันที่สมัคร: {formatDate(selectedUser.joinedAt)}
                      </p>
                    </div>
                  </div>

                  {/* Log counters & Finance overview */}
                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 flex-shrink-0">
                    <div className="bg-[#fffbeb] p-3 rounded-xl border border-[#fef3c7] text-center">
                      <p className="text-[9px] text-gray-400 font-bold uppercase">เข้าใช้แอป</p>
                      <p className="text-sm font-extrabold text-[#be185d] mt-0.5">{selectedUser.logins} ครั้ง</p>
                    </div>
                    <div className="bg-[#fffbeb] p-3 rounded-xl border border-[#fef3c7] text-center">
                      <p className="text-[9px] text-gray-400 font-bold uppercase">เปิดดูรายงาน</p>
                      <p className="text-sm font-extrabold text-[#d97706] mt-0.5">{selectedUser.visits} ครั้ง</p>
                    </div>
                    <div className="bg-[#fce7f3] p-3 rounded-xl border border-[#fbcfe8]/40 text-center sm:col-span-1">
                      <p className="text-[9px] text-gray-500 font-bold uppercase">คงเหลือ</p>
                      <p className="text-sm font-extrabold text-[#be185d] mt-0.5">฿{formatAmount(selectedUser.balance)}</p>
                    </div>
                    <div className="bg-emerald-50 p-3 rounded-xl border border-emerald-100/50 text-center">
                      <p className="text-[9px] text-[#065f46] font-bold uppercase">รายรับ</p>
                      <p className="text-sm font-extrabold text-[#065f46] mt-0.5">฿{formatAmount(selectedUser.income)}</p>
                    </div>
                    <div className="bg-rose-50 p-3 rounded-xl border border-rose-100/50 text-center">
                      <p className="text-[9px] text-[#9f1239] font-bold uppercase">รายจ่าย</p>
                      <p className="text-sm font-extrabold text-[#9f1239] mt-0.5">฿{formatAmount(selectedUser.expense)}</p>
                    </div>
                  </div>

                  {/* Personal Donut Charts Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 flex-shrink-0">
                    <div className="bg-white border border-gray-100 rounded-2xl p-4">
                      <h4 className="text-xs font-bold text-gray-600 mb-2">รายจ่ายส่วนตัวแยกหมวดหมู่</h4>
                      <DonutChart data={selectedUser.expenseChart} title="รายจ่ายส่วนตัว" unit="บาท" showRanking={true} />
                    </div>
                    <div className="bg-white border border-gray-100 rounded-2xl p-4">
                      <h4 className="text-xs font-bold text-gray-600 mb-2">รายรับส่วนตัวจัดอันดับผู้จ่าย</h4>
                      <DonutChart data={selectedUser.incomeChart} title="รายรับส่วนตัว" unit="บาท" showRanking={true} />
                    </div>
                  </div>

                  {/* Personal Transactions List Table */}
                  <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden flex-1 flex flex-col min-h-[250px]">
                    <div className="px-4 py-3 bg-gray-50/50 border-b border-gray-100 flex items-center justify-between flex-shrink-0">
                      <h4 className="text-xs font-bold text-gray-600">ประวัติรายการธุรกรรมส่วนตัว</h4>
                      <span className="text-[9px] text-gray-400">ทั้งหมด {selectedUser.transactions.length} รายการ</span>
                    </div>
                    
                    <div className="overflow-y-auto flex-1">
                      <table className="w-full text-left text-xs border-collapse">
                        <thead>
                          <tr className="text-gray-400 font-semibold border-b border-gray-100 bg-gray-50/20 text-[10px]">
                            <th className="px-4 py-2">วันที่</th>
                            <th className="px-4 py-2">หมวดหมู่</th>
                            <th className="px-4 py-2">รายละเอียด</th>
                            <th className="px-4 py-2 text-right">จำนวนเงิน</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100/50 text-gray-600">
                          {selectedUser.transactions.map((tx, idx) => (
                            <tr key={idx} className="hover:bg-gray-50/30">
                              <td className="px-4 py-2.5 whitespace-nowrap">{formatDate(tx.date, false)}</td>
                              <td className="px-4 py-2.5">{tx.category}</td>
                              <td className="px-4 py-2.5 truncate max-w-[150px]">{tx.description || tx.category}</td>
                              <td className={`px-4 py-2.5 text-right font-bold whitespace-nowrap
                                ${tx.type === 'income' ? 'text-emerald-600' : 'text-rose-600'}`}>
                                {tx.type === 'income' ? '+' : '-'}฿{formatAmount(tx.amount)}
                              </td>
                            </tr>
                          ))}
                          {selectedUser.transactions.length === 0 && (
                            <tr>
                              <td colSpan="4" className="text-center py-10 text-gray-400">ยังไม่มีรายการเงินเข้าออกในฐานข้อมูล</td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>

                </div>
              )}
            </div>

          </div>
        )}

      </div>
    </div>
  )
}
