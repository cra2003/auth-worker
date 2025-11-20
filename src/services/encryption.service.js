const te = new TextEncoder();
const td = new TextDecoder();

// AES-GCM using env.AUTH_ENC_KEY (raw secret)
async function importAesKey(secret) {
	const keyStr = secret || '';
	return crypto.subtle.importKey('raw', te.encode(keyStr), 'AES-GCM', false, ['encrypt', 'decrypt']);
}

export async function encryptData(plaintext, secret) {
	const key = await importAesKey(secret);
	const iv = crypto.getRandomValues(new Uint8Array(12));
	const ct = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, te.encode(String(plaintext)));
	const buffer = new Uint8Array(iv.length + ct.byteLength);
	buffer.set(iv, 0);
	buffer.set(new Uint8Array(ct), iv.length);
	return btoa(String.fromCharCode(...buffer));
}

export async function decryptData(base64, secret) {
	const raw = Uint8Array.from(atob(String(base64 || '')), (c) => c.charCodeAt(0));
	const iv = raw.slice(0, 12);
	const data = raw.slice(12);
	const key = await importAesKey(secret);
	const pt = await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, key, data);
	return td.decode(pt);
}

