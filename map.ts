// Copyright © 2023 Tomoki Miyauchi. All rights reserved. MIT license.
// This module is browser compatible.

import type { Listener } from "./types.ts";
import { compositeKey } from "./deps.ts";

type EqualityDeps = "type" | "listener" | "useCapture";

type ComparableListener = Pick<Listener, EqualityDeps>;

/** Map for event listener. */
export class EventListenerMap {
  #eventMap: Map<object, Listener> = new Map();

  /** Realm for {@linkcode compositeKey}. */
  #realm = {};

  constructor(listeners: Iterable<Listener> = []) {
    for (const listener of listeners) this.set(listener);
  }

  /** Whether the {@linkcode listener} exist or not. */
  has(listener: ComparableListener): boolean {
    return this.#eventMap.has(toKey(this.#realm, listener));
  }

  /** Add {@linkcode listener}.
   * If it already exists, nothing is done.
   */
  set(listener: Listener): this {
    const key = toKey(this.#realm, listener);

    if (this.#eventMap.has(key)) return this;

    this.#eventMap.set(key, listener);

    return this;
  }

  /** Delete {@linkcode listener}.
   * If it is not present, nothing is done.
   */
  delete(listener: ComparableListener): boolean {
    const key = toKey(this.#realm, listener);

    return this.#eventMap.delete(key);
  }

  /** Yield all registered {@link Listener}. */
  *[Symbol.iterator](): Generator<Listener> {
    for (const listener of this.#eventMap.values()) yield listener;
  }
}

function toKey(realm: object, listener: ComparableListener): object {
  return compositeKey(
    realm,
    listener.type,
    listener.listener,
    listener.useCapture,
  );
}
