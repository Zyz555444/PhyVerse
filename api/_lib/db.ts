import { neon } from '@neondatabase/serverless'

const DATABASE_URL = process.env.DATABASE_URL

if (!DATABASE_URL) {
  throw new Error('DATABASE_URL environment variable is required')
}

export const sql = neon(DATABASE_URL)

export async function ensureTables(): Promise<void> {
  await sql`
    CREATE TABLE IF NOT EXISTS users (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      email TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      display_name TEXT,
      avatar_url TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `
  await sql`
    CREATE TABLE IF NOT EXISTS scenes (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      name TEXT NOT NULL,
      description TEXT,
      data JSONB NOT NULL,
      is_public BOOLEAN NOT NULL DEFAULT FALSE,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `
  await sql`
      CREATE INDEX IF NOT EXISTS idx_scenes_user_id ON scenes(user_id);
    `
  await sql`
      CREATE TABLE IF NOT EXISTS ai_configs (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        provider TEXT NOT NULL,
        endpoint TEXT NOT NULL,
        model TEXT NOT NULL,
        api_key_encrypted TEXT NOT NULL,
        api_key_iv TEXT NOT NULL,
        api_key_tag TEXT NOT NULL,
        key_version INTEGER NOT NULL DEFAULT 0,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        UNIQUE(user_id)
      );
    `
  await sql`
      CREATE TABLE IF NOT EXISTS app_secrets (
        key_name TEXT PRIMARY KEY,
        key_value TEXT NOT NULL,
        key_version INTEGER NOT NULL DEFAULT 0,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `
  await sql`ALTER TABLE app_secrets ADD COLUMN IF NOT EXISTS key_version INTEGER NOT NULL DEFAULT 0`
  await sql`ALTER TABLE ai_configs ADD COLUMN IF NOT EXISTS key_version INTEGER NOT NULL DEFAULT 0`
}
