export async function register(options: {
    url: string
} & RegistrationOptions) {
    if(!("navigator" in globalThis)) {
        throw new Error("This function cannot be called on the server or the browser is not compatible.");
    }

    const reg = await navigator.serviceWorker.getRegistration(options.url);
    if(reg) {
        throw new Error("Service worker already registered.");
    }

    return navigator.serviceWorker.register(options.url, options)
}

export async function registerVite(options: RegistrationOptions) {
    const registrations = await navigator.serviceWorker.getRegistrations();
    for(const reg of registrations) {
        if(reg.scope === options.scope) {
            throw new Error("Service worker already registered.");
        }
    }
    
    return navigator.serviceWorker.register(new URL("./sw.js", import.meta.url), options);
}
