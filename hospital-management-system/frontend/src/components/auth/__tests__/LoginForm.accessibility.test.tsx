import { render } from '@testing-library/react';
import { axe } from 'jest-axe';
import LoginForm from '../LoginForm';

describe('LoginForm Accessibility', () => {
  it('should have no critical accessibility violations', async () => {
    const { container } = render(<LoginForm />);
    const results = await axe(container);

    const criticalViolations = results.violations.filter(
      v => v.impact === 'critical' || v.impact === 'serious'
    );

    expect(criticalViolations).toHaveLength(0);
  });
});