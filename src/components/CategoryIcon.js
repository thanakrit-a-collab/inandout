'use client'

const icons = {
  'อาหาร': (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 14.5c0 3.5 3.5 6 9 6s9-2.5 9-6" />
      <path d="M3 14.5c0-2 2-3.5 5-4" />
      <path d="M21 14.5c0-2-2-3.5-5-4" />
      <ellipse cx="12" cy="10.5" rx="9" ry="3.5" />
      <line x1="8" y1="5" x2="8" y2="3.5" />
      <line x1="12" y1="4" x2="12" y2="2" />
      <line x1="16" y1="5" x2="16" y2="3.5" />
    </svg>
  ),
  'ช้อปปิ้ง': (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z" />
      <line x1="3" y1="6" x2="21" y2="6" />
      <path d="M16 10a4 4 0 01-8 0" />
    </svg>
  ),
  'เดินทาง': (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="8" width="20" height="10" rx="3" />
      <path d="M6 8V6a2 2 0 012-2h2" />
      <path d="M18 8V6a2 2 0 00-2-2h-2" />
      <circle cx="7" cy="18" r="2.5" />
      <circle cx="17" cy="18" r="2.5" />
      <line x1="9.5" y1="18" x2="14.5" y2="18" />
      <line x1="6" y1="12" x2="10" y2="12" />
    </svg>
  ),
  'ค่าน้ำไฟ': (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 21h6" />
      <path d="M10 21v-1.5a1 1 0 011-1h2a1 1 0 011 1V21" />
      <path d="M12 3C8.5 3 6 6.5 6 9.5c0 2 .8 3.5 2 4.5a4 4 0 001 2.5h6a4 4 0 001-2.5c1.2-1 2-2.5 2-4.5C18 6.5 15.5 3 12 3z" />
      <path d="M10 13.5h4" />
      <path d="M12 10v3.5" />
    </svg>
  ),
  'สุขภาพ': (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z" />
    </svg>
  ),
  'บันเทิง': (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 18V5l12-2v13" />
      <circle cx="6" cy="18" r="3" />
      <circle cx="18" cy="16" r="3" />
    </svg>
  ),
  'เงินเดือน': (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="6" width="20" height="14" rx="3" />
      <path d="M2 10h20" />
      <path d="M17 4H7" />
      <rect x="5" y="14" width="4" height="3" rx="0.5" />
    </svg>
  ),
  'งานพิเศษ': (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="7" width="20" height="14" rx="2" />
      <polyline points="2 7 12 13 22 7" />
      <path d="M17 3H7a2 2 0 00-2 2v2h14V5a2 2 0 00-2-2z" />
    </svg>
  ),
  'โบนัส': (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 12 20 22 4 22 4 12" />
      <rect x="2" y="7" width="20" height="5" rx="1" />
      <line x1="12" y1="22" x2="12" y2="7" />
      <path d="M12 7H7.5a2.5 2.5 0 010-5C11 2 12 7 12 7z" />
      <path d="M12 7h4.5a2.5 2.5 0 000-5C13 2 12 7 12 7z" />
    </svg>
  ),
  'อื่นๆ': (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
    </svg>
  ),
}

const categoryColors = {
  'อาหาร': { bg: 'bg-[#fce7f3]', text: 'text-[#d946a8]' },
  'ช้อปปิ้ง': { bg: 'bg-[#fef3c7]', text: 'text-[#d97706]' },
  'เดินทาง': { bg: 'bg-[#d1fae5]', text: 'text-[#059669]' },
  'ค่าน้ำไฟ': { bg: 'bg-[#e0e7ff]', text: 'text-[#6366f1]' },
  'สุขภาพ': { bg: 'bg-[#ffe4e6]', text: 'text-[#e11d48]' },
  'บันเทิง': { bg: 'bg-[#f3e8ff]', text: 'text-[#9333ea]' },
  'เงินเดือน': { bg: 'bg-[#d1fae5]', text: 'text-[#059669]' },
  'งานพิเศษ': { bg: 'bg-[#dbeafe]', text: 'text-[#2563eb]' },
  'โบนัส': { bg: 'bg-[#fef3c7]', text: 'text-[#d97706]' },
  'อื่นๆ': { bg: 'bg-[#fce7f3]', text: 'text-[#ec4899]' },
}

export default function CategoryIcon({ category, className = '' }) {
  const icon = icons[category] || icons['อื่นๆ']
  const colors = categoryColors[category] || categoryColors['อื่นๆ']

  return (
    <div className={`w-10 h-10 rounded-xl ${colors.bg} ${colors.text} flex items-center justify-center flex-shrink-0 ${className}`}>
      <div className="w-5 h-5">
        {icon}
      </div>
    </div>
  )
}
