import React from 'react';
import { render } from '@testing-library/react';
import { ErrorBoundary } from '../../src/components/ErrorBoundary';

const Bomb: React.FC = () => {
  throw new Error('boom');
};

describe('ErrorBoundary', () => {
  it('renders fallback when child throws', () => {
    const { getByText } = render(
      <ErrorBoundary fallback={<div>fallback</div>}>
        <Bomb />
      </ErrorBoundary>
    );
    expect(getByText('fallback')).toBeTruthy();
  });
});
