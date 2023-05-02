/**
 * @jest-environment node
 */

import { Superscribe, MemoryStorage } from '../../src/base';

describe('node sdk', function () {
	const sdk = new Superscribe('http://example.com');

	it('has storage', function () {
		expect(sdk.storage).toBeInstanceOf(MemoryStorage);
	});
});
