import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import { RequestTimeline, StatusChart } from '../components/RequestInsights';

const history = vi.hoisted(() => vi.fn());
vi.mock('../services/api', () => ({
  requestApi: { history },
  errorMessage: () => 'History is unavailable.',
}));

describe('request insights', () => {
  it('uses all metric counts and links each status to the filtered list', () => {
    render(
      <MemoryRouter>
        <StatusChart
          metrics={{ total: 10, pending: 2, inProgress: 3, resolved: 4 }}
        />
      </MemoryRouter>,
    );
    expect(
      screen.getByRole('link', { name: 'Cancelled: 1 of 10 requests' }),
    ).toHaveAttribute('href', '/requests?status=CANCELLED');
    expect(
      screen.getByRole('link', { name: 'In Progress: 3 of 10 requests' }),
    ).toHaveTextContent('30%');
  });
  it('shows an empty chart without invented percentages', () => {
    render(
      <StatusChart
        metrics={{ total: 0, pending: 0, inProgress: 0, resolved: 0 }}
      />,
    );
    expect(
      screen.getByText(/Your status breakdown will appear here/),
    ).toBeVisible();
    expect(screen.queryByRole('link')).not.toBeInTheDocument();
  });
  it('explains the baseline for existing requests and loads older history', async () => {
    history.mockResolvedValueOnce({
      data: [
        {
          id: 2,
          type: 'TRACKING_STARTED',
          actor: null,
          toStatus: 'IN_PROGRESS',
          createdAt: '2026-10-22T06:00:00Z',
        },
      ],
      pagination: { totalPages: 2 },
    });
    history.mockResolvedValueOnce({
      data: [
        {
          id: 1,
          type: 'CREATED',
          actor: { id: 'member', name: 'Alex' },
          createdAt: '2026-10-21T06:00:00Z',
        },
      ],
      pagination: { totalPages: 2 },
    });
    render(<RequestTimeline id="request-id" />);
    expect(
      await screen.findByText(/Earlier changes were not recorded/),
    ).toBeVisible();
    await userEvent.click(screen.getByRole('button', { name: 'Older' }));
    expect(await screen.findByText('Request submitted')).toBeVisible();
    expect(history).toHaveBeenLastCalledWith('request-id', 2);
    expect(screen.getByText('Alex')).toBeVisible();
  });
  it('allows retry after a history loading failure', async () => {
    history.mockRejectedValueOnce(new Error('offline'));
    history.mockResolvedValueOnce({ data: [], pagination: { totalPages: 0 } });
    render(<RequestTimeline id="request-id" />);
    expect(await screen.findByRole('alert')).toHaveTextContent(
      'History is unavailable.',
    );
    await userEvent.click(screen.getByRole('button', { name: 'Try again' }));
    expect(await screen.findByText('No activity recorded.')).toBeVisible();
  });
});
