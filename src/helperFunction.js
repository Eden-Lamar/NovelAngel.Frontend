function CapitalizeFirstLetter(str) {
	if (typeof str !== 'string' || str.length === 0) {
		return str; // Handle empty or non-string inputs
	}
	return str.charAt(0).toUpperCase() + str.slice(1);
}

// // Example usage:
// const originalString = "hello world";
// const capitalizedString = capitalizeFirstLetter(originalString);
// console.log(capitalizedString); // Output: Hello world

export { CapitalizeFirstLetter };