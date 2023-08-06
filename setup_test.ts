// Copyright © 2023 Tomoki Miyauchi. All rights reserved. MIT license.

import {
  getEventListeners,
  handleAddEventListener,
  handlerRemoveEventListener,
  setup,
} from "./setup.ts";
import {
  assert,
  assertEquals,
  assertFalse,
  assertSpyCallArgs,
  assertSpyCalls,
  describe,
  it,
  spy,
} from "./_dev_deps.ts";
import { EventListenerMap } from "./map.ts";

const clickHandler = {
  listener: () => {},
  once: false,
  passive: false,
  type: "click",
  useCapture: false,
};

describe("handleAddEventListener", () => {
  it("should not add listener if the listener is null", () => {
    const registry = new WeakMap<object, EventListenerMap>();
    const thisArg = {};
    const listener = spy(() => {
      return 1;
    });
    const args = ["click", null] as [string, null];

    assertEquals(handleAddEventListener(listener, thisArg, args, registry), 1);
    assertSpyCalls(listener, 1);
    assertSpyCallArgs(listener, 0, args);
    assertEquals(registry.get(thisArg), undefined);
  });

  it("should add listener", () => {
    const registry = new WeakMap<object, EventListenerMap>();
    const thisArg = {};
    const listener = spy(() => {
      return 1;
    });
    const args = ["click", () => {}] as [string, () => void];

    assertEquals(handleAddEventListener(listener, thisArg, args, registry), 1);
    assertSpyCalls(listener, 1);
    assertSpyCallArgs(listener, 0, args);
    assertEquals([...registry.get(thisArg)!], [["click", [{
      listener: args[1],
      once: false,
      passive: false,
      type: "click",
      useCapture: false,
    }]]]);
  });

  it("should add listener if the registry has it", () => {
    const thisArg = {};
    const addEventListener = spy(() => {
      return 1;
    });
    const registry = new WeakMap<object, EventListenerMap>([[
      thisArg,
      new EventListenerMap([clickHandler]),
    ]]);
    const args = ["click", clickHandler.listener, true] as [
      string,
      () => void,
      true,
    ];

    assertEquals(
      handleAddEventListener(addEventListener, thisArg, args, registry),
      1,
    );
    assertSpyCalls(addEventListener, 1);
    assertSpyCallArgs(addEventListener, 0, args);
    assertEquals([...registry.get(thisArg)!], [["click", [clickHandler, {
      ...clickHandler,
      useCapture: true,
    }]]]);
  });
});

describe("handlerRemoveEventListener", () => {
  it("should not do anything if the listener is null", () => {
    const thisArg = {};

    const registry = new WeakMap<object, EventListenerMap>(
      [[thisArg, new EventListenerMap([clickHandler])]],
    );
    const listener = spy(() => {
      return 1;
    });
    const args = ["click", null] as [string, null];

    assertEquals(
      handlerRemoveEventListener(listener, thisArg, args, registry),
      1,
    );
    assertSpyCalls(listener, 1);
    assertSpyCallArgs(listener, 0, args);
    assertEquals([...registry.get(thisArg)!].length, 1);
  });

  it("should not do anything if the listener is not exist", () => {
    const thisArg = {};
    const registry = new WeakMap<object, EventListenerMap>();
    const listener = spy(() => {
      return 1;
    });
    const args = ["click", null] as [string, null];

    assertEquals(
      handlerRemoveEventListener(listener, thisArg, args, registry),
      1,
    );
    assertSpyCalls(listener, 1);
    assertSpyCallArgs(listener, 0, args);
    assertFalse(registry.has(thisArg));
  });

  it("should delete listener if exist", () => {
    const thisArg = {};

    const registry = new WeakMap<object, EventListenerMap>(
      [[thisArg, new EventListenerMap([clickHandler])]],
    );
    const listener = spy(() => {
      return 1;
    });
    const args = ["click", clickHandler.listener] as [string, () => void];

    assertEquals(
      handlerRemoveEventListener(listener, thisArg, args, registry),
      1,
    );
    assertSpyCalls(listener, 1);
    assertSpyCallArgs(listener, 0, args);
    assertEquals([...registry.get(thisArg)!], []);
  });
});

describe("setup", () => {
  it("should override EventTarget prototype", () => {
    const { addEventListener, removeEventListener } = EventTarget.prototype;

    setup();

    assert(EventTarget.prototype.addEventListener !== addEventListener);
    assert(EventTarget.prototype.removeEventListener !== removeEventListener);
  });

  it("should return getEventListeners", () => {
    assert(setup() === getEventListeners);
  });

  it("getEventListeners should return event listeners", () => {
    const getEventListeners = setup();

    assertEquals(getEventListeners(EventTarget.prototype), {});
  });

  it("getEventListeners should return registered event listeners", () => {
    const getEventListeners = setup();

    const target = new EventTarget();
    const listener = () => {};
    target.addEventListener("click", listener);

    assertEquals(getEventListeners(target), {
      "click": [{
        listener,
        type: "click",
        passive: false,
        useCapture: false,
        once: false,
      }],
    });
  });

  it("getEventListeners should return empty", () => {
    const getEventListeners = setup();
    const target = new EventTarget();
    const target2 = new EventTarget();
    target.addEventListener("click", () => {});

    assertEquals(getEventListeners(target2), {});
  });
});
