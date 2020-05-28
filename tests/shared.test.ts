import { isDefined, testCoverage, newFunction1, newFunction2, newFunction3 } from '../src/shared';

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

	describe('newFunction1', function () {
		it('should be true', function () {
			const result = newFunction1();
			expect(result).toBe(true);
		});
	});

	describe('newFunction2', function () {
		it('should be true', function () {
			const result = newFunction2();
			expect(result).toBe(true);
		});
	});
});