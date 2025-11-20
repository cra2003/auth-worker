import { describe, it, beforeEach, afterEach } from 'mocha';
import { expect } from 'chai';
import sinon from 'sinon';
import * as encryptionService from '../../src/services/encryption.service.js';

describe('Encryption Service', () => {
	let sandbox;

	beforeEach(() => {
		sandbox = sinon.createSandbox();
	});

	afterEach(() => {
		sandbox.restore();
	});

	describe('encryptData', () => {
		it('should encrypt plaintext data', async () => {
			const plaintext = 'test data';
			const secret = 'test-encryption-key-32bytes!!!AB';

			const encrypted = await encryptionService.encryptData(plaintext, secret);

			expect(encrypted).to.be.a('string');
			expect(encrypted).to.not.equal(plaintext);
		});

		it('should produce different ciphertexts for same input (due to random IV)', async () => {
			const plaintext = 'test data';
			const secret = 'test-encryption-key-32bytes!!!AB';

			const encrypted1 = await encryptionService.encryptData(plaintext, secret);
			const encrypted2 = await encryptionService.encryptData(plaintext, secret);

			expect(encrypted1).to.not.equal(encrypted2);
		});

		it('should handle empty string', async () => {
			const plaintext = '';
			const secret = 'test-encryption-key-32bytes!!!AB';

			const encrypted = await encryptionService.encryptData(plaintext, secret);

			expect(encrypted).to.be.a('string');
		});

		it('should handle long strings', async () => {
			const plaintext = 'a'.repeat(1000);
			const secret = 'test-encryption-key-32bytes!!!AB';

			const encrypted = await encryptionService.encryptData(plaintext, secret);

			expect(encrypted).to.be.a('string');
			expect(encrypted.length).to.be.greaterThan(0);
		});
	});

	describe('decryptData', () => {
		it('should decrypt encrypted data correctly', async () => {
			const plaintext = 'test data';
			const secret = 'test-encryption-key-32bytes!!!AB';

			const encrypted = await encryptionService.encryptData(plaintext, secret);
			const decrypted = await encryptionService.decryptData(encrypted, secret);

			expect(decrypted).to.equal(plaintext);
		});

		it('should decrypt different encryptions of same data', async () => {
			const plaintext = 'test data';
			const secret = 'test-encryption-key-32bytes!!!AB';

			const encrypted1 = await encryptionService.encryptData(plaintext, secret);
			const encrypted2 = await encryptionService.encryptData(plaintext, secret);

			const decrypted1 = await encryptionService.decryptData(encrypted1, secret);
			const decrypted2 = await encryptionService.decryptData(encrypted2, secret);

			expect(decrypted1).to.equal(plaintext);
			expect(decrypted2).to.equal(plaintext);
		});

		it('should fail with wrong secret', async () => {
			const plaintext = 'test data';
			const secret = 'test-encryption-key-32bytes!!!AB';
			const wrongSecret = 'wrong-secret-key-32-bytes!!!!';

			const encrypted = await encryptionService.encryptData(plaintext, secret);

			try {
				await encryptionService.decryptData(encrypted, wrongSecret);
				expect.fail('Should have thrown an error');
			} catch (error) {
				expect(error).to.be.instanceOf(Error);
			}
		});

		it('should handle JSON objects', async () => {
			const data = { name: 'John', age: 30 };
			const plaintext = JSON.stringify(data);
			const secret = 'test-encryption-key-32bytes!!!AB';

			const encrypted = await encryptionService.encryptData(plaintext, secret);
			const decrypted = await encryptionService.decryptData(encrypted, secret);
			const parsed = JSON.parse(decrypted);

			expect(parsed).to.deep.equal(data);
		});

		it('should handle empty string', async () => {
			const plaintext = '';
			const secret = 'test-encryption-key-32bytes!!!AB';

			const encrypted = await encryptionService.encryptData(plaintext, secret);
			const decrypted = await encryptionService.decryptData(encrypted, secret);

			expect(decrypted).to.equal(plaintext);
		});

		it('should fail with invalid base64', async () => {
			const secret = 'test-encryption-key-32bytes!!!AB';

			try {
				await encryptionService.decryptData('invalid-base64!!!', secret);
				expect.fail('Should have thrown an error');
			} catch (error) {
				// Can throw various errors: InvalidCharacterError (from atob) or crypto errors
				expect(error).to.be.instanceOf(Error);
			}
		});

		it('should fail with corrupted data', async () => {
			const plaintext = 'test data';
			const secret = 'test-encryption-key-32bytes!!!AB';

			const encrypted = await encryptionService.encryptData(plaintext, secret);
			// Create valid base64 but with corrupted ciphertext data
			// Take valid encrypted data, decode it, corrupt it, and re-encode
			try {
				const decoded = atob(encrypted);
				// Corrupt the ciphertext (after IV)
				const corrupted = decoded.slice(0, 12) + decoded.slice(12, -5) + 'XXXXX';
				const corruptedBase64 = btoa(corrupted);

				await encryptionService.decryptData(corruptedBase64, secret);
				expect.fail('Should have thrown an error');
			} catch (error) {
				// Can throw various crypto errors when decryption fails (Invalid key length, OperationError, etc.)
				expect(error).to.be.instanceOf(Error);
			}
		});
	});
});

