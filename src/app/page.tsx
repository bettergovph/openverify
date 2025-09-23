'use client';

import { useState } from 'react';
import QRScanner from '@/components/QRScanner';
import VerificationResult from '@/components/VerificationResult';
import { usePhilSysVerification } from '@/hooks/usePhilSysVerification';
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
    <div className="min-h-screen w-full bg-[var(--background)] text-[var(--foreground)]">
      <div className="mx-auto flex w-full max-w-xl flex-col">
        <header className="flex flex-col gap-4 border-b border-[var(--border)] px-4 py-6">
          <div className="flex items-center gap-3">
            <Shield className="h-10 w-10 text-[var(--accent)]" />
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-[var(--accent)]">PhilSys</p>
              <h1 className="text-2xl font-semibold leading-tight">QR Verification Console</h1>
            </div>
          </div>
          <p className="text-sm leading-relaxed text-blue-100">
            Verify legacy PhilID and ePhilID QR codes with a streamlined, mobile-first experience.
          </p>
        </header>

        <main className="flex flex-1 flex-col gap-6 px-4 py-6">
          {!verificationResult && !isVerifying && (
            <section className="flex flex-col gap-6 border border-[var(--border)] bg-[var(--surface)] p-5">
              <div className="flex items-center gap-3">
                <Scan className="h-8 w-8 text-[var(--accent)]" />
                <div>
                  <h2 className="text-lg font-semibold uppercase tracking-wide text-blue-100">Ready To Verify</h2>
                  <p className="text-sm text-blue-200">Choose how you want to scan your PhilSys QR code.</p>
                </div>
              </div>

              <QRScanner
                onScanSuccess={handleScanSuccess}
                onScanError={(error) => console.error('Scan error:', error)}
                isScanning={isScanning}
                onToggleScanning={toggleScanning}
              />
            </section>
          )}

          {isVerifying && (
            <section className="flex flex-col items-center gap-4 border border-[var(--border)] bg-[var(--surface)] p-6 text-center">
              <div className="h-12 w-12 animate-spin rounded-full border-2 border-[var(--border)] border-t-[var(--accent)]"></div>
              <div>
                <h2 className="text-base font-semibold uppercase tracking-wide text-blue-100">Verifying QR Code</h2>
                <p className="mt-2 text-sm text-blue-200">Please wait while we confirm the authenticity of the credential.</p>
              </div>
            </section>
          )}

          {verificationResult && (
            <VerificationResult
              status={verificationResult.status}
              type={verificationResult.type}
              personalInfo={verificationResult.displayData}
              message={verificationResult.message}
              extraDetails={verificationResult.extraDetails}
              onScanAnother={handleScanAnother}
            />
          )}
        </main>

        <footer className="border-t border-[var(--border)] px-4 py-6 text-xs uppercase tracking-[0.3em] text-blue-200">
          <p>Open Source PhilSys Verifier · Next.js</p>
          <p className="mt-2 normal-case tracking-normal text-[var(--foreground)]">
            Official portal: {' '}
            <a
              href="https://verify.philsys.gov.ph"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[var(--accent)] underline-offset-4 hover:underline"
            >
              verify.philsys.gov.ph
            </a>
          </p>
        </footer>
      </div>
    </div>
  );
}
