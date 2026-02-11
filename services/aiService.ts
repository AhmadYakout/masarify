// OpenRouter Service
const OPENROUTER_API_KEY = "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";
const MODEL = "z-ai/glm-4.5-air:free";
const APP_URL = "https://masrmoney.app"; // Required by OpenRouter
const APP_TITLE = "MasrMoney"; // Required by OpenRouter

const callOpenRouter = async (messages: { role: string; content: string }[], temperature = 0.7) => {
  try {
    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${OPENROUTER_API_KEY}`,
        "Content-Type": "application/json",
        "HTTP-Referer": APP_URL,
        "X-Title": APP_TITLE
      },
      body: JSON.stringify({
        model: MODEL,
        messages: messages,
        temperature: temperature,
        max_tokens: 1000,
      })
    });

    if (!response.ok) {
      console.error("OpenRouter API Error:", response.status, response.statusText);
      return null;
    }

    const data = await response.json();
    return data.choices?.[0]?.message?.content || null;
  } catch (error) {
    console.error("Network Error calling OpenRouter:", error);
    return null;
  }
};

// 1. Categorization
export const categorizeMerchant = async (merchantName: string, amount: number): Promise<string> => {
  const prompt = `Categorize this transaction in Egypt context: "${merchantName}" for amount ${amount}. 
  Return ONLY one word from this list: Food, Transport, Bills, Shopping, Health, Installment, Transfer, Uncategorized.
  Do not explain.`;

  const result = await callOpenRouter([{ role: "user", content: prompt }], 0.1);
  return result?.trim() || 'Uncategorized';
};

// 2. Financial Coach Chat
export const chatWithCoach = async (history: { role: 'user' | 'model'; text: string }[], newMessage: string) => {
  const systemMsg = {
    role: "system",
    content: `You are MasrMoney Coach, a wise Egyptian financial advisor ("El Nas7"). 
    
    IMPORTANT RULES:
    1. Reply ONLY in Egyptian Franco-Arab (Franko/Chat Language). 
    2. Use numbers for letters: 2=a/hamza, 3=ain, 5=kha, 6=ta, 7=ha, 8=ghain, 9=sad/qaf.
    3. Do NOT use standard English sentences. Only use English for specific technical terms (like "Inflation", "Interest rate") but fit them into a Franco sentence.
    4. Do NOT use Arabic Script.
    5. Be helpful, funny, and brotherly ("ya sa7by", "ya basha", "ya ghaly").
    6. Advice on Gold vs USD vs Certificates based on Egyptian market wisdom.
    
    Example input: "Should I buy gold?"
    Example output: "Bos ya sa7by, el dahab daiman zeina w khazina. Law mesh me7tag el felous dela2ty, eshtery sebayek btc aw gneh george. El dollar 7elw bas el dahab aman aktar 3ala el long term."
    `
  };

  const apiMessages = [
    systemMsg,
    ...history.map(h => ({ role: h.role === 'model' ? 'assistant' : 'user', content: h.text })),
    { role: "user", content: newMessage }
  ];

  const responseText = await callOpenRouter(apiMessages);
  return responseText || "Ma3lesh ya basha, el net 3ando hez2a. Garab tany keda?";
};

// 3. Goal Styling (Color & Emoji)
// Since the model is text-only, we ask it to suggest a hex color and emoji.
export const generateGoalStyle = async (goalDescription: string): Promise<{ color: string; emoji: string }> => {
  const prompt = `For a financial goal titled "${goalDescription}", suggest a Hex Color code (gradient start) and a single Emoji. 
  Return strictly in JSON format: {"color": "#RRGGBB", "emoji": "🚀"}`;

  const result = await callOpenRouter([{ role: "user", content: prompt }], 0.5);
  
  try {
    // Attempt to extract JSON if the model includes backticks
    const jsonStr = result?.replace(/```json/g, '').replace(/```/g, '').trim();
    if (jsonStr) {
      const parsed = JSON.parse(jsonStr);
      return { 
        color: parsed.color || '#0055A5', 
        emoji: parsed.emoji || '🎯' 
      };
    }
  } catch (e) {
    console.error("Error parsing goal style", e);
  }

  return { color: '#0055A5', emoji: '🎯' };
};