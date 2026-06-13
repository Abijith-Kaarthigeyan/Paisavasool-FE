import { createSlice, PayloadAction } from "@reduxjs/toolkit"

export interface TokenPayload {
  sub: string;
  email: string;
  role: string;
  is_active: boolean;
  exp: number;
}

interface AuthState {
  isAuthenticated: boolean;
  user: TokenPayload | null;
  status: "idle" | "loading" | "succeeded" | "failed";
  error: string | null;
}

const initialState: AuthState = {
  isAuthenticated: false,
  user: null,
  status: "idle",
  error: null,
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
    },
    clearCredentials(state) {
      state.user = null;
      state.isAuthenticated = false;
      state.status = "idle";
      state.error = null;
    },
    setAuthStatus(state, action: PayloadAction<AuthState["status"]>) {
      state.status = action.payload;
    },
    setAuthError(state, action: PayloadAction<string | null>) {
      state.error = action.payload;
    },
  },
})

export const { setCredentials, clearCredentials, setAuthStatus, setAuthError } = authSlice.actions;

export default authSlice.reducer;
