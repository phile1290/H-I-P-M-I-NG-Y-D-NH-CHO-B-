import { useState, useCallback, useEffect } from 'react';

export function useTTS() {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);

  useEffect(() => {
    const loadVoices = () => {
      setVoices(window.speechSynthesis.getVoices());
    };

    loadVoices();
    if (speechSynthesis.onvoiceschanged !== undefined) {
      speechSynthesis.onvoiceschanged = loadVoices;
    }
  }, []);

  const speak = useCallback((text: string) => {
    return new Promise<void>((resolve) => {
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel(); // Stop any current speech
        
        const utterance = new SpeechSynthesisUtterance(text);
        
        // Cố gắng tìm giọng tiếng Việt
        const viVoice = voices.find((voice) => voice.lang.includes('vi'));
        if (viVoice) {
          utterance.voice = viVoice;
        } else {
          // Fallback language if 'vi' is not found
          utterance.lang = 'vi-VN';
        }

        utterance.rate = 0.9; // Chậm một chút cho trẻ em dễ nghe
        utterance.pitch = 1.1; // Hơi cao một chút cho thân thiện

        utterance.onstart = () => setIsSpeaking(true);
        utterance.onend = () => {
          setIsSpeaking(false);
          resolve();
        };
        utterance.onerror = (e) => {
          console.error("Lỗi phát âm thanh TTS:", e);
          setIsSpeaking(false);
          resolve();
        };

        window.speechSynthesis.speak(utterance);
      } else {
        console.warn("Trình duyệt không hỗ trợ Web Speech API.");
        resolve();
      }
    });
  }, [voices]);

  const stopSpeaking = useCallback(() => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    }
  }, []);

  return { speak, stopSpeaking, isSpeaking };
}
