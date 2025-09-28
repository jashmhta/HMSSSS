import { render } from '@testing-library/react';
import { axe } from 'jest-axe';
import Dashboard from '../Dashboard';

describe('Dashboard Accessibility', () => {
  it('should have no critical accessibility violations', async () => {
    const { container } = render(<Dashboard />);
    const results = await axe(container);

    const criticalViolations = results.violations.filter(
      v => v.impact === 'critical' || v.impact === 'serious'
    );

    expect(criticalViolations).toHaveLength(0);
  });
});