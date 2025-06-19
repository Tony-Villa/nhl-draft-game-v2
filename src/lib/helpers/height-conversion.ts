/**
 * Convert centimeters to feet and inches format
 * @param cm - Height in centimeters (string or number)
 * @returns Formatted string like "6'2"" or original value if invalid
 */
export function cmToFeetInches(cm: string | number): string {
	if (!cm) return '';
	
	// Handle string input
	const numCm = typeof cm === 'string' ? parseFloat(cm) : cm;
	
	// Return original if not a valid number
	if (isNaN(numCm) || numCm <= 0) return cm.toString();
	
	// Convert cm to inches
	const totalInches = numCm / 2.54;
	
	// Calculate feet and remaining inches
	const feet = Math.floor(totalInches / 12);
	const inches = Math.round(totalInches % 12);
	
	return `${feet}'${inches}"`;
}

/**
 * Check if a height value is in centimeters (typically > 100)
 * @param height - Height value to check
 * @returns true if likely in centimeters
 */
export function isHeightInCm(height: string | number): boolean {
	if (!height) return false;
	const numHeight = typeof height === 'string' ? parseFloat(height) : height;
	return !isNaN(numHeight) && numHeight > 100; // Assume > 100 means cm
}
