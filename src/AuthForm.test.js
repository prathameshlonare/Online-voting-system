import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import AuthForm from './components/AuthForm';

const renderWithRouter = (ui) => render(<MemoryRouter>{ui}</MemoryRouter>);

describe('AuthForm', () => {
  test('renders the auth form container', () => {
    const { container } = renderWithRouter(<AuthForm />);
    expect(container.querySelector('form')).toBeInTheDocument();
  });

  test('renders email input field', () => {
    renderWithRouter(<AuthForm />);
    expect(screen.getByLabelText(/Email/i)).toBeInTheDocument();
  });

  test('renders password input field', () => {
    renderWithRouter(<AuthForm />);
    const passwordInputs = screen.getAllByDisplayValue('', { exact: false });
    const passwordInput = passwordInputs.find(input => input.type === 'password');
    expect(passwordInput).toBeInTheDocument();
  });

  test('renders the submit button', () => {
    renderWithRouter(<AuthForm />);
    const buttons = screen.getAllByRole('button', { hidden: true });
    expect(buttons.length).toBeGreaterThan(0);
  });

  test('renders the forgot password link', () => {
    const { container } = renderWithRouter(<AuthForm />);
    expect(container.textContent).toMatch(/Forgot Password/i);
  });

  test('renders the signup toggle', () => {
    const { container } = renderWithRouter(<AuthForm />);
    expect(container.textContent).toMatch(/Signup/i);
  });
});
