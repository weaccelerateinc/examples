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
      const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);

      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = "en-US";

      // Try to maximize recognition duration
      if ("maxAlternatives" in recognition) {
        (recognition as { maxAlternatives: number }).maxAlternatives = 1;
      }

      console.log(`🔧 Setting up recognition for ${isSafari ? "Safari" : "Other"} browser:`, {
        continuous: recognition.continuous,
        interimResults: recognition.interimResults,
        lang: recognition.lang,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        maxAlternatives: (recognition as any).maxAlternatives,
      });

      recognition.onstart = () => {
        const startTime = new Date().toISOString();
        console.log(`🎤 Speech recognition started at ${startTime}`);
        console.log("Recognition state:", {
          continuous: recognition.continuous,
          interimResults: recognition.interimResults,
          lang: recognition.lang,
        });
        setIsListening(true);
        setIsStarting(false);
        setError(null);
        onCurrentFieldChange("listening");

        // For Safari, immediately prompt user to speak to avoid "no speech" errors
        const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
        if (isSafari) {
          console.log("🗣️ Safari detected - prompting immediate speech");
          // You could add audio prompt here if needed
        }
      };

      recognition.onend = () => {
        const endTime = new Date().toISOString();
        console.log(`🛑 Speech recognition ended at ${endTime}`);

        // Calculate how long recognition was active
        const startedTime = Date.now() - 1000; // Rough estimate
        console.log(`Recognition was active for approximately ${Date.now() - startedTime}ms`);

        // Only stop if we have all fields filled or if manually stopped
        const accumulated = accumulatedDigitsRef.current;
        const allFieldsFilled =
          accumulated.cardNumber.length >= 13 && accumulated.expiry.length >= 4 && accumulated.cvv.length >= 3;

        console.log("🔍 End state check:", {
          accumulated,
          allFieldsFilled,
          isListening,
          restartCount,
          userAgent: navigator.userAgent.includes("Safari") ? "Safari" : "Other",
        });

        if (!allFieldsFilled && isListening) {
          const currentRestartCount = restartCount + 1;
          setRestartCount(currentRestartCount);

          // Detect Safari for different restart strategy
          const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
          const restartDelay = isSafari ? 100 : 200; // Shorter delay for Safari since abort is expected

          console.log(
            `🔄 Auto-restarting speech recognition - attempt ${currentRestartCount} (${
              isSafari ? "Safari" : "Other"
            } browser, delay: ${restartDelay}ms)`
          );

          // Prevent infinite restart loops
          if (currentRestartCount > 15) {
            // Increased limit for Safari
            console.log("❌ Too many restart attempts, stopping");
            setError("Speech recognition keeps stopping. Please try manual input or camera instead.");
            setIsListening(false);
            onCurrentFieldChange("listening");
            return;
          }

          // Longer delay for Safari
          setTimeout(() => {
            console.log(
              `⏰ Restart timeout fired - isListening: ${isListening}, hasRecognition: ${!!recognitionRef.current}`
            );
            if (isListening && recognitionRef.current) {
              try {
                console.log(`🚀 Attempting restart ${currentRestartCount}...`);
                recognitionRef.current.start();
                console.log(`✅ Successfully restarted recognition (attempt ${currentRestartCount})`);
              } catch (err) {
                console.error("❌ Failed to restart recognition:", err);
                // Try to create a new recognition instance if restart fails
                const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
                if (SpeechRecognition) {
                  console.log("🔧 Creating new recognition instance...");
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
            } else {
              console.log("⏹️ Skipping restart - conditions not met");
            }
          }, restartDelay);
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
        const errorTime = new Date().toISOString();
        const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);

        console.error(`❌ Speech recognition error at ${errorTime}:`, {
          error: event.error,
          browser: isSafari ? "Safari" : "Other",
          isListening,
          restartCount,
          event,
        });

        // Handle specific error types
        if (event.error === "no-speech") {
          console.log("🔇 No speech detected, will restart...");
          // Don't show error for no-speech, just let it restart
        } else if (event.error === "aborted") {
          console.log("⏹️ Recognition aborted, checking if should restart...");
          // Safari frequently aborts due to "no speech detected" - this is normal
          if (isSafari) {
            console.log("🍎 Safari aborted (normal behavior) - will auto-restart");
          }
          // Don't set error for aborted, let onend handle restart
        } else if (event.error === "service-not-allowed" || event.error === "not-allowed") {
          console.error("🚫 Permission error - microphone access denied");
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

    // Detect Safari
    const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);

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

    console.log("Browser detected:", isSafari ? "Safari" : "Other", "- User Agent:", navigator.userAgent);

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

    const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
    const isIOSChrome = /Chrome.*Mobile|CriOS/i.test(navigator.userAgent);
    const browserType = isSafari ? "Safari" : isIOSChrome ? "iOS Chrome" : "Other";

    console.log(`🎤 Starting speech recognition with clean state on ${browserType} browser`);
    console.log("Current states:", { isListening, isStarting, isSupported, restartCount });

    // For iOS Chrome and other browsers that don't auto-prompt, explicitly request microphone access
    try {
      console.log("🎯 Explicitly requesting microphone access...");
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      console.log("✅ Microphone access granted, stopping test stream");

      // Stop the test stream immediately - we just needed permission
      stream.getTracks().forEach((track) => track.stop());

      // Small delay to ensure permission is fully established
      await new Promise((resolve) => setTimeout(resolve, 100));
    } catch (micError) {
      console.error("❌ Microphone access denied or failed:", micError);
      setError("Microphone access required. Please allow microphone access and try again.");
      setIsStarting(false);
      return;
    }

    // Check microphone permissions (if API available)
    try {
      if (navigator.permissions && navigator.permissions.query) {
        const permission = await navigator.permissions.query({ name: "microphone" as PermissionName });
        console.log("🎯 Microphone permission status after request:", permission.state);
      }
    } catch (permissionError) {
      console.log("⚠️ Could not check microphone permissions:", permissionError);
      // Continue anyway - we already got microphone access above
    }

    const startDelay = isSafari ? 150 : 100; // Shorter delay for Safari to get started quickly

    console.log(`🚀 Setting up recognition start with ${startDelay}ms delay for ${isSafari ? "Safari" : "Other"} browser`);

    try {
      // Short delay to ensure permissions are processed, then start quickly
      setTimeout(() => {
        console.log(`⏰ Start timeout fired - isListening: ${isListening}, hasRecognition: ${!!recognitionRef.current}`);
        if (recognitionRef.current && !isListening) {
          try {
            console.log("🎯 Calling recognition.start()...");
            recognitionRef.current.start();
            console.log("✅ recognition.start() called successfully");
          } catch (delayedErr) {
            console.error("❌ Error starting recognition after delay:", delayedErr);
            setError("Failed to start speech recognition. Please try again.");
            setIsStarting(false);
          }
        } else {
          console.log("⏹️ Skipping start - conditions not met", {
            hasRecognition: !!recognitionRef.current,
            isListening,
            isStarting,
          });
          setIsStarting(false);
        }
      }, startDelay);
    } catch (err) {
      console.error("❌ Error setting up recognition start:", err);
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
              ? "🎯 Requesting microphone access... (please allow)"
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
                    : /^((?!chrome|android).)*safari/i.test(navigator.userAgent)
                    ? "🗣️ START SPEAKING IMMEDIATELY! Safari needs instant speech"
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
            ) : /^((?!chrome|android).)*safari/i.test(navigator.userAgent) ? (
              "🍎 Safari tip: Click mic and speak IMMEDIATELY! Say: '4111 1111 1111 1111 12 25 123'"
            ) : /Chrome.*Mobile|CriOS/i.test(navigator.userAgent) ? (
              "📱 iOS Chrome: Click mic, allow permissions, then speak your card details"
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
