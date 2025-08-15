"use client";

import { useState, useRef, useEffect } from "react";
import { Mic, MicOff, Loader2 } from "lucide-react";

interface SpeechToTextProps {
  onTranscript: (text: string) => void;
  isListening: boolean;
  onListeningChange: (listening: boolean) => void;
  disabled?: boolean;
}

export function SpeechToText({ 
  onTranscript, 
  isListening, 
  onListeningChange, 
  disabled = false 
}: SpeechToTextProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  const startRecording = async () => {
    try {
      setError(null);
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus'
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
          const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
          await sendAudioToGemini(audioBlob);
        } catch (err) {
          setError(err instanceof Error ? err.message : 'Failed to process audio');
        } finally {
          setIsProcessing(false);
        }
      };

      mediaRecorder.start();
      onListeningChange(true);
    } catch (err) {
      setError('Failed to access microphone');
      console.error('Error starting recording:', err);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isListening) {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
      onListeningChange(false);
    }
  };

  const sendAudioToGemini = async (audioBlob: Blob) => {
    const formData = new FormData();
    formData.append('audio', audioBlob, 'recording.webm');

    const response = await fetch('/api/speech-to-text', {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    
    console.log('SpeechToText received response:', data);
    
    if (data.text) {
      console.log('SpeechToText calling onTranscript with:', data.text);
      onTranscript(data.text);
    } else {
      throw new Error('No transcript received');
    }
  };

  const toggleRecording = () => {
    if (isListening) {
      stopRecording();
    } else {
      startRecording();
    }
  };

  useEffect(() => {
    return () => {
      if (mediaRecorderRef.current) {
        mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        onClick={toggleRecording}
        disabled={disabled || isProcessing}
        className={`p-2 rounded-full transition-colors ${
          isListening 
            ? 'bg-red-500 text-white hover:bg-red-600' 
            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
        } ${disabled || isProcessing ? 'opacity-50 cursor-not-allowed' : ''}`}
        title={isListening ? 'Stop recording' : 'Start recording'}
      >
        {isProcessing ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : isListening ? (
          <MicOff className="w-4 h-4" />
        ) : (
          <Mic className="w-4 h-4" />
        )}
      </button>
      
      {isListening && (
        <div className="flex items-center gap-2 text-sm text-red-500">
          <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
          Listening...
        </div>
      )}
      
      {isProcessing && (
        <div className="flex items-center gap-2 text-sm text-blue-500">
          <Loader2 className="w-3 h-3 animate-spin" />
          Processing...
        </div>
      )}
      
      {error && (
        <div className="text-sm text-red-500">
          {error}
        </div>
      )}
    </div>
  );
}
