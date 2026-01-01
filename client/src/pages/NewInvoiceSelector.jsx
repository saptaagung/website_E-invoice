import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FileText, Copy, Plus, ArrowRight, Search, Check } from 'lucide-react';
import { Button, StatusBadge } from '../components/ui';
import { quotations } from '../lib/api';

// Format currency
const formatIDR = (amount) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(amount);
};

export default function NewInvoiceSelector() {
    const navigate = useNavigate();
    const [selectedQuotation, setSelectedQuotation] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [step, setStep] = useState('select'); // 'select' or 'choose-quotation'
    const [quotationsData, setQuotationsData] = useState([]);
    const [loading, setLoading] = useState(false);

    // Fetch quotations when step changes to 'choose-quotation'
    useEffect(() => {
        if (step === 'choose-quotation') {
            const fetchQuotations = async () => {
                setLoading(true);
                try {
                    const data = await quotations.getAll();
                    // Transform data for display
                    setQuotationsData(data.map(q => ({
                        id: q.id,
                        displayId: q.quotationNumber,
                        client: q.client?.name || 'Unknown',
                        contactName: q.client?.contactName || '',
                        date: q.issueDate,
                        total: Number(q.total),
                        status: q.status,
                    })));
                } catch (error) {
                    console.error('Failed to fetch quotations:', error);
                } finally {
                    setLoading(false);
                }
            };
            fetchQuotations();
        }
    }, [step]);

    const filteredQuotations = quotationsData.filter(q =>
        (q.displayId || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        q.client.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const handleConvertQuotation = () => {
        if (selectedQuotation) {
            // Navigate to invoice form with quotation ID (use actual DB id)
            navigate(`/invoices/new?from=quotation&ref=${selectedQuotation.id}`);
        }
    };

    return (
        <div className="flex flex-col gap-6 pb-10 max-w-4xl mx-auto">
            {/* Header */}
            <div className="flex items-center gap-2 text-sm">
                <Link to="/invoices" className="text-text-secondary hover:text-primary">Invoices</Link>
                <span className="text-text-secondary">/</span>
                <span className="text-text-main dark:text-white font-medium">New Invoice</span>
            </div>

            <div className="text-center mb-4">
                <h1 className="text-2xl font-bold text-text-main dark:text-white">Create New Invoice</h1>
                <p className="text-text-secondary mt-1">Choose how you want to create your invoice</p>
            </div>

            {step === 'select' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Option 1: From Quotation */}
                    <button
                        onClick={() => setStep('choose-quotation')}
                        className="bg-surface-light dark:bg-surface-dark rounded-xl border-2 border-primary/20 hover:border-primary p-8 text-left transition-all group hover:shadow-lg"
                    >
                        <div className="size-14 rounded-xl bg-primary/10 text-primary flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                            <Copy size={28} />
                        </div>
                        <h3 className="text-lg font-bold text-text-main dark:text-white mb-2">From Quotation</h3>
                        <p className="text-sm text-text-secondary mb-4">
                            Convert an accepted quotation to an invoice. All client info, items, and totals will be copied automatically.
                        </p>
                        <div className="flex items-center gap-2 text-primary font-medium text-sm">
                            <span>Recommended</span>
                            <ArrowRight size={16} />
                        </div>
                    </button>

                    {/* Option 2: Standalone */}
                    <Link
                        to="/invoices/new?type=standalone"
                        className="bg-surface-light dark:bg-surface-dark rounded-xl border-2 border-border-light dark:border-border-dark hover:border-primary/50 p-8 text-left transition-all group hover:shadow-lg"
                    >
                        <div className="size-14 rounded-xl bg-slate-100 dark:bg-slate-800 text-text-secondary flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                            <Plus size={28} />
                        </div>
                        <h3 className="text-lg font-bold text-text-main dark:text-white mb-2">Standalone Invoice</h3>
                        <p className="text-sm text-text-secondary mb-4">
                            Create a new invoice from scratch. Use this when there was no prior quotation.
                        </p>
                        <div className="flex items-center gap-2 text-text-secondary font-medium text-sm group-hover:text-primary">
                            <span>Manual Entry</span>
                            <ArrowRight size={16} />
                        </div>
                    </Link>
                </div>
            )}

            {step === 'choose-quotation' && (
                <div className="bg-surface-light dark:bg-surface-dark rounded-xl border border-border-light dark:border-border-dark overflow-hidden">
                    {/* Header */}
                    <div className="p-6 border-b border-border-light dark:border-border-dark">
                        <div className="flex items-center justify-between mb-4">
                            <div>
                                <h3 className="font-semibold text-text-main dark:text-white">Select Quotation to Convert</h3>
                                <p className="text-sm text-text-secondary">Choose a quotation to create an invoice from</p>
                            </div>
                            <button
                                onClick={() => setStep('select')}
                                className="text-sm text-text-secondary hover:text-primary"
                            >
                                ← Back
                            </button>
                        </div>

                        {/* Search */}
                        <div className="relative">
                            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary" />
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Search quotations..."
                                className="w-full pl-10 pr-4 py-2.5 bg-background-light dark:bg-background-dark border border-border-light dark:border-border-dark rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                            />
                        </div>
                    </div>

                    {/* Quotation List */}
                    <div className="divide-y divide-border-light dark:divide-border-dark max-h-96 overflow-y-auto">
                        {loading ? (
                            <div className="p-8 text-center">
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                                <p className="text-sm text-text-secondary mt-2">Loading quotations...</p>
                            </div>
                        ) : filteredQuotations.length === 0 ? (
                            <div className="p-8 text-center">
                                <p className="text-sm text-text-secondary">No quotations found.</p>
                            </div>
                        ) : (
                            filteredQuotations.map((quotation) => (
                                <button
                                    key={quotation.id}
                                    onClick={() => setSelectedQuotation(quotation)}
                                    className={`w-full p-4 text-left hover:bg-primary/5 transition-colors flex items-center gap-4 ${selectedQuotation?.id === quotation.id ? 'bg-primary/10 border-l-4 border-primary' : ''
                                        }`}
                                >
                                    <div className="flex-1">
                                        <div className="flex items-center gap-3 mb-1">
                                            <span className="font-semibold text-text-main dark:text-white">{quotation.displayId}</span>
                                            <StatusBadge status={quotation.status} />
                                        </div>
                                        <p className="text-sm text-text-secondary">
                                            {quotation.client} {quotation.contactName && `• ${quotation.contactName}`}
                                        </p>
                                        <p className="text-xs text-text-secondary mt-1">
                                            {new Date(quotation.date).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                                        </p>
                                    </div>
                                    <div className="text-right">
                                        <p className="font-bold text-text-main dark:text-white">{formatIDR(quotation.total)}</p>
                                    </div>
                                    {selectedQuotation?.id === quotation.id && (
                                        <div className="size-6 rounded-full bg-primary text-white flex items-center justify-center">
                                            <Check size={14} />
                                        </div>
                                    )}
                                </button>
                            ))
                        )}
                    </div>

                    {/* Footer */}
                    <div className="p-6 border-t border-border-light dark:border-border-dark bg-slate-50 dark:bg-gray-800/50">
                        <div className="flex items-center justify-between">
                            <div>
                                {selectedQuotation && (
                                    <p className="text-sm text-text-secondary">
                                        Selected: <span className="font-medium text-text-main dark:text-white">{selectedQuotation.id}</span>
                                    </p>
                                )}
                            </div>
                            <Button
                                onClick={handleConvertQuotation}
                                disabled={!selectedQuotation}
                                icon={FileText}
                            >
                                Convert to Invoice
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
