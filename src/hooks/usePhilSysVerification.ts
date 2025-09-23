'use client';

import { useState, useCallback } from 'react';
import { 
  checkVersion, 
  formatVersion1, 
  verifyEddsa, 
  cborToJson, 
  formatLegacyData 
} from '@/lib/philsys/verification';
import { formatDisplayData } from '@/lib/philsys/formatting';
import { 
  VerificationStatus, 
  IDType, 
  PhilIDLegacy, 
  EPhilID, 
  VerificationResult 
} from '@/lib/types';

export function usePhilSysVerification() {
  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationResult, setVerificationResult] = useState<VerificationResult | null>(null);

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

  const checkOnline = useCallback(async (qrData: any) => {
    const response = await fetch('/api/verify', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(qrData),
    });
    return response;
  }, []);

  const verifyQRCode = useCallback(async (qrString: string) => {
    setIsVerifying(true);
    
    try {
      const version = checkVersion(qrString);
      
      if (version === 1) {
        // Legacy PhilID format
        await verifyLegacyPhilID(qrString);
      } else if (version === 3) {
        // ePhilID format
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

  const resetVerification = useCallback(() => {
    setVerificationResult(null);
  }, []);

  return {
    isVerifying,
    verificationResult,
    verifyQRCode,
    resetVerification
  };
}
