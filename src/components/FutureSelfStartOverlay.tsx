'use client';

import FutureSelfAvatar from './FutureSelfAvatar';

interface FutureSelfStartOverlayProps {
  text?: string;
  subtext?: string;
}

export default function FutureSelfStartOverlay({
  text = '正在初始化你的未来分身...',
  subtext = '正在建立个人未来系统',
}: FutureSelfStartOverlayProps) {
  return (
    <div className="fixed inset-0 bg-[#F5F5F7] flex flex-col items-center justify-center z-50">
      <div className="animate-bounce">
        <FutureSelfAvatar size={140} />
      </div>
      <p className="mt-6 text-base text-[#6B7280]">{text}</p>
      <p className="mt-2 text-xs text-[#9CA3AF]">{subtext}</p>
    </div>
  );
}
