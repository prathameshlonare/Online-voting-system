import { render, screen } from '@testing-library/react';
import LiveStatusIndicator from './components/LiveStatusIndicator';

describe('LiveStatusIndicator', () => {
  test('renders "Live Now" for RUNNING status', () => {
    render(<LiveStatusIndicator status="RUNNING" />);
    expect(screen.getByText('Live Now')).toBeInTheDocument();
  });

  test('renders "Ended" for STOPPED status', () => {
    render(<LiveStatusIndicator status="STOPPED" />);
    expect(screen.getByText('Ended')).toBeInTheDocument();
  });

  test('renders "Results Out" for RESULTS_DECLARED status', () => {
    render(<LiveStatusIndicator status="RESULTS_DECLARED" />);
    expect(screen.getByText('Results Out')).toBeInTheDocument();
  });

  test('renders "Not Started" for NOT_STARTED status', () => {
    render(<LiveStatusIndicator status="NOT_STARTED" />);
    expect(screen.getByText('Not Started')).toBeInTheDocument();
  });

  test('renders "Not Started" for unknown status', () => {
    render(<LiveStatusIndicator status="UNKNOWN" />);
    expect(screen.getByText('Not Started')).toBeInTheDocument();
  });
});
