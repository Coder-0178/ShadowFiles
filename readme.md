# ShadowFiles 
ShadowFiles is a library that uses [Service Workers](https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API) to serve files on the client.

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
> [!NOTE]
> These instructions are mainly for [Vite](https://vite.dev) users. If you are using another build system like Webpack then you'll need to look at its documentation for service worker support. You can always [Use the plain worker script](#using-a-worker-script) if you need a fast solution, however, this will prevent you from using another service worker in the same scope.

## Using Vite (v7)
First, create a `src/service-worker.ts` file. If it already exists, don't worry. 
At the top of the file, add `import "shadowfiles/sw.js"` 
If you're using Sveltekit, you're done. For other frameworks, see their docs for additional steps.
## Registering the Service Worker
If your framework doesn't support automatic service worker registration, you'll need to do it manually.
Add this code to a place that is run when the page loads (eg, `index.html` or `index.ts` or `+layout.svelte` in a script tag)
```ts
import { registerVite } from "shadowfiles";
await registerVite({
    // you can pass service worker options like scope here.
    scope: "/dyn"
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
Wherever these files get served, that will be the URL you pass as the `serviceWorkerUrl` in `register`
## Registering the Worker
To register the worker, use `register`.
This example uses top-level await which may not be supported depending on your environment.
```ts
import { register } from "shadowfiles";

await register({
    serviceWorkerUrl: "/the-url-to-sw.js",
    // you can pass options here like scope
    scope: "/dyn"
});
// now its ready!
```

> [!IMPORTANT]
> `register` and `registerVite` will not reload the page.
> They use `clients.claim()` to apply to all existing connections, therefore making a reload unnecessary. 
> If this is not intended, you can pass `skipClaim: true` as an option, but you will have to 
> reload yourself.

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

updateAsset("somefile.txt", {
    headers: {
        "Content-Type": "application/json"
    }
}); // updateAsset supports an object to update the asset's metadata.
```

\* While Shadowfiles will not send a content-type header other than `text/plain`, the browser may decide based on the extension what the true content type is, so it may work on some browsers.
> [!NOTE]
> Custom headers are supported, you can set any headers you want. 

> [!IMPORTANT]
> No two write operations will happen at the same time to each asset.
> Write operations on an asset are queued, so one must finish before the other will begin.
> Each item is added to the queue when `updateAsset` is called, and removed from the queue when
> its promise is resolved or rejected with an error.


## Getting the data
By design, you can get the data by using `fetch`, of course, however, if you would like to avoid an entire network call to the service worker, using `readAsset` may be slightly faster. 
Also, if you set a scope, `fetch` will care about the scope, but `readAsset` will not.
Using `readAsset` may help avoid race conditions because it will wait for all pending write operations
to finish before reading the data. Using `fetch` will not. 

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
Managing the served assets requires communication with the service worker via `postMessage`.
This means that if you intercept a message event, it may not reach the Shadowfiles SW code. 
That is why you should put the `import "shadowfiles/sw.js"` line at the top to ensure this won't happen.

# Potential Issues
- Version Mismatches
If you use multiple incompatible versions of ShadowFiles, you may run into low-level, hard-to-debug problems with the service worker internals. Currently, this is not handled by the library. At minimum, stick to within the same major version, with the highest minor & patch version if possible for the service worker.
