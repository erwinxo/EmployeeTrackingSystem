import { renderHook, act, waitFor } from '@testing-library/react';
import React from 'react';
import { SystemSettingsProvider, useSystemSettings } from '../useSystemSettings';
import { useSocket } from '../useSocket';
import api from '../../services/api';
import { describe, beforeEach, it, expect, vi } from 'vitest';
import { EventEmitter } from 'events';

// Mock dependecies
vi.mock('../useSocket', () => ({
  useSocket: vi.fn(),
}));

vi.mock('../../services/api', () => ({
  default: {
    get: vi.fn(),
    put: vi.fn(),
  },
}));

vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    warning: vi.fn(),
    error: vi.fn(),
  },
}));

describe('useSystemSettings Hook', () => {
  let mockSocket: any;

  beforeEach(() => {
    vi.clearAllMocks();
    
    // Create a mock socket implementing listener registers
    const emitter = new EventEmitter();
    mockSocket = {
      on: vi.fn((event, cb) => emitter.on(event, cb)),
      off: vi.fn((event, cb) => emitter.off(event, cb)),
      emit: vi.fn((event, data) => emitter.emit(event, data)),
    };

    (useSocket as any).mockReturnValue({ socket: mockSocket });
    (api.get as any).mockResolvedValue({
      data: {
        success: true,
        data: {
          FEATURE_CHAT: true,
          FEATURE_REPORTS: false,
          FEATURE_TASKS: true,
        },
      },
    });
  });

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <SystemSettingsProvider>{children}</SystemSettingsProvider>
  );

  it('should fetch and initialize feature flags', async () => {
    const { result } = renderHook(() => useSystemSettings(), { wrapper });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.isFeatureEnabled('FEATURE_CHAT')).toBe(true);
    expect(result.current.isFeatureEnabled('FEATURE_REPORTS')).toBe(false);
    expect(result.current.isFeatureEnabled('FEATURE_TASKS')).toBe(true);
  });

  it('should reactively toggle features in real-time when receiving socket updates', async () => {
    const { result } = renderHook(() => useSystemSettings(), { wrapper });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    // Simulate WebSocket event update
    act(() => {
      mockSocket.emit('feature_flag_update', { key: 'FEATURE_CHAT', value: false });
    });

    expect(result.current.isFeatureEnabled('FEATURE_CHAT')).toBe(false);
  });
});
