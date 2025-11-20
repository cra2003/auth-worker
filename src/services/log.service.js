// =============== LOGGING HELPERS ==================
export const LOG_LEVELS = {
	STRUCTURAL: 'structural',
	EVENT: 'event',
	ERROR: 'error',
}

/**
 * Create log key with hierarchical directory structure:
 * logs/year=YYYY/month=MM/day=DD/hour=HH/level=LEVEL/timestamp-uuid.json
 */
export function createLogKey(timestamp, level) {
	const date = new Date(timestamp);
	const year = date.getUTCFullYear();
	const month = String(date.getUTCMonth() + 1).padStart(2, '0');
	const day = String(date.getUTCDate()).padStart(2, '0');
	const hour = String(date.getUTCHours()).padStart(2, '0');
	
	const suffix = typeof crypto?.randomUUID === 'function' ? crypto.randomUUID() : Math.random().toString(36).slice(2);
	
	// Format: logs/year=2025/month=02/day=14/hour=21/level=structural/2025-02-14T21:03:12.567Z-uuid.json
	return `logs/year=${year}/month=${month}/day=${day}/hour=${hour}/level=${level}/${timestamp}-${suffix}.json`;
}

export async function persistLog(env, entry) {
	if (!env?.LOGS) return;
	try { 
		const key = createLogKey(entry.timestamp, entry.level);
		await env.LOGS.put(key, JSON.stringify(entry));
	} catch {}
}

export function buildLogEntry(level, event, details = {}) {
	return { timestamp: new Date().toISOString(), level, event, details }
}

export async function logStructured(env, event, details) {
	await persistLog(env, buildLogEntry(LOG_LEVELS.STRUCTURAL, event, details))
}

export async function logEvent(env, event, details) {
	await persistLog(env, buildLogEntry(LOG_LEVELS.EVENT, event, details))
}

export async function logError(env, event, details) {
	await persistLog(env, buildLogEntry(LOG_LEVELS.ERROR, event, details))
}

