# Harness Pet

> 一只住在 DeepSeek Harness 里的小鲸鱼。

**This is an unofficial community project. Not affiliated with, endorsed by, or maintained by DeepSeek. DeepSeek and related marks belong to their respective owners.**

**这是一个非官方社区项目，与 DeepSeek 无隶属、认可或维护关系。DeepSeek 及相关标识归其各自所有者所有。**

![Harness Pet 动画状态预览](./assets/whale/whale-animation-v6-contact-sheet.png)

```sh
dsh plugin --profile web add github:cakeni/harness-pet
```

[English](./README.md)

Harness Pet 是开源的 DSH 原生网页插件，不是浏览器扩展。它在 Harness 页面内渲染原创像素鲸鱼，并根据官方客户端运行时提供的结构化会话信号切换状态。

## 功能

- 九种状态：idle、thinking、working、searching、bash、editing、waiting、error、success。
- 使用经过 QA 的 8×9 图集和固定 192×208 单元格：待机、左右拖动游动、点击挥鳍、成功喷水、红温故障、等待、工作和拿放大镜搜索动画。
- 鲸鱼上方显示 Codex Pet 风格卡片，展示最新一条本地用户问题、Harness 实时/最终回复和进度；长回复会跟随最新流式文字且可手动回看，显示内容不会被持久化。
- 左右拖动分别使用独立游动动画行；单击播放短暂挥鳍动画，不会串帧溢出。
- 可选 Chromium 桌面小窗模式：Harness 主窗口最小化后，鲸鱼仍显示在 Document Picture-in-Picture 系统置顶窗口中。
- 可拖动、限制在视口内，位置保存到 `localStorage`。
- 可设置启用、大小、透明度、重置位置和减少动态效果。
- 支持调试状态强制切换、九状态自动轮播和实时状态角标。
- 原创像素素材直接内嵌进客户端 bundle；程序化 Canvas 鲸鱼作为加载失败时的后备。
- 完整清理订阅、定时器、动画帧、媒体偏好监听和窗口监听。

## 安装

需要 Harness `0.1.0-rc.6`，且 `pnpm` 位于 `PATH`。添加或删除插件后，需要自行重启 `dsh web` 进程，让宿主重新扫描插件清单；已安装 link 的代码重建只需刷新页面。

### npm

npm 包名预留给后续发布；npm 包正式发布前，请使用下面的 Git 或本地 link 安装方式。

```sh
dsh plugin --profile web add harness-pet
```

### Git

```sh
dsh plugin --profile web add github:cakeni/harness-pet
```

Git 依赖会执行本包的 `prepare` 构建。如果 pnpm 阻止构建，请把 CLI 输出的准确包名加入 profile 的 `pnpm-workspace.yaml`，例如：

```yaml
allowBuilds:
  harness-pet: true
```

然后重新执行安装。profile 通常位于 `$DSH_HOME/profiles/web`。

### 本地开发 link

在仓库的父目录执行：

```sh
dsh plugin --profile web add link:../harness-pet
```

开发时重建并刷新页面：

```sh
cd harness-pet
pnpm bundle
```

同一个 profile 不要重复安装多个本地 link。

## 状态识别

适配器订阅当前 `ctx.sessions` 列表和 `SessionFace` 快照，并观察 `ctx.connection.hostDescription`。连接曾经成功后，该结构化值变为缺失即表示正在重连。插件不匹配中英文界面文案，也不抓取 DOM。

优先级：`error > success > waiting > searching/bash/editing > working > thinking > idle`。

| 宠物状态 | 结构化检测方式 | 置信度 | 失败退化 |
|---|---|---:|---|
| `idle` | 没有更高优先级信号 | 高 | 保持 idle |
| `thinking` | `partial` 存在且没有工具运行 | 高 | 字段缺失或损坏时退化为 idle |
| `working` | `running === true`，或存在未识别的 `runningCalls` | 高 | 运行信号清空后退化为 idle |
| `searching` | 运行工具名命中网页工具表 | 中 | 未知工具名退化为 working |
| `bash` | 运行工具名命中 shell 工具表 | 中 | 未知工具名退化为 working |
| `editing` | 运行工具名命中文件写入/编辑工具表 | 中 | 未知工具名退化为 working |
| `waiting` | `pending` 非空，或 queue 中有 `placement: 'queued'` | 高 | 信号清空后落到低优先级活动状态 |
| `error` | `promptError`、最新 `turn-error`、`lastAgentError` 或重连 | 高 | 结构化错误消失后落到其他状态 |
| `success` | 无错误的 `running: true → false` 边沿，显示约 3 秒 | 推导 | 回到最新真实状态，通常为 idle |

工具名表只位于 [`src/adapters/deepseek-harness.ts`](./src/adapters/deepseek-harness.ts)。Harness 仍处于 1.0 前阶段，工具名可能改变；未识别的运行工具只会显示为 `working`，不会伪造成特定状态。

## 操作

- 单击鲸鱼触发一段短暂的挥鳍互动。
- 拖动鲸鱼并自动保存位置。
- 单击卡片中的灰色跟进图标可打开输入框；按 Enter 会通过官方 `SessionFace.prompt(..., 'queue')` 把文字发送到当前 Harness 会话。
- 对话卡片挡路时可点击右上角 `×` 关闭；在当前会话内它不会自动弹回，可通过设置中的 **Show Dialog** 重新显示。切换到其他会话后会再次显示。
- 双击、长按或点击齿轮打开设置；拖动设置面板的标题栏可单独移动面板，不会带动鲸鱼。
- 可在设置的 **Language** 中即时切换英文（默认）、简体中文、日文和韩文；选择会保存在浏览器本地。
- 在设置中点击 **打开独立宠物窗口** 后，可以最小化主 Harness 窗口，宠物会留在独立置顶小窗中；但不能关闭对应标签页或整个浏览器进程。
- 关闭宠物后，右下角仍保留齿轮，可重新启用。
- Debug State 可跟随 Harness 或强制任意状态；Auto-cycle 会轮播全部九种状态。

系统的 `prefers-reduced-motion: reduce` 和面板中的 Reduced Motion 都会停止持续动画，但仍保留正确的静态状态。

## 隐私

**No telemetry. Harness Pet sends no conversation data to any third party.**

**无遥测、无分析；Harness Pet 不会把对话数据发送给任何第三方。**

插件不自行发起 `fetch`，也不发送分析、遥测、云同步或第三方请求。它只读取显示最新用户问题和 Harness 回复所需的结构化字段，显示的对话文字不会持久化。只有当你主动提交跟进输入时，该文字才会通过 Harness 官方现有通道交给当前会话。只有设置保存在浏览器 `localStorage` 中，插件也不申请浏览器权限。

## 兼容性

| Harness 客户端 API | 状态 |
|---|---|
| `0.1.0-rc.6` | 目标版本；按已发布客户端类型完成类型检查 |
| 后续 `0.1.x` 预发布版 | 未验证；1.0 前 API 可能变化 |
| 浏览器扩展模式 | 不支持；本项目是 DSH 原生插件 |
| 桌面小窗 | Chromium 116+ 的 Document Picture-in-Picture；不支持的浏览器会禁用按钮 |

所有 Harness 耦合都集中在 adapter，API 变化时只需修复一个位置。

## 开发与测试

```sh
pnpm install
pnpm run typecheck
pnpm test
pnpm bundle
```

构建产物必须以 `window.__ModuleLoader__.load` 注册 `harness-pet`，并从 factory 导出 `{ apply, inject }`。

自动测试覆盖状态识别和优先级、success 迁移与超时、未知信号退化、损坏存储、单例复用，以及订阅/定时器清理。真实 Harness 内加载、拖动、视觉动画、SPA 导航和长时间泄漏检查仍需人工浏览器验收。

## 人工验收

自行安装并重启 `dsh web` 后：

1. 确认 `window.__DSH_BOOT__.entries` 包含 `harness-pet`。
2. 确认 `/plugins/harness-pet/client.js` 返回 HTTP 200。
3. 确认鲸鱼及其上方卡片出现，卡片显示最新本地问题和流式/最终回复，控制台无报错，各 Debug State 有明显区别。
4. 打开灰色跟进输入框，发送一条测试消息并确认它进入当前 Harness 会话；同时确认发送失败时草稿仍保留并显示错误。
5. 测试拖动、刷新后位置记忆、启用/关闭、大小、透明度和重置位置。
6. 分别开启系统和面板的减少动态效果，确认持续动画停止。
7. 打开 Desktop Window，最小化 Harness 主窗口，确认鲸鱼仍然可见；关闭小窗后确认鲸鱼回到 Harness。
8. 切换会话和 SPA 路由后再刷新，确认页面只有一个宠物。
9. 在条件允许时实际触发搜索、shell、编辑、等待交互、成功、错误和重连。
10. 长时间运行后检查订阅和定时器没有累积。

## 替换或新增素材

当前 8×9 动画图集直接内嵌进 `client.js`，因此运行时没有素材请求。图集使用固定 192×208 单元格和完全透明的空槽；喷水与呼吸孔相连、放大镜由前鳍握住、红温故障贴着身体，语义特效不会跨格。如需替换或新增 sprite：

1. 把已获授权的表情/状态素材放入 `assets/whale/`。
2. 在 [`assets/whale/ATTRIBUTION.md`](./assets/whale/ATTRIBUTION.md) 登记来源、作者和许可证；未登记素材不得分发。
3. 把素材字节打进 `client.js`（例如导入为 data URL），不要在运行时请求远程地址。
4. 保留程序化绘制作为兜底，并验证 reduced-motion。

禁止下载或加入来源不明的素材。

## 许可证

[MIT](./LICENSE)
