declare module 'js-cookie' {
  export function get(name: string): string | undefined;
  export function set(name: string, value: string, options?: { expires?: number | Date; path?: string; domain?: string; secure?: boolean; sameSite?: 'strict' | 'lax' | 'none' }): void;
  export function remove(name: string, options?: { path?: string; domain?: string }): void;
}
