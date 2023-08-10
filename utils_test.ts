// Copyright © 2023 Tomoki Miyauchi. All rights reserved. MIT license.

import {
  defaultPassiveValue,
  flatOptions,
  flatOptionsMore,
  isNodeLike,
  isWindow,
  NormalizedOptions,
  toHandler,
  toKey,
} from "./utils.ts";
import {
  assert,
  assertEquals,
  assertFalse,
  describe,
  it,
} from "./_dev_deps.ts";
import {
  Document,
  DOMParser,
} from "https://deno.land/x/deno_dom@v0.1.38/deno-dom-wasm.ts";
import { ComparableEventListenerLike } from "./types.ts";

describe("flatOptions", () => {
  it("should return boolean", () => {
    const table: [undefined | boolean | EventListenerOptions, boolean][] = [
      [undefined, false],
      [false, false],
      [true, true],
      [{ capture: undefined }, false],
      [{ capture: false }, false],
      [{ capture: true }, true],
    ];

    table.forEach(([input, expected]) => {
      assertEquals(flatOptions(input), expected);
    });
  });
});

const defaultNormalizedOptions: NormalizedOptions = {
  capture: false,
  once: false,
  passive: null,
  signal: null,
};

describe("flatOptionsMore", () => {
  it("should return boolean", () => {
    const signal = new AbortController().signal;
    const table: [
      undefined | boolean | AddEventListenerOptions,
      NormalizedOptions,
    ][] = [
      [undefined, defaultNormalizedOptions],
      [false, defaultNormalizedOptions],
      [true, { ...defaultNormalizedOptions, capture: true }],
      [{}, defaultNormalizedOptions],
      [{ capture: false }, defaultNormalizedOptions],
      [{ capture: true }, { ...defaultNormalizedOptions, capture: true }],
      [{ once: undefined }, defaultNormalizedOptions],
      [{ once: false }, defaultNormalizedOptions],
      [{ once: true }, { ...defaultNormalizedOptions, once: true }],
      [{ passive: undefined }, defaultNormalizedOptions],
      [{ passive: false }, { ...defaultNormalizedOptions, passive: false }],
      [{ passive: true }, { ...defaultNormalizedOptions, passive: true }],
      [{ signal: undefined }, defaultNormalizedOptions],
      [{ signal }, { ...defaultNormalizedOptions, signal }],
      [{ capture: true, passive: true, once: true, signal }, {
        capture: true,
        passive: true,
        once: true,
        signal,
      }],
    ];

    table.forEach(([input, expected]) => {
      assertEquals(flatOptionsMore(input), expected);
    });
  });
});

describe("isWindow", () => {
  it("should return true", () => {
    const table: unknown[] = [
      window,
      globalThis.window,
    ];

    table.forEach((input) => {
      assert(isWindow(input));
    });
  });

  it("should return false", () => {
    const table: unknown[] = [
      {},
      null,
      undefined,
      [],
    ];

    table.forEach((input) => {
      assertFalse(isWindow(input));
    });
  });
});

describe("isNodeLike", () => {
  it("should return true", () => {
    const table: object[] = [
      { ownerDocument: {} },
      { ownerDocument: null },
    ];

    table.forEach((input) => {
      assert(isNodeLike(input));
    });
  });

  it("should return false", () => {
    const table: object[] = [
      {},
      { ownerDocument: undefined },
      { ownerDocument: "" },
      { ownerDocument: 0 },
    ];

    table.forEach((input) => {
      assertFalse(isNodeLike(input));
    });
  });
});

describe("defaultPassiveValue", () => {
  it("should return true", () => {
    const document = new Document();
    const parser = new DOMParser();

    Object.defineProperty(globalThis, "document", {
      value: document,
      configurable: true,
    });

    const table: [string, EventTarget][] = [
      ["touchstart", window],
      ["touchmove", window],
      ["wheel", window],
      ["mousewheel", window],
      ["touchstart", parser.parseFromString("", "text/html")?.body!],
      ["touchstart", parser.parseFromString("", "text/html")?.documentElement!],
      ["touchstart", document],
    ];

    table.forEach(([type, target]) => {
      assert(defaultPassiveValue(type, target));
    });

    Object.defineProperty(globalThis, "document", { value: undefined });
  });

  it("should return false", () => {
    const document = new Document();
    const parser = new DOMParser();

    Object.defineProperty(globalThis, "document", {
      value: document,
      configurable: true,
    });

    const table: [string, EventTarget][] = [
      ["click", window],
      ["touchstart", document.createElement("div")],
      ["touchstart", parser.parseFromString("", "text/html")?.doctype!],
      ["touchstart", parser.parseFromString("", "text/html")?.head!],
      ["touchstart", new EventTarget()],
    ];

    table.forEach(([type, target]) => {
      assertFalse(defaultPassiveValue(type, target));
    });

    Object.defineProperty(globalThis, "document", { value: undefined });
  });
});

describe("toHandler", () => {
  it("should return bound handleEvent method", () => {
    class Component implements EventListenerObject {
      #value = false;
      handleEvent(): void | Promise<void> {
        this.#value;
      }
    }

    const handler = toHandler(new Component());

    assert(typeof handler === "function");
    assertFalse(handler(new Event("")));
  });

  it("should return as is", () => {
    function callback() {}

    assert(callback === toHandler(callback));
  });
});

describe("toKey", () => {
  it("should equals", () => {
    const callback = () => {};
    const object: EventListenerObject = {
      handleEvent: callback,
    };

    const table: [
      left: ComparableEventListenerLike,
      right: ComparableEventListenerLike,
    ][] = [
      [{ callback, type: "click", capture: false }, {
        callback,
        type: "click",
        capture: false,
      }],
      [{ callback, type: "click", capture: true }, {
        callback,
        type: "click",
        capture: true,
      }],
      [{ callback: object, type: "blur", capture: false }, {
        callback: object,
        type: "blur",
        capture: false,
      }],
    ];

    table.forEach(([left, right]) => {
      assert(toKey(left) === toKey(right));
    });
  });

  it("should not equals", () => {
    const callback = () => {};
    const object: EventListenerObject = {
      handleEvent: callback,
    };

    const table: [
      left: ComparableEventListenerLike,
      right: ComparableEventListenerLike,
    ][] = [
      [{ callback, type: "click", capture: false }, {
        callback,
        type: "blur",
        capture: false,
      }],
      [{ callback, type: "click", capture: false }, {
        callback,
        type: "click",
        capture: true,
      }],
      [{ callback, type: "blur", capture: false }, {
        callback: object,
        type: "blur",
        capture: false,
      }],
    ];

    table.forEach(([left, right]) => {
      assert(toKey(left) !== toKey(right));
    });
  });
});
