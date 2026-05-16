import type { AuthChangeEvent, Session } from "@supabase/supabase-js";
import { getSupabase } from "../lib/supabase";

export const authService = {
  getSession() {
    return getSupabase().auth.getSession();
  },

  onAuthStateChange(callback: (event: AuthChangeEvent, session: Session | null) => void) {
    return getSupabase().auth.onAuthStateChange(callback);
  },

  signIn(email: string, password: string) {
    return getSupabase().auth.signInWithPassword({ email, password });
  },

  signUp(email: string, password: string, fullName: string) {
    return getSupabase().auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName },
        emailRedirectTo: window.location.origin,
      },
    });
  },

  resetPassword(email: string) {
    return getSupabase().auth.resetPasswordForEmail(email, {
      redirectTo: window.location.origin,
    });
  },

  updatePassword(password: string) {
    return getSupabase().auth.updateUser({ password });
  },

  signOut() {
    return getSupabase().auth.signOut();
  },
};
