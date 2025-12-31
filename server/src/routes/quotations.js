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
        const { clientId, issueDate, validUntil, projectName, items, taxRate, discount, notes, terms } = req.body;

        if (!clientId || !items || items.length === 0) {
            return res.status(400).json({ error: 'Client and items are required' });
        }

        const subtotal = items.reduce((sum, item) => sum + (item.quantity * item.rate), 0);
        const tax = taxRate || 11;
        const taxAmount = subtotal * (tax / 100);
        const total = subtotal + taxAmount - (discount || 0);

        const settings = await prisma.companySettings.findFirst();
        const year = new Date().getFullYear();
        const month = String(new Date().getMonth() + 1).padStart(2, '0');
        const nextNum = settings?.quotationNextNum || 1;
        const prefix = (settings?.quotationPrefix || 'QT/{YYYY}/{MM}/')
            .replace('{YYYY}', year)
            .replace('{MM}', month);
        const quotationNumber = `${prefix}${String(nextNum).padStart(5, '0')}`;

        const quotation = await prisma.quotation.create({
            data: {
                quotationNumber,
                clientId,
                userId: req.user.id,
                issueDate: issueDate ? new Date(issueDate) : new Date(),
                validUntil: validUntil ? new Date(validUntil) : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
                projectName,
                subtotal,
                taxRate: tax,
                taxAmount,
                discount: discount || 0,
                total,
                notes,
                terms,
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

        if (settings) {
            await prisma.companySettings.update({
                where: { id: settings.id },
                data: { quotationNextNum: nextNum + 1 }
            });
        }

        res.status(201).json(quotation);
    } catch (error) {
        console.error('Create quotation error:', error);
        res.status(500).json({ error: 'Failed to create quotation' });
    }
});

// Update quotation
router.put('/:id', async (req, res) => {
    try {
        const { items, ...data } = req.body;

        if (items) {
            const subtotal = items.reduce((sum, item) => sum + (item.quantity * item.rate), 0);
            const tax = data.taxRate || 11;
            data.subtotal = subtotal;
            data.taxAmount = subtotal * (tax / 100);
            data.total = subtotal + data.taxAmount - (data.discount || 0);

            await prisma.quotationItem.deleteMany({ where: { quotationId: req.params.id } });
            await prisma.quotationItem.createMany({
                data: items.map(item => ({
                    quotationId: req.params.id,
                    description: item.description,
                    quantity: item.quantity,
                    rate: item.rate,
                    amount: item.quantity * item.rate
                }))
            });
        }

        const quotation = await prisma.quotation.update({
            where: { id: req.params.id },
            data,
            include: { client: true, items: true }
        });

        res.json(quotation);
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
