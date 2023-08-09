// Copyright © 2023 Tomoki Miyauchi. All rights reserved. MIT license.
// This module is browser compatible.

import { _EventListener } from "./types.ts";
import { isBoolean, isObject } from "./deps.ts";

/** To flatten {@linkcode options}.
 * @see https://dom.spec.whatwg.org/#concept-flatten-options
 */
export function flatOptions(options?: boolean | EventListenerOptions): boolean {
  if (isBoolean(options)) return options;

  return Boolean(options?.capture);
}

export type NormalizedOptions = Pick<
  _EventListener,
  keyof AddEventListenerOptions
>;

/** To flatten {@linkcode options} more.
 * @see https://dom.spec.whatwg.org/#event-flatten-more
 */
export function flatOptionsMore(
  options?: boolean | AddEventListenerOptions,
): NormalizedOptions {
  const capture = flatOptions(options);
  const { once = false, passive = null, signal = null } = isObject(options)
    ? options
    : {};

  return { capture, once, passive, signal };
}

/** Return default passive value.
 * @see https://dom.spec.whatwg.org/#default-passive-value
 */
export function defaultPassiveValue(
  type: string,
  target: EventTarget,
): boolean {
  if (!touchOrUiEvents.has(type)) return false;
  if (isWindow(target)) return true;
  if (!isNodeLike(target)) return false;

  // target is Document
  if (!target.ownerDocument) {
    return target === Reflect.get(globalThis, "document");
  }

  return ("documentElement" in target.ownerDocument &&
      target.ownerDocument.documentElement === target || // target is HTML document
    "body" in target.ownerDocument &&
      target.ownerDocument.body === target); // target is body
}

const touchOrUiEvents = /*@__PURE__*/ new Set<string>([
  "touchstart",
  "touchmove",
  "wheel",
  "mousewheel",
]);

interface NodeLike {
  readonly ownerDocument: object | null;
}

/** Whether the {@linkcode input} is {@linkcode NodeLike} or not. */
export function isNodeLike(input: object): input is NodeLike {
  return "ownerDocument" in input && typeof input.ownerDocument === "object";
}

/** Whether the {@linkcode input} is {@linkcode Window} or not.
 * This works universally.
 */
export function isWindow(input: unknown): input is Window {
  return globalThis.Window && input instanceof globalThis.Window;
}
