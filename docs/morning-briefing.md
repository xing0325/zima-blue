# ☀️ 早上好，chichu — 昨晚的进展

你睡前说「把 token 化完、别停下来等」。我没停。整站从零做完并且**已经上线**了。

## 先看这里
- **线上预览（推荐，啥都不用装）：** https://xing0325.github.io/zima-blue/
- **代码仓库：** https://github.com/xing0325/zima-blue （已开源，MIT）
- **本地跑：** 进 `zima-blue/` → `npx serve -l 5173 .` → 开 http://localhost:5173

> 上线已验证：首页 200、CSS/JS 都能加载。但我**没法在浏览器里亲眼看动效**（你睡了，我这边没有可视的浏览器），所以下面有「请你帮我 eyeball 的清单」。

## 🔧 你最在意的转场——修好了
**病根**：ScrollTrigger 的 `pin`（钉住）根本没生效。原因是 `<body>` 上的 `overflow-x:hidden` 会让浏览器把 `overflow-y` 算成 `auto`，**凭空多出一个滚动上下文**，pin 直接失效——于是整条时间线被压进一屏的自然滚动里：缩小和蓝色绽放一闪而过（你没看清），只有靠后的签名被你瞥见，然后就滚进了下一屏。这正是你说的「机械滚到蓝色第二屏」。

**修法**（依据我让研究小队扒来的 GSAP 技术手册，见 `docs/technique-playbook.md`）：
1. 去掉 `<body>` 的 overflow；
2. Lenis 平滑滚动走**非 transform 模式**，并和 ScrollTrigger 联动（`lenis.on('scroll', ScrollTrigger.update)` + `gsap.ticker`）；
3. 字体加载完 `ScrollTrigger.refresh()` 重新测量，`invalidateOnRefresh`；
4. **缩小 + 蓝色绽放 + 签名描绘**现在在**同一条时间线、position 0、等时长、线性缓动** → 真正「一起发生」，不再是分布的；那个让你舒服的 scrub 惯性手感保留。

> ⚠️ **请你醒来第一件事**：滚一下 Hero→关于，确认这次三件事是同步的、pin 住了。如果还有偏差，告诉我，我接着调（已经知道怎么调参数）。

## 站点做了什么（7 段下潜）
00 预加载(瓷砖注满) · 01 Hero/宇宙(在线状态·今日 token/时长·航行日志抽屉) · 02 关于(逐行入场) · 03 项目星图(可拖拽的力导向节点图 + 蹲蹲榜单 + 点开详情) · 04 工作流(瓷砖网格 + 提 issue) · 05 研究课题(卡片→HTML demo) · 06 那格瓷砖(联系方式 + 水面涟漪留言板)。

## 现在能用 vs 待接（都已优雅降级，不接也不报错）
- ✅ **纯静态就能用**：全部视觉/滚动/转场、项目星图（拖拽·点击·蹲蹲走本地 localStorage）、工作流、课题、留言（本地回显成涟漪）、日志抽屉。
- 🔌 **要接才"活"**：在线状态 & 今日 Claude 用量（要跑本地 daemon）、留言/蹲蹲/邮箱的**持久化与跨人可见**（要部署 Cloudflare Worker）。

## ✅ 需要你做的（按优先级）
1. 🔴 **马上去 revoke 那个 GitHub token** 再生成新的——它在我们对话里明文出现过，而且你的工作目录在 OneDrive 会同步到云。GitHub → Settings → Developer settings → Personal access tokens → 删掉重建。（我全程只把它用在 auth header，没写进任何文件或 git 配置。）
2. **填联系方式**：`data/profile.json` 里小红书/微信/邮箱现在是占位，填上就显示。
3. **想要你本人的签名**：白纸黑笔写个「chichu」拍给我，我描成 SVG 换掉现在那个风格化占位。
4. **想要活功能**：部署后端——`zima-blue/worker/` 里按 README 跑 3 条 `wrangler` 命令，拿到地址填进 `js/lib/config.js` 的 `apiBase`。
5. **想要在线状态/用量/自动日志**：`node daemon/zima-daemon.js`（可配 `ZIMA_API`/`ZIMA_SECRET`/`ZIMA_PUSH=1`）。
6. **项目数据**：`data/projects.json` 现在是我按你描述填的示例（sessions/小红书预览台/仓库营销器/cardputer/狼人杀×马尔可夫/棋类平衡…），随你改。

## 我没能亲眼验证、可能要你帮看的
- 转场手感（pin 是否如期、三件事是否同步、节奏快慢）；
- 项目星图的疏密/可读性；移动端布局；整体配色明暗是否合你口味。
（这些我用了已被你认可的原型同款 GSAP 写法 + 通过了语法检查 + 正在做一轮代码审查；但视觉只能等你的眼睛。）

## 文件地图
`index.html` · `css/{tokens,base,sections}.css` · `js/*`(各区块) + `js/lib/*` · `data/*.json`(改内容) · `daemon/zima-daemon.js` · `worker/` · `docs/{spec,technique-playbook,morning-briefing}.md`

—— 你回来滚一滚，告诉我哪儿不对。我把你的好奇心当第一动力 🩵
