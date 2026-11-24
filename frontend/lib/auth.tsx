"use client";

import React, { createContext, useCallback, useContext, useEffect, useState } from "react";
import { api } from "./api";

export interface AuthUser {
  id: string;
  email: string;
  full_name: string;
  avatar_url?: string | null;
  auth_provider?: string;
  role: string;
  org_id: string;
  mfa_enabled?: boolean;
}

interface AuthContextValue {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  googleClientId: string;
  gsiReady: boolean;
  signInWithGoogleCredential: (credential: string) => Promise<void>;
  signInWithGoogleAccessToken: (accessToken: string) => Promise<void>;
  signInWithEmail: (email: string, password: string) => Promise<void>;
  registerWithEmail: (email: string, password: string, fullName?: string) => Promise<void>;
  signOut: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

const TOKEN_KEY = "agentguard_access_token";
const REFRESH_KEY = "agentguard_refresh_token";
const USER_KEY = "agentguard_user";

declare global {
  interface Window {
    google?: {
      accounts?: {
        id?: {
          initialize: (config: {
            client_id: string;
            callback: (response: { credential?: string }) => void;
            auto_select?: boolean;
            cancel_on_tap_outside?: boolean;
          }) => void;
          prompt: () => void;
          renderButton: (
            parent: HTMLElement,
            options: {
              theme?: "outline" | "filled_blue" | "filled_black";
              size?: "large" | "medium" | "small";
              text?: "signin_with" | "signup_with" | "continue_with" | "signin";
              shape?: "rectangular" | "pill" | "circle" | "square";
              width?: number;
            }
          ) => void;
          disableAutoSelect: () => void;
        };
        oauth2?: {
          initTokenClient: (config: {
            client_id: string;
            scope: string;
            callback: (response: { access_token?: string; error?: string }) => void;
          }) => { requestAccessToken: () => void };
        };
      };
    };
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [gsiReady, setGsiReady] = useState(false);

  const googleClientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || "";

  const persistSession = useCallback((accessToken: string, userData: AuthUser, refreshToken?: string) => {
    localStorage.setItem(TOKEN_KEY, accessToken);
    if (refreshToken) {
      localStorage.setItem(REFRESH_KEY, refreshToken);
    }
    localStorage.setItem(USER_KEY, JSON.stringify(userData));
    setUser(userData);
  }, []);

  const clearSession = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(REFRESH_KEY);
    localStorage.removeItem(USER_KEY);
    setUser(null);
  }, []);

  const signInWithGoogleCredential = useCallback(
    async (credential: string) => {
      const res = await api.googleLogin({ credential });
      persistSession(res.access_token, res.user, res.refresh_token);
    },
    [persistSession]
  );

  const signInWithGoogleAccessToken = useCallback(
    async (accessToken: string) => {
      const res = await api.googleLogin({ access_token: accessToken });
      persistSession(res.access_token, res.user, res.refresh_token);
    },
    [persistSession]
  );

  const signInWithEmail = useCallback(
    async (email: string, password: string) => {
      const res = await api.login(email, password);
      if (res.mfa_required) {
        throw new Error("MFA verification is required for this account.");
      }
      persistSession(res.access_token, res.user, res.refresh_token);
    },
    [persistSession]
  );

  const registerWithEmail = useCallback(
    async (email: string, password: string, fullName?: string) => {
      const res = await api.register(email, password, fullName);
      const token = res.access_token;
      localStorage.setItem(TOKEN_KEY, token);
      const me = await api.getMe();
      persistSession(token, me);
    },
    [persistSession]
  );

  const signOut = useCallback(() => {
    if (window.google?.accounts?.id) {
      try {
        window.google.accounts.id.disableAutoSelect();
      } catch {
        // ignore
      }
    }
    clearSession();
  }, [clearSession]);

  // Restore existing session on mount
  useEffect(() => {
    let active = true;
    const restore = async () => {
      try {
        const storedToken = localStorage.getItem(TOKEN_KEY);
        const storedUser = localStorage.getItem(USER_KEY);
        if (storedToken && storedUser) {
          setUser(JSON.parse(storedUser));
          const me = await api.getMe();
          if (active) {
            setUser(me);
            localStorage.setItem(USER_KEY, JSON.stringify(me));
          }
        }
      } catch {
        if (active) {
          clearSession();
        }
      } finally {
        if (active) {
          setIsLoading(false);
        }
      }
    };
    restore();
    return () => {
      active = false;
    };
  }, [clearSession]);

  // Load Google Identity Services & auto-prompt One Tap when signed out
  useEffect(() => {
    if (!googleClientId || typeof window === "undefined") return;

    const initGsi = () => {
      if (!window.google?.accounts?.id) return;
      window.google.accounts.id.initialize({
        client_id: googleClientId,
        auto_select: true,
        cancel_on_tap_outside: true,
        callback: async (response) => {
          if (response.credential) {
            try {
              await signInWithGoogleCredential(response.credential);
            } catch (err) {
              console.error("[AgentGuard Auth] Google sign-in failed:", err);
            }
          }
        },
      });
      setGsiReady(true);
      if (!localStorage.getItem(TOKEN_KEY)) {
        window.google.accounts.id.prompt();
      }
    };

    if (window.google?.accounts?.id) {
      initGsi();
      return;
    }

    const existingScript = document.querySelector('script[src="https://accounts.google.com/gsi/client"]');
    if (existingScript) {
      existingScript.addEventListener("load", initGsi);
      return () => existingScript.removeEventListener("load", initGsi);
    }

    const script = document.createElement("script");
    script.src = "https://accounts.google.com/gsi/client";
    script.async = true;
    script.defer = true;
    script.onload = initGsi;
    document.head.appendChild(script);
  }, [googleClientId, signInWithGoogleCredential]);

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: Boolean(user),
        isLoading,
        googleClientId,
        gsiReady,
        signInWithGoogleCredential,
        signInWithGoogleAccessToken,
        signInWithEmail,
        registerWithEmail,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return ctx;
}
