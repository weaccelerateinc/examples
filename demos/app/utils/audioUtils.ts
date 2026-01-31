/**
 * Audio utility functions for Live API integration
 */

/**
 * Create a PCM audio processor that captures raw audio data directly from microphone
 * @param stream - MediaStream from getUserMedia
 * @param onAudioData - Callback function to receive PCM data chunks
 * @param sampleRate - Sample rate in Hz (16000 for Gemini, 24000 for OpenAI)
 * @returns AudioContext and cleanup function
 */
export function createPCMAudioProcessor(
  stream: MediaStream,
  onAudioData: (pcmData: ArrayBuffer) => void,
  sampleRate: number = 16000
): { audioContext: AudioContext; cleanup: () => void } {
  // Create audio context at specified sample rate
  // Gemini Live API uses 16kHz, OpenAI Realtime uses 24kHz
  const audioContext = new AudioContext({ sampleRate });

  // Create media source from stream
  const source = audioContext.createMediaStreamSource(stream);

  // Create script processor (deprecated but widely supported)
  // Buffer size of 4096 samples gives us ~256ms chunks at 16kHz
  const processor = audioContext.createScriptProcessor(4096, 1, 1);

  processor.onaudioprocess = (event) => {
    const inputBuffer = event.inputBuffer;
    const inputData = inputBuffer.getChannelData(0); // Get mono channel

    // Convert Float32 audio data to 16-bit PCM
    const pcmData = new Int16Array(inputData.length);
    for (let i = 0; i < inputData.length; i++) {
      // Clamp to [-1, 1] and convert to 16-bit integer
      const sample = Math.max(-1, Math.min(1, inputData[i]));
      pcmData[i] = sample * 0x7fff;
    }

    console.log(`🎵 Generated PCM chunk: ${pcmData.buffer.byteLength} bytes`);
    onAudioData(pcmData.buffer);
  };

  // Connect the audio graph
  source.connect(processor);
  processor.connect(audioContext.destination);

  const cleanup = () => {
    processor.disconnect();
    source.disconnect();
    audioContext.close();
  };

  return { audioContext, cleanup };
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
