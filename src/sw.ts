//! This file is part of ShadowFiles (https://github.com/Coder-0178/ShadowFiles)
//! Licensed under AGPLv3-or-later, Copyright (C) Jonathon Woolston
import type { ClientMessage, CreateAssetMessage, SwMessage } from "./shared";


const DEFAULT_CACHE = "_$shadowfiles-store-v1";
const PERSISTENT_CACHE = "_$shadowfiles-persistent-store-v1";
self.addEventListener("activate", (ev: ExtendableEvent) => {
  // remove old shadow files on activation, they aren't designed to be persistent.
  ev.waitUntil(caches.delete(DEFAULT_CACHE));
});

//@ts-ignore
self.addEventListener("fetch", (ev: FetchEvent) => {
  if (Boolean(ev.request.headers.get("X-SF-BYPASS"))) return;
  ev.waitUntil(
    new Promise<void>(async (resolve) => {
      const defCache = await caches.open(DEFAULT_CACHE);
      const persistentCache = await caches.open(PERSISTENT_CACHE);
      const match =
        (await defCache.match(ev.request)) ??
        (await persistentCache.match(ev.request));
      if (!match) return resolve();
      match.headers.set("X-HANDLED-BY", "ShadowFiles");
      ev.respondWith(match);
    }),
  );
});

const replyStatus = (
  source: MessageEventSource,
  id: string,
  status: "success" | "failure",
) => {
  source.postMessage({
    id,
    _libSource: "#libShadowFiles",
    source: "sw",
    status,
  } as SwMessage);
};

self.addEventListener("message", async (ev: MessageEvent) => {
  const { data } = ev as { data: ClientMessage };
  if (typeof data !== "object") return;
  if (!("_libSource" in data) || data._libSource !== "#libShadowFiles") return;
  if (data.source !== "page") return;

  ev.stopImmediatePropagation(); // prevent other message event handlers from getting confused
  const defCache = await caches.open(DEFAULT_CACHE);
  const persistentCache = await caches.open(PERSISTENT_CACHE);
  switch (data.type) {
    case "delete":
      if (await defCache.match(new URL(data.path, ev.origin))) {
      }
      break;
    case "update":
      break;
    case "exists":
      break;
  }
});
