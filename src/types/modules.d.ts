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

declare module 'jimp' {
  import type { Buffer } from 'node:buffer';

  export interface Bitmap {
    width: number;
    height: number;
    data: Buffer;
  }

  export default class Jimp {
    bitmap: Bitmap;
    static read(data: Buffer | ArrayBuffer | ArrayBufferView | string): Promise<Jimp>;
  }
}

declare module 'jsqr' {
  export interface QRCodeLocationPoint {
    x: number;
    y: number;
  }

  export interface QRCode {
    data: string;
    binaryData: Uint8ClampedArray;
    location: {
      topLeftCorner: QRCodeLocationPoint;
      topRightCorner: QRCodeLocationPoint;
      bottomLeftCorner: QRCodeLocationPoint;
      bottomRightCorner: QRCodeLocationPoint;
    };
  }

  export interface JsqrOptions {
    inversionAttempts?: 'dontInvert' | 'onlyInvert' | 'attemptBoth' | 'invertFirst';
  }

  export default function jsQR(
    data: Uint8ClampedArray,
    width: number,
    height: number,
    options?: JsqrOptions
  ): QRCode | null;
}
