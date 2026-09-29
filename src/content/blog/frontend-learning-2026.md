---
title: '2026 前端学习复盘：从工具到思维'
description: '这半年学 Astro 和 Tailwind 的一些心得：与其追逐新框架，不如理解背后的问题。'
pubDate: 2026-09-05
tags: ['学习', '前端']
cover: '/images/gallery/city.jpg'
---

用这个网站当作练手项目，把最近半年学的东西串一遍。

## 学了什么

- **Astro**：内容优先的静态框架，默认零 JS，按需激活
- **Tailwind CSS v4**：原子化样式的新引擎，构建速度大幅提升
- **原生 Web API**：IntersectionObserver、Canvas、View Transitions

## 最大的转变：从"用什么"到"为什么"

以前学前端，追着框架跑：React 出新特性学一遍，Vue 出新提案看一遍。今年最大的变化是开始问——**这个工具解决的是什么问题？**

比如 Astro 的"群岛架构"：

```html
<!-- 静态 HTML 里有 90% 的内容根本不需要 JS -->
<!-- 只让评论区、轮播图这类"岛屿"水合就够了 -->
<Comments client:visible />
```

本质上是对"默认发送多少 JavaScript"的重新思考。理解了这一点， islands、partial hydration、resumability 这些概念就串起来了。

## 学习方法上的收获

1. **以输出倒逼输入**：做真项目，比看十个教程都有用
2. **读源码不贪多**：只读入口和核心路径
3. **写复盘**：就像这篇文章，写下来才知道哪里其实没懂

## 下一步

想深入的方向：WebGL 与动效、视频在 Web 上的最佳实践、以及把网站的 Lighthouse 分数刷到全绿。

给半年后的自己：希望你还保持着现在的手感。
