import { describe, expect, it } from 'vitest';
import { featureFlagEnabled } from './feature-flags.js';

describe('featureFlagEnabled', () => {
	it.each(['1', 'true', 'TRUE', ' yes ', 'on'])('enables the flag for %s', (value) => {
		expect(featureFlagEnabled(value)).toBe(true);
	});

	it.each([undefined, '', '0', 'false', 'off', 'no'])('disables the flag for %s', (value) => {
		expect(featureFlagEnabled(value)).toBe(false);
	});
});
