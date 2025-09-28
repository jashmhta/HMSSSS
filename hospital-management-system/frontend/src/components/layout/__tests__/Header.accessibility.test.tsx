import { render } from '@testing-library/react';
import { axe } from 'jest-axe';
import Header from '../Header';

describe('Header Accessibility', () => {
  it('should have no critical accessibility violations', async () => {
    const { container } = render(<Header />);
    const results = await axe(container);

    const criticalViolations = results.violations.filter(
      v => v.impact === 'critical' || v.impact === 'serious'
    );

    expect(criticalViolations).toHaveLength(0);
  });
});