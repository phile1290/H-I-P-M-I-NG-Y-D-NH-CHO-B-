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

  // Hàm này nên được gọi trong lúc người dùng click để "mở khóa" trình duyệt
  const initSpeech = useCallback(() => {
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance('');
      utterance.volume = 0;
      window.speechSynthesis.speak(utterance);
    }
  }, []);

  const speak = useCallback((text: string) => {
    return new Promise<void>((resolve) => {
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel(); // Dừng tất cả âm thanh hiện tại
        
        // Đặt một khoảng trễ nhỏ để đảm bảo cancel() đã hoàn tất
        setTimeout(() => {
          const utterance = new SpeechSynthesisUtterance(text);
          
          // Cố gắng tìm giọng tiếng Việt
          const viVoice = voices.find((voice) => voice.lang.includes('vi'));
          if (viVoice) {
            utterance.voice = viVoice;
          } else {
            utterance.lang = 'vi-VN';
          }

          utterance.rate = 0.9;
          utterance.pitch = 1.1;

          utterance.onstart = () => setIsSpeaking(true);
          utterance.onend = () => {
            setIsSpeaking(false);
            resolve();
          };
          utterance.onerror = (e) => {
            // Lỗi 'interrupted' thường xảy ra khi ta gọi cancel() hoặc dừng đột ngột, đây là hành vi bình thường
            if (e.error !== 'interrupted') {
              console.error("Lỗi phát âm thanh TTS:", e.error || e);
            }
            setIsSpeaking(false);
            resolve();
          };

          window.speechSynthesis.speak(utterance);
        }, 100); // Đợi 100ms
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

  return { speak, stopSpeaking, isSpeaking, initSpeech };
}

