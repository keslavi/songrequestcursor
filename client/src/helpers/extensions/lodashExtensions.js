import _isEmpty from 'lodash/isEmpty';
import _isEqual from 'lodash/isEqual';
import _ from 'lodash';

/**
 * Checks if a value is empty. This is an enhanced version of lodash's isEmpty that adds support for:
 * - Deep emptiness checking of nested objects and arrays
 * - Trimmed string emptiness checking
 * 
 * @param {*} value - The value to check for emptiness
 * @param {boolean} [deep=false] - Whether to perform deep emptiness checking
 * @returns {boolean} Returns true if value is empty, else false
 * 
 * @example
 * 
 * // Trimmed strings
 * isEmpty('   ') // => true
 * isEmpty(' a ') // => false
 * 
 * // Deep emptiness checking
 * isEmpty({ a: {} }, true) // => true
 * isEmpty({ a: { b: [] } }, true) // => true
 * isEmpty({ a: { b: 1 } }, true) // => false
 * isEmpty([[], [{}]], true) // => true
 * isEmpty([[], ['text']], true) // => false

 * // Basic usage (same as lodash)
 * isEmpty([]) // => true
 * isEmpty({}) // => true
 * isEmpty('') // => true
 * isEmpty([1, 2, 3]) // => false* 
 */
const customIsEmpty = (value, deep = false) => {
  // Only check original isEmpty for non-deep checks
  if (!deep) {
    const originalResult = _isEmpty(value);
    if (originalResult) return true;
  }

  // Handle strings
  if (typeof value === 'string') {
    return value.trim().length === 0;
  }
  
  // Handle null/undefined
  if (value == null) return true;
  
  // Handle arrays and objects when deep is true
  if (deep && (Array.isArray(value) || typeof value === 'object')) {
    if (Array.isArray(value)) {
      // For arrays, check if all elements are empty recursively
      return value.length === 0 || value.every(item => customIsEmpty(item, true));
    }
    if (value instanceof Date) return false;
    
    // For objects, check if all values are empty recursively
    const values = Object.values(value);
    return values.length === 0 || values.every(val => customIsEmpty(val, true));
  }
  
  // For non-deep checks or other types, return false
  return false;
};

// Add to global scope using globalThis
globalThis.isEmpty = customIsEmpty;

// Override lodash's isEmpty
_.isEmpty = customIsEmpty;

// Export for both named and default imports
export { customIsEmpty as isEmpty };
export default customIsEmpty;