import crypto from 'crypto'
import { sql } from './db.js'

let _aesKey: Buffer | null = null

/**
 * Returns the AES-256 key used for encrypting API keys at rest.
 * Uses env var first, then falls back to the database, then generates and persists.
 */
export async function getOrCreateAesKey(): Promise<Buffer> {
  if (_aesKey) return _aesKey

  const envKey = process.env.AI_KEY_ENCRYPTION_KEY_BASE64
  if (envKey) {
    _aesKey = Buffer.from(envKey, 'base64')
    if (_aesKey.length !== 32) {
      throw new Error('AI_KEY_ENCRYPTION_KEY_BASE64 must decode to 32 bytes')
    }
    return _aesKey
  }

  // Try to read from database
  const rows = await sql`SELECT key_value FROM app_secrets WHERE key_name = 'aes_key'`
  if (rows.length > 0) {
    _aesKey = Buffer.from(rows[0].key_value, 'base64')
    return _aesKey
  }

  // Generate and persist
  _aesKey = crypto.randomBytes(32)
  const keyB64 = _aesKey.toString('base64')
  await sql`
    INSERT INTO app_secrets (key_name, key_value)
    VALUES ('aes_key', ${keyB64})
    ON CONFLICT (key_name) DO NOTHING
  `
  return _aesKey
}

export interface EncryptedKeyBundle {
  encrypted: string
  iv: string
  tag: string
}

export async function aesEncrypt(plainText: string): Promise<EncryptedKeyBundle> {
  const key = await getOrCreateAesKey()
  const iv = crypto.randomBytes(16)
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv)
  const encrypted = Buffer.concat([cipher.update(plainText, 'utf-8'), cipher.final()])
  const tag = cipher.getAuthTag()
  return {
    encrypted: encrypted.toString('base64'),
    iv: iv.toString('base64'),
    tag: tag.toString('base64'),
  }
}

export async function aesDecrypt(bundle: EncryptedKeyBundle): Promise<string> {
  const key = await getOrCreateAesKey()
  const decipher = crypto.createDecipheriv('aes-256-gcm', key, Buffer.from(bundle.iv, 'base64'))
  decipher.setAuthTag(Buffer.from(bundle.tag, 'base64'))
  const decrypted = Buffer.concat([
    decipher.update(Buffer.from(bundle.encrypted, 'base64')),
    decipher.final(),
  ])
  return decrypted.toString('utf-8')
}
