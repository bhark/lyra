import { SECRET } from '$env/static/private'
import crypto from 'crypto'
import { json } from '@sveltejs/kit'

export const POST = async ({ request }) => {
    const body = await request.json()
    const { action, value } = body

    if (action === 'encrypt') return json({ encrypted: encrypt(value) })
    if (action === 'decrypt') return json({ decrypted: decrypt(value) })
}

const encrypt = (value) => {
    const key = Buffer.alloc(32)
    Buffer.from(SECRET).copy(key)
    const iv = crypto.randomBytes(16)

    const today = new Date()

    const cipher = crypto.createCipheriv('aes-256-cbc', key, iv)
    let encrypted = cipher.update(`${value}:${today.toISOString().split('T')[0]}`, 'utf8', 'hex')
    encrypted += cipher.final('hex')

    return `${iv.toString('hex')}:${encrypted}`
}

const decrypt = (value) => {
    const key = Buffer.alloc(32)
    Buffer.from(SECRET).copy(key)
    const [iv, encrypted] = value.split(':').map(v => Buffer.from(v, 'hex'))

    const decipher = crypto.createDecipheriv('aes-256-cbc', key, iv)
    let decrypted = decipher.update(encrypted, 'hex', 'utf8')
    decrypted += decipher.final('utf8')

    const [decryptedValue, date] = decrypted.split(':')

    const daysAgo = Math.abs(Math.floor((new Date() - new Date(date)) / (1000 * 60 * 60 * 24)))
    if (daysAgo > 7) return null

    return decryptedValue
}