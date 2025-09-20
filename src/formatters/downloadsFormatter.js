const { domainSite } = require('../config/constants');
const formatPath = require('../utils/formatPath');

function formatLinksDownloads(arrItemsSheet) {
    return arrItemsSheet
        .filter(([title, shortPath, fullUrl]) => title && shortPath && fullUrl)
        .map(([title, shortPath, fullUrl]) => ({
            title,
            shortPath: formatPath(shortPath),
            fullUrl,
            newLink: `${domainSite}${formatPath(shortPath)}`
        }));
}

module.exports = formatLinksDownloads;