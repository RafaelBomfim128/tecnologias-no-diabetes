jest.mock('../../src/clients/googleSheetsClient', () => ({
    spreadsheets: {
        values: {
            update: jest.fn()
        }
    }
}));

jest.mock('../../src/utils/formatPath', () => jest.fn(p => '/' + p));

const updateSheetLinks = require('../../src/services/sheetUpdater');
const sheets = require('../../src/clients/googleSheetsClient');
const formatPath = require('../../src/utils/formatPath');
const { domainSite, spreadsheetId } = require('../../src/config/constants');

describe('updateSheetLinks', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        jest.spyOn(console, 'log').mockImplementation(() => { }); //Disabling console.log
    });

    afterAll(() => {
        console.log.mockRestore(); //Enabling after tests
    });

    it('sends the formatted data to Google Sheets correctly', async () => {
        const links = [
            ['Title 1', 'path1', 'https://example.com/abc'],
            ['Title 2', 'path2', 'https://example.com/xyz'],
        ];

        await updateSheetLinks('Downloads', 'D', links);

        expect(formatPath).toHaveBeenCalledWith('path1');
        expect(formatPath).toHaveBeenCalledWith('path2');

        expect(sheets.spreadsheets.values.update).toHaveBeenCalledWith({
            spreadsheetId,
            range: 'Downloads!D2',
            valueInputOption: 'USER_ENTERED',
            requestBody: {
                values: [
                    [`${domainSite}/path1`],
                    [`${domainSite}/path2`]
                ]
            }
        });
    });

    it('ignores lines with empty fields', async () => {
        const links = [
            ['Title 1', 'path1', 'https://example.com/abc'],
            ['', 'path2', 'https://example.com/xyz'],
            ['Title 3', '', 'https://example.com/123'],
            ['Title 4', 'path4', ''],
        ];

        await updateSheetLinks('Tutoriais', 'E', links);

        expect(sheets.spreadsheets.values.update).toHaveBeenCalledWith({
            spreadsheetId,
            range: 'Tutoriais!E2',
            valueInputOption: 'USER_ENTERED',
            requestBody: {
                values: [
                    [`${domainSite}/path1`],
                    [''],
                    [''],
                    ['']
                ]
            }
        });
    });
});
