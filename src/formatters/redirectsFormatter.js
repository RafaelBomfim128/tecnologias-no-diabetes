const formatPath = require('../utils/formatPath');

function formatRedirects(links) {
    return links
        .filter(([_, shortPath, fullUrl]) => _ && shortPath && fullUrl)
        .map(([_, shortPath, fullUrl]) => `${formatPath(shortPath.trim())}  ${fullUrl.trim()}  301`)
        .join('\n');
}

module.exports = formatRedirects;