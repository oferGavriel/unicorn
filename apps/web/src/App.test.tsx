import { render, screen } from '@testing-library/react';
import App from './AppRouter';

test('renders happy button', () => {
  render(<App />);
  expect(screen.getByRole('button', { name: /frontend/i })).toBeInTheDocument();
});
