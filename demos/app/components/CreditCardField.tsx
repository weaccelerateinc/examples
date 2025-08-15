"use client";

import { useState } from "react";
import { SpeechToText } from "./SpeechToText";

interface CreditCardFieldProps {
  type: "cardNumber" | "expiry" | "cvv";
  placeholder: string;
  value: string;
  onChange: (value: string) => void;
  className?: string;
}

export function CreditCardField({ 
  type, 
  placeholder, 
  value, 
  onChange, 
  className = "" 
}: CreditCardFieldProps) {
  const [isListening, setIsListening] = useState(false);

  const handleTranscript = (transcript: string) => {
    console.log('CreditCardField received transcript:', { type, transcript });
    
    let processedText = transcript.trim();
    
    // Process the transcript based on field type
    switch (type) {
      case "cardNumber":
        // Remove all non-digits and limit to 16 characters
        processedText = processedText.replace(/\D/g, '').slice(0, 16);
        // Add spaces every 4 digits for better readability
        processedText = processedText.replace(/(\d{4})(?=\d)/g, '$1 ');
        break;
      
      case "expiry":
        // Remove all non-digits and limit to 4 characters
        processedText = processedText.replace(/\D/g, '').slice(0, 4);
        // Add slash after 2 digits
        if (processedText.length >= 2) {
          processedText = processedText.slice(0, 2) + '/' + processedText.slice(2);
        }
        break;
      
      case "cvv":
        // Remove all non-digits and limit to 4 characters (for Amex)
        processedText = processedText.replace(/\D/g, '').slice(0, 4);
        break;
    }
    
    console.log('CreditCardField processed text:', { type, processedText });
    onChange(processedText);
  };

  const getFieldIcon = () => {
    switch (type) {
      case "cardNumber":
        return "💳";
      case "expiry":
        return "📅";
      case "cvv":
        return "🔒";
      default:
        return "🎤";
    }
  };

  return (
    <div className={`relative ${className}`}>
      <div className="flex items-center">
        <input
          type={type === "cvv" ? "password" : "text"}
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="flex-1 px-3 py-3 pr-12 border border-neutral-200 rounded-md focus:ring-2 focus:ring-sky-500 outline-none"
        />
        <div className="absolute right-2 flex items-center gap-1">
          <span className="text-sm opacity-50">{getFieldIcon()}</span>
          <SpeechToText
            onTranscript={handleTranscript}
            isListening={isListening}
            onListeningChange={setIsListening}
            disabled={false}
          />
        </div>
      </div>
    </div>
  );
}
