# 炫酷涂鸦 · 轻量版

日麻**何切**随机测试，纯静态单页：零构建、零依赖、无图片字体资源，可直接丢到任意静态托管。

- 题库：**605 题**（含局况、宝牌指示牌、手牌、正解、文字解析）
- 玩法：每局随机抽 10 / 20 题 → 点你要切的牌 → 立刻判对错并给解析 → 结算按正确率给雀力评级
- 牌面用 Unicode 麻将字符渲染（🀇 一类），因此整个站不到 300KB

## 文件

| 文件 | 说明 |
|---|---|
| `index.html` | 页面骨架 |
| `style.css` | 样式（深绿主题，移动端优先） |
| `app.js` | 全部逻辑（抽题 / 判题 / 评级 / 解析渲染） |
| `questions.json` | 题库，`{meta, questions:[{id, round, dora, hand[14], answer, explain}]}` |

`explain` 里的牌用 `[[3m]]` 标记，前端渲染成小牌面。

## 重新生成题库

```bash
python3 /workspace/tools/parse_articles.py <articles.js 路径> questions.json
```

脚本会跳过答案牌不在手牌内的异常题（当前 1 题：id 219，答案图为 8p 而手牌里没有 8p）。
