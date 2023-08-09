import { createContext } from "./listener.ts";
import {
  assert,
  assertEquals,
  assertSpyCallArgs,
  assertSpyCalls,
  beforeAll,
  describe,
  it,
  spy,
} from "./_dev_deps.ts";

const map = new Map();

const { getEventListeners, addEventListener, removeEventListener } =
  createContext(map);

describe("e2e", () => {
  beforeAll(function () {
    EventTarget.prototype.addEventListener = addEventListener;
    EventTarget.prototype.removeEventListener = removeEventListener;
  });

  it("should not add listener if the callback is null", () => {
    const target = new EventTarget();

    target.addEventListener("click", null);

    assertEquals(getEventListeners(target), {});
  });

  it(
    "should add, dispatch and remove 1 listener as function",
    () => {
      const target = new EventTarget();
      const callback = spy(() => {});

      target.addEventListener("click", callback);
      const result = {
        click: [{
          type: "click",
          listener: callback,
          once: false,
          passive: false,
          useCapture: false,
        }],
      };
      assertEquals(getEventListeners(target), result);

      const event = new Event("click");
      target.dispatchEvent(event);
      assertSpyCalls(callback, 1);
      assertSpyCallArgs(callback, 0, [event]);
      assertEquals(getEventListeners(target), result);

      target.removeEventListener("click", callback);
      target.dispatchEvent(event);
      assertSpyCalls(callback, 1);
      assertEquals(getEventListeners(target), {});
    },
  );

  it("should not add duplicated callback", () => {
    const target = new EventTarget();
    const callback = spy(() => {});

    target.addEventListener("click", callback);
    const result = {
      click: [{
        type: "click",
        listener: callback,
        once: false,
        passive: false,
        useCapture: false,
      }],
    };
    assertEquals(getEventListeners(target), result);
    target.addEventListener("click", callback);
    assertEquals(getEventListeners(target), result);

    const event = new Event("click");
    target.dispatchEvent(event);
    assertSpyCalls(callback, 1);
    assertEquals(getEventListeners(target), result);

    target.removeEventListener("click", callback);
    target.dispatchEvent(event);
    assertSpyCalls(callback, 1);
    assertEquals(getEventListeners(target), {});
  });

  it("should add, dispatch and remove 1 listener as listener object", () => {
    const target = new EventTarget();
    const callback = spy(() => {});
    const object: EventListenerObject = {
      handleEvent: callback,
    };

    target.addEventListener("click", object);
    const result = {
      click: [{
        type: "click",
        listener: object,
        once: false,
        passive: false,
        useCapture: false,
      }],
    };
    assertEquals(getEventListeners(target), result);

    const event = new Event("click");
    target.dispatchEvent(event);
    assertSpyCalls(callback, 1);
    assertSpyCallArgs(callback, 0, [event]);
    assertEquals(getEventListeners(target), result);

    target.removeEventListener("click", object);
    target.dispatchEvent(event);
    assertSpyCalls(callback, 1);
    assertEquals(getEventListeners(target), {});
  });

  it("should not add duplicated listener object", () => {
    const target = new EventTarget();
    const callback = spy(() => {});
    const object: EventListenerObject = {
      handleEvent: callback,
    };

    target.addEventListener("click", object);
    const result = {
      click: [{
        type: "click",
        listener: object,
        once: false,
        passive: false,
        useCapture: false,
      }],
    };
    assertEquals(getEventListeners(target), result);
    target.addEventListener("click", object);
    assertEquals(getEventListeners(target), result);

    const event = new Event("click");
    target.dispatchEvent(event);
    assertSpyCalls(callback, 1);
    assertEquals(getEventListeners(target), result);

    target.removeEventListener("click", object);
    target.dispatchEvent(event);
    assertSpyCalls(callback, 1);
    assertEquals(getEventListeners(target), {});
  });

  it("should remove automatically if the once is true", () => {
    const target = new EventTarget();
    const callback = spy(() => {});

    target.addEventListener("click", callback, { once: true });
    assertEquals(getEventListeners(target), {
      click: [{
        type: "click",
        listener: callback,
        once: true,
        passive: false,
        useCapture: false,
      }],
    });

    target.dispatchEvent(new Event("click"));
    assertSpyCalls(callback, 1);
    assertEquals(getEventListeners(target), {});

    target.dispatchEvent(new Event("click"));
    assertSpyCalls(callback, 1);

    target.removeEventListener("click", callback);
    assertSpyCalls(callback, 1);
    assertEquals(getEventListeners(target), {});
  });

  it("should remove listener object automatically if the once is true", () => {
    const target = new EventTarget();
    const callback = spy(() => {});
    const object: EventListenerObject = { handleEvent: callback };

    target.addEventListener("click", object, { once: true });
    assertEquals(getEventListeners(target), {
      click: [{
        type: "click",
        listener: object,
        once: true,
        passive: false,
        useCapture: false,
      }],
    });

    target.dispatchEvent(new Event("click"));
    assertSpyCalls(callback, 1);
    assertEquals(getEventListeners(target), {});

    target.dispatchEvent(new Event("click"));
    assertSpyCalls(callback, 1);

    target.removeEventListener("click", object);
    assertSpyCalls(callback, 1);
    assertEquals(getEventListeners(target), {});
  });

  it("should remove once callback", () => {
    const target = new EventTarget();
    const callback = spy(() => {});

    target.addEventListener("click", callback, { once: true });
    assertEquals(getEventListeners(target), {
      click: [{
        type: "click",
        listener: callback,
        once: true,
        passive: false,
        useCapture: false,
      }],
    });

    target.removeEventListener("click", callback);
    assertEquals(getEventListeners(target), {});
    assertSpyCalls(callback, 0);

    target.dispatchEvent(new Event("click"));
    assertEquals(getEventListeners(target), {});
    assertSpyCalls(callback, 0);
  });

  it("should remove once listener object", () => {
    const target = new EventTarget();
    const callback = spy(() => {});
    const object: EventListenerObject = { handleEvent: callback };

    target.addEventListener("click", object, { once: true });
    assertEquals(getEventListeners(target), {
      click: [{
        type: "click",
        listener: object,
        once: true,
        passive: false,
        useCapture: false,
      }],
    });

    target.removeEventListener("click", object);
    assertEquals(getEventListeners(target), {});
    assertSpyCalls(callback, 0);

    target.dispatchEvent(new Event("click"));
    assertEquals(getEventListeners(target), {});
    assertSpyCalls(callback, 0);
  });

  it("should not add if the signal has been aborted", () => {
    const target = new EventTarget();
    const callback = spy(() => {});
    const controller = new AbortController();
    controller.abort();
    assert(controller.signal.aborted);

    target.addEventListener("click", callback, { signal: controller.signal });
    assertEquals(getEventListeners(target), {});
    target.dispatchEvent(new Event("click"));
    assertSpyCalls(callback, 0);
  });

  it("should remove if the signal has been aborted", () => {
    const target = new EventTarget();
    const callback = spy(() => {});
    const controller = new AbortController();

    target.addEventListener("click", callback, { signal: controller.signal });
    assertEquals(getEventListeners(target), {
      click: [{
        type: "click",
        listener: callback,
        passive: false,
        once: false,
        useCapture: false,
      }],
    });

    controller.abort();
    assertEquals(getEventListeners(target), {});

    target.dispatchEvent(new Event("click"));
    assertSpyCalls(callback, 0);
  });

  it("should add abort event listener if the signal is passed", () => {
    const target = new EventTarget();
    const callback = spy(() => {});
    const controller = new AbortController();

    target.addEventListener("click", callback, { signal: controller.signal });

    assertEquals(
      getEventListeners(controller.signal).abort.length,
      2,
      "it should length 2 because the original addEventListener also add abort listener",
    );
    controller.abort();

    assertEquals(
      getEventListeners(controller.signal).abort.length,
      1,
      "it should length 1 because the abort listener registered by original addEventListener is not `once`. It is right that it is not once?",
    );
  });

  it("should remove if the signal has been aborted with once", () => {
    const target = new EventTarget();
    const callback = spy(() => {});
    const controller = new AbortController();

    target.addEventListener("click", callback, {
      signal: controller.signal,
      once: true,
    });
    assertEquals(getEventListeners(target), {
      click: [{
        type: "click",
        listener: callback,
        passive: false,
        once: true,
        useCapture: false,
      }],
    });

    controller.abort();
    assertEquals(getEventListeners(target), {});

    target.dispatchEvent(new Event("click"));
    assertSpyCalls(callback, 0);
  });

  it("should remove if the signal has been aborted with once", () => {
    const target = new EventTarget();
    const callback = spy(() => {});
    const object: EventListenerObject = { handleEvent: callback };
    const controller = new AbortController();

    target.addEventListener("click", object, {
      signal: controller.signal,
      once: true,
    });
    assertEquals(getEventListeners(target), {
      click: [{
        type: "click",
        listener: object,
        passive: false,
        once: true,
        useCapture: false,
      }],
    });

    controller.abort();
    assertEquals(getEventListeners(target), {});

    target.dispatchEvent(new Event("click"));
    assertSpyCalls(callback, 0);
  });

  it("should add captured and non-captured listener", () => {
    const target = new EventTarget();
    const callback = spy(() => {});

    target.addEventListener("click", callback, false);
    target.addEventListener("click", callback, true);

    assertEquals(getEventListeners(target), {
      click: [{
        type: "click",
        listener: callback,
        passive: false,
        once: false,
        useCapture: false,
      }, {
        type: "click",
        listener: callback,
        passive: false,
        once: false,
        useCapture: true,
      }],
    });
  });

  it("should add multiple listener", () => {
    const target = new EventTarget();
    const callback = spy(() => {});

    target.addEventListener("click", callback);
    target.addEventListener("blur", callback);
    const click = {
      type: "click",
      listener: callback,
      passive: false,
      once: false,
      useCapture: false,
    };
    const blur = { ...click, type: "blur" };

    assertEquals(getEventListeners(target), {
      click: [click],
      blur: [blur],
    });

    target.dispatchEvent(new Event("click"));
    assertSpyCalls(callback, 1);

    target.dispatchEvent(new Event("blur"));
    assertSpyCalls(callback, 2);

    target.removeEventListener("click", callback);
    assertEquals(getEventListeners(target), {
      blur: [blur],
    });

    target.dispatchEvent(new Event("click"));
    assertSpyCalls(callback, 2);

    target.removeEventListener("blur", callback);
    assertEquals(getEventListeners(target), {});

    target.dispatchEvent(new Event("blur"));
    assertSpyCalls(callback, 2);
  });

  it("should add multiple listener with once", () => {
    const target = new EventTarget();
    const callback = spy(() => {});

    target.addEventListener("click", callback, { once: true });
    target.addEventListener("blur", callback, { once: true });
    const click = {
      type: "click",
      listener: callback,
      passive: false,
      once: true,
      useCapture: false,
    };
    const blur = { ...click, type: "blur" };

    assertEquals(getEventListeners(target), {
      click: [click],
      blur: [blur],
    });

    target.dispatchEvent(new Event("click"));
    assertSpyCalls(callback, 1);
    assertEquals(getEventListeners(target), {
      blur: [blur],
    });

    target.dispatchEvent(new Event("blur"));
    assertSpyCalls(callback, 2);
    assertEquals(getEventListeners(target), {});

    target.dispatchEvent(new Event("click"));
    assertSpyCalls(callback, 2);

    target.dispatchEvent(new Event("blur"));
    assertSpyCalls(callback, 2);
  });

  it("should not effect another target", () => {
    const target = new EventTarget();
    const callback = spy(() => {});
    const click = {
      type: "click",
      listener: callback,
      passive: false,
      once: false,
      useCapture: false,
    };
    target.addEventListener("click", callback);

    assertEquals(getEventListeners(target), {
      click: [click],
    });

    const altTarget = new EventTarget();
    altTarget.addEventListener("click", callback);

    assertEquals(getEventListeners(target), {
      click: [click],
    });
    assertEquals(getEventListeners(altTarget), {
      click: [click],
    });

    altTarget.dispatchEvent(new Event("click"));
    assertSpyCalls(callback, 1);

    altTarget.removeEventListener("click", callback);
    assertEquals(getEventListeners(target), {
      click: [click],
    });
    assertEquals(getEventListeners(altTarget), {});

    altTarget.dispatchEvent(new Event("click"));
    assertSpyCalls(callback, 1);

    target.dispatchEvent(new Event("click"));
    assertSpyCalls(callback, 2);

    target.removeEventListener("click", callback);
    assertEquals(getEventListeners(altTarget), {});
  });

  it("should work with global this", () => {
    const callback = spy(() => {});

    addEventListener("click", callback);
    assertEquals(getEventListeners(globalThis), {
      click: [{
        type: "click",
        listener: callback,
        once: false,
        useCapture: false,
        passive: false,
      }],
    });

    dispatchEvent(new Event("click"));
    assertSpyCalls(callback, 1);

    removeEventListener("click", callback);
    assertEquals(getEventListeners(globalThis), {});

    dispatchEvent(new Event("click"));
    assertSpyCalls(callback, 1);
  });

  it("should work with global this with once", () => {
    const callback = spy(() => {});

    addEventListener("click", callback, { once: true });
    assertEquals(getEventListeners(globalThis), {
      click: [{
        type: "click",
        listener: callback,
        once: true,
        useCapture: false,
        passive: false,
      }],
    });

    dispatchEvent(new Event("click"));
    assertSpyCalls(callback, 1);

    assertEquals(getEventListeners(globalThis), {});

    dispatchEvent(new Event("click"));
    assertSpyCalls(callback, 1);
  });
  // it("should add captured callback", () => {
  //   const target = new EventTarget();
  //   const callback = spy(() => {});

  //   target.addEventListener("click", callback, true);
  //   const result = {
  //     click: [{
  //       type: "click",
  //       listener: callback,
  //       once: false,
  //       passive: false,
  //       useCapture: true,
  //     }],
  //   };
  //   assertEquals(getEventListeners(target), result);

  //   target.removeEventListener("click", callback);
  //   assertEquals(getEventListeners(target), result);
  //   assertSpyCalls(callback, 0);

  //   target.dispatchEvent(new Event("click"));
  //   assertSpyCalls(callback, 1);
  //   assertEquals(getEventListeners(target), {});
  // });
});
