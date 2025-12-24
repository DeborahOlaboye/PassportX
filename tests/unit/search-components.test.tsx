import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import SearchBar from '../../src/components/search/SearchBar'
import FilterPanel from '../../src/components/search/FilterPanel'
import SortDropdown from '../../src/components/search/SortDropdown'
import Pagination from '../../src/components/search/Pagination'

// Mock fetch
global.fetch = vi.fn()

describe('SearchBar Component', () => {
  it('renders search input', () => {
    const mockOnSearch = vi.fn()
    render(<SearchBar onSearch={mockOnSearch} />)

    const searchInput = screen.getByPlaceholderText(/search badges/i)
    expect(searchInput).toBeInTheDocument()
  })

  it('calls onSearch when Enter is pressed', () => {
    const mockOnSearch = vi.fn()
    render(<SearchBar onSearch={mockOnSearch} />)

    const searchInput = screen.getByPlaceholderText(/search badges/i)
    fireEvent.change(searchInput, { target: { value: 'JavaScript' } })
    fireEvent.keyDown(searchInput, { key: 'Enter', code: 'Enter' })

    expect(mockOnSearch).toHaveBeenCalledWith('JavaScript')
  })

  it('shows clear button when query has text', () => {
    const mockOnSearch = vi.fn()
    render(<SearchBar onSearch={mockOnSearch} />)

    const searchInput = screen.getByPlaceholderText(/search badges/i)
    fireEvent.change(searchInput, { target: { value: 'test' } })

    const clearButton = screen.getByLabelText(/clear search/i)
    expect(clearButton).toBeInTheDocument()
  })

  it('clears search when clear button is clicked', () => {
    const mockOnSearch = vi.fn()
    render(<SearchBar onSearch={mockOnSearch} />)

    const searchInput = screen.getByPlaceholderText(/search badges/i) as HTMLInputElement
    fireEvent.change(searchInput, { target: { value: 'test' } })

    const clearButton = screen.getByLabelText(/clear search/i)
    fireEvent.click(clearButton)

    expect(searchInput.value).toBe('')
    expect(mockOnSearch).toHaveBeenCalledWith('')
  })

  it('fetches suggestions after typing', async () => {
    const mockSuggestions = [
      { id: '1', name: 'JavaScript Expert', description: 'Master JS', category: 'skill' }
    ]

    ;(global.fetch as any).mockResolvedValueOnce({
      json: async () => ({ success: true, data: mockSuggestions })
    })

    const mockOnSearch = vi.fn()
    render(<SearchBar onSearch={mockOnSearch} showSuggestions={true} />)

    const searchInput = screen.getByPlaceholderText(/search badges/i)
    fireEvent.change(searchInput, { target: { value: 'Java' } })

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/badges/suggestions?q=Java')
      )
    })
  })
})

describe('FilterPanel Component', () => {
  beforeEach(() => {
    ;(global.fetch as any).mockResolvedValueOnce({
      json: async () => ({
        success: true,
        data: {
          levels: [1, 2, 3, 4, 5],
          categories: ['skill', 'learning', 'leadership'],
          communities: []
        }
      })
    })
  })

  it('renders filter button', () => {
    const mockOnFilterChange = vi.fn()
    render(<FilterPanel onFilterChange={mockOnFilterChange} />)

    const filterButton = screen.getByText(/filters/i)
    expect(filterButton).toBeInTheDocument()
  })

  it('opens filter panel when button is clicked', () => {
    const mockOnFilterChange = vi.fn()
    render(<FilterPanel onFilterChange={mockOnFilterChange} />)

    const filterButton = screen.getByText(/filters/i)
    fireEvent.click(filterButton)

    const levelSection = screen.getByText('Level')
    expect(levelSection).toBeInTheDocument()
  })

  it('displays active filter count', async () => {
    const mockOnFilterChange = vi.fn()
    render(<FilterPanel onFilterChange={mockOnFilterChange} />)

    const filterButton = screen.getByText(/filters/i)
    fireEvent.click(filterButton)

    // Wait for filters to load
    await waitFor(() => {
      const checkbox = screen.getByLabelText(/beginner/i)
      fireEvent.click(checkbox)
    })

    await waitFor(() => {
      const badge = screen.getByText('1')
      expect(badge).toBeInTheDocument()
    })
  })

  it('calls onFilterChange when level is selected', async () => {
    const mockOnFilterChange = vi.fn()
    render(<FilterPanel onFilterChange={mockOnFilterChange} />)

    const filterButton = screen.getByText(/filters/i)
    fireEvent.click(filterButton)

    await waitFor(() => {
      const checkbox = screen.getByLabelText(/beginner/i)
      fireEvent.click(checkbox)
    })

    await waitFor(() => {
      expect(mockOnFilterChange).toHaveBeenCalledWith(
        expect.objectContaining({
          levels: expect.arrayContaining([1])
        })
      )
    })
  })
})

describe('SortDropdown Component', () => {
  it('renders with selected option', () => {
    const mockOnChange = vi.fn()
    render(<SortDropdown value="newest" onChange={mockOnChange} />)

    const button = screen.getByText(/newest first/i)
    expect(button).toBeInTheDocument()
  })

  it('opens dropdown when clicked', () => {
    const mockOnChange = vi.fn()
    render(<SortDropdown value="newest" onChange={mockOnChange} />)

    const button = screen.getByText(/newest first/i)
    fireEvent.click(button)

    const oldestOption = screen.getByText(/oldest first/i)
    expect(oldestOption).toBeInTheDocument()
  })

  it('calls onChange when option is selected', () => {
    const mockOnChange = vi.fn()
    render(<SortDropdown value="newest" onChange={mockOnChange} />)

    const button = screen.getByText(/newest first/i)
    fireEvent.click(button)

    const oldestOption = screen.getByText(/oldest first/i)
    fireEvent.click(oldestOption)

    expect(mockOnChange).toHaveBeenCalledWith('oldest')
  })

  it('closes dropdown after selection', () => {
    const mockOnChange = vi.fn()
    render(<SortDropdown value="newest" onChange={mockOnChange} />)

    const button = screen.getByText(/newest first/i)
    fireEvent.click(button)

    const oldestOption = screen.getByText(/oldest first/i)
    fireEvent.click(oldestOption)

    // Dropdown should be closed, so "Level: High to Low" shouldn't be visible
    const levelOption = screen.queryByText(/level: high to low/i)
    expect(levelOption).not.toBeInTheDocument()
  })
})

describe('Pagination Component', () => {
  it('does not render when totalPages is 1', () => {
    const mockOnPageChange = vi.fn()
    const { container } = render(
      <Pagination currentPage={1} totalPages={1} onPageChange={mockOnPageChange} />
    )

    expect(container.firstChild).toBeNull()
  })

  it('renders page numbers', () => {
    const mockOnPageChange = vi.fn()
    render(<Pagination currentPage={1} totalPages={5} onPageChange={mockOnPageChange} />)

    expect(screen.getByText('1')).toBeInTheDocument()
    expect(screen.getByText('2')).toBeInTheDocument()
    expect(screen.getByText('5')).toBeInTheDocument()
  })

  it('disables previous button on first page', () => {
    const mockOnPageChange = vi.fn()
    render(<Pagination currentPage={1} totalPages={5} onPageChange={mockOnPageChange} />)

    const prevButton = screen.getByLabelText(/previous page/i)
    expect(prevButton).toBeDisabled()
  })

  it('disables next button on last page', () => {
    const mockOnPageChange = vi.fn()
    render(<Pagination currentPage={5} totalPages={5} onPageChange={mockOnPageChange} />)

    const nextButton = screen.getByLabelText(/next page/i)
    expect(nextButton).toBeDisabled()
  })

  it('calls onPageChange when page number is clicked', () => {
    const mockOnPageChange = vi.fn()
    render(<Pagination currentPage={1} totalPages={5} onPageChange={mockOnPageChange} />)

    const page3Button = screen.getByText('3')
    fireEvent.click(page3Button)

    expect(mockOnPageChange).toHaveBeenCalledWith(3)
  })

  it('calls onPageChange when next button is clicked', () => {
    const mockOnPageChange = vi.fn()
    render(<Pagination currentPage={2} totalPages={5} onPageChange={mockOnPageChange} />)

    const nextButton = screen.getByLabelText(/next page/i)
    fireEvent.click(nextButton)

    expect(mockOnPageChange).toHaveBeenCalledWith(3)
  })

  it('shows ellipsis for large page counts', () => {
    const mockOnPageChange = vi.fn()
    render(<Pagination currentPage={5} totalPages={20} onPageChange={mockOnPageChange} />)

    const ellipsis = screen.getAllByText('...')
    expect(ellipsis.length).toBeGreaterThan(0)
  })
})
