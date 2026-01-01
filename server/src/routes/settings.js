import express from 'express';
import prisma from '../lib/prisma.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

router.use(authenticateToken);

// Get company settings for current user
router.get('/', async (req, res) => {
    try {
        const userId = req.user.id;

        let settings = await prisma.companySettings.findUnique({
            where: { userId },
            include: { bankAccounts: true }
        });

        // Create default settings if none exist for this user
        if (!settings) {
            settings = await prisma.companySettings.create({
                data: {
                    userId,
                    companyName: 'My Company',
                    defaultTaxName: 'PPN',
                    defaultTaxRate: 11,
                },
                include: { bankAccounts: true }
            });
        }

        // Map bank accounts to frontend format
        if (settings.bankAccounts) {
            settings.bankAccounts = settings.bankAccounts.map(acc => ({
                id: acc.id,
                bankName: acc.bankName,
                accountNumber: acc.accountNum,
                accountHolder: acc.holderName,
                isDefault: acc.isDefault
            }));
        }

        res.json(settings);
    } catch (error) {
        console.error('Get settings error:', error);
        res.status(500).json({ error: 'Failed to get settings' });
    }
});

// Update company settings for current user
router.put('/', async (req, res) => {
    try {
        const userId = req.user.id;

        let settings = await prisma.companySettings.findUnique({
            where: { userId }
        });

        // Map frontend field names to database field names
        const updateData = {};

        // Only add fields that are provided
        if (req.body.companyName !== undefined) updateData.companyName = req.body.companyName;
        if (req.body.legalName !== undefined) updateData.legalName = req.body.legalName;
        if (req.body.taxId !== undefined) updateData.taxId = req.body.taxId;
        if (req.body.email !== undefined) updateData.email = req.body.email;
        if (req.body.phone !== undefined) updateData.phone = req.body.phone;
        if (req.body.address !== undefined) updateData.address = req.body.address;
        if (req.body.city !== undefined) updateData.city = req.body.city;
        if (req.body.workshop !== undefined) updateData.workshop = req.body.workshop;
        if (req.body.logo !== undefined) updateData.logo = req.body.logo;
        if (req.body.signatureImage !== undefined) updateData.signatureImage = req.body.signatureImage;
        if (req.body.signatureName !== undefined) updateData.signatureName = req.body.signatureName;

        // Tax settings
        if (req.body.taxName !== undefined) updateData.defaultTaxName = req.body.taxName;
        if (req.body.defaultTaxName !== undefined) updateData.defaultTaxName = req.body.defaultTaxName;
        if (req.body.taxRate !== undefined) updateData.defaultTaxRate = parseFloat(req.body.taxRate);
        if (req.body.defaultTaxRate !== undefined) updateData.defaultTaxRate = parseFloat(req.body.defaultTaxRate);

        // Numbering
        if (req.body.quotationPrefix !== undefined) updateData.quotationPrefix = req.body.quotationPrefix;
        if (req.body.quotationNextNum !== undefined) updateData.quotationNextNum = parseInt(req.body.quotationNextNum);
        if (req.body.invoicePrefix !== undefined) updateData.invoicePrefix = req.body.invoicePrefix;
        if (req.body.invoiceNextNum !== undefined) updateData.invoiceNextNum = parseInt(req.body.invoiceNextNum);
        if (req.body.sphPrefix !== undefined) updateData.sphPrefix = req.body.sphPrefix;
        if (req.body.sphNextNum !== undefined) updateData.sphNextNum = parseInt(req.body.sphNextNum);

        console.log('Update data:', JSON.stringify(updateData, null, 2));

        if (settings) {
            settings = await prisma.companySettings.update({
                where: { userId },
                data: updateData,
            });
        } else {
            settings = await prisma.companySettings.create({
                data: {
                    userId,
                    companyName: updateData.companyName || 'My Company',
                    ...updateData
                },
            });
        }

        // Fetch bank accounts for this user's settings
        const rawBankAccounts = await prisma.bankAccount.findMany({
            where: { settingsId: settings.id },
            orderBy: { isDefault: 'desc' }
        });

        // Map to frontend format
        const bankAccounts = rawBankAccounts.map(acc => ({
            id: acc.id,
            bankName: acc.bankName,
            accountNumber: acc.accountNum,
            accountHolder: acc.holderName,
            isDefault: acc.isDefault
        }));

        res.json({ ...settings, bankAccounts });
    } catch (error) {
        console.error('Update settings error:', error);
        console.error('Error message:', error.message);
        res.status(500).json({ error: 'Failed to update settings', details: error.message });
    }
});

// Get bank accounts for current user
router.get('/bank-accounts', async (req, res) => {
    try {
        const userId = req.user.id;

        // First get user's settings
        const settings = await prisma.companySettings.findUnique({
            where: { userId }
        });

        if (!settings) {
            return res.json([]);
        }

        const rawAccounts = await prisma.bankAccount.findMany({
            where: { settingsId: settings.id },
            orderBy: { isDefault: 'desc' }
        });

        const accounts = rawAccounts.map(acc => ({
            id: acc.id,
            bankName: acc.bankName,
            accountNumber: acc.accountNum,
            accountHolder: acc.holderName,
            isDefault: acc.isDefault
        }));

        res.json(accounts);
    } catch (error) {
        console.error('Get bank accounts error:', error);
        res.status(500).json({ error: 'Failed to get bank accounts' });
    }
});

// Add bank account for current user
router.post('/bank-accounts', async (req, res) => {
    try {
        const userId = req.user.id;

        // Support both frontend naming and original naming
        const bankName = req.body.bankName;
        const accountNumber = req.body.accountNumber || req.body.accountNum;
        const accountHolder = req.body.accountHolder || req.body.holderName;
        const isDefault = req.body.isDefault || false;

        if (!bankName || !accountNumber) {
            return res.status(400).json({ error: 'Bank name and account number are required' });
        }

        // Get or create user's settings
        let settings = await prisma.companySettings.findUnique({
            where: { userId }
        });

        if (!settings) {
            settings = await prisma.companySettings.create({
                data: {
                    userId,
                    companyName: 'My Company',
                    defaultTaxName: 'PPN',
                    defaultTaxRate: 11,
                }
            });
        }

        // If this is default, unset other defaults for this user
        if (isDefault) {
            await prisma.bankAccount.updateMany({
                where: { settingsId: settings.id },
                data: { isDefault: false }
            });
        }

        const account = await prisma.bankAccount.create({
            data: {
                bankName,
                accountNum: accountNumber,
                holderName: accountHolder || '',
                isDefault,
                settingsId: settings.id
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
        console.error('Error details:', error.message);
        res.status(500).json({ error: 'Failed to add bank account', details: error.message });
    }
});

// Delete bank account (only if owned by current user)
router.delete('/bank-accounts/:id', async (req, res) => {
    try {
        const userId = req.user.id;

        // Verify ownership
        const settings = await prisma.companySettings.findUnique({
            where: { userId }
        });

        if (!settings) {
            return res.status(404).json({ error: 'Bank account not found' });
        }

        const account = await prisma.bankAccount.findFirst({
            where: { id: req.params.id, settingsId: settings.id }
        });

        if (!account) {
            return res.status(404).json({ error: 'Bank account not found' });
        }

        await prisma.bankAccount.delete({
            where: { id: req.params.id }
        });

        res.json({ message: 'Bank account deleted successfully' });
    } catch (error) {
        console.error('Delete bank account error:', error);
        res.status(500).json({ error: 'Failed to delete bank account' });
    }
});

// Dashboard stats for current user
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
