# 一格齐马蓝 · chichu 的个人站

> 浩瀚 → 本真。一个以《齐马蓝》为主题的个人站：从宇宙一路下潜到池底那一格蓝瓷砖。
> 作品、工作流，和那些我感兴趣的怪问题。

单页长滚动 = 一次「下潜」。深空黑打底 + 唯一的那抹齐马蓝 `#1FA2D6` + 泳池瓷砖网格收结构。
纯静态前端（HTML/CSS/JS + GSAP），无需打包即可运行；活功能（在线状态 / 公屏留言 / 蹲蹲 / 留邮箱）由一个可选的 Cloudflare Worker + 一个本地 daemon 驱动，**不接也能完整使用**（自动降级）。

---

## 本地预览

需要用本地服务器打开（直接双击 `index.html` 会被浏览器拦截读取本地 JSON）：

```bash
# 任选其一
npx serve -l 5173 .            # Node
python -m http.server 5173     # Python
```
然后打开 http://localhost:5173 。

## 目录结构

```
zima-blue/
├─ index.html              # 单页结构
├─ css/  tokens.css        # 设计 token（颜色/字体/间距/动效曲线 —— 改这里换皮肤）
│        base.css          # reset + 基础 + 工具类
│        sections.css      # 各区块样式
├─ js/   main.js           # 入口：Lenis↔ScrollTrigger、预加载、装配各区块
│        heroAbout.js      # ★ Hero→关于 的「俯冲」转场（pin 住 + 同步 scrub）
│        gallery.js        # 项目星图（canvas 力导向）+ 蹲蹲榜单 + 详情
│        contact.js        # 那格瓷砖 + 水面涟漪留言板
│        preloader/status/changelog/workflow/research/rail/reveal.js
│        lib/ util · data · config · api
├─ data/ *.json            # 全部内容在这里改（profile/projects/workflows/research/changelog/status）
├─ daemon/ zima-daemon.js  # 本地小后台：心跳/Claude 用量/每日日志
├─ worker/                 # Cloudflare Worker（活功能后端）
└─ docs/  spec.md · technique-playbook.md · morning-briefing.md
```

## 改内容

所有文字/项目都在 `data/*.json`：
- `profile.json` — 名字、简介、联系方式（**记得填小红书/微信/邮箱**）
- `projects.json` — 项目关系图谱的节点与连线（`size` 1–3，`status` active/wip/planned/paused）
- `workflows.json` / `research.json` — 工作流与课题
- `changelog.json` / `status.json` — 由 daemon 自动维护（也可手改）

## 上线（GitHub Pages，零成本）

仓库已含 `.nojekyll`。推到 GitHub 后：Settings → Pages → Source 选 `main` 分支根目录即可，
几分钟后得到 `https://xing0325.github.io/zima-blue/`。

## 活功能后端（可选，Cloudflare 免费额度）

```bash
cd worker
npx wrangler kv namespace create ZIMA      # 把返回的 id 填进 wrangler.toml
npx wrangler secret put HEARTBEAT_SECRET    # 设一个密钥（daemon 要用同一个）
npx wrangler deploy                         # 得到 https://zima-api.xxx.workers.dev
```
然后把该地址填进 `js/lib/config.js` 的 `apiBase`。前端就会从 Worker 读在线状态、留言、蹲蹲计数。

## 本地 daemon（在线状态 / Claude 用量 / 自动日志）

```bash
node daemon/zima-daemon.js          # 常驻：每分钟心跳 + 读 ~/.claude 今日用量
node daemon/zima-daemon.js --status # 只刷一次状态
node daemon/zima-daemon.js --changelog  # 立刻生成今天的日志
```
环境变量：`ZIMA_API`（Worker 地址）、`ZIMA_SECRET`（与 Worker 密钥一致）、`ZIMA_REPOS`（要统计提交的仓库，`;`/`:` 分隔）、`ZIMA_PUSH=1`（出日志后自动提交推送）。
想开机自启：Windows 用「任务计划程序」，或 `pm2 start daemon/zima-daemon.js`。

## 技术栈

GSAP（ScrollTrigger / Flip）+ Lenis 平滑滚动 · 原生 Canvas（星图 / 涟漪）· Cloudflare Workers + KV · 零打包、零框架。

## 许可

MIT © chichu (github: [xing0325](https://github.com/xing0325))
