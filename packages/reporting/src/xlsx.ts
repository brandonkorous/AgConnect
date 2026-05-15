import ExcelJS from 'exceljs';
import type { CsvCell } from './csv.js';

// Workbook produces frozen-header + autofiltered XLSX. Empty result-set is
// still a valid workbook with just the header row, per acceptance §unit-2.

export type XlsxOptions = {
    sheetName?: string;
    columnWidth?: number;
};

export async function toXlsx(
    rows: ReadonlyArray<Record<string, CsvCell>>,
    columns: ReadonlyArray<string>,
    options: XlsxOptions = {},
): Promise<Buffer> {
    const wb = new ExcelJS.Workbook();
    wb.creator = 'AGCONN';
    wb.created = new Date();

    const ws = wb.addWorksheet(options.sheetName ?? 'Report');
    const width = options.columnWidth ?? 22;
    ws.columns = columns.map((c) => ({ header: c, key: c, width }));

    for (const row of rows) {
        const cell: Record<string, unknown> = {};
        for (const col of columns) {
            const v = row[col];
            cell[col] = v instanceof Date ? v : v ?? '';
        }
        ws.addRow(cell);
    }

    ws.views = [{ state: 'frozen', xSplit: 0, ySplit: 1 }];
    if (columns.length > 0) {
        const lastCol = ws.getColumn(columns.length).letter;
        ws.autoFilter = { from: 'A1', to: `${lastCol}1` };
    }

    const buf = await wb.xlsx.writeBuffer();
    return Buffer.from(buf as ArrayBuffer);
}
