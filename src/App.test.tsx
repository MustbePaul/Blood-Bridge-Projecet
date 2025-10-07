import React from 'react';

import { render } from '@testing-library/react';

// Mock react-router-dom to avoid importing the real ESM module in Jest (CRA uses Jest 27)
jest.mock('react-router-dom', () => {
  return {
    BrowserRouter: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
    Routes: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
    Route: () => null,
    Navigate: () => null,
  };
}, { virtual: true });

import App from './App';

test('renders App without crashing', () => {
  render(<App />);
});
