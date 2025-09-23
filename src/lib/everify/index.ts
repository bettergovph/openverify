import { DetailItem, PersonalInfo } from '../types';

export type EVerifyType =
  | 'National ID'
  | 'National ID Signed'
  | 'Philsys Card Number'
  | 'ePhilId'
  | 'Philsys Card'
  | 'eGovPH'
  | 'unknown';

export interface EVerifyNormalized {
  type: EVerifyType;
  payload: Record<string, any>;
}

const DIGIT_ONLY_REGEX = /^\d{12,20}$/;
const EPHIL_PREFIX_REGEX = /^(PH[A-Z]{1}|PHL|PHX):/i;

/**
 * Heuristic detection for public eVerify QR payloads
 */
export function isEVerifyCandidate(raw: string): boolean {
  const value = raw.trim();
  if (!value) {
    return false;
  }

  // Purely numeric PCNs or shortened tokens map to the public verifier
  if (DIGIT_ONLY_REGEX.test(value)) {
    return true;
  }

  // Some eVerify payloads are alphanumeric without punctuation but not JSON
  const isLikelyJson = value.startsWith('{') && value.endsWith('}');
  const hasKnownEPhilPrefix = EPHIL_PREFIX_REGEX.test(value);

  if (isLikelyJson || hasKnownEPhilPrefix) {
    return false;
  }

  // Reject obvious ePhilID CBOR strings that always contain a colon in the prefix
  if (value.includes(':')) {
    return false;
  }

  // Fallback: moderately sized uppercase + digit tokens
  return /^[A-Z0-9]{16,40}$/.test(value);
}

/**
 * Simplify the upstream payload from /api/pub/qr/check
 */
export function normalizeEVerifyCheck(response: any): EVerifyNormalized {
  const meta = response?.meta ?? response?.data?.meta ?? null;
  const dataPayload =
    response?.data?.data ??
    response?.data ??
    response ?? {};

  const type = (meta?.qr_type ?? 'unknown') as EVerifyType;

  return {
    type,
    payload: dataPayload ?? {},
  };
}

/**
 * Map normalized payloads into our display model
 */
export function toPersonalInfo(normalized: EVerifyNormalized): PersonalInfo | undefined {
  const { type, payload } = normalized;

  switch (type) {
    case 'National ID':
      return {
        lastName: payload.last_name ?? '',
        firstName: payload.first_name ?? '',
        middleName: payload.middle_name ?? '',
        suffix: payload.suffix ?? '',
        sex: payload.gender ?? '',
        dateOfBirth: payload.birth_date ?? '',
        placeOfBirth: payload.place_of_birth ?? '',
        pcn: payload.pcn ?? '',
        dateOfIssuance: payload.date_issued ?? '',
        bestCaptureFinger: '',
      };
    case 'National ID Signed':
    case 'ePhilId':
    case 'Philsys Card':
      return {
        image: payload.image ?? undefined,
        imageUrl: payload.face_url ?? undefined,
        lastName: payload.last_name ?? '',
        firstName: payload.first_name ?? '',
        middleName: payload.middle_name ?? '',
        suffix: payload.suffix ?? '',
        sex: payload.sex ?? '',
        dateOfBirth: payload.birth_date ?? '',
        placeOfBirth: payload.place_of_birth ?? '',
        pcn: payload.pcn ?? '',
        dateOfIssuance: payload.date_issued ?? '',
        bestCaptureFinger: Array.isArray(payload.best_finger_captured)
          ? payload.best_finger_captured.join(', ')
          : payload.best_finger_captured ?? '',
      };
    case 'Philsys Card Number':
      return {
        lastName: '',
        firstName: '',
        middleName: '',
        suffix: '',
        sex: '',
        dateOfBirth: '',
        placeOfBirth: '',
        pcn: payload.pcn ?? '',
        dateOfIssuance: '',
        bestCaptureFinger: '',
      };
    default:
      return undefined;
  }
}

/**
 * Derive additional detail rows for display
 */
export function buildDetailList(normalized: EVerifyNormalized): DetailItem[] {
  const { type, payload } = normalized;
  const rows: DetailItem[] = [];

  if (payload.digital_id) {
    rows.push({ label: 'Digital ID', value: String(payload.digital_id) });
  }

  if (payload.code) {
    rows.push({ label: 'Reference Code', value: String(payload.code) });
  }

  if (payload.residency_status) {
    rows.push({ label: 'Residency Status', value: String(payload.residency_status) });
  }

  if (payload.marital_status) {
    rows.push({ label: 'Marital Status', value: String(payload.marital_status) });
  }

  if (payload.mobile_number) {
    rows.push({ label: 'Mobile Number', value: String(payload.mobile_number) });
  }

  if (payload.email) {
    rows.push({ label: 'Email Address', value: String(payload.email) });
  }

  if (payload.full_address) {
    rows.push({ label: 'Address', value: String(payload.full_address) });
  }

  if (payload.tracking_number) {
    rows.push({ label: 'Tracking Number', value: String(payload.tracking_number) });
  }

  if (type === 'Philsys Card Number' && !rows.length) {
    rows.push({ label: 'Message', value: 'PCN recognised. No additional details returned.' });
  }

  if (type === 'unknown' && !rows.length) {
    rows.push({ label: 'Notice', value: 'QR recognised by eVerify but data type was not identified.' });
  }

  return rows;
}
