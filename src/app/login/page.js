'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleLogin(e) {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const { data, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (authError) {
        if (authError.message.includes('Invalid login credentials')) {
          setError('อีเมลหรือรหัสผ่านไม่ถูกต้อง')
        } else if (authError.message.includes('Email not confirmed')) {
          setError('กรุณายืนยันอีเมลของคุณก่อนเข้าสู่ระบบ')
        } else {
          setError('เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง')
        }
        setLoading(false)
        return
      }

      // Log the login event
      if (data?.user) {
        await supabase.from('user_logs').insert({
          user_id: data.user.id,
          email: data.user.email,
          action: 'login'
        })
      }

      router.push('/dashboard')
    } catch {
      setError('ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้ กรุณาลองใหม่')
      setLoading(false)
    }
  }

  return (
    <div className="relative min-h-screen overflow-hidden" style={{ background: '#fffbeb' }}>
      {/* Decorative blobs */}
      <div
        className="absolute rounded-full blur-3xl opacity-40"
        style={{
          width: '340px',
          height: '340px',
          background: '#f9a8d4',
          top: '-60px',
          right: '-80px',
        }}
      />
      <div
        className="absolute rounded-full blur-3xl opacity-30"
        style={{
          width: '280px',
          height: '280px',
          background: '#a7f3d0',
          bottom: '40px',
          left: '-90px',
        }}
      />
      <div
        className="absolute rounded-full blur-2xl opacity-20"
        style={{
          width: '180px',
          height: '180px',
          background: '#fce7f3',
          top: '50%',
          left: '60%',
        }}
      />
      <div
        className="absolute rounded-full blur-2xl opacity-25"
        style={{
          width: '120px',
          height: '120px',
          background: '#d1fae5',
          top: '15%',
          left: '10%',
        }}
      />

      {/* Main content */}
      <div className="relative z-10 flex min-h-screen items-center justify-center px-5 py-12">
        <div
          className="w-full max-w-sm"
          style={{ marginTop: '-24px' }}
        >
          {/* Logo / decorative mark */}
          <div className="flex justify-center" style={{ marginBottom: '28px' }}>
            <div
              className="flex items-center justify-center rounded-2xl"
              style={{
                width: '56px',
                height: '56px',
                background: 'linear-gradient(135deg, #f9a8d4 0%, #fce7f3 100%)',
                boxShadow: '0 4px 14px rgba(249, 168, 212, 0.35)',
              }}
            >
              <svg width="28" height="28" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path
                  d="M14 3C14 3 6 7 6 14C6 18.5 9 22 14 25C19 22 22 18.5 22 14C22 7 14 3 14 3Z"
                  stroke="#be185d"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  fill="none"
                />
                <circle cx="14" cy="13" r="3" stroke="#be185d" strokeWidth="1.5" fill="none" />
              </svg>
            </div>
          </div>

          {/* Card */}
          <div
            className="rounded-3xl p-7"
            style={{
              background: 'rgba(255, 255, 255, 0.82)',
              backdropFilter: 'blur(12px)',
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.06), 0 2px 8px rgba(0, 0, 0, 0.03)',
              border: '1px solid rgba(255, 255, 255, 0.6)',
            }}
          >
            <h1
              className="text-center font-bold"
              style={{
                fontFamily: 'Nunito, sans-serif',
                fontSize: '1.65rem',
                color: '#4a3728',
                marginBottom: '6px',
                letterSpacing: '-0.01em',
              }}
            >
              {'เข้าสู่ระบบ'}
            </h1>
            <p
              className="text-center"
              style={{
                fontFamily: 'Nunito, sans-serif',
                fontSize: '0.88rem',
                color: '#9a8478',
                marginBottom: '28px',
              }}
            >
              {'จัดการรายจ่ายของคุณอย่างง่ายดาย'}
            </p>

            {error && (
              <div
                className="rounded-xl text-center"
                style={{
                  fontFamily: 'Nunito, sans-serif',
                  fontSize: '0.82rem',
                  color: '#be185d',
                  background: '#fce7f3',
                  padding: '10px 14px',
                  marginBottom: '18px',
                  border: '1px solid rgba(249, 168, 212, 0.3)',
                }}
              >
                {error}
              </div>
            )}

            <form onSubmit={handleLogin}>
              <div style={{ marginBottom: '16px' }}>
                <label
                  htmlFor="email"
                  className="block"
                  style={{
                    fontFamily: 'Nunito, sans-serif',
                    fontSize: '0.82rem',
                    fontWeight: 600,
                    color: '#6b5c50',
                    marginBottom: '6px',
                    paddingLeft: '2px',
                  }}
                >
                  {'อีเมล'}
                </label>
                <input
                  id="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="w-full rounded-xl outline-none transition-all duration-200"
                  style={{
                    fontFamily: 'Nunito, sans-serif',
                    fontSize: '0.9rem',
                    color: '#4a3728',
                    background: '#fef3c7',
                    border: '1.5px solid transparent',
                    padding: '11px 14px',
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = '#f9a8d4'
                    e.target.style.boxShadow = '0 0 0 3px rgba(249, 168, 212, 0.15)'
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = 'transparent'
                    e.target.style.boxShadow = 'none'
                  }}
                />
              </div>

              <div style={{ marginBottom: '24px' }}>
                <label
                  htmlFor="password"
                  className="block"
                  style={{
                    fontFamily: 'Nunito, sans-serif',
                    fontSize: '0.82rem',
                    fontWeight: 600,
                    color: '#6b5c50',
                    marginBottom: '6px',
                    paddingLeft: '2px',
                  }}
                >
                  {'รหัสผ่าน'}
                </label>
                <input
                  id="password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="........"
                  className="w-full rounded-xl outline-none transition-all duration-200"
                  style={{
                    fontFamily: 'Nunito, sans-serif',
                    fontSize: '0.9rem',
                    color: '#4a3728',
                    background: '#fef3c7',
                    border: '1.5px solid transparent',
                    padding: '11px 14px',
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = '#f9a8d4'
                    e.target.style.boxShadow = '0 0 0 3px rgba(249, 168, 212, 0.15)'
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = 'transparent'
                    e.target.style.boxShadow = 'none'
                  }}
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-xl font-bold transition-all duration-200 active:scale-95"
                style={{
                  fontFamily: 'Nunito, sans-serif',
                  fontSize: '0.95rem',
                  color: '#ffffff',
                  background: loading
                    ? '#ddb8c8'
                    : 'linear-gradient(135deg, #f9a8d4 0%, #f472b6 100%)',
                  padding: '12px 0',
                  border: 'none',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  boxShadow: '0 4px 14px rgba(244, 114, 182, 0.3)',
                  letterSpacing: '0.02em',
                }}
                onMouseEnter={(e) => {
                  if (!loading) {
                    e.target.style.transform = 'translateY(-2px) scale(1.02)'
                    e.target.style.boxShadow = '0 6px 20px rgba(244, 114, 182, 0.4)'
                  }
                }}
                onMouseLeave={(e) => {
                  e.target.style.transform = 'translateY(0) scale(1)'
                  e.target.style.boxShadow = '0 4px 14px rgba(244, 114, 182, 0.3)'
                }}
              >
                {loading ? 'กำลังเข้าสู่ระบบ...' : 'เข้าสู่ระบบ'}
              </button>
            </form>
          </div>

          {/* Register link */}
          <p
            className="text-center"
            style={{
              fontFamily: 'Nunito, sans-serif',
              fontSize: '0.85rem',
              color: '#9a8478',
              marginTop: '22px',
            }}
          >
            {'ยังไม่มีบัญชี? '}
            <Link
              href="/register"
              className="font-semibold transition-colors duration-200"
              style={{ color: '#f472b6' }}
              onMouseEnter={(e) => { e.target.style.color = '#be185d' }}
              onMouseLeave={(e) => { e.target.style.color = '#f472b6' }}
            >
              {'สมัครเลย'}
            </Link>
          </p>
        </div>
      </div>

      <style jsx>{`
        @keyframes float-slow {
          0%, 100% { transform: translate(0, 0) rotate(0deg); }
          33% { transform: translate(8px, -12px) rotate(1deg); }
          66% { transform: translate(-6px, 6px) rotate(-1deg); }
        }
        div.absolute.rounded-full {
          animation: float-slow 14s ease-in-out infinite;
        }
        div.absolute.rounded-full:nth-child(2) {
          animation-delay: -4s;
          animation-duration: 18s;
        }
        div.absolute.rounded-full:nth-child(3) {
          animation-delay: -8s;
          animation-duration: 22s;
        }
        div.absolute.rounded-full:nth-child(4) {
          animation-delay: -2s;
          animation-duration: 16s;
        }
      `}</style>
    </div>
  )
}
