'use client';

import { CheckCircle, XCircle, AlertTriangle, WifiOff } from 'lucide-react';
import { VerificationStatus, IDType, PersonalInfo } from '@/lib/types';

interface VerificationResultProps {
  status: VerificationStatus;
  type: IDType;
  personalInfo?: PersonalInfo;
  onScanAnother: () => void;
}

export default function VerificationResult({
  status,
  type,
  personalInfo,
  onScanAnother,
}: VerificationResultProps) {
  const getStatusConfig = () => {
    switch (status) {
      case 'ACTIVATED':
        return {
          icon: CheckCircle,
          iconClass: 'text-[var(--accent)]',
          title: `${type} Verified`,
          tone: 'text-blue-100',
        };
      case 'VALID':
        return {
          icon: CheckCircle,
          iconClass: 'text-[var(--accent)]',
          title: 'PhilSys QR Code is valid',
          tone: 'text-blue-100',
        };
      case 'REVOKED':
        return {
          icon: XCircle,
          iconClass: 'text-red-400',
          title: 'Credential is revoked',
          tone: 'text-red-200',
        };
      case 'INVALID':
      case 'TAMPERED':
        return {
          icon: XCircle,
          iconClass: 'text-red-400',
          title: 'QR code could not be validated',
          tone: 'text-red-200',
        };
      case 'OFFLINE':
        return {
          icon: WifiOff,
          iconClass: 'text-yellow-300',
          title: 'Offline verification required',
          tone: 'text-yellow-200',
        };
      case 'ERROR':
        return {
          icon: AlertTriangle,
          iconClass: 'text-orange-300',
          title: 'Verification failed',
          tone: 'text-orange-200',
        };
      default:
        return {
          icon: AlertTriangle,
          iconClass: 'text-blue-200',
          title: 'Status unavailable',
          tone: 'text-blue-200',
        };
    }
  };

  const { icon: Icon, iconClass, title, tone } = getStatusConfig();
  const isSuccess = status === 'ACTIVATED' || status === 'VALID';
  const isError = status === 'INVALID' || status === 'TAMPERED';

  return (
    <div className="flex flex-col gap-6 border border-[var(--border)] bg-[var(--surface)] p-5">
      <header className="flex items-center gap-4">
        <Icon className={`h-12 w-12 ${iconClass}`} />
        <div>
          <h2 className={`text-base font-semibold uppercase tracking-wide ${tone}`}>{title}</h2>
          <p className="text-xs uppercase tracking-[0.3em] text-blue-200">{type}</p>
        </div>
      </header>

      {personalInfo && isSuccess && (
        <section className="flex flex-col gap-4 border border-[var(--border)] bg-[var(--surface-muted)] p-4">
          {personalInfo.image && (
            <div className="flex items-center justify-center">
              <img
                src={`data:image/png;base64,${personalInfo.image}`}
                alt="ID Photo"
                className="h-24 w-24 border border-[var(--border)] object-cover"
              />
            </div>
          )}
          <dl className="grid grid-cols-1 gap-3 text-xs uppercase tracking-wide text-blue-100">
            <div className="flex justify-between border-b border-[var(--border)] pb-1">
              <dt>Last Name</dt>
              <dd>{personalInfo.lastName.toUpperCase()}</dd>
            </div>
            <div className="flex justify-between border-b border-[var(--border)] pb-1">
              <dt>First Name</dt>
              <dd>{personalInfo.firstName.toUpperCase()}</dd>
            </div>
            <div className="flex justify-between border-b border-[var(--border)] pb-1">
              <dt>Middle Name</dt>
              <dd>{personalInfo.middleName.toUpperCase()}</dd>
            </div>
            <div className="flex justify-between border-b border-[var(--border)] pb-1">
              <dt>Suffix</dt>
              <dd>{personalInfo.suffix.toUpperCase()}</dd>
            </div>
            <div className="flex justify-between border-b border-[var(--border)] pb-1">
              <dt>Sex</dt>
              <dd>{personalInfo.sex.toUpperCase()}</dd>
            </div>
            <div className="flex justify-between border-b border-[var(--border)] pb-1 normal-case">
              <dt>Date of Birth</dt>
              <dd>{personalInfo.dateOfBirth}</dd>
            </div>
            <div className="flex flex-col gap-1 border-b border-[var(--border)] pb-2 text-left normal-case">
              <dt className="text-xs uppercase tracking-[0.3em] text-blue-200">Place of Birth</dt>
              <dd className="text-sm font-semibold text-[var(--foreground)]">{personalInfo.placeOfBirth.toUpperCase()}</dd>
            </div>
            <div className="flex justify-between border-b border-[var(--border)] pb-1 normal-case">
              <dt>PCN</dt>
              <dd>{personalInfo.pcn}</dd>
            </div>
            <div className="flex justify-between border-b border-[var(--border)] pb-1 normal-case">
              <dt>Date Issued</dt>
              <dd>{personalInfo.dateOfIssuance}</dd>
            </div>
            <div className="flex flex-col gap-1 text-left normal-case">
              <dt className="text-xs uppercase tracking-[0.3em] text-blue-200">Best Capture Finger</dt>
              <dd className="text-sm font-semibold text-[var(--foreground)]">{personalInfo.bestCaptureFinger}</dd>
            </div>
          </dl>
        </section>
      )}

      {isError && (
        <section className="border border-[var(--border)] bg-[var(--surface-muted)] p-4 text-sm text-blue-100">
          <h3 className="mb-3 text-xs font-semibold uppercase tracking-[0.3em] text-red-300">Investigate Issues</h3>
          <ul className="space-y-2">
            <li>The QR code may be damaged.</li>
            <li>Embedded data could have been altered.</li>
            <li>The QR content might not originate from PhilID or ePhilID.</li>
          </ul>
          <p className="mt-4 text-xs text-blue-200">
            Attempt at least three scans. If problems persist, direct the cardholder to a PhilSys Registration Center or email info@philsys.gov.ph.
          </p>
        </section>
      )}

      {status === 'OFFLINE' && type === 'PhilID' && (
        <section className="border border-[var(--border)] bg-[var(--surface-muted)] p-4 text-sm text-blue-100">
          While offline, inspect the physical security features of the PhilID. Re-run verification when connectivity is restored.
        </section>
      )}

      {status === 'REVOKED' && (
        <section className="border border-[var(--border)] bg-[var(--surface-muted)] p-4 text-sm text-blue-100">
          Attempt multiple scans. Persistent revocation should be escalated to PhilSys through a registration center or via info@philsys.gov.ph.
        </section>
      )}

      <div className="flex justify-end">
        <button
          onClick={onScanAnother}
          className="border border-[var(--border)] bg-[var(--primary)] px-5 py-2 text-sm font-semibold uppercase tracking-wide text-white"
        >
          Scan Another QR
        </button>
      </div>
    </div>
  );
}
