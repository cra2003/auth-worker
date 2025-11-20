import { describe, it, beforeEach, afterEach } from 'mocha';
import { expect } from 'chai';
import sinon from 'sinon';
import * as userModel from '../../src/models/user.model.js';
import { createDbStub } from '../helpers/db.stub.js';

describe('User Model', () => {
	let sandbox;
	let db;

	beforeEach(() => {
		sandbox = sinon.createSandbox();
		db = createDbStub();
	});

	afterEach(() => {
		sandbox.restore();
	});

	describe('findUserByEmailHash', () => {
		it('should find user by email hash', async () => {
			const emailHash = 'email-hash-123';
			const mockUser = {
				user_id: 'user-123',
				email_hash: emailHash,
				first_name: 'John',
				last_name: 'Doe'
			};

			const queryChain = db.prepareFirst('SELECT * FROM users WHERE email_hash = ?', mockUser);

			const result = await userModel.findUserByEmailHash(db, emailHash);

			expect(db.prepare.calledOnce).to.be.true;
			expect(queryChain.first.calledOnce).to.be.true;
			expect(result).to.deep.equal(mockUser);
		});

		it('should return null when user not found', async () => {
			const emailHash = 'non-existent-hash';

			db.prepareFirst('SELECT * FROM users WHERE email_hash = ?', null);

			const result = await userModel.findUserByEmailHash(db, emailHash);

			expect(db.prepare.calledOnce).to.be.true;
			expect(result).to.be.null;
		});
	});

	describe('findUserById', () => {
		it('should find user by id', async () => {
			const userId = 'user-123';
			const mockUser = {
				user_id: userId,
				first_name: 'John',
				last_name: 'Doe'
			};

			const queryChain = db.prepareFirst('SELECT * FROM users WHERE user_id = ?', mockUser);

			const result = await userModel.findUserById(db, userId);

			expect(db.prepare.calledOnce).to.be.true;
			expect(queryChain.first.calledOnce).to.be.true;
			expect(result).to.deep.equal(mockUser);
		});

		it('should return null when user not found', async () => {
			const userId = 'non-existent-id';

			db.prepareFirst('SELECT * FROM users WHERE user_id = ?', null);

			const result = await userModel.findUserById(db, userId);

			expect(result).to.be.null;
		});
	});

	describe('insertUser', () => {
		it('should insert user successfully', async () => {
			const userData = {
				user_id: 'user-123',
				email_hash: 'email-hash',
				email_cipher: 'encrypted-email',
				first_name: 'John',
				last_name: 'Doe',
				password_hash: 'hashed-password',
				phone_cipher: 'encrypted-phone',
				addresses_cipher: null,
				profile_image_url: null,
				language: 'en',
				default_currency: 'USD',
				is_member: 1,
				status: 'active',
				disabled_reason: null,
				created_ip: '127.0.0.1',
				user_agent: 'test-agent'
			};

			const queryChain = db.prepareRun('INSERT INTO users', { success: true });

			await userModel.insertUser(db, userData);

			expect(db.prepare.calledOnce).to.be.true;
			expect(queryChain.run.calledOnce).to.be.true;
		});

		it('should handle null optional fields', async () => {
			const userData = {
				user_id: 'user-123',
				email_hash: 'email-hash',
				email_cipher: 'encrypted-email',
				first_name: 'John',
				last_name: 'Doe',
				password_hash: 'hashed-password',
				phone_cipher: null,
				addresses_cipher: null,
				profile_image_url: null,
				language: 'en',
				default_currency: 'USD',
				is_member: 0,
				status: 'active',
				disabled_reason: null,
				created_ip: '127.0.0.1',
				user_agent: 'test-agent'
			};

			const queryChain = db.prepareRun('INSERT INTO users', { success: true });

			await userModel.insertUser(db, userData);

			expect(queryChain.run.calledOnce).to.be.true;
		});

		it('should use default values for language and currency', async () => {
			const userData = {
				user_id: 'user-123',
				email_hash: 'email-hash',
				email_cipher: 'encrypted-email',
				first_name: 'John',
				last_name: 'Doe',
				password_hash: 'hashed-password',
				phone_cipher: null,
				addresses_cipher: null,
				profile_image_url: null,
				language: null,
				default_currency: null,
				is_member: 1,
				status: 'active',
				disabled_reason: null,
				created_ip: '127.0.0.1',
				user_agent: 'test-agent'
			};

			const queryChain = db.prepareRun('INSERT INTO users', { success: true });

			await userModel.insertUser(db, userData);

			expect(queryChain.run.calledOnce).to.be.true;
		});
	});

	describe('updateUser', () => {
		it('should update user fields', async () => {
			const userId = 'user-123';
			const updates = {
				first_name: 'Jane',
				last_name: 'Smith',
				language: 'fr'
			};

			const queryChain = db.prepareRun('UPDATE users SET', { success: true });

			await userModel.updateUser(db, userId, updates);

			expect(db.prepare.calledOnce).to.be.true;
			expect(queryChain.run.calledOnce).to.be.true;
		});

		it('should update updated_at timestamp', async () => {
			const userId = 'user-123';
			const updates = {
				first_name: 'Jane'
			};

			db.prepareRun('UPDATE users SET', { success: true });

			await userModel.updateUser(db, userId, updates);

			const sql = db.prepare.firstCall.args[0];
			expect(sql).to.include('updated_at = CURRENT_TIMESTAMP');
		});

		it('should handle multiple updates', async () => {
			const userId = 'user-123';
			const updates = {
				first_name: 'Jane',
				last_name: 'Smith',
				email_hash: 'new-hash',
				email_cipher: 'new-cipher',
				phone_cipher: 'new-phone',
				language: 'es',
				default_currency: 'EUR'
			};

			const queryChain = db.prepareRun('UPDATE users SET', { success: true });

			await userModel.updateUser(db, userId, updates);

			expect(queryChain.run.calledOnce).to.be.true;
		});

		it('should handle empty updates object', async () => {
			const userId = 'user-123';
			const updates = {};

			const queryChain = db.prepareRun('UPDATE users SET', { success: true });

			await userModel.updateUser(db, userId, updates);

			expect(queryChain.run.calledOnce).to.be.true;
		});
	});

	describe('updateUserLastLogin', () => {
		it('should update last login timestamp and IP', async () => {
			const userId = 'user-123';
			const ip = '192.168.1.1';

			const queryChain = db.prepareRun('UPDATE users SET last_login_ip', { success: true });

			await userModel.updateUserLastLogin(db, userId, ip);

			expect(db.prepare.calledOnce).to.be.true;
			expect(queryChain.run.calledOnce).to.be.true;
			const sql = db.prepare.firstCall.args[0];
			expect(sql).to.include('last_login_at = CURRENT_TIMESTAMP');
			expect(sql).to.include('last_login_ip = ?');
		});

		it('should handle null IP', async () => {
			const userId = 'user-123';
			const ip = null;

			const queryChain = db.prepareRun('UPDATE users SET last_login_ip', { success: true });

			await userModel.updateUserLastLogin(db, userId, ip);

			expect(queryChain.run.calledOnce).to.be.true;
		});
	});
});

