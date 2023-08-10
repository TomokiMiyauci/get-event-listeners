// Copyright © 2023 Tomoki Miyauchi. All rights reserved. MIT license.
// This module is browser compatible.

import {
  defaultPassiveValue,
  flatOptions,
  flatOptionsMore,
  toHandler,
  toKey,
} from "./utils.ts";
import type {
  AddEventListener,
  ComparableEventListenerLike,
  DetailEventListener,
  EventListener,
  EventListenerLike,
  EventListenerRegistry,
  EventListeners,
  RemoveEventListener,
} from "./types.ts";
import { groupBy, insert, isNull } from "./deps.ts";

/** Register {@linkcode listener} if the {@linkcode registry} has not {@linkcode listener}.
 * If {@linkcode listener} `signal` is passed, add algorithm.
 *
 * @see https://dom.spec.whatwg.org/#add-an-event-listener
 */
export function addAnEventListener(
  target: Readonly<EventTarget>,
  listener: Readonly<DetailEventListener>,
  registry: EventListenerRegistry,
): void {
  const { type, signal, callback } = listener;

  // 1. If eventTarget is a ServiceWorkerGlobalScope object, its service worker’s script resource’s has ever been evaluated flag is set, and listener’s type matches the type attribute value of any of the service worker events, then report a warning to the console that this might not give the expected results. [SERVICE-WORKERS]

  // 2. If listener’s signal is not null and is aborted, then return.
  if (!isNull(signal) && signal.aborted) return;

  // 3. If listener’s callback is null, then return.
  if (isNull(callback)) return;

  // 4. If listener’s passive is null, then set it to the default passive value given listener’s type and eventTarget.
  const passive = listener.passive ?? defaultPassiveValue(type, target);
  const listenerMap = insert(registry, target, () => new Map());
  const finalListener = { ...listener, passive };
  const key = toKey(finalListener);

  // 5. If eventTarget’s event listener list does not contain an event listener whose type is listener’s type, callback is listener’s callback, and capture is listener’s capture, then append listener to eventTarget’s event listener list.
  if (!listenerMap.has(key)) {
    listenerMap.set(key, finalListener);
  }

  // 6. If listener’s signal is not null, then add the following abort steps to it:
  if (!isNull(signal)) {
    // 1. Remove an event listener with eventTarget and listener.
    signal.addEventListener("abort", handleAbort, { once: true });
  }

  function handleAbort(): void {
    listenerMap.delete(key);
  }
}

/** Remove {@linkcode listener} from {@linkcode registry}.
 * @see https://dom.spec.whatwg.org/#remove-an-event-listener
 */
export function removeAnEventListener(
  target: Readonly<EventTarget>,
  listener: Readonly<ComparableEventListenerLike>,
  registry: EventListenerRegistry,
): void {
  // 1. If eventTarget is a ServiceWorkerGlobalScope object and its service worker’s set of event types to handle contains listener’s type, then report a warning to the console that this might not give the expected results. [SERVICE-WORKERS]

  const eventListenerList = registry.get(target);

  if (eventListenerList) {
    // 2. Set listener’s removed to true and remove listener from eventTarget’s event listener list.
    eventListenerList.delete(toKey(listener));
  }
}

export function getEventListenersWithContext(context: {
  target: EventTarget;
  registry: EventListenerRegistry;
}): EventListeners {
  const eventListeners = context.registry.get(context.target);

  if (!eventListeners) return {};

  const listeners = [...eventListeners.values()]
    .filter(({ signal }) => !signal?.aborted)
    .map(_listener2Listener);

  return groupBy(listeners, ({ type }) => type) as EventListeners;
}

export function createAddEventListener(
  context: {
    addEventListener: AddEventListener;
    registry: EventListenerRegistry;
  },
): AddEventListener {
  return new Proxy(context.addEventListener, {
    apply: (
      target,
      thisArg: EventTarget | undefined,
      argArray: Parameters<EventTarget["addEventListener"]>,
    ) =>
      handleAddition(
        target,
        thisArg ?? globalThis,
        argArray,
        context.registry,
      ),
  });
}

export function createRemoveEventListener(
  context: {
    removeEventListener: RemoveEventListener;
    registry: EventListenerRegistry;
  },
): RemoveEventListener {
  return new Proxy(context.removeEventListener, {
    apply: (
      target,
      thisArg: EventTarget | undefined,
      argArray: Parameters<RemoveEventListener>,
    ) =>
      handleRemoval(
        target,
        thisArg ?? globalThis,
        argArray,
        context.registry,
      ),
  });
}

export function createGetEventListener(
  registry: EventListenerRegistry,
): GetEventListeners {
  /** Get {@linkcode EventListeners}.
   * Before this can be done, {@linkcode setup} must be performed.
   */
  function getEventListeners(target: EventTarget): EventListeners {
    return getEventListenersWithContext({ target, registry });
  }

  return getEventListeners;
}

function handleAddition<R>(
  target: (this: EventTarget, ...args: Parameters<AddEventListener>) => R,
  thisArg: EventTarget,
  argArray: Parameters<AddEventListener>,
  registry: EventListenerRegistry,
): R {
  const [type, callback, options] = argArray;

  if (!callback) return target.apply(thisArg, argArray);

  const { once, ...rest } = flatOptionsMore(options);
  const overrodeCallback = once
    ? new Proxy(toHandler(callback), { apply: handleApply })
    : undefined;
  const listener: DetailEventListener = {
    type,
    callback,
    once,
    ...rest,
    overrodeCallback,
  };

  addAnEventListener(thisArg, listener, registry);

  return target.apply(thisArg, [
    type,
    listener.overrodeCallback ?? listener.callback,
    options,
  ]);

  function handleApply(
    target: globalThis.EventListener,
    thisArg: EventTarget,
    argArray: [Event],
  ): void | Promise<void> {
    removeAnEventListener(thisArg, listener, registry);

    return target.apply(thisArg, argArray);
  }
}

function handleRemoval(
  target: (this: EventTarget, ...args: Parameters<RemoveEventListener>) => void,
  thisArg: EventTarget,
  argArray: Parameters<RemoveEventListener>,
  registry: EventListenerRegistry,
): void {
  const [type, callback, options] = argArray;

  if (!callback || !registry.has(thisArg)) {
    return target.apply(thisArg, argArray);
  }

  const capture = flatOptions(options);
  const listenerMap = registry.get(thisArg)!;
  const key = toKey({ callback, type, capture });

  if (!listenerMap.has(key)) return target.apply(thisArg, argArray);

  const eventListener = listenerMap.get(key)!;

  listenerMap.delete(key);

  const listener = eventListener.overrodeCallback ?? eventListener.callback;

  return target.apply(thisArg, [type, listener, options]);
}

function _listener2Listener(listener: EventListenerLike): EventListener {
  const { type, capture: useCapture, passive, once } = listener;

  return {
    type,
    listener: listener.callback,
    useCapture,
    once,
    passive: passive ?? false,
  };
}

/** Setup event listener monitoring.
 * Performs a side effect and changes the prototype of `EventTarget`.
 */
export function updateEventListener(): GetEventListeners {
  const registry = new WeakMap();
  const context = createContext(registry);

  EventTarget.prototype.addEventListener = context.addEventListener;
  EventTarget.prototype.removeEventListener = context.removeEventListener;

  return context.getEventListeners;
}

export interface EventListenerContext {
  addEventListener: AddEventListener;
  removeEventListener: RemoveEventListener;
  getEventListeners: GetEventListeners;
}

export interface GetEventListeners {
  (target: EventTarget): EventListeners;
}

export type ContextOptions = Partial<
  Pick<EventListenerContext, "addEventListener" | "removeEventListener">
>;

export function createContext(
  registry: EventListenerRegistry,
  options?: ContextOptions,
): EventListenerContext {
  const add = options?.addEventListener ??
    EventTarget.prototype.addEventListener;
  const remove = options?.removeEventListener ??
    EventTarget.prototype.removeEventListener;
  const addEventListener = createAddEventListener({
    addEventListener: add,
    registry,
  });
  const removeEventListener = createRemoveEventListener(
    { removeEventListener: remove, registry },
  );
  const getEventListeners = createGetEventListener(registry);

  return { addEventListener, removeEventListener, getEventListeners };
}
