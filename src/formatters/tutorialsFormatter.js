const { domainSite } = require('../config/constants');
const formatPath = require('../utils/formatPath');

function formatLinksTutorials(arrItemsSheet) {
    const formattedObj = {};

    arrItemsSheet.forEach(([title, shortPath, fullUrl, categories, description]) => {
        if (!title || !shortPath || !fullUrl || !categories) return;

        const categoryList = categories.split(',').map(cat => cat.trim());

        categoryList.forEach(category => {
            if (!formattedObj[category]) {
                formattedObj[category] = [];
            }

            formattedObj[category].push({
                title,
                shortPath: formatPath(shortPath),
                fullUrl,
                category,
                newLink: `${domainSite}${formatPath(shortPath)}`,
                description: description ? description.trim() : ''
            });
        });
    });

    return formattedObj;
}

module.exports = formatLinksTutorials