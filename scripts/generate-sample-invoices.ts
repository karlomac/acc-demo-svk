import { SAMPLE_INVOICES } from './sample-invoices.js';
import PDFDocument from 'pdfkit';
import * as fs from 'fs';
import * as path from 'path';

const OUT_DIR = path.join(import.meta.dirname, 'generated-pdfs');

function fmtUsDate(iso: string): string {
	const d = new Date(iso + 'T00:00:00');
	return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function money(n: number): string {
	return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n);
}

function renderInvoice(doc: PDFKit.PDFDocument, inv: (typeof SAMPLE_INVOICES)[number]) {
	doc.fontSize(26).font('Helvetica-Bold').fillColor('#0F172A').text('INVOICE', 50, 50);
	doc.fontSize(10).font('Helvetica').fillColor('#5B6577').text('Demo Company LLC — Accounts Payable', 50, 80);

	// Vendor block
	doc.fontSize(12).font('Helvetica-Bold').fillColor('#0F172A').text(inv.vendor_name, 50, 110);
	doc.fontSize(9).font('Helvetica').fillColor('#5B6577').text('Vendor', 50, 124);

	// Meta block (right side)
	const metaX = 400;
	doc.fontSize(9).font('Helvetica-Bold').fillColor('#0F172A').text('Invoice #', metaX, 110);
	doc.fontSize(9).font('Helvetica').fillColor('#5B6577').text(inv.invoice_number, metaX, 124);
	doc.fontSize(9).font('Helvetica-Bold').fillColor('#0F172A').text('Date', metaX, 138);
	const dateStr = inv.pdf_date_format === 'us' ? fmtUsDate(inv.invoice_date) : inv.invoice_date;
	doc.fontSize(9).font('Helvetica').fillColor('#5B6577').text(dateStr, metaX, 152);
	doc.fontSize(9).font('Helvetica-Bold').fillColor('#0F172A').text('PO #', metaX, 166);
	doc.fontSize(9).font('Helvetica').fillColor('#5B6577').text(inv.po_number ?? '—', metaX, 180);
	if (inv.due_date) {
		doc.fontSize(9).font('Helvetica-Bold').fillColor('#0F172A').text('Due', metaX, 194);
		doc.fontSize(9).font('Helvetica').fillColor('#5B6577').text(inv.due_date, metaX, 208);
	}

	// Line items table
	const tableY = 240;
	const colX = [50, 300, 380, 460, 540];
	doc.fontSize(8).font('Helvetica-Bold').fillColor('#475569');
	doc.text('Description', colX[0], tableY);
	doc.text('Qty', colX[1], tableY, { width: 40, align: 'right' });
	doc.text('Unit Price', colX[2], tableY, { width: 70, align: 'right' });
	doc.text('Amount', colX[3], tableY, { width: 80, align: 'right' });

	doc.moveTo(50, tableY + 14).lineTo(580, tableY + 14).strokeColor('#E3E6EB').stroke();

	let y = tableY + 22;
	for (const line of inv.lines) {
		doc.fontSize(9).font('Helvetica').fillColor('#0F172A').text(line.description, colX[0], y, { width: 240 });
		doc.text(String(line.quantity), colX[1], y, { width: 40, align: 'right' });
		doc.text(money(line.unit_price), colX[2], y, { width: 70, align: 'right' });
		doc.text(money(line.amount), colX[3], y, { width: 80, align: 'right' });
		y += 20;
	}

	// Totals
	const totalY = y + 10;
	doc.fontSize(9).font('Helvetica-Bold').fillColor('#0F172A').text('Subtotal', 460, totalY, { width: 80, align: 'right' });
	doc.fontSize(9).font('Helvetica').fillColor('#5B6577').text(money(inv.subtotal), 540, totalY, { width: 50, align: 'right' });
	doc.fontSize(9).font('Helvetica-Bold').fillColor('#0F172A').text('Tax', 460, totalY + 16, { width: 80, align: 'right' });
	doc.fontSize(9).font('Helvetica').fillColor('#5B6577').text(money(inv.tax), 540, totalY + 16, { width: 50, align: 'right' });
	doc.fontSize(11).font('Helvetica-Bold').fillColor('#0F172A').text('Total', 460, totalY + 32, { width: 80, align: 'right' });
	doc.fontSize(11).font('Helvetica-Bold').fillColor('#0F172A').text(money(inv.total), 540, totalY + 32, { width: 50, align: 'right' });
}

async function main() {
	fs.mkdirSync(OUT_DIR, { recursive: true });
	for (const inv of SAMPLE_INVOICES) {
		const doc = new PDFDocument({ size: 'LETTER', margin: 50 });
		const filePath = path.join(OUT_DIR, `${inv.key}.pdf`);
		const stream = fs.createWriteStream(filePath);
		doc.pipe(stream);
		renderInvoice(doc, inv);
		doc.end();
		await new Promise<void>((resolve, reject) => {
			stream.on('finish', () => resolve());
			stream.on('error', reject);
		});
		console.log(`Generated ${filePath}`);
	}
}

main().catch((err) => {
	console.error(err);
	process.exit(1);
});
