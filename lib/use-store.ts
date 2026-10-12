"use client";

import { useSyncExternalStore } from "react";
import { getServerState, getState, selectActiveCar, subscribe } from "./storage";

export function useStore() {
  return useSyncExternalStore(subscribe, getState, getServerState);
}

export function useActiveCar() {
  return selectActiveCar(useStore());
}
