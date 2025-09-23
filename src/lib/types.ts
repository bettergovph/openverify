// PhilSys QR Code Types

export interface PhilIDLegacy {
  DateIssued: string;
  Issuer: string;
  subject: {
    Suffix: string;
    lName: string;
    fName: string;
    mName: string;
    sex: string;
    BF: string; // Best Finger (JSON string of finger indices)
    DOB: string; // Date of Birth
    POB: string; // Place of Birth
    PCN: string; // PhilSys Card Number
  };
  signature: string;
  alg: string;
}

export interface EPhilID {
  d?: string; // Date issued
  i: string; // Issuer
  img: string; // Base64 image
  sb: {
    BF: string; // Best Finger
    DOB: string; // Date of Birth
    PCN: string; // PhilSys Card Number
    POB: string; // Place of Birth
    fn: string; // First name
    ln: string; // Last name
    mn: string; // Middle name
    s: string; // Sex
    sf: string; // Suffix
  };
}

export type QRData = PhilIDLegacy | EPhilID;

export type QRVersion = 1 | 3;

export type VerificationStatus = 
  | 'VALID' 
  | 'INVALID' 
  | 'TAMPERED' 
  | 'ACTIVATED' 
  | 'REVOKED' 
  | 'OFFLINE' 
  | 'ERROR';

export type IDType = 'PhilID' | 'ePhilID';

export interface PersonalInfo {
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

export interface VerificationResult {
  status: VerificationStatus;
  data?: QRData;
  displayData?: PersonalInfo;
  message?: string;
  type: IDType;
}

export interface FingerMapping {
  [key: string]: string;
}

export const FINGER_MAPPING: FingerMapping = {
  "7": "Left Index Finger",
  "8": "Left Middle Finger", 
  "9": "Left Ring Finger",
  "10": "Left Little Finger",
  "6": "Left Thumb",
  "2": "Right Index Finger",
  "3": "Right Middle Finger",
  "4": "Right Ring Finger", 
  "5": "Right Little Finger",
  "1": "Right Thumb",
};

export const MONTH_NAMES = {
  '01': 'January', '02': 'February', '03': 'March', '04': 'April', 
  '05': 'May', '06': 'June', '07': 'July', '08': 'August', 
  '09': 'September', '10': 'October', '11': 'November', '12': 'December'
};
