import bcrypt from 'bcryptjs';
import { normalizeEmail, sha256Hex } from '../utils/crypto.util.js';
import { encryptData, decryptData } from './encryption.service.js';
import { generateAccessToken, generateRefreshToken, hashRefreshToken } from './token.service.js';
import { setRefreshTokenCookie, getRefreshTokenFromCookie, clearAuthCookies } from './cookie.service.js';
import { getClientInfo } from '../utils/client.util.js';
import { findUserByEmailHash, findUserById, insertUser, updateUser, updateUserLastLogin } from '../models/user.model.js';
import { storeRefreshToken, revokeRefreshToken, getRefreshToken, revokeAllUserRefreshTokens } from '../models/refresh-token.model.js';
import { logEvent, logError } from './log.service.js';

export async function registerUser(c) {
	try {
		const body = await c.req.json();
		const emailNorm = normalizeEmail(body.email);
		const email_hash = await sha256Hex(emailNorm);
		if (!body.password || !body.first_name || !body.last_name || !emailNorm) {
			return c.json({ error: 'Missing required fields' }, 400);
		}
		const exists = await findUserByEmailHash(c.env.DB, email_hash);
		if (exists) return c.json({ error: 'User already exists' }, 409);

		const encKey = c.env.AUTH_ENC_KEY || c.env.ENCRYPTION_KEY || '';
		const email_cipher = await encryptData(emailNorm, encKey);
		const phone_cipher = body.phone ? await encryptData(String(body.phone), encKey) : null;
		const addresses_cipher = Array.isArray(body.addresses)
			? await encryptData(JSON.stringify(body.addresses), encKey)
			: null;
		const password_hash = await bcrypt.hash(String(body.password), 10);
		const user_id = crypto.randomUUID();
		const { ip, ua } = getClientInfo(c);

		await insertUser(c.env.DB, {
			user_id, email_hash, email_cipher, first_name: body.first_name, last_name: body.last_name, password_hash,
			phone_cipher, addresses_cipher, profile_image_url: body.profile_image_url, language: body.language, default_currency: body.default_currency,
			is_member: body.is_member, status: 'active', disabled_reason: null, created_ip: ip, user_agent: ua
		});

		// issue tokens
		const accessToken = await generateAccessToken(
			{ user_id, first_name: body.first_name, last_name: body.last_name, email_hash, password_changed_at: null },
			c.env.JWT_SECRET
		);
		const refreshToken = await generateRefreshToken();
		const token_hash = await hashRefreshToken(refreshToken);
		const token_id = crypto.randomUUID();
		const expires_at = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
		await storeRefreshToken(c.env.DB, {
			token_id, user_id, token_hash, user_agent: ua, ip_address: ip, expires_at
		});
		setRefreshTokenCookie(c, refreshToken);
		await logEvent(c.env, 'register_success', { user_id });
		return c.json({ accessToken });
	} catch (err) {
		await logError(c.env, 'register_error', { message: err?.message });
		return c.json({ error: 'Registration failed' }, 500);
	}
}

export async function loginUser(c) {
	try {
		const { email, password } = await c.req.json();
		const emailNorm = normalizeEmail(email);
		if (!emailNorm || !password) return c.json({ error: 'Missing credentials' }, 400);
		const email_hash = await sha256Hex(emailNorm);
		const user = await findUserByEmailHash(c.env.DB, email_hash);
		if (!user) return c.json({ error: 'Invalid credentials' }, 401);
		const ok = await bcrypt.compare(String(password), user.password_hash);
		if (!ok) return c.json({ error: 'Invalid credentials' }, 401);

		const { ip, ua } = getClientInfo(c);
		await updateUserLastLogin(c.env.DB, user.user_id, ip);

		const accessToken = await generateAccessToken(user, c.env.JWT_SECRET);
		const refreshToken = await generateRefreshToken();
		const token_hash = await hashRefreshToken(refreshToken);
		const token_id = crypto.randomUUID();
		const expires_at = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
		await storeRefreshToken(c.env.DB, { token_id, user_id: user.user_id, token_hash, user_agent: ua, ip_address: ip, expires_at });
		setRefreshTokenCookie(c, refreshToken);
		await logEvent(c.env, 'login_success', { user_id: user.user_id });
		return c.json({ accessToken });
	} catch (err) {
		await logError(c.env, 'login_error', { message: err?.message });
		return c.json({ error: 'Login failed' }, 500);
	}
}

export async function refreshToken(c) {
	try {
		const rt = getRefreshTokenFromCookie(c);
		if (!rt) return c.json({ error: 'No refresh token' }, 401);
		const token_hash = await hashRefreshToken(rt);
		const rec = await getRefreshToken(c.env.DB, token_hash);
		if (!rec) return c.json({ error: 'Invalid refresh token' }, 401);
		if (new Date(rec.expires_at).getTime() <= Date.now()) {
			await revokeRefreshToken(c.env.DB, { token_hash });
			return c.json({ error: 'Refresh token expired' }, 401);
		}
		// rotate
		await revokeRefreshToken(c.env.DB, { token_hash });
		const user = await findUserById(c.env.DB, rec.user_id);
		if (!user) return c.json({ error: 'User not found' }, 404);

		const accessToken = await generateAccessToken(user, c.env.JWT_SECRET);
		const newRt = await generateRefreshToken();
		const newHash = await hashRefreshToken(newRt);
		const { ip, ua } = getClientInfo(c);
		const expires_at = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
		await storeRefreshToken(c.env.DB, {
			token_id: crypto.randomUUID(), user_id: user.user_id, token_hash: newHash, user_agent: ua, ip_address: ip, expires_at
		});
		setRefreshTokenCookie(c, newRt);
		return c.json({ accessToken });
	} catch (err) {
		await logError(c.env, 'refresh_error', { message: err?.message });
		return c.json({ error: 'Refresh failed' }, 500);
	}
}

export async function logoutUser(c) {
	try {
		const rt = getRefreshTokenFromCookie(c);
		if (rt) {
			const token_hash = await hashRefreshToken(rt);
			await revokeRefreshToken(c.env.DB, { token_hash });
		}
		clearAuthCookies(c);
		return c.json({ ok: true });
	} catch {
		return c.json({ ok: true });
	}
}

export async function getCurrentUser(c) {
	const { user_id } = c.get('auth');
	const encKey = c.env.AUTH_ENC_KEY || c.env.ENCRYPTION_KEY || '';
	const user = await findUserById(c.env.DB, user_id);
	if (!user) return c.json({ error: 'Not found' }, 404);
	let email = null, phone = null, addresses = [];
	try { email = await decryptData(user.email_cipher, encKey); } catch { /* Ignore decryption errors */ }
	try { phone = user.phone_cipher ? await decryptData(user.phone_cipher, encKey) : null; } catch { /* Ignore decryption errors */ }
	try { addresses = user.addresses_cipher ? JSON.parse(await decryptData(user.addresses_cipher, encKey)) : []; } catch { /* Ignore decryption errors */ }
	return c.json({
		user: {
			user_id: user.user_id,
			first_name: user.first_name,
			last_name: user.last_name,
			email,
			phone,
			addresses,
			profile_image_url: user.profile_image_url,
			language: user.language,
			default_currency: user.default_currency,
			is_member: !!user.is_member,
			status: user.status,
			created_at: user.created_at,
			updated_at: user.updated_at
		}
	});
}

export async function updateProfile(c) {
	try {
		const { user_id } = c.get('auth');
		const body = await c.req.json();
		const encKey = c.env.AUTH_ENC_KEY || c.env.ENCRYPTION_KEY || '';
		const updates = {};
		if (body.first_name != null) updates.first_name = String(body.first_name);
		if (body.last_name != null) updates.last_name = String(body.last_name);
		if (body.language != null) updates.language = String(body.language);
		if (body.default_currency != null) updates.default_currency = String(body.default_currency);
		if (body.is_member != null) updates.is_member = body.is_member ? 1 : 0;
		if (body.status != null) updates.status = String(body.status);
		if (body.disabled_reason != null) updates.disabled_reason = String(body.disabled_reason);
		if (body.profile_image_url != null) updates.profile_image_url = String(body.profile_image_url);
		if (body.email != null) {
			const emailNorm = normalizeEmail(body.email);
			updates.email_hash = await sha256Hex(emailNorm);
			updates.email_cipher = await encryptData(emailNorm, encKey);
		}
		if (body.phone != null) {
			updates.phone_cipher = body.phone ? await encryptData(String(body.phone), encKey) : null;
		}
		if (body.password) {
			updates.password_hash = await bcrypt.hash(String(body.password), 10);
			updates.password_changed_at = new Date().toISOString();
			await revokeAllUserRefreshTokens(c.env.DB, user_id);
		}
		if (Object.keys(updates).length === 0) return c.json({ ok: true });
		await updateUser(c.env.DB, user_id, updates);
		return c.json({ ok: true });
	} catch (err) {
		await logError(c.env, 'profile_update_error', { message: err?.message });
		return c.json({ error: 'Update failed' }, 500);
	}
}

export async function addAddress(c) {
	try {
		const { user_id } = c.get('auth');
		const addr = await c.req.json(); // { ...fields }
		const encKey = c.env.AUTH_ENC_KEY || c.env.ENCRYPTION_KEY || '';
		const user = await findUserById(c.env.DB, user_id);
		let list = [];
		if (user.addresses_cipher) {
			try { list = JSON.parse(await decryptData(user.addresses_cipher, encKey)); } catch { /* Ignore decryption errors */ }
		}
		const address_id = crypto.randomUUID();
		list.push({ id: address_id, ...addr });
		const cipher = await encryptData(JSON.stringify(list), encKey);
		await updateUser(c.env.DB, user_id, { addresses_cipher: cipher });
		return c.json({ id: address_id });
	} catch (err) {
		await logError(c.env, 'addresses_add_error', { message: err?.message });
		return c.json({ error: 'Add address failed' }, 500);
	}
}

export async function updateAddress(c) {
	try {
		const { user_id } = c.get('auth');
		const addressId = c.req.param('id');
		const update = await c.req.json();
		const encKey = c.env.AUTH_ENC_KEY || c.env.ENCRYPTION_KEY || '';
		const user = await findUserById(c.env.DB, user_id);
		let list = [];
		if (user.addresses_cipher) {
			try { list = JSON.parse(await decryptData(user.addresses_cipher, encKey)); } catch { /* Ignore decryption errors */ }
		}
		let found = false;
		list = list.map((a) => {
			if (a.id === addressId) { found = true; return { ...a, ...update }; }
			return a;
		});
		if (!found) return c.json({ error: 'Address not found' }, 404);
		const cipher = await encryptData(JSON.stringify(list), encKey);
		await updateUser(c.env.DB, user_id, { addresses_cipher: cipher });
		return c.json({ ok: true });
	} catch (err) {
		await logError(c.env, 'addresses_update_error', { message: err?.message });
		return c.json({ error: 'Update address failed' }, 500);
	}
}

export async function deleteAddress(c) {
	try {
		const { user_id } = c.get('auth');
		const addressId = c.req.param('id');
		const encKey = c.env.AUTH_ENC_KEY || c.env.ENCRYPTION_KEY || '';
		const user = await findUserById(c.env.DB, user_id);
		let list = [];
		if (user.addresses_cipher) {
			try { list = JSON.parse(await decryptData(user.addresses_cipher, encKey)); } catch { /* Ignore decryption errors */ }
		}
		const next = list.filter((a) => a.id !== addressId);
		if (next.length === list.length) return c.json({ error: 'Address not found' }, 404);
		const cipher = await encryptData(JSON.stringify(next), encKey);
		await updateUser(c.env.DB, user_id, { addresses_cipher: cipher });
		return c.json({ ok: true });
	} catch (err) {
		await logError(c.env, 'addresses_delete_error', { message: err?.message });
		return c.json({ error: 'Delete address failed' }, 500);
	}
}

