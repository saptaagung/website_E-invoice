import { useState, useEffect } from 'react';
import { Link, useParams, useLocation, useSearchParams, useNavigate } from 'react-router-dom';
import { Save, Send, Plus, Trash2, ChevronDown, ChevronRight } from 'lucide-react';
import { Button } from '../components/ui';
import { invoices, quotations, clients as clientsApi, settings as settingsApi } from '../lib/api';

// Convert number to Indonesian words (Terbilang)
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
    return numberToWords(Math.floor(num / 1000000000)) + ' Milyar' + (num % 1000000000 ? ' ' + numberToWords(num % 1000000000) : '');
};

const terbilang = (amount) => {
    if (amount === 0) return 'Nol Rupiah';
    return numberToWords(Math.floor(amount)) + ' Rupiah';
};

const formatIDR = (amount) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(amount);
};

export default function InvoiceForm() {
    const { id } = useParams();
    const location = useLocation();
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const isNew = location.pathname.includes('/new');

    // Determine document type from URL
    const docType = location.pathname.includes('/quotations') ? 'Quotation' : 'Invoice';

    // State
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');
    const [clientsList, setClientsList] = useState([]);
    const [settings, setSettings] = useState({});
    const [showClientDropdown, setShowClientDropdown] = useState(false);
    const [clientSearch, setClientSearch] = useState('');

    const [formData, setFormData] = useState({
        number: '',
        date: new Date().toISOString().split('T')[0],
        clientId: '',
        selectedClient: null,
        notes: '',
        terms: '',
        taxRate: 11,
        applyTax: true,
        discountPercent: 0,
    });

    const [items, setItems] = useState([
        { id: 1, description: '', quantity: 1, unit: 'unit', unitPrice: 0 }
    ]);

    // Fetch data on mount
    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                const [settingsData, clientsData] = await Promise.all([
                    settingsApi.get(),
                    clientsApi.getAll()
                ]);
                setSettings(settingsData);
                setClientsList(clientsData);

                // Set default form values from settings
                setFormData(prev => ({
                    ...prev,
                    taxRate: settingsData.defaultTaxRate || 11,
                    terms: settingsData.defaultTerms || '',
                }));
            } catch (err) {
                console.error('Failed to fetch data:', err);
                setError('Failed to load data');
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    // Filter clients
    const filteredClients = clientsList.filter(c =>
        c.name?.toLowerCase().includes(clientSearch.toLowerCase())
    );

    // Select client
    const selectClient = (client) => {
        setFormData({ ...formData, clientId: client.id, selectedClient: client });
        setClientSearch('');
        setShowClientDropdown(false);
    };

    // Add item
    const addItem = () => {
        const newId = Date.now();
        setItems([...items, { id: newId, description: '', quantity: 1, unit: 'unit', unitPrice: 0 }]);
    };

    // Remove item
    const removeItem = (id) => {
        if (items.length > 1) {
            setItems(items.filter(item => item.id !== id));
        }
    };

    // Update item
    const updateItem = (id, field, value) => {
        setItems(items.map(item =>
            item.id === id ? { ...item, [field]: value } : item
        ));
    };

    // Calculations
    const subtotal = items.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);
    const taxAmount = formData.applyTax ? subtotal * (formData.taxRate / 100) : 0;
    const discountAmount = subtotal * (formData.discountPercent / 100);
    const total = subtotal + taxAmount - discountAmount;

    // Save document
    const handleSave = async (status = 'draft') => {
        if (!formData.selectedClient) {
            setError('Please select a client');
            return;
        }

        if (items.every(item => !item.description)) {
            setError('Please add at least one item');
            return;
        }

        setSaving(true);
        setError('');

        try {
            const documentData = {
                clientId: formData.selectedClient.id,
                issueDate: formData.date,
                status: status,
                notes: formData.notes,
                terms: formData.terms,
                taxRate: formData.applyTax ? formData.taxRate : 0,
                discountPercent: formData.discountPercent,
                items: items.filter(item => item.description).map(item => ({
                    description: item.description,
                    quantity: item.quantity,
                    unit: item.unit,
                    unitPrice: item.unitPrice,
                })),
            };

            if (docType === 'Quotation') {
                if (isNew) {
                    await quotations.create(documentData);
                } else {
                    await quotations.update(id, documentData);
                }
                navigate('/documents?tab=quotations');
            } else {
                if (isNew) {
                    await invoices.create(documentData);
                } else {
                    await invoices.update(id, documentData);
                }
                navigate('/documents?tab=invoices');
            }
        } catch (err) {
            console.error('Failed to save:', err);
            setError(err.message || 'Failed to save document');
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center py-20">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-6 pb-10">
            {/* Error Banner */}
            {error && (
                <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl text-red-600 dark:text-red-400 text-sm">
                    {error}
                </div>
            )}

            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-2 text-sm">
                    <Link to="/documents" className="text-text-secondary hover:text-primary">Documents</Link>
                    <span className="text-text-secondary">/</span>
                    <span className="text-text-main dark:text-white font-medium">
                        {isNew ? `New ${docType}` : `Edit ${docType}`}
                    </span>
                </div>
                <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                    <Button
                        variant="secondary"
                        icon={Save}
                        onClick={() => handleSave('draft')}
                        disabled={saving}
                    >
                        {saving ? 'Saving...' : 'Save Draft'}
                    </Button>
                    <Button
                        icon={Send}
                        onClick={() => handleSave('sent')}
                        disabled={saving}
                    >
                        Save & Send
                    </Button>
                </div>
            </div>

            {/* Form Grid */}
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                {/* Form Section */}
                <div className="space-y-6">
                    {/* Document Details */}
                    <div className="bg-surface-light dark:bg-surface-dark rounded-xl border border-border-light dark:border-border-dark p-6">
                        <h3 className="text-sm font-semibold text-text-main dark:text-white mb-4">Document Details</h3>

                        <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-medium text-text-secondary mb-2">Date</label>
                                    <input
                                        type="date"
                                        value={formData.date}
                                        onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                                        className="w-full px-3 py-2.5 bg-background-light dark:bg-background-dark border border-border-light dark:border-border-dark rounded-lg text-sm text-text-main dark:text-white"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-text-secondary mb-2">Tax Rate (%)</label>
                                    <input
                                        type="number"
                                        value={formData.taxRate}
                                        onChange={(e) => setFormData({ ...formData, taxRate: parseFloat(e.target.value) || 0 })}
                                        className="w-full px-3 py-2.5 bg-background-light dark:bg-background-dark border border-border-light dark:border-border-dark rounded-lg text-sm text-text-main dark:text-white"
                                    />
                                </div>
                            </div>

                            {/* Client Selection */}
                            <div className="relative">
                                <label className="block text-xs font-medium text-text-secondary mb-2">Client</label>
                                {formData.selectedClient ? (
                                    <div className="flex items-center justify-between p-3 bg-primary/5 border border-primary/20 rounded-lg">
                                        <div>
                                            <p className="font-medium text-text-main dark:text-white">{formData.selectedClient.name}</p>
                                            <p className="text-xs text-text-secondary">{formData.selectedClient.email}</p>
                                        </div>
                                        <button
                                            onClick={() => setFormData({ ...formData, clientId: '', selectedClient: null })}
                                            className="text-text-secondary hover:text-red-500"
                                        >
                                            Change
                                        </button>
                                    </div>
                                ) : (
                                    <div>
                                        <input
                                            type="text"
                                            placeholder="Search clients..."
                                            value={clientSearch}
                                            onChange={(e) => {
                                                setClientSearch(e.target.value);
                                                setShowClientDropdown(true);
                                            }}
                                            onFocus={() => setShowClientDropdown(true)}
                                            className="w-full px-3 py-2.5 bg-background-light dark:bg-background-dark border border-border-light dark:border-border-dark rounded-lg text-sm text-text-main dark:text-white"
                                        />
                                        {showClientDropdown && filteredClients.length > 0 && (
                                            <div className="absolute z-10 w-full mt-1 bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark rounded-lg shadow-lg max-h-48 overflow-y-auto">
                                                {filteredClients.map(client => (
                                                    <button
                                                        key={client.id}
                                                        onClick={() => selectClient(client)}
                                                        className="w-full px-3 py-2 text-left hover:bg-primary/5 text-sm text-text-main dark:text-white"
                                                    >
                                                        {client.name}
                                                    </button>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>

                            {/* Notes */}
                            <div>
                                <label className="block text-xs font-medium text-text-secondary mb-2">Notes</label>
                                <textarea
                                    value={formData.notes}
                                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                                    rows={2}
                                    className="w-full px-3 py-2.5 bg-background-light dark:bg-background-dark border border-border-light dark:border-border-dark rounded-lg text-sm text-text-main dark:text-white resize-none"
                                    placeholder="Additional notes..."
                                />
                            </div>
                        </div>
                    </div>

                    {/* Line Items */}
                    <div className="bg-surface-light dark:bg-surface-dark rounded-xl border border-border-light dark:border-border-dark p-6">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-sm font-semibold text-text-main dark:text-white">Line Items</h3>
                            <button
                                onClick={addItem}
                                className="text-primary text-sm font-medium flex items-center gap-1 hover:text-primary-dark"
                            >
                                <Plus size={16} /> Add Item
                            </button>
                        </div>

                        <div className="space-y-3">
                            {items.map((item, index) => (
                                <div key={item.id} className="p-4 bg-background-light dark:bg-background-dark rounded-lg border border-border-light dark:border-border-dark">
                                    <div className="grid grid-cols-1 md:grid-cols-6 gap-3">
                                        <div className="md:col-span-3">
                                            <input
                                                type="text"
                                                placeholder="Description"
                                                value={item.description}
                                                onChange={(e) => updateItem(item.id, 'description', e.target.value)}
                                                className="w-full px-3 py-2 bg-white dark:bg-gray-800 border border-border-light dark:border-border-dark rounded-lg text-sm text-text-main dark:text-white"
                                            />
                                        </div>
                                        <div>
                                            <input
                                                type="number"
                                                placeholder="Qty"
                                                value={item.quantity}
                                                onChange={(e) => updateItem(item.id, 'quantity', parseInt(e.target.value) || 0)}
                                                className="w-full px-3 py-2 bg-white dark:bg-gray-800 border border-border-light dark:border-border-dark rounded-lg text-sm text-text-main dark:text-white"
                                            />
                                        </div>
                                        <div>
                                            <input
                                                type="number"
                                                placeholder="Price"
                                                value={item.unitPrice}
                                                onChange={(e) => updateItem(item.id, 'unitPrice', parseFloat(e.target.value) || 0)}
                                                className="w-full px-3 py-2 bg-white dark:bg-gray-800 border border-border-light dark:border-border-dark rounded-lg text-sm text-text-main dark:text-white"
                                            />
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <span className="text-sm font-medium text-text-main dark:text-white">
                                                {formatIDR(item.quantity * item.unitPrice)}
                                            </span>
                                            {items.length > 1 && (
                                                <button
                                                    onClick={() => removeItem(item.id)}
                                                    className="text-text-secondary hover:text-red-500"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Preview Section */}
                <div className="bg-surface-light dark:bg-surface-dark rounded-xl border border-border-light dark:border-border-dark p-6">
                    <h3 className="text-sm font-semibold text-text-main dark:text-white mb-4">Preview</h3>

                    <div className="bg-white rounded-lg border p-6 text-sm">
                        {/* Header */}
                        <div className="border-b pb-4 mb-4">
                            <h2 className="text-xl font-bold text-gray-800">{docType}</h2>
                            <p className="text-gray-500">Date: {formData.date}</p>
                        </div>

                        {/* Client */}
                        {formData.selectedClient && (
                            <div className="mb-4">
                                <p className="text-gray-500 text-xs uppercase tracking-wide">Bill To</p>
                                <p className="font-medium text-gray-800">{formData.selectedClient.name}</p>
                            </div>
                        )}

                        {/* Items Table */}
                        <table className="w-full text-left mb-4">
                            <thead>
                                <tr className="border-b">
                                    <th className="py-2 text-xs text-gray-500">Description</th>
                                    <th className="py-2 text-xs text-gray-500 text-right">Qty</th>
                                    <th className="py-2 text-xs text-gray-500 text-right">Price</th>
                                    <th className="py-2 text-xs text-gray-500 text-right">Amount</th>
                                </tr>
                            </thead>
                            <tbody>
                                {items.filter(i => i.description).map(item => (
                                    <tr key={item.id} className="border-b">
                                        <td className="py-2 text-gray-800">{item.description}</td>
                                        <td className="py-2 text-gray-600 text-right">{item.quantity}</td>
                                        <td className="py-2 text-gray-600 text-right">{formatIDR(item.unitPrice)}</td>
                                        <td className="py-2 text-gray-800 text-right font-medium">{formatIDR(item.quantity * item.unitPrice)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>

                        {/* Totals */}
                        <div className="border-t pt-4 space-y-2">
                            <div className="flex justify-between">
                                <span className="text-gray-500">Subtotal</span>
                                <span className="text-gray-800">{formatIDR(subtotal)}</span>
                            </div>
                            {formData.applyTax && (
                                <div className="flex justify-between">
                                    <span className="text-gray-500">Tax ({formData.taxRate}%)</span>
                                    <span className="text-gray-800">{formatIDR(taxAmount)}</span>
                                </div>
                            )}
                            {formData.discountPercent > 0 && (
                                <div className="flex justify-between text-green-600">
                                    <span>Discount ({formData.discountPercent}%)</span>
                                    <span>-{formatIDR(discountAmount)}</span>
                                </div>
                            )}
                            <div className="flex justify-between pt-2 border-t font-bold">
                                <span className="text-gray-800">Total</span>
                                <span className="text-primary text-lg">{formatIDR(total)}</span>
                            </div>
                        </div>

                        {/* Terbilang */}
                        <div className="mt-4 p-3 bg-primary/5 rounded-lg">
                            <p className="text-xs text-gray-500">Terbilang:</p>
                            <p className="text-sm italic text-gray-700">{terbilang(total)}</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
