# dsh-wallpaper-theme

DeepSeek Harness (DSH) 的自定义壁纸主题插件：全屏背景图、侧边栏/输入框图案、界面表面透明度、强调色与文字颜色调节，全部通过 Web 设置面板完成，改动即时生效。

A custom wallpaper theme plugin for DeepSeek Harness (DSH): fullscreen background, sidebar / composer-input patterns, surface opacity, accent and text colors — all adjustable live from the Web settings panel.

> Community project; not an official DeepSeek product and not endorsed by DeepSeek.
>
> 社区项目，并非 DeepSeek 官方产品，也不代表 DeepSeek 官方背书。

## Features / 功能

- **全屏背景**：支持图片与视频壁纸（png/jpg/webp/gif/mp4/webm，≤100MB），可调暗化与模糊，可随时移除
- **侧边栏图案**：用本地图片填充左侧导航栏背景，右侧无缝隙
- **输入框图案**：用本地图片填充底部消息输入框卡片背景
- **填充方式**：背景 / 侧边栏 / 输入框各自可调铺满、等比、拉伸三种适配方式
- **界面表面**：主表面 / 侧边栏 / 浮层 / 输入框的不透明度分别调节
- **颜色**：品牌强调色、光标颜色、主文字颜色、次要文字颜色
- **自定义 CSS**：上传 .css 文件精细定制任何界面元素
- **保存与重置**：改动自动保存，支持手动落盘与一键恢复默认

## 初音风格主题（附带主题.zip）

仓库根目录的 `附带主题.zip` 是一套人工自制的初音（Hatsune Miku）风格主题，内含三张图片，可直接替换插件默认配置：

- `背景.png`：全屏背景图 → 设置 → 壁纸主题 → 背景 → 背景图片
- `侧边栏.png`：侧边栏图案 → 设置 → 壁纸主题 → 侧边栏 → 侧边栏图案
- `输入框.png`：输入框图案 → 设置 → 壁纸主题 → 输入框 → 输入框图案

先解压 zip，然后在对应位置依次上传这三张图片即可，无需修改任何文件。

> 本主题由人工制作，非 AI 生成。

## Install / 安装

```sh
dsh plugin --profile web add dsh-wallpaper-theme
```

Restart or reload the Web profile after installing. Open Settings → 壁纸主题 to configure.

安装后重启（或重载）Web profile，进入设置 → 壁纸主题 即可配置。

> 如果是从 GitHub 仓库安装（尚未发布到 npm），在仓库目录下执行：
>
> ```sh
> dsh plugin --profile web add file:/path/to/dsh-wallpaper-theme
> ```

## Configuration / 配置

所有配置通过设置面板操作，持久化在 profile 目录下的 `wallpaper-theme.json` 中，重启后依然生效。

All settings are made through the panel and persist to `wallpaper-theme.json` under the profile directory.

### 设置面板一览 / Settings overview

打开 设置 → 壁纸主题 后，各卡片功能如下：

- **背景**：全屏背景（图片或视频）、背景暗化、背景模糊、背景填充方式
- **界面表面**：主表面不透明度、浮层不透明度
- **侧边栏**：侧边栏不透明度、侧边栏图案、图案填充方式
- **输入框**：输入框不透明度、输入框图案、图案填充方式
- **颜色**：品牌强调色、光标颜色、主文字颜色、次要文字颜色
- **自定义样式**：上传 .css 文件精细定制任何界面元素

### 填充方式 / Fill modes

每个区域（背景 / 侧边栏 / 输入框）的图案都有三种填充方式：

- **铺满（cover）**：图片等比缩放填满整个区域，边缘可能被裁切
- **等比（fit）**：宽度铺满、高度按比例，可能出现留白
- **拉伸（stretch）**：图片拉伸填满整个区域，画面可能变形

## Safety / 安全

The Host only serves local files over loopback routes (`/wallpaper-theme/...`) and persists a small JSON document. It does not:

- 上传内容仅保存在本地 profile 目录（`wallpaper-upload.*`、`wallpaper-pattern-*.png`、`wallpaper-custom.css`），不会外传
- 不读取、不修改工作区外的任意文件
- 不执行命令、不发起额外模型请求

## Development

```sh
npm install
node --check lib/index.js
node --check lib/client.js
```

## Contributors / 贡献者

- **greentomato123** — 项目发起人、需求设计与测试、审阅与维护
- **DeepSeek 鲸鱼娘（DeepSeek AI）** — 代码编写与功能实现，AI 辅助

> Code authored with assistance from DeepSeek (AI). Reviewed and maintained by greentomato123.
>
> 代码由 DeepSeek AI 辅助编写，greentomato123 审阅与维护。

## License

MIT © 2026 dsh-wallpaper-theme contributors
