# IDM Smart Controller (IDM 智能管理器)

[![Manifest V3](https://img.shields.io/badge/Manifest-V3-blue.svg)](https://developer.chrome.com/docs/extensions/mv3/intro/)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)
[![Platform: Chrome](https://img.shields.io/badge/Platform-Chrome%20%7C%20Edge%20%7C%20Brave-orange.svg)](#)

一个轻量级的 Chrome 扩展，基于 Manifest V3 构建。用于在特定网页或特定场景下自动/手动停用 IDM（Internet Download Manager）浏览器扩展，防止 IDM 强行劫持其他扩展（如 SingleFile、抓图插件、油猴脚本）的内存 Blob 与自定义命名下载通道。

---

## 痛点背景

IDM 官方扩展（IDM Integration Module）在嗅探音视频时非常实用，但其全局拦截机制过于霸道：
- **元数据丢失**：SingleFile 或批量下载扩展通过 `blob:` / `data:` 生成文件时，IDM 强行抢占会导致自定义路径与规范文件名失效，沦为随机哈希名直接保存到默认下载目录。
- **协议限制**：IDM 客户端内置的排除列表仅支持标准网络协议（`http`/`https`），无法过滤扩展内部发起的下载。

**IDM Smart Controller** 采用“以扩展治扩展”的思路，通过 Chrome `management` API 对 IDM 扩展实施精准管理。

---

## 核心特性

- **多标签页智能感知**：在选项中配置域名黑名单。只要浏览器中有**任意标签页**匹配规则，IDM 扩展自动禁用；当所有匹配标签页关闭后，IDM 自动恢复启用。
- **一键全局切换**：
  - **快捷键**：按下 `Alt + Shift + D` 瞬间切换 IDM 状态。
  - **工具栏点击**：左键单击扩展图标直接切换。
- **Canvas 矢量状态图标**：
  - 🟢 **启用状态**：绿背景 + 白色下载箭头（IDM 启用中）。
  - 🚫 **禁用状态**：绿底白下载箭头 + 红色禁止符号（IDM 关闭中）。
- **动态上下文悬停提示**：鼠标悬停在扩展图标上，可即时查看当前状态以及触发禁用的标签页 URL。
- **零外部依赖**：无任何打包工具与第三方库，代码透明可审计。

---

## 项目结构

```text
idm-smart-controller/
├── manifest.json     # 扩展元数据、权限与快捷键声明
├── background.js     # 后台 Service Worker（状态轮询、标签页监听与 Canvas 渲染）
├── options.html      # 设置页
├── options.js        # 设置存储与同步
└── README.md         # 项目说明文档
```
