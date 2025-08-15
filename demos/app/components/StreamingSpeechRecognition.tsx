"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Mic, MicOff } from "lucide-react";

// Type definitions for Web Speech API
interface ISpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start(): void;
  stop(): void;
  onstart: ((this: ISpeechRecognition, ev: Event) => void) | null;
  onend: ((this: ISpeechRecognition, ev: Event) => void) | null;
  onerror: ((this: ISpeechRecognition, ev: ISpeechRecognitionErrorEvent) => void) | null;
  onresult: ((this: ISpeechRecognition, ev: ISpeechRecognitionEvent) => void) | null;
}

interface ISpeechRecognitionErrorEvent extends Event {
  error: string;
}

interface ISpeechRecognitionEvent extends Event {
  resultIndex: number;
  results: ISpeechRecognitionResultList;
}

interface ISpeechRecognitionResultList {
  length: number;
  item(index: number): ISpeechRecognitionResult;
  [index: number]: ISpeechRecognitionResult;
}

interface ISpeechRecognitionResult {
  isFinal: boolean;
  length: number;
  item(index: number): ISpeechRecognitionAlternative;
  [index: number]: ISpeechRecognitionAlternative;
}

interface ISpeechRecognitionAlternative {
  transcript: string;
  confidence: number;
}

// Extend Window interface for speech recognition
declare global {
  interface Window {
    SpeechRecognition: new () => ISpeechRecognition;
    webkitSpeechRecognition: new () => ISpeechRecognition;
  }
}

interface StreamingSpeechRecognitionProps {
  onCardNumberChange: (value: string) => void;
  onExpiryChange: (value: string) => void;
  onCvvChange: (value: string) => void;
  onCurrentFieldChange: (field: "cardNumber" | "expiry" | "cvv" | "listening") => void;
}

export function StreamingSpeechRecognition({
  onCardNumberChange,
  onExpiryChange,
  onCvvChange,
  onCurrentFieldChange,
}: StreamingSpeechRecognitionProps) {
  const [isListening, setIsListening] = useState(false);
  const [isSupported, setIsSupported] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentTranscript, setCurrentTranscript] = useState("");
  const [fieldsStatus, setFieldsStatus] = useState({
    cardNumber: false,
    expiry: false,
    cvv: false,
  });
  const [restartCount, setRestartCount] = useState(0);
  const [isStarting, setIsStarting] = useState(false);

  const recognitionRef = useRef<ISpeechRecognition | null>(null);
  const currentFieldRef = useRef<"cardNumber" | "expiry" | "cvv">("cardNumber");
  const accumulatedDigitsRef = useRef({
    cardNumber: "",
    expiry: "",
    cvv: "",
  });
  const lastSpeechTimeRef = useRef<number>(0);
  const silenceTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Function to check if all fields have sufficient data
  const checkFieldsComplete = useCallback(() => {
    const accumulated = accumulatedDigitsRef.current;
    const isComplete = accumulated.cardNumber.length >= 13 && accumulated.expiry.length >= 4 && accumulated.cvv.length >= 3;
    console.log("🔍 Field completion check:", {
      cardNumber: `${accumulated.cardNumber.length}/13`,
      expiry: `${accumulated.expiry.length}/4`,
      cvv: `${accumulated.cvv.length}/3`,
      allComplete: isComplete,
    });
    return isComplete;
  }, []);

  // Function to start silence detection timer
  const startSilenceTimer = useCallback(() => {
    // Clear existing timer
    if (silenceTimerRef.current) {
      console.log("⏰ Clearing existing silence timer");
      clearTimeout(silenceTimerRef.current);
    }

    console.log("⏱️ Starting new 1-second silence timer, isListening:", isListening);

    // Set new timer for 1 second
    silenceTimerRef.current = setTimeout(() => {
      console.log("⏰ Silence timer fired! Checking conditions...");
      const fieldsComplete = checkFieldsComplete();
      console.log("🔍 Timer check - fieldsComplete:", fieldsComplete, "isListening:", isListening);

      if (fieldsComplete && isListening) {
        console.log("🤫 Silence detected with all fields complete - auto-stopping");
        setIsListening(false);
        if (recognitionRef.current) {
          recognitionRef.current.stop();
        }
      } else {
        console.log("❌ Timer fired but conditions not met:", { fieldsComplete, isListening });
      }
    }, 1000);
  }, [checkFieldsComplete, isListening]);

  const processStreamingTranscript = useCallback(
    (transcript: string) => {
      console.log("Processing streaming transcript:", transcript);

      // Record speech activity and reset silence timer
      lastSpeechTimeRef.current = Date.now();
      console.log("🗣️ Speech detected, resetting silence timer");

      // Extract all digits from the transcript
      const allDigits = transcript.replace(/\D/g, "");
      console.log("Extracted digits:", allDigits);

      // Progressive field filling - start filling immediately, get more progressive
      const accumulated = accumulatedDigitsRef.current;

      // Check if transcript specifically mentions CVV (for standalone CVV input)
      // Handle homonyms and common speech recognition errors for CVV
      const isCvvMention =
        /cvv|cbb|cvb|cbv|ccv|cvc|cbvv|cvbb|security code|security number|verification code|verification number|card verification|safety code/i.test(
          transcript
        );
      const isExpiryMention = /expiry|expire|exp|expiration|month|year|valid until|good until/i.test(transcript);
      const isCardMention = /card number|credit card|card|account number|number/i.test(transcript);

      if (isCvvMention && allDigits.length >= 3 && allDigits.length <= 4) {
        // Direct CVV input detected
        const cvvVariations = transcript.match(
          /cvv|cbb|cvb|cbv|ccv|cvc|cbvv|cvbb|security code|security number|verification code|verification number|card verification|safety code/i
        );
        console.log("Direct CVV input detected:", allDigits, "- heard as:", cvvVariations?.[0]);
        accumulated.cvv = allDigits;
        onCvvChange(allDigits);
        onCurrentFieldChange("cvv");
        console.log("Updated CVV (direct):", allDigits);

        setFieldsStatus((prev) => ({
          ...prev,
          cvv: allDigits.length >= 3,
        }));
      } else if (isExpiryMention && allDigits.length >= 2 && allDigits.length <= 4) {
        // Direct expiry input detected
        const expiryVariations = transcript.match(/expiry|expire|exp|expiration|month|year|valid until|good until/i);
        console.log("Direct expiry input detected:", allDigits, "- heard as:", expiryVariations?.[0]);
        accumulated.expiry = allDigits;
        const formattedExpiry =
          allDigits.length >= 4
            ? `${allDigits.slice(0, 2)}/${allDigits.slice(2)}`
            : allDigits.length >= 2
            ? `${allDigits.slice(0, 2)}${allDigits.length > 2 ? "/" + allDigits.slice(2) : ""}`
            : allDigits;
        onExpiryChange(formattedExpiry);
        onCurrentFieldChange("expiry");
        console.log("Updated expiry (direct):", formattedExpiry);

        setFieldsStatus((prev) => ({
          ...prev,
          expiry: allDigits.length >= 4,
        }));
      } else if (isCardMention && allDigits.length >= 13 && allDigits.length <= 16) {
        // Direct card number input detected
        const cardVariations = transcript.match(/card number|credit card|card|account number|number/i);
        console.log("Direct card number input detected:", allDigits, "- heard as:", cardVariations?.[0]);
        accumulated.cardNumber = allDigits;
        const formattedCardNumber = allDigits.replace(/(\d{4})(?=\d)/g, "$1 ");
        onCardNumberChange(formattedCardNumber);
        onCurrentFieldChange("cardNumber");
        console.log("Updated card number (direct):", formattedCardNumber);

        setFieldsStatus((prev) => ({
          ...prev,
          cardNumber: allDigits.length >= 13,
        }));
      } else if (allDigits.length <= 16) {
        // Card number phase - fill as we get digits
        if (allDigits.length > accumulated.cardNumber.length) {
          accumulated.cardNumber = allDigits;
          const formattedCardNumber = allDigits.replace(/(\d{4})(?=\d)/g, "$1 ");
          onCardNumberChange(formattedCardNumber);
          onCurrentFieldChange("cardNumber");
          console.log("Updated card number:", formattedCardNumber);

          setFieldsStatus((prev) => ({
            ...prev,
            cardNumber: allDigits.length >= 13,
          }));
        }
      } else if (allDigits.length <= 20) {
        // Expiry phase - card + expiry
        const cardDigits = allDigits.slice(0, 16);
        const expiryDigits = allDigits.slice(16);

        // Update card if changed
        if (cardDigits !== accumulated.cardNumber) {
          accumulated.cardNumber = cardDigits;
          const formattedCardNumber = cardDigits.replace(/(\d{4})(?=\d)/g, "$1 ");
          onCardNumberChange(formattedCardNumber);
        }

        // Update expiry
        if (expiryDigits.length > 0 && expiryDigits !== accumulated.expiry) {
          accumulated.expiry = expiryDigits;
          const formattedExpiry =
            expiryDigits.length >= 2
              ? `${expiryDigits.slice(0, 2)}${expiryDigits.length > 2 ? "/" + expiryDigits.slice(2) : ""}`
              : expiryDigits;
          onExpiryChange(formattedExpiry);
          onCurrentFieldChange("expiry");
          console.log("Updated expiry:", formattedExpiry);
        }

        setFieldsStatus({
          cardNumber: true,
          expiry: expiryDigits.length >= 4,
          cvv: false,
        });
      } else {
        // CVV phase - card + expiry + cvv
        const cardDigits = allDigits.slice(0, 16);
        const expiryDigits = allDigits.slice(16, 20);
        const cvvDigits = allDigits.slice(20);

        // Update card if changed
        if (cardDigits !== accumulated.cardNumber) {
          accumulated.cardNumber = cardDigits;
          const formattedCardNumber = cardDigits.replace(/(\d{4})(?=\d)/g, "$1 ");
          onCardNumberChange(formattedCardNumber);
        }

        // Update expiry if changed
        if (expiryDigits !== accumulated.expiry) {
          accumulated.expiry = expiryDigits;
          const formattedExpiry = `${expiryDigits.slice(0, 2)}/${expiryDigits.slice(2)}`;
          onExpiryChange(formattedExpiry);
        }

        // Update CVV
        if (cvvDigits.length > 0 && cvvDigits !== accumulated.cvv) {
          accumulated.cvv = cvvDigits;
          onCvvChange(cvvDigits);
          onCurrentFieldChange("cvv");
          console.log("Updated CVV:", cvvDigits);
        }

        const newStatus = {
          cardNumber: true,
          expiry: true,
          cvv: cvvDigits.length >= 3,
        };
        setFieldsStatus(newStatus);

        // Auto-stop when all fields are filled (immediate completion)
        if (newStatus.cardNumber && newStatus.expiry && newStatus.cvv) {
          console.log("✅ All fields completed - stopping recognition immediately");

          // Clear silence timer since we're stopping immediately
          if (silenceTimerRef.current) {
            console.log("🛑 Clearing silence timer for immediate completion");
            clearTimeout(silenceTimerRef.current);
            silenceTimerRef.current = null;
          }

          setTimeout(() => {
            console.log("Auto-stopping - all fields complete");
            setIsListening(false);
            if (recognitionRef.current) {
              recognitionRef.current.stop();
            }
          }, 1000);
        }
      }

      // Start silence detection timer after processing
      console.log("📝 Finished processing transcript, starting silence timer");
      startSilenceTimer();
    },
    [onCardNumberChange, onExpiryChange, onCvvChange, onCurrentFieldChange, startSilenceTimer]
  );

  // Function to setup recognition with all event handlers
  const setupRecognition = useCallback(
    (recognition: ISpeechRecognition) => {
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = "en-US";

      // Try to maximize recognition duration
      if ("maxAlternatives" in recognition) {
        (recognition as { maxAlternatives: number }).maxAlternatives = 1;
      }

      recognition.onstart = () => {
        console.log("Speech recognition started");
        setIsListening(true);
        setIsStarting(false);
        setError(null);
        onCurrentFieldChange("listening");
      };

      recognition.onend = () => {
        console.log("Speech recognition ended, checking if should restart...");
        // Only stop if we have all fields filled or if manually stopped
        const accumulated = accumulatedDigitsRef.current;
        const allFieldsFilled =
          accumulated.cardNumber.length >= 13 && accumulated.expiry.length >= 4 && accumulated.cvv.length >= 3;

        console.log("Current accumulated data:", accumulated);
        console.log("All fields filled?", allFieldsFilled);
        console.log("Still listening?", isListening);

        if (!allFieldsFilled && isListening) {
          const currentRestartCount = restartCount + 1;
          setRestartCount(currentRestartCount);
          console.log(`🔄 Auto-restarting speech recognition - attempt ${currentRestartCount}`);

          // Prevent infinite restart loops
          if (currentRestartCount > 10) {
            console.log("❌ Too many restart attempts, stopping");
            setError("Speech recognition keeps stopping. Please try again.");
            setIsListening(false);
            onCurrentFieldChange("listening");
            return;
          }

          // Small delay before restart to avoid rapid restart loops
          setTimeout(() => {
            if (isListening && recognitionRef.current) {
              try {
                recognitionRef.current.start();
                console.log(`✅ Successfully restarted recognition (attempt ${currentRestartCount})`);
              } catch (err) {
                console.error("❌ Failed to restart recognition:", err);
                // Try to create a new recognition instance if restart fails
                const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
                if (SpeechRecognition) {
                  const newRecognition = new SpeechRecognition();
                  setupRecognition(newRecognition);
                  recognitionRef.current = newRecognition;
                  try {
                    newRecognition.start();
                    console.log("✅ Successfully started new recognition instance");
                  } catch (newErr) {
                    console.error("❌ Failed to start new recognition:", newErr);
                    setError("Speech recognition failed. Please try again.");
                    setIsListening(false);
                    onCurrentFieldChange("listening");
                  }
                }
              }
            }
          }, 200); // Slightly longer delay
        } else {
          console.log("🛑 Stopping recognition - all fields complete or manually stopped");

          // Clear silence timer when stopping
          if (silenceTimerRef.current) {
            clearTimeout(silenceTimerRef.current);
            silenceTimerRef.current = null;
          }

          setIsListening(false);
          onCurrentFieldChange("listening");
        }
      };

      recognition.onerror = (event: ISpeechRecognitionErrorEvent) => {
        console.error("Speech recognition error:", event.error);

        // Handle specific error types
        if (event.error === "no-speech") {
          console.log("No speech detected, will restart...");
          // Don't show error for no-speech, just let it restart
        } else if (event.error === "aborted") {
          console.log("Recognition aborted, checking if should restart...");
          // Don't set error for aborted, let onend handle restart
        } else if (event.error === "service-not-allowed" || event.error === "not-allowed") {
          setError("Microphone access denied. Please allow microphone access when prompted, then try again.");
          setIsListening(false);
          setIsStarting(false);
          // Don't set isSupported to false - let user try again after granting permissions
        } else if (event.error === "network") {
          setError("Network error. Please check your internet connection and try again.");
          setIsListening(false);
          setIsStarting(false);
        } else {
          setError(`Speech recognition error: ${event.error}. Please try again or use manual input.`);
          setIsListening(false);
          setIsStarting(false);
        }
      };

      recognition.onresult = (event: ISpeechRecognitionEvent) => {
        let interimTranscript = "";
        let finalTranscript = "";

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            finalTranscript += transcript;
          } else {
            interimTranscript += transcript;
          }
        }

        // Use the most recent transcript
        const currentText = finalTranscript || interimTranscript;
        setCurrentTranscript(currentText);

        // Process the transcript in real-time
        processStreamingTranscript(currentText);
      };
    },
    [processStreamingTranscript, onCurrentFieldChange, isListening, restartCount]
  );

  useEffect(() => {
    // Check if running on HTTPS (required for speech recognition)
    const isHTTPS = window.location.protocol === "https:" || window.location.hostname === "localhost";

    // Check if speech recognition is supported
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setIsSupported(false);
      setError("Speech recognition not supported in this browser. Please try Chrome, Edge, or Safari.");
      return;
    }

    if (!isHTTPS) {
      setIsSupported(false);
      setError("Voice input requires HTTPS. Please use the manual input fields or camera scan instead.");
      return;
    }

    // Initialize speech recognition
    const recognition = new SpeechRecognition();
    setupRecognition(recognition);
    recognitionRef.current = recognition;

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      // Clean up silence timer
      if (silenceTimerRef.current) {
        clearTimeout(silenceTimerRef.current);
      }
    };
  }, [processStreamingTranscript, onCurrentFieldChange, setupRecognition]);

  const startListening = async () => {
    if (!isSupported || !recognitionRef.current) {
      setError("Speech recognition not available");
      return;
    }

    // Clear any previous errors and set starting state
    setError(null);
    setIsStarting(true);

    // Reset accumulated data
    accumulatedDigitsRef.current = {
      cardNumber: "",
      expiry: "",
      cvv: "",
    };
    currentFieldRef.current = "cardNumber";

    // Reset field status and restart count
    setFieldsStatus({
      cardNumber: false,
      expiry: false,
      cvv: false,
    });
    setRestartCount(0);

    // Clear any existing silence timer
    if (silenceTimerRef.current) {
      console.log("🛑 Clearing existing silence timer (start listening)");
      clearTimeout(silenceTimerRef.current);
      silenceTimerRef.current = null;
    }

    console.log("🎤 Starting speech recognition with clean state");

    // Check microphone permissions first (if available)
    try {
      if (navigator.permissions && navigator.permissions.query) {
        const permission = await navigator.permissions.query({ name: "microphone" as PermissionName });
        console.log("Microphone permission status:", permission.state);

        if (permission.state === "denied") {
          setError("Microphone access denied. Please enable microphone permissions in your browser settings and try again.");
          return;
        }
      }
    } catch (permissionError) {
      console.log("Could not check microphone permissions:", permissionError);
      // Continue anyway - permissions API might not be available
    }

    try {
      // Small delay to ensure permissions are fully processed
      setTimeout(() => {
        if (recognitionRef.current && !isListening) {
          try {
            recognitionRef.current.start();
          } catch (delayedErr) {
            console.error("Error starting recognition after delay:", delayedErr);
            setError("Failed to start speech recognition. Please try again.");
            setIsStarting(false);
          }
        }
      }, 100);
    } catch (err) {
      console.error("Error starting recognition:", err);
      setError("Failed to start speech recognition. Please try again.");
      setIsStarting(false);
    }
  };

  const stopListening = () => {
    console.log("Manually stopping speech recognition");
    setIsListening(false); // Set this first to prevent restart
    setRestartCount(0); // Reset restart count

    // Clear silence timer
    if (silenceTimerRef.current) {
      console.log("🛑 Manually clearing silence timer (stop listening)");
      clearTimeout(silenceTimerRef.current);
      silenceTimerRef.current = null;
    }

    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
  };

  const toggleListening = () => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  };

  if (!isSupported) {
    return (
      <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg text-center">
        <p className="text-sm text-blue-700">{error || "Voice input is not available."}</p>
        <p className="text-xs text-blue-600 mt-2">
          💡 Use the manual input fields above or try the camera scan feature instead!
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Streaming Speech Control */}
      <div className="flex items-center justify-center gap-4 p-4 bg-gray-50 rounded-lg">
        <button
          type="button"
          onClick={toggleListening}
          disabled={isStarting}
          className={`p-4 rounded-full transition-all ${
            isListening
              ? "bg-red-500 text-white hover:bg-red-600 shadow-lg animate-pulse"
              : isStarting
              ? "bg-blue-500 text-white shadow-lg animate-pulse"
              : "bg-green-500 text-white hover:bg-green-600 shadow-lg"
          } ${isStarting ? "cursor-not-allowed" : ""}`}
          title={isListening ? "Stop listening" : isStarting ? "Starting..." : "Start listening"}
        >
          {isListening ? <MicOff className="w-6 h-6" /> : <Mic className="w-6 h-6" />}
        </button>

        <div className="text-center flex-1">
          <div className="font-medium">
            {isListening
              ? "🎤 Keep Speaking..."
              : isStarting
              ? "🎯 Starting... (allow microphone access)"
              : fieldsStatus.cardNumber && fieldsStatus.expiry && fieldsStatus.cvv
              ? "🎉 All Complete!"
              : "Click to start voice input"}
          </div>
          <div className="text-sm text-gray-500">
            {isListening ? (
              <>
                <div className="mb-1">
                  {fieldsStatus.cardNumber && fieldsStatus.expiry && fieldsStatus.cvv
                    ? "Perfect! All fields captured!"
                    : restartCount > 0
                    ? `Keep speaking! (auto-restarted ${restartCount}x)`
                    : "Continue saying all your card details - don't stop!"}
                </div>
                <div className="text-xs">
                  Progress: {fieldsStatus.cardNumber ? "✅ Card" : "⏳ Card"}
                  {" → "}
                  {fieldsStatus.expiry ? "✅ Expiry" : "⏳ Expiry"}
                  {" → "}
                  {fieldsStatus.cvv ? "✅ CVV" : "⏳ CVV"}
                </div>
                <span className="text-xs font-mono bg-white px-2 py-1 rounded mt-2 inline-block">
                  {currentTranscript || "Waiting for speech..."}
                </span>
              </>
            ) : fieldsStatus.cardNumber && fieldsStatus.expiry && fieldsStatus.cvv ? (
              "All card details have been successfully captured!"
            ) : (
              "Say: Card number, then expiry, then CVV - all in one go!"
            )}
          </div>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="text-sm text-red-500 text-center bg-red-50 p-3 rounded-lg">
          <div className="mb-2">{error}</div>
          {!isListening && isSupported && (
            <button
              onClick={startListening}
              className="px-4 py-2 bg-blue-500 text-white text-xs rounded hover:bg-blue-600 transition-colors"
            >
              Try Again
            </button>
          )}
        </div>
      )}
    </div>
  );
}
