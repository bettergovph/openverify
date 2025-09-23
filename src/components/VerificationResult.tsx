'use client';

import { CheckCircle, XCircle, AlertTriangle, Wifi, WifiOff } from 'lucide-react';
import { VerificationStatus, IDType } from '@/lib/types';

interface PersonalInfo {
  image?: string;
  lastName: string;
  firstName: string;
  middleName: string;
  suffix: string;
  sex: string;
  dateOfBirth: string;
  placeOfBirth: string;
  pcn: string;
  dateOfIssuance: string;
  bestCaptureFinger: string;
}

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
  onScanAnother 
}: VerificationResultProps) {
  const getStatusConfig = () => {
    switch (status) {
      case 'ACTIVATED':
        return {
          icon: <CheckCircle className="w-16 h-16 text-green-500" />,
          title: `${type} has been Verified`,
          bgColor: 'bg-green-50',
          borderColor: 'border-green-200',
          textColor: 'text-green-800'
        };
      case 'VALID':
        return {
          icon: <CheckCircle className="w-16 h-16 text-green-500" />,
          title: 'PhilSys QR code is valid',
          bgColor: 'bg-green-50',
          borderColor: 'border-green-200',
          textColor: 'text-green-800'
        };
      case 'REVOKED':
        return {
          icon: <XCircle className="w-16 h-16 text-red-500" />,
          title: 'This card has been deactivated',
          bgColor: 'bg-red-50',
          borderColor: 'border-red-200',
          textColor: 'text-red-800'
        };
      case 'INVALID':
      case 'TAMPERED':
        return {
          icon: <XCircle className="w-16 h-16 text-red-500" />,
          title: 'QR Code could not be read',
          bgColor: 'bg-red-50',
          borderColor: 'border-red-200',
          textColor: 'text-red-800'
        };
      case 'OFFLINE':
        return {
          icon: <WifiOff className="w-16 h-16 text-yellow-500" />,
          title: `Please connect to the internet to verify the authenticity of the ${type}`,
          bgColor: 'bg-yellow-50',
          borderColor: 'border-yellow-200',
          textColor: 'text-yellow-800'
        };
      case 'ERROR':
        return {
          icon: <AlertTriangle className="w-16 h-16 text-orange-500" />,
          title: 'Could not Verify. Please Try Again.',
          bgColor: 'bg-orange-50',
          borderColor: 'border-orange-200',
          textColor: 'text-orange-800'
        };
      default:
        return {
          icon: <AlertTriangle className="w-16 h-16 text-gray-500" />,
          title: 'Unknown status',
          bgColor: 'bg-gray-50',
          borderColor: 'border-gray-200',
          textColor: 'text-gray-800'
        };
    }
  };

  const config = getStatusConfig();
  const isSuccess = status === 'ACTIVATED' || status === 'VALID';
  const isError = status === 'INVALID' || status === 'TAMPERED';

  return (
    <div className={`max-w-2xl mx-auto p-6 rounded-lg border-2 ${config.bgColor} ${config.borderColor}`}>
      {/* Status Header */}
      <div className="text-center mb-6">
        <div className="flex justify-center mb-4">
          {config.icon}
        </div>
        <h2 className={`text-2xl font-bold ${config.textColor}`}>
          {config.title}
        </h2>
      </div>

      {/* Personal Information Display */}
      {personalInfo && isSuccess && (
        <div className="bg-white p-6 rounded-lg shadow-sm mb-6">
          {personalInfo.image && (
            <div className="text-center mb-6">
              <img 
                src={`data:image/png;base64,${personalInfo.image}`}
                alt="ID Photo"
                className="w-20 h-20 mx-auto rounded-lg border-2 border-gray-200"
              />
            </div>
          )}
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <strong>Last Name:</strong> {personalInfo.lastName.toUpperCase()}
            </div>
            <div>
              <strong>First Name:</strong> {personalInfo.firstName.toUpperCase()}
            </div>
            <div>
              <strong>Middle Name:</strong> {personalInfo.middleName.toUpperCase()}
            </div>
            <div>
              <strong>Suffix:</strong> {personalInfo.suffix.toUpperCase()}
            </div>
            <div>
              <strong>Sex:</strong> {personalInfo.sex.toUpperCase()}
            </div>
            <div>
              <strong>Date of Birth:</strong> {personalInfo.dateOfBirth}
            </div>
            <div className="md:col-span-2">
              <strong>Place of Birth:</strong> {personalInfo.placeOfBirth.toUpperCase()}
            </div>
            <div>
              <strong>PhilSys Card Number (PCN):</strong> {personalInfo.pcn}
            </div>
            <div>
              <strong>Date of Issuance:</strong> {personalInfo.dateOfIssuance}
            </div>
            <div className="md:col-span-2">
              <strong>Best Capture Finger:</strong> {personalInfo.bestCaptureFinger}
            </div>
          </div>
        </div>
      )}

      {/* Error Information */}
      {isError && (
        <div className="bg-white p-6 rounded-lg shadow-sm mb-6">
          <h3 className="font-bold text-lg mb-4">
            The result is probably due to any of the following reasons:
          </h3>
          <ul className="list-disc list-inside space-y-2 text-gray-700">
            <li>The QR Code is damaged.</li>
            <li>The information in the QR Code has been tampered with.</li>
            <li>The QR Code is not from PhilID or ePhilID.</li>
          </ul>
          <p className="mt-4 text-sm text-gray-600">
            Note that the relying party should try scanning the PhilID or ePhilID at least 3 times.
          </p>
          <p className="mt-2 text-sm text-gray-600">
            If the authentication results are still unsuccessful, the cardholder should bring their 
            PhilID/ePhilID to the nearest PhilSys Registration Center or email info@philsys.gov.ph.
          </p>
        </div>
      )}

      {/* Offline Information */}
      {status === 'OFFLINE' && type === 'PhilID' && (
        <div className="bg-white p-6 rounded-lg shadow-sm mb-6">
          <p className="text-gray-700">
            In the event where internet connection is not possible, you may still verify the 
            authenticity of the PhilID card by checking its security features.
          </p>
        </div>
      )}

      {/* Revoked Information */}
      {status === 'REVOKED' && (
        <div className="bg-white p-6 rounded-lg shadow-sm mb-6">
          <p className="text-sm text-gray-600 mb-2">
            Note that the relying party should try scanning the PhilID or ePhilID at least 3 times.
          </p>
          <p className="text-sm text-gray-600">
            If the authentication results are still unsuccessful, the cardholder should bring their 
            PhilID/ePhilID to the nearest PhilSys Registration Center or email info@philsys.gov.ph.
          </p>
        </div>
      )}

      {/* Action Button */}
      <div className="text-center">
        <button
          onClick={onScanAnother}
          className="px-8 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors"
        >
          VERIFY ANOTHER QR
        </button>
      </div>
    </div>
  );
}
