import { useState, useEffect } from 'react';
import { Link, useParams, useLocation, useSearchParams, useNavigate } from 'react-router-dom';
import { Save, Send, Download, Plus, Trash2, X, Check, ChevronDown, ChevronRight } from 'lucide-react';
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

// Default company settings
const defaultCompanySettings = {
    companyName: 'PT SETIA HABA TEKNOLOGI',
    legalName: 'PT Setia Haba Teknologi',
    address: 'Jl. Melati III BSD Blok C8/21 Sektor 1.6, Rawabuntu',
    city: 'Serpong, Tangerang Selatan 15318',
    workshop: 'Jl Angsana 21, Rawabuntu, Serpong, Tangerang Selatan',
    email: 'ptsetiahabateknologi@gmail.com',
    phone: '021-70044184',
    quotationPrefix: 'SPG/',
    quotationNextNum: 31,
    invoicePrefix: 'INV/',
    invoiceNextNum: 1,
    defaultTaxRate: 11,
    bankName: 'Bank rakyat Indonesia',
    bankAccountNum: '0034 0100 1925 301',
    bankAccountName: 'PT SETIA HABA TEKNOLOGI',
    signatureName: 'Haikal Ahmed Al-Muzani',
    defaultTerms: `1. Harga termasuk biaya antar Jakarta & termasuk PPN 11%
2. Barang akan langsung dikirim, saat pembayaran sudah di konfirmasi
3. Masa berlaku penawaran 1 (satu) bulan terhitung sejak tanggal penawaran dibuat
4. Cara pembayaran : Transfer atau Cek ke no rekening tertera
5. Garansi 1 (satu) tahun`,
};

export default function InvoiceForm() {
    const { id } = useParams();
    const location = useLocation();
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const isNew = location.pathname.includes('/new');

    // Determine document type from URL
    const getDocType = () => {
        if (location.pathname.includes('/quotations')) return 'Quotation';
        if (location.pathname.includes('/sph')) return 'SPH';
        return 'Invoice';
    };
    const docType = getDocType();

    // State for API data
    const [companySettings, setCompanySettings] = useState(defaultCompanySettings);
    const [clientsList, setClientsList] = useState([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');
    const [savedJustNow, setSavedJustNow] = useState(false);

    // Generate auto number based on settings
    const generateDocNumber = (settings) => {
        const year = new Date().getFullYear();
        const prefix = docType === 'Quotation' ? (settings.quotationPrefix || 'SPG/') : (settings.invoicePrefix || 'INV/');
        const nextNum = docType === 'Quotation' ? (settings.quotationNextNum || 1) : (settings.invoiceNextNum || 1);
        return `${String(nextNum).padStart(4, '0')}/${prefix}${year}`;
    };

    const [formData, setFormData] = useState({
        number: '',
        date: new Date().toISOString().split('T')[0],
        poNumber: '0071',
        clientId: '',
        selectedClient: null,
        applyTax: true,
        taxRate: 11,
        bankName: '',
        bankAccountNum: '',
        bankAccountName: '',
        signatureName: '',
        terms: '',
        terbilangText: '',
    });

    // Grouped items structure
    const [itemGroups, setItemGroups] = useState([
        {
            id: 1,
            name: 'PERALATAN UTAMA',
            expanded: true,
            items: [
                { id: 101, model: 'MGP24X', description: 'Digital Mixer 24CH', qty: 1, unit: 'unit', rate: 36000000 }
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
                        workshop: settingsData.workshop || defaultCompanySettings.workshop,
                        bankName: settingsData.bankAccounts?.[0]?.bankName || defaultCompanySettings.bankName,
                        bankAccountNum: settingsData.bankAccounts?.[0]?.accountNum || defaultCompanySettings.bankAccountNum,
                        bankAccountName: settingsData.bankAccounts?.[0]?.holderName || defaultCompanySettings.bankAccountName,
                        signatureName: settingsData.signatureName || defaultCompanySettings.signatureName,
                        quotationPrefix: settingsData.quotationPrefix || defaultCompanySettings.quotationPrefix,
                        quotationNextNum: settingsData.quotationNextNum || defaultCompanySettings.quotationNextNum,
                        invoicePrefix: settingsData.invoicePrefix || defaultCompanySettings.invoicePrefix,
                        invoiceNextNum: settingsData.invoiceNextNum || defaultCompanySettings.invoiceNextNum,
                        defaultTaxRate: settingsData.defaultTaxRate || defaultCompanySettings.defaultTaxRate,
                        defaultTerms: settingsData.defaultTerms || defaultCompanySettings.defaultTerms,
                    };
                    setCompanySettings(mappedSettings);

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

    // Calculate totals
    const subtotal = itemGroups.reduce((sum, group) =>
        sum + group.items.reduce((gSum, item) => gSum + (item.qty * item.rate), 0)
        , 0);
    const taxAmount = formData.applyTax ? subtotal * (formData.taxRate / 100) : 0;
    const total = subtotal + taxAmount;

    // Update terbilang when total changes
    useEffect(() => {
        setFormData(prev => ({
            ...prev,
            terbilangText: terbilang(total)
        }));
    }, [total]);

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

    // Group management
    const addGroup = () => {
        const newId = Date.now();
        setItemGroups([...itemGroups, {
            id: newId,
            name: '',
            expanded: true,
            items: [{ id: newId + 1, model: '', description: '', qty: 1, unit: 'unit', rate: 0 }]
        }]);
    };

    const removeGroup = (groupId) => {
        if (itemGroups.length > 1) {
            setItemGroups(itemGroups.filter(g => g.id !== groupId));
        }
    };

    const updateGroupName = (groupId, name) => {
        setItemGroups(itemGroups.map(g =>
            g.id === groupId ? { ...g, name } : g
        ));
    };

    const toggleGroup = (groupId) => {
        setItemGroups(itemGroups.map(g =>
            g.id === groupId ? { ...g, expanded: !g.expanded } : g
        ));
    };

    // Item management
    const addItem = (groupId) => {
        const newId = Date.now();
        setItemGroups(itemGroups.map(g =>
            g.id === groupId
                ? { ...g, items: [...g.items, { id: newId, model: '', description: '', qty: 1, unit: 'unit', rate: 0 }] }
                : g
        ));
    };

    const removeItem = (groupId, itemId) => {
        setItemGroups(itemGroups.map(g =>
            g.id === groupId
                ? { ...g, items: g.items.filter(item => item.id !== itemId) }
                : g
        ));
    };

    const updateItem = (groupId, itemId, field, value) => {
        setItemGroups(itemGroups.map(g =>
            g.id === groupId
                ? {
                    ...g,
                    items: g.items.map(item =>
                        item.id === itemId ? { ...item, [field]: value } : item
                    )
                }
                : g
        ));
    };

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
            const flatItems = itemGroups.flatMap(group =>
                group.items.map(item => ({
                    groupName: group.name,
                    model: item.model,
                    description: item.description,
                    quantity: item.qty,
                    unit: item.unit,
                    unitPrice: item.rate,
                }))
            );

            const documentData = {
                clientId: formData.selectedClient.id,
                issueDate: formData.date,
                status: status,
                poNumber: formData.poNumber,
                notes: formData.terms,
                terms: formData.terms,
                taxRate: formData.applyTax ? formData.taxRate : 0,
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

            setSavedJustNow(true);
            setTimeout(() => setSavedJustNow(false), 3000);
        } catch (err) {
            console.error('Failed to save:', err);
            setError(err.message || 'Failed to save document');
        } finally {
            setSaving(false);
        }
    };

    const formatIDR = (amount) => {
        return new Intl.NumberFormat('id-ID', { style: 'decimal', minimumFractionDigits: 0 }).format(amount);
    };

    const formatDate = (dateStr) => {
        const date = new Date(dateStr);
        return date.toLocaleDateString('id-ID', { day: '2-digit', month: '2-digit', year: 'numeric' });
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
            {/* Header with breadcrumb and actions */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-2 text-sm">
                    <Link to="/documents" className="text-text-secondary hover:text-primary">{docType}s</Link>
                    <span className="text-text-secondary">/</span>
                    <span className="text-text-main dark:text-white font-medium">
                        New {docType}
                    </span>
                </div>
                <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                    {savedJustNow && (
                        <span className="text-green-500 text-sm flex items-center gap-1">
                            <Check size={14} /> Saved just now
                        </span>
                    )}
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
                        Send Email
                    </Button>
                    <Button
                        icon={Download}
                        onClick={() => handleSave('pending')}
                        disabled={saving}
                    >
                        Download PDF
                    </Button>
                </div>
            </div>

            {/* Error Banner */}
            {error && (
                <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl text-red-600 dark:text-red-400 text-sm flex items-center justify-between">
                    <span>{error}</span>
                    <button onClick={() => setError('')} className="text-red-400 hover:text-red-600">
                        <X size={16} />
                    </button>
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
                                    <label className="block text-xs font-medium text-text-secondary mb-2">DATE</label>
                                    <input
                                        type="date"
                                        value={formData.date}
                                        onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                                        className="w-full px-3 py-2.5 bg-background-light dark:bg-background-dark border border-border-light dark:border-border-dark rounded-lg text-sm text-text-main dark:text-white"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-text-secondary mb-2">NO SPH</label>
                                    <input
                                        type="text"
                                        value={formData.number}
                                        onChange={(e) => setFormData({ ...formData, number: e.target.value })}
                                        placeholder="0031/SPG/2025"
                                        className="w-full px-3 py-2.5 bg-background-light dark:bg-background-dark border border-border-light dark:border-border-dark rounded-lg text-sm text-text-main dark:text-white"
                                    />
                                </div>
                            </div>

                            {/* Customer Selection */}
                            <div>
                                <label className="block text-xs font-medium text-text-secondary mb-2">CUSTOMER</label>
                                {formData.selectedClient ? (
                                    <div className="flex items-center justify-between p-3 bg-background-light dark:bg-background-dark border border-border-light dark:border-border-dark rounded-lg">
                                        <span className="text-text-main dark:text-white text-sm">
                                            {formData.selectedClient.name} / UP: {formData.selectedClient.contactName || 'Contact'}
                                        </span>
                                        <button
                                            onClick={() => setFormData({ ...formData, clientId: '', selectedClient: null })}
                                            className="text-text-secondary hover:text-red-500"
                                        >
                                            <X size={16} />
                                        </button>
                                    </div>
                                ) : (
                                    <div className="relative flex gap-2">
                                        <div className="flex-1 relative">
                                            <input
                                                type="text"
                                                placeholder="Search clients..."
                                                value={clientSearch}
                                                onChange={(e) => {
                                                    setClientSearch(e.target.value);
                                                    setShowClientDropdown(true);
                                                }}
                                                onFocus={() => setShowClientDropdown(true)}
                                                onBlur={() => setTimeout(() => setShowClientDropdown(false), 200)}
                                                className="w-full px-3 py-2.5 bg-background-light dark:bg-background-dark border border-border-light dark:border-border-dark rounded-lg text-sm text-text-main dark:text-white"
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
                                                            <p className="text-xs text-text-secondary">UP: {client.contactName}</p>
                                                        </button>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                        <Link to="/clients" className="px-4 py-2.5 text-primary text-sm font-medium hover:bg-primary/5 rounded-lg border border-primary/20">
                                            + New
                                        </Link>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Items Card with Groups */}
                    <div className="bg-surface-light dark:bg-surface-dark rounded-xl border border-border-light dark:border-border-dark p-6">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-sm font-semibold text-text-main dark:text-white flex items-center gap-2">
                                <span className="text-primary">📦</span> Items
                            </h3>
                            <button
                                onClick={addGroup}
                                className="text-primary text-sm font-medium flex items-center gap-1 hover:bg-primary/5 px-3 py-1.5 rounded-lg"
                            >
                                <Plus size={14} /> Add Group
                            </button>
                        </div>

                        {/* Item Groups */}
                        <div className="space-y-4">
                            {itemGroups.map((group) => (
                                <div key={group.id} className="border border-border-light dark:border-border-dark rounded-lg overflow-hidden">
                                    {/* Group Header */}
                                    <div className="flex items-center gap-2 px-3 py-2 bg-background-light dark:bg-background-dark">
                                        <button onClick={() => toggleGroup(group.id)} className="text-text-secondary hover:text-primary">
                                            {group.expanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                                        </button>
                                        <input
                                            type="text"
                                            value={group.name}
                                            onChange={(e) => updateGroupName(group.id, e.target.value)}
                                            placeholder="Group Name (e.g. PERALATAN UTAMA)"
                                            className="flex-1 bg-transparent text-sm font-semibold text-text-main dark:text-white focus:outline-none"
                                        />
                                        {itemGroups.length > 1 && (
                                            <button onClick={() => removeGroup(group.id)} className="text-text-secondary hover:text-red-500">
                                                <Trash2 size={14} />
                                            </button>
                                        )}
                                    </div>

                                    {/* Group Items */}
                                    {group.expanded && (
                                        <div className="p-3">
                                            <table className="w-full text-sm">
                                                <thead>
                                                    <tr className="text-text-secondary text-xs">
                                                        <th className="text-left pb-2 font-medium w-24">MODEL</th>
                                                        <th className="text-left pb-2 font-medium">DESKRIPSI</th>
                                                        <th className="text-center pb-2 font-medium w-20">JML/SAT</th>
                                                        <th className="text-right pb-2 font-medium w-28">HARGA</th>
                                                        <th className="w-8"></th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {group.items.map((item) => (
                                                        <tr key={item.id}>
                                                            <td className="py-1.5 pr-2">
                                                                <input
                                                                    type="text"
                                                                    value={item.model}
                                                                    onChange={(e) => updateItem(group.id, item.id, 'model', e.target.value)}
                                                                    placeholder="MGP24X"
                                                                    className="w-full px-2 py-1.5 text-xs bg-white dark:bg-gray-800 border border-border-light dark:border-border-dark rounded text-text-main dark:text-white"
                                                                />
                                                            </td>
                                                            <td className="py-1.5 pr-2">
                                                                <input
                                                                    type="text"
                                                                    value={item.description}
                                                                    onChange={(e) => updateItem(group.id, item.id, 'description', e.target.value)}
                                                                    placeholder="Digital Mixer 24CH"
                                                                    className="w-full px-2 py-1.5 text-xs bg-white dark:bg-gray-800 border border-border-light dark:border-border-dark rounded text-text-main dark:text-white"
                                                                />
                                                            </td>
                                                            <td className="py-1.5 pr-2">
                                                                <div className="flex items-center gap-1">
                                                                    <input
                                                                        type="number"
                                                                        value={item.qty}
                                                                        onChange={(e) => updateItem(group.id, item.id, 'qty', parseInt(e.target.value) || 0)}
                                                                        className="w-10 px-1 py-1.5 text-xs bg-white dark:bg-gray-800 border border-border-light dark:border-border-dark rounded text-center text-text-main dark:text-white"
                                                                    />
                                                                    <select
                                                                        value={item.unit}
                                                                        onChange={(e) => updateItem(group.id, item.id, 'unit', e.target.value)}
                                                                        className="w-12 px-1 py-1.5 text-xs bg-white dark:bg-gray-800 border border-border-light dark:border-border-dark rounded text-text-main dark:text-white"
                                                                    >
                                                                        <option value="unit">unit</option>
                                                                        <option value="set">set</option>
                                                                        <option value="pcs">pcs</option>
                                                                        <option value="lot">lot</option>
                                                                    </select>
                                                                </div>
                                                            </td>
                                                            <td className="py-1.5 pr-2">
                                                                <input
                                                                    type="text"
                                                                    value={item.rate ? formatIDR(item.rate) : ''}
                                                                    onChange={(e) => {
                                                                        const val = e.target.value.replace(/[^\d]/g, '');
                                                                        updateItem(group.id, item.id, 'rate', parseInt(val) || 0);
                                                                    }}
                                                                    placeholder="36,000,000"
                                                                    className="w-full px-2 py-1.5 text-xs bg-white dark:bg-gray-800 border border-border-light dark:border-border-dark rounded text-right text-text-main dark:text-white"
                                                                />
                                                            </td>
                                                            <td className="py-1.5">
                                                                <button onClick={() => removeItem(group.id, item.id)} className="text-text-secondary hover:text-red-500">
                                                                    <Trash2 size={14} />
                                                                </button>
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                            <button
                                                onClick={() => addItem(group.id)}
                                                className="w-full mt-2 py-2 text-xs text-text-secondary hover:text-primary hover:bg-primary/5 rounded border border-dashed border-border-light dark:border-border-dark flex items-center justify-center gap-1"
                                            >
                                                <Plus size={12} /> Add New Item
                                            </button>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>

                        {/* Apply PPN Checkbox */}
                        <div className="mt-4 flex items-center gap-2">
                            <button
                                onClick={() => setFormData({ ...formData, applyTax: !formData.applyTax })}
                                className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${formData.applyTax ? 'bg-primary border-primary text-white' : 'border-border-light dark:border-border-dark'
                                    }`}
                            >
                                {formData.applyTax && <Check size={12} />}
                            </button>
                            <span className="text-sm text-text-main dark:text-white">Apply PPN {formData.taxRate}%</span>
                        </div>
                    </div>

                    {/* Terbilang Card */}
                    <div className="bg-surface-light dark:bg-surface-dark rounded-xl border border-border-light dark:border-border-dark p-6">
                        <label className="block text-xs font-medium text-text-secondary mb-2">Terbilang (In Words)</label>
                        <textarea
                            value={formData.terbilangText}
                            onChange={(e) => setFormData({ ...formData, terbilangText: e.target.value })}
                            rows={2}
                            className="w-full px-3 py-2.5 bg-background-light dark:bg-background-dark border border-border-light dark:border-border-dark rounded-lg text-sm text-text-main dark:text-white resize-none"
                        />
                    </div>

                    {/* Bank Details Card */}
                    <div className="bg-surface-light dark:bg-surface-dark rounded-xl border border-border-light dark:border-border-dark p-6">
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-medium text-text-secondary mb-2">Bank Name</label>
                                <input
                                    type="text"
                                    value={formData.bankName}
                                    onChange={(e) => setFormData({ ...formData, bankName: e.target.value })}
                                    className="w-full px-3 py-2.5 bg-background-light dark:bg-background-dark border border-border-light dark:border-border-dark rounded-lg text-sm text-text-main dark:text-white"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-text-secondary mb-2">Account Number (AC)</label>
                                <input
                                    type="text"
                                    value={formData.bankAccountNum}
                                    onChange={(e) => setFormData({ ...formData, bankAccountNum: e.target.value })}
                                    className="w-full px-3 py-2.5 bg-background-light dark:bg-background-dark border border-border-light dark:border-border-dark rounded-lg text-sm text-text-main dark:text-white"
                                />
                            </div>
                        </div>
                        <div className="mt-4">
                            <label className="block text-xs font-medium text-text-secondary mb-2">Account Name (AN)</label>
                            <input
                                type="text"
                                value={formData.bankAccountName}
                                onChange={(e) => setFormData({ ...formData, bankAccountName: e.target.value })}
                                className="w-full px-3 py-2.5 bg-background-light dark:bg-background-dark border border-border-light dark:border-border-dark rounded-lg text-sm text-text-main dark:text-white"
                            />
                        </div>
                    </div>
                </div>

                {/* Preview Section - Matching Original Design */}
                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <h3 className="text-sm font-semibold text-text-main dark:text-white flex items-center gap-2">
                            <span className="text-primary">👁️</span> Live Preview
                        </h3>
                        <span className="text-xs text-text-secondary bg-background-light dark:bg-background-dark px-2 py-1 rounded">
                            A4 Format
                        </span>
                    </div>

                    {/* Document Preview - Matching Export Format */}
                    <div className="bg-white rounded-lg shadow-lg overflow-hidden text-slate-700 border" style={{ fontSize: '9px' }}>
                        <div className="p-5">
                            {/* Header with Logo & Company Info */}
                            <div className="flex gap-4 items-start pb-3 border-b-2 border-blue-800">
                                <div className="flex-shrink-0">
                                    <div className="w-14 h-14 bg-gradient-to-br from-blue-600 to-orange-500 rounded flex items-center justify-center">
                                        <span className="text-white font-bold text-lg">SHT</span>
                                    </div>
                                </div>
                                <div className="flex-1">
                                    <h1 className="text-xl font-bold text-blue-800">{companySettings.companyName}</h1>
                                    <p className="text-[8px] text-slate-600">Office: {companySettings.address}</p>
                                    <p className="text-[8px] text-slate-600">{companySettings.city}</p>
                                    <p className="text-[8px] text-slate-600">Workshop: {companySettings.workshop}</p>
                                    <p className="text-[8px] text-slate-600">Email: {companySettings.email}</p>
                                    <p className="text-[8px] text-slate-600">Telp/Fax: {companySettings.phone}</p>
                                </div>
                                <div className="text-right text-[8px]">
                                    <table className="border border-slate-300">
                                        <tbody>
                                            <tr>
                                                <td className="border border-slate-300 px-2 py-1 font-medium bg-slate-50">DATE</td>
                                                <td className="border border-slate-300 px-2 py-1">{formatDate(formData.date)}</td>
                                            </tr>
                                            <tr>
                                                <td className="border border-slate-300 px-2 py-1 font-medium bg-slate-50">NO SPH</td>
                                                <td className="border border-slate-300 px-2 py-1">{formData.number}</td>
                                            </tr>
                                        </tbody>
                                    </table>
                                </div>
                            </div>

                            {/* Customer Bar */}
                            <div className="mt-3">
                                <table className="w-full border-collapse">
                                    <tbody>
                                        <tr>
                                            <td className="bg-blue-800 text-white px-3 py-1.5 font-bold w-24" style={{ fontSize: '10px' }}>CUSTOMER</td>
                                            <td className="bg-blue-100 px-3 py-1.5 text-blue-800 font-medium" style={{ fontSize: '10px' }}>
                                                {formData.selectedClient?.name || 'Select Customer'} / UP : {formData.selectedClient?.contactName || '-'}
                                            </td>
                                        </tr>
                                    </tbody>
                                </table>
                                <p className="text-[8px] text-slate-600 mt-2">
                                    Dengan ini kami sampaikan Rincian order PO : {formData.poNumber} Sebagai berikut :
                                </p>
                            </div>

                            {/* Items Table */}
                            <div className="mt-3">
                                <table className="w-full border-collapse text-[8px]">
                                    <thead>
                                        <tr className="bg-blue-800 text-white">
                                            <th className="border border-blue-800 px-2 py-1.5 text-left font-bold">MODEL</th>
                                            <th className="border border-blue-800 px-2 py-1.5 text-left font-bold">DESKRIPSI</th>
                                            <th className="border border-blue-800 px-2 py-1.5 text-center font-bold w-14">JML SAT</th>
                                            <th className="border border-blue-800 px-2 py-1.5 text-right font-bold w-20">HARGA</th>
                                            <th className="border border-blue-800 px-2 py-1.5 text-right font-bold w-24">TOTAL HARGA</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {itemGroups.map(group => (
                                            <>
                                                {group.name && (
                                                    <tr key={`group-${group.id}`}>
                                                        <td colSpan={5} className="border border-slate-300 px-2 py-1 font-bold text-slate-800 bg-slate-50">
                                                            {group.name}
                                                        </td>
                                                    </tr>
                                                )}
                                                {group.items.slice(0, 5).map(item => (
                                                    <tr key={item.id}>
                                                        <td className="border border-slate-300 px-2 py-1">{item.model}</td>
                                                        <td className="border border-slate-300 px-2 py-1">{item.description}</td>
                                                        <td className="border border-slate-300 px-2 py-1 text-center">{item.qty} {item.unit}</td>
                                                        <td className="border border-slate-300 px-2 py-1 text-right">Rp{formatIDR(item.rate)}</td>
                                                        <td className="border border-slate-300 px-2 py-1 text-right">{formatIDR(item.qty * item.rate)}</td>
                                                    </tr>
                                                ))}
                                                {group.items.length > 5 && (
                                                    <tr>
                                                        <td colSpan={5} className="border border-slate-300 px-2 py-1 text-center text-slate-400 italic">
                                                            +{group.items.length - 5} more items...
                                                        </td>
                                                    </tr>
                                                )}
                                            </>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            {/* Terms & Totals Side by Side */}
                            <div className="mt-3 grid grid-cols-2 gap-4">
                                <div className="text-[7px]">
                                    <p className="font-bold text-slate-800 mb-1">Syarat dan Ketentuan:</p>
                                    <div className="text-slate-600 whitespace-pre-line leading-relaxed">
                                        {formData.terms}
                                    </div>
                                </div>
                                <div>
                                    <table className="w-full text-[8px] border-collapse">
                                        <tbody>
                                            <tr>
                                                <td className="border border-slate-300 px-2 py-1 font-bold bg-slate-50">TOTAL</td>
                                                <td className="border border-slate-300 px-2 py-1 text-right">Rp</td>
                                                <td className="border border-slate-300 px-2 py-1 text-right font-medium">{formatIDR(subtotal)}</td>
                                            </tr>
                                            {formData.applyTax && (
                                                <tr>
                                                    <td className="border border-slate-300 px-2 py-1 font-bold bg-slate-50">PPN {formData.taxRate}%</td>
                                                    <td className="border border-slate-300 px-2 py-1 text-right">Rp</td>
                                                    <td className="border border-slate-300 px-2 py-1 text-right">{formatIDR(taxAmount)}</td>
                                                </tr>
                                            )}
                                            <tr className="bg-yellow-100">
                                                <td className="border border-slate-300 px-2 py-1.5 font-bold">Grand Total</td>
                                                <td className="border border-slate-300 px-2 py-1.5 text-right font-bold">Rp</td>
                                                <td className="border border-slate-300 px-2 py-1.5 text-right font-bold text-blue-800">{formatIDR(total)}</td>
                                            </tr>
                                        </tbody>
                                    </table>
                                </div>
                            </div>

                            {/* Terbilang Bar */}
                            <div className="mt-3">
                                <table className="w-full border-collapse">
                                    <tbody>
                                        <tr>
                                            <td className="bg-blue-800 text-white px-3 py-2 font-bold w-20" style={{ fontSize: '9px' }}>Terbilang :</td>
                                            <td className="bg-blue-100 px-3 py-2 italic text-blue-800" style={{ fontSize: '9px' }}>
                                                {formData.terbilangText}
                                            </td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>

                            {/* Bank & Signature */}
                            <div className="mt-4 flex justify-between items-end text-[8px]">
                                <div>
                                    <p className="font-medium text-slate-800">{formData.bankName}</p>
                                    <p>AN : <span className="font-semibold">{formData.bankAccountName}</span></p>
                                    <p>AC : <span>{formData.bankAccountNum}</span></p>
                                </div>
                                <div className="text-center">
                                    <p className="mb-1">Hormat Kami</p>
                                    <p className="font-bold text-slate-800">{companySettings.legalName}</p>
                                    <div className="my-2 mx-auto w-12 h-12 bg-gradient-to-br from-blue-600 to-orange-500 rounded flex items-center justify-center">
                                        <span className="text-white font-bold text-sm">SHT</span>
                                    </div>
                                    <p className="font-medium border-t border-slate-300 pt-1">{formData.signatureName}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
