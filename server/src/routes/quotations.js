import express from 'express';
import prisma from '../lib/prisma.js';
import { authenticateToken } from '../middleware/auth.js';
import { generateQuotationPDF } from '../lib/pdf.js';

const router = express.Router();

router.use(authenticateToken);

// Get all quotations
router.get('/', async (req, res) => {
    try {
        const { search, status, clientId } = req.query;

        const where = { userId: req.user.id };
        if (search) {
            where.OR = [
                { quotationNumber: { contains: search, mode: 'insensitive' } },
                { client: { name: { contains: search, mode: 'insensitive' } } },
            ];
        }
        if (status) where.status = status;
        if (clientId) where.clientId = clientId;

        const quotations = await prisma.quotation.findMany({
            where,
            orderBy: { createdAt: 'desc' },
            include: {
                client: { select: { id: true, name: true, email: true } },
                items: true
            }
        });

        res.json(quotations);
    } catch (error) {
        console.error('Get quotations error:', error);
        res.status(500).json({ error: 'Failed to get quotations' });
    }
});

// Get single quotation
router.get('/:id', async (req, res) => {
    try {
        const quotation = await prisma.quotation.findFirst({
            where: { id: req.params.id, userId: req.user.id },
            include: { client: true, items: true }
        });

        if (!quotation) {
            return res.status(404).json({ error: 'Quotation not found' });
        }

        res.json(quotation);
    } catch (error) {
        console.error('Get quotation error:', error);
        res.status(500).json({ error: 'Failed to get quotation' });
    }
});

// Create quotation
router.post('/', async (req, res) => {
    try {
        const { clientId, issueDate, validUntil, projectName, poNumber, items, taxRate, discount, notes, terms, bankAccount, signatureName } = req.body;

        // Map poNumber to projectName if projectName is missing
        const projectRef = projectName || poNumber || '';

        if (!clientId) {
            return res.status(400).json({ error: 'Client is required' });
        }
        if (!items || items.length === 0) {
            return res.status(400).json({ error: 'Items are required' });
        }

        // Calculate totals - accept both 'rate' and 'unitPrice'
        const subtotal = items.reduce((sum, item) => {
            const rate = item.rate || item.unitPrice || 0;
            return sum + (item.quantity * rate);
        }, 0);
        const tax = taxRate || 11;
        const discountPercent = discount || 0;
        const discountAmount = subtotal * (discountPercent / 100);
        const taxAmount = (subtotal - discountAmount) * (tax / 100);
        const total = subtotal - discountAmount + taxAmount;

        const settings = await prisma.companySettings.findFirst();
        const year = new Date().getFullYear();
        const month = String(new Date().getMonth() + 1).padStart(2, '0');
        // Use SPH settings for quotations
        let nextNum = settings?.sphNextNum || 1; // Changed to let for incrementing
        const padding = settings?.sphPadding || 4;
        const prefix = (settings?.sphPrefix || 'SPH/{YYYY}/')
            .replace('{YYYY}', year)
            .replace('{MM}', month);

        let quotationNumber;
        // Loop until we find a unique number
        while (true) {
            quotationNumber = `${prefix}${String(nextNum).padStart(padding, '0')}`;
            const existing = await prisma.quotation.findUnique({
                where: { quotationNumber }
            });

            if (!existing) break;
            nextNum++;
        }

        const quotation = await prisma.quotation.create({
            data: {
                quotationNumber,
                clientId,
                userId: req.user.id,
                issueDate: issueDate ? new Date(issueDate) : new Date(),
                validUntil: validUntil ? new Date(validUntil) : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
                projectName: projectRef,
                subtotal,
                taxRate: tax,
                taxAmount,
                discount: discountAmount,
                total,
                notes,
                terms,
                bankAccount,
                signatureName,
                items: {
                    create: items.map(item => {
                        const rate = item.rate || item.unitPrice || 0;
                        return {
                            groupName: item.groupName || null,
                            model: item.model || null,
                            description: item.description || '',
                            quantity: item.quantity || 1,
                            unit: item.unit || 'unit',
                            rate: rate,
                            amount: (item.quantity || 1) * rate
                        };
                    })
                }
            },
            include: { client: true, items: true }
        });

        if (settings) {
            await prisma.companySettings.update({
                where: { id: settings.id },
                data: { sphNextNum: nextNum + 1 }
            });
        } else {
            // Create default settings if not exists to track numbering
            await prisma.companySettings.create({
                data: {
                    companyName: 'My Company',
                    sphNextNum: 2
                }
            });
        }

        res.status(201).json(quotation);
    } catch (error) {
        console.error('Create quotation error:', error);
        console.error('Error message:', error.message);
        res.status(500).json({ error: 'Failed to create quotation', details: error.message });
    }
});

// Update quotation
router.put('/:id', async (req, res) => {
    try {
        const { items, poNumber, ...data } = req.body;

        // Map poNumber to projectName if provided
        if (poNumber) {
            data.projectName = poNumber;
        }

        const updatedQuotation = await prisma.$transaction(async (tx) => {
            // Clean up data for update - ensure Date objects for dates
            if (data.issueDate) data.issueDate = new Date(data.issueDate);
            if (data.validUntil) data.validUntil = new Date(data.validUntil);

            if (items) {
                const subtotal = items.reduce((sum, item) => {
                    const rate = item.rate || item.unitPrice || 0;
                    const qty = item.quantity || 1;
                    return sum + (qty * rate);
                }, 0);

                const tax = data.taxRate || 11;
                data.subtotal = subtotal;

                // Fix: Treat discount as Percentage (like Create)
                const discountPercent = data.discount || 0;
                const discountAmount = subtotal * (discountPercent / 100);

                // Fix: Tax is (Subtotal - Discount) * TaxRate
                data.taxAmount = (subtotal - discountAmount) * (tax / 100);

                // Fix: Save Discount AMOUNT to DB
                data.discount = discountAmount;

                data.total = subtotal - discountAmount + data.taxAmount;

                // Use the transaction client (tx) for operations
                await tx.quotationItem.deleteMany({ where: { quotationId: req.params.id } });
                await tx.quotationItem.createMany({
                    data: items.map(item => {
                        const rate = item.rate || item.unitPrice || 0;
                        const qty = item.quantity || 1;
                        return {
                            quotationId: req.params.id,
                            groupName: item.groupName || null,
                            model: item.model || null,
                            description: item.description || '',
                            quantity: qty,
                            unit: item.unit || 'unit',
                            rate: rate,
                            amount: qty * rate
                        };
                    })
                });
            }

            return await tx.quotation.update({
                where: { id: req.params.id },
                data,
                include: { client: true, items: true }
            });
        });

        res.json(updatedQuotation);
    } catch (error) {
        console.error('Update quotation error:', error);
        res.status(500).json({ error: 'Failed to update quotation' });
    }
});

// Delete quotation
router.delete('/:id', async (req, res) => {
    try {
        await prisma.quotation.delete({ where: { id: req.params.id } });
        res.json({ message: 'Quotation deleted successfully' });
    } catch (error) {
        console.error('Delete quotation error:', error);
        res.status(500).json({ error: 'Failed to delete quotation' });
    }
});

// Generate PDF for quotation
router.get('/:id/pdf', async (req, res) => {
    try {
        const quotation = await prisma.quotation.findFirst({
            where: {
                id: req.params.id,
                userId: req.user.id
            },
            include: {
                client: true,
                items: true
            }
        });

        if (!quotation) {
            return res.status(404).json({ error: 'Quotation not found' });
        }

        const companySettings = await prisma.companySettings.findFirst();
        const pdfBuffer = await generateQuotationPDF(quotation, companySettings);

        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="${quotation.quotationNumber.replace(/\//g, '-')}.pdf"`);
        res.setHeader('Content-Length', pdfBuffer.length);

        res.send(pdfBuffer);
    } catch (error) {
        console.error('Generate quotation PDF error:', error);
        res.status(500).json({ error: 'Failed to generate PDF' });
    }
});

export default router;
