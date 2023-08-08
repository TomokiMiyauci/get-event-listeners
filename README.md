# get-event-listeners

Polyfill for
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

`setup` function replaces `addEventListener` and `removeEventListener` in
`EventTarget.prototype` with a proxy.

You can refer to the currently registered event listeners with
`getEventListeners`.

```ts
import { setup } from "https://deno.land/x/get_event_listeners/mod.ts";
import { assertEquals } from "https://deno.land/std/testing/asserts.ts";

const getEventListeners = setup();

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

or

```ts
import {
  getEventListeners,
  setup,
} from "https://deno.land/x/get_event_listeners/mod.ts";

setup();
declare const target: EventTarget;
getEventListeners(target);
```

### Proxy builder

Provides a low level API that creates a proxy for the listener. This is useful
when controlling side effects such as testing.

```ts
import {
  createAddEventListenerProxy,
  createRemoveEventListenerProxy,
} from "https://deno.land/x/get_event_listeners/mod.ts";
import {
  afterEach,
  beforeEach,
  describe,
} from "https://deno.land/std/testing/bdd.ts";

const { addEventListener, removeEventListener } = EventTarget.prototype;
const $addEventListener = createAddEventListenerProxy(addEventListener);
const $removeEventListener = createRemoveEventListenerProxy(
  removeEventListener,
);

describe("event listener monitoring", () => {
  beforeEach(() => {
    EventTarget.prototype = $addEventListener;
    EventTarget.prototype = $removeEventListener;
  });

  afterEach(() => {
    EventTarget.prototype = addEventListener;
    EventTarget.prototype = removeEventListener;
  });
});
```

### Event listener equality

Event listeners are managed by `WeakMap`(called registry) throughout the realm.

Equivalence checks for event listener are performed, equivalent to
`addEventListener` and `removeEventListener`.

- `addEventListener` Add an event listener to the registry only if one of
  [`type`, `listener`, `useCapture`] is different from the existing one
- `removeEventListener` Remove the event listener from the registry only if
  [`type`, `listener`, `useCapture`] match

Like `addEventListener`, you can be sure that duplicate listeners will not be
registered in the registry either.

```ts
import { setup } from "https://deno.land/x/get_event_listeners/mod.ts";
import { assertEquals } from "https://deno.land/std/testing/asserts.ts";

const getEventListeners = setup();

declare const target: EventTarget;
declare const handleClick: () => void;
const expected = {
  click: [{
    type: "click",
    listener: handleClick,
    useCapture: false,
    once: false,
    passive: false,
  }, {
    type: "click",
    listener: handleClick,
    useCapture: true,
    once: false,
    passive: false,
  }],
};

target.addEventListener("click", handleClick);
target.addEventListener("click", handleClick, true);

assertEquals(getEventListeners(target), expected);

target.addEventListener("click", handleClick);
target.addEventListener("click", handleClick, true);
target.addEventListener("click", handleClick, { capture: true });
target.addEventListener("click", handleClick, { only: true });
target.addEventListener("click", handleClick, { passive: true });

assertEquals(getEventListeners(target), expected);
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
