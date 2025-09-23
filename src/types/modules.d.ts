declare module 'cbor-js' {
  export function decode(input: ArrayBuffer | Uint8Array): any;
  export function encode(value: unknown): Uint8Array;
}

declare module 'base45' {
  export function decode(input: string | Uint8Array): Uint8Array;
  export function encode(input: ArrayBuffer | Uint8Array): string;
}

declare module 'pako' {
  export function inflate(data: Uint8Array | ArrayBuffer, options?: Record<string, unknown>): Uint8Array;
  export function deflate(data: Uint8Array | ArrayBuffer, options?: Record<string, unknown>): Uint8Array;
}
