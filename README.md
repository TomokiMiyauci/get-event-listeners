# get-event-listeners

Ponyfill for
[`getEventListeners`](https://developer.chrome.com/docs/devtools/console/utilities/#getEventListeners-function).

## Install

deno.land:

```ts
import * as mod from "https://deno.land/x/get_event_listeners/mod.ts";
```

npm:

```bash
npm i @miyauci/get-event-listeners
```

## Usage

`updateEventListener` function replaces `addEventListener` and
`removeEventListener` in `EventTarget.prototype` with a proxy.

You can refer to the currently registered event listeners with return value.

```ts
import { updateEventListener } from "https://deno.land/x/get_event_listeners/mod.ts";
import { assertEquals } from "https://deno.land/std/testing/asserts.ts";

const getEventListeners = updateEventListener();

declare const target: EventTarget;
declare const handleClick: () => void;
target.addEventListener("click", handleClick);

assertEquals(getEventListeners(target), {
  click: [{
    type: "click",
    listener: handleClick,
    useCapture: false,
    once: false,
    passive: false,
  }],
});
```

### Linkage

As soon as an event listener is removed, the return value of `getEventListeners`
is also changed.

#### Abort signal

If `signal` aborts, the return value of `getEventListeners` is also changed.

```ts
import {
  type EventListener,
  updateEventListener,
} from "https://deno.land/x/get_event_listeners/mod.ts";
import {
  assert,
  assertEquals,
  assertFalse,
} from "https://deno.land/std/testing/asserts.ts";

const getEventListeners = updateEventListener();
declare const target: EventTarget;
declare const controller: AbortController;
declare const callback: () => void;
declare const event: string;
declare const listener: EventListener;

assertFalse(controller.signal.aborted);
target.addEventListener(event, callback, { signal: controller.signal });
assertEquals(getEventListeners(target), { [event]: [listener] });

controller.abort();
assert(controller.signal.aborted);
assertEquals(getEventListeners(target), {});
```

#### Once

If listener with `once` is called, the return value of `getEventListeners` is
also changed.

```ts
import {
  type EventListener,
  updateEventListener,
} from "https://deno.land/x/get_event_listeners/mod.ts";
import {
  assert,
  assertEquals,
  assertFalse,
} from "https://deno.land/std/testing/asserts.ts";

const getEventListeners = updateEventListener();
declare const target: EventTarget;
declare const callback: () => void;
declare const event: string;
declare const listener: EventListener;

target.addEventListener(event, callback, { once: true });
assertEquals(getEventListeners(target), { [event]: [listener] });

target.dispatchEvent(new Event(event));
assertEquals(getEventListeners(target), {});
```

### Default passive

The default `passive` is determined according to
[default passive value](https://dom.spec.whatwg.org/#default-passive-value).

```ts
import {
  type EventListener,
  updateEventListener,
} from "https://deno.land/x/get_event_listeners/mod.ts";
import { assertEquals } from "https://deno.land/std/testing/asserts.ts";

const getEventListeners = updateEventListener();
declare const callback: () => void;
declare const listener: EventListener;

addEventListener("touchstart", callback);
assertEquals(getEventListeners(window), {
  touchstart: [{ ...listener, passive: true }],
});
```

#### The DOM

The default `passive` is also defined for `Document`, `HTMLHtmlElement` and
`HTMLBodyElement`.

```ts
/// <reference lib="dom" />
import {
  type EventListener,
  updateEventListener,
} from "https://deno.land/x/get_event_listeners/mod.ts";
import { assert, assertEquals } from "https://deno.land/std/testing/asserts.ts";

const getEventListeners = updateEventListener();
declare const callback: () => void;
declare const listener: EventListener;
declare const document: Document;

assert(globalThis.document === document);

document.addEventListener("touchend", callback);
assertEquals(getEventListeners(document), {
  touchend: [{ ...listener, passive: true }],
});
```

### Pure context

The `updateEventListener` has a side effect instead of being immediately
available.

We provide a pure context builder with no side effects.

```ts
import { createContext } from "https://deno.land/x/get_event_listeners/mod.ts";
import {
  afterEach,
  beforeEach,
  describe,
} from "https://deno.land/std/testing/bdd.ts";

const { addEventListener, removeEventListener } = EventTarget.prototype;
const context = createContext({ addEventListener, removeEventListener });

describe("event listener monitoring", () => {
  beforeEach(() => {
    EventTarget.prototype.addEventListener = context.addEventListener;
    EventTarget.prototype.removeEventListener = context.removeEventListener;
  });

  afterEach(() => {
    EventTarget.prototype.addEventListener = addEventListener;
    EventTarget.prototype.removeEventListener = removeEventListener;
  });
});
```

## Compatibility

`getEventListeners` is based on
[Chrome Console Utilities API](https://developer.chrome.com/docs/devtools/console/utilities/#getEventListeners-function).

Safari provides
[similar functionality](https://developer.apple.com/documentation/webkitjs/commandlineapihost/1631026-geteventlisteners?changes=_7),
but there is no `type` property on the return value of `EventListener`.

The DOM has also [proposed](https://github.com/whatwg/dom/issues/412) adding a
similar API to `EventTarget`.

## API

See [deno doc](https://deno.land/x/get_event_listeners?doc) for all APIs.

## Contributing

See [contributing](CONTRIBUTING.md).

## License

[MIT](LICENSE) © 2023 Tomoki Miyauchi
