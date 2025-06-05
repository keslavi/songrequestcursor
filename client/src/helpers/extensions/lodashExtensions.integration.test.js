//import { describe, it, expect } from 'vitest';
import '@/helpers/extensions/lodashExtensions';  // Import for side effects

import { isEmpty as namedImport } from 'lodash';
import _ from 'lodash';
const deep = true;
describe('lodash isEmpty extension integration', () => {
  describe('lodash default import', () => {
    it('should use custom function for whitespace strings via _', () => {
      expect(_.isEmpty('   ')).toBe(true);
      expect(_.isEmpty(' \t\n ')).toBe(true);
      expect(_.isEmpty(' a ')).toBe(false);
    });

    it('should support deep comparison via _', () => {
      expect(_.isEmpty({ a: {} }, deep)).toBe(true);
      expect(_.isEmpty({ a: { b: 1 } }, deep)).toBe(false);
    });
  });

  describe('lodash named import', () => {
    it('should use custom function for whitespace strings via named import', () => {
      expect(namedImport('   ')).toBe(true);
      expect(namedImport(' \t\n ')).toBe(true);
      expect(namedImport(' a ')).toBe(false);
    });

    it('should support deep comparison via named import', () => {
      expect(namedImport({ a: {} }, true)).toBe(true);
      expect(namedImport({ a: { b: 1 } }, true)).toBe(false);
    });
  });

  describe('global scope', () => {
    it('should be available globally', () => {
      expect(isEmpty).toBeDefined();
      expect(isEmpty('   ')).toBe(true);
      expect(isEmpty(' \t\n ')).toBe(true);
      expect(isEmpty(' a ')).toBe(false);
    });

    it('should support deep comparison via global', () => {
      expect(isEmpty({ a: {} }, true)).toBe(true);
      expect(isEmpty({ a: { b: 1 } }, true)).toBe(false);
    });
  });
}); 