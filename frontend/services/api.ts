/**
 * API service switch: toggle between mock (offline/phone) and real (backend) data.
 *
 * Set EXPO_PUBLIC_USE_MOCK=true in .env or toggle at runtime via setUseMock().
 */
import type { ApiService } from './types';
import { mockApi } from './mock-api';
import { realApi } from './real-api';

let useMock = process.env.EXPO_PUBLIC_USE_MOCK === 'true';

export function getApi(): ApiService {
  return useMock ? mockApi : realApi;
}

export function isUsingMock(): boolean {
  return useMock;
}

export function setUseMock(value: boolean): void {
  useMock = value;
}

export * from './types';
