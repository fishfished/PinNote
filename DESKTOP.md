# PinNote 桌面版构建指南

PinNote 使用 **Tauri 2** 打包为原生桌面应用。窗口全屏透明、始终置顶，卡片真正悬浮在所有其他窗口上方。

安装包体积约 **8–15 MB**（不含系统 WebView）。

---

## 前置依赖

### 1. Bun
```bash
curl -fsSL https://bun.sh/install | bash
bun -v  # >= 1.0
```

### 2. Rust 工具链
```bash
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
source ~/.cargo/env
rustc -V  # 确认安装成功
```

### 3. 平台依赖

**macOS：**
```bash
xcode-select --install
```

**Windows：**
- [Microsoft C++ Build Tools](https://visualstudio.microsoft.com/visual-cpp-build-tools/)
- WebView2（Windows 11 已内置；Windows 10 需另装）

**Linux（Ubuntu/Debian）：**
```bash
sudo apt update && sudo apt install -y \
  libwebkit2gtk-4.1-dev libappindicator3-dev \
  librsvg2-dev patchelf
```

---

## 应用图标

把一张 **1024×1024 的 PNG** 放到 `src-tauri/icons/icon-source.png`，然后运行：

```bash
bunx @tauri-apps/cli icon src-tauri/icons/icon-source.png
```

命令会自动生成所有平台所需的尺寸（`.icns` / `.ico` / `.png`）。

---

## 环境变量（可选）

OCR 功能需要 Gemini API Key：

```bash
cp .env.example .env
# 编辑 .env，填入：
# GEMINI_API_KEY=your_gemini_api_key
```

不填也能正常使用，只是截图后无法自动识别文字。

---

## 开发模式

```bash
bun install
bun run tauri:dev
```

第一次运行会编译 Rust 依赖，约需 **3–5 分钟**。之后热重载很快。

开发模式下 Tauri 连接本机 `http://localhost:3000`，Next.js 和 Tauri 窗口同时启动。

---

## 打包发布版本

```bash
bun run tauri:build
```

打包产物：

| 平台 | 路径 | 格式 |
|------|------|------|
| macOS | `src-tauri/target/release/bundle/macos/` | `.app` |
| macOS | `src-tauri/target/release/bundle/dmg/` | `.dmg` |
| Windows | `src-tauri/target/release/bundle/msi/` | `.msi` |
| Windows | `src-tauri/target/release/bundle/nsis/` | `.exe` 安装包 |
| Linux | `src-tauri/target/release/bundle/deb/` | `.deb` |
| Linux | `src-tauri/target/release/bundle/appimage/` | `.AppImage` |

---

## 桌面版行为说明

| 特性 | 说明 |
|------|------|
| **全屏透明窗口** | 启动即覆盖整个屏幕，背景完全透明，卡片浮在最顶层 |
| **始终置顶** | 覆盖在所有应用窗口之上，可从托盘菜单「取消置顶」 |
| **无边框** | 没有系统标题栏，界面完全由 PinNote 自己渲染 |
| **托盘图标** | 关闭窗口只隐藏，从托盘可重新召唤；右键「退出 PinNote」彻底退出 |
| **快捷键** | 全局生效，可在卡片盒设置里自定义 |

---

## 常见问题

**Q: `error: failed to get `tauri-build` as a dependency`**
A: 运行 `cargo update` 刷新依赖缓存，然后重试。

**Q: macOS 提示「无法打开，开发者身份未验证」**
A: `xattr -cr /Applications/PinNote.app`，或在「系统设置 → 隐私与安全」里点「仍要打开」。

**Q: Windows Defender / SmartScreen 拦截**
A: 点「更多信息」→「仍要运行」。自签名应用首次运行会触发，属正常现象。

**Q: 窗口打开后点穿了，点不到下面的应用**
A: 这是正常行为——PinNote 的卡片之外的区域是透明且可穿透的（`pointer-events: none`）。
只有卡片本体可以接收鼠标事件。

**Q: OCR 不工作**
A: 检查 `.env` 里是否填了 `GEMINI_API_KEY`，且网络能访问 Google API。
