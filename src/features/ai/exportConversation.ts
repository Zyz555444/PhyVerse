/**
 * Export conversation to Markdown format.
 * Generates a well-formatted experiment report from the conversation history.
 */

export interface ExportOptions {
  title?: string
  includeToolCalls?: boolean
  includeTimestamps?: boolean
}

interface ExportMessage {
  role: string
  content: string
  timestamp?: number
}

interface ExportToolCall {
  name: string
  args: Record<string, unknown>
  result: string
  timestamp: number
}

export function exportConversationToMarkdown(
  messages: ExportMessage[],
  toolCalls?: ExportToolCall[],
  options: ExportOptions = {}
): string {
  const { title = 'PhyVerse AI 对话记录', includeToolCalls = true, includeTimestamps = true } = options

  const lines: string[] = []

  // Header
  lines.push(`# ${title}`)
  lines.push('')
  lines.push(`> 导出时间: ${new Date().toLocaleString('zh-CN')}`)
  lines.push(`> 消息数量: ${messages.length}`)
  if (toolCalls && toolCalls.length > 0) {
    lines.push(`> 工具调用: ${toolCalls.length} 次`)
  }
  lines.push('')
  lines.push('---')
  lines.push('')

  // Messages
  for (const msg of messages) {
    if (msg.role === 'system') continue // Skip system messages

    const roleLabel = msg.role === 'user' ? '🧑 用户' : msg.role === 'assistant' ? '🤖 AI 助手' : `🔧 ${msg.role}`
    const timeStr = includeTimestamps && msg.timestamp
      ? ` *(${new Date(msg.timestamp).toLocaleTimeString('zh-CN')})*`
      : ''

    lines.push(`### ${roleLabel}${timeStr}`)
    lines.push('')
    lines.push(msg.content)
    lines.push('')
    lines.push('')
  }

  // Tool calls
  if (includeToolCalls && toolCalls && toolCalls.length > 0) {
    lines.push('---')
    lines.push('')
    lines.push('## 工具调用记录')
    lines.push('')

    for (const tc of toolCalls) {
      const timeStr = new Date(tc.timestamp).toLocaleTimeString('zh-CN')
      lines.push(`### ${tc.name} *(${timeStr})*`)
      lines.push('')
      lines.push('**参数:**')
      lines.push('```json')
      lines.push(JSON.stringify(tc.args, null, 2))
      lines.push('```')
      lines.push('')
      lines.push('**结果:**')
      lines.push(tc.result)
      lines.push('')
      lines.push('')
    }
  }

  lines.push('---')
  lines.push('')
  lines.push('*由 PhyVerse AI Agent 自动生成*')

  return lines.join('\n')
}

/**
 * Trigger browser download of a Markdown file.
 */
export function downloadConversation(markdown: string, filename?: string): void {
  const blob = new Blob([markdown], { type: 'text/markdown;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename || `phyverse-conversation-${new Date().toISOString().slice(0, 10)}.md`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}
