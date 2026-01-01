import express from 'express';
import prisma from '../lib/prisma.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// Apply auth to all routes
router.use(authenticateToken);

// Get all clients for current user
router.get('/', async (req, res) => {
    try {
        const { search, status } = req.query;
        const userId = req.user.id;

        const where = { userId }; // Filter by current user
        if (search) {
            where.OR = [
                { name: { contains: search, mode: 'insensitive' } },
                { email: { contains: search, mode: 'insensitive' } },
                { contactName: { contains: search, mode: 'insensitive' } },
            ];
        }
        if (status) {
            where.status = status;
        }

        const clients = await prisma.client.findMany({
            where,
            orderBy: { createdAt: 'desc' },
            include: {
                _count: {
                    select: { invoices: true, quotations: true, sph: true }
                }
            }
        });

        res.json(clients);
    } catch (error) {
        console.error('Get clients error:', error);
        res.status(500).json({ error: 'Failed to get clients' });
    }
});

// Get single client (only if owned by current user)
router.get('/:id', async (req, res) => {
    try {
        const userId = req.user.id;

        const client = await prisma.client.findFirst({
            where: {
                id: req.params.id,
                userId: userId // Ensure user owns this client
            },
            include: {
                invoices: {
                    orderBy: { createdAt: 'desc' },
                    take: 5
                },
                quotations: {
                    orderBy: { createdAt: 'desc' },
                    take: 5
                }
            }
        });

        if (!client) {
            return res.status(404).json({ error: 'Client not found' });
        }

        res.json(client);
    } catch (error) {
        console.error('Get client error:', error);
        res.status(500).json({ error: 'Failed to get client' });
    }
});

// Create client for current user
router.post('/', async (req, res) => {
    try {
        const { name, contactName, email, phone, address, city, postalCode, country, taxId, notes } = req.body;
        const userId = req.user.id;

        if (!name) {
            return res.status(400).json({ error: 'Client name is required' });
        }

        const client = await prisma.client.create({
            data: {
                userId, // Associate with current user
                name,
                contactName,
                email,
                phone,
                address,
                city,
                postalCode,
                country: country || 'Indonesia',
                taxId,
                notes,
            }
        });

        res.status(201).json(client);
    } catch (error) {
        console.error('Create client error:', error);
        res.status(500).json({ error: 'Failed to create client' });
    }
});

// Update client (only if owned by current user)
router.put('/:id', async (req, res) => {
    try {
        const userId = req.user.id;

        // First check ownership
        const existing = await prisma.client.findFirst({
            where: { id: req.params.id, userId }
        });

        if (!existing) {
            return res.status(404).json({ error: 'Client not found' });
        }

        const client = await prisma.client.update({
            where: { id: req.params.id },
            data: req.body,
        });

        res.json(client);
    } catch (error) {
        console.error('Update client error:', error);
        res.status(500).json({ error: 'Failed to update client' });
    }
});

// Delete client (only if owned by current user)
router.delete('/:id', async (req, res) => {
    try {
        const userId = req.user.id;

        // First check ownership
        const existing = await prisma.client.findFirst({
            where: { id: req.params.id, userId }
        });

        if (!existing) {
            return res.status(404).json({ error: 'Client not found' });
        }

        await prisma.client.delete({
            where: { id: req.params.id }
        });

        res.json({ message: 'Client deleted successfully' });
    } catch (error) {
        console.error('Delete client error:', error);
        res.status(500).json({ error: 'Failed to delete client' });
    }
});

export default router;
