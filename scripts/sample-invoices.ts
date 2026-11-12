// Single source of truth for the 10 sample invoices (Section 12.1).
// All amounts are numbers with 2 decimals. Currency USD, bill-to "Demo Company LLC".
export interface SampleLine {
	description: string;
	quantity: number;
	unit_price: number;
	amount: number;
}

export interface SampleInvoice {
	key: string; // invoice_01 ... invoice_10
	vendor_name: string;
	invoice_number: string;
	invoice_date: string; // YYYY-MM-DD
	due_date: string | null;
	payment_terms: string | null;
	po_number: string | null;
	currency: string;
	subtotal: number;
	tax: number;
	total: number;
	// How the date is printed on the generated PDF ('iso' = YYYY-MM-DD, 'us' = Oct 16, 2026)
	pdf_date_format: 'iso' | 'us';
	lines: SampleLine[];
}

export const SAMPLE_INVOICES: SampleInvoice[] = [
	{
		key: 'invoice_01',
		vendor_name: 'Northwind Office Supply',
		invoice_number: 'INV-2026-0101',
		invoice_date: '2026-10-05',
		due_date: '2026-11-04',
		payment_terms: null,
		po_number: 'PO-1001',
		currency: 'USD',
		subtotal: 1160.00,
		tax: 92.80,
		total: 1252.80,
		pdf_date_format: 'iso',
		lines: [
			{ description: 'Copy paper (case)', quantity: 10, unit_price: 45.00, amount: 450.00 },
			{ description: 'Toner cartridges', quantity: 4, unit_price: 120.00, amount: 480.00 },
			{ description: 'Ballpoint pens (box)', quantity: 20, unit_price: 11.50, amount: 230.00 },
		],
	},
	{
		key: 'invoice_02',
		vendor_name: 'Harbor IT Services',
		invoice_number: 'INV-2026-0102',
		invoice_date: '2026-10-06',
		due_date: '2026-11-05',
		payment_terms: null,
		po_number: 'PO-1003',
		currency: 'USD',
		subtotal: 7800.00,
		tax: 0.00,
		total: 7800.00,
		pdf_date_format: 'iso',
		lines: [
			{ description: 'Managed IT support – October', quantity: 1, unit_price: 6000.00, amount: 6000.00 },
			{ description: 'Cloud backup subscription', quantity: 1, unit_price: 1200.00, amount: 1200.00 },
			{ description: 'Security patching (hours)', quantity: 5, unit_price: 120.00, amount: 600.00 },
		],
	},
	{
		key: 'invoice_03',
		vendor_name: 'Northwind Office Supply',
		invoice_number: 'INV-2026-0101', // duplicate of invoice_01
		invoice_date: '2026-10-05',
		due_date: '2026-11-04',
		payment_terms: null,
		po_number: 'PO-1001',
		currency: 'USD',
		subtotal: 1160.00,
		tax: 92.80,
		total: 1252.80,
		pdf_date_format: 'iso',
		lines: [
			{ description: 'Copy paper (case)', quantity: 10, unit_price: 45.00, amount: 450.00 },
			{ description: 'Toner cartridges', quantity: 4, unit_price: 120.00, amount: 480.00 },
			{ description: 'Ballpoint pens (box)', quantity: 20, unit_price: 11.50, amount: 230.00 },
		],
	},
	{
		key: 'invoice_04',
		vendor_name: 'Brightline Cleaning Co.',
		invoice_number: 'INV-2026-0104',
		invoice_date: '2026-10-08',
		due_date: '2026-11-07',
		payment_terms: null,
		po_number: 'PO-1002',
		currency: 'USD',
		subtotal: 2400.00, // wrong: lines sum to 2300.00
		tax: 0.00,
		total: 2400.00,
		pdf_date_format: 'iso',
		lines: [
			{ description: 'Weekly office cleaning (4 weeks)', quantity: 4, unit_price: 450.00, amount: 1800.00 },
			{ description: 'Deep clean carpets', quantity: 1, unit_price: 350.00, amount: 350.00 },
			{ description: 'Window washing', quantity: 1, unit_price: 150.00, amount: 150.00 },
		],
	},
	{
		key: 'invoice_05',
		vendor_name: 'Summit Legal Partners',
		invoice_number: 'INV-2026-0105',
		invoice_date: '2026-10-09',
		due_date: '2026-11-08',
		payment_terms: null,
		po_number: null, // no PO number
		currency: 'USD',
		subtotal: 2285.00,
		tax: 0.00,
		total: 2285.00,
		pdf_date_format: 'iso',
		lines: [
			{ description: 'Contract review (hours)', quantity: 8, unit_price: 275.00, amount: 2200.00 },
			{ description: 'Filing fees', quantity: 1, unit_price: 85.00, amount: 85.00 },
		],
	},
	{
		key: 'invoice_06',
		vendor_name: 'Greenleef Landscaping', // typo vs PO vendor Greenleaf Landscaping
		invoice_number: 'INV-2026-0106',
		invoice_date: '2026-10-12',
		due_date: '2026-11-11',
		payment_terms: null,
		po_number: 'PO-1005',
		currency: 'USD',
		subtotal: 1800.00,
		tax: 0.00,
		total: 1800.00,
		pdf_date_format: 'iso',
		lines: [
			{ description: 'Lawn maintenance (monthly)', quantity: 1, unit_price: 1200.00, amount: 1200.00 },
			{ description: 'Shrub trimming', quantity: 1, unit_price: 450.00, amount: 450.00 },
			{ description: 'Mulch delivery', quantity: 1, unit_price: 150.00, amount: 150.00 },
		],
	},
	{
		key: 'invoice_07',
		vendor_name: 'Atlas Freight Lines',
		invoice_number: 'INV-2026-0107',
		invoice_date: '2026-10-14',
		due_date: '2026-11-13',
		payment_terms: null,
		po_number: 'PO-1006',
		currency: 'USD',
		subtotal: 3447.00,
		tax: 0.00,
		total: 3447.00,
		pdf_date_format: 'iso',
		lines: [
			{ description: 'Freight – LTL shipments', quantity: 6, unit_price: 480.00, amount: 2880.00 },
			{ description: 'Fuel surcharge', quantity: 1, unit_price: 432.00, amount: 432.00 },
			{ description: 'Liftgate fee', quantity: 3, unit_price: 45.00, amount: 135.00 },
		],
	},
	{
		key: 'invoice_08',
		vendor_name: 'Metro Power & Light',
		invoice_number: 'INV-2026-0108',
		invoice_date: '2026-10-15',
		due_date: '2026-11-14',
		payment_terms: null,
		po_number: 'PO-1014',
		currency: 'USD',
		subtotal: 2640.00,
		tax: 792.00, // 30% -> unusually high (V003 warning)
		total: 3432.00,
		pdf_date_format: 'iso',
		lines: [
			{ description: 'Electricity – October usage', quantity: 1, unit_price: 2400.00, amount: 2400.00 },
			{ description: 'Demand charge', quantity: 1, unit_price: 180.00, amount: 180.00 },
			{ description: 'Service fee', quantity: 1, unit_price: 60.00, amount: 60.00 },
		],
	},
	{
		key: 'invoice_09',
		vendor_name: 'Ridgeway Equipment Rentals',
		invoice_number: 'INV-2026-0109',
		invoice_date: '2026-10-16', // printed on PDF as Oct 16, 2026, extracted as 2026-10-16
		due_date: '2026-11-15', // computed from Terms: Net 30
		payment_terms: 'Net 30',
		po_number: 'PO-1017',
		currency: 'USD',
		subtotal: 3750.00,
		tax: 0.00,
		total: 3750.00,
		pdf_date_format: 'us',
		lines: [
			{ description: 'Excavator rental – 3 days', quantity: 3, unit_price: 850.00, amount: 2550.00 },
			{ description: 'Delivery & pickup', quantity: 1, unit_price: 400.00, amount: 400.00 },
			{ description: 'Damage waiver', quantity: 1, unit_price: 300.00, amount: 300.00 },
			{ description: 'Operator fee', quantity: 1, unit_price: 500.00, amount: 500.00 },
		],
	},
	{
		key: 'invoice_10',
		vendor_name: 'Bluepeak Advertising',
		invoice_number: 'INV-2026-0110',
		invoice_date: '2026-10-20',
		due_date: '2026-11-19',
		payment_terms: null,
		po_number: 'PO-1016',
		currency: 'USD',
		subtotal: 4500.00,
		tax: 0.00,
		total: 4500.00,
		pdf_date_format: 'iso',
		lines: [
			{ description: 'Google Ads management fee', quantity: 1, unit_price: 1500.00, amount: 1500.00 },
			{ description: 'Social media campaign', quantity: 1, unit_price: 2000.00, amount: 2000.00 },
			{ description: 'Print flyers (500 pcs)', quantity: 1, unit_price: 750.00, amount: 750.00 },
			{ description: 'Trade show registration', quantity: 1, unit_price: 250.00, amount: 250.00 },
		],
	},
];
