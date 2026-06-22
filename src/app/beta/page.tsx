import Image from 'next/image';
import Link from 'next/link';

const notes = [
  {
    title: '适合测试的问题',
    description: '简历、作品集、学习计划、汇报稿、工作流程。',
  },
  {
    title: '你可以反馈什么',
    description: '判断不准、材料不好用、页面看不懂、下一步不清楚。',
  },
  {
    title: '合作与审核沟通',
    description: '备案审核、项目展示、合作说明，也可以通过公众号或微信联系。',
  },
];

const templateLines = [
  '我的问题是：',
  'FutureLens 哪里没帮到我：',
  '我希望它下一步能：',
];

function BrandMark() {
  return (
    <span className="inline-flex h-11 w-10 shrink-0 items-center justify-center">
      <Image
        src="/futurelens-mark-original.png"
        alt=""
        width={220}
        height={260}
        className="h-full w-full object-contain"
        priority
      />
    </span>
  );
}

function QrCard({
  title,
  description,
  imageSrc,
  imageAlt,
  caption,
}: {
  title: string;
  description: string;
  imageSrc: string;
  imageAlt: string;
  caption: string;
}) {
  return (
    <article className="rounded-lg border border-[#DDE6F4] bg-white p-6 shadow-[0_18px_48px_rgba(43,68,116,0.08)] sm:p-7">
      <div>
        <h2 className="text-xl font-semibold text-[#172540]">{title}</h2>
        <p className="mt-3 min-h-[52px] text-sm leading-6 text-[#6E7C93]">{description}</p>
      </div>

      <div className="mt-7 rounded-lg border border-[#E7EDF6] bg-white p-4">
        <div className="relative mx-auto aspect-square w-full max-w-[280px]">
          <Image
            src={imageSrc}
            alt={imageAlt}
            fill
            sizes="(max-width: 768px) 80vw, 280px"
            className="object-contain"
            priority
          />
        </div>
      </div>

      <p className="mt-4 text-center text-xs leading-5 text-[#8A96AA]">{caption}</p>
    </article>
  );
}

export default function BetaPage() {
  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,#FFFFFF_0%,#F4F7FF_52%,#FFFFFF_100%)] text-[#14213D]">
      <header className="border-b border-[#E8EDF6] bg-white/85 backdrop-blur-xl">
        <div className="mx-auto flex h-[68px] max-w-7xl items-center justify-between px-5 sm:px-8">
          <Link href="/" className="flex items-center gap-3" aria-label="FutureLens 首页">
            <BrandMark />
            <span className="text-[19px] font-semibold tracking-[0.015em] text-[#152238]">FutureLens</span>
          </Link>
          <Link
            href="/"
            className="rounded-md border border-[#DCE4F2] bg-white px-4 py-2 text-sm font-medium text-[#40506B] transition-colors hover:border-[#C8D5EC] hover:text-[#3157D5]"
          >
            返回首页
          </Link>
        </div>
      </header>

      <section className="relative overflow-hidden px-5 py-18 sm:px-8 sm:py-24">
        <div className="pointer-events-none absolute left-1/2 top-10 h-[380px] w-[880px] -translate-x-1/2 rounded-full bg-[#DDE8FF]/65 blur-3xl" />

        <div className="relative mx-auto max-w-6xl">
          <div className="mx-auto max-w-3xl text-center">
            <h1 className="text-4xl font-bold leading-tight text-[#101D38] sm:text-5xl">
              加入 FutureLens 内测
            </h1>
            <p className="mx-auto mt-5 max-w-2xl text-sm leading-7 text-[#61708A] sm:text-base">
              带着一个真实问题来试用。你的反馈会直接影响 FutureLens 下一步怎么改。
            </p>
          </div>

          <div className="mt-12 grid gap-5 lg:grid-cols-2">
            <QrCard
              title="关注公众号"
              description="获取产品更新、使用案例和内测说明。"
              imageSrc="/qrcodes/futurelens-official-account.png"
              imageAlt="FutureLens 公众号二维码"
              caption="扫码关注公众号，获取 FutureLens 最新进展。"
            />
            <QrCard
              title="加入内测群"
              description="扫码添加微信，备注 FutureLens 内测。"
              imageSrc="/qrcodes/futurelens-wechat-beta.jpg"
              imageAlt="FutureLens 微信内测二维码"
              caption="扫码添加微信，备注 FutureLens 内测。"
            />
          </div>

          <div className="mt-12 grid gap-4 md:grid-cols-3">
            {notes.map((note) => (
              <article
                key={note.title}
                className="rounded-lg border border-[#E4EAF4] bg-white/90 p-6 shadow-[0_10px_28px_rgba(43,68,116,0.05)]"
              >
                <h2 className="text-base font-semibold text-[#172540]">{note.title}</h2>
                <p className="mt-3 text-sm leading-6 text-[#6E7C93]">{note.description}</p>
              </article>
            ))}
          </div>

          <section className="mx-auto mt-12 max-w-3xl rounded-lg border border-[#DDE6F4] bg-white/95 p-6 shadow-[0_18px_48px_rgba(43,68,116,0.08)] sm:p-7">
            <h2 className="text-lg font-semibold text-[#172540]">反馈模板</h2>
            <div className="mt-5 space-y-4">
              {templateLines.map((line) => (
                <div key={line} className="rounded-md bg-[#F6F8FC] px-4 py-3 text-sm text-[#52627D]">
                  {line}
                </div>
              ))}
            </div>
          </section>
        </div>
      </section>
    </main>
  );
}
