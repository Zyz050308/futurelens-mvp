import Link from 'next/link';
import HeroAnimationCanvas from '@/components/HeroAnimationCanvas';

export default function HeroAnimationPage() {
  return (
    <main className="min-h-screen bg-[#F5F5F7] flex items-center justify-center py-10 px-4">
      {/* 深色能量装置卡片 */}
      <div
        className="relative overflow-hidden"
        style={{
          width: '760px',
          maxWidth: '92vw',
          height: '520px',
          maxHeight: '70vh',
          borderRadius: '28px',
          background:
            'radial-gradient(ellipse at center, #0B0D12 0%, #080A0F 55%, #06080C 100%)',
          boxShadow:
            '0 30px 80px -20px rgba(0,0,0,0.5), 0 8px 24px -8px rgba(255,149,0,0.08), inset 0 1px 0 rgba(255,255,255,0.04)',
          border: '1px solid rgba(255,255,255,0.05)',
        }}
      >
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            borderRadius: '28px',
            background:
              'linear-gradient(180deg, rgba(255,255,255,0.04) 0%, rgba(255,255,255,0) 30%)',
          }}
        />
        <HeroAnimationCanvas />
      </div>

      {/* 右下角返回首页（低调） */}
      <div className="fixed bottom-6 right-6 z-10">
        <Link
          href="/"
          className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white border border-[#E5E7EB] text-xs text-[#6B7280] shadow-sm hover:text-[#1D1D1F] transition-colors"
        >
          ← 返回首页
        </Link>
      </div>
    </main>
  );
}
