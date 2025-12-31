import express from 'express';
import prisma from '../lib/prisma.js';
import { authenticateToken } from '../middleware/auth.js';
import { generateInvoicePDF } from '../lib/pdf.js';

const router = express.Router();

router.use(authenticateToken);

// Get all invoices
router.get('/', async (req, res) => {
    try {
        const { search, status, clientId } = req.query;

        const where = { userId: req.user.id };
        if (search) {
            where.OR = [
                { invoiceNumber: { contains: search, mode: 'insensitive' } },
                { client: { name: { contains: search, mode: 'insensitive' } } },
            ];
        }
        if (status) where.status = status;
        if (clientId) where.clientId = clientId;

        const invoices = await prisma.invoice.findMany({
            where,
            orderBy: { createdAt: 'desc' },
            include: {
                client: {
                    select: { id: true, name: true, email: true }
                },
                items: true,
                _count: { select: { payments: true } }
            }
        });

        res.json(invoices);
    } catch (error) {
        console.error('Get invoices error:', error);
        res.status(500).json({ error: 'Failed to get invoices' });
    }
});

// Get single invoice
router.get('/:id', async (req, res) => {
    try {
        const invoice = await prisma.invoice.findFirst({
            where: {
                id: req.params.id,
                userId: req.user.id
            },
            include: {
                client: true,
                items: true,
                payments: { orderBy: { paymentDate: 'desc' } }
            }
        });

        if (!invoice) {
            return res.status(404).json({ error: 'Invoice not found' });
        }

        res.json(invoice);
    } catch (error) {
        console.error('Get invoice error:', error);
        res.status(500).json({ error: 'Failed to get invoice' });
    }
});

// Create invoice
router.post('/', async (req, res) => {
    try {
        const {
            clientId, issueDate, dueDate, projectName, poNumber,
            items, taxRate, discount, notes, terms, bankAccount, signatureName
        } = req.body;

        if (!clientId || !items || items.length === 0) {
            return res.status(400).json({ error: 'Client and items are required' });
        }

        // Calculate totals
        const subtotal = items.reduce((sum, item) => sum + (item.quantity * item.rate), 0);
        const tax = taxRate || 11;
        const taxAmount = subtotal * (tax / 100);
        const total = subtotal + taxAmount - (discount || 0);

        // Generate invoice number
        const settings = await prisma.companySettings.findFirst();
        const year = new Date().getFullYear();
        const month = String(new Date().getMonth() + 1).padStart(2, '0');
        const nextNum = settings?.invoiceNextNum || 1;
        const padding = settings?.invoicePadding || 5;
        const prefix = (settings?.invoicePrefix || 'INV/{YYYY}/{MM}/')
            .replace('{YYYY}', year)
            .replace('{MM}', month);
        const invoiceNumber = `${prefix}${String(nextNum).padStart(padding, '0')}`;

        // Create invoice with items
        const invoice = await prisma.invoice.create({
            data: {
                invoiceNumber,
                clientId,
                userId: req.user.id,
                issueDate: issueDate ? new Date(issueDate) : new Date(),
                dueDate: dueDate ? new Date(dueDate) : new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
                projectName,
                poNumber,
                subtotal,
                taxRate: tax,
                taxAmount,
                discount: discount || 0,
                total,
                notes,
                terms,
                bankAccount,
                signatureName,
                items: {
                    create: items.map(item => ({
                        description: item.description,
                        quantity: item.quantity,
                        rate: item.rate,
                        amount: item.quantity * item.rate
                    }))
                }
            },
            include: { client: true, items: true }
        });

        // Update next invoice number
        if (settings) {
            await prisma.companySettings.update({
                where: { id: settings.id },
                data: { invoiceNextNum: nextNum + 1 }
            });
        }

        res.status(201).json(invoice);
    } catch (error) {
        console.error('Create invoice error:', error);
        res.status(500).json({ error: 'Failed to create invoice' });
    }
});

// Update invoice
router.put('/:id', async (req, res) => {
    try {
        const { items, ...data } = req.body;

        // Recalculate if items changed
        if (items) {
            const subtotal = items.reduce((sum, item) => sum + (item.quantity * item.rate), 0);
            const tax = data.taxRate || 11;
            data.subtotal = subtotal;
            data.taxAmount = subtotal * (tax / 100);
            data.total = subtotal + data.taxAmount - (data.discount || 0);

            // Delete old items and create new
            await prisma.invoiceItem.deleteMany({ where: { invoiceId: req.params.id } });
            await prisma.invoiceItem.createMany({
                data: items.map(item => ({
                    invoiceId: req.params.id,
                    description: item.description,
                    quantity: item.quantity,
                    rate: item.rate,
                    amount: item.quantity * item.rate
                }))
            });
        }

        const invoice = await prisma.invoice.update({
            where: { id: req.params.id },
            data,
            include: { client: true, items: true }
        });

        res.json(invoice);
    } catch (error) {
        console.error('Update invoice error:', error);
        res.status(500).json({ error: 'Failed to update invoice' });
    }
});

// Delete invoice
router.delete('/:id', async (req, res) => {
    try {
        await prisma.invoice.delete({
            where: { id: req.params.id }
        });

        res.json({ message: 'Invoice deleted successfully' });
    } catch (error) {
        console.error('Delete invoice error:', error);
        res.status(500).json({ error: 'Failed to delete invoice' });
    }
});

// Add payment to invoice
router.post('/:id/payments', async (req, res) => {
    try {
        const { amount, paymentDate, method, reference, notes } = req.body;

        const payment = await prisma.paymentRecord.create({
            data: {
                invoiceId: req.params.id,
                amount,
                paymentDate: new Date(paymentDate),
                method,
                reference,
                notes
            }
        });

        // Check if fully paid and update status
        const invoice = await prisma.invoice.findUnique({
            where: { id: req.params.id },
            include: { payments: true }
        });

        const totalPaid = invoice.payments.reduce((sum, p) => sum + Number(p.amount), 0);
        if (totalPaid >= Number(invoice.total)) {
            await prisma.invoice.update({
                where: { id: req.params.id },
                data: { status: 'paid' }
            });
        } else if (totalPaid > 0) {
            await prisma.invoice.update({
                where: { id: req.params.id },
                data: { status: 'partial' }
            });
        }

        res.status(201).json(payment);
    } catch (error) {
        console.error('Add payment error:', error);
        res.status(500).json({ error: 'Failed to add payment' });
    }
});

// Generate PDF for invoice
router.get('/:id/pdf', async (req, res) => {
    try {
        const invoice = await prisma.invoice.findFirst({
            where: {
                id: req.params.id,
                userId: req.user.id
            },
            include: {
                client: true,
                items: true
            }
        });

        if (!invoice) {
            return res.status(404).json({ error: 'Invoice not found' });
        }

        // Get company settings
        const companySettings = await prisma.companySettings.findFirst();

        // Generate PDF
        const pdfBuffer = await generateInvoicePDF(invoice, companySettings);

        // Set headers for PDF download
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="${invoice.invoiceNumber.replace(/\//g, '-')}.pdf"`);
        res.setHeader('Content-Length', pdfBuffer.length);

        res.send(pdfBuffer);
    } catch (error) {
        console.error('Generate PDF error:', error);
        res.status(500).json({ error: 'Failed to generate PDF' });
    }
});

export default router;

