// Test setup file
import { readFileSync } from 'fs';
import { join } from 'path';

// Load test fixtures
export const loadFixture = (filename: string) => {
  const filePath = join(__dirname, 'fixtures', filename);
  return JSON.parse(readFileSync(filePath, 'utf8'));
};

// Mock Stacks API responses
export const mockStacksApi = {
  getAccountInfo: jest.fn(),
  getContractInfo: jest.fn(),
  callReadOnlyFunction: jest.fn(),
  broadcastTransaction: jest.fn()
};

// Test utilities
export const createMockUser = (address: string) => ({
  address,
  badges: [],
  communities: []
});

export const createMockBadge = (id: number, templateId: number) => ({
  id,
  templateId,
  owner: 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM',
  metadata: {
    level: 1,
    category: 1,
    timestamp: Date.now(),
    active: true
  }
});