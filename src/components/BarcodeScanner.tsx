import { useCallback, useEffect, useRef, useState } from 'react';
import { Html5Qrcode, Html5QrcodeSupportedFormats } from 'html5-qrcode';

const FORMATOS_BARRAS = [
  Html5QrcodeSupportedFormats.EAN_13,
  Html5QrcodeSupportedFormats.EAN_8,
  Html5QrcodeSupportedFormats.UPC_A,
  Html5QrcodeSupportedFormats.UPC_E,
  Html5QrcodeSupportedFormats.CODE_128,
  Html5QrcodeSupportedFormats.CODE_39,
  Html5QrcodeSupportedFormats.CODE_93,
  Html5QrcodeSupportedFormats.ITF,
  Html5QrcodeSupportedFormats.QR_CODE,
];

interface Props {
  onScan: (code: string) => void;
  onClose: () => void;
}

export function BarcodeScanner({ onScan, onClose }: Props) {
  const [error, setError] = useState<string | null>(null);
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const scannedRef = useRef(false);
  const cerrandoRef = useRef(false);

  const detenerCamara = useCallback(async () => {
    const scanner = scannerRef.current;
    if (!scanner) return;
    try {
      if (scanner.isScanning) {
        await scanner.stop();
      }
      scanner.clear();
    } catch {
      // La cámara ya pudo haberse detenido
    }
  }, []);

  const handleClose = useCallback(async () => {
    if (cerrandoRef.current) return;
    cerrandoRef.current = true;
    await detenerCamara();
    onClose();
  }, [detenerCamara, onClose]);

  useEffect(() => {
    const scannerId = 'barcode-scanner-region';
    const scanner = new Html5Qrcode(scannerId, { formatsToSupport: FORMATOS_BARRAS });
    scannerRef.current = scanner;

    const config = {
      fps: 10,
      qrbox: { width: 280, height: 120 },
      aspectRatio: 1.0,
    };

    scanner
      .start(
        { facingMode: 'environment' },
        config,
        (decodedText) => {
          if (scannedRef.current || cerrandoRef.current) return;
          scannedRef.current = true;
          detenerCamara().then(() => onScan(decodedText));
        },
        () => {}
      )
      .catch((err) => {
        setError('No se pudo acceder a la cámara. Verifica los permisos.');
        console.error(err);
      });

    return () => {
      detenerCamara();
    };
  }, [onScan, detenerCamara]);

  return (
    <div className="scanner-overlay" onClick={handleClose}>
      <div className="scanner-modal" onClick={(e) => e.stopPropagation()}>
        <button
          type="button"
          className="scanner-close-btn"
          onClick={handleClose}
          aria-label="Cerrar cámara"
        >
          ✕
        </button>

        <div className="scanner-header">
          <h3>Escanear código de barras</h3>
        </div>

        {error ? (
          <p className="error-text">{error}</p>
        ) : (
          <div id="barcode-scanner-region" className="scanner-region" />
        )}

        <p className="scanner-hint">Apunta la cámara al código de barras del producto</p>

        <button type="button" className="btn secondary scanner-cancel-btn" onClick={handleClose}>
          Cerrar cámara
        </button>
      </div>
    </div>
  );
}
