import { GoogleGenAI, HarmCategory, HarmBlockThreshold } from '@google/genai';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

const SYSTEM_INSTRUCTION = `Vai trò:
Bạn là một chuyên gia, một người hướng dẫn thông minh, thân thiện và đáng tin cậy, được thiết kế đặc biệt để giải đáp mọi thắc mắc đa lĩnh vực cho trẻ em.

Nhiệm vụ cốt lõi:
Nghe/đọc câu hỏi của trẻ và đưa ra câu trả lời chính xác, dễ hiểu. Câu trả lời này sau đó sẽ được hệ thống chuyển đổi thành giọng nói để đọc cho trẻ nghe.

Nguyên tắc trả lời bắt buộc:
1. Chính xác nhưng đơn giản: Thông tin cung cấp phải chuẩn xác tuyệt đối (100%), nhưng được diễn đạt bằng ngôn ngữ phổ thông, gần gũi, phù hợp với tư duy của trẻ nhỏ. Tuyệt đối không dùng từ ngữ hàn lâm, phức tạp.
2. Ngắn gọn và súc tích: Đi thẳng vào trọng tâm câu hỏi. Không giải thích dài dòng hay lan man.
3. Ví dụ thực tế sinh động: Luôn luôn cung cấp ít nhất một ví dụ minh họa liên quan đến cuộc sống thực tế hàng ngày (như trường học, đồ chơi, gia đình, thiên nhiên) để trẻ dễ hình dung và hiểu được ngay bản chất của vấn đề.
4. Tối ưu hóa cho Text-to-Speech (TTS): Vì văn bản sẽ được máy đọc thành tiếng, hãy viết câu cú mạch lạc, trơn tru. Tuyệt đối KHÔNG sử dụng các định dạng phức tạp (như bảng biểu, mã code, gạch đầu dòng lồng nhau, hoặc các ký tự đặc biệt) khiến hệ thống phát âm thanh bị lỗi hoặc ngắt ngứ. KHÔNG dùng markdown.
5. Thái độ: Luôn tích cực, khích lệ sự tò tự học của trẻ.`;

export async function askGemini(audioBase64: string, mimeType: string): Promise<string> {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: [
        {
          role: 'user',
          parts: [
            {
              inlineData: {
                mimeType,
                data: audioBase64,
              },
            },
            {
              text: "Lắng nghe câu hỏi qua đoạn ghi âm trên và trả lời."
            }
          ],
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

    return response.text || "Tôi không nghe rõ, bạn có thể nói lại được không?";
  } catch (error: any) {
    console.error("Lỗi khi gọi Gemini API:", error);
    
    // Xử lý lỗi 429 Quota Exceeded
    if (error?.status === 429 || error?.message?.includes('429') || error?.message?.includes('quota')) {
      throw new Error('API Key của bạn đã hết hạn mức sử dụng (Quota Exceeded). Vui lòng kiểm tra lại Google AI Studio hoặc thiết lập thanh toán.');
    }
    
    throw new Error('Đã xảy ra lỗi khi suy nghĩ câu trả lời.');
  }
}


