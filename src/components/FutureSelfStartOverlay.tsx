'use client';

import { useState, useEffect } from 'react';
import FutureSelfAvatar from './FutureSelfAvatar';

const LOADING_MESSAGES = [
  'FutureLens 正在理解你...',
  'FutureLens 正在寻找你忽略的问题...',
  'FutureLens 正在推演未来路径...',
];

interface FutureSelfStartOverlayProps {
  text?: string;
  subtext?: string;
}

export default function FutureSelfStartOverlay({
  text = '正在初始化你的未来分身...',
  subtext = '正在建立个人未来系统',
}: FutureSelfStartOverlayProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [currentText, setCurrentText] = useState(LOADING_MESSAGES[0]);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex((prev) => {
        const next = (prev + 1) % LOADING_MESSAGES.length;
        setCurrentText(LOADING_MESSAGES[next]);
        return next;
      });
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="fixed inset-0 bg-[#F5F5F7] flex flex-col items-center justify-center z-50">
      <div className="animate-bounce">
        <FutureSelfAvatar size="lg" />
      </div>
      <p className="mt-6 text-base text-[#6B7280]">{currentText}</p>
      <p className="mt-2 text-xs text-[#9CA3AF]">{subtext}</p>
    </div>
  );
}
