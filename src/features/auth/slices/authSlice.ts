import { createSlice, PayloadAction } from "@reduxjs/toolkit"

export interface TokenPayload {
  sub: string;
  email: string;
  first_name: string;
  role: string;
  is_active: boolean;
  exp: number;
}

interface AuthState {
  isAuthenticated: boolean;
  user: TokenPayload | null;
  status: "idle" | "loading" | "succeeded" | "failed";
  error: string | null;
  /** Set when the user explicitly logs out; post-login should go to dashboard. */
  voluntaryLogout: boolean;
}

const initialState: AuthState = {
  isAuthenticated: false,
  user: null,
  status: "loading",
  error: null,
  voluntaryLogout: false,
}

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    setCredentials(state, action: PayloadAction<TokenPayload>) {
      state.user = action.payload;
      state.isAuthenticated = true;
      state.status = "succeeded";
      state.error = null;
      state.voluntaryLogout = false;
    },
    clearCredentials(state) {
      state.user = null;
      state.isAuthenticated = false;
      state.status = "idle";
      state.error = null;
    },
    logout(state) {
      state.user = null;
      state.isAuthenticated = false;
      state.status = "idle";
      state.error = null;
      state.voluntaryLogout = true;
    },
    setAuthStatus(state, action: PayloadAction<AuthState["status"]>) {
      state.status = action.payload;
    },
    setAuthError(state, action: PayloadAction<string | null>) {
      state.error = action.payload;
    },
  },
})

export const { setCredentials, clearCredentials, logout, setAuthStatus, setAuthError } = authSlice.actions;

export default authSlice.reducer;
