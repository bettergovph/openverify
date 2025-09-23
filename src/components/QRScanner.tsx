'use client';

import { useEffect, useRef, useState } from 'react';
import { Html5QrcodeScanner, Html5QrcodeScanType } from 'html5-qrcode';
import { Camera, Smartphone, Loader2 } from 'lucide-react';

interface QRScannerProps {
  onScanSuccess: (decodedText: string) => void;
  onScanError?: (error: string) => void;
  isScanning: boolean;
  onToggleScanning: () => void;
}

export default function QRScanner({ 
  onScanSuccess, 
  onScanError, 
  isScanning, 
  onToggleScanning 
}: QRScannerProps) {
  const scannerRef = useRef<Html5QrcodeScanner | null>(null);
  const [scanMode, setScanMode] = useState<'camera' | 'input' | null>(null);
  const [manualInput, setManualInput] = useState('');
  const [isMobile, setIsMobile] = useState(false);

  // Detect mobile device
  useEffect(() => {
    const checkMobile = () => {
      const userAgent = navigator.userAgent;
      const mobileRegex = /(android|bb\d+|meego).+mobile|avantgo|bada\/|blackberry|blazer|compal|elaine|fennec|hiptop|iemobile|ip(hone|od)|ipad|iris|kindle|Android|Silk|lge |maemo|midp|mmp|netfront|opera m(ob|in)i|palm( os)?|phone|p(ixi|re)\/|plucker|pocket|psp|series(4|6)0|symbian|treo|up\.(browser|link)|vodafone|wap|windows (ce|phone)|xda|xiino/i;
      const mobileRegex2 = /1207|6310|6590|3gso|4thp|50[1-6]i|770s|802s|a wa|abac|ac(er|oo|s\-)|ai(ko|rn)|al(av|ca|co)|amoi|an(ex|ny|yw)|aptu|ar(ch|go)|as(te|us)|attw|au(di|\-m|r |s )|avan|be(ck|ll|nq)|bi(lb|rd)|bl(ac|az)|br(e|v)w|bumb|bw\-(n|u)|c55\/|capi|ccwa|cdm\-|cell|chtm|cldc|cmd\-|co(mp|nd)|craw|da(it|ll|ng)|dbte|dc\-s|devi|dica|dmob|do(c|p)o|ds(12|\-d)|el(49|ai)|em(l2|ul)|er(ic|k0)|esl8|ez([4-7]0|os|wa|ze)|fetc|fly(\-|_)|g1 u|g560|gene|gf\-5|g\-mo|go(\.w|od)|gr(ad|un)|haie|hcit|hd\-(m|p|t)|hei\-|hi(pt|ta)|hp( i|ip)|hs\-c|ht(c(\-| |_|a|g|p|s|t)|tp)|hu(aw|tc)|i\-(20|go|ma)|i230|iac( |\-|\/)|ibro|idea|ig01|ikom|im1k|inno|ipaq|iris|ja(t|v)a|jbro|jemu|jigs|kddi|keji|kgt( |\/)|klon|kpt |kwc\-|kyo(c|k)|le(no|xi)|lg( g|\/(k|l|u)|50|54|\-[a-w])|libw|lynx|m1\-w|m3ga|m50\/|ma(te|ui|xo)|mc(01|21|ca)|m\-cr|me(rc|ri)|mi(o8|oa|ts)|mmef|mo(01|02|bi|de|do|t(\-| |o|v)|zz)|mt(50|p1|v )|mwbp|mywa|n10[0-2]|n20[2-3]|n30(0|2)|n50(0|2|5)|n7(0(0|1)|10)|ne((c|m)\-|on|tf|wf|wg|wt)|nok(6|i)|nzph|o2im|op(ti|wv)|oran|owg1|p800|pan(a|d|t)|pdxg|pg(13|\-([1-8]|c))|phil|pire|pl(ay|uc)|pn\-2|po(ck|rt|se)|prox|psio|pt\-g|qa\-a|qc(07|12|21|32|60|\-[2-7]|i\-)|qtek|r380|r600|raks|rim9|ro(ve|zo)|s55\/|sa(ge|ma|mm|ms|ny|va)|sc(01|h\-|oo|p\-)|sdk\/|se(c(\-|0|1)|47|mc|nd|ri)|sgh\-|shar|sie(\-|m)|sk\-0|sl(45|id)|sm(al|ar|b3|it|t5)|so(ft|ny)|sp(01|h\-|v\-|v )|sy(01|mb)|t2(18|50)|t6(00|10|18)|ta(gt|lk)|tcl\-|tdg\-|tel(i|m)|tim\-|t\-mo|to(pl|sh)|ts(70|m\-|m3|m5)|tx\-9|up(\.b|g1|si)|utst|v400|v750|veri|vi(rg|te)|vk(40|5[0-3]|\-v)|vm40|voda|vulc|vx(52|53|60|61|70|80|81|83|85|98)|w3c(\-| )|webc|whit|wi(g |nc|nw)|wmlb|wonu|x700|yas\-|your|zeto|zte\-/i;
      
      setIsMobile(mobileRegex.test(userAgent) || mobileRegex2.test(userAgent.substr(0, 4)));
    };

    checkMobile();
  }, []);

  // Initialize scanner when camera mode is selected
  useEffect(() => {
    if (scanMode === 'camera' && isScanning) {
      initializeScanner();
    }

    return () => {
      if (scannerRef.current) {
        scannerRef.current.clear().catch(console.error);
        scannerRef.current = null;
      }
    };
  }, [scanMode, isScanning]);

  const initializeScanner = () => {
    if (scannerRef.current) {
      scannerRef.current.clear().catch(console.error);
    }

    const applyScannerTheme = () => {
      const container = document.getElementById('qr-reader');
      if (!container) {
        return;
      }

      container.classList.add('philsys-scanner');

      const dashboard = document.getElementById('qr-reader__dashboard_section');
      if (dashboard) {
        dashboard.classList.add('philsys-scanner__dashboard');
      }

      const status = document.getElementById('qr-reader__status_span');
      if (status) {
        status.classList.add('philsys-scanner__status');
      }

      const cameraButtons = container.querySelectorAll('button');
      cameraButtons.forEach((button) => {
        button.classList.add('philsys-scanner__button');
      });
    };

    const scanner = new Html5QrcodeScanner(
      "qr-reader",
      {
        fps: 350,
        qrbox: 250,
        rememberLastUsedCamera: true,
        supportedScanTypes: [Html5QrcodeScanType.SCAN_TYPE_CAMERA]
      },
      false
    );

    scanner.render(
      (decodedText) => {
        scanner.clear().catch(console.error);
        onScanSuccess(decodedText);
        setScanMode(null);
      },
      (error) => {
        if (onScanError) {
          onScanError(error);
        }
      }
    );

    // Apply design theming after html5-qrcode injects elements
    requestAnimationFrame(() => applyScannerTheme());

    scannerRef.current = scanner;
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (manualInput.trim()) {
      onScanSuccess(manualInput.trim());
      setManualInput('');
      setScanMode(null);
    }
  };

  const handleScanModeSelect = (mode: 'camera' | 'input') => {
    setScanMode(mode);
    if (mode === 'camera') {
      onToggleScanning();
    }
  };

  if (!isScanning && scanMode === null) {
    return (
      <div className="flex flex-col gap-6">
        <h2 className="text-base font-semibold uppercase tracking-wide text-blue-100">Select Scanning Mode</h2>
        <div className="flex flex-col gap-4">
          <button
            onClick={() => handleScanModeSelect('camera')}
            className="flex items-center justify-center gap-3 border border-[var(--border)] bg-[var(--surface-muted)] px-4 py-3 text-sm font-semibold uppercase tracking-wide text-[var(--foreground)] hover:bg-[var(--primary-strong)] hover:text-white"
          >
            <Camera className="h-5 w-5" />
            Camera Scanner
          </button>
          <button
            onClick={() => handleScanModeSelect('input')}
            className="flex items-center justify-center gap-3 border border-[var(--border)] bg-[var(--surface-muted)] px-4 py-3 text-sm font-semibold uppercase tracking-wide text-[var(--foreground)] hover:bg-[var(--primary-strong)] hover:text-white"
          >
            <Smartphone className="h-5 w-5" />
            Manual Input
          </button>
        </div>
      </div>
    );
  }

  if (scanMode === 'camera') {
    return (
      <div className="flex flex-col gap-4">
        <h2 className="text-base font-semibold uppercase tracking-wide text-blue-100">Scan QR Code</h2>
        <div id="qr-reader" className="w-full"></div>
        <button
          onClick={() => {
            setScanMode(null);
            onToggleScanning();
          }}
          className="self-start border border-[var(--border)] bg-[var(--surface-muted)] px-4 py-2 text-sm font-semibold uppercase tracking-wide text-[var(--foreground)] hover:bg-[var(--primary-strong)] hover:text-white"
        >
          Cancel
        </button>
      </div>
    );
  }

  if (scanMode === 'input') {
    return (
      <div className="flex flex-col gap-4">
        <h2 className="text-base font-semibold uppercase tracking-wide text-blue-100">Enter QR Data</h2>
        <form onSubmit={handleManualSubmit} className="flex flex-col gap-4">
          <textarea
            value={manualInput}
            onChange={(e) => setManualInput(e.target.value)}
            placeholder="Paste or type QR code data here..."
            className="h-36 w-full border border-[var(--border)] bg-[var(--background)] p-3 text-sm text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
            autoFocus
          />
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={!manualInput.trim()}
              className="flex-1 border border-[var(--border)] bg-[var(--primary)] px-4 py-2 text-sm font-semibold uppercase tracking-wide text-white disabled:opacity-40"
            >
              Verify
            </button>
            <button
              type="button"
              onClick={() => setScanMode(null)}
              className="border border-[var(--border)] bg-[var(--surface-muted)] px-4 py-2 text-sm font-semibold uppercase tracking-wide text-[var(--foreground)] hover:bg-[var(--primary-strong)] hover:text-white"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center py-10">
      <Loader2 className="h-6 w-6 animate-spin text-[var(--accent)]" />
    </div>
  );
}
