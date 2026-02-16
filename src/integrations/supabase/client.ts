// Supabase client configuration
import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

// Use environment variables for Supabase configuration (project znjtxrzmlprhqaylimqm)
const DEFAULT_SUPABASE_URL = "https://znjtxrzmlprhqaylimqm.supabase.co";
const DEFAULT_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpuanR4cnptbHByaHFheWxpbXFtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzEyNjA5OTUsImV4cCI6MjA4NjgzNjk5NX0.VaHUe6l_f3LvJpvToeuXS4tGwPnqUZmf61KEX39gLZ0";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || DEFAULT_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || DEFAULT_ANON_KEY;

// Validate that we have the required configuration
if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error('Missing Supabase configuration. Please check your .env.local file.');
}

// Log which Supabase project we're using (helps verify we reach your edge functions)
const projectRef = SUPABASE_URL.replace(/^https:\/\//, '').split('.')[0] || 'unknown';
console.log(`[Weave] Supabase project: ${projectRef} | URL: ${SUPABASE_URL}`);

// Import the supabase client like this:
// import { supabase } from "@/integrations/supabase/client";

export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: localStorage,
    persistSession: true,
    autoRefreshToken: true,
  },
  global: {
    headers: {
      'X-Client-Info': 'weave-ai-frontend',
    },
  },
});

// Export the URL and key for direct API calls
export const getSupabaseUrl = () => SUPABASE_URL;
export const getSupabaseAnonKey = () => SUPABASE_ANON_KEY;

// Response type for edge function calls
export interface EdgeFunctionResponse<T = unknown> {
  data: T | null;
  error: Error | null;
  safetyFiltered?: boolean;
}

// Helper function to invoke edge functions with explicit anon key auth
// Supports timeout configuration for heavy operations like image generation
export const invokeEdgeFunction = async <T = unknown>(
  functionName: string,
  body: Record<string, unknown>,
  options: { timeoutMs?: number } = {}
): Promise<EdgeFunctionResponse<T>> => {
  const { timeoutMs = 30000 } = options; // Default 30s, can be overridden

  // Create abort controller for timeout
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  const functionUrl = `${SUPABASE_URL}/functions/v1/${functionName}`;
  console.log(`[Weave] Calling edge function: ${functionName} → ${functionUrl}`);

  try {
    const response = await fetch(functionUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
          'apikey': SUPABASE_ANON_KEY,
        },
        body: JSON.stringify(body),
        signal: controller.signal,
      });

    clearTimeout(timeoutId);

    // Get response text first (handles empty responses)
    const responseText = await response.text();

    // Handle empty response
    if (!responseText || responseText.trim() === '') {
      if (!response.ok) {
        throw new Error(`Request failed with status ${response.status} (empty response)`);
      }
      return { data: null, error: new Error('Empty response from server') };
    }

    // Parse JSON
    let data: T;
    try {
      data = JSON.parse(responseText);
    } catch {
      console.error('Failed to parse response:', responseText.substring(0, 200));
      throw new Error('Invalid JSON response from server');
    }

    // Check for error responses
    if (!response.ok) {
      const errorData = data as Record<string, unknown>;
      const errorMessage = (errorData.error as string) ||
                          (errorData.details as string) ||
                          (errorData.message as string) ||
                          `HTTP error ${response.status}`;
      console.warn(`[Weave] Edge function ${functionName} returned ${response.status} (we reached it):`, errorMessage.slice(0, 120));
      // Check for safety filter
      if (errorData.safetyFiltered) {
        return {
          data: null,
          error: new Error(errorMessage),
          safetyFiltered: true
        };
      }
      throw new Error(errorMessage);
    }

    return { data, error: null };

  } catch (error) {
    clearTimeout(timeoutId);

    // Handle abort/timeout
    if (error instanceof Error && error.name === 'AbortError') {
      return {
        data: null,
        error: new Error(`Request timed out after ${timeoutMs / 1000} seconds`)
      };
    }

    const isNetworkError = error instanceof TypeError && (error.message === 'Failed to fetch' || error.message.includes('fetch'));
    if (isNetworkError) {
      console.error(`[Weave] Network error calling ${functionName}. Check: (1) URL correct? ${functionUrl} (2) CORS allows your origin (3) Edge function deployed?`, error);
    } else {
      console.error(`[Weave] Error invoking ${functionName}:`, error);
    }
    return {
      data: null,
      error: error instanceof Error ? error : new Error(String(error))
    };
  }
};
