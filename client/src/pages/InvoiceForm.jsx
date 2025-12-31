import { useState, useEffect } from 'react';
import { Link, useParams, useLocation, useSearchParams, useNavigate } from 'react-router-dom';
import { Save, Send, Download, Plus, Trash2, ChevronDown, ChevronRight, Link as LinkIcon, X } from 'lucide-react';
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

// Sample clients for dropdown (will be replaced by API data)
const sampleClients = [
    { id: '1', name: 'CV SARI JAYA', contactName: 'Pak Reza', email: 'reza@sarijaya.com' },
    { id: '2', name: 'PT MAJU BERSAMA', contactName: 'Ibu Sarah', email: 'sarah@majubersama.co.id' },
    { id: '3', name: 'UD BERKAH SENTOSA', contactName: 'Pak Ahmad', email: 'ahmad@berkahsentosa.com' },
];

// Default company settings
const defaultCompanySettings = {
    companyName: 'PT SURYA GEMILANG PERKASA',
    legalName: 'PT SURYA GEMILANG PERKASA',
    address: 'Jl. Industri No. 45, Kawasan Industri MM2100',
    city: 'Bekasi',
    email: 'info@sgp.co.id',
    phone: '+62 21 8970 1234',
    quotationPrefix: 'SPG/',
    quotationNextNum: 11,
    invoicePrefix: 'INV/',
    invoiceNextNum: 1,
    defaultTaxRate: 11,
    bankName: 'BCA',
    bankAccountNum: '123-456-7890',
    bankAccountName: 'PT SURYA GEMILANG PERKASA',
    signatureName: 'Budi Santoso',
    defaultTerms: `1. Harga sudah termasuk PPN
2. Barang akan dikirim setelah pembayaran dikonfirmasi
3. Masa berlaku penawaran 30 hari`,
};

export default function InvoiceForm() {
    const { id } = useParams();
    const location = useLocation();
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const isNew = location.pathname.includes('/new');

    // Check if converting from quotation
    const fromQuotation = searchParams.get('from') === 'quotation';
    const linkedQuotationRef = searchParams.get('ref');

    // Determine document type from URL
    const getDocType = () => {
        if (location.pathname.includes('/quotations')) return 'Quotation';
        return 'Invoice';
    };
    const docType = getDocType();

    // State for API data
    const [companySettings, setCompanySettings] = useState(defaultCompanySettings);
    const [clientsList, setClientsList] = useState(sampleClients);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');

    // Generate auto number based on settings
    const generateDocNumber = (settings) => {
        const date = new Date();
        const prefix = docType === 'Quotation' ? (settings.quotationPrefix || 'QT/') : (settings.invoicePrefix || 'INV/');
        const nextNum = docType === 'Quotation' ? (settings.quotationNextNum || 1) : (settings.invoiceNextNum || 1);
        const year = date.getFullYear();
        return `${prefix}${year}/${String(nextNum).padStart(4, '0')}`;
    };

    const [formData, setFormData] = useState({
        number: '',
        date: new Date().toISOString().split('T')[0],
        projectName: '',
        poNumber: '',
        clientId: '',
        selectedClient: null,
        linkedQuotation: fromQuotation ? linkedQuotationRef : null,
        applyTax: true,
        taxRate: 11,
        discountPercent: 0,
        discount: 0,
        bankName: '',
        bankAccountNum: '',
        bankAccountName: '',
        signatureName: '',
        terms: '',
    });

    // Items with grouped structure
    const [items, setItems] = useState([
        {
            id: 1,
            name: '',
            expanded: true,
            descriptions: [
                { id: 101, model: '', description: '', qty: 1, unit: 'unit', rate: 0 }
            ]
        }
    ]);

    const [clientSearch, setClientSearch] = useState('');
    const [showClientDropdown, setShowClientDropdown] = useState(false);

    // Fetch settings and clients on mount
    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                const [settingsData, clientsData] = await Promise.all([
                    settingsApi.get().catch(() => null),
                    clientsApi.getAll().catch(() => [])
                ]);

                if (settingsData) {
                    const mappedSettings = {
                        companyName: settingsData.companyName || defaultCompanySettings.companyName,
                        legalName: settingsData.legalName || settingsData.companyName || defaultCompanySettings.legalName,
                        address: settingsData.address || defaultCompanySettings.address,
                        city: settingsData.city || defaultCompanySettings.city,
                        email: settingsData.email || defaultCompanySettings.email,
                        phone: settingsData.phone || defaultCompanySettings.phone,
                        bankName: settingsData.bankAccounts?.[0]?.bankName || defaultCompanySettings.bankName,
                        bankAccountNum: settingsData.bankAccounts?.[0]?.accountNum || defaultCompanySettings.bankAccountNum,
                        bankAccountName: settingsData.bankAccounts?.[0]?.holderName || defaultCompanySettings.bankAccountName,
                        quotationPrefix: settingsData.quotationPrefix || defaultCompanySettings.quotationPrefix,
                        quotationNextNum: settingsData.quotationNextNum || defaultCompanySettings.quotationNextNum,
                        invoicePrefix: settingsData.invoicePrefix || defaultCompanySettings.invoicePrefix,
                        invoiceNextNum: settingsData.invoiceNextNum || defaultCompanySettings.invoiceNextNum,
                        defaultTaxRate: settingsData.defaultTaxRate || defaultCompanySettings.defaultTaxRate,
                        defaultTerms: settingsData.defaultTerms || defaultCompanySettings.defaultTerms,
                        signatureName: settingsData.signatureName || defaultCompanySettings.signatureName,
                    };
                    setCompanySettings(mappedSettings);

                    // Initialize form with settings data
                    if (isNew) {
                        setFormData(prev => ({
                            ...prev,
                            number: generateDocNumber(mappedSettings),
                            taxRate: mappedSettings.defaultTaxRate,
                            bankName: mappedSettings.bankName,
                            bankAccountNum: mappedSettings.bankAccountNum,
                            bankAccountName: mappedSettings.bankAccountName,
                            signatureName: mappedSettings.signatureName,
                            terms: mappedSettings.defaultTerms,
                        }));
                    }
                } else {
                    // Use defaults
                    if (isNew) {
                        setFormData(prev => ({
                            ...prev,
                            number: generateDocNumber(defaultCompanySettings),
                            taxRate: defaultCompanySettings.defaultTaxRate,
                            bankName: defaultCompanySettings.bankName,
                            bankAccountNum: defaultCompanySettings.bankAccountNum,
                            bankAccountName: defaultCompanySettings.bankAccountName,
                            signatureName: defaultCompanySettings.signatureName,
                            terms: defaultCompanySettings.defaultTerms,
                        }));
                    }
                }

                if (clientsData && clientsData.length > 0) {
                    setClientsList(clientsData);
                }
            } catch (err) {
                console.error('Failed to fetch data:', err);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [isNew]);

    // Filter clients based on search
    const filteredClients = clientsList.filter(c =>
        c.name?.toLowerCase().includes(clientSearch.toLowerCase()) ||
        c.contactName?.toLowerCase().includes(clientSearch.toLowerCase())
    );

    // Select client
    const selectClient = (client) => {
        setFormData({ ...formData, clientId: client.id, selectedClient: client });
        setClientSearch('');
        setShowClientDropdown(false);
    };

    // Add new item group
    const addItemGroup = () => {
        const newId = Date.now();
        setItems([...items, {
            id: newId,
            name: '',
            expanded: true,
            descriptions: [{ id: newId + 1, model: '', description: '', qty: 1, unit: 'unit', rate: 0 }]
        }]);
    };

    // Remove item group
    const removeItemGroup = (groupId) => {
        if (items.length > 1) {
            setItems(items.filter(item => item.id !== groupId));
        }
    };

    // Update item group name
    const updateItemGroupName = (groupId, name) => {
        setItems(items.map(item =>
            item.id === groupId ? { ...item, name } : item
        ));
    };

    // Toggle item group expand/collapse
    const toggleItemGroup = (groupId) => {
        setItems(items.map(item =>
            item.id === groupId ? { ...item, expanded: !item.expanded } : item
        ));
    };

    // Add description to item group
    const addDescription = (groupId) => {
        const newDescId = Date.now();
        setItems(items.map(item =>
            item.id === groupId
                ? {
                    ...item,
                    descriptions: [...item.descriptions, {
                        id: newDescId,
                        model: '',
                        description: '',
                        qty: 1,
                        unit: 'unit',
                        rate: 0
                    }]
                }
                : item
        ));
    };

    // Remove description from item group
    const removeDescription = (groupId, descId) => {
        setItems(items.map(item =>
            item.id === groupId
                ? { ...item, descriptions: item.descriptions.filter(d => d.id !== descId) }
                : item
        ));
    };

    // Update description field
    const updateDescription = (groupId, descId, field, value) => {
        setItems(items.map(item =>
            item.id === groupId
                ? {
                    ...item,
                    descriptions: item.descriptions.map(d =>
                        d.id === descId ? { ...d, [field]: value } : d
                    )
                }
                : item
        ));
    };

    // Calculations
    const subtotal = items.reduce((sum, group) =>
        sum + group.descriptions.reduce((gSum, d) => gSum + (d.qty * d.rate), 0)
        , 0);
    const taxAmount = formData.applyTax ? subtotal * (formData.taxRate / 100) : 0;
    const discountAmount = subtotal * (formData.discountPercent / 100);
    const total = subtotal + taxAmount - discountAmount;

    // Save document handler
    const handleSave = async (status = 'draft') => {
        if (!formData.selectedClient) {
            setError('Please select a client');
            return;
        }

        setSaving(true);
        setError('');

        try {
            // Flatten items for API
            const flatItems = items.flatMap(group =>
                group.descriptions.map(desc => ({
                    groupName: group.name,
                    model: desc.model,
                    description: desc.description,
                    quantity: desc.qty,
                    unit: desc.unit,
                    unitPrice: desc.rate,
                }))
            );

            const documentData = {
                clientId: formData.selectedClient.id,
                issueDate: formData.date,
                status: status,
                projectName: formData.projectName,
                poNumber: formData.poNumber,
                notes: formData.projectName,
                terms: formData.terms,
                taxRate: formData.applyTax ? formData.taxRate : 0,
                discountPercent: formData.discountPercent,
                bankAccount: `${formData.bankName} - ${formData.bankAccountNum}`,
                signatureName: formData.signatureName,
                items: flatItems,
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

    const formatIDR = (amount) => {
        return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(amount);
    };

    const formatNumber = (amount) => {
        return new Intl.NumberFormat('id-ID').format(amount);
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
                <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl text-red-600 dark:text-red-400 text-sm flex items-center justify-between">
                    <span>{error}</span>
                    <button onClick={() => setError('')} className="text-red-400 hover:text-red-600">
                        <X size={16} />
                    </button>
                </div>
            )}

            {/* Header with breadcrumb and actions */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-2 text-sm">
                    <Link to="/documents" className="text-text-secondary hover:text-primary">{docType}s</Link>
                    <span className="text-text-secondary">/</span>
                    <span className="text-text-main dark:text-white font-medium">
                        {isNew ? `New ${docType}` : formData.number}
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
                        variant="secondary"
                        icon={Send}
                        onClick={() => handleSave('sent')}
                        disabled={saving}
                    >
                        Send
                    </Button>
                    <Button
                        icon={Download}
                        onClick={() => handleSave('pending')}
                        disabled={saving}
                    >
                        Save & Continue
                    </Button>
                </div>
            </div>

            {/* Linked Quotation Banner */}
            {formData.linkedQuotation && (
                <div className="flex items-center gap-3 px-4 py-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl">
                    <LinkIcon size={18} className="text-blue-600 dark:text-blue-400" />
                    <div className="flex-1">
                        <p className="text-sm font-medium text-blue-800 dark:text-blue-300">
                            Linked Quotation: <span className="font-bold">{formData.linkedQuotation}</span>
                        </p>
                        <p className="text-xs text-blue-600 dark:text-blue-400">
                            This invoice was created from a quotation. All items and details have been copied.
                        </p>
                    </div>
                </div>
            )}

            {/* Main Form + Preview Grid */}
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                {/* Form Section */}
                <div className="space-y-6">
                    {/* Document Details Card */}
                    <div className="bg-surface-light dark:bg-surface-dark rounded-xl border border-border-light dark:border-border-dark p-6">
                        <h3 className="text-sm font-semibold text-text-main dark:text-white flex items-center gap-2 mb-4">
                            <span className="text-primary">📄</span> Document Details
                        </h3>

                        <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-medium text-text-secondary mb-2">No. {docType}</label>
                                    <input
                                        type="text"
                                        value={formData.number}
                                        onChange={(e) => setFormData({ ...formData, number: e.target.value })}
                                        placeholder="SPG/2025/0001"
                                        className="w-full px-3 py-2.5 bg-background-light dark:bg-background-dark border border-border-light dark:border-border-dark rounded-lg text-sm text-text-main dark:text-white focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
                                    />
                                    <p className="text-xs text-text-secondary mt-1">Auto-generated, can be edited</p>
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-text-secondary mb-2">Date</label>
                                    <input
                                        type="date"
                                        value={formData.date}
                                        onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                                        className="w-full px-3 py-2.5 bg-background-light dark:bg-background-dark border border-border-light dark:border-border-dark rounded-lg text-sm text-text-main dark:text-white focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-medium text-text-secondary mb-2">Project Name</label>
                                    <input
                                        type="text"
                                        value={formData.projectName}
                                        onChange={(e) => setFormData({ ...formData, projectName: e.target.value })}
                                        placeholder="Sound System Installation"
                                        className="w-full px-3 py-2.5 bg-background-light dark:bg-background-dark border border-border-light dark:border-border-dark rounded-lg text-sm text-text-main dark:text-white focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-text-secondary mb-2">PO Number</label>
                                    <input
                                        type="text"
                                        value={formData.poNumber}
                                        onChange={(e) => setFormData({ ...formData, poNumber: e.target.value })}
                                        placeholder="PO-2025-001"
                                        className="w-full px-3 py-2.5 bg-background-light dark:bg-background-dark border border-border-light dark:border-border-dark rounded-lg text-sm text-text-main dark:text-white focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Client Card */}
                    <div className="bg-surface-light dark:bg-surface-dark rounded-xl border border-border-light dark:border-border-dark p-6">
                        <h3 className="text-sm font-semibold text-text-main dark:text-white flex items-center gap-2 mb-4">
                            <span className="text-primary">👤</span> Client
                        </h3>

                        {formData.selectedClient ? (
                            <div className="flex items-center justify-between p-4 bg-primary/5 border border-primary/20 rounded-lg">
                                <div>
                                    <p className="font-semibold text-text-main dark:text-white">{formData.selectedClient.name}</p>
                                    <p className="text-sm text-text-secondary">{formData.selectedClient.contactName}</p>
                                    <p className="text-xs text-text-secondary">{formData.selectedClient.email}</p>
                                </div>
                                <button
                                    onClick={() => setFormData({ ...formData, clientId: '', selectedClient: null })}
                                    className="px-3 py-1.5 text-xs font-medium text-primary hover:bg-primary/10 rounded-lg transition-colors"
                                >
                                    Change
                                </button>
                            </div>
                        ) : (
                            <div className="relative">
                                <input
                                    type="text"
                                    placeholder="Search clients by name..."
                                    value={clientSearch}
                                    onChange={(e) => {
                                        setClientSearch(e.target.value);
                                        setShowClientDropdown(true);
                                    }}
                                    onFocus={() => setShowClientDropdown(true)}
                                    onBlur={() => setTimeout(() => setShowClientDropdown(false), 200)}
                                    className="w-full px-3 py-2.5 bg-background-light dark:bg-background-dark border border-border-light dark:border-border-dark rounded-lg text-sm text-text-main dark:text-white focus:outline-none focus:ring-1 focus:ring-primary"
                                />
                                {showClientDropdown && filteredClients.length > 0 && (
                                    <div className="absolute z-20 w-full mt-1 bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark rounded-lg shadow-xl max-h-48 overflow-y-auto">
                                        {filteredClients.map(client => (
                                            <button
                                                key={client.id}
                                                onClick={() => selectClient(client)}
                                                className="w-full px-4 py-3 text-left hover:bg-primary/5 border-b border-border-light dark:border-border-dark last:border-0"
                                            >
                                                <p className="font-medium text-text-main dark:text-white text-sm">{client.name}</p>
                                                <p className="text-xs text-text-secondary">{client.contactName} • {client.email}</p>
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Items Card */}
                    <div className="bg-surface-light dark:bg-surface-dark rounded-xl border border-border-light dark:border-border-dark p-6">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-sm font-semibold text-text-main dark:text-white flex items-center gap-2">
                                <span className="text-primary">📦</span> Line Items
                            </h3>
                            <button
                                onClick={addItemGroup}
                                className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-primary hover:bg-primary/10 rounded-lg transition-colors"
                            >
                                <Plus size={14} /> Add Group
                            </button>
                        </div>

                        <div className="space-y-4">
                            {items.map((group, groupIndex) => (
                                <div key={group.id} className="border border-border-light dark:border-border-dark rounded-lg overflow-hidden">
                                    {/* Group Header */}
                                    <div className="flex items-center gap-2 p-3 bg-background-light dark:bg-background-dark">
                                        <button onClick={() => toggleItemGroup(group.id)} className="text-text-secondary hover:text-primary">
                                            {group.expanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                                        </button>
                                        <input
                                            type="text"
                                            value={group.name}
                                            onChange={(e) => updateItemGroupName(group.id, e.target.value)}
                                            placeholder={`Group ${groupIndex + 1} (e.g., Speaker System)`}
                                            className="flex-1 px-2 py-1 bg-transparent text-sm font-medium text-text-main dark:text-white focus:outline-none"
                                        />
                                        {items.length > 1 && (
                                            <button
                                                onClick={() => removeItemGroup(group.id)}
                                                className="text-text-secondary hover:text-red-500"
                                            >
                                                <Trash2 size={14} />
                                            </button>
                                        )}
                                    </div>

                                    {/* Group Items */}
                                    {group.expanded && (
                                        <div className="p-3 space-y-2">
                                            {/* Mobile: Stacked Layout */}
                                            <div className="block md:hidden space-y-3">
                                                {group.descriptions.map((desc) => (
                                                    <div key={desc.id} className="p-3 bg-background-light dark:bg-background-dark rounded-lg space-y-2">
                                                        <div className="flex gap-2">
                                                            <input
                                                                type="text"
                                                                value={desc.model}
                                                                onChange={(e) => updateDescription(group.id, desc.id, 'model', e.target.value)}
                                                                placeholder="Model"
                                                                className="w-1/3 px-2 py-1.5 text-xs bg-white dark:bg-gray-800 border border-border-light dark:border-border-dark rounded text-text-main dark:text-white"
                                                            />
                                                            <input
                                                                type="text"
                                                                value={desc.description}
                                                                onChange={(e) => updateDescription(group.id, desc.id, 'description', e.target.value)}
                                                                placeholder="Description"
                                                                className="flex-1 px-2 py-1.5 text-xs bg-white dark:bg-gray-800 border border-border-light dark:border-border-dark rounded text-text-main dark:text-white"
                                                            />
                                                        </div>
                                                        <div className="flex gap-2 items-center">
                                                            <input
                                                                type="number"
                                                                value={desc.qty}
                                                                onChange={(e) => updateDescription(group.id, desc.id, 'qty', parseInt(e.target.value) || 0)}
                                                                className="w-16 px-2 py-1.5 text-xs bg-white dark:bg-gray-800 border border-border-light dark:border-border-dark rounded text-center text-text-main dark:text-white"
                                                            />
                                                            <select
                                                                value={desc.unit}
                                                                onChange={(e) => updateDescription(group.id, desc.id, 'unit', e.target.value)}
                                                                className="w-20 px-2 py-1.5 text-xs bg-white dark:bg-gray-800 border border-border-light dark:border-border-dark rounded text-text-main dark:text-white"
                                                            >
                                                                <option value="unit">unit</option>
                                                                <option value="set">set</option>
                                                                <option value="pcs">pcs</option>
                                                                <option value="lot">lot</option>
                                                            </select>
                                                            <input
                                                                type="number"
                                                                value={desc.rate}
                                                                onChange={(e) => updateDescription(group.id, desc.id, 'rate', parseFloat(e.target.value) || 0)}
                                                                placeholder="Rate"
                                                                className="flex-1 px-2 py-1.5 text-xs bg-white dark:bg-gray-800 border border-border-light dark:border-border-dark rounded text-text-main dark:text-white"
                                                            />
                                                            <span className="text-xs font-medium text-primary min-w-[80px] text-right">
                                                                {formatIDR(desc.qty * desc.rate)}
                                                            </span>
                                                            <button
                                                                onClick={() => removeDescription(group.id, desc.id)}
                                                                className="text-text-secondary hover:text-red-500"
                                                            >
                                                                <Trash2 size={14} />
                                                            </button>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>

                                            {/* Desktop: Table Layout */}
                                            <div className="hidden md:block">
                                                <table className="w-full text-xs">
                                                    <thead>
                                                        <tr className="text-text-secondary">
                                                            <th className="text-left pb-2 font-medium">Model</th>
                                                            <th className="text-left pb-2 font-medium">Description</th>
                                                            <th className="text-center pb-2 font-medium w-16">Qty</th>
                                                            <th className="text-center pb-2 font-medium w-20">Unit</th>
                                                            <th className="text-right pb-2 font-medium w-28">Rate</th>
                                                            <th className="text-right pb-2 font-medium w-28">Amount</th>
                                                            <th className="w-8"></th>
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        {group.descriptions.map((desc) => (
                                                            <tr key={desc.id} className="border-t border-border-light dark:border-border-dark">
                                                                <td className="py-2 pr-2">
                                                                    <input
                                                                        type="text"
                                                                        value={desc.model}
                                                                        onChange={(e) => updateDescription(group.id, desc.id, 'model', e.target.value)}
                                                                        placeholder="SR-S4S"
                                                                        className="w-full px-2 py-1.5 bg-white dark:bg-gray-800 border border-border-light dark:border-border-dark rounded text-text-main dark:text-white"
                                                                    />
                                                                </td>
                                                                <td className="py-2 pr-2">
                                                                    <input
                                                                        type="text"
                                                                        value={desc.description}
                                                                        onChange={(e) => updateDescription(group.id, desc.id, 'description', e.target.value)}
                                                                        placeholder="Variable Dispersion Speaker"
                                                                        className="w-full px-2 py-1.5 bg-white dark:bg-gray-800 border border-border-light dark:border-border-dark rounded text-text-main dark:text-white"
                                                                    />
                                                                </td>
                                                                <td className="py-2 pr-2">
                                                                    <input
                                                                        type="number"
                                                                        value={desc.qty}
                                                                        onChange={(e) => updateDescription(group.id, desc.id, 'qty', parseInt(e.target.value) || 0)}
                                                                        className="w-full px-2 py-1.5 bg-white dark:bg-gray-800 border border-border-light dark:border-border-dark rounded text-center text-text-main dark:text-white"
                                                                    />
                                                                </td>
                                                                <td className="py-2 pr-2">
                                                                    <select
                                                                        value={desc.unit}
                                                                        onChange={(e) => updateDescription(group.id, desc.id, 'unit', e.target.value)}
                                                                        className="w-full px-2 py-1.5 bg-white dark:bg-gray-800 border border-border-light dark:border-border-dark rounded text-text-main dark:text-white"
                                                                    >
                                                                        <option value="unit">unit</option>
                                                                        <option value="set">set</option>
                                                                        <option value="pcs">pcs</option>
                                                                        <option value="lot">lot</option>
                                                                    </select>
                                                                </td>
                                                                <td className="py-2 pr-2">
                                                                    <input
                                                                        type="number"
                                                                        value={desc.rate}
                                                                        onChange={(e) => updateDescription(group.id, desc.id, 'rate', parseFloat(e.target.value) || 0)}
                                                                        className="w-full px-2 py-1.5 bg-white dark:bg-gray-800 border border-border-light dark:border-border-dark rounded text-right text-text-main dark:text-white"
                                                                    />
                                                                </td>
                                                                <td className="py-2 pr-2 text-right font-medium text-primary">
                                                                    {formatIDR(desc.qty * desc.rate)}
                                                                </td>
                                                                <td className="py-2">
                                                                    <button
                                                                        onClick={() => removeDescription(group.id, desc.id)}
                                                                        className="text-text-secondary hover:text-red-500"
                                                                    >
                                                                        <Trash2 size={14} />
                                                                    </button>
                                                                </td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                            </div>

                                            <button
                                                onClick={() => addDescription(group.id)}
                                                className="w-full py-2 text-xs text-primary hover:bg-primary/5 rounded-lg border border-dashed border-primary/30 transition-colors"
                                            >
                                                + Add Item
                                            </button>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Terms & Bank Card */}
                    <div className="bg-surface-light dark:bg-surface-dark rounded-xl border border-border-light dark:border-border-dark p-6">
                        <h3 className="text-sm font-semibold text-text-main dark:text-white flex items-center gap-2 mb-4">
                            <span className="text-primary">💳</span> Payment & Terms
                        </h3>

                        <div className="space-y-4">
                            <div className="grid grid-cols-3 gap-4">
                                <div>
                                    <label className="block text-xs font-medium text-text-secondary mb-2">Bank Name</label>
                                    <input
                                        type="text"
                                        value={formData.bankName}
                                        onChange={(e) => setFormData({ ...formData, bankName: e.target.value })}
                                        className="w-full px-3 py-2 bg-background-light dark:bg-background-dark border border-border-light dark:border-border-dark rounded-lg text-sm text-text-main dark:text-white"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-text-secondary mb-2">Account Number</label>
                                    <input
                                        type="text"
                                        value={formData.bankAccountNum}
                                        onChange={(e) => setFormData({ ...formData, bankAccountNum: e.target.value })}
                                        className="w-full px-3 py-2 bg-background-light dark:bg-background-dark border border-border-light dark:border-border-dark rounded-lg text-sm text-text-main dark:text-white"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-text-secondary mb-2">Account Name</label>
                                    <input
                                        type="text"
                                        value={formData.bankAccountName}
                                        onChange={(e) => setFormData({ ...formData, bankAccountName: e.target.value })}
                                        className="w-full px-3 py-2 bg-background-light dark:bg-background-dark border border-border-light dark:border-border-dark rounded-lg text-sm text-text-main dark:text-white"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-medium text-text-secondary mb-2">Terms & Conditions</label>
                                <textarea
                                    value={formData.terms}
                                    onChange={(e) => setFormData({ ...formData, terms: e.target.value })}
                                    rows={4}
                                    className="w-full px-3 py-2 bg-background-light dark:bg-background-dark border border-border-light dark:border-border-dark rounded-lg text-sm text-text-main dark:text-white resize-none"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-medium text-text-secondary mb-2">Signature Name</label>
                                    <input
                                        type="text"
                                        value={formData.signatureName}
                                        onChange={(e) => setFormData({ ...formData, signatureName: e.target.value })}
                                        className="w-full px-3 py-2 bg-background-light dark:bg-background-dark border border-border-light dark:border-border-dark rounded-lg text-sm text-text-main dark:text-white"
                                    />
                                </div>
                                <div className="flex items-end gap-4">
                                    <label className="flex items-center gap-2 cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={formData.applyTax}
                                            onChange={(e) => setFormData({ ...formData, applyTax: e.target.checked })}
                                            className="w-4 h-4 text-primary border-border-light rounded focus:ring-primary"
                                        />
                                        <span className="text-sm text-text-main dark:text-white">Apply Tax ({formData.taxRate}%)</span>
                                    </label>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Preview Section */}
                <div className="bg-surface-light dark:bg-surface-dark rounded-xl border border-border-light dark:border-border-dark p-6 h-fit sticky top-6">
                    <h3 className="text-sm font-semibold text-text-main dark:text-white flex items-center gap-2 mb-4">
                        <span className="text-primary">👁️</span> Live Preview
                    </h3>

                    {/* Document Preview */}
                    <div className="bg-white rounded-lg shadow-lg overflow-hidden text-slate-700 text-[11px]" style={{ aspectRatio: '210/297' }}>
                        <div className="p-6 h-full flex flex-col">
                            {/* Header */}
                            <div className="flex justify-between items-start pb-4 border-b-2 border-primary">
                                <div>
                                    <h1 className="text-lg font-bold text-primary">{companySettings.companyName}</h1>
                                    <p className="text-[10px] text-slate-500">{companySettings.address}</p>
                                    <p className="text-[10px] text-slate-500">{companySettings.city}</p>
                                    <p className="text-[10px] text-slate-500">{companySettings.email} | {companySettings.phone}</p>
                                </div>
                                <div className="text-right">
                                    <h2 className="text-xl font-bold text-slate-800">{docType.toUpperCase()}</h2>
                                    <p className="font-semibold text-primary">{formData.number || 'SPG/2025/0001'}</p>
                                    <p className="text-slate-500">Date: {formData.date}</p>
                                </div>
                            </div>

                            {/* Client Info */}
                            <div className="py-3 border-b border-slate-200">
                                <p className="text-[10px] text-slate-500 uppercase tracking-wide">Bill To</p>
                                <p className="font-bold">{formData.selectedClient?.name || 'Select Client'}</p>
                                <p className="text-slate-500">{formData.selectedClient?.contactName || '-'}</p>
                                {formData.projectName && <p className="text-slate-500 mt-1">Project: {formData.projectName}</p>}
                            </div>

                            {/* Items Table */}
                            <div className="flex-1 overflow-hidden py-3">
                                <table className="w-full text-[10px]">
                                    <thead>
                                        <tr className="border-b-2 border-primary text-left">
                                            <th className="py-1 font-semibold">Description</th>
                                            <th className="py-1 font-semibold text-center w-12">Qty</th>
                                            <th className="py-1 font-semibold text-right w-20">Rate</th>
                                            <th className="py-1 font-semibold text-right w-24">Amount</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {items.map(group => (
                                            <>
                                                {group.name && (
                                                    <tr key={`group-${group.id}`} className="bg-slate-50">
                                                        <td colSpan={4} className="py-1 font-semibold text-primary">{group.name}</td>
                                                    </tr>
                                                )}
                                                {group.descriptions.slice(0, 3).map(desc => (
                                                    <tr key={desc.id} className="border-b border-slate-100">
                                                        <td className="py-1">
                                                            {desc.model && <span className="font-medium">{desc.model}</span>}
                                                            {desc.model && desc.description && ' - '}
                                                            {desc.description}
                                                        </td>
                                                        <td className="py-1 text-center">{desc.qty} {desc.unit}</td>
                                                        <td className="py-1 text-right">{formatNumber(desc.rate)}</td>
                                                        <td className="py-1 text-right font-medium">{formatNumber(desc.qty * desc.rate)}</td>
                                                    </tr>
                                                ))}
                                                {group.descriptions.length > 3 && (
                                                    <tr key={`more-${group.id}`}>
                                                        <td colSpan={4} className="py-1 text-center text-slate-400 italic">
                                                            +{group.descriptions.length - 3} more items...
                                                        </td>
                                                    </tr>
                                                )}
                                            </>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            {/* Totals */}
                            <div className="border-t-2 border-primary pt-2">
                                <div className="flex justify-end">
                                    <div className="w-48 space-y-1 text-[10px]">
                                        <div className="flex justify-between">
                                            <span>Subtotal</span>
                                            <span className="font-medium">{formatIDR(subtotal)}</span>
                                        </div>
                                        {formData.applyTax && (
                                            <div className="flex justify-between">
                                                <span>PPN ({formData.taxRate}%)</span>
                                                <span>{formatIDR(taxAmount)}</span>
                                            </div>
                                        )}
                                        {formData.discountPercent > 0 && (
                                            <div className="flex justify-between text-green-600">
                                                <span>Discount ({formData.discountPercent}%)</span>
                                                <span>-{formatIDR(discountAmount)}</span>
                                            </div>
                                        )}
                                        <div className="flex justify-between pt-1 border-t border-slate-300 font-bold text-primary">
                                            <span>TOTAL</span>
                                            <span>{formatIDR(total)}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Terbilang */}
                            <div className="border-t-2 border-primary pt-2 mt-2">
                                <p className="text-[10px]">
                                    <span className="font-bold text-primary">Terbilang :</span>
                                    <span className="ml-2 italic">{terbilang(total)}</span>
                                </p>
                            </div>

                            {/* Bank & Signature */}
                            <div className="flex justify-between items-end pt-4 mt-auto">
                                <div className="text-[10px]">
                                    <p className="font-medium">{formData.bankName}</p>
                                    <p>AN : <span className="font-semibold">{formData.bankAccountName}</span></p>
                                    <p>AC : <span className="font-medium">{formData.bankAccountNum}</span></p>
                                </div>
                                <div className="text-center text-[10px]">
                                    <p className="mb-8">Hormat Kami</p>
                                    <p className="font-bold">{companySettings.companyName}</p>
                                    <p className="font-semibold border-t border-slate-300 pt-1 mt-1">{formData.signatureName}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
