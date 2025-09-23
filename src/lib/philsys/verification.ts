import * as ed25519 from '@noble/ed25519';
import { hashes } from '@noble/ed25519';
import { sha512 } from '@noble/hashes/sha512';
import * as CBOR from 'cbor-js';
import { decode as base45Decode } from 'base45';
import { PhilIDLegacy, EPhilID, QRVersion, QRData } from '../types';

const PUBLIC_KEY_FALLBACK = 'vD3czlgHEpf2sxGcri6iTm4zeEEA+jfd9tTq9S8zxe8=';
const envPublicKey = process.env.NEXT_PUBLIC_PHILSYS_PUBLIC_KEY;
export const PHILSYS_PUBLIC_KEY = envPublicKey ?? PUBLIC_KEY_FALLBACK;

if (envPublicKey) {
  console.log('[PhilSys] Using public key from NEXT_PUBLIC_PHILSYS_PUBLIC_KEY.');
} else {
  console.warn('[PhilSys] NEXT_PUBLIC_PHILSYS_PUBLIC_KEY not set. Falling back to built-in key.');
}

if (!hashes.sha512) {
  hashes.sha512 = (msg: Uint8Array): Uint8Array => sha512(msg);
  console.log('[PhilSys] Configured ed25519 SHA-512 implementation.');
}

if (!hashes.sha512Async) {
  hashes.sha512Async = async (msg: Uint8Array): Promise<Uint8Array> => sha512(msg);
}

/**
 * Determines the QR code version based on content
 */
export function checkVersion(qrString: string): QRVersion {
  console.log('[PhilSys] Checking QR version...');
  try {
    JSON.parse(qrString);
    console.log('[PhilSys] Detected legacy PhilID payload (Version 1).');
    return 1; // Legacy PhilID format
  } catch {
    console.log('[PhilSys] Detected ePhilID payload (Version 3).');
    return 3; // ePhilID format
  }
}

/**
 * Formats Version 1 (Legacy) QR data for signature verification
 */
export function formatVersion1(qrJson: PhilIDLegacy): string {
  console.log('[PhilSys] Formatting Version 1 payload for signature verification.');
  const payloadString = `{
  "DateIssued": "${qrJson.DateIssued}",
  "Issuer": "${qrJson.Issuer}",
  "subject": {
    "Suffix": "${qrJson.subject.Suffix}",
    "lName": "${qrJson.subject.lName}",
    "fName": "${qrJson.subject.fName}",
    "mName": "${qrJson.subject.mName}",
    "sex": "${qrJson.subject.sex}",
    "BF": "${qrJson.subject.BF}",
    "DOB": "${qrJson.subject.DOB}",
    "POB": "${qrJson.subject.POB}",
    "PCN": "${qrJson.subject.PCN}"
  },
  "alg": "${qrJson.alg}"
}`;
  return payloadString;
}

/**
 * Converts base64 string to hex
 */
export function base64ToHex(str: string): string {
  console.log('[PhilSys] Converting base64 string to hex. Length:', str.length);
  const raw = atob(str);
  let result = '';
  for (let i = 0; i < raw.length; i++) {
    const hex = raw.charCodeAt(i).toString(16);
    result += (hex.length === 2 ? hex : '0' + hex);
  }
  return result.toUpperCase();
}

/**
 * Verifies EdDSA signature for legacy PhilID
 */
export async function verifyEddsa(msg: string, sig: string): Promise<boolean> {
  console.log('[PhilSys] Starting EdDSA verification.');
  try {
    // Clean message (replace ñ/Ñ with ?)
    const cleanMsg = msg.replace(/ñ|Ñ/g, "?");
    console.log('[PhilSys] Message sanitized for special characters. Length:', cleanMsg.length);
    
    // Convert to base64 then hex
    const b64payload = btoa(cleanMsg);
    const hexPayload = base64ToHex(b64payload);
    const hexSig = base64ToHex(sig);
    console.log('[PhilSys] Converted payload and signature to hex.');
    
    // Convert public key from base64 to hex
    const publicKeyHex = base64ToHex(PHILSYS_PUBLIC_KEY);
    console.log('[PhilSys] Public key source:', envPublicKey ? 'env' : 'fallback');
    
    // Convert hex strings to Uint8Array
    const messageBytes = new Uint8Array(hexPayload.match(/.{1,2}/g)!.map(byte => parseInt(byte, 16)));
    const signatureBytes = new Uint8Array(hexSig.match(/.{1,2}/g)!.map(byte => parseInt(byte, 16)));
    const publicKeyBytes = new Uint8Array(publicKeyHex.match(/.{1,2}/g)!.map(byte => parseInt(byte, 16)));
    console.log('[PhilSys] Prepared Uint8Array buffers for verification.');
    
    // Verify signature using @noble/ed25519
    const isValid = await ed25519.verify(signatureBytes, messageBytes, publicKeyBytes);
    console.log('[PhilSys] Signature verification result:', isValid);
    return isValid;
  } catch (error) {
    console.error('EdDSA verification error:', error);
    return false;
  }
}

/**
 * Converts array buffer to hex string
 */
function buf2hex(buffer: ArrayBuffer | SharedArrayBuffer | Uint8Array): string {
  console.log('[PhilSys] Converting buffer to hex. Byte length:', buffer instanceof Uint8Array ? buffer.length : new Uint8Array(buffer).length);
  const u = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer);
  const a = new Array(u.length);
  let i = u.length;
  while (i--) {
    a[i] = (u[i] < 16 ? '0' : '') + u[i].toString(16);
  }
  return a.join('');
}

/**
 * Converts typed array to buffer
 */
function typedArrayToBuffer(array: ArrayBuffer | Uint8Array): ArrayBuffer {
  console.log('[PhilSys] Normalizing typed array to ArrayBuffer.');
  if (array instanceof Uint8Array) {
    return array.buffer.slice(array.byteOffset, array.byteLength + array.byteOffset) as ArrayBuffer;
  }
  return array as ArrayBuffer;
}

/**
 * Converts array to Uint8Array
 */
function convertArrayToUintArray(array: ArrayBuffer | SharedArrayBuffer | Uint8Array): Uint8Array {
  console.log('[PhilSys] Converting raw array buffer to Uint8Array.');
  const COSE = buf2hex(array);
  return new Uint8Array(COSE.match(/[\da-f]{2}/gi)!.map(h => parseInt(h, 16)));
}

/**
 * Converts Uint8Array to string
 */
function Uint8ToString(u8a: Uint8Array): string {
  console.log('[PhilSys] Converting Uint8Array to string. Length:', u8a.length);
  const CHUNK_SZ = 0x8000;
  const c = [];
  for (let i = 0; i < u8a.length; i += CHUNK_SZ) {
    c.push(String.fromCharCode.apply(null, Array.from(u8a.subarray(i, i + CHUNK_SZ))));
  }
  return c.join("");
}

/**
 * Decodes CBOR format for ePhilID (Version 3)
 */
export function cborToJson(qrString: string): EPhilID | null {
  console.log('[PhilSys] Starting CBOR decoding process.');
  try {
    // Remove first 4 characters and decode base45
    const string = qrString.slice(4);
    console.log('[PhilSys] Stripped QR prefix. Remaining length:', string.length);
    const base45Decoded = base45Decode(string);
    console.log('[PhilSys] Base45 decoded payload length:',
      base45Decoded instanceof Uint8Array ? base45Decoded.length : new Uint8Array(base45Decoded).length);
    const rawToUi8 = convertArrayToUintArray(base45Decoded);
    const unzipped = typedArrayToBuffer(rawToUi8);
    console.log('[PhilSys] Converted to Uint8Array and normalized buffer.');
    
    // Decode CBOR
    const [headers1, headers2, payload, signature] = CBOR.decode(unzipped);
    console.log('[PhilSys] Decoded COSE structure. Payload length:',
      payload instanceof Uint8Array ? payload.length : new Uint8Array(payload).length);
    const claim = CBOR.decode(typedArrayToBuffer(payload));
    console.log('[PhilSys] Extracted claim object keys:', Object.keys(claim));
    
    // Verify country code
    if (claim["1"] !== "PH") {
      console.warn('[PhilSys] Unexpected country code in claim:', claim["1"]);
      return null;
    }
    console.log('[PhilSys] Country code verified as PH.');
    
    // Extract credential data
    const finalCredentialMap = claim["169"];
    console.log('[PhilSys] Retrieved credential map keys:', Object.keys(finalCredentialMap ?? {}));
    
    // Convert image to base64
    if (finalCredentialMap.img) {
      const u8 = new Uint8Array(finalCredentialMap.img);
      const b64encoded = btoa(Uint8ToString(u8));
      finalCredentialMap.img = b64encoded;
      console.log('[PhilSys] Embedded image converted to base64. Length:', b64encoded.length);
    }
    
    return finalCredentialMap;
  } catch (error) {
    console.error('CBOR decoding error:', error);
    return null;
  }
}

/**
 * Formats legacy data to match ePhilID structure
 */
export function formatLegacyData(objVal: PhilIDLegacy): EPhilID {
  console.log('[PhilSys] Formatting legacy PhilID data.');
  const dateIssued = formatLegacyDate(objVal.DateIssued);
  const dateBirth = formatLegacyDate(objVal.subject.DOB);
  const parsePCN = objVal.subject.PCN.replace(/-/g, "");
  console.log('[PhilSys] Parsed legacy dates and PCN.');
  
  return {
    d: dateIssued,
    i: objVal.Issuer,
    img: "",
    sb: {
      BF: objVal.subject.BF,
      DOB: dateBirth,
      PCN: parsePCN,
      POB: objVal.subject.POB,
      fn: objVal.subject.fName,
      ln: objVal.subject.lName,
      mn: objVal.subject.mName,
      s: objVal.subject.sex,
      sf: objVal.subject.Suffix
    }
  };
}

/**
 * Formats legacy date string
 */
function formatLegacyDate(dateString: string): string {
  console.log('[PhilSys] Normalizing legacy date:', dateString);
  const date = new Date(dateString);
  const year = date.getFullYear();
  let month = (date.getMonth() + 1).toString();
  let dt = date.getDate().toString();
  
  if (parseInt(dt) < 10) {
    dt = '0' + dt;
  }
  if (parseInt(month) < 10) {
    month = '0' + month;
  }
  
  return `${year}-${month}-${dt}`;
}
