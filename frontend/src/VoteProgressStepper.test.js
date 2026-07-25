import { render, screen } from '@testing-library/react';
import VoteProgressStepper from './components/VoteProgressStepper';

describe('VoteProgressStepper', () => {
  test('renders all four step labels', () => {
    render(<VoteProgressStepper currentStep={0} />);
    expect(screen.getByText(/select/i)).toBeInTheDocument();
    expect(screen.getByText(/review/i)).toBeInTheDocument();
    expect(screen.getByText(/confirm/i)).toBeInTheDocument();
    expect(screen.getByText(/done/i)).toBeInTheDocument();
  });

  test('renders step icons for each stage', () => {
    render(<VoteProgressStepper currentStep={0} />);
    const icons = document.querySelectorAll('svg');
    expect(icons.length).toBeGreaterThanOrEqual(4);
  });

  test('renders without crashing at different steps', () => {
    const { rerender } = render(<VoteProgressStepper currentStep={0} />);
    expect(screen.getByText(/select/i)).toBeInTheDocument();

    rerender(<VoteProgressStepper currentStep={1} />);
    expect(screen.getByText(/review/i)).toBeInTheDocument();

    rerender(<VoteProgressStepper currentStep={2} />);
    expect(screen.getByText(/confirm/i)).toBeInTheDocument();

    rerender(<VoteProgressStepper currentStep={3} />);
    expect(screen.getByText(/done/i)).toBeInTheDocument();
  });
});
