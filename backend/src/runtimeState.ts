export interface BackendRuntimeState {
  ready: boolean;
  startupError: string | null;
  lastCheckedAt: string;
  lastReadyAt: string | null;
}

const state: BackendRuntimeState = {
  ready: false,
  startupError: 'Service is starting.',
  lastCheckedAt: new Date().toISOString(),
  lastReadyAt: null,
};

export const getBackendRuntimeState = (): BackendRuntimeState => ({ ...state });

export const setBackendReady = (): void => {
  const now = new Date().toISOString();
  state.ready = true;
  state.startupError = null;
  state.lastCheckedAt = now;
  state.lastReadyAt = now;
};

export const setBackendDegraded = (message: string): void => {
  state.ready = false;
  state.startupError = message;
  state.lastCheckedAt = new Date().toISOString();
};
