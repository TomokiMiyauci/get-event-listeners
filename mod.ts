// Copyright © 2023 Tomoki Miyauchi. All rights reserved. MIT license.
// This module is browser compatible.

export {
  createAddEventListenerProxy,
  createRemoveEventListenerProxy,
  type GetEventListeners,
  getEventListeners,
  setup,
} from "./setup.ts";
export type { EventListener, EventListeners } from "./types.ts";
