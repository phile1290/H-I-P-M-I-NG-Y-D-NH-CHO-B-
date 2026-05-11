import { useState, useRef, useCallback } from 'react';

export function useAudioRecorder() {
  const [isRecording, setIsRecording] = useState(false);
  const mediaRecorder = useRef<MediaRecorder | null>(null);
  const audioChunks = useRef<Blob[]>([]);

  const startRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const options = { mimeType: 'audio/webm;codecs=opus' };
      
      let mimeType = options.mimeType;
      if (!MediaRecorder.isTypeSupported(options.mimeType)) {
        mimeType = 'audio/webm';
        if (!MediaRecorder.isTypeSupported(mimeType)) {
          mimeType = 'audio/mp4';
          if (!MediaRecorder.isTypeSupported(mimeType)) {
             mimeType = ''; 
          }
        }
      }

      mediaRecorder.current = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
      audioChunks.current = [];

      mediaRecorder.current.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunks.current.push(event.data);
        }
      };

      mediaRecorder.current.start();
      setIsRecording(true);
    } catch (error) {
      console.error('Lỗi khi truy cập microphone:', error);
      alert('Không thể truy cập microphone. Vui lòng cấp quyền.');
    }
  }, []);

  const stopRecording = useCallback((): Promise<{ base64: string; mimeType: string } | null> => {
    return new Promise((resolve) => {
      if (!mediaRecorder.current) {
        resolve(null);
        return;
      }

      mediaRecorder.current.onstop = () => {
        setIsRecording(false);
        const mimeType = mediaRecorder.current?.mimeType || 'audio/webm';
        const audioBlob = new Blob(audioChunks.current, { type: mimeType });
        
        // Stop all tracks to release microphone
        mediaRecorder.current?.stream.getTracks().forEach(track => track.stop());
        mediaRecorder.current = null;

        // Convert blob to base64
        const reader = new FileReader();
        reader.readAsDataURL(audioBlob);
        reader.onloadend = () => {
          const base64data = (reader.result as string).split(',')[1];
          resolve({ base64: base64data, mimeType });
        };
      };

      if (mediaRecorder.current.state !== 'inactive') {
        mediaRecorder.current.stop();
      } else {
        resolve(null);
      }
    });
  }, []);

  return { isRecording, startRecording, stopRecording };
}
