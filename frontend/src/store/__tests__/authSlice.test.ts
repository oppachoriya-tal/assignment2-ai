import { configureStore } from '@reduxjs/toolkit';

// Mock auth slice for testing
interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  isVerified: boolean;
}

interface AuthState {
  isAuthenticated: boolean;
  user: User | null;
  loading: boolean;
  error: string | null;
}

interface LoginAction {
  type: string;
  payload: {
    user: User;
    tokens: {
      accessToken: string;
      refreshToken: string;
    };
  };
}

interface LogoutAction {
  type: string;
}

interface SetLoadingAction {
  type: string;
  payload: boolean;
}

interface SetErrorAction {
  type: string;
  payload: string | null;
}

type AuthAction = LoginAction | LogoutAction | SetLoadingAction | SetErrorAction;

const initialState: AuthState = {
  isAuthenticated: false,
  user: null,
  loading: false,
  error: null,
};

const authSlice = {
  name: 'auth',
  initialState,
  reducers: {
    loginStart: (state: AuthState) => {
      state.loading = true;
      state.error = null;
    },
    loginSuccess: (state: AuthState, action: LoginAction) => {
      state.loading = false;
      state.isAuthenticated = true;
      state.user = action.payload.user;
      state.error = null;
    },
    loginFailure: (state: AuthState, action: SetErrorAction) => {
      state.loading = false;
      state.isAuthenticated = false;
      state.user = null;
      state.error = action.payload;
    },
    logout: (state: AuthState) => {
      state.isAuthenticated = false;
      state.user = null;
      state.loading = false;
      state.error = null;
    },
    clearError: (state: AuthState) => {
      state.error = null;
    },
  },
};

// Create a mock store for testing
const createMockStore = (preloadedState?: Partial<AuthState>) => {
  return configureStore({
    reducer: {
      auth: (state: AuthState = initialState, action: AuthAction) => {
        switch (action.type) {
          case 'auth/loginStart':
            return { ...state, loading: true, error: null };
          case 'auth/loginSuccess':
            return {
              ...state,
              loading: false,
              isAuthenticated: true,
              user: (action as LoginAction).payload.user,
              error: null,
            };
          case 'auth/loginFailure':
            return {
              ...state,
              loading: false,
              isAuthenticated: false,
              user: null,
              error: (action as SetErrorAction).payload,
            };
          case 'auth/logout':
            return {
              ...state,
              isAuthenticated: false,
              user: null,
              loading: false,
              error: null,
            };
          case 'auth/clearError':
            return { ...state, error: null };
          default:
            return state;
        }
      },
    },
    preloadedState: preloadedState ? { auth: { ...initialState, ...preloadedState } } : undefined,
  });
};

// Tests
describe('Auth Slice', () => {
  describe('initial state', () => {
    it('should have correct initial state', () => {
      const store = createMockStore();
      const state = store.getState().auth;

      expect(state).toEqual({
        isAuthenticated: false,
        user: null,
        loading: false,
        error: null,
      });
    });
  });

  describe('loginStart', () => {
    it('should set loading to true and clear error', () => {
      const store = createMockStore({ error: 'Previous error' });
      
      store.dispatch({ type: 'auth/loginStart' });
      
      const state = store.getState().auth;
      expect(state.loading).toBe(true);
      expect(state.error).toBeNull();
    });
  });

  describe('loginSuccess', () => {
    it('should set user data and authentication status', () => {
      const store = createMockStore();
      const user = {
        id: 'user-1',
        email: 'test@example.com',
        firstName: 'John',
        lastName: 'Doe',
        role: 'USER',
        isVerified: true,
      };
      const tokens = {
        accessToken: 'access-token',
        refreshToken: 'refresh-token',
      };

      store.dispatch({
        type: 'auth/loginSuccess',
        payload: { user, tokens },
      });

      const state = store.getState().auth;
      expect(state.isAuthenticated).toBe(true);
      expect(state.user).toEqual(user);
      expect(state.loading).toBe(false);
      expect(state.error).toBeNull();
    });
  });

  describe('loginFailure', () => {
    it('should set error and clear user data', () => {
      const store = createMockStore({
        isAuthenticated: true,
        user: {
          id: 'user-1',
          email: 'test@example.com',
          firstName: 'John',
          lastName: 'Doe',
          role: 'USER',
          isVerified: true,
        },
        loading: true,
      });

      const errorMessage = 'Invalid credentials';
      store.dispatch({
        type: 'auth/loginFailure',
        payload: errorMessage,
      });

      const state = store.getState().auth;
      expect(state.isAuthenticated).toBe(false);
      expect(state.user).toBeNull();
      expect(state.loading).toBe(false);
      expect(state.error).toBe(errorMessage);
    });
  });

  describe('logout', () => {
    it('should clear all user data', () => {
      const store = createMockStore({
        isAuthenticated: true,
        user: {
          id: 'user-1',
          email: 'test@example.com',
          firstName: 'John',
          lastName: 'Doe',
          role: 'USER',
          isVerified: true,
        },
        loading: true,
        error: 'Some error',
      });

      store.dispatch({ type: 'auth/logout' });

      const state = store.getState().auth;
      expect(state.isAuthenticated).toBe(false);
      expect(state.user).toBeNull();
      expect(state.loading).toBe(false);
      expect(state.error).toBeNull();
    });
  });

  describe('clearError', () => {
    it('should clear error message', () => {
      const store = createMockStore({ error: 'Some error' });

      store.dispatch({ type: 'auth/clearError' });

      const state = store.getState().auth;
      expect(state.error).toBeNull();
    });
  });

  describe('state transitions', () => {
    it('should handle complete login flow', () => {
      const store = createMockStore();
      const user = {
        id: 'user-1',
        email: 'test@example.com',
        firstName: 'John',
        lastName: 'Doe',
        role: 'USER',
        isVerified: true,
      };
      const tokens = {
        accessToken: 'access-token',
        refreshToken: 'refresh-token',
      };

      // Start login
      store.dispatch({ type: 'auth/loginStart' });
      let state = store.getState().auth;
      expect(state.loading).toBe(true);

      // Login success
      store.dispatch({
        type: 'auth/loginSuccess',
        payload: { user, tokens },
      });
      state = store.getState().auth;
      expect(state.isAuthenticated).toBe(true);
      expect(state.user).toEqual(user);
      expect(state.loading).toBe(false);

      // Logout
      store.dispatch({ type: 'auth/logout' });
      state = store.getState().auth;
      expect(state.isAuthenticated).toBe(false);
      expect(state.user).toBeNull();
    });

    it('should handle login failure flow', () => {
      const store = createMockStore();

      // Start login
      store.dispatch({ type: 'auth/loginStart' });
      let state = store.getState().auth;
      expect(state.loading).toBe(true);

      // Login failure
      store.dispatch({
        type: 'auth/loginFailure',
        payload: 'Invalid credentials',
      });
      state = store.getState().auth;
      expect(state.isAuthenticated).toBe(false);
      expect(state.user).toBeNull();
      expect(state.loading).toBe(false);
      expect(state.error).toBe('Invalid credentials');
    });
  });

  describe('selector functions', () => {
    it('should select authentication status', () => {
      const store = createMockStore({ isAuthenticated: true });
      const state = store.getState().auth;
      expect(state.isAuthenticated).toBe(true);
    });

    it('should select user data', () => {
      const user = {
        id: 'user-1',
        email: 'test@example.com',
        firstName: 'John',
        lastName: 'Doe',
        role: 'USER',
        isVerified: true,
      };
      const store = createMockStore({ user });
      const state = store.getState().auth;
      expect(state.user).toEqual(user);
    });

    it('should select loading state', () => {
      const store = createMockStore({ loading: true });
      const state = store.getState().auth;
      expect(state.loading).toBe(true);
    });

    it('should select error state', () => {
      const store = createMockStore({ error: 'Test error' });
      const state = store.getState().auth;
      expect(state.error).toBe('Test error');
    });
  });
});
