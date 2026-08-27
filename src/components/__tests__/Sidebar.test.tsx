import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { Sidebar } from '../Sidebar';
import { useAuth } from '../../../src/hooks/useAuth';
import { useSystemSettings } from '../../../src/hooks/useSystemSettings';
import { describe, beforeEach, it, expect, vi } from 'vitest';

// Mock hooks
vi.mock('../../../src/hooks/useAuth', () => ({
  useAuth: vi.fn(),
}));

vi.mock('../../../src/hooks/useSystemSettings', () => ({
  useSystemSettings: vi.fn(),
}));

describe('Sidebar Component', () => {
  const defaultProps = {
    mobileOpen: false,
    setMobileOpen: vi.fn(),
    collapsed: false,
    setCollapsed: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render standard dashboard links for employees', () => {
    (useAuth as any).mockReturnValue({
      user: { fullName: 'Jane Dev', email: 'jane@thinkcove.com', role: 'EMPLOYEE' },
      logout: vi.fn(),
    });
    (useSystemSettings as any).mockReturnValue({
      isFeatureEnabled: vi.fn().mockReturnValue(true),
    });

    render(
      <MemoryRouter>
        <Sidebar {...defaultProps} />
      </MemoryRouter>
    );

    expect(screen.getAllByText('Dashboard')[0]).toBeInTheDocument();
    expect(screen.getAllByText('Messages')[0]).toBeInTheDocument();
    expect(screen.getAllByText('Tasks')[0]).toBeInTheDocument();
    expect(screen.getAllByText('Reports')[0]).toBeInTheDocument();
    // Employees should not see administrative links
    expect(screen.queryAllByText('Employees')).toHaveLength(0);
  });

  it('should render administrative links for managers and admins', () => {
    (useAuth as any).mockReturnValue({
      user: { fullName: 'Manager User', email: 'manager@thinkcove.com', role: 'MANAGER' },
      logout: vi.fn(),
    });
    (useSystemSettings as any).mockReturnValue({
      isFeatureEnabled: vi.fn().mockReturnValue(true),
    });

    render(
      <MemoryRouter>
        <Sidebar {...defaultProps} />
      </MemoryRouter>
    );

    expect(screen.getAllByText('Employees')[0]).toBeInTheDocument();
    expect(screen.getAllByText('Projects')[0]).toBeInTheDocument();
  });

  it('should hide Messages tab if FEATURE_CHAT is disabled', () => {
    (useAuth as any).mockReturnValue({
      user: { fullName: 'Jane Dev', email: 'jane@thinkcove.com', role: 'EMPLOYEE' },
      logout: vi.fn(),
    });
    (useSystemSettings as any).mockReturnValue({
      isFeatureEnabled: vi.fn((flag) => flag !== 'FEATURE_CHAT'),
    });

    render(
      <MemoryRouter>
        <Sidebar {...defaultProps} />
      </MemoryRouter>
    );

    expect(screen.getAllByText('Dashboard')[0]).toBeInTheDocument();
    expect(screen.queryAllByText('Messages')).toHaveLength(0);
    expect(screen.getAllByText('Tasks')[0]).toBeInTheDocument();
  });
});
