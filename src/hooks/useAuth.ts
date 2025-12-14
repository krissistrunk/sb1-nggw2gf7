import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { isMockMode, MockAuth } from '../lib/mock-data';
import type { User } from '@supabase/supabase-js';

// Mock user type compatible with Supabase User
type MockUser = {
  id: string;
  email: string;
  app_metadata?: Record<string, unknown>;
  user_metadata?: Record<string, unknown>;
  aud?: string;
  created_at?: string;
};

export function useAuth() {
  const [user, setUser] = useState<User | MockUser | null>(null);
  const [loading, setLoading] = useState(true);
  const useMock = isMockMode();

  useEffect(() => {
    if (useMock) {
      // Mock mode: use MockAuth
      const session = MockAuth.getSession();
      setUser(session.data.session?.user ?? null);
      setLoading(false);
    } else {
      // Real mode: use Supabase
      supabase.auth.getSession().then(({ data: { session } }) => {
        setUser(session?.user ?? null);
        setLoading(false);
      });

      const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
        setUser(session?.user ?? null);
      });

      return () => subscription.unsubscribe();
    }
  }, [useMock]);

  const signIn = async (email: string, password: string) => {
    if (useMock) {
      const result = await MockAuth.signIn(email, password);
      if (result.error) throw new Error(result.error.message);
      setUser(result.data.user as MockUser);
      return result.data;
    }
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    return data;
  };

  const signUp = async (email: string, password: string, name?: string) => {
    if (useMock) {
      const result = await MockAuth.signUp(email, password, { name });
      if (result.error) throw new Error(result.error.message);
      setUser(result.data.user as MockUser);
      return result.data;
    }
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { name } },
    });
    if (error) throw error;
    if (data.user) {
      await supabase.from('users').insert({
        id: data.user.id,
        email: data.user.email!,
        name: name || null,
      });
    }
    return data;
  };

  const signOut = async () => {
    if (useMock) {
      await MockAuth.signOut();
      setUser(null);
      return;
    }
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  };

  return { user, loading, signIn, signUp, signOut };
}
