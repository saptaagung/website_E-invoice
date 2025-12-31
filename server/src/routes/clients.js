import express from 'express';
import prisma from '../lib/prisma.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// Apply auth to all routes
router.use(authenticateToken);

// Get all clients
router.get('/', async (req, res) => {
    try {
        const { search, status } = req.query;

        const where = {};
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

// Get single client
router.get('/:id', async (req, res) => {
    try {
        const client = await prisma.client.findUnique({
            where: { id: req.params.id },
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

// Create client
router.post('/', async (req, res) => {
    try {
        const { name, contactName, email, phone, address, city, postalCode, country, taxId, notes } = req.body;

        if (!name) {
            return res.status(400).json({ error: 'Client name is required' });
        }

        const client = await prisma.client.create({
            data: {
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

// Update client
router.put('/:id', async (req, res) => {
    try {
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

// Delete client
router.delete('/:id', async (req, res) => {
    try {
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
