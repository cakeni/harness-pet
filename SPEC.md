# Harness Whale — 开发规格书 v2（SPEC）

> 供实现者（人或 AI 编码代理）阅读。目标产物：一个开源的 DeepSeek Harness 原生网页宠物插件。

## 1. 项目身份

- 项目名：**Harness Whale**
- 标语：`A tiny whale that lives inside DeepSeek Harness.`
- 定位：**DeepSeek Harness 的非官方社区宠物**。所有公开材料（README、包描述、界面）必须声明：
  > This is an unofficial community project. Not affiliated with, endorsed by, or maintained by DeepSeek.
  > DeepSeek and related marks belong to their respective owners.
- 仓库：`github.com/cakeni/harness-whale`（用户名以用户确认为准）
- npm 包名：**`harness-whale`**（未占用；建议尽早占名）
- License：**MIT**
- 文档双语：`README.md`（英文主文档）+ `README.zh.md`（中文）
- README 首屏必须是项目名 + 标语 + 非官方声明 + 安装命令

## 2. 形态与分发

**不做浏览器扩展。** 做成 **DSH 原生 web 插件（bundle）**，不改动 Harness 本体。机制（已实测验证，详见 RESEARCH.md）：

- `package.json` 声明：
  - `dsh.bundle.patch: "./cordis.patch.yml"` —— 加入 profile 插件层栈
  - `dsh.client: { inject: [...], platform: "web" }` —— 浏览器半边注册
  - `exports["./client"]` —— 客户端产物入口
  - peerDependencies 锁定 `@deepseek-ai/dsh-*@^0.1.0-rc.6`（当前生态版本 0.1.0-rc.6）
- `cordis.patch.yml`：插入一行宿主注册（如 `id: whale-pet / name: 'harness-whale'`），宿主自动把插件编入 `window.__DSH_BOOT__` 并托管 `/plugins/harness-whale/client.js`
- 插件浏览器半边导出 `{ apply(ctx), inject }`，通过 `ctx` 访问官方服务
- 三种安装方式全部写入 README：
  - npm：`dsh plugin --profile web add harness-whale`
  - Git：`dsh plugin --profile web add github:cakeni/harness-whale`（README 注明：带 `prepare` 构建脚本的 git 依赖需要在 profile 的 `pnpm-workspace.yaml` 加 `allowBuilds`）
  - 开发：`dsh plugin --profile web add link:../harness-whale`

**明确不做**：浏览器扩展、修改 Harness 本体、登录、云同步、商店、社交功能、MCP、后端服务、telemetry、analytics、等级/XP 系统。

## 3. 状态识别（官方契约，不做 DOM 文本嗅探）

订阅 Harness 官方客户端状态（`ctx.sessions` 会话快照 / 连接状态 / 宿主投影）。初版映射依据（字段级，见 RESEARCH.md 第 4 节）：

| 宠物状态 | Harness 信号 | 置信度 |
|---|---|---|
| idle | 以上皆无 | 默认态 ✅ |
| thinking | `snapshot.partial` 非空（流式输出中，含 text/reasoning 块） | ✅ |
| working | `snapshot.running === true` / `runningCalls` 非空 | ✅ |
| searching | `runningCalls[].name` ∈ {web_search, tool_web, …} | ✅ |
| bash | `runningCalls[].name` ∈ {bash, pwsh, …} | ✅ |
| editing | `runningCalls[].name` ∈ {str-replace-editor, 文件写入类工具} | ✅ |
| waiting | `snapshot.pending` 非空（用户提问/审批等待）/ `queue` 有 queued 消息 | ✅ |
| error | `promptError` / `turn-error` 节点 / `lastAgentError` / 连接 `reconnecting` | ✅ |
| success | 推导态：`running: true→false` 且无 error → 短暂庆祝（约 3s）后回 idle | ⚠️ 推导 |

要求：

- 全部检测逻辑收敛在 **`src/adapters/deepseek-harness.ts`**；adapter 核心是纯函数 `(SignalSnapshot) → PetStatus`，可直接单元测试
- 优先级：searching/bash/editing > working > thinking；error > success > 其他
- 交付**信号登记表**：每状态 → 检测机制 → 置信度 → 失败退化目标
- 识别不了的状态要明确指出，**不伪造**
- 不依赖界面文案（Harness 有中英文 i18n）；只用结构化字段/事件
- Harness API 变动时只改 adapter

## 4. 宠物 UI

- 默认显示在页面右下角，可拖动，位置存 localStorage（刷新后记忆）
- 点击触发互动动画；再次点击（或长按/专门按钮）打开设置面板
- 支持调整大小；不遮挡 Harness 主要操作区（贴边停靠 + 保守 z-index + 避让输入区与右下角浮动控件）
- 拖动范围限制在视口内

## 5. 鲸鱼视觉与素材

- **素材优先、程序化兜底**：`assets/whale/{idle,thinking,working,searching,bash,editing,success,error,waiting}.webp` 存在即播放；缺失则用 Canvas/SVG 程序化绘制鲸鱼（漂浮、吐泡、喷水、翻肚皮均可参数化）。MVP 无任何素材也应完整可看
- 动画系统与素材完全解耦：替换素材不改代码
- 素材版权：所有素材必须登记 `assets/whale/ATTRIBUTION.md`（来源 + 授权）；未登记素材不得合并；禁止从未知网站下载素材
- 建议初始包结构保持 assets 目录 + ATTRIBUTION.md 占位

## 6. 设置面板

至少提供：Enable Pet / Pet Size / Opacity / Reset Position / Reduced Motion / **Debug State**。
Debug State 手动切换 idle / thinking / working / success / error，并支持**自动轮播**（方便无任务时测试动画）+ 状态角标显示当前状态。设置存 localStorage。

## 7. 隐私（红线）

本地工具：**零遥测、零分析、零网络请求、不上传任何对话/代码**。README 显著声明：
`No telemetry. No conversation data leaves your browser.`
原生插件不申请任何浏览器权限。

## 8. Reduced Motion

尊重 `prefers-reduced-motion: reduce`：禁止持续漂浮与快速动画；状态仍正确显示；允许使用静态帧。

## 9. 工程结构

```
harness-whale/
  package.json
  cordis.patch.yml
  tsconfig.json
  tsdown.config.ts          # 打包（与官方插件一致的 rolldown 系工具）
  vitest.config.ts
  src/
    client/index.ts         # apply(ctx) 插件入口（唯一依赖注入点）
    adapters/deepseek-harness.ts   # 状态识别（唯一 Harness 耦合点）
    pet/                    # 渲染、拖拽、动画系统（素材无关）
    settings/               # 设置面板 UI
    storage/                # localStorage 封装（防泄漏、单例守卫）
  assets/whale/
    ATTRIBUTION.md
    *.webp                  # 可选素材；缺失时程序化兜底
  tests/                    # vitest：状态机 + adapter 纯函数 + storage + 单例守卫
  .github/workflows/ci.yml  # pnpm i + tsc --noEmit + vitest + tsdown build
  README.md
  README.zh.md
  LICENSE
  CHANGELOG.md
```

技术栈：TypeScript + **tsdown** + vitest；依赖最小化（无 UI 框架亦可，如用 React 需与官方一致的 ^18.2.0 peerDep）。

## 10. 测试

**可自动化（进 CI）**：
- 状态机单测（各状态迁移、success 超时回退）
- adapter 纯函数单测（构造 SignalSnapshot fixtures，覆盖 9 状态 + 优先级 + 未知信号退化）
- storage 封装单测（读写、损坏值兜底）
- 单例守卫单测（同页重复初始化不产生第二个宠物/第二组订阅）
- 订阅清理单测（dispose 后无泄漏）

**手动验收清单（如实标注需人验）**：
- 插件可加载（`__DSH_BOOT__` 含 harness-whale；`/plugins/harness-whale/client.js` 返回 200）
- 宠物注入、拖拽记忆、面板设置生效、Debug State 生效
- reduced-motion 生效
- SPA 路由切换不失效；刷新不重复注入；长时间运行无订阅/observer 泄漏

## 11. 开发与发布流程

- 开发环：`dsh plugin --profile web add link:../harness-whale` → `pnpm bundle` 重建 → 刷新页面验证（link 指向源码目录，重建即生效）
- 注意：**修改安装（add/remove）后需重启 `dsh web` 进程**，宿主才会重新扫描插件清单
- 发布：本地 review → 用户确认 → 由用户手动 `npm publish` + GitHub 建仓 push。**实现者不得 commit/push/publish**

## 12. 完成后交付报告（必交）

1. Harness 是通过什么机制判断 Agent 状态的（如实说明）
2. 新增文件清单
3. 安装/加载步骤（npm + git + link 三式）
4. 验证结果（自动化结果 + 哪些项需手动验证）
5. 无法可靠识别的状态，明确指出，不伪造
6. 不 commit、不 push、不发布，等 review
