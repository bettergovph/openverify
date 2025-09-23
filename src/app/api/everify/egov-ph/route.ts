import { NextResponse } from 'next/server';
import { DetailItem, PersonalInfo } from '@/lib/types';

const EV_BASE = 'https://app-ws.everify.gov.ph';

function extractProfile(raw: any): Record<string, any> {
  return raw?.data?.data ?? raw?.data ?? raw ?? {};
}

function formatLabel(key: string): string {
  return key
    .split('_')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

function formatValue(value: unknown): string {
  if (value === null || value === undefined) {
    return '';
  }
  if (Array.isArray(value)) {
    return value.map((item) => formatValue(item)).join(', ');
  }
  if (typeof value === 'object') {
    try {
      return JSON.stringify(value);
    } catch {
      return String(value);
    }
  }
  if (typeof value === 'boolean') {
    return value ? 'Yes' : 'No';
  }
  return String(value);
}

function toPersonalInfo(profile: Record<string, any>): PersonalInfo {
  const image = profile.image ?? profile.photo ?? undefined;
  const faceUrl = profile.face_url ?? profile.image_url ?? undefined;

  return {
    image,
    imageUrl: faceUrl,
    lastName: profile.last_name ?? profile.surname ?? '',
    firstName: profile.first_name ?? profile.given_name ?? '',
    middleName: profile.middle_name ?? profile.middle_initial ?? '',
    suffix: profile.suffix ?? '',
    sex: profile.gender ?? profile.sex ?? '',
    dateOfBirth: profile.birth_date ?? profile.dob ?? '',
    placeOfBirth: profile.place_of_birth ?? profile.pob ?? '',
    pcn: profile.pcn ?? profile.reference ?? '',
    dateOfIssuance: profile.date_issued ?? profile.issued_on ?? '',
    bestCaptureFinger: Array.isArray(profile.best_finger_captured)
      ? profile.best_finger_captured.join(', ')
      : profile.best_finger_captured ?? '',
  };
}

function buildDetails(profile: Record<string, any>): DetailItem[] {
  const exclude = new Set([
    'image',
    'photo',
    'face_url',
    'image_url',
    'first_name',
    'given_name',
    'middle_name',
    'middle_initial',
    'last_name',
    'surname',
    'suffix',
    'gender',
    'sex',
    'birth_date',
    'dob',
    'place_of_birth',
    'pob',
    'pcn',
    'reference',
    'date_issued',
    'issued_on',
    'best_finger_captured',
  ]);

  return Object.entries(profile)
    .filter(([key, value]) => !exclude.has(key) && value !== null && value !== undefined && value !== '')
    .map(([key, value]) => ({
      label: formatLabel(key),
      value: formatValue(value),
    }));
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const tracking = searchParams.get('tracking');

    if (!tracking) {
      return NextResponse.json({ error: 'Missing tracking number' }, { status: 400 });
    }

    const upstream = await fetch(
      `${EV_BASE}/api/pub/qr/egov_ph?tracking_number=${encodeURIComponent(tracking)}`,
      {
        headers: {
          accept: 'application/json, text/plain, */*',
        },
        cache: 'no-store',
      }
    );

    const raw = await upstream.json().catch(() => null);

    if (!upstream.ok || !raw) {
      return NextResponse.json(
        {
          error: 'Upstream eGovPH profile request failed',
          status: upstream.status,
          body: raw ?? null,
        },
        { status: upstream.status || 502 }
      );
    }

    const profile = extractProfile(raw);

    if (!profile || Object.keys(profile).length === 0) {
      return NextResponse.json({ error: 'Profile not available yet' }, { status: 404 });
    }

    const personalInfo = toPersonalInfo(profile);
    const details = buildDetails(profile);

    return NextResponse.json({
      profile,
      personalInfo,
      details,
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        error: 'Unable to fetch eGovPH profile',
        message: error?.message ?? 'Unknown error',
      },
      { status: 500 }
    );
  }
}
