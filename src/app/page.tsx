'use client';

import { useState } from 'react';
import QRScanner from '@/components/QRScanner';
import VerificationResult from '@/components/VerificationResult';
import { usePhilSysVerification } from '@/hooks/usePhilSysVerification';
import { formatDisplayData } from '@/lib/philsys/formatting';
import { Shield, Scan } from 'lucide-react';

export default function Home() {
  const [isScanning, setIsScanning] = useState(false);
  const { isVerifying, verificationResult, verifyQRCode, resetVerification } = usePhilSysVerification();

  const handleScanSuccess = async (decodedText: string) => {
    setIsScanning(false);
    await verifyQRCode(decodedText);
  };

  const handleScanAnother = () => {
    resetVerification();
    setIsScanning(false);
  };

  const toggleScanning = () => {
    setIsScanning(!isScanning);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex justify-center items-center mb-4">
            <Shield className="w-12 h-12 text-blue-600 mr-3" />
            <h1 className="text-4xl font-bold text-gray-800">PhilSys QR Verifier</h1>
          </div>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Scan and verify PhilSys QR codes for both legacy PhilID and ePhilID formats.
            This open-source verifier integrates with the official PhilSys verification system.
          </p>
        </div>

        {/* Main Content */}
        <div className="max-w-4xl mx-auto">
          {!verificationResult && !isVerifying && (
            <div className="bg-white rounded-lg shadow-lg p-8">
              <div className="text-center mb-6">
                <Scan className="w-16 h-16 text-blue-600 mx-auto mb-4" />
                <h2 className="text-2xl font-semibold text-gray-800 mb-2">
                  Ready to Verify
                </h2>
                <p className="text-gray-600">
                  Choose your preferred scanning method to verify a PhilSys QR code
                </p>
              </div>

              <QRScanner
                onScanSuccess={handleScanSuccess}
                onScanError={(error) => console.error('Scan error:', error)}
                isScanning={isScanning}
                onToggleScanning={toggleScanning}
              />
            </div>
          )}

          {isVerifying && (
            <div className="bg-white rounded-lg shadow-lg p-8 text-center">
              <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <h2 className="text-xl font-semibold text-gray-800 mb-2">
                Verifying QR Code...
              </h2>
              <p className="text-gray-600">
                Please wait while we verify the authenticity of the QR code
              </p>
            </div>
          )}

          {verificationResult && (
            <VerificationResult
              status={verificationResult.status}
              type={verificationResult.type}
              personalInfo={verificationResult.data ? formatDisplayData(verificationResult.data, verificationResult.type === 'PhilID') : undefined}
              onScanAnother={handleScanAnother}
            />
          )}
        </div>

        {/* Footer */}
        <div className="text-center mt-12 text-gray-500">
          <p className="mb-2">
            Open source PhilSys QR verifier - Built with Next.js
          </p>
          <p className="text-sm">
            For official verification, visit{' '}
            <a
              href="https://verify.philsys.gov.ph"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:underline"
            >
              verify.philsys.gov.ph
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
