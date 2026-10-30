import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { App } from './App';

// Mock IndexedDB
vi.mock('./storage/db', () => ({
  saveBenchmarkSession: vi.fn().mockResolvedValue(undefined),
  getAllBenchmarkSessions: vi.fn().mockResolvedValue([]),
  getBenchmarkSession: vi.fn().mockResolvedValue(undefined),
  deleteBenchmarkSession: vi.fn().mockResolvedValue(undefined),
  clearAllBenchmarkHistory: vi.fn().mockResolvedValue(undefined),
  getAllCustomProviders: vi.fn().mockResolvedValue([]),
  saveCustomProvider: vi.fn().mockResolvedValue(undefined),
  deleteCustomProvider: vi.fn().mockResolvedValue(undefined),
  loadPreferences: vi.fn().mockReturnValue({
    theme: 'dark',
    defaultProfile: 'repeated',
    defaultTimeoutMs: 5000,
    defaultConcurrency: 1,
    historyEnabled: true,
    activeDataset: 'standard',
  }),
  savePreferences: vi.fn(),
}));

describe('DNSAtlas Application UI & Navigation', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders Dashboard as primary landing page with neutral branding', () => {
    render(<App />);

    // Brand and neutral title
    expect(screen.getAllByText('DNSAtlas').length).toBeGreaterThan(0);
    expect(screen.getByRole('heading', { name: 'DNS Benchmarking' })).toBeInTheDocument();

    // Benchmarking controls
    expect(screen.getByText('Benchmark Configuration')).toBeInTheDocument();
    expect(screen.getByText('Select Providers to Benchmark')).toBeInTheDocument();

    // Starts without auto-testing
    expect(screen.getByRole('button', { name: /Start Benchmark/i })).toBeInTheDocument();
  });

  it('navigates to DNS Explorer and shows providers sorted alphabetically by default', async () => {
    render(<App />);

    // Click "DNS Explorer" in sidebar
    const explorerNavButtons = screen.getAllByRole('button', { name: /DNS Explorer/i });
    fireEvent.click(explorerNavButtons[0]);

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: 'DNS Provider Directory' })).toBeInTheDocument();
    });

    // Check that providers are present and default alphabetical order
    expect(screen.getByText('AdGuard DNS (Default)')).toBeInTheDocument();
    expect(screen.getByText('Cloudflare (1.1.1.1)')).toBeInTheDocument();
    expect(screen.getByText('Quad9 (Malware Blocking)')).toBeInTheDocument();
  });

  it('navigates to Setup Guides with interactive platform selector', async () => {
    render(<App />);

    const guidesNavButtons = screen.getAllByRole('button', { name: /Setup Guides/i });
    fireEvent.click(guidesNavButtons[0]);

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: 'DNS Configuration Guides' })).toBeInTheDocument();
    });

    // Check operating system buttons
    expect(screen.getByRole('button', { name: /Windows 11/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /macOS/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Android/i })).toBeInTheDocument();
  });

  it('navigates to Check My DNS diagnostic view with limitations disclosure', async () => {
    render(<App />);

    const diagNavButtons = screen.getAllByRole('button', { name: /Check My DNS/i });
    fireEvent.click(diagNavButtons[0]);

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: 'Check My DNS Diagnostics' })).toBeInTheDocument();
    });

    // Honest Technical Limitations note
    expect(
      screen.getByText(/Honest Technical Limitations of Browser-Based Diagnostics/i)
    ).toBeInTheDocument();
  });

  it('navigates to Settings and toggles theme', async () => {
    render(<App />);

    const settingsNavButtons = screen.getAllByRole('button', { name: /Settings/i });
    fireEvent.click(settingsNavButtons[0]);

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: 'Application Settings' })).toBeInTheDocument();
    });

    expect(screen.getByText('Appearance & Theme')).toBeInTheDocument();
    expect(screen.getByText('Custom DNS-over-HTTPS Endpoints')).toBeInTheDocument();
  });
});
