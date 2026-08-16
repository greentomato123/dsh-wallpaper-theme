import { readFileSync, writeFileSync, existsSync, mkdirSync } from "node:fs";
import { dirname, extname, join } from "node:path";
import z from "schemastery";

/**
 * dsh-wallpaper-theme host half: serves the wallpaper image over HTTP, exposes
 * a small config API (GET/POST) so the browser settings panel can read and
 * persist user adjustments, accepts image uploads for the fullscreen wallpaper
 * AND per-zone UI patterns (sidebar / composer input card), and accepts a custom CSS
 * file for fine-grained styling. All state lives in one JSON document whose
 * path comes from the bundle config — never hardcoded here.
 */
const name = "dsh-wallpaper-theme";
const inject = ["webServer"];

const Config = z.object({
  /** Absolute path of the default wallpaper image file on disk (may be "" for none). */
  imagePath: z.string().default(""),
  /** URL prefix under which image + config routes are served. */
  routePrefix: z.string().default("/wallpaper-theme"),
  /** Absolute path of the JSON config document (persisted user settings). */
  configPath: z.string().default("")
});

/** Defaults used when the config document is absent or missing a field. */
const DEFAULT_CONFIG = Object.freeze({
  enabled: false,
  imagePath: "",
  imageName: "",
  opacity: 72,
  dim: 0,
  blur: 0,
  sidebarOpacity: 82,
  overlayOpacity: 92,
  inputOpacity: 95,
  accent: "",
  textPrimary: "",
  textSecondary: "",
  customCss: false,
  cssName: "",
  patternSidebar: false,
  patternInput: false,
  sidebarName: "",
  inputName: ""
});

/** Accepted upload extensions and their image content types. */
const IMAGE_TYPES = Object.freeze({
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".gif": "image/gif"
});

/** Upload zones: which UI area a pattern image targets. */
const ZONES = Object.freeze({
  wallpaper: "wallpaper",
  sidebar: "sidebar",
  input: "input"
});

/** 20 MiB upload cap — wallpapers are meant to be display-sized, not raw scans. */
const MAX_UPLOAD_BYTES = 20 * 1024 * 1024;

/** Read + merge the persisted config document over the defaults. */
function loadConfig(configPath, fallback) {
  try {
    if (configPath && existsSync(configPath)) {
      const parsed = JSON.parse(readFileSync(configPath, "utf8"));
      return { ...fallback, ...parsed };
    }
  } catch {
    /* unreadable document → defaults */
  }
  return { ...fallback };
}

/** Persist the config document (best effort, directory ensured). */
function saveConfig(configPath, config) {
  if (!configPath) return;
  try {
    mkdirSync(dirname(configPath), { recursive: true });
    writeFileSync(configPath, JSON.stringify(config, null, 2), "utf8");
  } catch {
    /* persist failure is non-fatal; panel still shows the live values */
  }
}

/** Collect a request body into a UTF-8 string (for JSON config writes). */
function readBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    let size = 0;
    req.on("data", (chunk) => {
      size += chunk.length;
      if (size > MAX_UPLOAD_BYTES) {
        req.destroy();
        reject(new Error("body too large"));
        return;
      }
      chunks.push(chunk);
    });
    req.on("end", () => resolve(Buffer.concat(chunks).toString("utf8")));
    req.on("error", reject);
  });
}

/** Collect a request body as a Buffer (for image uploads). */
function readBodyBuffer(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    let size = 0;
    req.on("data", (chunk) => {
      size += chunk.length;
      if (size > MAX_UPLOAD_BYTES) {
        req.destroy();
        reject(new Error("image too large"));
        return;
      }
      chunks.push(chunk);
    });
    req.on("end", () => resolve(Buffer.concat(chunks)));
    req.on("error", reject);
  });
}

/** Resolve the effective wallpaper file path from config + fallback. */
function effectiveImagePath(configPath, fallback) {
  const current = loadConfig(configPath, fallback);
  return current.imagePath || fallback.imagePath;
}

/** Content type for the current wallpaper file, inferred from its extension. */
function imageContentType(imagePath) {
  return IMAGE_TYPES[extname(imagePath).toLowerCase()] ?? "image/png";
}

/** Path of the persisted custom CSS document beside the config document. */
function customCssPath(configPath) {
  return configPath ? join(dirname(configPath), "wallpaper-custom.css") : "";
}

/** Path of a persisted per-zone pattern image beside the config document. */
function patternPath(configPath, zone) {
  return configPath ? join(dirname(configPath), `wallpaper-pattern-${zone}.png`) : "";
}

/** The config key that tracks whether a zone's pattern is active. */
function patternFlag(zone) {
  return zone === "sidebar" ? "patternSidebar" : "patternInput";
}

/** The URL path under which a zone's pattern image is served. */
function patternRoute(zone) {
  return zone === "sidebar" ? "pattern-sidebar.png" : "pattern-input.png";
}

function apply(ctx, config) {
  const prefix = (config.routePrefix ?? "/wallpaper-theme").replace(/\/+$/, "");
  const configPath = config.configPath;
  const fallback = { ...DEFAULT_CONFIG, imagePath: config.imagePath };
  const cssPath = customCssPath(configPath);

  ctx.effect(() => ctx.webServer.register({
    kind: "prefix",
    path: prefix,
    handler: async (req, res) => {
      const url = new URL(req.url ?? "/", "http://localhost");
      const pathname = url.pathname;
      const sendJson = (code, payload) => {
        res.statusCode = code;
        res.setHeader("content-type", "application/json; charset=utf-8");
        res.end(JSON.stringify(payload));
      };
      try {
        if (req.method === "GET" && pathname === `${prefix}/api/config`) {
          sendJson(200, loadConfig(configPath, fallback));
          return;
        }
        if (req.method === "POST" && pathname === `${prefix}/api/config`) {
          const body = JSON.parse((await readBody(req)) || "{}");
          const next = { ...loadConfig(configPath, fallback), ...body };
          saveConfig(configPath, next);
          sendJson(200, next);
          return;
        }
        // One upload endpoint for every zone: ?zone=wallpaper|sidebar|input
        if (req.method === "POST" && pathname === `${prefix}/api/upload`) {
          const zone = url.searchParams.get("zone") ?? "wallpaper";
          if (!["wallpaper", "sidebar", "input"].includes(zone)) {
            sendJson(400, { ok: false, error: `unknown zone "${zone}" — use wallpaper/sidebar/input` });
            return;
          }
          const rawName = url.searchParams.get("name") ?? "image.png";
          const ext = extname(rawName).toLowerCase();
          if (!IMAGE_TYPES[ext]) {
            sendJson(400, { ok: false, error: `unsupported image type "${ext || "(none)"}" — use png/jpg/jpeg/webp/gif` });
            return;
          }
          const buffer = await readBodyBuffer(req);
          if (buffer.length === 0) {
            sendJson(400, { ok: false, error: "empty upload" });
            return;
          }
          const dir = configPath ? dirname(configPath) : ".";
          if (zone === "wallpaper") {
            const target = join(dir, `wallpaper-upload${ext}`);
            writeFileSync(target, buffer);
            const next = { ...loadConfig(configPath, fallback), imagePath: target, enabled: true, imageName: rawName };
            saveConfig(configPath, next);
            sendJson(200, next);
            return;
          }
          const target = patternPath(configPath, zone);
          if (!target) {
            sendJson(400, { ok: false, error: "no config path configured for patterns" });
            return;
          }
          mkdirSync(dirname(target), { recursive: true });
          writeFileSync(target, buffer);
          const next = { ...loadConfig(configPath, fallback), [patternFlag(zone)]: true, [zone === "sidebar" ? "sidebarName" : "inputName"]: rawName };
          saveConfig(configPath, next);
          sendJson(200, next);
          return;
        }
        if (req.method === "GET" && pathname === `${prefix}/image.png`) {
          const imagePath = effectiveImagePath(configPath, fallback);
          if (!imagePath || !existsSync(imagePath)) {
            sendJson(404, { ok: false, error: "no wallpaper image configured" });
            return;
          }
          const data = readFileSync(imagePath);
          res.setHeader("content-type", imageContentType(imagePath));
          res.setHeader("cache-control", "no-cache");
          res.statusCode = 200;
          res.end(data);
          return;
        }
        // Serve a zone pattern image: /pattern-sidebar.png, /pattern-input.png
        if (req.method === "GET" && (pathname === `${prefix}/pattern-sidebar.png` || pathname === `${prefix}/pattern-input.png`)) {
          const zone = pathname.endsWith("sidebar.png") ? "sidebar" : "input";
          const target = patternPath(configPath, zone);
          if (!target || !existsSync(target)) {
            sendJson(404, { ok: false, error: `no ${zone} pattern uploaded` });
            return;
          }
          const data = readFileSync(target);
          res.setHeader("content-type", imageContentType(target));
          res.setHeader("cache-control", "no-cache");
          res.statusCode = 200;
          res.end(data);
          return;
        }
        if (req.method === "POST" && pathname === `${prefix}/api/upload-css`) {
          const rawName = url.searchParams.get("name") ?? "custom.css";
          if (extname(rawName).toLowerCase() !== ".css") {
            sendJson(400, { ok: false, error: "only .css files are accepted" });
            return;
          }
          const css = await readBody(req);
          if (!css.trim()) {
            sendJson(400, { ok: false, error: "empty css file" });
            return;
          }
          if (!cssPath) {
            sendJson(400, { ok: false, error: "no config path configured for custom css" });
            return;
          }
          mkdirSync(dirname(cssPath), { recursive: true });
          writeFileSync(cssPath, css, "utf8");
          const next = { ...loadConfig(configPath, fallback), customCss: true, cssName: rawName };
          saveConfig(configPath, next);
          sendJson(200, next);
          return;
        }
        if (req.method === "GET" && pathname === `${prefix}/custom.css`) {
          if (!cssPath || !existsSync(cssPath)) {
            sendJson(404, { ok: false, error: "no custom css uploaded" });
            return;
          }
          const css = readFileSync(cssPath, "utf8");
          res.setHeader("content-type", "text/css; charset=utf-8");
          res.setHeader("cache-control", "no-cache");
          res.statusCode = 200;
          res.end(css);
          return;
        }
        sendJson(404, { ok: false, error: "not found" });
      } catch (error) {
        sendJson(400, { ok: false, error: String(error?.message ?? error) });
      }
    }
  }), "wallpaper-theme: config + image + patterns + css routes");
}

export { Config, apply, inject, name };
