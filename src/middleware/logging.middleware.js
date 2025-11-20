import { logStructured, logError } from '../services/log.service.js'

export default async function loggingMiddleware(c, next) {
	const start = Date.now()
	await logStructured(c.env, 'request_received', {
		method: c.req.method, path: c.req.path, ray: c.req.header('cf-ray') ?? null
	})
	try {
		await next()
		await logStructured(c.env, 'request_completed', {
			status: c.res?.status ?? null, durationMs: Date.now() - start
		})
	} catch (err) {
		await logError(c.env, 'request_error', { message: err?.message ?? 'Unknown error' })
		throw err
	}
}

