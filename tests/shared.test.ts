import { isDefined, testCoverage } from '../src/shared';

describe('shared', function () {
	describe('isDefined', function () {
		it('should be true for number', function () {
			const result = isDefined(5);
			expect(result).toBe(true);
		});
	});

	describe('testCoverage', function () {
		it('should be true', function () {
			const result = testCoverage();
			expect(result).toBe(true);
		});
	});
});