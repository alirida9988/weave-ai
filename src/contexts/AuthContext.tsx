import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signUp: (email: string, password: string, name?: string) => Promise<{ error: Error | null }>;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    }).catch(() => {
      // If Supabase fails, fall back to localStorage
      const storedUser = localStorage.getItem('weave_user');
      if (storedUser) {
        try {
          const parsedUser = JSON.parse(storedUser);
          setUser(parsedUser);
        } catch (e) {
          localStorage.removeItem('weave_user');
        }
      }
      setLoading(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signUp = async (email: string, password: string, name?: string) => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: name,
          },
        },
      });
      
      if (error) {
        // Fallback to localStorage if Supabase fails
        return fallbackSignUp(email, password, name);
      }
      
      if (data.user) {
        setUser(data.user);
      }
      
      return { error: null };
    } catch (error) {
      // Fallback to localStorage if Supabase fails
      return fallbackSignUp(email, password, name);
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      
      if (error) {
        // Fallback to localStorage if Supabase fails
        return fallbackSignIn(email, password);
      }
      
      if (data.user) {
        setUser(data.user);
      }
      
      return { error: null };
    } catch (error) {
      // Fallback to localStorage if Supabase fails
      return fallbackSignIn(email, password);
    }
  };

  // Fallback functions for when Supabase is not available
  const fallbackSignUp = async (email: string, password: string, name?: string) => {
    if (!email || !password) {
      return { error: new Error('Email and password are required') };
    }
    if (password.length < 6) {
      return { error: new Error('Password must be at least 6 characters') };
    }

    const existingUsers = JSON.parse(localStorage.getItem('weave_users') || '[]');
    const emailExists = existingUsers.some((u: any) => u.email === email);
    
    if (emailExists) {
      return { error: new Error('An account with this email already exists') };
    }

    const newUser = {
      id: `user_${Date.now()}`,
      email,
      user_metadata: { full_name: name || email.split('@')[0] },
    };

    existingUsers.push({ ...newUser, password });
    localStorage.setItem('weave_users', JSON.stringify(existingUsers));
    localStorage.setItem('weave_user', JSON.stringify(newUser));
    setUser(newUser as any);

    return { error: null };
  };

  const fallbackSignIn = async (email: string, password: string) => {
    if (!email || !password) {
      return { error: new Error('Email and password are required') };
    }

    const existingUsers = JSON.parse(localStorage.getItem('weave_users') || '[]');
    const foundUser = existingUsers.find((u: any) => u.email === email && u.password === password);
    
    if (!foundUser) {
      return { error: new Error('Invalid email or password') };
    }

    const sessionUser = {
      id: foundUser.id,
      email: foundUser.email,
      user_metadata: foundUser.user_metadata,
    };

    localStorage.setItem('weave_user', JSON.stringify(sessionUser));
    setUser(sessionUser as any);

    return { error: null };
  };

  const signOut = async () => {
    try {
      await supabase.auth.signOut();
    } catch (e) {
      // Continue with local signout even if Supabase fails
    }
    localStorage.removeItem('weave_user');
    localStorage.removeItem('hasStartedProject');
    setUser(null);
    setSession(null);
  };

  return (
    <AuthContext.Provider value={{ user, session, loading, signUp, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};
