export interface AiConfig {
  id: string
  provider: string
  endpoint: string
  model: string
  createdAt: string
  updatedAt: string
}

export interface AiProviderOption {
  id: string
  name: string
  defaultEndpoint: string
  defaultModel: string
  description?: string
}

export const AI_PROVIDERS: AiProviderOption[] = [
  {
    id: 'openai',
    name: 'OpenAI',
    defaultEndpoint: 'https://api.openai.com/v1/chat/completions',
    defaultModel: 'gpt-4o',
    description: 'OpenAI GPT 模型',
  },
  {
    id: 'anthropic',
    name: 'Anthropic',
    defaultEndpoint: 'https://api.anthropic.com/v1/messages',
    defaultModel: 'claude-3-5-sonnet-20241022',
    description: 'Claude 系列模型',
  },
  {
    id: 'custom',
    name: '自定义 OpenAI 兼容',
    defaultEndpoint: 'https://api.example.com/v1/chat/completions',
    defaultModel: 'gpt-4o',
    description: '任何兼容 OpenAI API 格式的服务',
  },
]
