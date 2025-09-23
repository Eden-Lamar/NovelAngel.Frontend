function CapitalizeFirstLetter(str) {
	if (typeof str !== 'string' || str.length === 0) {
		return str; // Handle empty or non-string inputs
	}
	return str.charAt(0).toUpperCase() + str.slice(1);
}

const getCountryFlagCode = (country) => {
	const flagMap = {
		'Chinese': 'cn',
		'Japanese': 'jp',
		'South Korean': 'kr'
	};
	return flagMap[country] || 'un'; // fallback to UN flag if country not found
};

// // Example usage:
// const originalString = "hello world";
// const capitalizedString = capitalizeFirstLetter(originalString);
// console.log(capitalizedString); // Output: Hello world

export { CapitalizeFirstLetter, getCountryFlagCode };