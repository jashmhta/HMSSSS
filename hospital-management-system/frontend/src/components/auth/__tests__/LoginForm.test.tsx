import { render } from '@testing-library/react';

// eslint-disable-next-line import/no-relative-parent-imports
import { useAuth } from '@/hooks/useAuth';
// eslint-disable-next-line import/no-relative-parent-imports
import LoginForm from '../LoginForm';

// Mock the useAuth hook
// eslint-disable-next-line import/no-relative-parent-imports
jest.mock('@/hooks/useAuth');

const mockUseAuth = useAuth as jest.MockedFunction<typeof useAuth>;

describe('LoginForm', () => {
  beforeEach(() => {
    mockUseAuth.mockReturnValue({
      login: jest.fn(),
      user: null,
      isAuthenticated: false,
      isLoading: false,
      logout: jest.fn(),
      register: jest.fn(),
      updateUser: jest.fn(),
    });
  });

  it('renders without crashing', () => {
    expect(() => render(<LoginForm />)).not.toThrow();
  });

  it('component can be imported', () => {
    expect(LoginForm).toBeDefined();
  });
});