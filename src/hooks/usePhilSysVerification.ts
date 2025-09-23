'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import {
  checkVersion,
  formatVersion1,
  verifyEddsa,
  cborToJson,
  formatLegacyData
} from '@/lib/philsys/verification';
import { isEVerifyCandidate } from '@/lib/everify';
import { formatDisplayData } from '@/lib/philsys/formatting';
import {
  VerificationStatus,
  IDType,
  PhilIDLegacy,
  EPhilID,
  VerificationResult,
} from '@/lib/types';

export function usePhilSysVerification() {
  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationResult, setVerificationResult] = useState<VerificationResult | null>(null);
  const pollTimeouts = useRef<number[]>([]);
  const currentEVerifyTracking = useRef<string | null>(null);

  const clearPollTimers = useCallback(() => {
    pollTimeouts.current.forEach((id) => clearTimeout(id));
    pollTimeouts.current = [];
  }, []);

  useEffect(() => {
    return () => {
      clearPollTimers();
      currentEVerifyTracking.current = null;
    };
  }, [clearPollTimers]);

  const pushStatus = useCallback(async (status: VerificationStatus, type: IDType) => {
    try {
      await fetch('/api/stat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ stat: status, type }),
      });
    } catch (error) {
      console.error('Failed to push status:', error);
    }
  }, []);

  const checkOnline = useCallback(async (qrData: unknown) => {
    const response = await fetch('/api/verify', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(qrData),
    });
    return response;
  }, []);

  const verifyLegacyPhilID = useCallback(async (qrString: string) => {
    try {
      const qrData: PhilIDLegacy = JSON.parse(qrString);
      const formattedString = formatVersion1(qrData);
      const isValidSignature = await verifyEddsa(formattedString, qrData.signature);
      
      if (!isValidSignature) {
        await pushStatus('TAMPERED', 'PhilID');
        setVerificationResult({
          status: 'INVALID',
          type: 'PhilID',
          message: 'Signature verification failed'
        });
        return;
      }

      await pushStatus('VALID', 'PhilID');
      const formattedData = formatLegacyData(qrData);
      const displayData = formatDisplayData(qrData, true);

      // Check online status
      if (!navigator.onLine) {
        setVerificationResult({
          status: 'OFFLINE',
          type: 'PhilID',
          data: formattedData,
          displayData,
          message: 'Offline verification - signature is valid'
        });
        return;
      }

      // Verify online
      try {
        const response = await checkOnline(formattedData);
        
        if (response.status === 200) {
          await pushStatus('ACTIVATED', 'PhilID');
          setVerificationResult({
            status: 'ACTIVATED',
            type: 'PhilID',
            data: formattedData,
            displayData
          });
        } else {
          await pushStatus('REVOKED', 'PhilID');
          setVerificationResult({
            status: 'REVOKED',
            type: 'PhilID',
            data: formattedData,
            displayData
          });
        }
      } catch (error) {
        console.error('Online verification failed:', error);
        setVerificationResult({
          status: 'ERROR',
          type: 'PhilID',
          data: formattedData,
          displayData,
          message: 'Online verification failed'
        });
      }
    } catch (error) {
      console.error('Legacy PhilID verification error:', error);
      await pushStatus('INVALID', 'PhilID');
      setVerificationResult({
        status: 'INVALID',
        type: 'PhilID',
        message: 'Invalid PhilID format'
      });
    }
  }, [pushStatus, checkOnline]);

  const verifyEPhilID = useCallback(async (qrString: string) => {
    if (!navigator.onLine) {
      setVerificationResult({
        status: 'OFFLINE',
        type: 'ePhilID',
        message: 'Internet connection required for ePhilID verification'
      });
      return;
    }

    try {
      // First verify COSE signature
      const coseResponse = await fetch('/api/cose', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ coseStrng: qrString }),
      });

      const coseResult = await coseResponse.json();
      
      if (!coseResult) {
        await pushStatus('TAMPERED', 'ePhilID');
        setVerificationResult({
          status: 'INVALID',
          type: 'ePhilID',
          message: 'COSE signature verification failed'
        });
        return;
      }

      // Decode CBOR data
      const objVal = cborToJson(qrString);

      if (!objVal) {
        await pushStatus('INVALID', 'ePhilID');
        setVerificationResult({
          status: 'INVALID',
          type: 'ePhilID',
          message: 'Failed to decode ePhilID data'
        });
        return;
      }

      const displayData = formatDisplayData(objVal);

      await pushStatus('VALID', 'ePhilID');

      // Verify online
      try {
        const response = await checkOnline(objVal);
        
        if (response.status === 200) {
          await pushStatus('ACTIVATED', 'ePhilID');
          setVerificationResult({
            status: 'ACTIVATED',
            type: 'ePhilID',
            data: objVal,
            displayData
          });
        } else {
          await pushStatus('REVOKED', 'ePhilID');
          setVerificationResult({
            status: 'REVOKED',
            type: 'ePhilID',
            data: objVal,
            displayData
          });
        }
      } catch (error) {
        console.error('Online verification failed:', error);
        setVerificationResult({
          status: 'ERROR',
          type: 'ePhilID',
          data: objVal,
          displayData,
          message: 'Online verification failed'
        });
      }
    } catch (error) {
      console.error('ePhilID verification error:', error);
      await pushStatus('INVALID', 'ePhilID');
      setVerificationResult({
        status: 'INVALID',
        type: 'ePhilID',
        message: 'ePhilID verification failed'
      });
    }
  }, [pushStatus, checkOnline]);

  const isProfileReady = (profile: Record<string, unknown> | null | undefined): boolean => {
    if (!profile) {
      return false;
    }

    const verificationStatus = (profile as { verified?: unknown }).verified;

    if (verificationStatus === false) {
      return false;
    }

    if (verificationStatus === true) {
      return true;
    }

    const signalKeys = [
      'first_name',
      'full_name',
      'last_name',
      'face_url',
      'image',
      'code',
      'reference',
      'pcn',
    ];

    return signalKeys.some((key) => {
      const value = profile[key];
      if (typeof value === 'string') {
        return value.trim().length > 0;
      }
      return Boolean(value);
    });
  };

  const pollEgovPhProfile = useCallback(
    (trackingNumber: string) => {
      if (!trackingNumber) {
        return;
      }

      if (typeof window === 'undefined') {
        return;
      }

      clearPollTimers();
      currentEVerifyTracking.current = trackingNumber;

      const MAX_ATTEMPTS = 10;
      const DELAY_MS = 4000;

      const attemptFetch = async (attempt: number) => {
        if (currentEVerifyTracking.current !== trackingNumber) {
          return;
        }

        try {
          const response = await fetch(`/api/everify/egov-ph?tracking=${encodeURIComponent(trackingNumber)}`);

          if (response.ok) {
            const payload = await response.json();
            const profile = payload?.profile ?? payload?.data ?? payload ?? {};

            if (!isProfileReady(profile)) {
              throw new Error('Profile not ready');
            }

            if (currentEVerifyTracking.current !== trackingNumber) {
              return;
            }

           setVerificationResult({
             status: 'VALID',
             type: 'eVerify',
             data: profile,
             displayData: payload?.personalInfo,
              extraDetails: Array.isArray(payload?.details)
                ? payload.details
                : [{ label: 'QR Type', value: String((profile as { type?: unknown }).type ?? 'eGovPH') }],
              message: 'eGovPH consent accepted.',
            });

            clearPollTimers();
            currentEVerifyTracking.current = null;
            return;
          }

          if (response.status !== 404) {
            console.warn('Unhandled eGovPH polling response', response.status);
          }
        } catch (error) {
          if (process.env.NODE_ENV !== 'production') {
            console.info('eGovPH profile not ready yet:', error);
          }
        }

        if (attempt >= MAX_ATTEMPTS) {
          setVerificationResult((prev) => {
            if (
              !prev ||
              prev.type !== 'eVerify' ||
              prev.status !== 'PENDING' ||
              currentEVerifyTracking.current !== trackingNumber
            ) {
              return prev;
            }

            return {
              ...prev,
              message:
                'Consent not detected yet. Ask the holder to confirm in the eGovPH app, then scan again or retry.',
            };
          });

          clearPollTimers();
          return;
        }

        const timeoutId = window.setTimeout(() => {
          attemptFetch(attempt + 1);
        }, DELAY_MS);

        pollTimeouts.current.push(timeoutId);
      };

      attemptFetch(1);
    },
    [clearPollTimers]
  );

  const verifyEVerify = useCallback(async (qrString: string) => {
    try {
      const response = await fetch('/api/everify/check', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ value: qrString.trim() }),
      });

      if (!response.ok) {
        const payload = await response.json().catch(() => ({}));
        setVerificationResult({
          status: 'ERROR',
          type: 'eVerify',
          message: payload?.error ?? 'Failed to verify QR code via eVerify',
        });
        return;
      }

      const payload = await response.json();
      const normalized = payload?.normalized;

      if (!normalized) {
        setVerificationResult({
          status: 'ERROR',
          type: 'eVerify',
          message: 'Unexpected response from eVerify service',
        });
        return;
      }

      const isPending = normalized?.type === 'eGovPH';
      const status: VerificationStatus = isPending ? 'PENDING' : 'VALID';
      const trackingNumber = normalized?.payload?.tracking_number ?? '';

     setVerificationResult({
       status,
       type: 'eVerify',
       message: isPending
         ? 'Awaiting eGovPH consent. Ask the holder to confirm the request in the official app.'
         : undefined,
        data: normalized?.payload ?? {},
        displayData: payload?.personalInfo,
        extraDetails: Array.isArray(payload?.details)
          ? payload.details
          : [{ label: 'QR Type', value: String(normalized?.type ?? 'unknown') }],
      });

      if (isPending && trackingNumber) {
        pollEgovPhProfile(trackingNumber);
      } else {
        clearPollTimers();
        currentEVerifyTracking.current = null;
      }
    } catch (error) {
      console.error('eVerify verification error:', error);
      setVerificationResult({
        status: 'ERROR',
        type: 'eVerify',
        message: 'eVerify verification failed',
      });
    }
  }, [clearPollTimers, pollEgovPhProfile]);

  const verifyQRCode = useCallback(async (qrString: string) => {
    setIsVerifying(true);
    clearPollTimers();
    currentEVerifyTracking.current = null;

    try {
      if (isEVerifyCandidate(qrString)) {
        await verifyEVerify(qrString);
        return;
      }

      const version = checkVersion(qrString);

      if (version === 1) {
        await verifyLegacyPhilID(qrString);
      } else if (version === 3) {
        await verifyEPhilID(qrString);
      } else {
        setVerificationResult({
          status: 'INVALID',
          type: 'PhilID',
          message: 'Unsupported QR format'
        });
      }
    } catch (error) {
      console.error('Verification error:', error);
      setVerificationResult({
        status: 'ERROR',
        type: 'PhilID',
        message: 'Verification failed'
      });
    } finally {
      setIsVerifying(false);
    }
  }, [clearPollTimers, verifyEVerify, verifyLegacyPhilID, verifyEPhilID]);

  const resetVerification = useCallback(() => {
    setVerificationResult(null);
    clearPollTimers();
    currentEVerifyTracking.current = null;
  }, [clearPollTimers]);

  return {
    isVerifying,
    verificationResult,
    verifyQRCode,
    resetVerification
  };
}
