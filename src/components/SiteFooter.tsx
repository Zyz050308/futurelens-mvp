const ICP_LINK = 'https://beian.miit.gov.cn/';

export default function SiteFooter() {
  return (
    <footer className="border-t border-[#E5E7EB] bg-white/90 px-5 py-4 text-center">
      <p className="text-xs text-[#6B7280]">
        <span>© 2026 FutureLens｜未来透镜</span>
        <span className="mx-1.5">·</span>
        <a
          href={ICP_LINK}
          target="_blank"
          rel="noopener noreferrer"
          className="transition-colors hover:text-[#1D1D1F]"
        >
          浙ICP备2026044503号
        </a>
        <span className="mx-1.5">·</span>
        <span>浙公网安备33078102100499号</span>
      </p>
    </footer>
  );
}
