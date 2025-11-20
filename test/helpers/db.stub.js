import sinon from 'sinon';

/**
 * Creates a stubbed D1 database object with methods for preparing queries
 */
export function createDbStub() {
	const dbStub = {
		prepare: sinon.stub()
	};

	// Helper to create a query result chain
	const createQueryChain = (result) => ({
		bind: sinon.stub().returnsThis(),
		first: sinon.stub().resolves(result),
		run: sinon.stub().resolves({ success: true, meta: {} }),
		all: sinon.stub().resolves({ results: result ? [result] : [] })
	});

	// Default query stub
	dbStub.prepare.returns(createQueryChain(null));

	// Helper methods to configure responses
	dbStub.prepareQuery = (sql, result) => {
		const chain = createQueryChain(result);
		dbStub.prepare.withArgs(sql).returns(chain);
		return chain;
	};

	dbStub.prepareFirst = (sql, result) => {
		const chain = createQueryChain(result);
		dbStub.prepare.withArgs(sinon.match(sql)).returns(chain);
		return chain;
	};

	dbStub.prepareRun = (sql, result = { success: true }) => {
		const chain = createQueryChain(null);
		chain.run.resolves(result);
		dbStub.prepare.withArgs(sinon.match(sql)).returns(chain);
		return chain;
	};

	return dbStub;
}

/**
 * Creates a mock environment object for testing
 */
export function createEnvStub(overrides = {}) {
	return {
		DB: createDbStub(),
		LOGS: {
			put: sinon.stub().resolves(),
			delete: sinon.stub().resolves(),
			get: sinon.stub().resolves(null)
		},
		JWT_SECRET: 'test-jwt-secret-key',
		AUTH_ENC_KEY: 'test-encryption-key-32-bytes!!',
		ENCRYPTION_KEY: 'test-encryption-key-32-bytes!!',
		...overrides
	};
}

/**
 * Creates a mock Hono context for testing
 */
export function createContextStub(overrides = {}) {
	const context = {
		req: {
			json: sinon.stub(),
			param: sinon.stub(),
			header: sinon.stub().returns(null)
		},
		env: createEnvStub(overrides.env),
		get: sinon.stub(),
		set: sinon.stub(),
		header: sinon.stub(),
		json: sinon.stub((data, status = 200) => {
			context._response = { data, status };
			return { status, json: () => Promise.resolve(data) };
		}),
		text: sinon.stub((data, status = 200) => {
			context._response = { data, status };
			return { status, text: () => Promise.resolve(data) };
		}),
		_response: null,
		...overrides
	};

	return context;
}

