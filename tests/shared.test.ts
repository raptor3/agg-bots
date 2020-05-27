import { isDefined } from '../src/shared';

describe('shared', function () {
	describe('isDefined', function () {
		it('should be true for number', function () {
			const result = isDefined(5);
			expect(result).toBe(true);
		});
	});
});