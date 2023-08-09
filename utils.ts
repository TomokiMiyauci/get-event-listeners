// Copyright © 2023 Tomoki Miyauchi. All rights reserved. MIT license.
// This module is browser compatible.

import { _EventListener } from "./types.ts";
import { isBoolean } from "./deps.ts";

/** To flatten {@linkcode options}.
 * @see https://dom.spec.whatwg.org/#concept-flatten-options
 */
export function flatOptions(options?: boolean | EventListenerOptions): boolean {
  if (isBoolean(options)) return options;

  return Boolean(options?.capture);
}

/** To flatten {@linkcode options} more.
 * @see https://dom.spec.whatwg.org/#event-flatten-more
 */
export function flatOptionsMore(
  options?: boolean | AddEventListenerOptions,
): Pick<_EventListener, "capture" | "once" | "passive" | "signal"> {
  const capture = flatOptions(options);
  const { once = false, passive = null, signal = null } =
    typeof options === "object" ? options : {};

  return { capture, once, passive, signal };
}

/** Return default passive value.
 * @see https://dom.spec.whatwg.org/#default-passive-value
 */
export function defaultPassiveValue(
  type: string,
  target: EventTarget,
): boolean {
  return touchOrUiEvents.has(type) &&
    (isWindow(target) ||
      isNode(target) &&
        (target.ownerDocument === target ||
          "documentElement" in target.ownerDocument &&
            target.ownerDocument.documentElement === target ||
          "body" in target.ownerDocument &&
            target.ownerDocument.body === target));
}

const touchOrUiEvents = /*@__PURE__*/ new Set<string>([
  "touchstart",
  "touchmove",
  "wheel",
  "mousewheel",
]);

interface NodeLike {
  readonly ownerDocument: object;
}

function isNode(input: object): input is NodeLike {
  return "ownerDocument" in input && !!input.ownerDocument &&
    typeof input.ownerDocument === "object";
}

/** Whether the {@linkcode input} is {@linkcode Window} or not.
 * This works universally.
 */
export function isWindow(input: unknown): input is Window {
  return globalThis.Window && input instanceof globalThis.Window;
}
