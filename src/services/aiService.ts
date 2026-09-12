import { GoogleGenAI, HarmCategory, HarmBlockThreshold } from '@google/genai';

// Cache the client locally if the key hasn't changed
let aiClient: GoogleGenAI | null = null;
let currentApiKey = '';

function getAIClient(apiKey: string) {
  if (!aiClient || currentApiKey !== apiKey) {
    aiClient = new GoogleGenAI({ apiKey });
    currentApiKey = apiKey;
  }
  return aiClient;
}

const SYSTEM_INSTRUCTION = `Vai trò:
Bạn là một chuyên gia, một giáo viên thông minh, thân thiện và đáng tin cậy, chuyên giải đáp thắc mắc đa lĩnh vực cho trẻ em.

Nhiệm vụ cốt lõi:
Lắng nghe câu hỏi và phân tích thật kỹ hình ảnh đính kèm (nếu có). Trả lời chính xác, giải thích chi tiết, cặn kẽ và dễ hiểu.

Nguyên tắc trả lời bắt buộc:
1. Giải thích chi tiết, rõ ràng: Nếu hình ảnh là một bài tập, câu hỏi trắc nghiệm hoặc có các đáp án lựa chọn, bạn PHẢI đọc rõ nội dung câu hỏi là gì, giải thích cặn kẽ vì sao chọn đáp án đúng và vì sao các đáp án khác sai từng bước một. Không được trả lời qua loa.
2. Định dạng văn bản thuần (Plain Text): TUYỆT ĐỐI KHÔNG sử dụng bất kỳ ký tự đặc biệt nào để định dạng (như dấu sao *, dấu thăng #, gạch ngang -, gạch dưới _, in đậm, in nghiêng). Văn bản phải là chữ thường liền mạch để hệ thống đọc giọng nói (TTS) không bị vấp.
3. Ngôn ngữ đơn giản: Dùng từ ngữ gần gũi, thân thiện như đang nói chuyện trực tiếp với một em bé.
4. Ví dụ minh họa: Liên hệ thực tế nếu cần thiết để trẻ dễ hiểu hơn.`;

export async function askGemini(
  audioBase64: string, 
  mimeType: string,
  imageData: { base64: string; mimeType: string } | null | undefined,
  apiKey: string
): Promise<string> {
  if (!apiKey) {
    throw new Error('Vui lòng cài đặt API Key trước khi sử dụng.');
  }

  try {
    const client = getAIClient(apiKey);
    
    // Loại bỏ phần codecs (ví dụ: 'audio/webm;codecs=opus' -> 'audio/webm') để tránh lỗi từ API
    const safeAudioMimeType = mimeType.split(';')[0];
    
    const parts: any[] = [
      {
        inlineData: {
          mimeType: safeAudioMimeType,
          data: audioBase64,
        },
      },
      {
        text: "Lắng nghe câu hỏi qua đoạn ghi âm trên và trả lời."
      }
    ];

    if (imageData) {
      const safeImageMimeType = imageData.mimeType.split(';')[0];
      parts.push({
        inlineData: {
          mimeType: safeImageMimeType,
          data: imageData.base64,
        }
      });
      // Cập nhật câu lệnh để AI chú ý phân tích sâu hình ảnh
      parts[1].text = "Lắng nghe câu hỏi qua đoạn ghi âm trên, xem xét kỹ hình ảnh đính kèm và giải thích thật cặn kẽ, chi tiết từng đáp án (nếu là bài tập/câu hỏi lựa chọn).";
    }

    const response = await client.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: [
        {
          role: 'user',
          parts: parts,
        },
      ],
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        temperature: 0.2, // Tối ưu hoá cho sự chính xác (0.2 - 0.3)
        safetySettings: [
          {
            category: HarmCategory.HARM_CATEGORY_HARASSMENT,
            threshold: HarmBlockThreshold.BLOCK_LOW_AND_ABOVE,
          },
          {
            category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
            threshold: HarmBlockThreshold.BLOCK_LOW_AND_ABOVE,
          },
          {
            category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
            threshold: HarmBlockThreshold.BLOCK_LOW_AND_ABOVE,
          },
          {
            category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
            threshold: HarmBlockThreshold.BLOCK_LOW_AND_ABOVE,
          },
        ],
      },
    });

    let textResponse = response.text || "Tôi không nghe rõ, bạn có thể nói lại được không?";
    
    // Chủ động xóa bỏ tất cả các ký tự đặc biệt/markdown (*, #, _, `, ~) để đảm bảo TTS đọc mượt mà
    textResponse = textResponse.replace(/[*#_`~]/g, '');

    return textResponse;
  } catch (error: any) {
    console.error("Lỗi khi gọi Gemini API:", error);
    
    const errorMessage = error?.message || '';

    if (errorMessage.includes('leaked') || errorMessage.includes('API key not valid') || errorMessage.includes('403')) {
      throw new Error('API Key của bạn không hợp lệ hoặc đã bị khóa (leaked). Vui lòng đổi API Key khác trong phần Cài đặt.');
    }
    
    if (errorMessage.includes('missing-key')) {
      throw new Error('Chưa cấu hình API Key. Vui lòng thêm trong phần Cài đặt.');
    }
    
    // Xử lý lỗi 429 Quota Exceeded
    if (error?.status === 429 || errorMessage.includes('429') || errorMessage.includes('quota')) {
      throw new Error('API Key của bạn đã hết hạn mức sử dụng (Quota Exceeded).');
    }
    
    // Ném lỗi chi tiết ra màn hình để dễ debug
    throw new Error(`Lỗi hệ thống: ${errorMessage || 'Vui lòng thử lại sau.'}`);
  }
}


