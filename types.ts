// Copyright © 2023 Tomoki Miyauchi. All rights reserved. MIT license.
// This module is browser compatible.

export interface EventListener extends NormalizedAddEventListenerOptions {
  type: string;
  listener: EventListenerOrEventListenerObject;
}

export interface NormalizedAddEventListenerOptions
  extends Required<Omit<AddEventListenerOptions, "signal" | "capture">> {
  useCapture: boolean;
}

export interface EventListeners {
  [k: string]: EventListener[];
}
