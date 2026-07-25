import { render, screen, act } from '@testing-library/react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import AdminDashboard from './components/AdminDashboard';

const mockTheme = createTheme();

const renderWithTheme = (ui) => render(<ThemeProvider theme={mockTheme}>{ui}</ThemeProvider>);

jest.mock('./mocks', () => {
  const mockAuth = {
    currentAuthenticatedUser: jest.fn().mockResolvedValue({
      username: 'admin',
      attributes: { preferred_username: 'Admin User' },
    }),
    signOut: jest.fn().mockResolvedValue(),
  };
  const mockAPI = {
    get: jest.fn().mockResolvedValue({ status: 'NOT_STARTED' }),
    post: jest.fn().mockResolvedValue({ message: 'Success' }),
  };
  return {
    Auth: mockAuth,
    API: mockAPI,
    Storage: { put: jest.fn().mockResolvedValue() },
    Hub: { listen: jest.fn().mockReturnValue(() => {}) },
  };
});

describe('AdminDashboard', () => {
  test('renders the dashboard container', async () => {
    await act(async () => {
      renderWithTheme(<AdminDashboard apiName="test-api" />);
    });
    expect(await screen.findByText(/Admin Dashboard/i, {}, { timeout: 5000 })).toBeInTheDocument();
  });

  test('renders the logout button', async () => {
    await act(async () => {
      renderWithTheme(<AdminDashboard apiName="test-api" />);
    });
    const btn = await screen.findByRole('button', { name: /Logout/i }, { timeout: 5000 });
    expect(btn).toBeInTheDocument();
  });

  test('renders the tabs', async () => {
    const { container } = renderWithTheme(<AdminDashboard apiName="test-api" />);
    await act(async () => {});
    expect(container.textContent).toMatch(/Add Candidate/i);
    expect(container.textContent).toMatch(/View Results/i);
    expect(container.textContent).toMatch(/Election Control/i);
  });
});
