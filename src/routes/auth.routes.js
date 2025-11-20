import {
	registerHandler,
	loginHandler,
	refreshHandler,
	logoutHandler,
	meHandler,
	updateProfileHandler,
	addAddressHandler,
	updateAddressHandler,
	deleteAddressHandler
} from '../handlers/auth.handler.js'
import authMiddleware from '../middleware/auth.middleware.js'

const base = '/api/auth'

export function registerAuthRoutes(app) {
	app.post(`${base}/register`, registerHandler)
	app.post(`${base}/login`, loginHandler)
	app.post(`${base}/refresh`, refreshHandler)
	app.post(`${base}/logout`, logoutHandler)
	app.get(`${base}/me`, authMiddleware, meHandler)
	app.put(`${base}/profile`, authMiddleware, updateProfileHandler)
	app.post(`${base}/addresses`, authMiddleware, addAddressHandler)
	app.put(`${base}/addresses/:id`, authMiddleware, updateAddressHandler)
	app.delete(`${base}/addresses/:id`, authMiddleware, deleteAddressHandler)
}

