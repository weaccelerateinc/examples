/**
 * Audio utility functions for Live API integration
 */

/**
 * Convert WebM audio to PCM format required by Gemini Live API
 * @param webmBlob - The WebM audio blob from MediaRecorder
 * @returns ArrayBuffer containing 16-bit PCM audio data at 16kHz mono
 */
export async function convertWebMToPCM(webmBlob: Blob): Promise<ArrayBuffer> {
  try {
    // Create audio context for 16kHz output
    const audioContext = new AudioContext({ sampleRate: 16000 });

    // Decode the WebM audio data with retry mechanism
    const arrayBuffer = await webmBlob.arrayBuffer();

    let audioBuffer;
    let attempts = 0;
    const maxAttempts = 3;

    while (attempts < maxAttempts) {
      try {
        // Create a fresh copy of the array buffer for each attempt
        const bufferCopy = arrayBuffer.slice(0);
        audioBuffer = await audioContext.decodeAudioData(bufferCopy);
        break;
      } catch (decodeError) {
        attempts++;
        console.warn(`⚠️ Audio decode attempt ${attempts}/${maxAttempts} failed:`, decodeError);

        if (attempts >= maxAttempts) {
          // If all attempts fail, create a silent buffer as fallback
          console.warn("🔇 Creating silent audio buffer as fallback");
          const sampleRate = 16000;
          const duration = 0.1; // 100ms of silence
          audioBuffer = audioContext.createBuffer(1, sampleRate * duration, sampleRate);
          break;
        }

        // Wait a bit before retrying
        await new Promise((resolve) => setTimeout(resolve, 50));
      }
    }

    if (!audioBuffer) {
      throw new Error("Failed to create audio buffer");
    }

    // Get the first channel (mono)
    const inputData = audioBuffer.getChannelData(0);

    // Resample to 16kHz if needed
    const targetSampleRate = 16000;
    const originalSampleRate = audioBuffer.sampleRate;

    let resampledData: Float32Array;

    if (originalSampleRate === targetSampleRate) {
      resampledData = inputData;
    } else {
      // Calculate the new length after resampling
      const ratio = targetSampleRate / originalSampleRate;
      const newLength = Math.round(inputData.length * ratio);

      // Resample the audio data
      resampledData = new Float32Array(newLength);
      for (let i = 0; i < newLength; i++) {
        const originalIndex = i / ratio;
        const index = Math.floor(originalIndex);
        const fraction = originalIndex - index;

        if (index + 1 < inputData.length) {
          resampledData[i] = inputData[index] * (1 - fraction) + inputData[index + 1] * fraction;
        } else {
          resampledData[i] = inputData[index] || 0;
        }
      }
    }

    // Convert to 16-bit PCM
    const pcmData = new Int16Array(resampledData.length);
    for (let i = 0; i < resampledData.length; i++) {
      // Clamp to [-1, 1] and convert to 16-bit integer
      const sample = Math.max(-1, Math.min(1, resampledData[i]));
      pcmData[i] = sample * 0x7fff;
    }

    // Close the audio context to free resources
    await audioContext.close();

    console.log(`🎵 Audio converted: ${webmBlob.size} bytes WebM → ${pcmData.buffer.byteLength} bytes PCM (16kHz mono)`);
    return pcmData.buffer;
  } catch (error) {
    console.error("❌ Error converting audio to PCM:", error);
    throw error;
  }
}

/**
 * Check if the browser supports the required audio APIs for Live API
 */
export function checkAudioSupport(): { isSupported: boolean; error?: string } {
  if (typeof window === "undefined" || typeof navigator === "undefined") {
    return { isSupported: false, error: "Not running in browser environment" };
  }

  if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
    return { isSupported: false, error: "Microphone access not supported in this browser" };
  }

  if (!window.MediaRecorder) {
    return { isSupported: false, error: "Audio recording not supported in this browser" };
  }

  if (!window.AudioContext) {
    return { isSupported: false, error: "Audio processing not supported in this browser" };
  }

  // Check if running on HTTPS (required for microphone access)
  const isHTTPS = window.location.protocol === "https:" || window.location.hostname === "localhost";
  if (!isHTTPS) {
    return { isSupported: false, error: "Voice input requires HTTPS. Please use manual input instead." };
  }

  return { isSupported: true };
}

/**
 * Get the best supported audio format for MediaRecorder
 */
export function getBestAudioFormat(): { mimeType: string; description: string } {
  const formats = [
    { mimeType: "audio/webm;codecs=opus", description: "WebM with Opus codec" },
    { mimeType: "audio/webm", description: "WebM default" },
    { mimeType: "audio/mp4", description: "MP4 audio" },
    { mimeType: "", description: "Browser default" },
  ];

  for (const format of formats) {
    if (!format.mimeType || MediaRecorder.isTypeSupported(format.mimeType)) {
      return format;
    }
  }

  return formats[formats.length - 1]; // Return default as fallback
}
