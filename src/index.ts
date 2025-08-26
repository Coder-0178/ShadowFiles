let onReady: () => void = () => {
  throw new Error("ready() was used before registration.");
};

const readyPromise = new Promise<void>((resolve) => {
  onReady = resolve;
});

export function ready() {
  return readyPromise;
}

export async function register(options: { url: string } & RegistrationOptions) {
  if (!("navigator" in globalThis) || !navigator.serviceWorker) {
    throw new Error("Service workers not supported in this environment.");
  }

  const scope = options.scope ?? "/";
  const reg = await navigator.serviceWorker.getRegistration(scope);
  if (reg) {
    throw new Error(`Service worker already registered at scope "${scope}".`);
  }

  const r = await navigator.serviceWorker.register(options.url, options);

  await navigator.serviceWorker.ready;
  onReady();
  return r;
}

export async function registerVite(options: RegistrationOptions) {
  const scope = options.scope ?? "/";
  const registrations = await navigator.serviceWorker.getRegistrations();
  for (const reg of registrations) {
    if (reg.scope === new URL(scope, location.origin).href) {
      throw new Error(`Service worker already registered at scope "${scope}".`);
    }
  }

  const r = await navigator.serviceWorker.register(
    new URL("./sw.js", import.meta.url), // this is how Vite auto-bundles 
    // service workers
    // todo TEST THIS w/ Vite as a dependency
    options,
  );

  await navigator.serviceWorker.ready;
  onReady();
  return r;
}
