/**
 * Token budget management for AI conversation context.
 * Estimates token counts and trims messages to stay within budget.
 */

interface ChatMessage {
  role: string
  content: string
}

const TOKEN_BUDGET = 8000 // Total token budget for conversation context
const SYSTEM_RESERVE = 2000 // Reserve for system prompt
const MAX_HISTORY_TOKENS = TOKEN_BUDGET - SYSTEM_RESERVE // ~6000 for chat history

/**
 * Crude token estimator: ~1 token per 4 chars for English, ~1 token per 1.5 chars for Chinese.
 * This is an approximation based on common tokenizer behavior.
 */
function estimateTokens(text: string): number {
  let tokens = 0
  for (const char of text) {
    // CJK characters typically consume 1-2 tokens per character
    if (/[\u4e00-\u9fff\u3400-\u4dbf]/.test(char)) {
      tokens += 1.5
    } else {
      tokens += 0.25
    }
  }
  return Math.ceil(tokens)
}

function estimateMessageTokens(msg: ChatMessage): number {
  return estimateTokens(msg.role) + estimateTokens(msg.content)
}

/**
 * Trim conversation messages to fit within the token budget.
 * Always keeps the system message if present. Trims from the oldest messages first.
 */
export function trimMessages(
  messages: ChatMessage[],
  budget: number = MAX_HISTORY_TOKENS
): ChatMessage[] {
  if (messages.length === 0) return messages

  // Always keep system message
  const systemMsg = messages[0]?.role === 'system' ? messages[0] : null
  const chatMessages = systemMsg ? messages.slice(1) : messages

  let totalTokens = systemMsg ? estimateMessageTokens(systemMsg) : 0
  const kept: ChatMessage[] = []

  // Walk from newest to oldest
  for (let i = chatMessages.length - 1; i >= 0; i--) {
    const msgTokens = estimateMessageTokens(chatMessages[i])
    if (totalTokens + msgTokens <= budget) {
      totalTokens += msgTokens
      kept.unshift(chatMessages[i])
    } else {
      break
    }
  }

  // Ensure we keep at least the last 2 user-assistant pairs
  const minMessages = 4
  if (kept.length < minMessages && chatMessages.length >= minMessages) {
    return systemMsg
      ? [systemMsg, ...chatMessages.slice(-minMessages)]
      : chatMessages.slice(-minMessages)
  }

  return systemMsg ? [systemMsg, ...kept] : kept
}

/**
 * Estimate total tokens for a list of messages.
 */
export function estimateTotalTokens(messages: ChatMessage[]): number {
  return messages.reduce((sum, msg) => sum + estimateMessageTokens(msg), 0)
}

export { TOKEN_BUDGET, SYSTEM_RESERVE, MAX_HISTORY_TOKENS }
