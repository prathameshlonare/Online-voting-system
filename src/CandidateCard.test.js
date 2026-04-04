import { render, screen, fireEvent } from '@testing-library/react';
import CandidateCard from './components/CandidateCard';

const mockCandidate = {
  candidate_id: 'pres_001',
  name: 'John Doe',
  party: 'Student Alliance',
  role: 'President',
};

describe('CandidateCard', () => {
  test('renders candidate name and party', () => {
    render(<CandidateCard candidate={mockCandidate} role="President" isSelected={false} onSelect={() => {}} />);
    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.getByText('Student Alliance')).toBeInTheDocument();
  });

  test('renders candidate initials', () => {
    render(<CandidateCard candidate={mockCandidate} role="President" isSelected={false} onSelect={() => {}} />);
    expect(screen.getByText('JD')).toBeInTheDocument();
  });

  test('does not show checkmark when not selected', () => {
    render(<CandidateCard candidate={mockCandidate} role="President" isSelected={false} onSelect={() => {}} />);
    expect(screen.queryByRole('img', { hidden: true })).not.toBeInTheDocument();
  });

  test('calls onSelect when clicked', () => {
    const onSelect = jest.fn();
    render(<CandidateCard candidate={mockCandidate} role="President" isSelected={false} onSelect={onSelect} />);
    fireEvent.click(screen.getByText('John Doe'));
    expect(onSelect).toHaveBeenCalledTimes(1);
  });

  test('handles single-letter name initials', () => {
    const singleName = { ...mockCandidate, name: 'Aria' };
    render(<CandidateCard candidate={singleName} role="President" isSelected={false} onSelect={() => {}} />);
    expect(screen.getByText('A')).toBeInTheDocument();
  });

  test('handles missing name gracefully', () => {
    const noName = { ...mockCandidate, name: '' };
    render(<CandidateCard candidate={noName} role="President" isSelected={false} onSelect={() => {}} />);
    expect(screen.getByText('??')).toBeInTheDocument();
  });
});
