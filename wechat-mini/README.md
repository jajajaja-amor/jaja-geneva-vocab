# 微信小程序版

这是原生微信小程序项目，内置同一份 709 条词库。词表搜索、每日 50 词批次、今日累计、七天学习记录、TXT 导入和 JSON 学习备份均可离线使用。导入词条可选调用现有 `/api/enrich` 服务补全；没有 API 也可直接导入英文和中文。

## 导入与预览

1. 安装并打开微信开发者工具，选择“导入项目”，项目目录选择本文件夹 `wechat-mini/`。
2. 当前 `project.config.json` 使用 `touristappid` 供本地预览。准备上传到微信时，将其中的 `appid` 换成你的小程序 AppID，并使用该账号登录开发者工具。
3. 在词表、每日练习、曲线和导入页逐项预览。真机发布前再测试一次本机存储和文件导入。

小程序不会把网页 `localStorage` 自动同步过来。网页先导出 JSON 备份，然后将文件发到微信聊天，在小程序“导入 → 恢复 JSON 备份”选择它，即可迁移词库与学习进度。小程序也可导出同格式备份。

## 可选 DeepSeek 补全

小程序的“导入 → 可选 AI 接口”可填写 `https://jaja-geneva-vocab.jingyachen0508.workers.dev` 和 `ENRICH_ACCESS_TOKEN` 访问口令；目前 Cloudflare 尚未配置 DeepSeek Key，需先在服务端设置。DeepSeek Key 不写进小程序。上线前需在微信小程序后台将接口 HTTPS 域名配置为 `request` 合法域名。没有接口或网络时，小程序内置词库与直接导入仍能使用。

当前原生版未接入语音播放；网页和本地 HTML 版仍支持设备浏览器语音。微信小程序正式发布需要用户自己的小程序 AppID、账号权限及平台审核。

修改网页内置词库后，运行 `npm run generate:mini` 重新生成 `wechat-mini/data/vocab.js`，再运行 `npm test`。
