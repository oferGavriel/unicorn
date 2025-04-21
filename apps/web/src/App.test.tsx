import { render, screen } from '@testing-library/react';
import App from './App';

test('renders happy button', () => {
  render(<App />);
  expect(screen.getByRole('button', { name: /frontend/i })).toBeInTheDocument();
});
