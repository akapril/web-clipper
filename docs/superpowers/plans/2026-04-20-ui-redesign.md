# UI Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Redesign the clipper popup from a 324px sidebar to a 520px centered panel with left-right split layout (clip types | content preview), bottom action bar, and modern styling.

**Architecture:** Keep all existing data flow (Redux/dva models, extension system, service layer) untouched. Only modify the presentation layer: container positioning/sizing, tool page layout, and component arrangement. Use antd 5 theme tokens for consistent dark/light mode. The editor panel integrates into the right side instead of a separate floating panel.

**Tech Stack:** React, antd 5, CSS Modules (LESS), dva

---

## New Layout

```
┌──────────────────────────────────────────────────┐
│  Web Clipper                        [👤▼] [⚙] [✕] │
├────────────┬─────────────────────────────────────┤
│            │                                     │
│  📋 智能提取 │   [标题输入框                    ]  │
│  📑 整个页面 │   [标签输入框                    ]  │
│  📸 截图    │                                    │
│  📷 长截图  │   ┌─────────────────────────────┐  │
│  📄 保存PDF │   │                             │  │
│  🔖 书签   │   │     内容预览区               │  │
│  📱 二维码  │   │     (Markdown 渲染)          │  │
│  ✋ 手动选取 │   │                             │  │
│            │   └─────────────────────────────┘  │
│  ── 工具 ── │                                    │
│  ⚡🔗📋⬇️🧹 │   目标: [Obsidian      ▼]          │
│  📝✏️≡🗑️📎 │   文件夹: [Clippings   ▼]          │
│            │                                    │
│            │         [  💾 保存内容  ]           │
└────────────┴─────────────────────────────────────┘
```

## File Structure

| Action | File | Responsibility |
|--------|------|----------------|
| Rewrite | `src/pages/tool/index.tsx` | New split layout with left sidebar + right content |
| Rewrite | `src/pages/tool/index.less` | New layout styles |
| Rewrite | `src/pages/tool/Header.tsx` | Title + tags in right panel top |
| Modify | `src/pages/tool/ClipExtension.tsx` | Vertical icon list for left panel |
| Modify | `src/pages/tool/toolExtensions.tsx` | Compact icon grid for left panel |
| Rewrite | `src/components/container/index.tsx` | Centered panel instead of right-fixed sidebar |
| Rewrite | `src/components/container/index.less` | New container sizing and positioning |
| Create | `src/pages/tool/ContentPreview.tsx` | Markdown content preview component |
| Create | `src/pages/tool/ContentPreview.less` | Preview area styles |

---

### Task 1: Container — Centered panel layout

**Files:**
- Rewrite: `src/components/container/index.less`
- Modify: `src/components/container/index.tsx`

- [ ] **Step 1: Update container styles for centered panel**

Replace `src/components/container/index.less`:

```less
.mainContainer {
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  z-index: 2147483647;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
  border-radius: 12px;
  overflow: hidden;
}

.toolContainer {
  width: 520px;
  max-height: 85vh;
  overflow-y: auto;
  padding: 0;
}

.closeButton {
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border-radius: 6px;
  transition: background 0.2s;
}
.closeButton:hover {
  background: rgba(0, 0, 0, 0.06);
}

.editorContainer {
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  z-index: 2147483646;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
  border-radius: 12px;
  overflow: hidden;
}

.mask {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.45);
  z-index: 2147483646;
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/container/
git commit -m "feat(ui): 居中面板布局，520px 宽度 + 圆角阴影"
```

---

### Task 2: Tool page — Split layout structure

**Files:**
- Rewrite: `src/pages/tool/index.tsx`
- Rewrite: `src/pages/tool/index.less`

- [ ] **Step 1: Create new split layout styles**

Replace `src/pages/tool/index.less`:

```less
.wrapper {
  display: flex;
  height: 100%;
}

/* 顶栏 */
.topBar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  border-bottom: 1px solid rgba(0, 0, 0, 0.06);
  .title {
    font-size: 14px;
    font-weight: 600;
  }
  .actions {
    display: flex;
    align-items: center;
    gap: 8px;
  }
}

/* 左侧剪藏类型面板 */
.leftPanel {
  width: 140px;
  min-width: 140px;
  border-right: 1px solid rgba(0, 0, 0, 0.06);
  padding: 8px;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
}

.sectionLabel {
  font-size: 11px;
  color: rgba(0, 0, 0, 0.35);
  padding: 8px 8px 4px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.clipButton {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 8px;
  border-radius: 6px;
  cursor: pointer;
  font-size: 13px;
  transition: background 0.15s;
  border: none;
  background: transparent;
  width: 100%;
  text-align: left;
  color: inherit;
}
.clipButton:hover {
  background: rgba(0, 0, 0, 0.04);
}
.clipButtonActive {
  background: rgba(22, 119, 255, 0.08);
  color: #1677ff;
}

.toolGrid {
  display: flex;
  flex-wrap: wrap;
  gap: 2px;
  padding: 4px 4px;
}
.toolIcon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
  transition: background 0.15s;
  border: none;
  background: transparent;
  color: inherit;
}
.toolIcon:hover {
  background: rgba(0, 0, 0, 0.06);
}

/* 右侧内容面板 */
.rightPanel {
  flex: 1;
  display: flex;
  flex-direction: column;
  padding: 12px 16px;
  overflow-y: auto;
  min-height: 300px;
}

.previewArea {
  flex: 1;
  min-height: 120px;
  max-height: 250px;
  overflow-y: auto;
  padding: 8px;
  border: 1px solid rgba(0, 0, 0, 0.06);
  border-radius: 8px;
  margin: 8px 0;
  font-size: 13px;
  line-height: 1.6;
}

.bottomBar {
  padding-top: 8px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.targetRow {
  display: flex;
  gap: 8px;
  align-items: center;
}

.saveButton {
  margin-top: 4px;
}

/* 保留旧的 header 样式兼容 */
.header {
  :global(.ant-form-item) {
    margin-bottom: 8px;
  }
}
.section {
  margin-bottom: 8px;
}
```

- [ ] **Step 2: Rewrite tool page with split layout**

Rewrite `src/pages/tool/index.tsx` with new structure:
- Top bar: "Web Clipper" title + account dropdown + settings + close
- Left panel: Clip extensions (vertical list) + Tool extensions (icon grid)
- Right panel: Header (title + tags) + content preview + target selection + save button

The component keeps all existing Redux connections and data flow, only changes the JSX layout.

- [ ] **Step 3: Commit**

```bash
git add src/pages/tool/
git commit -m "feat(ui): 左右分栏布局 — 剪藏类型 | 内容面板"
```

---

### Task 3: Content preview component

**Files:**
- Create: `src/pages/tool/ContentPreview.tsx`
- Create: `src/pages/tool/ContentPreview.less`

- [ ] **Step 1: Create content preview component**

A simple component that renders the current clipped content as readable text (truncated Markdown preview). Connects to Redux `clipperData[pathname]` to show current content.

- [ ] **Step 2: Create preview styles**

Minimal styles for the preview box with scrollable area.

- [ ] **Step 3: Commit**

```bash
git add src/pages/tool/ContentPreview.tsx src/pages/tool/ContentPreview.less
git commit -m "feat(ui): 添加内容预览组件"
```

---

### Task 4: Clip extension buttons — Vertical list

**Files:**
- Modify: `src/pages/tool/ClipExtension.tsx`

- [ ] **Step 1: Change from block buttons to compact vertical list**

Replace the existing wide buttons with compact `clipButton` style items showing icon + short name. Highlight active extension.

- [ ] **Step 2: Commit**

```bash
git add src/pages/tool/ClipExtension.tsx
git commit -m "feat(ui): 剪藏扩展改为紧凑垂直列表"
```

---

### Task 5: Tool extensions — Compact icon grid

**Files:**
- Modify: `src/pages/tool/toolExtensions.tsx`

- [ ] **Step 1: Change from horizontal buttons to wrapped icon grid**

Use `toolGrid` + `toolIcon` styles for a compact multi-row icon grid in the left panel.

- [ ] **Step 2: Commit**

```bash
git add src/pages/tool/toolExtensions.tsx
git commit -m "feat(ui): 工具扩展改为紧凑图标网格"
```

---

### Task 6: Build verification and polish

- [ ] **Step 1: Run tests**

Run: `npx vitest run`
Expected: All tests pass.

- [ ] **Step 2: Build**

Run: `npx webpack --config webpack/webpack.prod.js`
Expected: Build succeeds.

- [ ] **Step 3: Fix any issues, commit**

```bash
git add -A
git commit -m "fix(ui): 修复构建和样式问题"
```
