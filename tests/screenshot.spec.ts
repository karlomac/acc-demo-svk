import { test, expect } from '@playwright/test'

test('detail page screenshot', async ({ page }) => {
	// Login first
	await page.goto('http://localhost:5173/login', { waitUntil: 'domcontentloaded' })
	await page.waitForTimeout(1000)
	await page.fill('input#email', 'reviewer@ledgerlens.test')
	await page.fill('input#password', 'Demo-Reviewer-123!')
	await Promise.all([
		page.waitForURL('http://localhost:5173/', { waitUntil: 'domcontentloaded' }),
		page.click('button:has-text("Sign in")')
	])
	await page.waitForTimeout(2000)

	// Navigate to detail page
	await page.goto('http://localhost:5173/invoices/jvfr968en3oe7dy', { waitUntil: 'domcontentloaded' })
	await page.waitForTimeout(2000)
	await page.screenshot({ path: '/data/projects/acc-demo/screenshot-detail.png', fullPage: true })
	console.log('Detail screenshot taken')
})
