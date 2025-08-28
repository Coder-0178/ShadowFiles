export {};

const DEFAULT_CACHE = "_$shadowfiles-store-v1";
const PERSISTENT_CACHE = "_$shadowfiles-persistent-store-v1";
self.addEventListener("activate", (ev: ExtendableEvent) => {
    // remove old shadow files on activation, they aren't designed to be persistent.
    ev.waitUntil(
        caches.delete(DEFAULT_CACHE)
    );
})

//@ts-ignore
self.addEventListener("fetch", (ev: FetchEvent) => {
    
});

self.addEventListener("message", (ev: MessageEvent) => {
    const {data} = ev as {data: SwMessage};
    if(typeof data !== "object") return;
    if(!("_libSource" in data) || data._libSource !== "#libShadowFiles") return;

})