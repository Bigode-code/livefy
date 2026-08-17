/* eslint-disable react-refresh/only-export-components */
import { createContext,useContext,useEffect,useMemo,useState,type ReactNode } from 'react';
import type { Session,User } from '@supabase/supabase-js';
import { supabase,supabaseConfigured } from './lib/supabase';

type AuthValue={
  session:Session|null;
  user:User|null;
  loading:boolean;
  configured:boolean;
  signOut:()=>Promise<void>;
};

const AuthContext=createContext<AuthValue|undefined>(undefined);

export function AuthProvider({children}:{children:ReactNode}){
  const[session,setSession]=useState<Session|null>(null);
  const[loading,setLoading]=useState(true);

  useEffect(()=>{
    if(!supabaseConfigured){setLoading(false);return}
    let active=true;
    supabase.auth.getSession().then(({data})=>{if(active){setSession(data.session);setLoading(false)}});
    const{data:{subscription}}=supabase.auth.onAuthStateChange((_event,nextSession)=>{
      if(active){setSession(nextSession);setLoading(false)}
    });
    return()=>{active=false;subscription.unsubscribe()};
  },[]);

  const value=useMemo<AuthValue>(()=>({
    session,user:session?.user??null,loading,configured:supabaseConfigured,
    signOut:async()=>{await supabase.auth.signOut();location.hash='login'}
  }),[session,loading]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(){
  const value=useContext(AuthContext);
  if(!value)throw new Error('useAuth must be used inside AuthProvider');
  return value;
}
