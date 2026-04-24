import { cn, slugify, formatDate } from '../lib/utils';

describe('Utility Functions', () => {
  describe('cn()', () => {
    it('should merge tailwind classes correctly', () => {
      expect(cn('bg-red-500', 'text-white')).toBe('bg-red-500 text-white');
      expect(cn('bg-red-500', 'bg-blue-500')).toBe('bg-blue-500'); // twMerge handles overrides
    });

    it('should handle conditional classes', () => {
      const isActive = true;
      const isError = false;
      expect(cn('p-4', isActive && 'bg-blue-500', isError && 'text-red-500')).toBe('p-4 bg-blue-500');
    });
  });

  describe('slugify()', () => {
    it('should convert strings to URL-friendly slugs', () => {
      expect(slugify('Hello World!')).toBe('hello-world');
      expect(slugify('  My Awesome Project  ')).toBe('my-awesome-project');
      expect(slugify('This is a test---')).toBe('this-is-a-test');
    });
  });

  describe('formatDate()', () => {
    it('should format date strings correctly', () => {
      const dateString = '2026-04-25T12:00:00Z';
      const formatted = formatDate(dateString);
      // Depending on local timezone this might differ, but generally testing basic string output
      expect(formatted).toContain('2026');
      expect(formatted).toContain('Apr');
    });
  });
});
