const formatLinksTutorials = require('../../src/formatters/tutorialsFormatter');

describe('formatLinksTutorials', () => {
    it('correctly formats an item with a single category', () => {
        const input = [['Tutorial 1', 'Path 1', 'https://example.com/1', 'Category 1']];
        const result = formatLinksTutorials(input);

        expect(result).toHaveProperty('Category 1');
        expect(result['Category 1']).toHaveLength(1);
        expect(result['Category 1'][0]).toMatchObject({
            title: 'Tutorial 1',
            shortPath: 'path-1',
            fullUrl: 'https://example.com/1',
            category: 'Category 1',
            newLink: expect.stringContaining('path-1')
        });
    });

    it('correctly format an item with more than one category', () => {
        const input = [['Tutorial 1', 'Path 1', 'https://example.com/1', 'Category 1, Category 2']]
        const result = formatLinksTutorials(input);

        expect(Object.keys(result)).toHaveLength(2);

        expect(result['Category 1'][0]).toMatchObject({
            title: 'Tutorial 1',
            shortPath: 'path-1',
            fullUrl: 'https://example.com/1',
            category: 'Category 1',
            newLink: expect.stringContaining('path-1')
        })

        expect(result['Category 2'][0]).toMatchObject({
            title: 'Tutorial 1',
            shortPath: 'path-1',
            fullUrl: 'https://example.com/1',
            category: 'Category 2',
            newLink: expect.stringContaining('path-1')
        })
    })

    it('missing fields in function parameter', () => {
        const input = [
            ['', 'Path 1', 'https://example.com/1', 'Category 1'],
            ['Tutorial 1', '', 'https://example.com/1', 'Category 1'],
            ['Tutorial 1', 'Path 1', '', 'Category 1'],
            ['Tutorial 1', 'Path 1', 'https://example.com/1', '']
        ]
        const result = formatLinksTutorials(input);
        expect(result).toEqual({});
    })

    it('correctly normalizes the shortPath to generate newLink', () => {
        const input = [['File ÁÇÉ', ' Path ÁÇÉ@#$ 123 ', 'https://example.com', 'Category 1']];
        const result = formatLinksTutorials(input);

        expect(result['Category 1'][0].newLink).toContain('path-ace-123');
    })

    it('returns empty object for empty array', () => {
        const input = [];
        const result = formatLinksTutorials(input);

        expect(result).toEqual({});
    });

    it('trims and includes the description when provided', () => {
        const input = [['Tutorial 1', 'Path 1', 'https://example.com/1', 'Category 1', '  Explica como configurar o sensor.  ']];
        const result = formatLinksTutorials(input);

        expect(result['Category 1'][0].description).toBe('Explica como configurar o sensor.');
    });

});