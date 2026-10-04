import { useState, useEffect, useRef, useCallback } from 'react';
import { Html5Qrcode, Html5QrcodeSupportedFormats } from 'html5-qrcode';
import { soundService } from '../services/sound';

/**
 * Custom React hook wrapping html5-qrcode with production-grade stability,
 * StrictMode safety, dynamic camera switching, torch toggle, and debouncing.
 */
export function useScanner({ onScanSuccess, scannerElementId = 'reader' }) {
  const [isScanning, setIsScanning] = useState(false);
  const [isStarting, setIsStarting] = useState(false);
  const [cameras, setCameras] = useState([]);
  const [selectedCameraId, setSelectedCameraId] = useState(null);
  const [errorMessage, setErrorMessage] = useState(null);
  const [errorType, setErrorType] = useState(null); // 'PERMISSION' | 'NOT_FOUND' | 'IN_USE' | 'INSECURE' | 'GENERAL'
  const [torchAvailable, setTorchAvailable] = useState(false);
  const [torchOn, setTorchOn] = useState(false);
  const [flashFeedback, setFlashFeedback] = useState(null); // 'success' | 'duplicate'

  // Internal state tracking
  const html5QrCodeRef = useRef(null);
  const isMountedRef = useRef(true);
  const isTransitioningRef = useRef(false);
  const lastScannedCodeRef = useRef(null);
  const lastScannedTimeRef = useRef(0);
  const isPausedRef = useRef(false);

  // Check for HTTPS / secure context
  const checkSecureContext = () => {
    if (typeof window === 'undefined') return true;
    const isLocalhost = Boolean(
      window.location.hostname === 'localhost' ||
      window.location.hostname === '127.0.0.1' ||
      window.location.hostname.endsWith('.localhost')
    );
    return window.isSecureContext || isLocalhost;
  };

  /**
   * Enumerate available video devices
   */
  const loadCameras = useCallback(async () => {
    try {
      const devices = await Html5Qrcode.getCameras();
      if (devices && devices.length > 0) {
        setCameras(devices);
        // Find back / environment camera if possible
        const backCam = devices.find(d => 
          d.label.toLowerCase().includes('back') || 
          d.label.toLowerCase().includes('rear') ||
          d.label.toLowerCase().includes('environment')
        );
        setSelectedCameraId(backCam ? backCam.id : devices[0].id);
        return devices;
      } else {
        setCameras([]);
        setErrorType('NOT_FOUND');
        setErrorMessage('No camera hardware detected on this device.');
        return [];
      }
    } catch (err) {
      console.warn('Camera discovery error:', err);
      return [];
    }
  }, []);

  /**
   * Check if torch is supported on current video track
   */
  const checkTorchSupport = useCallback(() => {
    try {
      if (html5QrCodeRef.current && html5QrCodeRef.current.isScanning) {
        const capabilities = html5QrCodeRef.current.getRunningTrackCapabilities();
        if (capabilities && capabilities.torch) {
          setTorchAvailable(true);
          return true;
        }
      }
    } catch (e) {
      // Capability check might not be supported on all browsers
    }
    setTorchAvailable(false);
    return false;
  }, []);

  /**
   * Toggle Torch / Flashlight
   */
  const toggleTorch = useCallback(async () => {
    if (!html5QrCodeRef.current || !torchAvailable) return;
    try {
      const nextState = !torchOn;
      await html5QrCodeRef.current.applyVideoConstraints({
        advanced: [{ torch: nextState }]
      });
      setTorchOn(nextState);
    } catch (err) {
      console.warn('Torch toggle failed:', err);
    }
  }, [torchAvailable, torchOn]);

  /**
   * Trigger visual border flash on scanner frame
   */
  const triggerVisualFeedback = useCallback((type = 'success') => {
    setFlashFeedback(type);
    setTimeout(() => {
      if (isMountedRef.current) {
        setFlashFeedback(null);
      }
    }, 800);
  }, []);

  /**
   * Stop scanner safely
   */
  const stopScanner = useCallback(async () => {
    if (isTransitioningRef.current) return;
    isTransitioningRef.current = true;

    try {
      if (html5QrCodeRef.current) {
        if (html5QrCodeRef.current.isScanning) {
          await html5QrCodeRef.current.stop();
        }
        await html5QrCodeRef.current.clear();
      }
      if (isMountedRef.current) {
        setIsScanning(false);
        setTorchOn(false);
        setTorchAvailable(false);
      }
    } catch (err) {
      console.warn('Scanner stop error:', err);
    } finally {
      isTransitioningRef.current = false;
    }
  }, []);

  /**
   * Start scanning session
   */
  const startScanner = useCallback(async (overrideCameraId = null) => {
    if (isTransitioningRef.current) return;

    // Check secure context
    if (!checkSecureContext()) {
      setErrorType('INSECURE');
      setErrorMessage('Camera access requires HTTPS or localhost. Insecure HTTP contexts block camera access.');
      return;
    }

    isTransitioningRef.current = true;
    setIsStarting(true);
    setErrorMessage(null);
    setErrorType(null);

    try {
      // If already scanning, stop first
      if (html5QrCodeRef.current && html5QrCodeRef.current.isScanning) {
        await html5QrCodeRef.current.stop();
        await html5QrCodeRef.current.clear();
      }

      // Initialize Html5Qrcode instance if needed
      if (!html5QrCodeRef.current) {
        html5QrCodeRef.current = new Html5Qrcode(scannerElementId, {
          formatsToSupport: [
            Html5QrcodeSupportedFormats.CODE_128,
            Html5QrcodeSupportedFormats.CODE_39,
            Html5QrcodeSupportedFormats.EAN_13,
            Html5QrcodeSupportedFormats.EAN_8,
            Html5QrcodeSupportedFormats.UPC_A,
            Html5QrcodeSupportedFormats.ITF,
            Html5QrcodeSupportedFormats.CODABAR,
            Html5QrcodeSupportedFormats.QR_CODE
          ],
          verbose: false,
          experimentalFeatures: {
            useBarCodeDetectorIfSupported: true
          }
        });
      }

      // Configure scanning box suited for 1D barcodes and QR codes
      const qrboxFunction = (viewfinderWidth, viewfinderHeight) => {
        // Broad rectangular bounding box optimized for 1D student barcodes
        const boxWidth = Math.floor(viewfinderWidth * 0.82);
        const boxHeight = Math.max(160, Math.floor(viewfinderHeight * 0.40));
        return { width: boxWidth, height: boxHeight };
      };

      const scanConfig = {
        fps: 15,
        qrbox: qrboxFunction,
        aspectRatio: 1.7778, // 16:9 standard mobile sensor ratio
        videoConstraints: {
          facingMode: { ideal: "environment" },
          width: { ideal: 1280 },
          height: { ideal: 720 },
          focusMode: "continuous"
        }
      };

      const targetCamera = overrideCameraId || selectedCameraId || { facingMode: "environment" };

      // Success callback
      const onDecodeSuccess = (decodedText, decodedResult) => {
        const now = Date.now();
        const cleanText = decodedText.trim();

        // 1. Debounce same code for 5 seconds locally
        if (cleanText === lastScannedCodeRef.current && (now - lastScannedTimeRef.current) < 5000) {
          return;
        }

        // 2. Pause scanner briefly (1.5s) to prevent erratic multi-triggering
        if (isPausedRef.current) return;
        isPausedRef.current = true;
        lastScannedCodeRef.current = cleanText;
        lastScannedTimeRef.current = now;

        // Visual flash & Audio chime
        triggerVisualFeedback('success');
        soundService.playSuccess();

        if (onScanSuccess) {
          onScanSuccess(cleanText, decodedResult);
        }

        // Resume scanner after 1.8 seconds
        setTimeout(() => {
          isPausedRef.current = false;
        }, 1800);
      };

      // Error/failure callback (silent frame decode attempts)
      const onDecodeError = () => {
        // Frame did not contain valid barcode - ignore
      };

      await html5QrCodeRef.current.start(
        targetCamera,
        scanConfig,
        onDecodeSuccess,
        onDecodeError
      );

      if (isMountedRef.current) {
        setIsScanning(true);
        setTimeout(() => {
          checkTorchSupport();
        }, 600);
      }

    } catch (err) {
      console.error('Html5Qrcode start error:', err);
      const errStr = (err && (err.message || err.name || String(err))).toLowerCase();

      if (errStr.includes('permission') || errStr.includes('notallowederror')) {
        setErrorType('PERMISSION');
        setErrorMessage('Camera access was denied. Please allow camera permissions in your browser address bar.');
      } else if (errStr.includes('notfounderror') || errStr.includes('devices not found')) {
        setErrorType('NOT_FOUND');
        setErrorMessage('No camera device found on this system.');
      } else if (errStr.includes('notreadableerror') || errStr.includes('trackstarterror') || errStr.includes('in use')) {
        setErrorType('IN_USE');
        setErrorMessage('Camera is currently in use by another tab or application. Please close other camera apps.');
      } else {
        setErrorType('GENERAL');
        setErrorMessage(`Unable to initialize camera (${err.message || 'Unknown error'}). Try switching camera.`);
      }
      setIsScanning(false);
    } finally {
      if (isMountedRef.current) {
        setIsStarting(false);
      }
      isTransitioningRef.current = false;
    }
  }, [checkTorchSupport, onScanSuccess, scannerElementId, selectedCameraId, triggerVisualFeedback]);

  /**
   * Switch between available cameras
   */
  const switchCamera = useCallback(async (newCameraId) => {
    setSelectedCameraId(newCameraId);
    if (isScanning) {
      await stopScanner();
      await startScanner(newCameraId);
    }
  }, [isScanning, startScanner, stopScanner]);

  // Initial mount: load camera list
  useEffect(() => {
    isMountedRef.current = true;
    loadCameras();

    return () => {
      isMountedRef.current = false;
      if (html5QrCodeRef.current) {
        try {
          if (html5QrCodeRef.current.isScanning) {
            html5QrCodeRef.current.stop().catch(() => {});
          }
        } catch (_) {}
      }
    };
  }, [loadCameras]);

  return {
    isScanning,
    isStarting,
    cameras,
    selectedCameraId,
    errorMessage,
    errorType,
    torchAvailable,
    torchOn,
    flashFeedback,
    startScanner,
    stopScanner,
    switchCamera,
    toggleTorch,
    triggerVisualFeedback,
    retryCamera: () => startScanner(selectedCameraId)
  };
}
