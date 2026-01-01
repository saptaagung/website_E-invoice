import PDFDocument from 'pdfkit';

/**
 * Format number to Indonesian currency format
 */
const formatNumber = (num) => {
    return new Intl.NumberFormat('id-ID').format(num);
};

/**
 * Format currency (Rupiah)
 */
const formatCurrency = (amount) => {
    return `Rp ${formatNumber(amount)}`;
};

/**
 * Convert number to Indonesian words (Terbilang)
 */
const numberToWords = (num) => {
    const satuan = ['', 'Satu', 'Dua', 'Tiga', 'Empat', 'Lima', 'Enam', 'Tujuh', 'Delapan', 'Sembilan', 'Sepuluh', 'Sebelas'];

    if (num < 12) return satuan[num];
    if (num < 20) return satuan[num - 10] + ' Belas';
    if (num < 100) return satuan[Math.floor(num / 10)] + ' Puluh' + (num % 10 ? ' ' + satuan[num % 10] : '');
    if (num < 200) return 'Seratus' + (num % 100 ? ' ' + numberToWords(num % 100) : '');
    if (num < 1000) return satuan[Math.floor(num / 100)] + ' Ratus' + (num % 100 ? ' ' + numberToWords(num % 100) : '');
    if (num < 2000) return 'Seribu' + (num % 1000 ? ' ' + numberToWords(num % 1000) : '');
    if (num < 1000000) return numberToWords(Math.floor(num / 1000)) + ' Ribu' + (num % 1000 ? ' ' + numberToWords(num % 1000) : '');
    if (num < 1000000000) return numberToWords(Math.floor(num / 1000000)) + ' Juta' + (num % 1000000 ? ' ' + numberToWords(num % 1000000) : '');
    if (num < 1000000000000) return numberToWords(Math.floor(num / 1000000000)) + ' Milyar' + (num % 1000000000 ? ' ' + numberToWords(num % 1000000000) : '');
    return numberToWords(Math.floor(num / 1000000000000)) + ' Triliun' + (num % 1000000000000 ? ' ' + numberToWords(num % 1000000000000) : '');
};

const terbilang = (amount) => {
    if (amount === 0) return 'Nol Rupiah';
    const rupiah = Math.floor(amount);
    return numberToWords(rupiah) + ' Rupiah';
};

/**
 * Generate Invoice PDF
 */
const PRIMARY_COLOR = '#1e40af'; // Blue-800 matching preview
const TEXT_COLOR = '#333333';
const TEXT_SECONDARY = '#64748b'; // Slate-500
const BG_LIGHT = '#eff6ff'; // Blue-50

function drawHeaderBox(doc, x, y, label, value) {
    doc.font('Helvetica-Bold').fontSize(8).fillColor(TEXT_COLOR);
    doc.text(label, x + 5, y + 6, { width: 55 });
    doc.font('Helvetica').text(value, x + 65, y + 6, { width: 110 });
}

/**
 * Generate Invoice PDF
 */
export function generateInvoicePDF(invoice, companySettings) {
    return new Promise(async (resolve, reject) => {
        try {
            const doc = new PDFDocument({ size: 'A4', margin: 40 });
            const chunks = [];

            doc.on('data', chunk => chunks.push(chunk));
            doc.on('end', () => resolve(Buffer.concat(chunks)));
            doc.on('error', reject);

            const pageWidth = doc.page.width - 80;
            let y = 40;

            // --- HEADER ---
            // Logo
            if (companySettings?.logo) {
                try {
                    let logoData = companySettings.logo;
                    if (typeof logoData === 'string' && logoData.includes('base64,')) {
                        logoData = logoData.split('base64,')[1];
                        logoData = Buffer.from(logoData, 'base64');
                    }
                    doc.image(logoData, 40, y, { width: 60 });
                } catch (e) { }
            }

            // Header Box (Right) - Date & No Invoice
            const boxW = 180;
            const boxX = pageWidth + 40 - boxW;
            let boxY = 40;

            // Outer Border
            doc.rect(boxX, boxY, boxW, 40).strokeColor('#cbd5e1').stroke();
            doc.moveTo(boxX, boxY + 20).lineTo(boxX + boxW, boxY + 20).stroke();
            doc.moveTo(boxX + 60, boxY).lineTo(boxX + 60, boxY + 40).stroke();

            drawHeaderBox(doc, boxX, boxY, 'DATE', new Date(invoice.issueDate).toLocaleDateString('id-ID'));
            drawHeaderBox(doc, boxX, boxY + 20, 'NO INV', invoice.invoiceNumber);

            // Company Info (Left)
            const textX = 110;
            const maxAddrWidth = boxX - textX - 20;

            doc.font('Helvetica-Bold').fontSize(18).fillColor(PRIMARY_COLOR)
                .text(companySettings?.companyName || 'My Company', textX, y, { width: maxAddrWidth });

            let infoY = y + 25;
            doc.font('Helvetica').fontSize(8).fillColor(TEXT_SECONDARY);
            doc.text(companySettings?.address || '', textX, infoY, { width: maxAddrWidth });
            const addrHeight = doc.heightOfString(companySettings?.address || '', { width: maxAddrWidth });
            infoY += addrHeight + 5;

            doc.text(`${companySettings?.city || ''}`, textX, infoY, { width: maxAddrWidth });
            infoY += 12;
            doc.text(`Email: ${companySettings?.email || ''}`, textX, infoY, { width: maxAddrWidth });
            infoY += 12;
            doc.text(`Telp: ${companySettings?.phone || ''}`, textX, infoY, { width: maxAddrWidth });

            y = Math.max(infoY + 20, 100);
            doc.moveTo(40, y).lineTo(pageWidth + 40, y).strokeColor(PRIMARY_COLOR).lineWidth(2).stroke();
            y += 20;

            // --- CUSTOMER BAR ---
            doc.rect(40, y, 100, 25).fill(PRIMARY_COLOR);
            doc.fillColor('#FFFFFF').font('Helvetica-Bold').fontSize(10).text('CUSTOMER', 40, y + 8, { width: 100, align: 'center' });

            doc.rect(140, y, pageWidth - 100, 25).fill(BG_LIGHT);
            const clientText = `${invoice.client?.name || 'Customer'} / UP : ${invoice.client?.contactName || '-'}`;
            doc.fillColor(TEXT_COLOR).font('Helvetica-Bold').text(clientText, 150, y + 8);
            y += 35;

            // --- INTRO TEXT ---
            if (invoice.notes) {
                let introText = invoice.notes;
                // Replace placeholders
                const poNum = invoice.poNumber || invoice.projectName || '____';
                const invNum = invoice.invoiceNumber || '____';
                introText = introText.replace('{PO_NUMBER}', poNum).replace('{INVOICE_NUMBER}', invNum);

                doc.font('Helvetica').fontSize(9).fillColor(TEXT_SECONDARY)
                    .text(introText, 40, y, { width: pageWidth });

                const introHeight = doc.heightOfString(introText, { width: pageWidth });
                y += introHeight + 10;
            }

            // --- ITEMS TABLE ---
            const tableTop = y;
            const colWidths = [100, 175, 40, 90, 90];
            const headers = ['Model', 'Description', 'Qty', 'Price', 'Total'];

            // Header Row
            doc.rect(40, tableTop, pageWidth, 25).fill(PRIMARY_COLOR);

            let xPos = 40;
            doc.font('Helvetica-Bold').fontSize(9).fillColor('#FFFFFF');

            headers.forEach((header, i) => {
                const align = i >= 2 ? 'right' : 'left';
                doc.text(header, xPos + 5, tableTop + 8, { width: colWidths[i] - 10, align: align });
                xPos += colWidths[i];
            });
            y = tableTop + 25;

            // Rows - with grouping
            doc.font('Helvetica').fontSize(9).fillColor(TEXT_COLOR);

            let currentGroup = null;

            invoice.items?.forEach((item, index) => {
                // Check for Group Change
                if (item.groupName && item.groupName !== currentGroup) {
                    currentGroup = item.groupName;
                    doc.rect(40, y, pageWidth, 20).fill('#f1f5f9');
                    doc.fillColor(PRIMARY_COLOR).font('Helvetica-Bold').text(currentGroup, 45, y + 5);
                    y += 20;
                }

                const rowY = y;
                xPos = 40;
                doc.fillColor(TEXT_COLOR).font('Helvetica');

                const values = [
                    item.model || '-',
                    item.description || '',
                    `${item.quantity} ${item.unit || 'unit'}`,
                    formatCurrency(Number(item.rate)),
                    formatCurrency(Number(item.amount))
                ];

                let maxHeight = 0;
                values.forEach((val, i) => {
                    const h = doc.heightOfString(String(val), { width: colWidths[i] - 10 });
                    if (h > maxHeight) maxHeight = h;
                });

                values.forEach((val, i) => {
                    const align = i >= 2 ? 'right' : 'left';
                    doc.text(String(val), xPos + 5, rowY + 5, { width: colWidths[i] - 10, align: align });
                    xPos += colWidths[i];
                });

                y += Math.max(maxHeight, 15) + 5;
                doc.moveTo(40, y).lineTo(pageWidth + 40, y).strokeColor('#EEEEEE').lineWidth(0.5).stroke();

                // Page break check
                if (y > doc.page.height - 200) {
                    doc.addPage();
                    y = 40;
                }
            });

            y += 10;

            // --- TOTALS TABLE (Split Layout like Quotation) ---
            const splitY = y;
            const totalsW = 200;
            const totalsX = pageWidth + 40 - totalsW;
            let currentTotalY = splitY;

            // Helper function for totals
            const drawTotalRow = (label, value, isBold = false, isHighlight = false) => {
                if (isHighlight) {
                    doc.rect(totalsX, currentTotalY, totalsW, 25).fill('#fef08a');
                }
                doc.fillColor(TEXT_COLOR).font(isBold ? 'Helvetica-Bold' : 'Helvetica').fontSize(9);
                doc.text(label, totalsX + 5, currentTotalY + 7, { width: 80 });
                doc.text('Rp', totalsX + 90, currentTotalY + 7, { width: 30, align: 'right' });
                doc.text(value.replace('Rp ', ''), totalsX + 130, currentTotalY + 7, { width: 65, align: 'right' });
                currentTotalY += 25;
            };

            drawTotalRow('TOTAL', formatCurrency(Number(invoice.subtotal)));
            const discountAmount = Number(invoice.discount) || 0;
            if (discountAmount > 0) {
                let percent = 0;
                const subtotal = Number(invoice.subtotal) || 0;
                if (subtotal > 0) {
                    percent = (discountAmount / subtotal) * 100;
                    percent = Math.round(percent * 100) / 100;
                }
                drawTotalRow(`Discount ${percent}%`, `-${formatCurrency(discountAmount)}`, false, false);
            }
            if (Number(invoice.taxAmount) > 0) {
                drawTotalRow(`PPN ${invoice.taxRate}%`, formatCurrency(Number(invoice.taxAmount)));
            }
            drawTotalRow('Grand Total', formatCurrency(Number(invoice.total)), true, true);

            // TERMS (Left)
            let termsY = splitY + 10;
            doc.font('Helvetica-Bold').fontSize(8).fillColor(TEXT_COLOR).text('Syarat dan Ketentuan:', 40, termsY);
            termsY += 15;

            const termsText = invoice.terms || '';
            doc.font('Helvetica').fontSize(9).fillColor(TEXT_SECONDARY)
                .text(termsText, 40, termsY, { width: pageWidth - totalsW - 20 });

            const termsHeight = doc.heightOfString(termsText, { width: pageWidth - totalsW - 20 });

            y = Math.max(currentTotalY, termsY + termsHeight + 20) + 20;

            // --- TERBILANG BAR ---
            doc.rect(40, y, 60, 20).fill(PRIMARY_COLOR);
            doc.fillColor('#FFFFFF').font('Helvetica-Bold').fontSize(9).text('Terbilang :', 40, y + 6, { width: 60, align: 'center' });

            doc.rect(100, y, pageWidth - 60, 20).fill(BG_LIGHT);
            doc.fillColor(PRIMARY_COLOR).font('Helvetica-Oblique').text(terbilang(Number(invoice.total)), 110, y + 6);
            y += 40;

            // --- FOOTER / SIGNATURE ---
            // No bank details for Invoices

            // Signature (Right) - No image, wet signature space
            const sigY = y;
            const sigX = pageWidth - 120;
            doc.font('Helvetica').fontSize(9).fillColor(TEXT_SECONDARY).text('Hormat Kami,', sigX, sigY, { align: 'center', width: 140 });
            doc.font('Helvetica-Bold').fontSize(10).fillColor(TEXT_COLOR).text(companySettings?.legalName || companySettings?.companyName || '', sigX, sigY + 12, { align: 'center', width: 140 });

            // Leave space for wet signature (no image)
            doc.moveTo(sigX, sigY + 60).lineTo(sigX + 140, sigY + 60).strokeColor('#ccc').stroke();
            doc.text(invoice.signatureName || companySettings?.signatureName || '', sigX, sigY + 65, { align: 'center', width: 140 });

            doc.end();
        } catch (error) {
            reject(error);
        }
    });
}

/**
 * Generate Quotation PDF
 */
export function generateQuotationPDF(quotation, companySettings) {
    return new Promise(async (resolve, reject) => {
        try {
            const doc = new PDFDocument({ size: 'A4', margin: 40 });
            const chunks = [];

            doc.on('data', chunk => chunks.push(chunk));
            doc.on('end', () => resolve(Buffer.concat(chunks)));
            doc.on('error', reject);

            const pageWidth = doc.page.width - 80;
            let y = 40;

            // --- HEADER ---
            // Logo
            if (companySettings?.logo) {
                try {
                    let logoData = companySettings.logo;
                    if (typeof logoData === 'string' && logoData.includes('base64,')) {
                        logoData = logoData.split('base64,')[1];
                        logoData = Buffer.from(logoData, 'base64');
                    }
                    doc.image(logoData, 40, y, { width: 60 });
                } catch (e) { }
            }

            // Header Box (Right) - Date & No
            const boxW = 180;
            const boxX = pageWidth + 40 - boxW;
            let boxY = 40;

            // Outer Border
            doc.rect(boxX, boxY, boxW, 40).strokeColor('#cbd5e1').stroke();
            doc.moveTo(boxX, boxY + 20).lineTo(boxX + boxW, boxY + 20).stroke();
            doc.moveTo(boxX + 60, boxY).lineTo(boxX + 60, boxY + 40).stroke();

            drawHeaderBox(doc, boxX, boxY, 'DATE', new Date(quotation.issueDate).toLocaleDateString('id-ID'));
            drawHeaderBox(doc, boxX, boxY + 20, 'NO SPH', quotation.quotationNumber);

            // Company Info (Left) - Avoid overlap with Box
            const textX = 110;
            const maxAddrWidth = boxX - textX - 20; // Ensure text stops before the box

            doc.font('Helvetica-Bold').fontSize(18).fillColor(PRIMARY_COLOR)
                .text(companySettings?.companyName || 'My Company', textX, y, { width: maxAddrWidth });

            let infoY = y + 25;
            doc.font('Helvetica').fontSize(8).fillColor(TEXT_SECONDARY);
            doc.text(companySettings?.address || '', textX, infoY, { width: maxAddrWidth });
            // Calculate height of address to push down email/phone
            const addrHeight = doc.heightOfString(companySettings?.address || '', { width: maxAddrWidth });
            infoY += addrHeight + 5;

            doc.text(`${companySettings?.city || ''}`, textX, infoY, { width: maxAddrWidth });
            infoY += 12;
            doc.text(`Email: ${companySettings?.email || ''}`, textX, infoY, { width: maxAddrWidth });
            infoY += 12;
            doc.text(`Telp: ${companySettings?.phone || ''}`, textX, infoY, { width: maxAddrWidth });

            y = Math.max(infoY + 20, 100);
            doc.moveTo(40, y).lineTo(pageWidth + 40, y).strokeColor(PRIMARY_COLOR).lineWidth(2).stroke();
            y += 20;

            // --- CUSTOMER BAR ---
            // "CUSTOMER" Blue Box
            doc.rect(40, y, 100, 25).fill(PRIMARY_COLOR);
            doc.fillColor('#FFFFFF').font('Helvetica-Bold').fontSize(10).text('CUSTOMER', 40, y + 8, { width: 100, align: 'center' });

            // Name Light Blue Box
            doc.rect(140, y, pageWidth - 100, 25).fill(BG_LIGHT);
            const clientText = `${quotation.client?.name || 'Customer'} / UP : ${quotation.client?.contactName || '-'}`;
            doc.fillColor(TEXT_COLOR).font('Helvetica-Bold').text(clientText, 150, y + 8);
            y += 35;

            // --- INTRO TEXT ---
            if (quotation.notes) {
                const poNum = quotation.projectName || quotation.poNumber || '____';
                const introText = quotation.notes.replace('{PO_NUMBER}', poNum);

                doc.font('Helvetica').fontSize(9).fillColor(TEXT_SECONDARY)
                    .text(introText, 40, y, { width: pageWidth });

                const introHeight = doc.heightOfString(introText, { width: pageWidth });
                y += introHeight + 10;
            }

            // Intro Text
            if (quotation.poNumber || quotation.documentIntroText) {
                const intro = `Dengan ini kami sampaikan Rincian order PO : ${quotation.poNumber || '____'} Sebagai berikut :`;
                doc.font('Helvetica').fontSize(9).fillColor(TEXT_SECONDARY).text(intro, 40, y);
                y += 20;
            }

            // --- ITEMS TABLE ---
            const tableTop = y;
            // Removed 'No' column to match Preview.
            // Previous: [30, 80, 160, 40, 85, 100] -> Total 495
            // New widths: Model(100), Desc(175), Qty(40), Price(90), Total(90) -> Total 495
            const colWidths = [100, 175, 40, 90, 90];
            const headers = ['Model', 'Description', 'Qty', 'Price', 'Total'];

            // Header Row
            doc.rect(40, tableTop, pageWidth, 25).fill(PRIMARY_COLOR);

            let xPos = 40;
            doc.font('Helvetica-Bold').fontSize(9).fillColor('#FFFFFF');

            headers.forEach((header, i) => {
                const align = i >= 2 ? 'right' : 'left'; // Qty, Price, Total align right
                doc.text(header, xPos + 5, tableTop + 8, { width: colWidths[i] - 10, align: align });
                xPos += colWidths[i];
            });
            y = tableTop + 25;

            // Rows
            doc.font('Helvetica').fontSize(9).fillColor(TEXT_COLOR);

            let currentGroup = null;

            quotation.items?.forEach((item, index) => {
                // Check for Group Change
                if (item.groupName && item.groupName !== currentGroup) {
                    currentGroup = item.groupName;
                    // Render Group Header
                    doc.rect(40, y, pageWidth, 20).fill('#f1f5f9'); // Light gray for group
                    doc.fillColor(PRIMARY_COLOR).font('Helvetica-Bold').text(currentGroup, 45, y + 5);
                    y += 20;
                }

                const rowY = y;
                xPos = 40;
                doc.fillColor(TEXT_COLOR).font('Helvetica'); // Reset font

                const values = [
                    item.model || '-',
                    item.description || '',
                    `${item.quantity} ${item.unit || 'unit'}`,
                    formatCurrency(Number(item.rate)),
                    formatCurrency(Number(item.amount))
                ];

                let maxHeight = 20;
                values.forEach((val, i) => {
                    const h = doc.heightOfString(val, { width: colWidths[i] - 10 });
                    if (h + 10 > maxHeight) maxHeight = h + 10;
                });

                // Vertical grid lines
                doc.lineWidth(0.5).strokeColor('#e2e8f0');
                let vX = 40;
                for (let i = 0; i < colWidths.length; i++) {
                    doc.rect(vX, rowY, colWidths[i], maxHeight).stroke();
                    vX += colWidths[i];
                }

                // Row content
                xPos = 40;
                values.forEach((val, i) => {
                    const align = i >= 2 ? 'right' : 'left';
                    doc.text(val, xPos + 5, rowY + 5, { width: colWidths[i] - 10, align: align });
                    xPos += colWidths[i];
                });

                y += maxHeight;

                if (y > doc.page.height - 100) {
                    doc.addPage();
                    y = 40;
                }
            });

            y += 20;

            // --- BOTTOM SECTION ---
            const splitY = y;

            // TOTALS TABLE (Right)
            const totalsW = 220;
            const totalsX = pageWidth + 40 - totalsW;
            let currentTotalY = splitY;

            const drawTotalRow = (label, value, isBold = false, isYellow = false) => {
                const h = 20;
                doc.rect(totalsX, currentTotalY, totalsW, h).strokeColor('#cbd5e1').stroke();
                doc.rect(totalsX, currentTotalY, 100, h).fill(isYellow ? '#fef08a' : '#f8fafc');
                doc.rect(totalsX + 100, currentTotalY, totalsW - 100, h).fill(isYellow ? '#fef08a' : '#ffffff');

                doc.fillColor(TEXT_COLOR).font('Helvetica-Bold').fontSize(9).text(label, totalsX + 5, currentTotalY + 5);
                doc.font(isBold ? 'Helvetica-Bold' : 'Helvetica').text(value, totalsX + 105, currentTotalY + 5, { width: totalsW - 110, align: 'right' });

                if (isYellow) {
                    doc.fillColor(PRIMARY_COLOR);
                    doc.text(value, totalsX + 105, currentTotalY + 5, { width: totalsW - 110, align: 'right' });
                }

                currentTotalY += h;
            };

            drawTotalRow('TOTAL', formatCurrency(Number(quotation.subtotal)));
            const discountAmount = Number(quotation.discount) || 0;
            if (discountAmount > 0) {
                // Calculate percent if not present (DB only stores amount)
                let percent = quotation.discountPercent;
                const subtotal = Number(quotation.subtotal) || 0;
                if (!percent && subtotal > 0) {
                    percent = (discountAmount / subtotal) * 100;
                    percent = Math.round(percent * 100) / 100; // Round to 2 decimals
                }
                drawTotalRow(`Discount ${percent}%`, `-${formatCurrency(discountAmount)}`, false, false);
            }
            if (Number(quotation.taxAmount) > 0) {
                drawTotalRow(`PPN ${quotation.taxRate}%`, formatCurrency(Number(quotation.taxAmount)));
            }
            drawTotalRow('Grand Total', formatCurrency(Number(quotation.total)), true, true);

            // TERMS (Left)
            let termsY = splitY + 10; // Added spacing
            doc.font('Helvetica-Bold').fontSize(8).fillColor(TEXT_COLOR).text('Syarat dan Ketentuan:', 40, termsY);
            termsY += 15; // Increased spacing

            const termsText = quotation.terms || '';
            doc.font('Helvetica').fontSize(9).fillColor(TEXT_SECONDARY)
                .text(termsText, 40, termsY, { width: pageWidth - totalsW - 20 });

            // Calculate dynamic height of terms to prevent overlap
            const termsHeight = doc.heightOfString(termsText, { width: pageWidth - totalsW - 20 });

            // Ensure y starts below terms OR totals, whichever is lower
            y = Math.max(currentTotalY, termsY + termsHeight + 20) + 20;

            // --- TERBILANG BAR ---
            doc.rect(40, y, 60, 20).fill(PRIMARY_COLOR);
            doc.fillColor('#FFFFFF').font('Helvetica-Bold').fontSize(9).text('Terbilang :', 40, y + 6, { width: 60, align: 'center' });

            doc.rect(100, y, pageWidth - 60, 20).fill(BG_LIGHT);
            doc.fillColor(PRIMARY_COLOR).font('Helvetica-Oblique').text(terbilang(Number(quotation.total)), 110, y + 6);
            y += 40;

            // --- FOOTER ---
            // Bank (Left)
            // Logic to Ensure Bank shows Name (AN)
            let bankText = null;
            if (quotation.bankAccount) {
                // Check if it already has the full format (e.g. from previous save)
                if (quotation.bankAccount.includes('\n') || (quotation.bankAccount.toLowerCase().includes('an :') && !quotation.bankAccount.includes('undefined'))) {
                    bankText = quotation.bankAccount;
                } else {
                    // Try to match with company settings to get full details
                    // Robust check: match by exact number if possible, or part of string
                    const matchedBank = companySettings?.bankAccounts?.find(b =>
                        quotation.bankAccount.includes(b.accountNumber || b.accountNum)
                    );

                    if (matchedBank) {
                        const holder = matchedBank.holderName || matchedBank.accountHolder || '';
                        bankText = `${matchedBank.bankName}\n${matchedBank.accountNumber || matchedBank.accountNum}\nAN : ${holder}`;
                    } else {
                        // If no match found, use what we have, but clean "undefined"
                        bankText = quotation.bankAccount.replace(' - undefined', '').replace('undefined', '');
                    }
                }
            } else if (companySettings?.bankAccounts && companySettings.bankAccounts.length > 0) {
                // Fallback default
                const b = companySettings.bankAccounts[0];
                const holder = b.holderName || b.accountHolder || '';
                bankText = `${b.bankName}\n${b.accountNumber || b.accountNum}\nAN : ${holder}`;
            }

            if (bankText) {
                const bankY = y;
                doc.font('Helvetica-Bold').fontSize(9).fillColor(TEXT_COLOR).text('Bank Details:', 40, bankY);
                doc.font('Helvetica').fontSize(9).text(bankText, 40, bankY + 12);
            }

            // Signature (Right)
            const sigY = y;
            const sigX = pageWidth - 120;
            doc.font('Helvetica').fontSize(9).fillColor(TEXT_SECONDARY).text('Hormat Kami,', sigX, sigY, { align: 'center', width: 140 });
            doc.font('Helvetica-Bold').fontSize(10).fillColor(TEXT_COLOR).text(companySettings?.legalName || companySettings?.companyName || '', sigX, sigY + 12, { align: 'center', width: 140 });

            if (companySettings?.signatureImage || quotation.signatureName) {
                if (companySettings?.signatureImage && typeof companySettings.signatureImage === 'string' && companySettings.signatureImage.includes('base64,')) {
                    try {
                        const sigData = Buffer.from(companySettings.signatureImage.split('base64,')[1], 'base64');
                        // INCREASED IMAGE SIZE to 120 (approx 2x)
                        doc.image(sigData, sigX + 10, sigY + 30, { width: 120 });
                    } catch (e) { }
                }
            }

            doc.moveTo(sigX, sigY + 90).lineTo(sigX + 140, sigY + 90).strokeColor('#ccc').stroke();
            doc.text(quotation.signatureName || companySettings?.signatureName || '', sigX, sigY + 95, { align: 'center', width: 140 });

            doc.end();
        } catch (error) {
            reject(error);
        }
    });
}

export default { generateInvoicePDF, generateQuotationPDF };
