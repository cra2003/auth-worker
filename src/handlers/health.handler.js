export async function healthHandler(c) {
	const checks = {
		status: 'healthy',
		service: 'auth-worker',
		timestamp: new Date().toISOString(),
		bindings: {}
	};

	// Check D1 Database
	try {
		const result = await c.env.DB.prepare('SELECT 1 as test').first();
		checks.bindings.DB = { status: 'ok', test: result?.test === 1 };
	} catch (err) {
		checks.bindings.DB = { status: 'error', error: err.message };
		checks.status = 'degraded';
	}

	// Check R2 Logs (optional)
	if (c.env.LOGS) {
		try {
			// Test write capability
			const testKey = `health-check-${Date.now()}.txt`;
			await c.env.LOGS.put(testKey, 'health check');
			await c.env.LOGS.delete(testKey);
			checks.bindings.LOGS = { status: 'ok' };
		} catch (err) {
			checks.bindings.LOGS = { status: 'error', error: err.message };
			checks.status = 'degraded';
		}
	} else {
		checks.bindings.LOGS = { status: 'not_configured' };
	}

	// Check secrets (existence only, not values)
	checks.secrets = {
		JWT_SECRET: !!c.env.JWT_SECRET,
		AUTH_ENC_KEY: !!(c.env.AUTH_ENC_KEY || c.env.ENCRYPTION_KEY)
	};

	if (!checks.secrets.JWT_SECRET || !checks.secrets.AUTH_ENC_KEY) {
		checks.status = 'degraded';
	}

	const statusCode = checks.status === 'healthy' ? 200 : 503;
	return c.json(checks, statusCode);
}

export function rootHandler(c) {
	return c.text('Auth API running')
}

