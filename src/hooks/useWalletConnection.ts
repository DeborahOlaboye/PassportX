import { useState, useEffect } from 'react';

export const useWalletConnection = () => {
  const [isConnected, setIsConnected] = useState(false);