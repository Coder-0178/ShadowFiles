# ShadowFiles 
ShadowFiles is a library that uses [Service Workers](https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API) to serve files on the client.

> [!IMPORTANT]
> This is still in development, many of the features listed here are planned but not yet implemented!

If you want to see how to set it up (it's not just `npm i shadowfiles`) go to
[Setup](#setup)

# License
This project is licensed under the GNU Affero General Public License v3.0 **or later** (AGPL-3.0-or-later).  
See [LICENSE](/LICENSE) for the full text.


# Use Cases
This library has a very niche use case. It is useful if you need to serve dynamic content to a specific user on the client-side. Additionally, this can help if you need to create a mock API that returns whatever data you want.

# Setup
To set up ShadowFiles you need to first install the package.
ShadowFiles only works **in a browser** with [**Service Worker support**](https://caniuse.com/serviceworkers).

> [!IMPORTANT]
> ShadowFiles is targeted towards ES2024, ensure that your use case supports this. 
> Forking and changing the tsconfig is always an option.

> [!NOTE]
> These instructions are mainly for [Vite](https://vite.dev) users. If you are using another build system like Webpack then you'll need to look at its documentation for service worker support. You can always [Use the plain worker script](#using-a-worker-script) if you need a fast solution, however, this will prevent you from using another service worker in the same scope.

## Using Vite (v7)
First, create a `src/service-worker.ts` file. If it already exists, don't worry. 
At the top of the file, add `import "shadowfiles/sw.js"` 
If you're using Sveltekit, you're done. For other frameworks, see their docs for additional steps.

## Registering the Service Worker
If your framework doesn't support automatic service worker registration, you'll need to do it manually.
Add this code to a place that is run when the page loads (eg, `index.html` or `index.ts`)
```ts
import { registerVite } from "shadowfiles";
await registerVite({
    // you can pass service worker options like scope here.
    scope: "/dyn", // default: "/"

    type: "module", // THIS IS THE DEFAULT
});
```
> [!NOTE]
> Passing a scope (the default is `/`), means that all files you create will be
> under `/[scope]/path/to/the/file`, for example, by passing in `/dyn`
> if you create a file called "myfile.txt" it will actually be served at
> `/dyn/myfile.txt`.

## Using a Worker Script
These steps are a little more complex. After installing the library, go into your `node_modules` folder and find `shadowfiles`. You'll see a file in there (`sw.js`.)
**Copy** this file out of the node modules folder. Put it somewhere in your project where assets are served. Usually something like `public`. 
Wherever these files get served, that will be the URL you pass as the `url` in `register`
## Registering the Worker
To register the worker, use `register`.
This example uses top-level await which may not be supported depending on your environment.
```ts
import { register } from "shadowfiles";

await register({
    url: "/the-url-to-sw.js",
    // you can pass options here like scope
    scope: "/dyn", // default: "/"

    type: "module" // THIS IS THE DEFAULT
});
// now it's ready!
```

> [!IMPORTANT]
> `register` and `registerVite` will not reload the page.
> They use `clients.claim()` to apply to all existing connections, therefore making a reload unnecessary. 
> If this is not intended, you can pass `skipClaim: true` as an option, but you will have to 
> reload yourself.

## Using a CDN
If you want, you can import ShadowFiles directly from a CDN (version 0.0.3+)

> [!CAUTION]
> While minified, using CDNs removes any ability to use [Tree Shaking](https://rollupjs.org/introduction/#tree-shaking) to reduce code size.
> This means that in most cases, you are shipping more code than is needed. 

```ts
// inside any module you want to use ShadowFiles
// USE A FIXED LINK, DO NOT USE THIS ONE!
import {ready, register} from "https://cdn.jsdelivr.net/npm/shadowfiles-core@0/dist/index.min.js"
register(/* args */)
await ready();
//etc
```
Then, in the service worker:
```ts
//inside your service worker (type: module)
// USE A FIXED LINK, DO NOT USE THIS ONE!
import "https://cdn.jsdelivr.net/npm/shadowfiles-core@0/dist/sw.min.js";
// done!
```
--OR--
```ts
// inside your service worker (type: classic/default)
// USE A FIXED LINK, DO NOT USE THIS ONE!
importScripts("https://cdn.jsdelivr.net/npm/shadowfiles-core@0/dist/sw.min.js");
// done!
```
> [!CAUTION]
> Using `importScripts` is not recommended, please use a module-type service worker
> if possible. ShadowFiles was not designed to support classic service workers.
> However, if you are using the SW just for ShadowFiles, then it _should_ be fine.



# Bypassing ShadowFiles
If you need to bypass ShadowFiles for whatever reason, you can pass the `X-SF-BYPASS` header and set it to a value like `1`. If this header is sent, it will bypass ShadowFiles.

# Debugging ShadowFiles issues
All assets that ShadowFiles responds with will return a `X-HANDLED-BY` header with the value `ShadowFiles`.
If this header is present and set to that, then the asset was likely handled by ShadowFiles. This can help to narrow down problems. Using the DevTools `Network` panel can also help.

# Managing Served Assets
## Creating a file
Creating files to serve is easy. You can pass a string or an `ArrayBuffer`. 
You need to use `updateAsset()` to update them. 
Example:
```ts
import { updateAsset, ready } from "shadowfiles";
await ready(); // this waits for the service worker to be available 

// if the asset doesn't exist, writeAsset will create it. 
await updateAsset("somefile.txt", new TextEncoder().encode("hello world"));
// is equivalent to
await updateAsset("somefile.txt", "hello world");
```
When passing a string, the data is encoded with `TextEncoder`. Currently selecting an encoding is not supported; however, you can encode it yourself and pass the ArrayBuffer.

You should also specify a content-type. This is not determined automatically by Shadowfiles*.
```ts
import { updateAsset, ready } from "shadowfiles";
await ready();

await updateAsset("somefile.txt", {
    headers: {
        "Content-Type": "application/json"
    }
}); // updateAsset supports an object to update the asset's metadata.

// you can even combine creating an setting data & setting headers into one call:
await updateAsset("somefile.txt", new Uint8Array(5), {
    headers: {
        "Content-Type": "application/json"
    }
})
```

\* While Shadowfiles will not send a content-type header other than `text/plain`, the browser may decide based on the extension what the true content type is, so it may work on some browsers.
> [!NOTE]
> Custom headers are supported, you can set any headers you want. 

> [!IMPORTANT]
> By default, ShadowFiles aren't designed to persist across service worker activations,
> so most assets you create will NOT remain unless you recreate them. See [Persistent Assets](#persistent-assets) for a solution.

### Persistent Assets
Creating a persistent asset can be done by passing `persistent: true` into the options object.
This will mean that it will persist across SW activations. If the user clears their cookies, it will be gone however.
```ts
import { ready, updateAsset } from "shadowfiles";
await ready();

await updateAsset("somefile.txt", "some data", {
    headers: {
        "Content-Type": "plain/text"
    },
    persistent: true,
});

```


> [!IMPORTANT]
> No two write operations will happen at the same time to each asset.
> Write operations on an asset are queued, so one must finish before the other will begin.
> Each item is added to the queue when `updateAsset` is called, and removed from the queue when
> its promise is resolved or rejected with an error.


## Getting the data
By design, you can get the data by using `fetch`, but that may not be the best. 
Using `readAsset` may help avoid race conditions because it will wait for all pending write operations
to finish before reading the data. Using `fetch` will not. 

> [!IMPORTANT]
> The `readAsset` function, just like `fetch` cares about the scope. Ex: If you set the scope to be `/dyn`
> then you must pass `/dyn/[path]` into `readAsset`.

Example:
```ts
import { ready, readAsset } from "shadowfiles";
await ready(); // wait for the SW to be available. 
const data: ArrayBuffer = await readAsset("somefile.txt")
```
You can also use `exists` to see if the file has been set. 
```ts
import { ready, assetExists, readAsset } from "shadowfiles";
await ready(); // wait for the SW to be available.
if(await assetExists("somefile.txt")) {
    const data = await readAsset("somefile.txt"); 
} else {
    // this will reject the promise with a NOT_FOUND error.
    const data = await readAsset("somefile.txt");
}
```


> [!NOTE]
> Read operations will wait for the write queue to clear 
> before reading the file. 

# Internals
This is a list of internal features related to ShadowFiles that _might_ cause a problem for you.
It is unlikely, but possible. 

## Event Issues
Managing the served assets requires communication with the service worker via `postMessage`.
This means that if you intercept a message event, it may not reach the Shadowfiles SW code. 
That is why you should put the `import "shadowfiles/sw.js"` line at the top to ensure this won't happen.

## Version Mismatches
Multiple versions of ShadowFiles are largely compatible; however, you should avoid doing so when possible.

## Service Worker Caches
Shadowfiles uses these two cache names for its files:
- `_$shadowfiles-store-v1` for ephemeral files
- `_$shadowfiles-persistent-store-v1` for persistent files
These are used to store the assets you set. Modifying them in your own service worker may cause problems.

## Global Symbols
To store page-wide state without polluting the global scope, ShadowFiles uses a custom `Symbol()`.
This is retrieved with `Symbol.for()`, the name is `_shadowFilesGlobalStateData`. Avoid using
that in `Symbol.for()`.

# Roadmap
1. Custom `Cache-Control` handling -> In the future, you should be able to set the `Cache-Control: max-age=...` header to define when to evict old files, even persistent ones, automatically. 
