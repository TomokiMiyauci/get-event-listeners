// Copyright © 2023 Tomoki Miyauchi. All rights reserved. MIT license.
// This module is browser compatible.

export interface EventListener {
  type: string;
  listener: EventListenerOrEventListenerObject;
  useCapture: boolean;
  passive: boolean;
  once: boolean;
}

export interface ComparableEventListenerLike {
  type: string;
  callback: EventListenerOrEventListenerObject;

  /**
   * @default false
   */
  capture: boolean;
}

export interface EventListenerLike extends ComparableEventListenerLike {
  /**
   * @default null
   */
  passive: boolean | null;

  /**
   * @default false
   */
  once: boolean;

  /**
   * @default null
   */
  signal: AbortSignal | null;
}

export interface EventListeners {
  [k: string]: EventListener[];
}

export interface DetailEventListener extends EventListenerLike {
  /** The overrode callback.
   * If it exists, use it as an event listener instead of {@linkcode EventListenerLike.callback}.
   */
  overrodeCallback?: globalThis.EventListener;
}

export type EventListenerRegistry = WeakMap<object, EventListenerMap>;

export type EventListenerMap = Map<object, DetailEventListener>;
