export default function HeroQuestionsVisual() {
  return (
    <div className="relative w-full h-[560px] overflow-hidden bg-[#F5F5F3]">
      {/* 中心品牌 */}
      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-center">
        <h1 className="font-bold text-[#FF9500] tracking-tight" style={{ fontSize: 52, letterSpacing: '-0.04em' }}>
          FutureLens
        </h1>
        <p className="font-medium text-[#9CA3AF] mt-[14px]" style={{ fontSize: 15 }}>
          看见问题背后的问题
        </p>
      </div>
      
      {/* 问题文字 */}
      <div className="absolute left-[8%] top-[16%]">
        <span className="font-medium text-[#9CA3AF] whitespace-nowrap" style={{ fontSize: 15, opacity: 0.7 }}>
          考研还是就业？
        </span>
      </div>
      
      <div className="absolute left-[68%] top-[14%]">
        <span className="font-medium text-[#9CA3AF] whitespace-nowrap" style={{ fontSize: 15, opacity: 0.7 }}>
          AI会取代设计师吗？
        </span>
      </div>
      
      <div className="absolute left-[6%] top-[44%]">
        <span className="font-medium text-[#9CA3AF] whitespace-nowrap" style={{ fontSize: 15, opacity: 0.7 }}>
          出国还有必要吗？
        </span>
      </div>
      
      <div className="absolute left-[76%] top-[42%]">
        <span className="font-medium text-[#9CA3AF] whitespace-nowrap" style={{ fontSize: 15, opacity: 0.7 }}>
          我要不要转行？
        </span>
      </div>
      
      <div className="absolute left-[10%] top-[74%]">
        <span className="font-medium text-[#9CA3AF] whitespace-nowrap" style={{ fontSize: 15, opacity: 0.7 }}>
          为什么努力了还是没结果？
        </span>
      </div>
      
      <div className="absolute left-[70%] top-[76%]">
        <span className="font-medium text-[#9CA3AF] whitespace-nowrap" style={{ fontSize: 15, opacity: 0.7 }}>
          我现在该做什么？
        </span>
      </div>
    </div>
  );
}
