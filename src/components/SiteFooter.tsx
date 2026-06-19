const ICP_LINK = 'https://beian.miit.gov.cn/';

export default function SiteFooter() {
  return (
    <footer className="border-t border-[#E5E7EB] bg-white/90 px-5 py-4 text-center">
      <a
        href={ICP_LINK}
        target="_blank"
        rel="noopener noreferrer"
        className="text-xs text-[#6B7280] transition-colors hover:text-[#1D1D1F]"
      >
        浙ICP备2026044503号
      </a>
    </footer>
  );
}
