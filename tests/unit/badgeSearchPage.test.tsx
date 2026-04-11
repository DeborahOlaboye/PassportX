import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import BadgeSearchPage from '../../src/app/badges/search/page';

const mockFetch = vi.fn();

global.fetch = mockFetch as any;

beforeEach(() => {
  mockFetch.mockImplementation(async (input: RequestInfo) => {
    const url = String(input);

    if (url.includes('/api/badges/filters')) {
      return {
        ok: true,
        json: async () => ({
          success: true,
          data: {
            levels: [1, 2, 3],
            categories: ['skill', 'achievement'],
            communities: [],
          },
        }),
      };
    }

    if (url.includes('/api/badges/search')) {
      return {
        ok: true,
        json: async () => ({
          success: true,
          data: {
            badges: [],
            total: 0,
            page: 1,
            limit: 20,
            totalPages: 0,
            hasMore: false,
          },
        }),
      };
    }

    return {
      ok: true,
      json: async () => ({ success: true, data: [] }),
    };
  });

  window.scrollTo = vi.fn();
});

afterEach(() => {
  mockFetch.mockReset();
});

describe('BadgeSearchPage', () => {
  it('shows the clear filters button when a search query is entered and clears filters when clicked', async () => {
    render(<BadgeSearchPage />);

    const searchInput = await screen.findByPlaceholderText(/search badges/i);
    fireEvent.change(searchInput, { target: { value: 'Passport' } });
    fireEvent.keyDown(searchInput, { key: 'Enter', code: 'Enter' });

    await waitFor(() => {
      expect(screen.getByText(/clear all filters/i)).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText(/clear all filters/i));

    await waitFor(() => {
      expect(screen.queryByText(/clear all filters/i)).not.toBeInTheDocument();
    });
  });
});
