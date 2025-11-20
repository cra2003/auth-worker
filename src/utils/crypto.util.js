const te = new TextEncoder()
const td = new TextDecoder()

export function normalizeEmail(email) {
	return String(email || '').trim().toLowerCase()
}

export async function sha256Hex(input) {
	const data = te.encode(input)
	const hash = await crypto.subtle.digest('SHA-256', data)
	return Array.from(new Uint8Array(hash)).map((b) => b.toString(16).padStart(2, '0')).join('')
}

export function base64url(bytes) {
	return btoa(String.fromCharCode(...bytes)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '')
}

