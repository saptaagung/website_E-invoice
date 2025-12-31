import express from 'express';
import prisma from '../lib/prisma.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

router.use(authenticateToken);

// Get company settings
router.get('/', async (req, res) => {
    try {
        let settings = await prisma.companySettings.findFirst({
            include: { bankAccounts: true }
        });

        // Create default settings if none exist
        if (!settings) {
            settings = await prisma.companySettings.create({
                data: {
                    companyName: 'My Company',
                    defaultTaxName: 'PPN',
                    defaultTaxRate: 11,
                },
                include: { bankAccounts: true }
            });
        }

        res.json(settings);
    } catch (error) {
        console.error('Get settings error:', error);
        res.status(500).json({ error: 'Failed to get settings' });
    }
});

// Update company settings
router.put('/', async (req, res) => {
    try {
        let settings = await prisma.companySettings.findFirst();

        // Map frontend field names to database field names
        const updateData = {
            companyName: req.body.companyName,
            taxId: req.body.taxId,
            email: req.body.email,
            phone: req.body.phone,
            address: req.body.address,
            signatureName: req.body.signatureName,
            defaultTaxName: req.body.taxName,
            defaultTaxRate: req.body.taxRate,
            quotationPrefix: req.body.quotationPrefix,
            quotationNextNum: req.body.quotationNextNum,
            quotationPadding: req.body.quotationPadding,
            invoicePrefix: req.body.invoicePrefix,
            invoiceNextNum: req.body.invoiceNextNum,
            invoicePadding: req.body.invoicePadding,
            sphPrefix: req.body.sphPrefix,
            sphNextNum: req.body.sphNextNum,
            sphPadding: req.body.sphPadding,
        };

        // Remove undefined values
        Object.keys(updateData).forEach(key =>
            updateData[key] === undefined && delete updateData[key]
        );

        if (settings) {
            settings = await prisma.companySettings.update({
                where: { id: settings.id },
                data: updateData,
                include: { bankAccounts: true }
            });
        } else {
            settings = await prisma.companySettings.create({
                data: updateData,
                include: { bankAccounts: true }
            });
        }

        res.json(settings);
    } catch (error) {
        console.error('Update settings error:', error);
        res.status(500).json({ error: 'Failed to update settings' });
    }
});

// Get bank accounts
router.get('/bank-accounts', async (req, res) => {
    try {
        const accounts = await prisma.bankAccount.findMany({
            orderBy: { isDefault: 'desc' }
        });
        res.json(accounts);
    } catch (error) {
        console.error('Get bank accounts error:', error);
        res.status(500).json({ error: 'Failed to get bank accounts' });
    }
});

// Add bank account
router.post('/bank-accounts', async (req, res) => {
    try {
        // Support both frontend naming and original naming
        const bankName = req.body.bankName;
        const accountNumber = req.body.accountNumber || req.body.accountNum;
        const accountHolder = req.body.accountHolder || req.body.holderName;
        const isDefault = req.body.isDefault || false;

        if (!bankName || !accountNumber) {
            return res.status(400).json({ error: 'Bank name and account number are required' });
        }

        // Get settings to link bank account
        const settings = await prisma.companySettings.findFirst();
        if (!settings) {
            return res.status(400).json({ error: 'Please save company settings first' });
        }

        // If this is default, unset other defaults
        if (isDefault) {
            await prisma.bankAccount.updateMany({
                data: { isDefault: false }
            });
        }

        const account = await prisma.bankAccount.create({
            data: {
                bankName,
                accountNum: accountNumber,
                holderName: accountHolder || '',
                isDefault,
                companySettingsId: settings.id
            }
        });

        // Return with frontend-friendly field names
        res.status(201).json({
            id: account.id,
            bankName: account.bankName,
            accountNumber: account.accountNum,
            accountHolder: account.holderName,
            isDefault: account.isDefault
        });
    } catch (error) {
        console.error('Add bank account error:', error);
        res.status(500).json({ error: 'Failed to add bank account' });
    }
});

// Delete bank account
router.delete('/bank-accounts/:id', async (req, res) => {
    try {
        await prisma.bankAccount.delete({
            where: { id: req.params.id }
        });
        res.json({ message: 'Bank account deleted successfully' });
    } catch (error) {
        console.error('Delete bank account error:', error);
        res.status(500).json({ error: 'Failed to delete bank account' });
    }
});

// Dashboard stats
router.get('/dashboard', async (req, res) => {
    try {
        const userId = req.user.id;

        // Get invoice stats
        const [outstanding, paidThisMonth, drafts] = await Promise.all([
            // Outstanding = pending + overdue invoices
            prisma.invoice.aggregate({
                where: { userId, status: { in: ['sent', 'pending', 'overdue'] } },
                _sum: { total: true }
            }),
            // Paid this month
            prisma.invoice.aggregate({
                where: {
                    userId,
                    status: 'paid',
                    updatedAt: {
                        gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1)
                    }
                },
                _sum: { total: true }
            }),
            // Draft count
            prisma.invoice.count({
                where: { userId, status: 'draft' }
            })
        ]);

        // Recent documents
        const recentInvoices = await prisma.invoice.findMany({
            where: { userId },
            orderBy: { createdAt: 'desc' },
            take: 5,
            include: { client: { select: { name: true } } }
        });

        res.json({
            outstanding: outstanding._sum.total || 0,
            paidThisMonth: paidThisMonth._sum.total || 0,
            drafts,
            recentInvoices
        });
    } catch (error) {
        console.error('Get dashboard stats error:', error);
        res.status(500).json({ error: 'Failed to get dashboard stats' });
    }
});

export default router;
