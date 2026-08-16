# dsh-wallpaper-theme

DeepSeek Harness (DSH) 的自定义壁纸主题插件：全屏背景图、侧边栏/输入框图案、界面表面透明度、强调色与文字颜色调节，全部通过 Web 设置面板完成，改动即时生效。

A custom wallpaper theme plugin for DeepSeek Harness (DSH): fullscreen background, sidebar / composer-input patterns, surface opacity, accent and text colors — all adjustable live from the Web settings panel.

> Community project; not an official DeepSeek product and not endorsed by DeepSeek.
>
> 社区项目，并非 DeepSeek 官方产品，也不代表 DeepSeek 官方背书。

## Features / 功能

- **全屏背景图**：上传本地图片（png/jpg/webp/gif，≤20MB）铺满整个界面，可调暗化与模糊，可随时移除
- **侧边栏图案**：用本地图片填充左侧导航栏背景，右侧无缝隙
- **输入框图案**：用本地图片填充底部消息输入框卡片背景
- **界面表面**：主表面 / 侧边栏 / 浮层 / 输入框的不透明度分别调节
- **颜色**：品牌强调色、主文字颜色、次要文字颜色
- **自定义 CSS**：上传 .css 文件精细定制任何界面元素
- **保存与重置**：改动自动保存，支持手动落盘与一键恢复默认

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

## License

MIT © 2026 dsh-wallpaper-theme contributors
