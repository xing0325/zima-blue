# 设计规格 · Zima Blue 个人站

定稿日期：2026-06-05　·　主理人：chichu（18 岁 vibe coder，GitHub: xing0325）

## 1. 目标
- **主：作品集 showcase** —— 展示 chichu 的 vibe-code 项目、工作流、研究课题。
- **次：交互艺术品** —— 逛站 = 重看一遍《齐马蓝》的「下潜」叙事。

## 2. 视觉
- **A 深空** 打底：近黑 `#04070d` + 唯一的齐马蓝 `#1FA2D6`，大量留白。
- **C 瓷砖网格** 收结构：纸白 `#f1efe7` + 网格，用于「工作流」区块。
- 明度**不要求**单调递减；Hero→关于的转场冲到最亮齐马蓝当高潮。
- 字体：Space Grotesk（显示）· Fraunces（衬线点缀）· JetBrains Mono（标签/数据）。
- 全部 token 见 `css/tokens.css`，是唯一可信源。

## 3. 叙事 / 信息架构（单页长滚动）
| # | 区块 | 内容 |
|---|---|---|
| 00 | 预加载 | 一格空瓷砖被齐马蓝注满 = loading |
| 01 | Hero / 宇宙 | 名字如远星、在线状态、今日 Claude tokens/时长、航行日志抽屉 |
| 02 | 关于 | 自我介绍逐行入场 |
| 03 | 项目画廊 / 星图 | Obsidian 式力导向节点图 + 蹲蹲榜单 + Flip 详情 |
| 04 | 工作流 | 瓷砖网格，每块一个工作流 + 提 issue |
| 05 | 研究课题 | 怪问题卡片 → HTML demo |
| 06 | 那格瓷砖 / 联系 | 收敛成一格蓝瓷砖；联系方式；公屏留言 = 水面涟漪 |

## 4. 招牌转场（01→02）
一条 **pin 住 + scrub** 的 ScrollTrigger 时间线，三件事在 **position 0、等时长、线性** 同步发生：
1. 第一屏整体**缩小后退**（缩放内层，不缩放被 pin 的节点）
2. 背景**亮齐马蓝绽放**（bloom 层 scale+opacity）
3. **手写签名**沿 stroke-dashoffset 描出
> 关键坑：`<body>` 不能设 `overflow`（会派生 `overflow-y:auto` 形成第二滚动上下文，pin 失效）；祖先不能有 transform/filter；fonts.ready 后 `ScrollTrigger.refresh()`；Lenis 走非 transform 模式。详见 `docs/technique-playbook.md`。

## 5. 动效
GSAP ScrollTrigger（pin/scrub/parallax/batch reveal）+ Flip（详情展开）+ Lenis（平滑滚动，惯性手感）。尊重 `prefers-reduced-motion`：降级为静态可读。

## 6. 后端姿态（B）
静态前端 + 可选 Cloudflare Worker(+KV) + 本地 daemon：
- **在线状态**：daemon 心跳 → Worker `/api/status`（4 分钟内有心跳才算在线）。
- **Claude 用量**：daemon 读 `~/.claude` 今日 tokens/时长。
- **自动日志**：daemon 每天 02:00(北京) 汇总 git 提交 + 用量 → `changelog.json`，可自动 push。
- **公屏留言 / 蹲蹲 / 留邮箱**：Worker KV。
- 全部**优雅降级**：没接后端时用本地 JSON + localStorage（蹲蹲乐观更新、留言本地回显）。

## 7. 隔离原则
全新代码，不复用任何旧废稿（兰多主题站、旧齐马蓝站），本地与云端均不碰。landonorris.com（官方站）仅作外部技术参考。

## 8. 待办 / 开放问题
见 `docs/morning-briefing.md`。
