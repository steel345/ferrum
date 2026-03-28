# 🔩 Ferrum — Minecraft Datapack & Resourcepack Editor

> A professional, feature-rich editor purpose-built for Minecraft Java Edition datapack and resourcepack development. No raw JSON required.

---

## ✨ Features

### 🖊️ Monaco Code Editor
The same editor that powers **VS Code** — built right in.
- Full syntax highlighting for JSON, mcfunction, YAML and more
- Autocomplete for Minecraft commands, selectors, and NBT
- Jump-to-definition and cross-file references
- Bracket matching, multi-cursor, and find & replace

### 🎨 Visual Editors
Edit your datapack files without touching raw JSON:
- **Recipe Editor** — drag & drop crafting grid
- **Loot Table Editor** — build loot tables visually
- **Pack Metadata Editor** — configure pack.mcmeta with a form
- **Biome Editor** — tweak biome settings visually

### 🤖 Built-in AI (Two Modes)
Generate datapack code directly from a text prompt:
- **Free AI** — powered by GPT-4o, no API key needed, works instantly
- **Claude AI** — powered by Anthropic Claude, higher quality output, requires your own API key
- Upload images or texture files — if you describe a custom item and attach a texture, it gets automatically added to your resourcepack
- Modes: Generate File, Add to Current, Explain, Fix & Improve

### 📦 Asset Browser
- Search and insert any Minecraft item, block, or entity instantly
- **1500+ items and blocks** across all categories: Tools, Armor, Food, Combat, Blocks, Nature, Nether, End, Redstone, Wood, Stone, Wool, Concrete, Terracotta, Glazed Terracotta, Concrete Powder, Dyes, Glass, Beds, Carpets, Banners, Candles, Signs, Skulls, Ice & Snow, Prismarine, Pottery, Smithing Templates, Spawn Eggs, Music Discs, Copper, and more
- Click to copy ID — double-click to insert into the active file

### 🔗 Linked Workspaces
- Datapack and resourcepack are created and linked together automatically
- One-click scaffold generates the full folder structure + `pack.mcmeta`
- Both packs stay in sync as you work

### 🎮 Minecraft Test Launch
- **Web version** — generates a one-click server launch package (ZIP) that auto-downloads Java and the Minecraft server jar
- **Desktop (EXE) version** — detects your local Minecraft installation and launches a dev instance directly with your datapack loaded
- No extra setup required

### 💾 Project Manager
- Save and load multiple projects
- Auto-save support
- Export as ZIP — ready to drop into any Minecraft world
- Import existing datapacks by dropping in a ZIP

### 🔄 Auto-Updates
The desktop app checks for updates on launch and installs them silently — you always have the latest version automatically.

---

## 🚀 Getting Started

### Web Version (Development)
```bash
git clone https://github.com/steel345/ferrum.git
cd ferrum
npm install
npm run dev
```
Open `http://localhost:5173` in your browser.

### Desktop App (EXE)
Download the latest `.exe` from the [Releases](https://github.com/steel345/ferrum/releases) page and run it. No installation required for the portable version.

To build it yourself:
```bash
npm install
npm run electron:build
```
The EXE will appear in the `release/` folder.

---

## 🗂️ Project Structure

```
ferrum/
├── electron/           # Electron main process (desktop app shell)
│   ├── main.js         # Window, IPC handlers, Minecraft launcher
│   └── preload.js      # Safe bridge between Electron and React
├── src/
│   ├── components/     # All UI components
│   │   ├── ai/         # AI panel
│   │   ├── browsers/   # Asset browser
│   │   ├── dialogs/    # New project, settings, import/export
│   │   ├── editors/    # Monaco + visual editors
│   │   └── layout/     # Toolbar, sidebar, activity bar
│   ├── data/           # Minecraft data (items, biomes, versions)
│   ├── store/          # Zustand global state
│   └── utils/          # Scaffold, zip, Electron bridge, MC launcher
├── .github/workflows/  # GitHub Actions — auto builds EXE on release
└── public/             # App icon
```

---

## 🎯 Supported Minecraft Versions
Ferrum supports all major Minecraft Java Edition versions from **1.13** through **1.21+**. Validation, syntax, and datapack format numbers are matched to your selected target version.

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| UI Framework | React 18 |
| Code Editor | Monaco Editor (VS Code engine) |
| Desktop Shell | Electron 31 |
| Styling | Tailwind CSS |
| State Management | Zustand |
| Packaging | electron-builder |
| Auto-updates | electron-updater |
| Build Tool | Vite |
| Free AI | Pollinations (GPT-4o) |
| Claude AI | Anthropic API |

---

## 📋 Roadmap
- [ ] Live 3D model previews
- [ ] Tellraw visual builder
- [ ] NBT file editor (level.dat, structure files)
- [ ] FTP direct upload to server
- [ ] World hotbar item manager
- [ ] Scoreboard expression generator
- [ ] Multiplayer collaboration

---

## 📄 License
MIT — free to use, modify, and distribute.

---

<p align="center">Built with ❤️ for the Minecraft datapack community</p>
