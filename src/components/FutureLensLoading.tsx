import { Sparkles } from 'lucide-react';

type FutureLensLoadingProps = {
  title?: string;
  steps?: string[];
};

const defaultSteps = [
  '正在理解你的补充信息',
  '正在调度执行器',
  '正在生成下一版成果',
];

export default function FutureLensLoading({
  title = 'FutureLens 正在生成',
  steps = defaultSteps,
}: FutureLensLoadingProps) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#F5F5F7] px-6">
      <div className="w-full max-w-sm rounded-3xl border border-[#D6E6FF] bg-white/90 px-6 py-8 text-center shadow-[0_24px_70px_rgba(36,99,235,0.10)]">
        <div className="futurelens-loader mx-auto">
          <div className="futurelens-loader-scan" />
          <div className="futurelens-loader-core">
            <Sparkles className="h-6 w-6 text-[#2463EB]" />
          </div>
        </div>

        <h2 className="mt-5 text-base font-semibold text-[#111827]">{title}</h2>
        <div className="mt-4 grid gap-2 text-left">
          {steps.map((step, index) => (
            <div key={step} className="flex items-center gap-3 rounded-2xl bg-[#F8FAFD] px-3 py-2">
              <span className={`futurelens-loader-node futurelens-loader-node-${index + 1}`} />
              <span className="text-sm text-[#64748B]">{step}</span>
            </div>
          ))}
        </div>
      </div>

      <style jsx>{`
        .futurelens-loader {
          position: relative;
          width: 86px;
          height: 86px;
          border-radius: 999px;
          display: grid;
          place-items: center;
          background:
            radial-gradient(circle at center, rgba(36, 99, 235, 0.12), rgba(255, 255, 255, 0) 62%),
            linear-gradient(180deg, rgba(238, 245, 255, 0.9), rgba(255, 255, 255, 0.9));
        }

        .futurelens-loader::before {
          content: '';
          position: absolute;
          inset: 8px;
          border-radius: inherit;
          border: 1px solid rgba(36, 99, 235, 0.2);
        }

        .futurelens-loader-scan {
          position: absolute;
          inset: 3px;
          border-radius: inherit;
          border: 1px solid transparent;
          border-top-color: rgba(36, 99, 235, 0.5);
          animation: futurelens-scan 2.2s linear infinite;
        }

        .futurelens-loader-core {
          position: relative;
          z-index: 1;
          width: 48px;
          height: 48px;
          border-radius: 18px;
          display: grid;
          place-items: center;
          background: #ffffff;
          box-shadow: 0 12px 28px rgba(36, 99, 235, 0.16);
          animation: futurelens-pulse 2.4s ease-in-out infinite;
        }

        .futurelens-loader-node {
          width: 8px;
          height: 8px;
          border-radius: 999px;
          background: #bfdbfe;
          animation: futurelens-node 1.8s ease-in-out infinite;
        }

        .futurelens-loader-node-2 {
          animation-delay: 0.22s;
        }

        .futurelens-loader-node-3 {
          animation-delay: 0.44s;
        }

        @keyframes futurelens-scan {
          to {
            transform: rotate(360deg);
          }
        }

        @keyframes futurelens-pulse {
          0%, 100% {
            transform: scale(1);
          }
          50% {
            transform: scale(1.04);
          }
        }

        @keyframes futurelens-node {
          0%, 100% {
            background: #bfdbfe;
            transform: scale(1);
          }
          45% {
            background: #2463eb;
            transform: scale(1.25);
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .futurelens-loader-scan,
          .futurelens-loader-core,
          .futurelens-loader-node {
            animation-duration: 6s;
            animation-iteration-count: 1;
          }
        }
      `}</style>
    </div>
  );
}
