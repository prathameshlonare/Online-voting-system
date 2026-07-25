import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import WelcomePage from './components/WelcomePage';

const renderWithRouter = (ui) => render(<MemoryRouter>{ui}</MemoryRouter>);

describe('WelcomePage', () => {
  test('renders the main heading with RCERT branding', () => {
    renderWithRouter(<WelcomePage />);
    expect(screen.getByText(/Your Voice/i)).toBeInTheDocument();
  });

  test('renders the election badge', () => {
    renderWithRouter(<WelcomePage />);
    expect(screen.getByText(/RCERT Elections 2026/i)).toBeInTheDocument();
  });

  test('renders the subtitle description', () => {
    renderWithRouter(<WelcomePage />);
    expect(screen.getByText(/Cast your ballot securely/i)).toBeInTheDocument();
  });

  test('renders the CTA button', () => {
    renderWithRouter(<WelcomePage />);
    expect(screen.getByRole('button', { name: /Cast Your Vote/i })).toBeInTheDocument();
  });

  test('renders all three feature cards', () => {
    renderWithRouter(<WelcomePage />);
    expect(screen.getByText('Secure')).toBeInTheDocument();
    expect(screen.getByText('Instant')).toBeInTheDocument();
    expect(screen.getByText('Transparent')).toBeInTheDocument();
  });

  test('renders the developer credit footer', () => {
    renderWithRouter(<WelcomePage />);
    expect(screen.getByText(/Prathamesh Lonare/i)).toBeInTheDocument();
  });
});
