import { describe, it, beforeEach, afterEach } from 'mocha';
import { expect } from 'chai';
import sinon from 'sinon';
import * as refreshTokenModel from '../../src/models/refresh-token.model.js';
import { createDbStub } from '../helpers/db.stub.js';

describe('Refresh Token Model', () => {
	let sandbox;
	let db;

	beforeEach(() => {
		sandbox = sinon.createSandbox();
		db = createDbStub();
	});

	afterEach(() => {
		sandbox.restore();
	});

	describe('storeRefreshToken', () => {
		it('should store refresh token successfully', async () => {
			const tokenData = {
				token_id: 'token-123',
				user_id: 'user-123',
				token_hash: 'hash-123',
				user_agent: 'test-agent',
				ip_address: '127.0.0.1',
				expires_at: new Date(Date.now() + 86400000).toISOString()
			};

			const queryChain = db.prepareRun('INSERT INTO refresh_tokens', { success: true });

			await refreshTokenModel.storeRefreshToken(db, tokenData);

			expect(db.prepare.calledOnce).to.be.true;
			expect(queryChain.run.calledOnce).to.be.true;
		});

		it('should handle all required fields', async () => {
			const tokenData = {
				token_id: 'token-123',
				user_id: 'user-123',
				token_hash: 'hash-123',
				user_agent: 'Mozilla/5.0',
				ip_address: '192.168.1.1',
				expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
			};

			const queryChain = db.prepareRun('INSERT INTO refresh_tokens', { success: true });

			await refreshTokenModel.storeRefreshToken(db, tokenData);

			expect(queryChain.run.calledOnce).to.be.true;
		});
	});

	describe('revokeRefreshToken', () => {
		it('should revoke refresh token by hash', async () => {
			const tokenHash = 'hash-123';

			const queryChain = db.prepareRun('UPDATE refresh_tokens SET revoked_at', { success: true });

			await refreshTokenModel.revokeRefreshToken(db, { token_hash: tokenHash });

			expect(db.prepare.calledOnce).to.be.true;
			expect(queryChain.run.calledOnce).to.be.true;
			const sql = db.prepare.firstCall.args[0];
			expect(sql).to.include('revoked_at = CURRENT_TIMESTAMP');
			expect(sql).to.include('revoked_at IS NULL');
		});

		it('should only revoke non-revoked tokens', async () => {
			const tokenHash = 'hash-123';

			const queryChain = db.prepareRun('UPDATE refresh_tokens SET revoked_at', { success: true });

			await refreshTokenModel.revokeRefreshToken(db, { token_hash: tokenHash });

			const sql = db.prepare.firstCall.args[0];
			expect(sql).to.include('WHERE token_hash = ?');
			expect(sql).to.include('AND revoked_at IS NULL');
		});
	});

	describe('getRefreshToken', () => {
		it('should get refresh token by hash', async () => {
			const tokenHash = 'hash-123';
			const mockToken = {
				token_id: 'token-123',
				user_id: 'user-123',
				token_hash: tokenHash,
				user_agent: 'test-agent',
				ip_address: '127.0.0.1',
				expires_at: new Date(Date.now() + 86400000).toISOString(),
				revoked_at: null
			};

			const queryChain = db.prepareFirst('SELECT * FROM refresh_tokens WHERE token_hash = ?', mockToken);

			const result = await refreshTokenModel.getRefreshToken(db, tokenHash);

			expect(db.prepare.calledOnce).to.be.true;
			expect(queryChain.first.calledOnce).to.be.true;
			expect(result).to.deep.equal(mockToken);
		});

		it('should return null when token not found', async () => {
			const tokenHash = 'non-existent-hash';

			const queryChain = db.prepareFirst('SELECT * FROM refresh_tokens WHERE token_hash = ?', null);

			const result = await refreshTokenModel.getRefreshToken(db, tokenHash);

			expect(result).to.be.null;
		});

		it('should only return non-revoked tokens', async () => {
			const tokenHash = 'hash-123';

			const queryChain = db.prepareFirst('SELECT * FROM refresh_tokens WHERE token_hash = ?', null);

			await refreshTokenModel.getRefreshToken(db, tokenHash);

			const sql = db.prepare.firstCall.args[0];
			expect(sql).to.include('revoked_at IS NULL');
		});

		it('should limit to 1 result', async () => {
			const tokenHash = 'hash-123';

			const queryChain = db.prepareFirst('SELECT * FROM refresh_tokens WHERE token_hash = ?', null);

			await refreshTokenModel.getRefreshToken(db, tokenHash);

			const sql = db.prepare.firstCall.args[0];
			expect(sql).to.include('LIMIT 1');
		});
	});

	describe('revokeAllUserRefreshTokens', () => {
		it('should revoke all tokens for a user', async () => {
			const userId = 'user-123';

			const queryChain = db.prepareRun('UPDATE refresh_tokens SET revoked_at', { success: true });

			await refreshTokenModel.revokeAllUserRefreshTokens(db, userId);

			expect(db.prepare.calledOnce).to.be.true;
			expect(queryChain.run.calledOnce).to.be.true;
			const sql = db.prepare.firstCall.args[0];
			expect(sql).to.include('WHERE user_id = ?');
			expect(sql).to.include('revoked_at IS NULL');
		});

		it('should only revoke non-revoked tokens', async () => {
			const userId = 'user-123';

			const queryChain = db.prepareRun('UPDATE refresh_tokens SET revoked_at', { success: true });

			await refreshTokenModel.revokeAllUserRefreshTokens(db, userId);

			const sql = db.prepare.firstCall.args[0];
			expect(sql).to.include('AND revoked_at IS NULL');
		});

		it('should update revoked_at timestamp', async () => {
			const userId = 'user-123';

			const queryChain = db.prepareRun('UPDATE refresh_tokens SET revoked_at', { success: true });

			await refreshTokenModel.revokeAllUserRefreshTokens(db, userId);

			const sql = db.prepare.firstCall.args[0];
			expect(sql).to.include('revoked_at = CURRENT_TIMESTAMP');
		});
	});
});

