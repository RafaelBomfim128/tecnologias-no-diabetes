const formatLinksDownloads = require('../../src/formatters/downloadsFormatter');

describe('formatLinksDownloads', () => {
    it('correctly formats a valid item', () => {
        const input = [['File 1', 'Path 1', 'https://example.com/1']];
        const result = formatLinksDownloads(input);
        expect(result).toEqual([
            {
                title: 'File 1',
                shortPath: 'path-1',
                fullUrl: 'https://example.com/1',
                newLink: expect.stringContaining('path-1'),
                description: ''
            }
        ]);
    });

    it('trims and includes the description when provided', () => {
        const input = [['File 1', 'Path 1', 'https://example.com/1', '  Um app para monitorar a glicemia.  ']];
        const result = formatLinksDownloads(input);
        expect(result[0].description).toBe('Um app para monitorar a glicemia.');
    });

    it('returns empty string for item with missing fields', () => {
        const input = [['', 'Path 2', 'https://example.com/2']];
        const result = formatLinksDownloads(input);
        expect(result).toEqual([]);
    });

    it('ignore invalid items and format only valid ones', () => {
        const input = [
            ['File 1', 'Path 1', 'https://example.com/1'], //valid
            ['', 'Path 2', 'https://example.com/2'], // invalid
            ['File 3', '', 'https://example.com/3'], // invalid
            ['File 4', 'Path 4', 'https://example.com/4'] // valid
        ];

        const result = formatLinksDownloads(input);
        expect(result).toHaveLength(2);
        expect(result[0].newLink).toContain('path-1');
        expect(result[1].newLink).toContain('path-4');
    });

    it('correctly normalizes shortPath to generate clean newLink', () => {
        const input = [['File ÁÇÉ', ' Path ÁÇÉ@#$ 123 ', 'https://example.com']];
        const result = formatLinksDownloads(input);

        expect(result[0].newLink).toContain('path-ace-123');
    });

    it('returns empty array if input is empty', () => {
        const input = [];
        const result = formatLinksDownloads(input);
        expect(result).toEqual([]);
    });

    it('correctly handles links with spaces and special characters', () => {
        const input = [['Special File', 'Path With Spaces And @#$', 'https://example.com/special']];
        const result = formatLinksDownloads(input);

        expect(result[0].newLink).toContain('path-with-spaces-and');
    });

});