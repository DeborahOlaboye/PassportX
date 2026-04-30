import React from 'react';
import ReactDOMServer from 'react-dom/server';
import { useWalletConnection, formatAddress } from '@/hooks/useWalletConnection';
import { useWalletConnect } from '@/contexts/WalletConnectContext';

jest.mock('@/contexts/WalletConnectContext', () => ({
  useWalletConnect: jest.fn(),
}));

const mockUseWalletConnect = useWalletConnect as jest.MockedFunction<
  typeof useWalletConnect
>;

describe('useWalletConnection', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('wraps WalletConnect context state and returns formatted address', async () => {
    const connectWallet = jest.fn().mockResolvedValue(undefined);
    const disconnectWallet = jest.fn().mockResolvedValue(undefined);
    const clearError = jest.fn();

    mockUseWalletConnect.mockReturnValue({
      isConnected: true,
      isConnecting: false,
      connectedWallet: {
        address: 'ST1234567890ABCDEF',
        name: 'Test Wallet',
        chainId: 1,
        sessionTopic: 'topic-123',
      },
      error: null,
      connectWallet,
      disconnectWallet,
      clearError,
    });

    let result: any = null;

    function TestComponent() {
      result = useWalletConnection();
      return null;
    }

    ReactDOMServer.renderToString(<TestComponent />);

    expect(result).not.toBeNull();
    expect(result.isConnected).toBe(true);
    expect(result.address).toBe('ST1234567890ABCDEF');
    expect(result.formattedAddress).toBe('ST1234...CDEF');
    expect(result.error).toBeNull();
    expect(result.isLoading).toBe(false);

    await result.connect({
      address: 'STADDRESS',
      name: 'New Wallet',
      chainId: 1,
      sessionTopic: 'topic-456',
    });
    expect(connectWallet).toHaveBeenCalledWith({
      address: 'STADDRESS',
      name: 'New Wallet',
      chainId: 1,
      sessionTopic: 'topic-456',
    });

    await result.disconnect();
    expect(disconnectWallet).toHaveBeenCalled();
  });
});

describe('formatAddress', () => {
  it('returns the full string when the address is short', () => {
    expect(formatAddress('12345')).toBe('12345');
  });

  it('formats long addresses with a prefix and suffix', () => {
    expect(formatAddress('ST1234567890')).toBe('ST1234...7890');
  });
});
