import { BuildOptions } from "https://deno.land/x/dnt@0.38.0/mod.ts";

export const makeOptions = (version: string): BuildOptions => ({
  test: false,
  shims: {},
  compilerOptions: {
    lib: ["DOM", "ESNext"],
  },
  typeCheck: "both",
  entryPoints: ["./mod.ts"],
  outDir: "./npm",
  package: {
    name: "@miyauci/get-event-listeners",
    version,
    description: "Ponyfill for getEventListeners",
    keywords: [
      "getEventListeners",
      "get-event-listeners",
      "EventTarget",
    ],
    license: "MIT",
    homepage: "https://github.com/TomokiMiyauci/get-event-listeners",
    repository: {
      type: "git",
      url: "git+https://github.com/TomokiMiyauci/get-event-listeners.git",
    },
    bugs: {
      url: "https://github.com/TomokiMiyauci/get-event-listeners/issues",
    },
    sideEffects: false,
    type: "module",
    publishConfig: { access: "public" },
  },
  packageManager: "pnpm",
  mappings: {
    "https://deno.land/x/isx@1.5.0/is_boolean.ts": {
      name: "@miyauci/isx",
      version: "1.5.0",
      subPath: "is_boolean.js",
    },
    "https://deno.land/x/isx@1.5.0/is_function.ts": {
      name: "@miyauci/isx",
      version: "1.5.0",
      subPath: "is_function.js",
    },
    "https://deno.land/x/isx@1.5.0/is_object.ts": {
      name: "@miyauci/isx",
      version: "1.5.0",
      subPath: "is_object.js",
    },
    "https://deno.land/x/isx@1.5.0/is_null.ts": {
      name: "@miyauci/isx",
      version: "1.5.0",
      subPath: "is_null.js",
    },
    "https://deno.land/x/composite_key@1.0.0/mod.ts": {
      name: "composite-key",
      version: "1.0.0",
    },
    "https://deno.land/x/upsert@1.2.0/mod.ts": {
      name: "@miyauci/upsert",
      version: "1.2.0",
    },
  },
});
