const formatRedirects = require('../../src/formatters/redirectsFormatter');

describe('formatRedirects', () => {
    it('format a single redirect correctly', () => {
        const links = [
            ['xDrip', 'short-xdrip', 'https://example.com/full-url']
        ];
        const result = formatRedirects(links);
        expect(result).toBe('short-xdrip  https://example.com/full-url  301');
    });

    it('format multiple redirects correctly', () => {
        const links = [
            ['xDrip', 'short-xdrip', 'https://example.com/xdrip-full-url'],
            ['Android APS', 'short-aps', 'https://example.com/aps-full-url']
        ];
        const result = formatRedirects(links);
        expect(result).toBe('short-xdrip  https://example.com/xdrip-full-url  301\nshort-aps  https://example.com/aps-full-url  301');
    });

    it('format redirect handling special characters correctly', () => {
        const links = [
            ['xDrip', ' shóÒõôrt xdrip@#$%({ ', ' https://example.com/full-url ']
        ];
        const result = formatRedirects(links);
        expect(result).toBe('shoooort-xdrip  https://example.com/full-url  301');
    });

    it('handle empty input', () => {
        const links = [];
        const result = formatRedirects(links);
        expect(result).toBe('');
    });

    it('format redirect correctly with missing fields', () => {
        const links = [
            ['', 'short-xdrip1', 'https://example.com/xdrip-full-url1'], //missing title
            ['xDrip2', 'short-xdrip2', 'https://example.com/xdrip-full-url2'], //OK
            ['xDrip3', '', 'https://example.com/xdrip-full-url3'], //missing short path
            ['xDrip4', 'short-xdrip4', ''], //missing full url
            ['xDrip5', 'short-xdrip5', 'https://example.com/xdrip-full-url5'], //OK
        ];
        const result = formatRedirects(links);
        expect(result).toBe('short-xdrip2  https://example.com/xdrip-full-url2  301\nshort-xdrip5  https://example.com/xdrip-full-url5  301');
    });
});
