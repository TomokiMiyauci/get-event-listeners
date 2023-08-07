// Copyright © 2023 Tomoki Miyauchi. All rights reserved. MIT license.
// This module is browser compatible.

import { EventListenerMap } from "./map.ts";
import { normalizeOptions } from "./utils.ts";
import { eventTargetRegistry } from "./constants.ts";
import type { EventListeners, Listener } from "./types.ts";
import { groupBy } from "./deps.ts";

export interface GetEventListeners {
  (target: object): EventListeners;
}

/** Setup event listener monitoring.
 * Performs a side effect and changes the prototype of `EventTarget`.
 */
export function setup(): GetEventListeners {
  const { addEventListener, removeEventListener } = EventTarget.prototype;
  const $addEventListener = createAddEventListenerProxy(
    addEventListener,
  );
  const $removeEventListener = createRemoveEventListenerProxy(
    removeEventListener,
  );

  EventTarget.prototype.addEventListener = $addEventListener;
  EventTarget.prototype.removeEventListener = $removeEventListener;

  return getEventListeners;
}

export function createAddEventListenerProxy(
  addEventListener: typeof EventTarget.prototype.addEventListener,
): typeof EventTarget.prototype.addEventListener {
  return new Proxy(addEventListener, {
    apply: (target, thisArg, argArray) =>
      handleAddEventListener(
        target,
        thisArg,
        argArray as Parameters<typeof EventTarget.prototype.addEventListener>,
        eventTargetRegistry,
      ),
  });
}

export function createRemoveEventListenerProxy(
  removeEventListener: typeof EventTarget.prototype.removeEventListener,
): typeof EventTarget.prototype.removeEventListener {
  return new Proxy(removeEventListener, {
    apply: (target, thisArg, argArray) =>
      handlerRemoveEventListener(
        target,
        thisArg,
        argArray as Parameters<
          typeof EventTarget.prototype.removeEventListener
        >,
        eventTargetRegistry,
      ),
  });
}

export function handleAddEventListener<T extends object, R>(
  target: (
    this: T,
    ...args: Parameters<typeof EventTarget.prototype.addEventListener>
  ) => R,
  thisArg: T,
  argArray: Parameters<typeof EventTarget.prototype.addEventListener>,
  registry: WeakMap<T, EventListenerMap>,
): R {
  const [type, listener, options] = argArray;

  if (!listener) return target.apply(thisArg, argArray);

  const $listener: Listener = { type, listener, ...normalizeOptions(options) };

  if (registry.has(thisArg)) {
    const map = registry.get(thisArg)!;

    map.set($listener);
  } else {
    const map = new EventListenerMap([$listener]);

    registry.set(thisArg, map);
  }

  return target.apply(thisArg, argArray);
}

export function handlerRemoveEventListener<T extends object, R>(
  target: (
    this: T,
    ...args: Parameters<typeof EventTarget.prototype.removeEventListener>
  ) => R,
  thisArg: T,
  argArray: Parameters<typeof EventTarget.prototype.removeEventListener>,
  registry: WeakMap<T, EventListenerMap>,
): R {
  const [type, listener, options] = argArray;

  if (listener && registry.has(thisArg)) {
    const eventRegistry = registry.get(thisArg)!;

    eventRegistry.delete({ type, listener, ...normalizeOptions(options) });
  }

  return target.apply(thisArg, argArray);
}

/** Get {@linkcode EventListeners}.
 * Before this can be done, {@linkcode setup} must be performed.
 */
export function getEventListeners(target: object): EventListeners {
  const eventMap = eventTargetRegistry.get(target);

  if (!eventMap) return {};

  return groupBy(eventMap, pickType) as EventListeners;
}

function pickType<T>(obj: { type: T }): T {
  return obj.type;
}
