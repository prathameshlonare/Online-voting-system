import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import EnterOtp from './components/EnterOtp';

const renderWithRouter = (ui) => render(<MemoryRouter>{ui}</MemoryRouter>);

describe('EnterOtp', () => {
  test('renders the OTP verification heading', () => {
    renderWithRouter(<EnterOtp />);
    expect(screen.getByText(/Confirm Your Email/i)).toBeInTheDocument();
  });

  test('renders the verification code input', () => {
    renderWithRouter(<EnterOtp />);
    expect(screen.getByLabelText(/Verification Code/i)).toBeInTheDocument();
  });

  test('renders the verify button', () => {
    renderWithRouter(<EnterOtp />);
    expect(screen.getByRole('button', { name: /Verify Code/i })).toBeInTheDocument();
  });

  test('renders the back to login link', () => {
    renderWithRouter(<EnterOtp />);
    expect(screen.getByText(/Back to Login/i)).toBeInTheDocument();
  });
});
