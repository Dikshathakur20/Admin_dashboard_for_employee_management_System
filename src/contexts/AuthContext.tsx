import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signUp: (email: string, password: string, userName: string) => Promise<{ error: any; needsConfirmation?: boolean; message?: string }>;
  signIn: (emailOrUsername: string, password: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
      }
    );

    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signUp = async (email: string, password: string, userName: string) => {
    try {
      // Validate email format first
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return { 
          error: { message: "Please enter a valid email address" }
        };
      }

      const redirectUrl = `${window.location.origin}/`;
      
      // Create the auth user with metadata
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: email.trim().toLowerCase(),
        password,
        options: {
          emailRedirectTo: redirectUrl,
          data: {
            user_name: userName
          }
        }
      });

      if (authError) {
        // Handle specific Supabase errors
        if (authError.message.includes('User already registered')) {
          return { 
            error: { message: "An account with this email already exists. Please try signing in instead." }
          };
        }
        if (authError.message.includes('Invalid email')) {
          return { 
            error: { message: "Please enter a valid email address" }
          };
        }
        return { error: authError };
      }

      // Check if user needs email confirmation
      if (authData.user && !authData.session) {
        // Try to create admin record for pending confirmation
        try {
          await supabase
            .from('tbladmins')
            .insert({
              email: email.trim().toLowerCase(),
              password, // In production, this should be hashed
              user_name: userName
            });
        } catch (adminError) {
          // Ignore duplicate errors for now
          console.log('Admin record creation error (may be duplicate):', adminError);
        }

        return { 
          error: null, 
          needsConfirmation: true,
          message: "Please check your email and click the confirmation link to complete your registration."
        };
      }

      // If user is immediately logged in (email confirmation disabled)
      if (authData.user && authData.session) {
        // Create admin record
        const { error: adminError } = await supabase
          .from('tbladmins')
          .insert({
            email: email.trim().toLowerCase(),
            password,
            user_name: userName
          });

        if (adminError && !adminError.message.includes('duplicate')) {
          return { error: adminError };
        }

        return { 
          error: null, 
          message: "Account created successfully! Welcome to the admin dashboard."
        };
      }

      return { 
        error: null, 
        message: "Account setup completed!"
      };
    } catch (error: any) {
      return { 
        error: { message: error.message || "An unexpected error occurred during signup" }
      };
    }
  };

  const signIn = async (emailOrUsername: string, password: string) => {
    try {
      let email = emailOrUsername.trim();
      
      // If input is not an email, find the email from username
      if (!email.includes('@')) {
        const { data: adminData, error: adminError } = await supabase
          .from('tbladmins')
          .select('email')
          .eq('user_name', email)
          .single();

        if (adminError || !adminData) {
          return { error: { message: 'Username not found. Please check your username or try using your email instead.' } };
        }
        
        email = adminData.email;
      } else {
        email = email.toLowerCase();
      }

      // Sign in with Supabase Auth using email
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (error) {
        if (error.message.includes('Invalid login credentials')) {
          return { error: { message: 'Invalid email/username or password. Please check your credentials and try again.' } };
        }
        if (error.message.includes('Email not confirmed')) {
          return { error: { message: 'Please check your email and click the confirmation link before signing in.' } };
        }
        return { error };
      }

      return { error: null };
    } catch (error: any) {
      return { error: { message: error.message || "An unexpected error occurred during sign in" } };
    }
  };

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  const value = {
    user,
    session,
    loading,
    signUp,
    signIn,
    signOut
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};