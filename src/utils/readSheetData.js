const sheets = require('../clients/googleSheetsClient');
const spreadsheetId = process.env.GOOGLE_SHEET_ID;

async function readSheetData(range) {
    const res = await sheets.spreadsheets.values.get({
        spreadsheetId,
        range,
    });

    return res.data.values ? res.data.values.slice(1) : [];
}

module.exports = readSheetData;