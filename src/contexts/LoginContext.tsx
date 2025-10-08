// src/contexts/LoginContext.tsx
import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

interface LoginContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signUp: (email: string, password: string, userName: string) => Promise<{ error: any; needsConfirmation?: boolean; message?: string }>;
  login: (emailOrUsername: string, password: string) => Promise<{ error: any }>;
  logout: () => Promise<void>;
}

const LoginContext = createContext<LoginContextType | undefined>(undefined);

// Hook for accessing login context
export const useLogin = () => {
  const context = useContext(LoginContext);
  if (!context) throw new Error('useLogin must be used within a LoginProvider');
  return context;
};

// Provider
export const LoginProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Listen to auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  // ------------------------
  // Sign Up
  // ------------------------
  const signUp = async (email: string, password: string, userName: string) => {
    try {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return { error: { message: 'Please enter a valid email address' } };
      }

      const redirectUrl = `${window.location.origin}/login`; // redirect to login after confirmation
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: email.trim().toLowerCase(),
        password,
        options: {
          emailRedirectTo: redirectUrl,
          data: { user_name: userName },
        },
      });

      if (authError) return { error: authError };

      // Optional: insert admin record
      if (authData.user) {
        try {
          await supabase.from('tbladmins').insert({
            email: email.trim().toLowerCase(),
            password, // hash in production!
            user_name: userName,
          });
        } catch (err: any) {
          if (!err.message?.includes('duplicate')) console.warn('Admin record creation warning:', err);
        }
      }

      if (authData.user && !authData.session) {
        return { error: null, needsConfirmation: true, message: '✅ Signup successful! Check your email to login.' };
      }

      if (authData.user && authData.session) {
        setUser(authData.user); // user is logged in immediately
        return { error: null, message: '🎉 Account created and logged in successfully!' };
      }

      return { error: null, message: 'Account setup completed!' };
    } catch (error: any) {
      return { error: { message: error.message || 'Unexpected error during signup' } };
    }
  };

  // ------------------------
  // Login (Sign In)
  // ------------------------
  const login = async (emailOrUsername: string, password: string) => {
    try {
      let email = emailOrUsername.trim();

      // If username is provided instead of email
      if (!email.includes('@')) {
        const { data: adminData, error: adminError } = await supabase
          .from('tbladmins')
          .select('email')
          .eq('user_name', email)
          .single();

        if (adminError || !adminData) {
          return { error: { message: 'Username not found. Use your email or correct username.' } };
        }
        email = adminData.email;
      } else email = email.toLowerCase();

      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) return { error };

      setUser(data.user ?? null);
      setSession(data.session ?? null);
      return { error: null };
    } catch (error: any) {
      return { error: { message: error.message || 'Unexpected error during login' } };
    }
  };

  // ------------------------
  // Logout (Sign Out)
  // ------------------------
  const logout = async () => {
    setUser(null);
    setSession(null);
    await supabase.auth.signOut();
  };

  const value: LoginContextType = { user, session, loading, signUp, login, logout };

  return <LoginContext.Provider value={value}>{children}</LoginContext.Provider>;
};
