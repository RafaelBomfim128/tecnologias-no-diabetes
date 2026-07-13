const { domainSite, spreadsheetId } = require('../config/constants')
const formatPath = require('../utils/formatPath')
const sheets = require('../clients/googleSheetsClient');

async function updateSheetLinks(sheetName, column, links) {
    const updatedLinks = links.map(([title, shortPath, fullUrl]) => {
        if (!title || !shortPath || !fullUrl) return [''];
        return [`${domainSite}${formatPath(shortPath)}`];
    });

    await sheets.spreadsheets.values.update({
        spreadsheetId,
        range: `${sheetName}!${column}2`,
        valueInputOption: 'USER_ENTERED',
        requestBody: { values: updatedLinks },
    });

    console.log(`Planilha ${sheetName} atualizada com os novos links na coluna ${column}!`);
};

module.exports = updateSheetLinks