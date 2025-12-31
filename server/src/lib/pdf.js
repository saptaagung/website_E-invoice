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
export function generateInvoicePDF(invoice, companySettings) {
    return new Promise((resolve, reject) => {
        try {
            const doc = new PDFDocument({ size: 'A4', margin: 40 });
            const chunks = [];

            doc.on('data', chunk => chunks.push(chunk));
            doc.on('end', () => resolve(Buffer.concat(chunks)));
            doc.on('error', reject);

            const pageWidth = doc.page.width - 80;
            let y = 40;

            // Header
            doc.font('Helvetica-Bold').fontSize(16).fillColor('#E65100')
                .text(companySettings?.companyName || 'PT SETIA HABA TEKNOLOGI', 40, y);
            y += 25;

            doc.font('Helvetica').fontSize(8).fillColor('#666666')
                .text(companySettings?.address || 'Jl. Melajo III BSD Blok C8/21', 40, y);
            y += 10;
            doc.text(`Email: ${companySettings?.email || 'info@company.com'} | Telp: ${companySettings?.phone || '021-XXX'}`, 40, y);
            y += 20;

            // Line separator
            doc.moveTo(40, y).lineTo(pageWidth + 40, y).strokeColor('#E65100').lineWidth(2).stroke();
            y += 20;

            // Document Info Box
            doc.font('Helvetica-Bold').fontSize(14).fillColor('#333333')
                .text('INVOICE', 40, y);

            doc.font('Helvetica').fontSize(10).fillColor('#666666')
                .text(`No: ${invoice.invoiceNumber}`, pageWidth - 60, y, { width: 100, align: 'right' });
            y += 15;
            doc.text(`Date: ${new Date(invoice.issueDate).toLocaleDateString('id-ID')}`, pageWidth - 60, y, { width: 100, align: 'right' });
            y += 25;

            // Customer Info
            doc.font('Helvetica-Bold').fontSize(10).fillColor('#333333')
                .text('Bill To:', 40, y);
            y += 15;
            doc.font('Helvetica').fontSize(10).fillColor('#333333')
                .text(invoice.client?.name || 'Customer Name', 40, y);
            y += 12;
            if (invoice.client?.address) {
                doc.text(invoice.client.address, 40, y);
                y += 12;
            }
            if (invoice.client?.email) {
                doc.text(invoice.client.email, 40, y);
                y += 12;
            }
            y += 15;

            // Items Table Header
            const tableTop = y;
            const colWidths = [30, 200, 50, 80, 100];
            const headers = ['No', 'Description', 'Qty', 'Rate', 'Amount'];

            doc.fillColor('#E65100').rect(40, tableTop, pageWidth, 20).fill();

            let xPos = 45;
            doc.font('Helvetica-Bold').fontSize(9).fillColor('#FFFFFF');
            headers.forEach((header, i) => {
                doc.text(header, xPos, tableTop + 6, { width: colWidths[i], align: i > 1 ? 'right' : 'left' });
                xPos += colWidths[i] + 5;
            });
            y = tableTop + 25;

            // Items
            doc.font('Helvetica').fontSize(9).fillColor('#333333');
            invoice.items?.forEach((item, index) => {
                xPos = 45;
                const values = [
                    (index + 1).toString(),
                    item.description,
                    item.quantity.toString(),
                    formatCurrency(Number(item.rate)),
                    formatCurrency(Number(item.amount))
                ];

                values.forEach((val, i) => {
                    doc.text(val, xPos, y, { width: colWidths[i], align: i > 1 ? 'right' : 'left' });
                    xPos += colWidths[i] + 5;
                });
                y += 18;

                // Row separator
                doc.moveTo(40, y - 3).lineTo(pageWidth + 40, y - 3).strokeColor('#EEEEEE').lineWidth(0.5).stroke();
            });

            y += 10;

            // Totals
            const totalsX = pageWidth - 100;

            doc.font('Helvetica').fontSize(10).fillColor('#666666')
                .text('Subtotal:', totalsX, y, { width: 60 });
            doc.font('Helvetica-Bold').fillColor('#333333')
                .text(formatCurrency(Number(invoice.subtotal)), totalsX + 65, y, { width: 80, align: 'right' });
            y += 15;

            if (Number(invoice.discount) > 0) {
                doc.font('Helvetica').fillColor('#666666')
                    .text('Discount:', totalsX, y, { width: 60 });
                doc.font('Helvetica-Bold').fillColor('#333333')
                    .text(`-${formatCurrency(Number(invoice.discount))}`, totalsX + 65, y, { width: 80, align: 'right' });
                y += 15;
            }

            doc.font('Helvetica').fillColor('#666666')
                .text(`PPN (${invoice.taxRate}%):`, totalsX, y, { width: 60 });
            doc.font('Helvetica-Bold').fillColor('#333333')
                .text(formatCurrency(Number(invoice.taxAmount)), totalsX + 65, y, { width: 80, align: 'right' });
            y += 20;

            // Total with highlight
            doc.fillColor('#E65100').rect(totalsX - 5, y - 5, 155, 25).fill();
            doc.font('Helvetica-Bold').fontSize(11).fillColor('#FFFFFF')
                .text('TOTAL:', totalsX, y, { width: 60 });
            doc.text(formatCurrency(Number(invoice.total)), totalsX + 65, y, { width: 80, align: 'right' });
            y += 35;

            // Terbilang
            doc.font('Helvetica-Oblique').fontSize(9).fillColor('#666666')
                .text(`Terbilang: ${terbilang(Number(invoice.total))}`, 40, y, { width: pageWidth });
            y += 25;

            // Bank Details
            if (invoice.bankAccount) {
                doc.font('Helvetica-Bold').fontSize(10).fillColor('#333333')
                    .text('Payment Details:', 40, y);
                y += 15;
                doc.font('Helvetica').fontSize(9).fillColor('#666666')
                    .text(invoice.bankAccount, 40, y);
                y += 25;
            }

            // Terms
            if (invoice.terms) {
                doc.font('Helvetica-Bold').fontSize(10).fillColor('#333333')
                    .text('Terms & Conditions:', 40, y);
                y += 15;
                doc.font('Helvetica').fontSize(8).fillColor('#666666')
                    .text(invoice.terms, 40, y, { width: pageWidth * 0.6 });
            }

            // Signature
            const sigY = doc.page.height - 120;
            doc.font('Helvetica').fontSize(9).fillColor('#333333')
                .text('Authorized Signature', pageWidth - 60, sigY, { width: 100, align: 'center' });
            doc.moveTo(pageWidth - 20, sigY + 50).lineTo(pageWidth + 80, sigY + 50).strokeColor('#333333').lineWidth(0.5).stroke();
            doc.text(invoice.signatureName || companySettings?.signatureName || '', pageWidth - 60, sigY + 55, { width: 100, align: 'center' });

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
    return new Promise((resolve, reject) => {
        try {
            const doc = new PDFDocument({ size: 'A4', margin: 40 });
            const chunks = [];

            doc.on('data', chunk => chunks.push(chunk));
            doc.on('end', () => resolve(Buffer.concat(chunks)));
            doc.on('error', reject);

            const pageWidth = doc.page.width - 80;
            let y = 40;

            // Header
            doc.font('Helvetica-Bold').fontSize(16).fillColor('#E65100')
                .text(companySettings?.companyName || 'PT SETIA HABA TEKNOLOGI', 40, y);
            y += 25;

            doc.font('Helvetica').fontSize(8).fillColor('#666666')
                .text(companySettings?.address || 'Company Address', 40, y);
            y += 10;
            doc.text(`Email: ${companySettings?.email || 'info@company.com'} | Telp: ${companySettings?.phone || '021-XXX'}`, 40, y);
            y += 20;

            // Line separator
            doc.moveTo(40, y).lineTo(pageWidth + 40, y).strokeColor('#E65100').lineWidth(2).stroke();
            y += 20;

            // Document Info
            doc.font('Helvetica-Bold').fontSize(14).fillColor('#333333')
                .text('QUOTATION / PENAWARAN HARGA', 40, y);

            doc.font('Helvetica').fontSize(10).fillColor('#666666')
                .text(`No: ${quotation.quotationNumber}`, pageWidth - 60, y, { width: 100, align: 'right' });
            y += 15;
            doc.text(`Date: ${new Date(quotation.issueDate).toLocaleDateString('id-ID')}`, pageWidth - 60, y, { width: 100, align: 'right' });
            y += 15;
            doc.text(`Valid Until: ${new Date(quotation.validUntil).toLocaleDateString('id-ID')}`, pageWidth - 60, y, { width: 100, align: 'right' });
            y += 25;

            // Customer Info
            doc.font('Helvetica-Bold').fontSize(10).fillColor('#333333')
                .text('To:', 40, y);
            y += 15;
            doc.font('Helvetica').fontSize(10).fillColor('#333333')
                .text(quotation.client?.name || 'Customer Name', 40, y);
            y += 12;
            if (quotation.client?.contactName) {
                doc.text(`UP: ${quotation.client.contactName}`, 40, y);
                y += 12;
            }
            y += 15;

            // Items Table
            const tableTop = y;
            const colWidths = [30, 200, 50, 80, 100];
            const headers = ['No', 'Description', 'Qty', 'Rate', 'Amount'];

            doc.fillColor('#E65100').rect(40, tableTop, pageWidth, 20).fill();

            let xPos = 45;
            doc.font('Helvetica-Bold').fontSize(9).fillColor('#FFFFFF');
            headers.forEach((header, i) => {
                doc.text(header, xPos, tableTop + 6, { width: colWidths[i], align: i > 1 ? 'right' : 'left' });
                xPos += colWidths[i] + 5;
            });
            y = tableTop + 25;

            // Items
            doc.font('Helvetica').fontSize(9).fillColor('#333333');
            quotation.items?.forEach((item, index) => {
                xPos = 45;
                const values = [
                    (index + 1).toString(),
                    item.description,
                    item.quantity.toString(),
                    formatCurrency(Number(item.rate)),
                    formatCurrency(Number(item.amount))
                ];

                values.forEach((val, i) => {
                    doc.text(val, xPos, y, { width: colWidths[i], align: i > 1 ? 'right' : 'left' });
                    xPos += colWidths[i] + 5;
                });
                y += 18;
                doc.moveTo(40, y - 3).lineTo(pageWidth + 40, y - 3).strokeColor('#EEEEEE').lineWidth(0.5).stroke();
            });

            y += 10;

            // Totals
            const totalsX = pageWidth - 100;

            doc.font('Helvetica').fontSize(10).fillColor('#666666')
                .text('Subtotal:', totalsX, y, { width: 60 });
            doc.font('Helvetica-Bold').fillColor('#333333')
                .text(formatCurrency(Number(quotation.subtotal)), totalsX + 65, y, { width: 80, align: 'right' });
            y += 15;

            if (Number(quotation.discount) > 0) {
                doc.font('Helvetica').fillColor('#666666')
                    .text('Discount:', totalsX, y, { width: 60 });
                doc.font('Helvetica-Bold').fillColor('#333333')
                    .text(`-${formatCurrency(Number(quotation.discount))}`, totalsX + 65, y, { width: 80, align: 'right' });
                y += 15;
            }

            doc.font('Helvetica').fillColor('#666666')
                .text(`PPN (${quotation.taxRate}%):`, totalsX, y, { width: 60 });
            doc.font('Helvetica-Bold').fillColor('#333333')
                .text(formatCurrency(Number(quotation.taxAmount)), totalsX + 65, y, { width: 80, align: 'right' });
            y += 20;

            // Total
            doc.fillColor('#E65100').rect(totalsX - 5, y - 5, 155, 25).fill();
            doc.font('Helvetica-Bold').fontSize(11).fillColor('#FFFFFF')
                .text('TOTAL:', totalsX, y, { width: 60 });
            doc.text(formatCurrency(Number(quotation.total)), totalsX + 65, y, { width: 80, align: 'right' });
            y += 35;

            // Terbilang
            doc.font('Helvetica-Oblique').fontSize(9).fillColor('#666666')
                .text(`Terbilang: ${terbilang(Number(quotation.total))}`, 40, y, { width: pageWidth });
            y += 25;

            // Terms
            if (quotation.terms) {
                doc.font('Helvetica-Bold').fontSize(10).fillColor('#333333')
                    .text('Terms & Conditions:', 40, y);
                y += 15;
                doc.font('Helvetica').fontSize(8).fillColor('#666666')
                    .text(quotation.terms, 40, y, { width: pageWidth * 0.6 });
            }

            // Signature
            const sigY = doc.page.height - 120;
            doc.font('Helvetica').fontSize(9).fillColor('#333333')
                .text('Hormat Kami,', pageWidth - 60, sigY, { width: 100, align: 'center' });
            doc.moveTo(pageWidth - 20, sigY + 50).lineTo(pageWidth + 80, sigY + 50).strokeColor('#333333').lineWidth(0.5).stroke();
            doc.text(companySettings?.signatureName || '', pageWidth - 60, sigY + 55, { width: 100, align: 'center' });

            doc.end();
        } catch (error) {
            reject(error);
        }
    });
}

export default { generateInvoicePDF, generateQuotationPDF };
