import { render } from '@testing-library/react';
import App from './App';

describe('App', () => {
  test('app module loads without errors', () => {
    expect(App).toBeDefined();
    expect(typeof App).toBe('function');
  });
});
