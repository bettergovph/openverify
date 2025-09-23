import { EPhilID, PhilIDLegacy, PersonalInfo, FINGER_MAPPING, MONTH_NAMES } from '../types';

/**
 * Formats readable date from YYYY-MM-DD format
 */
export function monthReadable(dateString: string): string {
  const dateSplit = dateString.split("-");
  if (dateSplit.length !== 3) return dateString;
  
  const month = dateSplit[1] as keyof typeof MONTH_NAMES;
  const monthName = MONTH_NAMES[month] || month;
  
  return `${monthName} ${dateSplit[2]}, ${dateSplit[0]}`;
}

/**
 * Formats finger data for display
 */
export function formatFingerData(fingerData: string): string {
  if (!fingerData) return 'Best capture finger not detected.';
  
  try {
    const fingerObj = JSON.parse(fingerData);
    if (Array.isArray(fingerObj) && fingerObj.length >= 2) {
      const finger1 = FINGER_MAPPING[fingerObj[0]] || 'Unknown';
      const finger2 = FINGER_MAPPING[fingerObj[1]] || 'Unknown';
      return `${finger1}, ${finger2}`;
    }
  } catch (err) {
    console.error('Error parsing finger data:', err);
  }
  
  return 'Best capture finger not detected.';
}

/**
 * Formats text display for ePhilID
 */
export function formatTextDisplay(objVal: EPhilID): PersonalInfo {
  const dateIssued = objVal.d || 'Not Printed';
  const finger = formatFingerData(objVal.sb.BF);
  const readableDate = monthReadable(objVal.sb.DOB);
  
  return {
    image: objVal.img,
    lastName: objVal.sb.ln,
    firstName: objVal.sb.fn,
    middleName: objVal.sb.mn,
    suffix: objVal.sb.sf,
    sex: objVal.sb.s,
    dateOfBirth: readableDate,
    placeOfBirth: objVal.sb.POB,
    pcn: objVal.sb.PCN,
    dateOfIssuance: dateIssued,
    bestCaptureFinger: finger
  };
}

/**
 * Formats text display for legacy PhilID
 */
export function formatTextDisplayLegacy(objVal: PhilIDLegacy): PersonalInfo {
  const dateIssued = objVal.DateIssued || 'Not Printed';
  const finger = formatFingerData(objVal.subject.BF);
  
  return {
    image: '', // Legacy format doesn't include image
    lastName: objVal.subject.lName,
    firstName: objVal.subject.fName,
    middleName: objVal.subject.mName,
    suffix: objVal.subject.Suffix,
    sex: objVal.subject.sex,
    dateOfBirth: objVal.subject.DOB,
    placeOfBirth: objVal.subject.POB,
    pcn: objVal.subject.PCN,
    dateOfIssuance: dateIssued,
    bestCaptureFinger: finger
  };
}

/**
 * Formats display data for both formats
 */
export function formatDisplayData(data: EPhilID | PhilIDLegacy, isLegacy: boolean = false): PersonalInfo {
  if (isLegacy) {
    return formatTextDisplayLegacy(data as PhilIDLegacy);
  } else {
    return formatTextDisplay(data as EPhilID);
  }
}
