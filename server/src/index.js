import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

// Import routes
import authRoutes from './routes/auth.js';
import clientRoutes from './routes/clients.js';
import invoiceRoutes from './routes/invoices.js';
import quotationRoutes from './routes/quotations.js';
import settingsRoutes from './routes/settings.js';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors({
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
    credentials: true,
    exposedHeaders: ['Content-Disposition']
}));
// Increase JSON body limit for base64 image uploads (logos, signatures)
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

// Health check
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/clients', clientRoutes);
app.use('/api/invoices', invoiceRoutes);
app.use('/api/quotations', quotationRoutes);
app.use('/api/settings', settingsRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);

    // Handle payload too large error
    if (err.type === 'entity.too.large') {
        return res.status(413).json({
            error: 'File terlalu besar',
            message: 'Ukuran file melebihi batas maksimum (10MB). Silakan kompres atau gunakan gambar yang lebih kecil.'
        });
    }

    res.status(500).json({
        error: 'Terjadi kesalahan',
        message: process.env.NODE_ENV === 'development' ? err.message : 'Silakan coba lagi nanti.'
    });
});

// Start server
app.listen(PORT, () => {
    console.log(`🚀 InvoiceFlow API Server running on http://localhost:${PORT}`);
    console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
});
