import 'dotenv/config'

type Env = {
  POCKETBASE_URL: string
  PB_SUPERUSER_EMAIL: string
  PB_SUPERUSER_PASSWORD: string
  DEMO_USER_EMAIL: string
  DEMO_USER_PASSWORD: string
  LLM_PROVIDER: 'mock' | 'anthropic' | 'openai_compatible'
  LLM_MODEL: string
  ANTHROPIC_API_KEY: string
  OPENAI_COMPAT_BASE_URL: string
  OPENAI_COMPAT_API_KEY: string
  GL_CONFIDENCE_THRESHOLD: number
  PO_TOLERANCE_PCT: number
}

const defaults: Partial<Env> = {
  POCKETBASE_URL: 'http://127.0.0.1:8090',
  LLM_PROVIDER: 'mock',
  LLM_MODEL: 'claude-sonnet-5-5',
  ANTHROPIC_API_KEY: '',
  OPENAI_COMPAT_BASE_URL: '',
  OPENAI_COMPAT_API_KEY: '',
  GL_CONFIDENCE_THRESHOLD: 0.75,
  PO_TOLERANCE_PCT: 5,
}

function required(name: string): string {
  const value = process.env[name]
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`)
  }
  return value
}

export function getConfig(): Env {
  return {
    POCKETBASE_URL: process.env.POCKETBASE_URL ?? defaults.POCKETBASE_URL!,
    PB_SUPERUSER_EMAIL: required('PB_SUPERUSER_EMAIL'),
    PB_SUPERUSER_PASSWORD: required('PB_SUPERUSER_PASSWORD'),
    DEMO_USER_EMAIL: required('DEMO_USER_EMAIL'),
    DEMO_USER_PASSWORD: required('DEMO_USER_PASSWORD'),
    LLM_PROVIDER: (process.env.LLM_PROVIDER ?? defaults.LLM_PROVIDER!) as Env['LLM_PROVIDER'],
    LLM_MODEL: process.env.LLM_MODEL ?? defaults.LLM_MODEL!,
    ANTHROPIC_API_KEY: process.env.ANTHROPIC_API_KEY ?? defaults.ANTHROPIC_API_KEY!,
    OPENAI_COMPAT_BASE_URL: process.env.OPENAI_COMPAT_BASE_URL ?? defaults.OPENAI_COMPAT_BASE_URL!,
    OPENAI_COMPAT_API_KEY: process.env.OPENAI_COMPAT_API_KEY ?? defaults.OPENAI_COMPAT_API_KEY!,
    GL_CONFIDENCE_THRESHOLD: Number(
      process.env.GL_CONFIDENCE_THRESHOLD ?? defaults.GL_CONFIDENCE_THRESHOLD
    ),
    PO_TOLERANCE_PCT: Number(process.env.PO_TOLERANCE_PCT ?? defaults.PO_TOLERANCE_PCT),
  }
}
