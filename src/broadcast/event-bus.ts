export class RuntimeEventBus<T extends Record<string,unknown>>{
  private listeners=new Map<keyof T,Set<(payload:never)=>void>>();
  on<K extends keyof T>(event:K,listener:(payload:T[K])=>void){const set=this.listeners.get(event)??new Set();set.add(listener as (payload:never)=>void);this.listeners.set(event,set);return()=>set.delete(listener as (payload:never)=>void)}
  emit<K extends keyof T>(event:K,payload:T[K]){this.listeners.get(event)?.forEach(listener=>listener(payload as never))}
  clear(){this.listeners.clear()}
}
