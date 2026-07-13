jest.mock('../../src/clients/googleSheetsClient', () => ({
    spreadsheets: {
        values: {
            get: jest.fn()
        }
    }
}));

const sheets = require('../../src/clients/googleSheetsClient')
const readSheetData = require('../../src/utils/readSheetData')

describe('readSheetData', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('Returns the data starting from the second row, if there is any data', async () => {
        sheets.spreadsheets.values.get.mockResolvedValue({
            data: {
                values: [
                    ['Title', 'Short path to link', 'Full link'],
                    ['Line 1'],
                    ['Line 2']
                ]
            }
        });

        const result = await readSheetData('Downloads!A:C');
        expect(result).toEqual([['Line 1'], ['Line 2']]);
    })

    it('returns empty array if there is no data', async () => {
        sheets.spreadsheets.values.get.mockResolvedValue({
            data: {} // without .values
        });

        const result = await readSheetData('Downloads!A:C');
        expect(result).toEqual([]);
    });

})