# Inspiration Wall · 灵感漂流墙

手机扫码填写卡片，现场大屏自动更新。适用于校园活动、工作坊、展览和社群见面会。

React + Vite 前端，Cloudflare Pages Functions + D1 持久化存储。由真实活动项目整理成独立模板；本仓库只包含通用代码、自制 SVG 与虚构示例，不附带参与者数据和活动品牌授权。

## 能做什么

- 独立手机填卡页 `/join`，五题必填、工具多选。
- 大屏 `/` 每 5 秒轮询，新增卡片播放入场动画。
- 漂浮、旋转与碰撞响应；二维码区域避让；最多展示最新150张。
- CSV（含北京时间、UTF-8 BOM、公式注入防护）与 JSON 全量导出。
- 短暂读取失败保留已有卡片，恢复网络后自动重试；提交仅在数据库写入成功后显示成功。
- `site.config.js` 集中配置活动名称、文案、问题标题、选项、Logo、刷新间隔和成功页说明。

这是一种近实时轮询方案，并非 WebSocket 推送。正常延迟约一个轮询周期加网络时间；不保证任何网络下都可访问。

## 本地运行

需要 Node.js 24 和 pnpm 11（`packageManager` 指定版本）。

```sh
pnpm install
pnpm db:local
pnpm dev
```

打开 Wrangler 打印的本地地址，通常为 `http://localhost:8788`。大屏在 `/`，表单在 `/join`。手机不能通过自己的 localhost 打开电脑服务；本地预览不是公网发布。

修改源码后重新运行 `pnpm dev`，这个命令会先构建再启动 Pages 开发服务器。无需腾讯文档 Token 或付费同步接口。本地 D1 保存在 `.wrangler/`，删掉该目录会重置本地数据。

`/?demo=1` 展示六张明确标记的虚构示例卡，不请求卡片列表。正式初始数据库为空，不会自动插入示例。`pnpm test` 使用内存数据库与模拟请求，不连接正式活动。

## 部署到自己的 Cloudflare

每位使用者都必须创建自己的 Pages 项目和 D1 数据库。保留 `wrangler.jsonc` 中的 `DB` 绑定名。

1. 复制此仓库，在本机执行 `pnpm install` 和 `pnpm exec wrangler login`，授权 Pages 与 D1。
2. 创建数据库：

   ```sh
   pnpm exec wrangler d1 create inspiration-wall --location apac
   ```

3. 将命令返回的数据库 UUID 填到 `wrangler.jsonc` 的 `d1_databases[0].database_id`，替换全零占位符。若使用其他数据库名，同时更新 `database_name` 与数据库脚本命令。数据库 ID 是资源标识，不是密码；模板中的占位值不会指向原活动。
4. 创建表：`pnpm db:remote`。
5. 创建 Pages 项目（名称需按自己的账号调整）：

   ```sh
   pnpm exec wrangler pages project create inspiration-wall --production-branch main
   pnpm build
   pnpm exec wrangler pages deploy dist --project-name inspiration-wall --branch main
   ```

6. 部署完成后，用返回的正式地址验证 `/healthz`、`/join` 和扫码。二维码动态指向当前站点的 `/join`，不会指向原作者的站点。
7. 打开一台电脑的大屏，在另一台手机提交测试卡；确认保存提示、大屏更新与导出结果一致后再投入活动。

不要只把 dist 作为普通静态文件上传：仓库根目录的 `functions/` 负责数据库接口。Wrangler 会一起编译上传。也可以在 Pages 控制台连接 GitHub：根目录为仓库根，构建 `pnpm build`，输出 `dist`，Node 24；部署前配置自己的 D1 `DB` 绑定。

免费额度与套餐规则以 Cloudflare 当时的官方说明为准。本项目不承诺永久免费或中国大陆网络稳定访问；活动前请关闭 VPN，用现场 Wi-Fi 与手机流量测试完整流程。

## 自定义

编辑 `site.config.js` 后重新构建和发布：

| 配置 | 用途 |
| --- | --- |
| `name` / `subtitle` | 品牌名和副标题 |
| `tagline` / `formIntro` | 大屏介绍与填写提示 |
| `questions` | 五个问题的显示标题（存储键固定） |
| `tools` | 工具多选列表；可另填其他工具 |
| `interestOptions` | 三个参与意愿选项；服务端共享校验 |
| `pollIntervalMs` | 轮询间隔，默认5000毫秒，最小2000 |
| `maxVisibleCards` | 1～150，前后端共用 |
| `logo` / `accentColor` | Logo 路径与按钮主色 |
| `successMessage` / `successSteps` | 成功说明、后续步骤及可选二维码图片 |

背景图是 `public/background.svg`；完整样式在 `src/globals.css`。图片放在 `public/`，配置路径从 `/` 开始。二维码素材务必替换成自己有权使用的图片。修改问题标题不会改变原有回答字段；如需完全不同的问卷结构，还要同步修改 API 校验、导出和详情卡。

## 导出、数据和限制

大屏底部“导出”，或直接下载：

- `/api/export?format=csv`
- `/api/export?format=json`

导出所有回答，展示数量上限不影响导出。数据库内容在重新部署后仍保留；更换数据库不会自动迁移原数据。活动结束后及时导出备份。

卡片与导出接口均公开，没有管理员登录或内容审核。请在公开现场仅收集允许公开的信息；如需后台、审批、删除或限流，请先扩展再使用。用户文本通过 React 转义、SQL 使用绑定参数，不能替代完整防滥用设计。代码中没有把 `Origin` 检查当作身份验证。

浏览器后台标签可能降低定时器频率；恢复焦点会立即拉取。离线时可继续看到已加载卡片，但不能发布新内容。150张同时显示时会缩小卡片，阅读细节请点击卡片；小屏仍建议用作填卡而不是活动主大屏。

## 项目结构

```text
site.config.js             活动公共配置
src/page.tsx               大屏、表单、详情和成功页
src/floating-physics.ts    布局与碰撞
cloud/worker.mjs           D1 API、二维码与导出
cloud/schema.sql           数据表与索引
functions/[[path]].js      Pages Functions 入口
public/                    自制通用SVG与静态路由配置
tests/                     API与150张卡片物理测试
```

## 验证与贡献

```sh
pnpm test
pnpm build
```

测试覆盖150次提交、列表和导出、字段校验、缺失数据库、二维码、表单路由及大屏150张卡片碰撞。网络可达性仍要由实际部署验收。GitHub Actions 在 push / PR 时运行测试与构建。

欢迎提交 Issue 或 PR。请不要上传真实回答、访问令牌或未经授权的品牌素材。见 [贡献说明](CONTRIBUTING.md) 和 [安全与数据边界](SECURITY.md)。

## 许可证与署名

本仓库代码和自制 SVG 采用 [MIT License](LICENSE)，版权所有 Aprileve4。依赖保留各自许可证。活动中曾使用的第三方品牌图片、背景和二维码不包含在仓库中；本项目不代表或隶属于任何工具品牌。示例中的工具名称仅用于说明。
