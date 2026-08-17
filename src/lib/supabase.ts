import { createClient } from '@supabase/supabase-js';

const supabaseUrl=import.meta.env.VITE_SUPABASE_URL as string|undefined;
const supabaseKey=import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string|undefined;

export const supabaseConfigured=Boolean(supabaseUrl&&supabaseKey);

if(!supabaseConfigured){
  console.error('Supabase is not configured. Set VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY.');
}

export const supabase=createClient(
  supabaseUrl??'https://invalid.supabase.co',
  supabaseKey??'missing-publishable-key',
  {auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:true}}
);
