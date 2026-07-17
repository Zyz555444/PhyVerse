import crypto from 'crypto'

const RSA_PRIVATE_KEY_BASE64 = process.env.RSA_PRIVATE_KEY_BASE64
const RSA_PUBLIC_KEY_BASE64 = process.env.RSA_PUBLIC_KEY_BASE64
const AI_KEY_ENCRYPTION_KEY_BASE64 = process.env.AI_KEY_ENCRYPTION_KEY_BASE64

if (!RSA_PRIVATE_KEY_BASE64 || !RSA_PUBLIC_KEY_BASE64) {
  throw new Error(
    'RSA_PRIVATE_KEY_BASE64 and RSA_PUBLIC_KEY_BASE64 environment variables are required'
  )
}

if (!AI_KEY_ENCRYPTION_KEY_BASE64) {
  throw new Error('AI_KEY_ENCRYPTION_KEY_BASE64 environment variable is required')
}

const privateKey = Buffer.from(RSA_PRIVATE_KEY_BASE64, 'base64').toString('utf-8')
const publicKey = Buffer.from(RSA_PUBLIC_KEY_BASE64, 'base64').toString('utf-8')
const aesKey = Buffer.from(AI_KEY_ENCRYPTION_KEY_BASE64, 'base64')

if (aesKey.length !== 32) {
  throw new Error('AI_KEY_ENCRYPTION_KEY_BASE64 must decode to 32 bytes')
}

export interface EncryptedKeyBundle {
  encrypted: string
  iv: string
  tag: string
}

export function getPublicKey(): string {
  return publicKey
}

export function rsaDecrypt(base64CipherText: string): string {
  const buffer = Buffer.from(base64CipherText, 'base64')
  const decrypted = crypto.privateDecrypt(
    {
      key: privateKey,
      padding: crypto.constants.RSA_PKCS1_OAEP_PADDING,
      oaepHash: 'sha256',
    },
    buffer
  )
  return decrypted.toString('utf-8')
}

export function aesEncrypt(plainText: string): EncryptedKeyBundle {
  const iv = crypto.randomBytes(16)
  const cipher = crypto.createCipheriv('aes-256-gcm', aesKey, iv)
  const encrypted = Buffer.concat([cipher.update(plainText, 'utf-8'), cipher.final()])
  const tag = cipher.getAuthTag()
  return {
    encrypted: encrypted.toString('base64'),
    iv: iv.toString('base64'),
    tag: tag.toString('base64'),
  }
}

export function aesDecrypt(bundle: EncryptedKeyBundle): string {
  const decipher = crypto.createDecipheriv('aes-256-gcm', aesKey, Buffer.from(bundle.iv, 'base64'))
  decipher.setAuthTag(Buffer.from(bundle.tag, 'base64'))
  const decrypted = Buffer.concat([
    decipher.update(Buffer.from(bundle.encrypted, 'base64')),
    decipher.final(),
  ])
  return decrypted.toString('utf-8')
}
