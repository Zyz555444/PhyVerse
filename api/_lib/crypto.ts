import crypto from 'crypto'
import { sql } from './db.js'

let _aesKey: Buffer | null = null
let _keyVersion: number = 0

async function loadKeyFromEnv(): Promise<Buffer | null> {
  const envKey = process.env.AI_KEY_ENCRYPTION_KEY_BASE64
  if (!envKey) return null
  const key = Buffer.from(envKey, 'base64')
  if (key.length !== 32) {
    throw new Error('AI_KEY_ENCRYPTION_KEY_BASE64 must decode to 32 bytes')
  }
  return key
}

async function loadKeyFromDb(): Promise<{ key: Buffer; version: number } | null> {
  const rows = await sql`SELECT key_value, key_version FROM app_secrets WHERE key_name = 'aes_key'`
  if (rows.length === 0) return null
  return {
    key: Buffer.from(rows[0].key_value, 'base64'),
    version: rows[0].key_version ?? 0,
  }
}

async function persistKey(key: Buffer, version: number): Promise<void> {
  const keyB64 = key.toString('base64')
  await sql`
    INSERT INTO app_secrets (key_name, key_value, key_version)
    VALUES ('aes_key', ${keyB64}, ${version})
    ON CONFLICT (key_name) DO UPDATE SET key_value = ${keyB64}, key_version = ${version}
  `
}

export async function getOrCreateAesKey(): Promise<{ key: Buffer; version: number }> {
  if (_aesKey) return { key: _aesKey, version: _keyVersion }

  // 1) Prefer environment variable as the stable source of truth
  const envKey = await loadKeyFromEnv()
  if (envKey) {
    const dbEntry = await loadKeyFromDb()
    if (dbEntry && envKey.equals(dbEntry.key)) {
      _aesKey = envKey
      _keyVersion = dbEntry.version
      console.log('[crypto] key source=env version=%d (unchanged)', _keyVersion)
      return { key: _aesKey, version: _keyVersion }
    }
    const nextVersion = dbEntry ? dbEntry.version + 1 : 1
    await persistKey(envKey, nextVersion)
    _aesKey = envKey
    _keyVersion = nextVersion
    console.log('[crypto] key source=env version=%d (rotated)', nextVersion)
    return { key: _aesKey, version: _keyVersion }
  }

  // 2) Load from database
  const dbEntry = await loadKeyFromDb()
  if (dbEntry) {
    _aesKey = dbEntry.key
    _keyVersion = dbEntry.version
    console.log('[crypto] key source=db version=%d', _keyVersion)
    return { key: _aesKey, version: _keyVersion }
  }

  // 3) Generate and persist (first deploy / cold start)
  _aesKey = crypto.randomBytes(32)
  _keyVersion = 1
  await persistKey(_aesKey, _keyVersion)
  console.log('[crypto] key source=generated version=%d', _keyVersion)
  return { key: _aesKey, version: _keyVersion }
}

export async function resetAesKeyCache(): Promise<void> {
  _aesKey = null
  _keyVersion = 0
}

export interface EncryptedKeyBundle {
  encrypted: string
  iv: string
  tag: string
  keyVersion: number
}

export async function aesEncrypt(plainText: string): Promise<EncryptedKeyBundle> {
  const { key, version } = await getOrCreateAesKey()
  const iv = crypto.randomBytes(16)
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv)
  const encrypted = Buffer.concat([cipher.update(plainText, 'utf-8'), cipher.final()])
  const tag = cipher.getAuthTag()
  return {
    encrypted: encrypted.toString('base64'),
    iv: iv.toString('base64'),
    tag: tag.toString('base64'),
    keyVersion: version,
  }
}

export class KeyVersionMismatchError extends Error {
  constructor(storedVersion: number, currentVersion: number) {
    super(`AES key version mismatch: data was encrypted with v${storedVersion}, current key is v${currentVersion}`)
    this.name = 'KeyVersionMismatchError'
  }
}

export async function aesDecrypt(bundle: EncryptedKeyBundle): Promise<string> {
  const { key, version } = await getOrCreateAesKey()
  if (bundle.keyVersion !== version) {
    throw new KeyVersionMismatchError(bundle.keyVersion, version)
  }
  const decipher = crypto.createDecipheriv('aes-256-gcm', key, Buffer.from(bundle.iv, 'base64'))
  decipher.setAuthTag(Buffer.from(bundle.tag, 'base64'))
  const decrypted = Buffer.concat([
    decipher.update(Buffer.from(bundle.encrypted, 'base64')),
    decipher.final(),
  ])
  return decrypted.toString('utf-8')
}
