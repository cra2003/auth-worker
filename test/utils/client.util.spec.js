import { describe, it, beforeEach, afterEach } from 'mocha';
import { expect } from 'chai';
import sinon from 'sinon';
import * as clientUtil from '../../src/utils/client.util.js';
import { createContextStub } from '../helpers/db.stub.js';

describe('Client Utils', () => {
	let sandbox;
	let context;

	beforeEach(() => {
		sandbox = sinon.createSandbox();
		context = createContextStub();
	});

	afterEach(() => {
		sandbox.restore();
	});

	describe('getClientInfo', () => {
		it('should extract IP from cf-connecting-ip header', () => {
			context.req.header.withArgs('cf-connecting-ip').returns('192.168.1.1');
			context.req.header.withArgs('user-agent').returns('Mozilla/5.0');

			const result = clientUtil.getClientInfo(context);

			expect(result.ip).to.equal('192.168.1.1');
			expect(result.ua).to.equal('Mozilla/5.0');
		});

		it('should fallback to x-forwarded-for when cf-connecting-ip is missing', () => {
			context.req.header.withArgs('cf-connecting-ip').returns(null);
			context.req.header.withArgs('x-forwarded-for').returns('10.0.0.1');
			context.req.header.withArgs('user-agent').returns('Mozilla/5.0');

			const result = clientUtil.getClientInfo(context);

			expect(result.ip).to.equal('10.0.0.1');
			expect(result.ua).to.equal('Mozilla/5.0');
		});

		it('should fallback to x-real-ip when other headers are missing', () => {
			context.req.header.withArgs('cf-connecting-ip').returns(null);
			context.req.header.withArgs('x-forwarded-for').returns(null);
			context.req.header.withArgs('x-real-ip').returns('172.16.0.1');
			context.req.header.withArgs('user-agent').returns('Mozilla/5.0');

			const result = clientUtil.getClientInfo(context);

			expect(result.ip).to.equal('172.16.0.1');
			expect(result.ua).to.equal('Mozilla/5.0');
		});

		it('should return null for IP when all headers are missing', () => {
			context.req.header.withArgs('cf-connecting-ip').returns(null);
			context.req.header.withArgs('x-forwarded-for').returns(null);
			context.req.header.withArgs('x-real-ip').returns(null);
			context.req.header.withArgs('user-agent').returns('Mozilla/5.0');

			const result = clientUtil.getClientInfo(context);

			expect(result.ip).to.be.null;
			expect(result.ua).to.equal('Mozilla/5.0');
		});

		it('should return null for user-agent when header is missing', () => {
			context.req.header.withArgs('cf-connecting-ip').returns('192.168.1.1');
			context.req.header.withArgs('user-agent').returns(null);

			const result = clientUtil.getClientInfo(context);

			expect(result.ip).to.equal('192.168.1.1');
			expect(result.ua).to.be.null;
		});

		it('should prioritize cf-connecting-ip over other headers', () => {
			context.req.header.withArgs('cf-connecting-ip').returns('192.168.1.1');
			context.req.header.withArgs('x-forwarded-for').returns('10.0.0.1');
			context.req.header.withArgs('x-real-ip').returns('172.16.0.1');
			context.req.header.withArgs('user-agent').returns('Mozilla/5.0');

			const result = clientUtil.getClientInfo(context);

			expect(result.ip).to.equal('192.168.1.1');
		});

		it('should handle empty string headers', () => {
			context.req.header.withArgs('cf-connecting-ip').returns('');
			context.req.header.withArgs('user-agent').returns('');

			const result = clientUtil.getClientInfo(context);

			// Empty strings are falsy, should return null
			expect(result.ip).to.be.null;
			expect(result.ua).to.be.null;
		});

		it('should return both IP and user-agent when available', () => {
			context.req.header.withArgs('cf-connecting-ip').returns('203.0.113.1');
			context.req.header.withArgs('user-agent').returns('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36');

			const result = clientUtil.getClientInfo(context);

			expect(result).to.have.property('ip', '203.0.113.1');
			expect(result).to.have.property('ua', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36');
		});
	});
});

