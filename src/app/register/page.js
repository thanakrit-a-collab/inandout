'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'

export default function RegisterPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleRegister(e) {
    e.preventDefault()
    setError('')
    setSuccess('')

    if (password !== confirmPassword) {
      setError('รหัสผ่านไม่ตรงกัน กรุณากรอกใหม่')
      return
    }

    if (password.length < 6) {
      setError('รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร')
      return
    }

    setLoading(true)

    try {
      const { data, error: authError } = await supabase.auth.signUp({
        email,
        password,
      })

      console.log('signUp result:', { data, authError })

      if (authError) {
        console.error('Auth error:', authError.message, authError.status)
        if (authError.message.includes('already registered')) {
          setError('อีเมลนี้ถูกใช้งานแล้ว')
        } else if (authError.message.includes('valid email')) {
          setError('กรุณากรอกอีเมลให้ถูกต้อง')
        } else if (authError.message.includes('at least')) {
          setError('รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร')
        } else if (authError.message.includes('not authorized') || authError.message.includes('signup_disabled')) {
          setError('ระบบสมัครสมาชิกถูกปิดอยู่ กรุณาเปิดใน Supabase Dashboard')
        } else if (authError.message.includes('rate limit') || authError.message.includes('rate_limit')) {
          setError('ส่งอีเมลเกินขีดจำกัดแล้ว (Email rate limit exceeded) กรุณาเข้าไปปิดตัวเลือก "Confirm email" ในเมนู Authentication > Providers > Email บน Supabase Dashboard เพื่อเปิดให้สมัครสมาชิกและใช้งานได้ทันทีโดยไม่ต้องยืนยันอีเมล')
        } else {
          setError('เกิดข้อผิดพลาด: ' + authError.message)
        }
        setLoading(false)
        return
      }

      // Log the registration event
      if (data?.user) {
        await supabase.from('user_logs').insert({
          user_id: data.user.id,
          email: data.user.email,
          action: 'register'
        })
      }

      setSuccess('สมัครสมาชิกสำเร็จ! กำลังเข้าสู่ระบบและนำคุณไปยังหน้าแดชบอร์ด...')
      setEmail('')
      setPassword('')
      setConfirmPassword('')
      setTimeout(() => {
        router.push('/dashboard')
      }, 1500)
    } catch {
      setError('ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้ กรุณาลองใหม่')
    }

    setLoading(false)
  }

  return (
    <div className="relative min-h-screen overflow-hidden" style={{ background: '#fffbeb' }}>
      {/* Decorative blobs */}
      <div
        className="absolute rounded-full blur-3xl opacity-35"
        style={{
          width: '300px',
          height: '300px',
          background: '#a7f3d0',
          top: '-50px',
          left: '-70px',
        }}
      />
      <div
        className="absolute rounded-full blur-3xl opacity-40"
        style={{
          width: '260px',
          height: '260px',
          background: '#f9a8d4',
          bottom: '60px',
          right: '-60px',
        }}
      />
      <div
        className="absolute rounded-full blur-2xl opacity-25"
        style={{
          width: '160px',
          height: '160px',
          background: '#d1fae5',
          top: '40%',
          right: '15%',
        }}
      />
      <div
        className="absolute rounded-full blur-2xl opacity-20"
        style={{
          width: '140px',
          height: '140px',
          background: '#fce7f3',
          bottom: '30%',
          left: '12%',
        }}
      />

      {/* Main content */}
      <div className="relative z-10 flex min-h-screen items-center justify-center px-5 py-12">
        <div
          className="w-full max-w-sm"
          style={{ marginTop: '-16px' }}
        >
          {/* Logo / decorative mark */}
          <div className="flex justify-center" style={{ marginBottom: '28px' }}>
            <div
              className="flex items-center justify-center rounded-2xl"
              style={{
                width: '56px',
                height: '56px',
                background: 'linear-gradient(135deg, #a7f3d0 0%, #d1fae5 100%)',
                boxShadow: '0 4px 14px rgba(167, 243, 208, 0.4)',
              }}
            >
              <svg width="28" height="28" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path
                  d="M7 14L12 19L21 9"
                  stroke="#047857"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  fill="none"
                />
                <rect
                  x="4"
                  y="4"
                  width="20"
                  height="20"
                  rx="6"
                  stroke="#047857"
                  strokeWidth="1.5"
                  fill="none"
                />
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
              {'สมัครสมาชิก'}
            </h1>
            <p
              className="text-center"
              style={{
                fontFamily: 'Nunito, sans-serif',
                fontSize: '0.88rem',
                color: '#9a8478',
                marginBottom: '26px',
              }}
            >
              {'สร้างบัญชีเพื่อเริ่มติดตามรายจ่าย'}
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

            {success && (
              <div
                className="rounded-xl text-center"
                style={{
                  fontFamily: 'Nunito, sans-serif',
                  fontSize: '0.82rem',
                  color: '#047857',
                  background: '#d1fae5',
                  padding: '10px 14px',
                  marginBottom: '18px',
                  border: '1px solid rgba(167, 243, 208, 0.4)',
                }}
              >
                {success}
              </div>
            )}

            <form onSubmit={handleRegister}>
              <div style={{ marginBottom: '14px' }}>
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
                    e.target.style.borderColor = '#a7f3d0'
                    e.target.style.boxShadow = '0 0 0 3px rgba(167, 243, 208, 0.2)'
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = 'transparent'
                    e.target.style.boxShadow = 'none'
                  }}
                />
              </div>

              <div style={{ marginBottom: '14px' }}>
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
                    e.target.style.borderColor = '#a7f3d0'
                    e.target.style.boxShadow = '0 0 0 3px rgba(167, 243, 208, 0.2)'
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = 'transparent'
                    e.target.style.boxShadow = 'none'
                  }}
                />
              </div>

              <div style={{ marginBottom: '22px' }}>
                <label
                  htmlFor="confirmPassword"
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
                  {'ยืนยันรหัสผ่าน'}
                </label>
                <input
                  id="confirmPassword"
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
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
                    e.target.style.borderColor = '#a7f3d0'
                    e.target.style.boxShadow = '0 0 0 3px rgba(167, 243, 208, 0.2)'
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
                    ? '#a3d4c0'
                    : 'linear-gradient(135deg, #a7f3d0 0%, #34d399 100%)',
                  padding: '12px 0',
                  border: 'none',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  boxShadow: '0 4px 14px rgba(52, 211, 153, 0.3)',
                  letterSpacing: '0.02em',
                }}
                onMouseEnter={(e) => {
                  if (!loading) {
                    e.target.style.transform = 'translateY(-2px) scale(1.02)'
                    e.target.style.boxShadow = '0 6px 20px rgba(52, 211, 153, 0.4)'
                  }
                }}
                onMouseLeave={(e) => {
                  e.target.style.transform = 'translateY(0) scale(1)'
                  e.target.style.boxShadow = '0 4px 14px rgba(52, 211, 153, 0.3)'
                }}
              >
                {loading ? 'กำลังสมัคร...' : 'สมัครสมาชิก'}
              </button>
            </form>
          </div>

          {/* Login link */}
          <p
            className="text-center"
            style={{
              fontFamily: 'Nunito, sans-serif',
              fontSize: '0.85rem',
              color: '#9a8478',
              marginTop: '22px',
            }}
          >
            {'มีบัญชีแล้ว? '}
            <Link
              href="/login"
              className="font-semibold transition-colors duration-200"
              style={{ color: '#34d399' }}
              onMouseEnter={(e) => { e.target.style.color = '#047857' }}
              onMouseLeave={(e) => { e.target.style.color = '#34d399' }}
            >
              {'เข้าสู่ระบบ'}
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
          animation-delay: -5s;
          animation-duration: 20s;
        }
        div.absolute.rounded-full:nth-child(3) {
          animation-delay: -9s;
          animation-duration: 24s;
        }
        div.absolute.rounded-full:nth-child(4) {
          animation-delay: -3s;
          animation-duration: 17s;
        }
      `}</style>
    </div>
  )
}
