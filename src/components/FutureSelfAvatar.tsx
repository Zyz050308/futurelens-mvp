'use client';

import React from 'react';

export type FutureSelfAvatarProps = {
  gender?: "male" | "female" | "unknown";
  identity?: string;
  futureRole?: string;
  stage?: string;
  currentProblem?: string;
  risk?: string;
  opportunity?: string;
  changeDirection?: string;
  mode?: "preview" | "full";
  size?: "sm" | "md" | "lg";
  time?: string;
};

type ProfessionType = 'designer' | 'construction' | 'ai' | 'student' | 'creator' | 'jobseeker' | 'general';

function determineProfession(identity?: string, futureRole?: string): ProfessionType {
  const text = `${identity || ''} ${futureRole || ''}`.toLowerCase();
  
  if (text.includes('设计') || text.includes('视觉') || text.includes('品牌') || text.includes('设计师')) {
    return 'designer';
  }
  if (text.includes('建筑') || text.includes('施工') || text.includes('bim') || text.includes('工地')) {
    return 'construction';
  }
  if (text.includes('ai') || text.includes('创业') || text.includes('产品') || text.includes('pm')) {
    return 'ai';
  }
  if (text.includes('雅思') || text.includes('留学') || text.includes('学生') || text.includes('考研')) {
    return 'student';
  }
  if (text.includes('内容') || text.includes('自媒体') || text.includes('短视频') || text.includes('博主')) {
    return 'creator';
  }
  if (text.includes('求职') || text.includes('转行') || text.includes('面试') || text.includes('简历')) {
    return 'jobseeker';
  }
  return 'general';
}

function FutureSelfAvatar({
  gender = "unknown",
  identity = "探索中",
  futureRole = "寻找方向",
  stage = "起点",
  currentProblem,
  risk,
  opportunity,
  changeDirection,
  mode = "preview",
  size = "lg",
  time
}: FutureSelfAvatarProps) {
  const profession = determineProfession(identity, futureRole);
  
  const sizeClasses = {
    sm: "w-16 h-16",
    md: "w-24 h-24",
    lg: "w-32 h-32"
  };
  
  const iconSize = size === 'lg' ? 'w-6 h-6' : size === 'md' ? 'w-5 h-5' : 'w-4 h-4';

  return (
    <div className="flex flex-col items-center gap-4">
      {/* 小人主体 */}
      <div className={`${sizeClasses[size]} relative`}>
        {/* 背景圆 */}
        <div className="absolute inset-0 bg-gradient-to-br from-[#007AFF]/10 to-[#AF52DE]/10 rounded-full flex items-center justify-center">
          
          {/* 人物容器 */}
          <div className="relative w-3/4 h-3/4">
            
            {/* 头部 */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2">
              {/* 头发 */}
              <div 
                className={`
                  absolute -top-1 left-1/2 -translate-x-1/2 
                  ${gender === 'male' ? 'w-8 h-4 rounded-t-full bg-[#4B5563]' : 
                    gender === 'female' ? 'w-10 h-5 rounded-t-full bg-[#4B5563]' : 
                    'w-8 h-4 rounded-t-full bg-[#6B7280]'}
                `}
              />
              {/* 脸 */}
              <div className="w-8 h-8 bg-[#FDF0D5] rounded-full relative">
                {/* 眼睛 */}
                <div className="absolute top-3 left-2 w-1.5 h-1.5 bg-[#1D1D1F] rounded-full" />
                <div className="absolute top-3 right-2 w-1.5 h-1.5 bg-[#1D1D1F] rounded-full" />
              </div>
            </div>

            {/* 身体 */}
            <div className="absolute top-8 left-1/2 -translate-x-1/2">
              <div 
                className={`
                  relative 
                  ${gender === 'male' ? 'w-10 h-8 bg-[#007AFF] rounded-t-lg' : 
                    gender === 'female' ? 'w-9 h-8 bg-[#AF52DE] rounded-t-lg' : 
                    'w-10 h-8 bg-[#6B7280] rounded-t-lg'}
                `}
              >
                {/* 肩膀 */}
                <div 
                  className={`
                    absolute -left-1 top-0 w-2 h-4 
                    ${gender === 'female' ? 'rounded-l-full' : 'rounded-l'} 
                    bg-inherit
                  `} 
                />
                <div 
                  className={`
                    absolute -right-1 top-0 w-2 h-4 
                    ${gender === 'female' ? 'rounded-r-full' : 'rounded-r'} 
                    bg-inherit
                  `} 
                />
              </div>
            </div>

            {/* 职业道具 */}
            <div className="absolute top-6 -right-4">
              <ProfessionIcon profession={profession} size={iconSize} />
            </div>
          </div>
        </div>
      </div>

      {/* 身份标签 */}
      <div className="text-center space-y-1">
        <div className="text-xs text-[#007AFF] font-medium">
          未来分身
        </div>
        <div className="text-sm font-semibold text-[#1D1D1F]">
          {identity}
        </div>
        <div className="text-xs text-[#6B7280]">
          → {futureRole}
        </div>
        {mode === 'full' && (
          <div className="text-xs text-[#9CA3AF] mt-2 space-y-1">
            <div>阶段：{stage}</div>
            {time && <div>时间：{time}</div>}
            {risk && <div>路径：{risk}</div>}
          </div>
        )}
      </div>

      {/* 详细信息（仅 full 模式显示） */}
      {mode === 'full' && (
        <>
          {changeDirection && (
            <div className="text-xs text-[#6B7280]">
              {changeDirection}
            </div>
          )}
          
          {/* 机会和风险 */}
          {(opportunity || risk || currentProblem) && (
            <div className="w-full max-w-xs space-y-2">
              {currentProblem && (
                <div className="flex items-start gap-2 p-2 bg-[#007AFF]/5 rounded-lg">
                  <div className="w-1.5 h-1.5 rounded-full bg-[#007AFF] mt-1.5 flex-shrink-0" />
                  <div className="text-xs text-[#007AFF]">
                    {currentProblem}
                  </div>
                </div>
              )}
              {opportunity && (
                <div className="flex items-start gap-2 p-2 bg-[#34C759]/5 rounded-lg">
                  <div className="w-1.5 h-1.5 rounded-full bg-[#34C759] mt-1.5 flex-shrink-0" />
                  <div className="text-xs text-[#34C759]">
                    {opportunity}
                  </div>
                </div>
              )}
              {risk && (
                <div className="flex items-start gap-2 p-2 bg-[#FF3B30]/5 rounded-lg">
                  <div className="w-1.5 h-1.5 rounded-full bg-[#FF3B30] mt-1.5 flex-shrink-0" />
                  <div className="text-xs text-[#FF3B30]">
                    {risk}
                  </div>
                </div>
              )}
            </div>
          )}
        </>
      )}

      {/* Preview 模式的提示 */}
      {mode === 'preview' && !opportunity && !risk && (
        <div className="text-xs text-[#9CA3AF]">
          填写信息后，Future Self 会逐渐成型
        </div>
      )}
    </div>
  );
}

function ProfessionIcon({ profession, size }: { profession: ProfessionType, size: string }) {
  switch (profession) {
    case 'designer':
      return (
        <div className="flex flex-col gap-0.5">
          <div className="flex gap-0.5">
            <div className="w-1.5 h-1.5 bg-[#FF9500]" />
            <div className="w-1.5 h-1.5 bg-[#007AFF]" />
          </div>
          <div className="flex gap-0.5">
            <div className="w-1.5 h-1.5 bg-[#34C759]" />
            <div className="w-1.5 h-1.5 bg-[#AF52DE]" />
          </div>
          <div className="w-4 h-0.5 bg-[#6B7280] mt-0.5" />
        </div>
      );
    
    case 'construction':
      return (
        <div className="flex flex-col items-center">
          <div className="w-3 h-1.5 bg-[#FF9500] rounded-t-lg" />
          <div className="w-4 h-2 bg-[#6B7280] rounded-b" />
          <div className="w-3 h-0.5 bg-[#4B5563] mt-0.5" />
        </div>
      );
    
    case 'ai':
      return (
        <div className="flex flex-col items-center gap-0.5">
          <div className="flex gap-0.5">
            <div className="w-1.5 h-0.5 bg-[#007AFF]" />
            <div className="w-1.5 h-0.5 bg-[#007AFF]" />
          </div>
          <div className="w-3 h-0.5 bg-[#6B7280]" />
          <div className="flex gap-0.5">
            <div className="w-1 h-0.5 bg-[#34C759]" />
            <div className="w-1 h-0.5 bg-[#34C759]" />
            <div className="w-1 h-0.5 bg-[#34C759]" />
          </div>
        </div>
      );
    
    case 'student':
      return (
        <div className="flex flex-col items-center gap-0.5">
          <div className="w-3 h-2 bg-[#FDF0D5] border border-[#6B7280] rounded-sm" />
          <div className="w-2 h-0.5 bg-[#6B7280]" />
          <div className="w-1.5 h-1.5 bg-[#AF52DE] rounded-full" />
        </div>
      );
    
    case 'creator':
      return (
        <div className="flex flex-col items-center gap-0.5">
          <div className="w-3 h-2 bg-[#1D1D1F] rounded-sm" />
          <div className="w-1 h-1 bg-[#FF3B30] rounded-full absolute top-1" />
          <div className="w-2 h-0.5 bg-[#6B7280]" />
        </div>
      );
    
    case 'jobseeker':
      return (
        <div className="flex flex-col items-center gap-0.5">
          <div className="w-3 h-2 bg-[#FDF0D5] border border-[#6B7280] rounded-sm" />
          <div className="flex gap-1">
            <div className="w-1 h-0.5 bg-[#007AFF]" />
            <div className="w-1 h-0.5 bg-[#007AFF]" />
          </div>
          <div className="w-0.5 h-1.5 border-r-2 border-[#6B7280] border-dashed" />
        </div>
      );
    
    default:
      return (
        <div className="flex flex-col items-center gap-0.5">
          <div className="w-0.5 h-1.5 bg-[#6B7280]" />
          <div className="w-2 h-0.5 bg-[#007AFF]" />
          <div className="flex gap-1">
            <div className="w-1 h-0.5 bg-[#34C759]" />
            <div className="w-1 h-0.5 bg-[#34C759]" />
          </div>
        </div>
      );
  }
}

export default FutureSelfAvatar;
