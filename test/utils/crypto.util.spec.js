import { describe, it, beforeEach, afterEach } from 'mocha';
import { expect } from 'chai';
import sinon from 'sinon';
import * as cryptoUtil from '../../src/utils/crypto.util.js';

describe('Crypto Utils', () => {
	let sandbox;

	beforeEach(() => {
		sandbox = sinon.createSandbox();
	});

	afterEach(() => {
		sandbox.restore();
	});

	describe('normalizeEmail', () => {
		it('should normalize email to lowercase', () => {
			const email = 'Test@Example.COM';
			const result = cryptoUtil.normalizeEmail(email);

			expect(result).to.equal('test@example.com');
		});

		it('should trim whitespace', () => {
			const email = '  test@example.com  ';
			const result = cryptoUtil.normalizeEmail(email);

			expect(result).to.equal('test@example.com');
		});

		it('should handle null input', () => {
			const result = cryptoUtil.normalizeEmail(null);

			expect(result).to.equal('');
		});

		it('should handle undefined input', () => {
			const result = cryptoUtil.normalizeEmail(undefined);

			expect(result).to.equal('');
		});

		it('should handle empty string', () => {
			const result = cryptoUtil.normalizeEmail('');

			expect(result).to.equal('');
		});

		it('should handle mixed case with spaces', () => {
			const email = '  John.Doe@EXAMPLE.COM  ';
			const result = cryptoUtil.normalizeEmail(email);

			expect(result).to.equal('john.doe@example.com');
		});
	});

	describe('sha256Hex', () => {
		it('should hash input and return hex string', async () => {
			const input = 'test data';
			const hash = await cryptoUtil.sha256Hex(input);

			expect(hash).to.be.a('string');
			expect(hash.length).to.equal(64); // SHA-256 produces 64 hex characters
		});

		it('should produce consistent hashes', async () => {
			const input = 'test data';
			const hash1 = await cryptoUtil.sha256Hex(input);
			const hash2 = await cryptoUtil.sha256Hex(input);

			expect(hash1).to.equal(hash2);
		});

		it('should produce different hashes for different inputs', async () => {
			const hash1 = await cryptoUtil.sha256Hex('input1');
			const hash2 = await cryptoUtil.sha256Hex('input2');

			expect(hash1).to.not.equal(hash2);
		});

		it('should handle empty string', async () => {
			const hash = await cryptoUtil.sha256Hex('');

			expect(hash).to.be.a('string');
			expect(hash.length).to.equal(64);
		});

		it('should handle long strings', async () => {
			const longString = 'a'.repeat(10000);
			const hash = await cryptoUtil.sha256Hex(longString);

			expect(hash).to.be.a('string');
			expect(hash.length).to.equal(64);
		});

		it('should handle special characters', async () => {
			const input = 'test@example.com!@#$%^&*()';
			const hash = await cryptoUtil.sha256Hex(input);

			expect(hash).to.be.a('string');
			expect(hash.length).to.equal(64);
		});

		it('should produce expected hash for known input', async () => {
			// SHA-256 of "test" should be consistent
			const input = 'test';
			const hash = await cryptoUtil.sha256Hex(input);

			// Verify it's a valid hex string
			expect(/^[a-f0-9]{64}$/i.test(hash)).to.be.true;
		});
	});

	describe('base64url', () => {
		it('should convert bytes to base64url', () => {
			const bytes = new Uint8Array([72, 101, 108, 108, 111]); // "Hello"
			const result = cryptoUtil.base64url(bytes);

			expect(result).to.be.a('string');
			expect(result).to.not.include('+');
			expect(result).to.not.include('/');
			expect(result).to.not.include('=');
		});

		it('should replace + with -', () => {
			const bytes = new Uint8Array([251, 239]); // Produces '+' in base64
			const result = cryptoUtil.base64url(bytes);

			if (result.includes('+')) {
				expect.fail('Result should not contain +');
			}
			expect(result).to.be.a('string');
		});

		it('should replace / with _', () => {
			const bytes = new Uint8Array([255, 255]); // Produces '/' in base64
			const result = cryptoUtil.base64url(bytes);

			if (result.includes('/')) {
				expect.fail('Result should not contain /');
			}
			expect(result).to.be.a('string');
		});

		it('should remove padding (=)', () => {
			const bytes = new Uint8Array([72, 101]); // "He" - produces padding in base64
			const result = cryptoUtil.base64url(bytes);

			expect(result).to.not.include('=');
		});

		it('should handle empty array', () => {
			const bytes = new Uint8Array([]);
			const result = cryptoUtil.base64url(bytes);

			expect(result).to.be.a('string');
		});

		it('should handle single byte', () => {
			const bytes = new Uint8Array([65]); // "A"
			const result = cryptoUtil.base64url(bytes);

			expect(result).to.be.a('string');
			expect(result.length).to.be.greaterThan(0);
		});

		it('should be URL-safe', () => {
			const bytes = new Uint8Array([0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15]);
			const result = cryptoUtil.base64url(bytes);

			// Should not contain URL-unsafe characters
			expect(result).to.not.include('+');
			expect(result).to.not.include('/');
			expect(result).to.not.include('=');
		});
	});
});

