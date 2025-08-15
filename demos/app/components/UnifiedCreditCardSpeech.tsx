"use client";

import { useState, useRef, useEffect } from "react";
import { Mic, MicOff, Loader2, CreditCard, Calendar, Lock, Camera, CameraOff } from "lucide-react";

interface UnifiedCreditCardSpeechProps {
  onCardNumberChange: (value: string) => void;
  onExpiryChange: (value: string) => void;
  onCvvChange: (value: string) => void;
  cardNumber: string;
  expiry: string;
  cvv: string;
}

type FieldType = "cardNumber" | "expiry" | "cvv" | "listening";

export function UnifiedCreditCardSpeech({
  onCardNumberChange,
  onExpiryChange,
  onCvvChange,
  cardNumber,
  expiry,
  cvv,
}: UnifiedCreditCardSpeechProps) {
  const [isListening, setIsListening] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [isCapturing, setIsCapturing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentField, setCurrentField] = useState<FieldType>("listening");
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const startRecording = async () => {
    try {
      setError(null);
      setCurrentField("listening");
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: "audio/webm;codecs=opus",
      });

      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        setIsProcessing(true);
        try {
          const audioBlob = new Blob(audioChunksRef.current, { type: "audio/webm" });
          await sendAudioToGemini(audioBlob);
        } catch (err) {
          setError(err instanceof Error ? err.message : "Failed to process audio");
        } finally {
          setIsProcessing(false);
        }
      };

      mediaRecorder.start();
      setIsListening(true);
    } catch (err) {
      setError("Failed to access microphone");
      console.error("Error starting recording:", err);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isListening) {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current.stream.getTracks().forEach((track) => track.stop());
      setIsListening(false);
    }
  };

  const sendAudioToGemini = async (audioBlob: Blob) => {
    const formData = new FormData();
    formData.append("audio", audioBlob, "recording.webm");

    const response = await fetch("/api/speech-to-text", {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();

    if (data.text) {
      processTranscript(data.text);
    } else {
      throw new Error("No transcript received");
    }
  };

  const processTranscript = (transcript: string) => {
    console.log("Processing transcript:", transcript);

    // Extract all digits from the transcript
    const allDigits = transcript.replace(/\D/g, "");
    console.log("All digits extracted:", allDigits);

    // More flexible parsing: look for patterns
    let cardNumberDigits = "";
    let expiryDigits = "";
    let cvvDigits = "";

    // Try to find card number (13-16 digits)
    if (allDigits.length >= 13) {
      // Look for a sequence of 13-16 digits
      const cardMatch = allDigits.match(/(\d{13,16})/);
      if (cardMatch) {
        cardNumberDigits = cardMatch[1];
        console.log("Found card number:", cardNumberDigits);
      }
    }

    // Try to find expiry (4 digits, typically after card number)
    const remainingDigits = allDigits.replace(cardNumberDigits, "");
    console.log("Remaining digits after card number:", remainingDigits);

    if (remainingDigits.length >= 4) {
      expiryDigits = remainingDigits.slice(0, 4);
      console.log("Found expiry:", expiryDigits);
    } else {
      console.log("Not enough remaining digits for expiry. Need 4, got:", remainingDigits.length);
    }

    // Try to find CVV (3-4 digits, typically at the end)
    const cvvRemaining = remainingDigits.replace(expiryDigits, "");
    if (cvvRemaining.length >= 3) {
      cvvDigits = cvvRemaining.slice(0, 4);
      console.log("Found CVV:", cvvDigits);
    }

    console.log("Final parsed digits:", {
      cardNumber: cardNumberDigits,
      expiry: expiryDigits,
      cvv: cvvDigits,
      totalLength: allDigits.length,
    });

    // Process and update fields
    if (cardNumberDigits && cardNumberDigits.length >= 13) {
      const formattedCardNumber = cardNumberDigits.replace(/(\d{4})(?=\d)/g, "$1 ");
      console.log("Setting card number:", formattedCardNumber);
      onCardNumberChange(formattedCardNumber);
      setCurrentField("cardNumber");
    }

    if (expiryDigits && expiryDigits.length === 4) {
      const formattedExpiry = expiryDigits.slice(0, 2) + "/" + expiryDigits.slice(2, 4);
      console.log("Setting expiry:", formattedExpiry);
      onExpiryChange(formattedExpiry);
      setCurrentField("expiry");
    } else {
      console.log("Expiry not set. Digits:", expiryDigits, "Length:", expiryDigits.length);
    }

    if (cvvDigits && cvvDigits.length >= 3) {
      const formattedCvv = cvvDigits.slice(0, 4);
      console.log("Setting CVV:", formattedCvv);
      onCvvChange(formattedCvv);
      setCurrentField("cvv");
    }

    // Reset current field after processing
    setTimeout(() => setCurrentField("listening"), 2000);
  };

  const toggleRecording = () => {
    if (isListening) {
      stopRecording();
    } else {
      startRecording();
    }
  };

  const startCamera = async () => {
    try {
      setError(null);
      setCurrentField("listening");

      // Try different camera constraints for better compatibility
      let stream;

      try {
        // First try with back camera (ideal for card scanning)
        const backCameraConstraints = {
          video: {
            facingMode: { exact: "environment" },
            width: { ideal: 1280, min: 640 },
            height: { ideal: 720, min: 480 },
          },
        };

        console.log("Requesting back camera access...");
        stream = await navigator.mediaDevices.getUserMedia(backCameraConstraints);
      } catch {
        console.log("Back camera not available, trying front camera...");

        try {
          // Try front camera
          const frontCameraConstraints = {
            video: {
              facingMode: "user",
              width: { ideal: 1280, min: 640 },
              height: { ideal: 720, min: 480 },
            },
          };

          stream = await navigator.mediaDevices.getUserMedia(frontCameraConstraints);
        } catch {
          console.log("Front camera failed, trying basic video...");

          // Last resort - just ask for any video
          stream = await navigator.mediaDevices.getUserMedia({ video: true });
        }
      }

      console.log("Camera stream received:", stream);

      streamRef.current = stream;
      setIsCameraActive(true);

      // Small delay to ensure video element is rendered
      setTimeout(() => {
        if (videoRef.current && stream) {
          console.log("Setting video source...");
          console.log("Video element:", videoRef.current);
          console.log("Stream tracks:", stream.getTracks());

          videoRef.current.srcObject = stream;

          // Add event listeners for debugging
          videoRef.current.onloadedmetadata = () => {
            console.log("Video metadata loaded, dimensions:", {
              videoWidth: videoRef.current!.videoWidth,
              videoHeight: videoRef.current!.videoHeight,
            });
            videoRef.current!.play().catch((e) => console.error("Play failed:", e));
          };

          videoRef.current.oncanplay = () => {
            console.log("Video can play");
          };

          videoRef.current.onplaying = () => {
            console.log("Video is playing");
          };

          videoRef.current.onerror = (e) => {
            console.error("Video error:", e);
            setError("Failed to load camera stream");
          };

          // Force play the video
          videoRef.current.play().catch((e) => {
            console.error("Initial play failed:", e);
            setError("Failed to start video playback");
          });
        }
      }, 100);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to access camera";
      setError(errorMessage);
      console.error("Error starting camera:", err);
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }

    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }

    setIsCameraActive(false);
  };

  const capturePhoto = async () => {
    if (!videoRef.current || !canvasRef.current) return;

    setIsCapturing(true);
    setIsProcessing(true);

    try {
      const canvas = canvasRef.current;
      const video = videoRef.current;
      const context = canvas.getContext("2d");

      if (!context) throw new Error("Could not get canvas context");

      // Set canvas dimensions to match video
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;

      // Draw the current video frame to canvas
      context.drawImage(video, 0, 0, canvas.width, canvas.height);

      // Convert canvas to blob
      const blob = await new Promise<Blob>((resolve) => {
        canvas.toBlob(
          (blob) => {
            if (blob) resolve(blob);
          },
          "image/jpeg",
          0.8
        );
      });

      if (!blob) throw new Error("Failed to capture image");

      await sendImageToOCR(blob);

      // Stop camera after successful capture
      stopCamera();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to capture photo");
    } finally {
      setIsCapturing(false);
      setIsProcessing(false);
    }
  };

  const sendImageToOCR = async (imageBlob: Blob) => {
    const formData = new FormData();
    formData.append("image", imageBlob, "card.jpg");

    const response = await fetch("/api/card-ocr", {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();

    console.log("OCR API Response:", data);

    if (data.cardData) {
      console.log("Card data found:", data.cardData);
      processOCRData(data.cardData);
    } else {
      console.log("No cardData in response:", data);
      throw new Error("No card data received from OCR");
    }
  };

  const processOCRData = (cardData: { cardNumber?: string; expiry?: string; cvv?: string }) => {
    console.log("Processing OCR data:", cardData);
    console.log("Available onChange handlers:", {
      onCardNumberChange: typeof onCardNumberChange,
      onExpiryChange: typeof onExpiryChange,
      onCvvChange: typeof onCvvChange,
    });

    if (cardData.cardNumber) {
      const formattedCardNumber = cardData.cardNumber.replace(/(\d{4})(?=\d)/g, "$1 ");
      console.log("Setting card number from OCR:", formattedCardNumber);
      console.log("Calling onCardNumberChange...");
      onCardNumberChange(formattedCardNumber);
      setCurrentField("cardNumber");
    } else {
      console.log("No card number in OCR data");
    }

    if (cardData.expiry) {
      console.log("Setting expiry from OCR:", cardData.expiry);
      console.log("Calling onExpiryChange...");
      onExpiryChange(cardData.expiry);
      setCurrentField("expiry");
    } else {
      console.log("No expiry in OCR data");
    }

    if (cardData.cvv) {
      console.log("Setting CVV from OCR:", cardData.cvv);
      console.log("Calling onCvvChange...");
      onCvvChange(cardData.cvv);
      setCurrentField("cvv");
    } else {
      console.log("No CVV in OCR data");
    }

    // Reset current field after processing
    setTimeout(() => setCurrentField("listening"), 2000);
  };

  const toggleCamera = () => {
    if (isCameraActive) {
      stopCamera();
    } else {
      startCamera();
    }
  };

  useEffect(() => {
    return () => {
      if (mediaRecorderRef.current) {
        mediaRecorderRef.current.stream.getTracks().forEach((track) => track.stop());
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  const getFieldStatus = (fieldType: FieldType) => {
    if (currentField === fieldType) {
      return "bg-blue-100 border-blue-500 text-blue-700";
    }
    return "bg-gray-50 border-gray-200 text-gray-600";
  };

  return (
    <div className="space-y-4">
      {/* Input Method Controls */}
      <div className="flex flex-col gap-4 p-4 bg-gray-50 rounded-lg">
        {/* Voice and Camera Controls */}
        <div className="flex items-center justify-center gap-4">
          <button
            type="button"
            onClick={toggleRecording}
            disabled={isProcessing || isCameraActive}
            className={`p-4 rounded-full transition-all ${
              isListening
                ? "bg-red-500 text-white hover:bg-red-600 shadow-lg"
                : "bg-blue-500 text-white hover:bg-blue-600 shadow-lg"
            } ${isProcessing || isCameraActive ? "opacity-50 cursor-not-allowed" : ""}`}
            title={isListening ? "Stop recording" : "Start recording all fields"}
          >
            {isProcessing && !isCapturing ? (
              <Loader2 className="w-6 h-6 animate-spin" />
            ) : isListening ? (
              <MicOff className="w-6 h-6" />
            ) : (
              <Mic className="w-6 h-6" />
            )}
          </button>
          <div className="text-center flex-1">
            <div className="font-medium">
              {isListening
                ? "Listening..."
                : isCapturing
                ? "Capturing..."
                : isProcessing
                ? "Processing..."
                : isCameraActive
                ? "Camera ready - position card and capture"
                : "Choose input method"}
            </div>
            {!isCameraActive && (
              <div className="text-sm text-gray-500">Voice: Say card number, expiry, and CVV in sequence</div>
            )}
          </div>
          <button
            type="button"
            onClick={toggleCamera}
            disabled={isProcessing || isListening}
            className={`p-4 rounded-full transition-all ${
              isCameraActive
                ? "bg-green-500 text-white hover:bg-green-600 shadow-lg"
                : "bg-purple-500 text-white hover:bg-purple-600 shadow-lg"
            } ${isProcessing || isListening ? "opacity-50 cursor-not-allowed" : ""}`}
            title={isCameraActive ? "Close camera" : "Open camera to scan card"}
          >
            {isCameraActive ? <CameraOff className="w-6 h-6" /> : <Camera className="w-6 h-6" />}
          </button>
        </div>

        {/* Camera Preview and Capture */}
        {isCameraActive && (
          <div className="relative bg-black rounded-lg overflow-hidden min-h-64">
            <video
              ref={videoRef}
              className="w-full h-64 object-cover"
              autoPlay
              playsInline
              muted
              controls={false}
              style={{
                backgroundColor: "#000",
                minHeight: "256px",
                display: "block",
              }}
            />
            <canvas ref={canvasRef} className="hidden" />

            {/* Card positioning guide */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="border-2 border-white border-dashed rounded-lg w-80 h-48 flex items-center justify-center">
                <span className="text-white text-sm bg-black bg-opacity-50 px-2 py-1 rounded">Position card here</span>
              </div>
            </div>

            {/* Debug info for camera stream */}
            <div className="absolute top-2 left-2 text-white text-xs bg-black bg-opacity-50 px-2 py-1 rounded">
              Camera: {streamRef.current ? "Active" : "Inactive"}
              {videoRef.current && (
                <div>
                  Video: {videoRef.current.videoWidth}x{videoRef.current.videoHeight}
                  <br />
                  Ready: {videoRef.current.readyState}
                </div>
              )}
            </div>

            <button
              onClick={capturePhoto}
              disabled={isCapturing || isProcessing}
              className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-white text-black p-3 rounded-full shadow-lg hover:bg-gray-100 disabled:opacity-50"
              title="Capture card image"
            >
              {isCapturing ? <Loader2 className="w-6 h-6 animate-spin" /> : <Camera className="w-6 h-6" />}
            </button>
          </div>
        )}
      </div>

      {/* Field Status Indicators */}
      <div className="grid grid-cols-3 gap-3">
        <div className={`flex items-center gap-2 p-3 rounded-lg border-2 transition-all ${getFieldStatus("cardNumber")}`}>
          <CreditCard className="w-4 h-4" />
          <div className="flex-1">
            <div className="text-sm font-medium">Card Number</div>
            {cardNumber && <div className="text-xs text-gray-600 truncate">{cardNumber}</div>}
          </div>
          {currentField === "cardNumber" && <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>}
        </div>

        <div className={`flex items-center gap-2 p-3 rounded-lg border-2 transition-all ${getFieldStatus("expiry")}`}>
          <Calendar className="w-4 h-4" />
          <div className="flex-1">
            <div className="text-sm font-medium">Expiry</div>
            {expiry && <div className="text-xs text-gray-600">{expiry}</div>}
          </div>
          {currentField === "expiry" && <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>}
        </div>

        <div className={`flex items-center gap-2 p-3 rounded-lg border-2 transition-all ${getFieldStatus("cvv")}`}>
          <Lock className="w-4 h-4" />
          <div className="flex-1">
            <div className="text-sm font-medium">CVV</div>
            {cvv && <div className="text-xs text-gray-600">{cvv}</div>}
          </div>
          {currentField === "cvv" && <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>}
        </div>
      </div>

      {/* Error Display */}
      {error && <div className="text-sm text-red-500 text-center">{error}</div>}
    </div>
  );
}
