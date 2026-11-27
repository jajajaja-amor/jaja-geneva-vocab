# jaja 的日内瓦突击计划

个人英语词汇练习应用。词库含原有 569 条，加上数学与工程量 50 条、外交与圣诞活动 50 条、中式园林与意境 40 条，共 709 条。支持单词详情、英语朗读、每日连续 50 词批次、七天学习曲线、TXT 导入与 JSON 备份。

## 本地运行

需要 Node.js 20 或更新版本。运行 `npm start`，访问 `http://127.0.0.1:4173`。不配置 API 时，所有背诵、查询、朗读、手动 TXT 导入和备份功能仍能使用。

如需自动补全导入词条，在启动服务器前设置环境变量 `DEEPSEEK_API_KEY`。例如 PowerShell 当前会话：`$env:DEEPSEEK_API_KEY='你的密钥'`，然后运行 `npm start`。导入页的“模型接口设置”可保存 API 地址、模型 ID 和认证方式；API Key 始终只在服务器配置，不写入前端、浏览器设置或学习备份。示例配置见 `.env.example`；项目不会自动读取 `.env` 文件。

## TXT 导入与 DeepSeek 补全

每行可写 `Delegate | 代表`、`Delegate：代表`，也兼容原有多字段格式。上传或粘贴后先预览，点“用 DeepSeek 补全”会按每批最多 20 条向服务器发送英文和中文。服务端默认调用 [DeepSeek Chat Completions API](https://api-docs.deepseek.com/api/create-chat-completion/)，使用 `deepseek-flash`、非流式 JSON 输出、关闭思考模式，返回音标、词根拆解、简明解释及双语例句。英文和已有中文释义由用户输入锁定，不采用模型改写。服务端校验结束原因、返回顺序和条数。生成结果先在预览中显示，确认后才存入词库。模型请求失败或未配置 Key 时，可直接导入基础词条；已有释义和例句不会被模型覆盖。

第三方 OpenAI 兼容中转平台可在导入页设置 HTTPS 基础地址（可带 `/v1`）、模型 ID 与自动／Bearer／x-api-key 认证方式。服务端自动补上 `/chat/completions`，并要求先把中转域名写入 `ENRICH_ALLOWED_HOSTS`，同时配置 `VOCAB_API_KEY`（优先于 `DEEPSEEK_API_KEY`）。服务端拒绝本机、内网、IP 地址、未允许的域名及 HTTP 重定向。官方 DeepSeek 地址无需加入域名列表。

浏览器英语语音为词条与例句朗读，无需 DeepSeek。语音质量依赖浏览器及设备的语音包。DeepSeek 补全是生成内容，建议在预览中核对专业术语、音标及例句。

## 部署

仓库含 `api/enrich.js`，可用于 Vercel 的 Node Serverless Function；静态页面位于 `dist/`，部署配置在 `vercel.json`。在 Vercel 中配置 `DEEPSEEK_API_KEY` 和 `ENRICH_ACCESS_TOKEN`；需要中转平台时另配 `VOCAB_API_KEY` 和 `ENRICH_ALLOWED_HOSTS`。公开部署上的补全接口要求访问口令，网页会在首次补全时询问口令；不要将口令写入前端文件。若未部署 API 路由，静态页面仍能使用，只有 AI 补全不可用。本地 `server.mjs` 在回环地址提供同一接口，方便测试。

Cloudflare 版本已部署到 https://jaja-geneva-vocab.jingyachen0508.workers.dev 。Worker 与静态资源配置见 `wrangler.jsonc` 和 `cloudflare/worker.mjs`。当前未配置 AI 密钥；如需开启补全，在所选 Cloudflare 账号中运行 `wrangler secret put DEEPSEEK_API_KEY` 和 `wrangler secret put ENRICH_ACCESS_TOKEN`。第三方 API 另需 `VOCAB_API_KEY` 和 `ENRICH_ALLOWED_HOSTS`。未配置 Key 时网页的核心学习功能仍可用。普通 Cloudflare 全球网络不能保证中国大陆持续可达；若要求有保障的中国大陆访问，需另行满足 Cloudflare China Network 服务与中国大陆域名备案条件。

运行 `npm run export:offline` 会在项目上一级生成单文件 `jaja-geneva-vocab-offline.html`；双击即可在本机浏览器使用词表、练习、朗读、TXT 直接导入及备份。单文件模式不调用 AI 补全接口。

微信小程序源码在 `wechat-mini/`，使用方法见 [小程序说明](wechat-mini/README.md)。内置 709 条词库并离线保存学习记录；DeepSeek 补全复用同一个受口令保护的服务端接口。

应用用当前浏览器 `localStorage` 保存个人词库和进度，不会跨设备自动同步。请使用“导出备份 / 恢复 JSON 备份”迁移。旧版浏览器进度在同一站点来源下会自动追加 140 条主题词，不清空旧记录。仓库内的 `dist/vocab.js` 为原有 569 条词汇，`dist/extra-vocab.js` 为三组新增词汇；新增词汇有英文例句和中文释义，暂缺音标、词根及部分例句译文，不会用不准确的内容填充。

## 练习规则

每天先开启一组最多 50 个不同词条。完成后可开启下一组，优先选择当天没出现过的词；全库都练过后再允许重复。今日累计完成数按“记住了 / 忘记了”的操作次数计算，跳过不计入。每个批次及当天累计数会保存在浏览器中，跨日自动重置当天计数。学习曲线仍按标记次数统计。

## 开发与验证

运行 `npm run check` 检查语法，运行 `npm test` 检查词库数量、批次、累计、导入、搜索、迁移、Cloudflare Worker 和微信小程序核心流程。真实 API 调用需要你自己的密钥。`CHANGELOG.md` 记录主要行为变化；后续每次修改应作为独立 Git 提交保存。
