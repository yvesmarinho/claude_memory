var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// main.ts
var main_exports = {};
__export(main_exports, {
  default: () => HeadlessModePlugin
});
module.exports = __toCommonJS(main_exports);
var import_obsidian = require("obsidian");
var DEFAULT_SETTINGS = {
  startHeadless: false,
  hideDockIcon: true,
  trayIconColor: "white"
};
var TRAY_GLOBAL = "__headlessModeTray";
var COFFEE_URL = "https://buymeacoffee.com/meirakami";
function getElectronRemote() {
  const req = window.require;
  if (!req) return null;
  try {
    const electron = req("electron");
    if (electron == null ? void 0 : electron.remote) return electron.remote;
  } catch (e) {
  }
  try {
    return req("@electron/remote");
  } catch (e) {
    return null;
  }
}
function createTrayIcon(remote, color) {
  const fill = color === "black" ? "#000000" : "#ffffff";
  const image = remote.nativeImage.createEmpty();
  for (const scale of [1, 2]) {
    const size = 16 * scale;
    const canvas = activeDocument.createElement("canvas");
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext("2d");
    if (!ctx) continue;
    const s = scale;
    ctx.fillStyle = color === "auto" ? "#000000" : fill;
    ctx.beginPath();
    ctx.moveTo(8 * s, 1 * s);
    ctx.lineTo(13.5 * s, 5.5 * s);
    ctx.lineTo(8 * s, 15 * s);
    ctx.lineTo(2.5 * s, 5.5 * s);
    ctx.closePath();
    ctx.fill();
    ctx.globalCompositeOperation = "destination-out";
    ctx.lineWidth = 1 * s;
    ctx.beginPath();
    ctx.moveTo(2.5 * s, 5.5 * s);
    ctx.lineTo(8 * s, 7.5 * s);
    ctx.lineTo(13.5 * s, 5.5 * s);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(8 * s, 7.5 * s);
    ctx.lineTo(8 * s, 15 * s);
    ctx.stroke();
    image.addRepresentation({
      scaleFactor: scale,
      dataURL: canvas.toDataURL("image/png")
    });
  }
  if (color === "auto") image.setTemplateImage(true);
  return image;
}
var HeadlessModePlugin = class extends import_obsidian.Plugin {
  constructor() {
    super(...arguments);
    /** Runtime-only on purpose: a restart never traps the user in a hidden app
     *  unless they explicitly opted into "start headless". */
    this.headless = false;
    this.remote = null;
    this.tray = null;
  }
  async onload() {
    await this.loadSettings();
    if (!import_obsidian.Platform.isDesktopApp) return;
    this.remote = getElectronRemote();
    if (!this.remote) {
      console.error("Headless Mode: Electron remote API unavailable; plugin disabled.");
      return;
    }
    this.createTray();
    this.addCommand({
      id: "toggle",
      name: "Toggle",
      callback: () => this.setHeadless(!this.headless)
    });
    this.addCommand({
      id: "enter",
      name: "Go headless (hide window and Dock icon)",
      callback: () => this.setHeadless(true)
    });
    this.addSettingTab(new HeadlessModeSettingTab(this.app, this));
    this.app.workspace.onLayoutReady(() => {
      if (this.settings.startHeadless) this.setHeadless(true);
    });
  }
  onunload() {
    if (this.headless) this.applyHeadless(false);
    this.destroyTray();
  }
  setHeadless(on) {
    if (on === this.headless) return;
    this.headless = on;
    this.applyHeadless(on);
    this.refreshTrayMenu();
  }
  applyHeadless(on) {
    var _a, _b;
    if (!this.remote) return;
    const { app: electronApp, BrowserWindow } = this.remote;
    if (on) {
      for (const win of BrowserWindow.getAllWindows()) win.hide();
      if (import_obsidian.Platform.isMacOS && this.settings.hideDockIcon) {
        (_a = electronApp.dock) == null ? void 0 : _a.hide();
      }
    } else {
      if (import_obsidian.Platform.isMacOS) (_b = electronApp.dock) == null ? void 0 : _b.show();
      window.setTimeout(() => {
        var _a2;
        for (const win of BrowserWindow.getAllWindows()) win.show();
        try {
          (_a2 = this.remote) == null ? void 0 : _a2.getCurrentWindow().focus();
        } catch (e) {
        }
      }, 100);
    }
  }
  createTray() {
    var _a;
    if (!this.remote) return;
    const { Tray } = this.remote;
    const carrier = window;
    const stale = carrier[TRAY_GLOBAL];
    if (stale && !((_a = stale.isDestroyed) == null ? void 0 : _a.call(stale))) stale.destroy();
    this.tray = new Tray(createTrayIcon(this.remote, this.settings.trayIconColor));
    this.tray.setToolTip("Obsidian");
    carrier[TRAY_GLOBAL] = this.tray;
    this.refreshTrayMenu();
  }
  refreshTrayMenu() {
    var _a, _b;
    if (!this.tray || !this.remote || ((_b = (_a = this.tray).isDestroyed) == null ? void 0 : _b.call(_a))) return;
    const { Menu } = this.remote;
    const template = [
      {
        label: "Headless",
        type: "checkbox",
        checked: this.headless,
        click: (item) => this.setHeadless(item.checked)
      },
      { type: "separator" },
      {
        label: "Open Obsidian",
        enabled: this.headless,
        click: () => this.setHeadless(false)
      },
      { type: "separator" },
      {
        label: "Buy me a coffee \u2615",
        click: () => this.openExternal(COFFEE_URL)
      },
      { type: "separator" },
      {
        label: "Quit Obsidian",
        click: () => {
          var _a2;
          this.destroyTray();
          (_a2 = this.remote) == null ? void 0 : _a2.app.quit();
        }
      }
    ];
    this.tray.setContextMenu(Menu.buildFromTemplate(template));
  }
  openExternal(url) {
    var _a;
    try {
      const req = window.require;
      const shell = (_a = req == null ? void 0 : req("electron")) == null ? void 0 : _a.shell;
      if (shell) {
        shell.openExternal(url);
        return;
      }
    } catch (e) {
    }
    window.open(url, "_blank");
  }
  refreshTrayIcon() {
    var _a, _b;
    if (!this.tray || !this.remote || ((_b = (_a = this.tray).isDestroyed) == null ? void 0 : _b.call(_a))) return;
    this.tray.setImage(createTrayIcon(this.remote, this.settings.trayIconColor));
  }
  destroyTray() {
    var _a, _b;
    if (this.tray && !((_b = (_a = this.tray).isDestroyed) == null ? void 0 : _b.call(_a))) this.tray.destroy();
    this.tray = null;
    const carrier = window;
    carrier[TRAY_GLOBAL] = void 0;
  }
  async loadSettings() {
    const data = await this.loadData();
    this.settings = Object.assign({}, DEFAULT_SETTINGS, data != null ? data : {});
  }
  async saveSettings() {
    await this.saveData(this.settings);
  }
};
var HeadlessModeSettingTab = class extends import_obsidian.PluginSettingTab {
  constructor(app, plugin) {
    super(app, plugin);
    this.plugin = plugin;
  }
  display() {
    const { containerEl } = this;
    containerEl.empty();
    new import_obsidian.Setting(containerEl).setName("Start headless").setDesc(
      "Launch directly into headless mode: windows hidden, only the menu bar icon visible."
    ).addToggle(
      (toggle) => toggle.setValue(this.plugin.settings.startHeadless).onChange(async (value) => {
        this.plugin.settings.startHeadless = value;
        await this.plugin.saveSettings();
      })
    );
    new import_obsidian.Setting(containerEl).setName("Hide Dock icon while headless").setDesc(
      "macOS only. Remove the app from the Dock while headless; it returns when you uncheck Headless in the menu bar."
    ).addToggle(
      (toggle) => toggle.setValue(this.plugin.settings.hideDockIcon).onChange(async (value) => {
        var _a, _b;
        this.plugin.settings.hideDockIcon = value;
        await this.plugin.saveSettings();
        if (this.plugin.headless && import_obsidian.Platform.isMacOS) {
          const remote = getElectronRemote();
          if (value) (_a = remote == null ? void 0 : remote.app.dock) == null ? void 0 : _a.hide();
          else (_b = remote == null ? void 0 : remote.app.dock) == null ? void 0 : _b.show();
        }
      })
    );
    new import_obsidian.Setting(containerEl).setName("Menu bar icon color").setDesc(
      "White and Black force an explicit color. Auto uses a macOS template image that the system tints to match the menu bar (may render black on translucent menu bars)."
    ).addDropdown(
      (dropdown) => dropdown.addOption("white", "White").addOption("black", "Black").addOption("auto", "Auto (macOS template)").setValue(this.plugin.settings.trayIconColor).onChange(async (value) => {
        this.plugin.settings.trayIconColor = value;
        await this.plugin.saveSettings();
        this.plugin.refreshTrayIcon();
      })
    );
  }
};

/* nosourcemap */