import { screen } from '@testing-library/react'
import { renderWithProviders } from '@/test/test-utils'
import AuthPage from './AuthPage'

test('renders login page', () => {
  renderWithProviders(<AuthPage />)

  expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument()
})