import { useState, useEffect } from 'react';
import { Plus, Trash2, Upload, Check, Percent, Hash, Save } from 'lucide-react';
import { Button } from '../components/ui';
import { settings as settingsApi } from '../lib/api';

const tabs = [
    { key: 'company', label: 'Company Profile' },
    { key: 'banking', label: 'Banking Details' },
    { key: 'tax', label: 'Tax & Rules' },
    { key: 'templates', label: 'Templates' },
];

export default function Settings() {
    const [activeTab, setActiveTab] = useState('company');
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [saveSuccess, setSaveSuccess] = useState(false);
    const [error, setError] = useState('');

    // Form state
    const [companyData, setCompanyData] = useState({
        companyName: '',
        legalName: '',
        taxId: '',
        email: '',
        phone: '',
        address: '',
        city: '',
        workshop: '',
        signatureName: '',
        signatureImage: '',
        logo: '',
        documentIntroText: '',
        defaultTerms: '',
    });

    // Handle logo upload
    const handleLogoUpload = (e) => {
        const file = e.target.files[0];
        if (file) {
            if (file.size > 2 * 1024 * 1024) {
                setError('Logo file size must be less than 2MB');
                return;
            }
            const reader = new FileReader();
            reader.onloadend = () => {
                setCompanyData({ ...companyData, logo: reader.result });
            };
            reader.readAsDataURL(file);
        }
    };

    // Handle signature image upload
    const handleSignatureUpload = (e) => {
        const file = e.target.files[0];
        if (file) {
            if (file.size > 1 * 1024 * 1024) {
                setError('Signature file size must be less than 1MB');
                return;
            }
            const reader = new FileReader();
            reader.onloadend = () => {
                setCompanyData({ ...companyData, signatureImage: reader.result });
            };
            reader.readAsDataURL(file);
        }
    };

    const [taxSettings, setTaxSettings] = useState({
        enabled: true,
        name: 'PPN',
        rate: 11,
    });

    const [quotationNumbering, setQuotationNumbering] = useState({
        prefix: 'QT/{YYYY}/{MM}/',
        nextNumber: 1,
        padding: 5,
    });

    const [invoiceNumbering, setInvoiceNumbering] = useState({
        prefix: 'INV/{YYYY}/{MM}/',
        nextNumber: 1,
        padding: 5,
    });

    const [sphNumbering, setSphNumbering] = useState({
        prefix: 'SPH/{YYYY}/',
        nextNumber: 1,
        padding: 4,
    });

    const [bankAccounts, setBankAccounts] = useState([]);
    const [newBankAccount, setNewBankAccount] = useState({ bankName: '', accountNumber: '', accountHolder: '' });
    const [showAddBank, setShowAddBank] = useState(false);

    // Fetch settings on mount
    useEffect(() => {
        const fetchSettings = async () => {
            setLoading(true);
            try {
                const data = await settingsApi.get();
                if (data) {
                    setCompanyData({
                        companyName: data.companyName || '',
                        legalName: data.legalName || '',
                        taxId: data.taxId || '',
                        email: data.email || '',
                        phone: data.phone || '',
                        address: data.address || '',
                        city: data.city || '',
                        workshop: data.workshop || '',
                        signatureName: data.signatureName || '',
                        signatureImage: data.signatureImage || '',
                        logo: data.logo || '',
                        documentIntroText: data.documentIntroText || '',
                        defaultTerms: data.defaultTerms || '',
                    });
                    setTaxSettings({
                        enabled: data.taxEnabled ?? true,
                        name: data.taxName || 'PPN',
                        rate: data.taxRate || 11,
                    });
                    setQuotationNumbering({
                        prefix: data.quotationPrefix || 'QT/{YYYY}/{MM}/',
                        nextNumber: data.quotationNextNum || 1,
                        padding: data.quotationPadding || 5,
                    });
                    setInvoiceNumbering({
                        prefix: data.invoicePrefix || 'INV/{YYYY}/{MM}/',
                        nextNumber: data.invoiceNextNum || 1,
                        padding: data.invoicePadding || 5,
                    });
                    setSphNumbering({
                        prefix: data.sphPrefix || 'SPH/{YYYY}/',
                        nextNumber: data.sphNextNum || 1,
                        padding: data.sphPadding || 4,
                    });
                    setBankAccounts(data.bankAccounts || []);
                }
            } catch (err) {
                console.error('Failed to fetch settings:', err);
            } finally {
                setLoading(false);
            }
        };
        fetchSettings();
    }, []);

    // Save settings
    const handleSave = async () => {
        setSaving(true);
        setError('');
        setSaveSuccess(false);

        try {
            await settingsApi.update({
                companyName: companyData.companyName,
                legalName: companyData.legalName,
                taxId: companyData.taxId,
                email: companyData.email,
                phone: companyData.phone,
                address: companyData.address,
                city: companyData.city,
                workshop: companyData.workshop,
                logo: companyData.logo,
                signatureName: companyData.signatureName,
                signatureImage: companyData.signatureImage,
                documentIntroText: companyData.documentIntroText,
                defaultTerms: companyData.defaultTerms,
                taxEnabled: taxSettings.enabled,
                taxName: taxSettings.name,
                taxRate: taxSettings.rate,
                quotationPrefix: quotationNumbering.prefix,
                quotationNextNum: quotationNumbering.nextNumber,
                quotationPadding: quotationNumbering.padding,
                invoicePrefix: invoiceNumbering.prefix,
                invoiceNextNum: invoiceNumbering.nextNumber,
                invoicePadding: invoiceNumbering.padding,
                sphPrefix: sphNumbering.prefix,
                sphNextNum: sphNumbering.nextNumber,
                sphPadding: sphNumbering.padding,
            });
            setSaveSuccess(true);
            setTimeout(() => setSaveSuccess(false), 3000);
        } catch (err) {
            setError(err.message || 'Failed to save settings');
        } finally {
            setSaving(false);
        }
    };

    // Add bank account
    const handleAddBankAccount = async () => {
        if (!newBankAccount.bankName || !newBankAccount.accountNumber) return;

        try {
            const created = await settingsApi.createBankAccount(newBankAccount);
            setBankAccounts(prev => [...prev, created]);
            setNewBankAccount({ bankName: '', accountNumber: '', accountHolder: '' });
            setShowAddBank(false);
        } catch (err) {
            setError(err.message || 'Failed to add bank account');
        }
    };

    // Delete bank account
    const handleDeleteBankAccount = async (id) => {
        if (!confirm('Are you sure you want to delete this bank account?')) return;

        try {
            await settingsApi.deleteBankAccount(id);
            setBankAccounts(prev => prev.filter(b => b.id !== id));
        } catch (err) {
            setError(err.message || 'Failed to delete bank account');
        }
    };

    // Generate preview for numbering
    const generatePreview = (config) => {
        const date = new Date();
        const formatted = config.prefix
            .replace('{YYYY}', date.getFullYear())
            .replace('{MM}', String(date.getMonth() + 1).padStart(2, '0'))
            .replace('{DD}', String(date.getDate()).padStart(2, '0'));
        return formatted + String(config.nextNumber).padStart(config.padding, '0');
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center py-20">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-8 pb-10">
            {/* Page Heading */}
            <div className="flex flex-col gap-2">
                <h1 className="text-3xl font-black tracking-tight text-text-main dark:text-white">Settings</h1>
                <p className="text-text-secondary text-base">Manage your company profile, financial preferences, and templates.</p>
            </div>

            {/* Error/Success Messages */}
            {error && (
                <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl text-red-600 dark:text-red-400 text-sm">
                    {error}
                </div>
            )}
            {saveSuccess && (
                <div className="p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl text-green-600 dark:text-green-400 text-sm flex items-center gap-2">
                    <Check size={18} />
                    Settings saved successfully!
                </div>
            )}

            {/* Tabs */}
            <div className="border-b border-border-light dark:border-border-dark">
                <div className="flex gap-8 overflow-x-auto">
                    {tabs.map((tab) => (
                        <button
                            key={tab.key}
                            onClick={() => setActiveTab(tab.key)}
                            className={`pb-3 border-b-2 text-sm whitespace-nowrap transition-colors ${activeTab === tab.key
                                ? 'border-primary text-primary font-bold'
                                : 'border-transparent text-text-secondary hover:text-text-main font-medium'
                                }`}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Company Profile Section */}
            {activeTab === 'company' && (
                <section className="flex flex-col gap-6">
                    <h2 className="text-lg font-bold text-text-main dark:text-white">Company Identity</h2>
                    <div className="bg-surface-light dark:bg-surface-dark rounded-xl border border-border-light dark:border-border-dark shadow-sm p-6 sm:p-8">
                        <div className="flex flex-col md:flex-row gap-8">
                            {/* Logo Upload */}
                            <div className="flex flex-col gap-4 items-center md:items-start min-w-[160px]">
                                <span className="text-sm font-medium text-text-main dark:text-gray-300">Company Logo</span>
                                <label className="group relative h-32 w-32 rounded-full bg-background-light dark:bg-gray-800 border-2 border-dashed border-border-light dark:border-border-dark flex items-center justify-center cursor-pointer hover:border-primary transition-colors overflow-hidden">
                                    <input
                                        type="file"
                                        accept="image/png,image/jpeg,image/jpg"
                                        onChange={handleLogoUpload}
                                        className="hidden"
                                    />
                                    {companyData.logo ? (
                                        <img src={companyData.logo} alt="Company Logo" className="w-full h-full object-cover" />
                                    ) : (
                                        <div className="absolute inset-0 flex flex-col items-center justify-center text-text-secondary group-hover:text-primary transition-colors">
                                            <Upload size={24} />
                                            <span className="text-xs font-medium mt-1">Upload</span>
                                        </div>
                                    )}
                                    {companyData.logo && (
                                        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <Upload size={24} className="text-white" />
                                            <span className="text-xs font-medium mt-1 text-white">Change</span>
                                        </div>
                                    )}
                                </label>
                                {companyData.logo && (
                                    <button
                                        onClick={() => setCompanyData({ ...companyData, logo: '' })}
                                        className="text-xs text-red-500 hover:text-red-700"
                                    >
                                        Remove Logo
                                    </button>
                                )}
                                <p className="text-xs text-text-secondary text-center md:text-left">Max file size 2MB.<br />PNG or JPG recommended.</p>
                            </div>

                            {/* Form Fields */}
                            <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-6 w-full">
                                <div className="col-span-1 md:col-span-2">
                                    <label className="block text-sm font-medium text-text-main dark:text-gray-300 mb-1.5">Legal Company Name</label>
                                    <input
                                        type="text"
                                        value={companyData.companyName}
                                        onChange={(e) => setCompanyData({ ...companyData, companyName: e.target.value })}
                                        className="w-full rounded-lg border border-border-light dark:border-border-dark bg-white dark:bg-gray-800 text-text-main dark:text-white shadow-sm focus:border-primary focus:ring-primary sm:text-sm py-2.5 px-3"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-text-main dark:text-gray-300 mb-1.5">Tax ID (NPWP)</label>
                                    <input
                                        type="text"
                                        value={companyData.taxId}
                                        onChange={(e) => setCompanyData({ ...companyData, taxId: e.target.value })}
                                        placeholder="00.000.000.0-000.000"
                                        className="w-full rounded-lg border border-border-light dark:border-border-dark bg-white dark:bg-gray-800 text-text-main dark:text-white shadow-sm focus:border-primary focus:ring-primary sm:text-sm py-2.5 px-3"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-text-main dark:text-gray-300 mb-1.5">Email Address</label>
                                    <input
                                        type="email"
                                        value={companyData.email}
                                        onChange={(e) => setCompanyData({ ...companyData, email: e.target.value })}
                                        className="w-full rounded-lg border border-border-light dark:border-border-dark bg-white dark:bg-gray-800 text-text-main dark:text-white shadow-sm focus:border-primary focus:ring-primary sm:text-sm py-2.5 px-3"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-text-main dark:text-gray-300 mb-1.5">Phone Number</label>
                                    <input
                                        type="text"
                                        value={companyData.phone}
                                        onChange={(e) => setCompanyData({ ...companyData, phone: e.target.value })}
                                        className="w-full rounded-lg border border-border-light dark:border-border-dark bg-white dark:bg-gray-800 text-text-main dark:text-white shadow-sm focus:border-primary focus:ring-primary sm:text-sm py-2.5 px-3"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-text-main dark:text-gray-300 mb-1.5">Signature Name</label>
                                    <input
                                        type="text"
                                        value={companyData.signatureName}
                                        onChange={(e) => setCompanyData({ ...companyData, signatureName: e.target.value })}
                                        placeholder="Name for document signatures"
                                        className="w-full rounded-lg border border-border-light dark:border-border-dark bg-white dark:bg-gray-800 text-text-main dark:text-white shadow-sm focus:border-primary focus:ring-primary sm:text-sm py-2.5 px-3"
                                    />
                                </div>
                                <div className="col-span-1 md:col-span-2">
                                    <label className="block text-sm font-medium text-text-main dark:text-gray-300 mb-1.5">Registered Address</label>
                                    <textarea
                                        value={companyData.address}
                                        onChange={(e) => setCompanyData({ ...companyData, address: e.target.value })}
                                        rows={2}
                                        className="w-full rounded-lg border border-border-light dark:border-border-dark bg-white dark:bg-gray-800 text-text-main dark:text-white shadow-sm focus:border-primary focus:ring-primary sm:text-sm py-2.5 px-3 resize-none"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-text-main dark:text-gray-300 mb-1.5">City</label>
                                    <input
                                        type="text"
                                        value={companyData.city}
                                        onChange={(e) => setCompanyData({ ...companyData, city: e.target.value })}
                                        placeholder="Serpong, Tangerang Selatan 15318"
                                        className="w-full rounded-lg border border-border-light dark:border-border-dark bg-white dark:bg-gray-800 text-text-main dark:text-white shadow-sm focus:border-primary focus:ring-primary sm:text-sm py-2.5 px-3"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-text-main dark:text-gray-300 mb-1.5">Workshop Address</label>
                                    <input
                                        type="text"
                                        value={companyData.workshop}
                                        onChange={(e) => setCompanyData({ ...companyData, workshop: e.target.value })}
                                        placeholder="Workshop/branch address"
                                        className="w-full rounded-lg border border-border-light dark:border-border-dark bg-white dark:bg-gray-800 text-text-main dark:text-white shadow-sm focus:border-primary focus:ring-primary sm:text-sm py-2.5 px-3"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Signature Image Section */}
                    <h2 className="text-lg font-bold text-text-main dark:text-white mt-4">Signature Settings</h2>
                    <div className="bg-surface-light dark:bg-surface-dark rounded-xl border border-border-light dark:border-border-dark shadow-sm p-6 sm:p-8">
                        <div className="flex flex-col md:flex-row gap-8">
                            <div className="flex flex-col gap-4 items-center md:items-start min-w-[160px]">
                                <span className="text-sm font-medium text-text-main dark:text-gray-300">Signature Image</span>
                                <label className="group relative h-24 w-48 bg-background-light dark:bg-gray-800 border-2 border-dashed border-border-light dark:border-border-dark flex items-center justify-center cursor-pointer hover:border-primary transition-colors overflow-hidden rounded-lg">
                                    <input
                                        type="file"
                                        accept="image/png,image/jpeg,image/jpg"
                                        onChange={handleSignatureUpload}
                                        className="hidden"
                                    />
                                    {companyData.signatureImage ? (
                                        <img src={companyData.signatureImage} alt="Signature" className="w-full h-full object-contain" />
                                    ) : (
                                        <div className="flex flex-col items-center justify-center text-text-secondary group-hover:text-primary transition-colors">
                                            <Upload size={20} />
                                            <span className="text-xs font-medium mt-1">Upload Signature</span>
                                        </div>
                                    )}
                                    {companyData.signatureImage && (
                                        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <Upload size={20} className="text-white" />
                                            <span className="text-xs font-medium mt-1 text-white">Change</span>
                                        </div>
                                    )}
                                </label>
                                {companyData.signatureImage && (
                                    <button
                                        onClick={() => setCompanyData({ ...companyData, signatureImage: '' })}
                                        className="text-xs text-red-500 hover:text-red-700"
                                    >
                                        Remove Signature
                                    </button>
                                )}
                                <p className="text-xs text-text-secondary">Max 1MB. Transparent PNG recommended.</p>
                            </div>
                        </div>
                    </div>
                </section>
            )}

            {/* Banking Details Section */}
            {activeTab === 'banking' && (
                <section className="flex flex-col gap-6">
                    <div className="flex items-center justify-between">
                        <h2 className="text-lg font-bold text-text-main dark:text-white">Banking Details</h2>
                        <button
                            onClick={() => setShowAddBank(true)}
                            className="text-primary text-sm font-bold flex items-center gap-1 hover:text-primary-dark transition-colors"
                        >
                            <Plus size={20} />
                            Add Account
                        </button>
                    </div>

                    {/* Add Bank Form */}
                    {showAddBank && (
                        <div className="bg-surface-light dark:bg-surface-dark rounded-xl border border-primary/30 shadow-sm p-6">
                            <h3 className="text-base font-bold text-text-main dark:text-white mb-4">Add New Bank Account</h3>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-text-main dark:text-gray-300 mb-1.5">Bank Name</label>
                                    <input
                                        type="text"
                                        value={newBankAccount.bankName}
                                        onChange={(e) => setNewBankAccount({ ...newBankAccount, bankName: e.target.value })}
                                        placeholder="BCA"
                                        className="w-full rounded-lg border border-border-light dark:border-border-dark bg-white dark:bg-gray-800 text-text-main dark:text-white shadow-sm focus:border-primary focus:ring-primary sm:text-sm py-2.5 px-3"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-text-main dark:text-gray-300 mb-1.5">Account Number</label>
                                    <input
                                        type="text"
                                        value={newBankAccount.accountNumber}
                                        onChange={(e) => setNewBankAccount({ ...newBankAccount, accountNumber: e.target.value })}
                                        placeholder="1234567890"
                                        className="w-full rounded-lg border border-border-light dark:border-border-dark bg-white dark:bg-gray-800 text-text-main dark:text-white shadow-sm focus:border-primary focus:ring-primary sm:text-sm py-2.5 px-3"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-text-main dark:text-gray-300 mb-1.5">Account Holder</label>
                                    <input
                                        type="text"
                                        value={newBankAccount.accountHolder}
                                        onChange={(e) => setNewBankAccount({ ...newBankAccount, accountHolder: e.target.value })}
                                        placeholder="PT Example"
                                        className="w-full rounded-lg border border-border-light dark:border-border-dark bg-white dark:bg-gray-800 text-text-main dark:text-white shadow-sm focus:border-primary focus:ring-primary sm:text-sm py-2.5 px-3"
                                    />
                                </div>
                            </div>
                            <div className="flex gap-3 mt-4">
                                <button
                                    onClick={() => setShowAddBank(false)}
                                    className="px-4 py-2 border border-border-light dark:border-border-dark rounded-lg text-sm font-medium text-text-main dark:text-gray-300 hover:bg-background-light dark:hover:bg-gray-800 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleAddBankAccount}
                                    className="px-4 py-2 bg-primary hover:bg-primary-dark text-white font-semibold rounded-lg transition-all"
                                >
                                    Add Account
                                </button>
                            </div>
                        </div>
                    )}

                    <div className="bg-surface-light dark:bg-surface-dark rounded-xl border border-border-light dark:border-border-dark shadow-sm overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead className="bg-background-light/50 dark:bg-gray-800/50 border-b border-border-light dark:border-border-dark">
                                    <tr>
                                        <th className="py-4 px-6 text-xs font-semibold uppercase tracking-wider text-text-secondary">Bank Name</th>
                                        <th className="py-4 px-6 text-xs font-semibold uppercase tracking-wider text-text-secondary">Account Number</th>
                                        <th className="py-4 px-6 text-xs font-semibold uppercase tracking-wider text-text-secondary">Holder Name</th>
                                        <th className="py-4 px-6 text-xs font-semibold uppercase tracking-wider text-text-secondary text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border-light dark:divide-border-dark">
                                    {bankAccounts.length === 0 ? (
                                        <tr>
                                            <td colSpan={4} className="py-8 px-6 text-center text-text-secondary">
                                                No bank accounts added yet. Click "Add Account" to create one.
                                            </td>
                                        </tr>
                                    ) : (
                                        bankAccounts.map((account) => (
                                            <tr key={account.id} className="group hover:bg-background-light dark:hover:bg-gray-800/50 transition-colors">
                                                <td className="py-4 px-6 text-sm font-medium text-text-main dark:text-white">{account.bankName}</td>
                                                <td className="py-4 px-6 text-sm text-text-secondary font-mono">{account.accountNumber}</td>
                                                <td className="py-4 px-6 text-sm text-text-secondary">{account.accountHolder}</td>
                                                <td className="py-4 px-6 text-right">
                                                    <button
                                                        onClick={() => handleDeleteBankAccount(account.id)}
                                                        className="text-text-secondary hover:text-red-500 transition-colors"
                                                    >
                                                        <Trash2 size={20} />
                                                    </button>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                        <div className="border-t border-border-light dark:border-border-dark p-4 bg-background-light/50 dark:bg-gray-800/30 flex justify-center">
                            <span className="text-xs text-text-secondary">Payment details will appear on invoices.</span>
                        </div>
                    </div>
                </section>
            )}

            {/* Tax & Rules Section */}
            {activeTab === 'tax' && (
                <section className="flex flex-col gap-6">
                    <h2 className="text-lg font-bold text-text-main dark:text-white">Financial Configuration</h2>

                    {/* Tax Settings Row */}
                    <div className="bg-surface-light dark:bg-surface-dark rounded-xl border border-border-light dark:border-border-dark shadow-sm p-6">
                        <div className="flex items-center justify-between mb-6">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg text-primary">
                                    <Percent size={24} />
                                </div>
                                <div>
                                    <h3 className="text-base font-bold text-text-main dark:text-white">Default Tax Rate</h3>
                                    <p className="text-sm text-text-secondary">Applied to new invoice items</p>
                                </div>
                            </div>
                            <label className="relative inline-flex items-center cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={taxSettings.enabled}
                                    onChange={(e) => setTaxSettings({ ...taxSettings, enabled: e.target.checked })}
                                    className="sr-only peer"
                                />
                                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/20 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                            </label>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-text-main dark:text-gray-300 mb-1.5">Tax Name & Percentage</label>
                            <div className="flex gap-2 max-w-md">
                                <input
                                    type="text"
                                    value={taxSettings.name}
                                    onChange={(e) => setTaxSettings({ ...taxSettings, name: e.target.value })}
                                    className="w-1/3 rounded-lg border border-border-light dark:border-border-dark bg-white dark:bg-gray-800 text-text-main dark:text-white shadow-sm focus:border-primary focus:ring-primary sm:text-sm py-2.5 px-3 text-center font-medium"
                                />
                                <div className="relative flex-1">
                                    <input
                                        type="number"
                                        value={taxSettings.rate}
                                        onChange={(e) => setTaxSettings({ ...taxSettings, rate: parseInt(e.target.value) || 0 })}
                                        className="w-full rounded-lg border border-border-light dark:border-border-dark bg-white dark:bg-gray-800 text-text-main dark:text-white shadow-sm focus:border-primary focus:ring-primary sm:text-sm py-2.5 px-3 pr-8"
                                    />
                                    <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                                        <span className="text-text-secondary sm:text-sm">%</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Document Numbering Section */}
                    <h2 className="text-lg font-bold text-text-main dark:text-white mt-4">Document Numbering</h2>
                    <p className="text-sm text-text-secondary -mt-4">Configure auto-increment format for each document type</p>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Invoice Numbering */}
                        <div className="bg-surface-light dark:bg-surface-dark rounded-xl border border-border-light dark:border-border-dark shadow-sm p-6">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="p-2 bg-green-50 dark:bg-green-900/20 rounded-lg text-green-600">
                                    <Hash size={24} />
                                </div>
                                <div>
                                    <h3 className="text-base font-bold text-text-main dark:text-white">Invoice</h3>
                                    <p className="text-xs text-text-secondary">Faktur/Tagihan</p>
                                </div>
                            </div>
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-xs font-medium text-text-main dark:text-gray-300 mb-1.5">Prefix Format</label>
                                    <input
                                        type="text"
                                        value={invoiceNumbering.prefix}
                                        onChange={(e) => setInvoiceNumbering({ ...invoiceNumbering, prefix: e.target.value })}
                                        className="w-full rounded-lg border border-border-light dark:border-border-dark bg-white dark:bg-gray-800 text-text-main dark:text-white shadow-sm focus:border-primary focus:ring-primary text-sm py-2 px-3 font-mono"
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-2">
                                    <div>
                                        <label className="block text-xs font-medium text-text-main dark:text-gray-300 mb-1.5">Next No.</label>
                                        <input
                                            type="number"
                                            value={invoiceNumbering.nextNumber}
                                            onChange={(e) => setInvoiceNumbering({ ...invoiceNumbering, nextNumber: parseInt(e.target.value) || 1 })}
                                            className="w-full rounded-lg border border-border-light dark:border-border-dark bg-white dark:bg-gray-800 text-text-main dark:text-white shadow-sm focus:border-primary focus:ring-primary text-sm py-2 px-3 font-mono"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium text-text-main dark:text-gray-300 mb-1.5">Padding</label>
                                        <select
                                            value={invoiceNumbering.padding}
                                            onChange={(e) => setInvoiceNumbering({ ...invoiceNumbering, padding: parseInt(e.target.value) })}
                                            className="w-full rounded-lg border border-border-light dark:border-border-dark bg-white dark:bg-gray-800 text-text-main dark:text-white shadow-sm focus:border-primary focus:ring-primary text-sm py-2 px-3"
                                        >
                                            <option value={3}>3 (001)</option>
                                            <option value={4}>4 (0001)</option>
                                            <option value={5}>5 (00001)</option>
                                        </select>
                                    </div>
                                </div>
                                <div className="p-2 bg-green-50 dark:bg-green-900/10 rounded-lg border border-green-200 dark:border-green-800">
                                    <span className="text-xs text-green-600 font-bold">PREVIEW: </span>
                                    <span className="text-sm font-mono text-green-700 dark:text-green-400">{generatePreview(invoiceNumbering)}</span>
                                </div>
                            </div>
                        </div>

                        {/* SPH Numbering */}
                        <div className="bg-surface-light dark:bg-surface-dark rounded-xl border border-border-light dark:border-border-dark shadow-sm p-6">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="p-2 bg-purple-50 dark:bg-purple-900/20 rounded-lg text-purple-600">
                                    <Hash size={24} />
                                </div>
                                <div>
                                    <h3 className="text-base font-bold text-text-main dark:text-white">SPH</h3>
                                    <p className="text-xs text-text-secondary">Surat Penawaran Harga</p>
                                </div>
                            </div>
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-xs font-medium text-text-main dark:text-gray-300 mb-1.5">Prefix Format</label>
                                    <input
                                        type="text"
                                        value={sphNumbering.prefix}
                                        onChange={(e) => setSphNumbering({ ...sphNumbering, prefix: e.target.value })}
                                        className="w-full rounded-lg border border-border-light dark:border-border-dark bg-white dark:bg-gray-800 text-text-main dark:text-white shadow-sm focus:border-primary focus:ring-primary text-sm py-2 px-3 font-mono"
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-2">
                                    <div>
                                        <label className="block text-xs font-medium text-text-main dark:text-gray-300 mb-1.5">Next No.</label>
                                        <input
                                            type="number"
                                            value={sphNumbering.nextNumber}
                                            onChange={(e) => setSphNumbering({ ...sphNumbering, nextNumber: parseInt(e.target.value) || 1 })}
                                            className="w-full rounded-lg border border-border-light dark:border-border-dark bg-white dark:bg-gray-800 text-text-main dark:text-white shadow-sm focus:border-primary focus:ring-primary text-sm py-2 px-3 font-mono"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium text-text-main dark:text-gray-300 mb-1.5">Padding</label>
                                        <select
                                            value={sphNumbering.padding}
                                            onChange={(e) => setSphNumbering({ ...sphNumbering, padding: parseInt(e.target.value) })}
                                            className="w-full rounded-lg border border-border-light dark:border-border-dark bg-white dark:bg-gray-800 text-text-main dark:text-white shadow-sm focus:border-primary focus:ring-primary text-sm py-2 px-3"
                                        >
                                            <option value={3}>3 (001)</option>
                                            <option value={4}>4 (0001)</option>
                                            <option value={5}>5 (00001)</option>
                                        </select>
                                    </div>
                                </div>
                                <div className="p-2 bg-purple-50 dark:bg-purple-900/10 rounded-lg border border-purple-200 dark:border-purple-800">
                                    <span className="text-xs text-purple-600 font-bold">PREVIEW: </span>
                                    <span className="text-sm font-mono text-purple-700 dark:text-purple-400">{generatePreview(sphNumbering)}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Format Help */}
                    <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-200 dark:border-slate-700">
                        <p className="text-sm font-medium text-text-main dark:text-white mb-2">Available Format Variables:</p>
                        <div className="flex flex-wrap gap-2">
                            <code className="px-2 py-1 bg-white dark:bg-gray-800 rounded text-xs font-mono text-primary border border-border-light dark:border-border-dark">{'{YYYY}'} = Year</code>
                            <code className="px-2 py-1 bg-white dark:bg-gray-800 rounded text-xs font-mono text-primary border border-border-light dark:border-border-dark">{'{MM}'} = Month</code>
                            <code className="px-2 py-1 bg-white dark:bg-gray-800 rounded text-xs font-mono text-primary border border-border-light dark:border-border-dark">{'{DD}'} = Day</code>
                        </div>
                    </div>
                </section>
            )}

            {/* Templates Section */}
            {activeTab === 'templates' && (
                <section className="flex flex-col gap-6">
                    <h2 className="text-lg font-bold text-text-main dark:text-white">PDF Templates</h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                        {/* Template 1 - Active */}
                        <div className="group relative cursor-pointer">
                            <div className="absolute -top-2 -right-2 z-10 bg-primary text-white rounded-full p-1 shadow-lg">
                                <Check size={18} />
                            </div>
                            <div className="aspect-[210/297] bg-background-light dark:bg-gray-800 rounded-xl border-2 border-primary overflow-hidden shadow-md">
                                <div className="h-full w-full flex items-center justify-center text-text-secondary">
                                    <span className="text-sm">Modern Blue Template</span>
                                </div>
                            </div>
                            <div className="mt-3 flex items-center justify-between">
                                <span className="text-sm font-bold text-text-main dark:text-white">Modern Blue</span>
                                <span className="text-xs font-medium text-primary bg-primary/10 px-2 py-0.5 rounded">Active</span>
                            </div>
                        </div>

                        {/* Template 2 */}
                        <div className="group relative cursor-pointer">
                            <div className="aspect-[210/297] bg-background-light dark:bg-gray-800 rounded-xl border border-border-light dark:border-border-dark overflow-hidden hover:border-primary hover:shadow-md transition-all">
                                <div className="h-full w-full flex items-center justify-center text-text-secondary">
                                    <span className="text-sm">Minimal Mono Template</span>
                                </div>
                            </div>
                            <div className="mt-3">
                                <span className="text-sm font-bold text-text-secondary group-hover:text-primary transition-colors">Minimal Mono</span>
                            </div>
                        </div>

                        {/* Template 3 */}
                        <div className="group relative cursor-pointer">
                            <div className="aspect-[210/297] bg-background-light dark:bg-gray-800 rounded-xl border border-border-light dark:border-border-dark overflow-hidden hover:border-primary hover:shadow-md transition-all">
                                <div className="h-full w-full flex items-center justify-center text-text-secondary">
                                    <span className="text-sm">Classic Corporate Template</span>
                                </div>
                            </div>
                            <div className="mt-3">
                                <span className="text-sm font-bold text-text-secondary group-hover:text-primary transition-colors">Classic Corporate</span>
                            </div>
                        </div>
                    </div>
                </section>
            )}

            {/* Save Button */}
            <div className="flex justify-end pt-4">
                <Button onClick={handleSave} disabled={saving} icon={saving ? undefined : Save}>
                    {saving ? (
                        <div className="flex items-center gap-2">
                            <div className="size-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            Saving...
                        </div>
                    ) : (
                        'Save Changes'
                    )}
                </Button>
            </div>
        </div>
    );
}
