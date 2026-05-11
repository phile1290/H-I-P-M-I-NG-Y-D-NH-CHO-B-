import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Mic, Square, Loader2, Volume2, VolumeX, Sparkles } from 'lucide-react';
import { useAudioRecorder } from './hooks/useAudioRecorder';
import { useTTS } from './hooks/useTTS';
import { askGemini } from './services/aiService';

export default function App() {
  const { isRecording, startRecording, stopRecording } = useAudioRecorder();
  const { speak, stopSpeaking, isSpeaking } = useTTS();
  const [answer, setAnswer] = useState<string>('');
  const [isThinking, setIsThinking] = useState(false);
  const [error, setError] = useState<string>('');

  const handleToggleRecording = async () => {
    if (isRecording) {
      const audioData = await stopRecording();
      if (audioData) {
        setIsThinking(true);
        setError('');
        setAnswer('');
        stopSpeaking();
        try {
          const aiTextResponse = await askGemini(audioData.base64, audioData.mimeType);
          setAnswer(aiTextResponse);
          setIsThinking(false);
          await speak(aiTextResponse);
        } catch (err: any) {
          console.error(err);
          setError(err.message || 'Không thể kết nối với não bộ lúc này. Bé thử lại sau nhé!');
          setIsThinking(false);
        }
      }
    } else {
      stopSpeaking();
      setAnswer('');
      setError('');
      startRecording();
    }
  };

  const cancelSpeech = () => {
    stopSpeaking();
  };

  return (
    <div className="min-h-screen bg-sky-100 flex flex-col items-center p-4 sm:p-8 font-sans">
      <div className="w-full max-w-2xl bg-white rounded-[3rem] shadow-xl p-8 flex flex-col items-center relative overflow-hidden">
        {/* Background Decorative Elements */}
        <div className="absolute top-[-2rem] left-[-2rem] w-32 h-32 bg-yellow-200 rounded-full opacity-50 pointer-events-none" />
        <div className="absolute bottom-[-3rem] right-[-3rem] w-48 h-48 bg-pink-200 rounded-full opacity-50 pointer-events-none" />

        <motion.div
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="text-center z-10 mb-8"
        >
          <h1 className="text-4xl font-extrabold text-indigo-600 mb-4 flex items-center justify-center gap-3">
            <Sparkles className="w-8 h-8 text-yellow-400" />
            Trợ Lý Nhí
            <Sparkles className="w-8 h-8 text-yellow-400" />
          </h1>
          <p className="text-xl text-gray-600 font-medium">Bé muốn hỏi gì nào?</p>
        </motion.div>

        {/* Microphone Button */}
        <div className="relative z-10 my-8 flex flex-col items-center">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleToggleRecording}
            disabled={isThinking || isSpeaking}
            className={`w-32 h-32 sm:w-40 sm:h-40 rounded-full flex items-center justify-center shadow-lg transition-colors border-8 ${
              isRecording
                ? 'bg-red-500 border-red-200 animate-pulse'
                : isThinking || isSpeaking
                ? 'bg-gray-300 border-gray-100 cursor-not-allowed'
                : 'bg-emerald-400 border-emerald-200 hover:bg-emerald-500'
            }`}
          >
            {isRecording ? (
              <Square className="w-12 h-12 sm:w-16 sm:h-16 text-white" fill="currentColor" />
            ) : isThinking ? (
              <Loader2 className="w-12 h-12 sm:w-16 sm:h-16 text-white animate-spin" />
            ) : (
              <Mic className="w-12 h-12 sm:w-16 sm:h-16 text-white" />
            )}
          </motion.button>
          <div className="mt-6 text-xl font-bold text-gray-700 min-h-[2rem]">
            {isRecording && <span className="text-red-500">Đang nghe bé nói...</span>}
            {isThinking && <span className="text-indigo-500">Đang suy nghĩ...</span>}
            {!isRecording && !isThinking && !isSpeaking && <span>Bấm để nói</span>}
            {isSpeaking && <span className="text-blue-500">Đang trả lời...</span>}
          </div>
        </div>

        {/* Answer Display */}
        <AnimatePresence>
          {answer && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: -20 }}
              className="w-full bg-indigo-50 border-4 border-indigo-100 rounded-3xl p-6 mt-4 relative z-10 shadow-sm"
            >
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-2 text-indigo-700 font-bold text-lg">
                  <Sparkles className="w-5 h-5" />
                  Bạn AI trả lời:
                </div>
                {isSpeaking ? (
                  <button
                    onClick={cancelSpeech}
                    className="p-2 bg-indigo-200 text-indigo-800 rounded-full hover:bg-indigo-300 transition-colors"
                    title="Dừng đọc"
                  >
                    <VolumeX className="w-5 h-5" />
                  </button>
                ) : (
                  <button
                    onClick={() => speak(answer)}
                    className="p-2 bg-indigo-100 text-indigo-600 rounded-full hover:bg-indigo-200 transition-colors"
                    title="Đọc lại"
                  >
                    <Volume2 className="w-5 h-5" />
                  </button>
                )}
              </div>
              <p className="text-gray-800 text-lg leading-relaxed whitespace-pre-wrap font-medium">
                {answer}
              </p>
            </motion.div>
          )}

          {error && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="w-full bg-red-50 text-red-600 p-4 rounded-2xl font-bold text-center mt-4 border-2 border-red-200 z-10"
            >
              {error}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

