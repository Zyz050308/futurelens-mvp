# FutureLens Codex 执行固定规则

本文件作为以后 Codex 在 FutureLens 项目中执行任务时的固定规则。除非用户在当前任务中明确覆盖，否则默认遵守以下要求。

## Git 与提交边界

1. 禁止使用 `git add .`。
2. 只允许 `git add` 用户明确允许的文件，或任务范围内已经确认的具体文件。
3. 默认不要执行 `git add`、`git commit`、`git push`、部署命令。
4. 只有用户明确允许提交、推送或部署时，才可以执行对应操作。

## 禁止随意修改的范围

除非当前任务明确要求，否则禁止修改：

- 数据库结构、SQL migration、线上数据写入逻辑
- 登录 / 注册逻辑
- UID 生成规则
- `devCode` 测试逻辑
- `middleware`
- `legacyAccess`
- 旧新闻系统安全相关 API
- 旧 admin / pipeline / feed / news 的生产环境安全拦截逻辑

如果发现这些区域存在安全风险，先停下并报告，不要继续扩大修改范围。

## 禁止提交的文件

禁止提交以下文件或目录：

- `.codex/`
- `deploy.sh`
- `*.tar`
- `*.zip`
- `*.patch`
- 服务器备份文件
- 异常命名的临时文件
- 任何 `.env` / `.env.local` / 环境变量文件

提交前必须明确确认这些文件没有进入 staged。

## 每次改动后的检查命令

每次修改后必须运行：

```cmd
npx.cmd tsc --noEmit
git diff --check
npm.cmd run build
```

已知旧 React Hook warning 可以记录但不阻塞，例如：

- `src/app/news/[id]/page.tsx` 既有 Hook dependency warning
- `src/app/radar/page.tsx` 既有 `loadRadar` dependency warning

如果出现新的 error 或新的阻断性 warning，必须报告。

## 报告格式要求

每次任务报告必须写清楚：

1. 修改了哪些文件。
2. 是否触碰安全、数据库、登录 / 注册、UID、`devCode`。
3. 测试和检查命令是否通过。
4. 是否建议提交。
5. 如果建议提交，只列出允许提交的具体文件。
6. 明确说明哪些文件不能提交。

## 安全优先规则

如果执行过程中发现后台、API、权限、环境变量、数据库写入、生产部署相关风险：

1. 先停止当前非安全改动。
2. 输出风险说明。
3. 不要继续乱改。
4. 等用户确认是否进入安全修复任务。
