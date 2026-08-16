window.__ModuleLoader__.load({
	id: "dsh-wallpaper-theme",
	factory: (require) => {
		var module = { exports: {} };
		var exports = module.exports;
		Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });
		const react = require("react");
		const react_jsx_runtime = require("react/jsx-runtime");
		const jsx = react_jsx_runtime.jsx;
		const jsxs = react_jsx_runtime.jsxs;
		//#region src/client/index.ts
		/** Config API served by the host half (see lib/index.js). */
		const CONFIG_URL = "/wallpaper-theme/api/config";
		/** Image upload API served by the host half (?zone=wallpaper|sidebar|input). */
		const UPLOAD_URL = "/wallpaper-theme/api/upload";
		/** Custom CSS upload API served by the host half. */
		const UPLOAD_CSS_URL = "/wallpaper-theme/api/upload-css";
		/** Custom CSS content URL served by the host half. */
		const CUSTOM_CSS_URL = "/wallpaper-theme/custom.css";
		/** Wallpaper image URL served by the host half (cache-busted so a new upload repaints immediately). */
		const IMAGE_URL = () => `/wallpaper-theme/image.png?v=${imageRev}`;
		/** Sidebar pattern URL (cache-busted). */
		const SIDEBAR_PATTERN_URL = () => `/wallpaper-theme/pattern-sidebar.png?v=${imageRev}`;
		/** Composer input-card pattern URL (cache-busted). */
		const INPUT_PATTERN_URL = () => `/wallpaper-theme/pattern-input.png?v=${imageRev}`;
		/** Cache-buster revision, bumped after every successful upload. */
		let imageRev = Date.now();
		/** Defaults mirrored from the host (kept here so the panel renders before the first fetch resolves). */
		const DEFAULTS = {
			enabled: false,
			imageName: "",
			opacity: 72,
			dim: 0,
			blur: 0,
			sidebarOpacity: 82,
			overlayOpacity: 92,
			inputOpacity: 95,
			accent: "#4176e6",
			textPrimary: "",
			textSecondary: "",
			customCss: false,
			cssName: "",
			patternSidebar: false,
			patternInput: false,
			sidebarName: "",
			inputName: ""
		};
		/** Current config state shared by apply + the settings component. */
		let config = { ...DEFAULTS };
		/** Host client context, captured in apply() for token/style application. */
		let hostCtx = null;
		/** Clamp a number into [0, 100]. */
		function clamp100(value) {
			return Math.max(0, Math.min(100, Number(value) || 0));
		}
		/**
		* Build the alias-token overrides from the current config. The layout
		* frame paints with --dsw-alias-bg-base, the sidebar with
		* --dsw-specific-sidebar-fill, and popovers/dialogs with
		* --dsw-alias-bg-overlay; each becomes translucent so the wallpaper shows
		* through at the level the user picked. An accent color overrides the
		* brand tokens. Every token carries a light and a dark value (the
		* override contract requires both palettes).
		*/
		function surfaceOverrides() {
			const alpha = clamp100(config.opacity) / 100;
			const side = clamp100(config.sidebarOpacity) / 100;
			const overlay = clamp100(config.overlayOpacity) / 100;
			const input = clamp100(config.inputOpacity) / 100;
			const accent = typeof config.accent === "string" && /^#[0-9a-f]{6}$/i.test(config.accent) ? config.accent : "#4176e6";
			const textPrimary = typeof config.textPrimary === "string" && /^#[0-9a-f]{6}$/i.test(config.textPrimary) ? config.textPrimary : "";
			const textSecondary = typeof config.textSecondary === "string" && /^#[0-9a-f]{6}$/i.test(config.textSecondary) ? config.textSecondary : "";
			const lightBase = `rgba(255, 255, 255, ${(0.15 + 0.85 * alpha).toFixed(3)})`;
			const darkBase = `rgba(15, 17, 21, ${(0.15 + 0.85 * alpha).toFixed(3)})`;
			const lightL1 = `rgba(255, 255, 255, ${(0.1 + 0.85 * alpha).toFixed(3)})`;
			const darkL1 = `rgba(21, 21, 23, ${(0.1 + 0.85 * alpha).toFixed(3)})`;
			const lightL2 = `rgba(255, 255, 255, ${(0.05 + 0.85 * alpha).toFixed(3)})`;
			const darkL2 = `rgba(27, 27, 28, ${(0.05 + 0.85 * alpha).toFixed(3)})`;
			// With a sidebar pattern the fill must go fully transparent, otherwise
			// the inner sidebar container's own background hides the image edges
			// (the user reported a visible seam on the right).
			const lightSide = config.patternSidebar ? "rgba(255, 255, 255, 0)" : `rgba(245, 246, 247, ${(0.15 + 0.85 * side).toFixed(3)})`;
			const darkSide = config.patternSidebar ? "rgba(0, 0, 0, 0)" : `rgba(27, 27, 28, ${(0.15 + 0.85 * side).toFixed(3)})`;
			const lightOverlay = `rgba(233, 236, 242, ${(0.25 + 0.75 * overlay).toFixed(3)})`;
			const darkOverlay = `rgba(44, 44, 46, ${(0.25 + 0.75 * overlay).toFixed(3)})`;
			const lightInput = `rgba(255, 255, 255, ${(0.2 + 0.8 * input).toFixed(3)})`;
			const darkInput = `rgba(35, 35, 36, ${(0.2 + 0.8 * input).toFixed(3)})`;
			const overrides = {
				"--dsw-alias-bg-base": { light: lightBase, dark: darkBase },
				"--dsw-alias-bg-layer-1": { light: lightL1, dark: darkL1 },
				"--dsw-alias-bg-layer-2": { light: lightL2, dark: darkL2 },
				"--dsw-specific-sidebar-fill": { light: lightSide, dark: darkSide },
				"--dsw-alias-bg-overlay": { light: lightOverlay, dark: darkOverlay },
				"--dsw-specific-input-major": { light: lightInput, dark: darkInput },
				"--dsw-specific-menu": { light: lightOverlay, dark: darkOverlay },
				"--dsw-alias-brand-primary": { light: accent, dark: accent },
				"--dsw-alias-button-primary-fill": { light: accent, dark: accent },
				"--dsw-alias-button-info-fill": { light: accent, dark: accent },
				"--dsw-alias-state-business-primary": { light: accent, dark: accent }
			};
			// Text colors only override when the user picked one; empty keeps the
			// theme's own label palette. Both palettes share the single value.
			if (textPrimary) {
				overrides["--dsw-alias-label-primary"] = { light: textPrimary, dark: textPrimary };
				overrides["--dsw-alias-label-primary-dimmed"] = { light: textPrimary, dark: textPrimary };
				overrides["--dsw-alias-label-primary-foreground"] = { light: textPrimary, dark: textPrimary };
				overrides["--dsw-alias-label-primary-inverted"] = { light: textPrimary, dark: textPrimary };
			}
			if (textSecondary) {
				overrides["--dsw-alias-label-secondary"] = { light: textSecondary, dark: textSecondary };
				overrides["--dsw-alias-label-tertiary"] = { light: textSecondary, dark: textSecondary };
				overrides["--dsw-alias-label-caption"] = { light: textSecondary, dark: textSecondary };
			}
			return overrides;
		}
		/**
		* Fullscreen wallpaper stylesheet: cover-fit the image, optionally dim it
		* with a translucent black veil (0-100) and blur it (0-20px) for
		* readability behind the translucent panels.
		*/
		function wallpaperCss() {
			const dim = Math.max(0, Math.min(100, config.dim ?? 0)) / 100;
			const blur = Math.max(0, Math.min(20, config.blur ?? 0));
			return `
html, body { height: 100%; }
body {
  background-image: url('${IMAGE_URL()}');
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
  background-attachment: fixed;
}
body::before {
  content: "";
  position: fixed;
  inset: 0;
  z-index: -1;
  background: rgba(0, 0, 0, ${dim.toFixed(3)});
  backdrop-filter: blur(${blur.toFixed(1)}px);
  -webkit-backdrop-filter: blur(${blur.toFixed(1)}px);
}
`;
		}
		/**
		* Per-zone pattern stylesheet: paints a user image behind the sidebar and
		* the composer input card. The sidebar column is anchored two ways: its
		* stable CSS-module class (the generated name always carries the
		* "sidebarCol" suffix) and the structural :has() fallback. Both use
		* background-origin/clip border-box so the image never bleeds past the
		* element's own border box.
		*/
		function patternCss() {
			const sidebar = '[class*="sidebarCol"], div:has(> div[data-shell-overlay]) > div:first-child';
			const rules = [];
			if (config.patternSidebar) {
				rules.push(`${sidebar} { background-image: url('${SIDEBAR_PATTERN_URL()}'); background-size: cover; background-position: center; background-repeat: no-repeat; background-origin: border-box; background-clip: border-box; overflow: hidden; }`);
			}
			if (config.patternInput) {
				rules.push(`[data-composer-card] { background-image: url('${INPUT_PATTERN_URL()}'); background-size: cover; background-position: center; background-repeat: no-repeat; background-origin: border-box; background-clip: border-box; }`);
			}
			return rules.join("\n");
		}
		/** Apply the current config to the theme tokens and the stylesheets. */
		function applyConfig() {
			const ctx = hostCtx;
			if (!ctx) return;
			// Surface/opacity/accent overrides ALWAYS apply — they are independent
			// UI settings, not gated by the wallpaper enable toggle.
			ctx.theme.overrideTokens("dsh-wallpaper-theme", surfaceOverrides());
			let style = document.getElementById("dsh-wallpaper-theme-style");
			if (!style) {
				style = document.createElement("style");
				style.id = "dsh-wallpaper-theme-style";
				document.head.append(style);
			}
			// The enable toggle only controls whether the fullscreen wallpaper
			// image is painted; patterns + custom css keep their own flags.
			style.textContent = `${config.enabled ? wallpaperCss() : ""}\n${patternCss()}`;
			applyCustomCss();
		}
		/** Inject (or retract) the user-uploaded custom CSS stylesheet. */
		function applyCustomCss() {
			if (!config.customCss) {
				document.getElementById("dsh-wallpaper-theme-custom-css")?.remove();
				return;
			}
			fetch(CUSTOM_CSS_URL, { credentials: "same-origin" }).then((response) => response.ok ? response.text() : "").then((css) => {
				let style = document.getElementById("dsh-wallpaper-theme-custom-css");
				if (!style) {
					style = document.createElement("style");
					style.id = "dsh-wallpaper-theme-custom-css";
					document.head.append(style);
				}
				style.textContent = css;
			}).catch(() => {
				document.getElementById("dsh-wallpaper-theme-custom-css")?.remove();
			});
		}
		/** Persist a partial config change through the host API, then re-apply. */
		async function save(patch) {
			config = { ...config, ...patch };
			applyConfig();
			try {
				const response = await fetch(CONFIG_URL, {
					method: "POST",
					headers: { "content-type": "application/json" },
					credentials: "same-origin",
					body: JSON.stringify(config)
				});
				if (response.ok) config = await response.json();
				return true;
			} catch {
				return false;
			}
		}
		/**
		* Upload a locally picked image for one zone (wallpaper/sidebar/input).
		* POSTs the raw bytes to the host, then adopts the returned config and
		* repaints with a fresh cache-buster.
		* @param file - the File chosen through the panel's file input.
		* @param zone - which UI area the image targets.
		* @returns whether the upload and repaint succeeded.
		*/
		async function uploadImage(file, zone) {
			if (!file) return false;
			try {
				const response = await fetch(`${UPLOAD_URL}?zone=${encodeURIComponent(zone)}&name=${encodeURIComponent(file.name)}`, {
					method: "POST",
					headers: { "content-type": "application/octet-stream" },
					credentials: "same-origin",
					body: file
				});
				if (!response.ok) {
					const payload = await response.json().catch(() => null);
					throw new Error(payload?.error ?? `upload failed (${response.status})`);
				}
				config = { ...DEFAULTS, ...(await response.json()) };
				imageRev = Date.now();
				applyConfig();
				return true;
			} catch {
				return false;
			}
		}
		/**
		* Upload a locally picked CSS file for fine-grained UI styling. The host
		* persists it next to the config document and flips customCss on.
		* @param file - the .css File chosen through the panel's file input.
		* @returns whether the upload and apply succeeded.
		*/
		async function uploadCss(file) {
			if (!file) return false;
			try {
				const response = await fetch(`${UPLOAD_CSS_URL}?name=${encodeURIComponent(file.name)}`, {
					method: "POST",
					headers: { "content-type": "text/css; charset=utf-8" },
					credentials: "same-origin",
					body: file
				});
				if (!response.ok) {
					const payload = await response.json().catch(() => null);
					throw new Error(payload?.error ?? `css upload failed (${response.status})`);
				}
				config = { ...DEFAULTS, ...(await response.json()) };
				applyConfig();
				return true;
			} catch {
				return false;
			}
		}
		/** Shared settings-panel stylesheet text (card-based grouping). */
		const PANEL_CSS = `
.dwt-panel{padding:16px;max-width:760px;font-size:13px;line-height:1.55}
.dwt-panel h3{margin:0 0 6px;font-size:16px}
.dwt-desc{margin:0 0 16px;color:var(--dsw-alias-label-secondary,#999)}
.dwt-group{display:flex;align-items:center;gap:8px;margin:0 0 4px;font-size:13px;font-weight:700;color:var(--dsw-alias-label-primary)}
.dwt-group::before{content:"";width:4px;height:14px;border-radius:2px;background:var(--dsw-alias-brand-primary,var(--dsw-static-deepseek-500,#4176e6))}
.dwt-card{border:1px solid var(--dsw-alias-border-l1,rgba(0,0,0,.06));background:var(--dsw-alias-bg-layer-1,rgba(255,255,255,.5));border-radius:12px;padding:4px 14px 10px;margin-bottom:14px}
.dwt-row{display:flex;align-items:flex-start;justify-content:space-between;gap:16px;padding:10px 0;border-bottom:1px solid var(--dsw-alias-border-l1,rgba(0,0,0,.06))}
.dwt-row:last-child{border-bottom:none}
.dwt-label{display:flex;flex-direction:column;gap:2px;min-width:0}
.dwt-name{font-weight:600}
.dwt-hint{color:var(--dsw-alias-label-secondary,#999);font-size:12px}
.dwt-control{display:flex;align-items:center;gap:10px;min-width:220px;justify-content:flex-end}
.dwt-slider-wrap{display:flex;align-items:center;gap:10px;width:100%;min-width:220px;justify-content:flex-end}
.dwt-slider-wrap input[type=range]{flex:1;min-width:120px}
.dwt-value{min-width:44px;text-align:right;color:var(--dsw-alias-label-primary)}
.dwt-image{color:var(--dsw-alias-label-secondary,#999);font-family:ui-monospace,Consolas,monospace;font-size:12px;word-break:break-all;text-align:right}
.dwt-upload{display:flex;align-items:center;gap:10px;width:100%;justify-content:flex-end;min-width:220px}
.dwt-pick{background:var(--dsw-alias-button-primary-fill,var(--dsw-static-deepseek-500,#4176e6));color:#fff;border:none;border-radius:8px;padding:6px 14px;font-size:13px;cursor:pointer;white-space:nowrap}
.dwt-pick:hover{background:var(--dsw-alias-button-primary-hover,var(--dsw-static-deepseek-400,#5698fe))}
.dwt-pick-ghost{background:transparent;color:var(--dsw-alias-label-primary);border:1px solid var(--dsw-alias-border-l2,rgba(0,0,0,.1));border-radius:8px;padding:6px 14px;font-size:13px;cursor:pointer;white-space:nowrap}
.dwt-pick-ghost:hover{background:var(--dsw-alias-interactive-bg-hover,rgba(38,49,72,.06))}
.dwt-actions{display:flex;align-items:center;gap:10px;margin-top:4px}
.dwt-save{background:var(--dsw-alias-button-primary-fill,var(--dsw-static-deepseek-500,#4176e6));color:#fff;border:none;border-radius:8px;padding:7px 18px;font-size:13px;cursor:pointer;white-space:nowrap}
.dwt-save:hover{background:var(--dsw-alias-button-primary-hover,var(--dsw-static-deepseek-400,#5698fe))}
.dwt-reset{background:transparent;color:var(--dsw-alias-state-warn-primary,var(--dsw-static-amber-500,#f59e0b));border:1px solid var(--dsw-alias-border-l2,rgba(0,0,0,.1));border-radius:8px;padding:6px 16px;font-size:13px;cursor:pointer;white-space:nowrap}
.dwt-reset:hover{background:var(--dsw-alias-interactive-bg-hover,rgba(38,49,72,.06))}
.dwt-color-wrap{display:flex;align-items:center;gap:10px;width:100%;justify-content:flex-end;min-width:220px}
.dwt-color-wrap input[type=color]{width:44px;height:30px;border:1px solid var(--dsw-alias-border-l2,rgba(0,0,0,.1));border-radius:8px;background:none;padding:2px;cursor:pointer}
.dwt-status{font-size:12px;color:var(--dsw-alias-state-success-primary,#2f9e44);margin-top:10px}
.dwt-note{margin-top:8px;font-size:12px;color:var(--dsw-alias-label-secondary,#999)}
`;
		/** One labelled row with a control area. */
		function FieldRow({ name, hint, children }) {
			return jsxs("div", { className: "dwt-row", children: [
				jsxs("div", { className: "dwt-label", children: [
					jsx("span", { className: "dwt-name", children: name }),
					jsx("span", { className: "dwt-hint", children: hint })
				] }),
				jsx("div", { className: "dwt-control", children })
			] });
		}
		/** A labelled card: group title + rows inside a raised container. */
		function GroupCard({ title, children }) {
			return jsxs("div", { className: "dwt-card", children: [
				jsx("div", { className: "dwt-group", children: title }),
				children
			] });
		}
		/** The settings panel component (registered into settings.section). */
		function WallpaperSection() {
			const [opacity, setOpacity] = react.useState(config.opacity);
			const [dim, setDim] = react.useState(config.dim);
			const [blur, setBlur] = react.useState(config.blur);
			const [sidebarOpacity, setSidebarOpacity] = react.useState(config.sidebarOpacity);
			const [overlayOpacity, setOverlayOpacity] = react.useState(config.overlayOpacity);
			const [inputOpacity, setInputOpacity] = react.useState(config.inputOpacity);
			const [accent, setAccent] = react.useState(config.accent);
			const [textPrimary, setTextPrimary] = react.useState(config.textPrimary);
			const [textSecondary, setTextSecondary] = react.useState(config.textSecondary);
			const [customCss, setCustomCss] = react.useState(!!config.customCss);
			const [patternSidebar, setPatternSidebar] = react.useState(!!config.patternSidebar);
			const [patternInput, setPatternInput] = react.useState(!!config.patternInput);
			const [status, setStatus] = react.useState("已保存，立即生效");
			const [imageName, setImageName] = react.useState(config.imageName ? `当前：${config.imageName}` : "当前：无（默认）");
			const [sidebarName, setSidebarName] = react.useState(config.sidebarName ? `已设置：${config.sidebarName}` : "未设置");
			const [inputName, setInputName] = react.useState(config.inputName ? `已设置：${config.inputName}` : "未设置");
			const [cssName, setCssName] = react.useState(config.cssName ? `已应用：${config.cssName}` : "未上传");
			const fileRef = react.useRef(null);
			const sidebarRef = react.useRef(null);
			const inputRef = react.useRef(null);
			const cssRef = react.useRef(null);
			// Re-sync every field from the persisted config when the panel mounts,
			// so a fresh open always reflects the latest saved values.
			react.useEffect(() => {
				let alive = true;
				fetch(CONFIG_URL, { credentials: "same-origin" }).then((response) => response.ok ? response.json() : null).then((loaded) => {
					if (!alive || !loaded) return;
					config = { ...DEFAULTS, ...loaded };
					setOpacity(loaded.opacity);
					setDim(loaded.dim);
					setBlur(loaded.blur);
					setSidebarOpacity(loaded.sidebarOpacity);
					setOverlayOpacity(loaded.overlayOpacity);
					setInputOpacity(loaded.inputOpacity);
					setAccent(loaded.accent);
					setTextPrimary(loaded.textPrimary);
					setTextSecondary(loaded.textSecondary);
					setCustomCss(!!loaded.customCss);
					setPatternSidebar(!!loaded.patternSidebar);
					setPatternInput(!!loaded.patternInput);
					setImageName(loaded.imageName ? `当前：${loaded.imageName}` : "当前：无（默认）");
					setSidebarName(loaded.sidebarName ? `已设置：${loaded.sidebarName}` : "未设置");
					setInputName(loaded.inputName ? `已设置：${loaded.inputName}` : "未设置");
					setCssName(loaded.cssName ? `已应用：${loaded.cssName}` : "未上传");
					applyConfig();
				}).catch(() => {});
				return () => { alive = false; };
			}, []);
			const commit = async (patch) => {
				setStatus("保存中…");
				const ok = await save(patch);
				setStatus(ok ? "已保存，立即生效" : "保存失败，请检查插件运行状态");
			};
			const pickWallpaper = () => fileRef.current?.click();
			const onWallpaperChosen = async (e) => {
				const file = e.target.files?.[0];
				if (!file) return;
				setStatus("上传中…");
				const ok = await uploadImage(file, "wallpaper");
				setImageName(ok ? `当前：${config.imageName || file.name}` : "上传失败，请重试");
				setStatus(ok ? "图片已更换，立即生效" : "上传失败，请检查文件格式或大小（支持 png/jpg/webp/gif，≤20MB）");
				e.target.value = "";
			};
			const removeWallpaper = async () => {
				setStatus("保存中…");
				const ok = await save({ imagePath: "", imageName: "", enabled: false });
				setImageName("当前：无（默认）");
				setStatus(ok ? "背景图片已移除" : "保存失败，请检查插件运行状态");
			};
			const pickSidebar = () => sidebarRef.current?.click();
			const onSidebarChosen = async (e) => {
				const file = e.target.files?.[0];
				if (!file) return;
				setStatus("上传中…");
				const ok = await uploadImage(file, "sidebar");
				setPatternSidebar(ok);
				setSidebarName(ok ? `已设置：${config.sidebarName || file.name}` : "上传失败，请重试");
				setStatus(ok ? "侧边栏图案已应用，立即生效" : "上传失败，请检查文件格式或大小（支持 png/jpg/webp/gif，≤20MB）");
				e.target.value = "";
			};
			const pickInput = () => inputRef.current?.click();
			const onInputChosen = async (e) => {
				const file = e.target.files?.[0];
				if (!file) return;
				setStatus("上传中…");
				const ok = await uploadImage(file, "input");
				setPatternInput(ok);
				setInputName(ok ? `已设置：${config.inputName || file.name}` : "上传失败，请重试");
				setStatus(ok ? "输入框图案已应用，立即生效" : "上传失败，请检查文件格式或大小（支持 png/jpg/webp/gif，≤20MB）");
				e.target.value = "";
			};
			const pickCss = () => cssRef.current?.click();
			const onCssChosen = async (e) => {
				const file = e.target.files?.[0];
				if (!file) return;
				setStatus("上传中…");
				const ok = await uploadCss(file);
				setCustomCss(ok);
				setCssName(ok ? `已应用：${config.cssName || file.name}` : "上传失败，请重试");
				setStatus(ok ? "样式已应用，立即生效" : "上传失败，请确认是 .css 文件");
				e.target.value = "";
			};
			const removePattern = async (zone) => {
				setStatus("保存中…");
				const ok = await save(zone === "sidebar" ? { patternSidebar: false } : { patternInput: false });
				setPatternSidebar(zone === "sidebar" ? false : patternSidebar);
				setPatternInput(zone === "input" ? false : patternInput);
				if (zone === "sidebar") setSidebarName("未设置");
				else setInputName("未设置");
				setStatus(ok ? "已移除图案" : "保存失败，请检查插件运行状态");
			};
			const removeCss = async () => {
				setStatus("保存中…");
				const ok = await save({ customCss: false });
				setCustomCss(false);
				setCssName("未上传");
				setStatus(ok ? "已移除自定义样式" : "保存失败，请检查插件运行状态");
			};
			/** Explicitly persist the current on-screen settings as one save. */
			const onSave = async () => {
				setStatus("保存中…");
				const ok = await save({});
				setStatus(ok ? "已保存，立即生效" : "保存失败，请检查插件运行状态");
			};
			/** Reset every setting (including the wallpaper) to the plugin defaults. */
			const onReset = async () => {
				const defaults = { ...DEFAULTS };
				config = { ...defaults, imagePath: "", imageName: "", sidebarName: "", inputName: "", cssName: "" };
				imageRev = Date.now();
				setOpacity(defaults.opacity);
				setDim(defaults.dim);
				setBlur(defaults.blur);
				setSidebarOpacity(defaults.sidebarOpacity);
				setOverlayOpacity(defaults.overlayOpacity);
				setInputOpacity(defaults.inputOpacity);
				setAccent(defaults.accent);
				setTextPrimary("");
				setTextSecondary("");
				setCustomCss(false);
				setPatternSidebar(false);
				setPatternInput(false);
				setImageName("当前：无（默认）");
				setSidebarName("未设置");
				setInputName("未设置");
				setCssName("未上传");
				setStatus("重置中…");
				applyConfig();
				try {
					const response = await fetch(CONFIG_URL, {
						method: "POST",
						headers: { "content-type": "application/json" },
						credentials: "same-origin",
						body: JSON.stringify(config)
					});
					setStatus(response.ok ? "已重置为默认" : "重置失败，请检查插件运行状态");
				} catch {
					setStatus("重置失败，请检查插件运行状态");
				}
			};
			return jsxs("div", { className: "dwt-panel", children: [
				jsx("style", { children: PANEL_CSS }),
				jsx("h3", { children: "壁纸主题 / Wallpaper theme" }),
				jsx("p", { className: "dwt-desc", children: "全屏背景、UI 图案、表面透明度与自定义样式调节，改动即时生效。" }),
				jsx(GroupCard, { title: "背景", children: [
					jsx(FieldRow, { name: "背景图片", hint: "支持 png/jpg/webp/gif（≤20MB），可随时移除。", children:
						jsxs("div", { className: "dwt-upload", children: [
							jsx("input", { ref: fileRef, type: "file", accept: "image/png,image/jpeg,image/webp,image/gif", style: { display: "none" }, onChange: onWallpaperChosen }),
							jsx("button", { type: "button", className: "dwt-pick", onClick: pickWallpaper, children: "选择图片…" }),
							imageName !== "当前：无（默认）" ? jsx("button", { type: "button", className: "dwt-reset", onClick: removeWallpaper, children: "移除" }) : null,
							jsx("span", { className: "dwt-image", children: imageName })
						] })
					}),
					jsx(FieldRow, { name: "背景暗化", hint: "给背景叠加黑色薄纱，文字更清晰。", children:
						jsxs("div", { className: "dwt-slider-wrap", children: [
							jsx("input", { type: "range", min: "0", max: "100", step: "1", value: String(dim), onChange: (e) => {
								const value = Number(e.target.value);
								setDim(value);
								commit({ dim: value });
							} }),
							jsx("span", { className: "dwt-value", children: `${dim}%` })
						] })
					}),
					jsx(FieldRow, { name: "背景模糊", hint: "模糊背景以突出前景文字。", children:
						jsxs("div", { className: "dwt-slider-wrap", children: [
							jsx("input", { type: "range", min: "0", max: "20", step: "1", value: String(blur), onChange: (e) => {
								const value = Number(e.target.value);
								setBlur(value);
								commit({ blur: value });
							} }),
							jsx("span", { className: "dwt-value", children: `${blur}px` })
						] })
					})
				] }),
				jsx(GroupCard, { title: "界面表面", children: [
					jsx(FieldRow, { name: "主表面不透明度", hint: "对话框、面板等主表面的透明度，越低越透出背景。", children:
						jsxs("div", { className: "dwt-slider-wrap", children: [
							jsx("input", { type: "range", min: "0", max: "100", step: "1", value: String(opacity), onChange: (e) => {
								const value = Number(e.target.value);
								setOpacity(value);
								commit({ opacity: value });
							} }),
							jsx("span", { className: "dwt-value", children: `${opacity}%` })
						] })
					}),
					jsx(FieldRow, { name: "浮层不透明度", hint: "弹窗、下拉、提示浮层的透明度。", children:
						jsxs("div", { className: "dwt-slider-wrap", children: [
							jsx("input", { type: "range", min: "0", max: "100", step: "1", value: String(overlayOpacity), onChange: (e) => {
								const value = Number(e.target.value);
								setOverlayOpacity(value);
								commit({ overlayOpacity: value });
							} }),
							jsx("span", { className: "dwt-value", children: `${overlayOpacity}%` })
						] })
					}),
					jsx(FieldRow, { name: "对话输入框不透明度", hint: "底部消息输入框卡片的透明度。", children:
						jsxs("div", { className: "dwt-slider-wrap", children: [
							jsx("input", { type: "range", min: "0", max: "100", step: "1", value: String(inputOpacity), onChange: (e) => {
								const value = Number(e.target.value);
								setInputOpacity(value);
								commit({ inputOpacity: value });
							} }),
							jsx("span", { className: "dwt-value", children: `${inputOpacity}%` })
						] })
					})
				] }),
				jsx(GroupCard, { title: "侧边栏", children: [
					jsx(FieldRow, { name: "侧边栏不透明度", hint: "左侧导航栏的透明度。", children:
						jsxs("div", { className: "dwt-slider-wrap", children: [
							jsx("input", { type: "range", min: "0", max: "100", step: "1", value: String(sidebarOpacity), onChange: (e) => {
								const value = Number(e.target.value);
								setSidebarOpacity(value);
								commit({ sidebarOpacity: value });
							} }),
							jsx("span", { className: "dwt-value", children: `${sidebarOpacity}%` })
						] })
					}),
					jsx(FieldRow, { name: "侧边栏图案", hint: "用本地图片填充左侧导航栏背景。", children:
						jsxs("div", { className: "dwt-upload", children: [
							jsx("input", { ref: sidebarRef, type: "file", accept: "image/png,image/jpeg,image/webp,image/gif", style: { display: "none" }, onChange: onSidebarChosen }),
							jsx("button", { type: "button", className: "dwt-pick-ghost", onClick: pickSidebar, children: "选择图片…" }),
							patternSidebar ? jsx("button", { type: "button", className: "dwt-reset", onClick: () => removePattern("sidebar"), children: "移除" }) : null,
							jsx("span", { className: "dwt-image", children: sidebarName })
						] })
					})
				] }),
				jsx(GroupCard, { title: "输入框", children: [
					jsx(FieldRow, { name: "输入框图案", hint: "用本地图片填充底部消息输入框卡片背景。", children:
						jsxs("div", { className: "dwt-upload", children: [
							jsx("input", { ref: inputRef, type: "file", accept: "image/png,image/jpeg,image/webp,image/gif", style: { display: "none" }, onChange: onInputChosen }),
							jsx("button", { type: "button", className: "dwt-pick-ghost", onClick: pickInput, children: "选择图片…" }),
							patternInput ? jsx("button", { type: "button", className: "dwt-reset", onClick: () => removePattern("input"), children: "移除" }) : null,
							jsx("span", { className: "dwt-image", children: inputName })
						] })
					})
				] }),
				jsx(GroupCard, { title: "颜色", children: [
					jsx(FieldRow, { name: "品牌强调色", hint: "按钮、链接、选中态使用的强调颜色。", children:
						jsxs("div", { className: "dwt-color-wrap", children: [
							jsx("input", { type: "color", value: accent, onChange: (e) => {
								const value = e.target.value;
								setAccent(value);
								commit({ accent: value });
							} }),
							jsx("span", { className: "dwt-value", children: accent })
						] })
					}),
					jsx(FieldRow, { name: "主文字颜色", hint: "标题、正文等主要文字的颜色，留空则用主题默认。", children:
						jsxs("div", { className: "dwt-color-wrap", children: [
							jsx("input", { type: "color", value: textPrimary || "#000000", onChange: (e) => {
								const value = e.target.value;
								setTextPrimary(value);
								commit({ textPrimary: value });
							} }),
							jsx("span", { className: "dwt-value", children: textPrimary || "默认" })
						] })
					}),
					jsx(FieldRow, { name: "次要文字颜色", hint: "说明、辅助文字的颜色，留空则用主题默认。", children:
						jsxs("div", { className: "dwt-color-wrap", children: [
							jsx("input", { type: "color", value: textSecondary || "#000000", onChange: (e) => {
								const value = e.target.value;
								setTextSecondary(value);
								commit({ textSecondary: value });
							} }),
							jsx("span", { className: "dwt-value", children: textSecondary || "默认" })
						] })
					})
				] }),
				jsx(GroupCard, { title: "自定义样式", children: [
					jsx(FieldRow, { name: "自定义 CSS", hint: "上传 .css 文件可精细定制任何界面元素（含侧边栏）。", children:
						jsxs("div", { className: "dwt-upload", children: [
							jsx("input", { ref: cssRef, type: "file", accept: ".css,text/css", style: { display: "none" }, onChange: onCssChosen }),
							jsx("button", { type: "button", className: "dwt-pick-ghost", onClick: pickCss, children: "选择 CSS…" }),
							customCss ? jsx("button", { type: "button", className: "dwt-reset", onClick: removeCss, children: "移除" }) : null,
							jsx("span", { className: "dwt-image", children: cssName })
						] })
					})
				] }),
				jsx("div", { className: "dwt-actions", children: [
					jsx("button", { type: "button", className: "dwt-save", onClick: onSave, children: "保存设置" }),
					jsx("button", { type: "button", className: "dwt-reset", onClick: onReset, children: "恢复默认" })
				] }),
				jsx("div", { className: "dwt-status", children: status }),
				jsx("p", { className: "dwt-note", children: "改动会自动保存；「保存设置」可手动落盘，「恢复默认」会连同背景、图案与自定义样式一起回到初始状态。" })
			] });
		}
		/**
		* Client plugin body: fetch the persisted config, apply it, and register
		* the settings panel (component passed as the second register argument).
		* @param ctx - client cordis context (theme + slots injected).
		*/
		function apply(ctx) {
			hostCtx = ctx;
			fetch(CONFIG_URL, { credentials: "same-origin" }).then((response) => response.ok ? response.json() : null).then((loaded) => {
				if (loaded) {
					config = { ...DEFAULTS, ...loaded };
					applyConfig();
				}
			}).catch(() => {
				applyConfig();
			});
			ctx.effect(() => ctx.slots.inject("settings.section", () => ctx.slots.register({
				name: "settings.section",
				id: "wallpaper-theme-config",
				order: 40,
				label: () => "壁纸主题 / Wallpaper"
			}, WallpaperSection)), "wallpaper-theme: settings panel");
		}
		//#endregion
		exports.apply = apply;
		exports.inject = ["theme", "slots"];
		return module.exports;
	}
});
