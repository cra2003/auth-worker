import { describe, it, beforeEach, afterEach } from 'mocha';
import { expect } from 'chai';
import sinon from 'sinon';
import * as cookieService from '../../src/services/cookie.service.js';
import { createContextStub } from '../helpers/db.stub.js';

describe('Cookie Service', () => {
	let sandbox;
	let context;

	beforeEach(() => {
		sandbox = sinon.createSandbox();
		context = createContextStub();
	});

	afterEach(() => {
		sandbox.restore();
	});

	describe('setRefreshTokenCookie', () => {
		it('should set refresh token cookie with correct attributes', () => {
			const token = 'refresh-token-123';

			cookieService.setRefreshTokenCookie(context, token);

			expect(context.header.calledOnce).to.be.true;
			const [headerName, headerValue, options] = context.header.firstCall.args;
			expect(headerName).to.equal('Set-Cookie');
			expect(headerValue).to.include('refresh_token=refresh-token-123');
			expect(headerValue).to.include('HttpOnly');
			expect(headerValue).to.include('Secure');
			expect(headerValue).to.include('SameSite=None');
			expect(headerValue).to.include('Path=/');
			expect(headerValue).to.include('Max-Age=');
			expect(options.append).to.be.true;
		});

		it('should set Max-Age to 7 days', () => {
			const token = 'refresh-token-123';
			const maxAgeSeconds = 60 * 60 * 24 * 7; // 7 days

			cookieService.setRefreshTokenCookie(context, token);

			const [, headerValue] = context.header.firstCall.args;
			const maxAgeMatch = headerValue.match(/Max-Age=(\d+)/);
			expect(maxAgeMatch).to.not.be.null;
			expect(parseInt(maxAgeMatch[1])).to.equal(maxAgeSeconds);
		});

		it('should handle special characters in token', () => {
			const token = 'token-with-special-chars=+/';

			cookieService.setRefreshTokenCookie(context, token);

			const [, headerValue] = context.header.firstCall.args;
			expect(headerValue).to.include('refresh_token=');
		});
	});

	describe('clearAuthCookies', () => {
		it('should clear refresh token cookie', () => {
			cookieService.clearAuthCookies(context);

			expect(context.header.calledOnce).to.be.true;
			const [headerName, headerValue, options] = context.header.firstCall.args;
			expect(headerName).to.equal('Set-Cookie');
			expect(headerValue).to.include('refresh_token=');
			expect(headerValue).to.include('Max-Age=0');
			expect(headerValue).to.include('HttpOnly');
			expect(headerValue).to.include('Secure');
			expect(headerValue).to.include('SameSite=None');
			expect(headerValue).to.include('Path=/');
			expect(options.append).to.be.true;
		});
	});

	describe('getRefreshTokenFromCookie', () => {
		it('should extract refresh token from cookie header', () => {
			const token = 'refresh-token-123';
			context.req.header.withArgs('cookie').returns(`refresh_token=${token}; other_cookie=value`);

			const result = cookieService.getRefreshTokenFromCookie(context);

			expect(result).to.equal(token);
		});

		it('should handle URL-encoded tokens', () => {
			const token = 'token%20with%20spaces';
			context.req.header.withArgs('cookie').returns(`refresh_token=${token}; other_cookie=value`);

			const result = cookieService.getRefreshTokenFromCookie(context);

			expect(result).to.equal('token with spaces');
		});

		it('should return null when cookie is missing', () => {
			context.req.header.withArgs('cookie').returns(null);

			const result = cookieService.getRefreshTokenFromCookie(context);

			expect(result).to.be.null;
		});

		it('should return null when refresh_token cookie is not present', () => {
			context.req.header.withArgs('cookie').returns('other_cookie=value');

			const result = cookieService.getRefreshTokenFromCookie(context);

			expect(result).to.be.null;
		});

		it('should return null when cookie header is empty string', () => {
			context.req.header.withArgs('cookie').returns('');

			const result = cookieService.getRefreshTokenFromCookie(context);

			expect(result).to.be.null;
		});

		it('should extract token when it appears first in cookie string', () => {
			const token = 'refresh-token-123';
			context.req.header.withArgs('cookie').returns(`refresh_token=${token}; other=value`);

			const result = cookieService.getRefreshTokenFromCookie(context);

			expect(result).to.equal(token);
		});

		it('should extract token when it appears later in cookie string', () => {
			const token = 'refresh-token-123';
			context.req.header.withArgs('cookie').returns(`other=value; refresh_token=${token}; another=value`);

			const result = cookieService.getRefreshTokenFromCookie(context);

			expect(result).to.equal(token);
		});
	});
});

