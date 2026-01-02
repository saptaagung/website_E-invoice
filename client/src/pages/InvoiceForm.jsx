import { useState, useEffect } from 'react';
import { Link, useParams, useLocation, useSearchParams, useNavigate } from 'react-router-dom';
import { Save, Send, Download, Plus, Trash2, X, Check, ChevronDown, ChevronRight, Edit } from 'lucide-react';
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

// Default company settings (empty - will be populated from API)
const defaultCompanySettings = {
    companyName: '',
    legalName: '',
    address: '',
    city: '',
    workshop: '',
    email: '',
    phone: '',
    quotationPrefix: 'QT/{YYYY}/{MM}/',
    quotationNextNum: 1,
    invoicePrefix: 'INV/{YYYY}/{MM}/',
    invoiceNextNum: 1,
    defaultTaxRate: 11,
    signatureName: '',
    signatureImage: null,
    logo: '',
    documentIntroText: 'Dengan ini kami sampaikan Rincian order PO : {PO_NUMBER} Sebagai berikut :',
    defaultTerms: `1. Harga termasuk biaya antar Jakarta & termasuk PPN 11%
2. Barang akan langsung dikirim, saat pembayaran sudah di konfirmasi
3. Masa berlaku penawaran 1 (satu) bulan terhitung sejak tanggal penawaran dibuat
4. Cara pembayaran : Transfer atau Cek ke no rekening tertera
5. Garansi 1 (satu) tahun`,
    bankAccounts: [],
};

export default function InvoiceForm() {
    const { id } = useParams();
    const location = useLocation();
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const isNew = location.pathname.includes('/new');
    const isViewOnly = searchParams.get('view') === 'true';

    // Determine document type from URL
    const getDocType = () => {
        if (location.pathname.includes('/quotations')) return 'Quotation';
        if (location.pathname.includes('/sph')) return 'SPH';
        return 'Invoice';
    };
    const docType = getDocType();

    // State for API data
    const [companySettings, setCompanySettings] = useState(defaultCompanySettings);
    const [bankAccounts, setBankAccounts] = useState([]);
    const [clientsList, setClientsList] = useState([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');
    const [savedJustNow, setSavedJustNow] = useState(false);

    // Generate auto number based on settings
    const generateDocNumber = (settings) => {
        const now = new Date();
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, '0');

        let prefix, nextNum, padding;
        if (docType === 'Quotation') {
            // Use SPH format for Quotations
            prefix = settings.sphPrefix || 'SPH/{YYYY}/';
            nextNum = settings.sphNextNum || 1;
            padding = settings.sphPadding || 4;
        } else {
            prefix = settings.invoicePrefix || 'INV/{YYYY}/{MM}/';
            nextNum = settings.invoiceNextNum || 1;
            padding = settings.invoicePadding || 5;
        }

        // Replace placeholders with actual values
        const formattedPrefix = prefix
            .replace('{YYYY}', year)
            .replace('{MM}', month);

        // Format: PREFIX + PADDED_NUMBER (e.g., SPH/2026/0001)
        return `${formattedPrefix}${String(nextNum).padStart(padding, '0')}`;
    };

    const [formData, setFormData] = useState({
        number: '',
        status: 'draft', // NEW: Track status
        date: new Date().toISOString().split('T')[0],
        poNumber: '',
        sourceQuotationNumber: '', // For Invoice: stores the source quotation number when converting
        clientId: '',
        selectedClient: null,
        applyTax: true,
        taxRate: 11,
        discountPercent: 0,
        selectedBankId: '',
        introText: '',
        terms: '',
        signatureName: '',
        signatureImage: null,
    });

    // Track if invoice was created from quotation (to make NO SPH read-only)
    const [isFromQuotation, setIsFromQuotation] = useState(false);

    // ... (lines 118-165 unchanged roughly, targeting useEffect)

    // Grouped items structure - start empty
    const [itemGroups, setItemGroups] = useState([]);

    const [clientSearch, setClientSearch] = useState('');
    const [newContactName, setNewContactName] = useState('');
    const [showClientDropdown, setShowClientDropdown] = useState(false);
    const [creatingNewClient, setCreatingNewClient] = useState(false);

    // Fetch settings and clients on mount
    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                const [settingsData, clientsData] = await Promise.all([
                    settingsApi.get().catch(() => null),
                    clientsApi.getAll().catch(() => [])
                ]);

                // If editing existing document, fetch it
                if (!isNew && id) {
                    try {
                        let docData;
                        if (docType === 'Quotation') {
                            docData = await quotations.getOne(id);
                        } else {
                            docData = await invoices.getOne(id);
                        }

                        if (docData) {
                            // Parse Decimal fields (Prisma returns as strings)
                            const parsedTaxRate = parseFloat(docData.taxRate) || 11;
                            const parsedDiscountAmount = parseFloat(docData.discount) || 0;
                            const parsedSubtotal = parseFloat(docData.subtotal) || 0;

                            // Calculate discount percentage if not explicitly stored
                            // Since DB only stores amount, we must reverse calculate it
                            let calculatedDiscountPercent = 0;
                            // We check parsedSubtotal to avoid division by zero
                            if (parsedSubtotal > 0 && parsedDiscountAmount > 0) {
                                // Calculate percent (e.g. 4000 / 100000 * 100 = 4)
                                calculatedDiscountPercent = (parsedDiscountAmount / parsedSubtotal) * 100;
                                // Fix to reasonable decimal places if needed (e.g. 4.00 -> 4)
                                calculatedDiscountPercent = Math.round(calculatedDiscountPercent * 100) / 100;
                            }

                            // Set form data from existing document
                            setFormData(prev => ({
                                ...prev,
                                number: docData.quotationNumber || docData.invoiceNumber || '',
                                date: docData.issueDate ? new Date(docData.issueDate).toISOString().split('T')[0] : prev.date,
                                poNumber: docData.poNumber || docData.projectName || '',
                                clientId: docData.clientId || '',
                                selectedClient: docData.client || null,
                                applyTax: parsedTaxRate > 0,
                                taxRate: parsedTaxRate,
                                discountPercent: calculatedDiscountPercent,
                                introText: docData.notes || prev.introText,
                                terms: docData.terms || prev.terms,
                                signatureName: docData.signatureName || prev.signatureName,
                                signatureImage: settingsData?.signatureImage || null,
                            }));

                            // Try to match bank account string to an ID
                            const availableBanks = settingsData?.bankAccounts || [];
                            if (docData.bankAccount && availableBanks.length > 0) {
                                // docData.bankAccount is formats like "Bank Name - Account Number"
                                // We match by checking if the account number exists in the string
                                const matchedBank = availableBanks.find(b =>
                                    docData.bankAccount.includes(b.accountNum || b.accountNumber)
                                );
                                if (matchedBank) {
                                    setFormData(prev => ({ ...prev, selectedBankId: matchedBank.id }));
                                }
                            }

                            // Group items by groupName
                            if (docData.items && docData.items.length > 0) {
                                const groupsMap = {};
                                docData.items.forEach((item, idx) => {
                                    const groupName = item.groupName || 'ITEMS';
                                    if (!groupsMap[groupName]) {
                                        groupsMap[groupName] = {
                                            id: Object.keys(groupsMap).length + 1,
                                            name: groupName,
                                            expanded: true,
                                            items: []
                                        };
                                    }
                                    groupsMap[groupName].items.push({
                                        id: idx + 100,
                                        model: item.model || '',
                                        description: item.description || '',
                                        qty: item.quantity || 1,
                                        unit: item.unit || 'unit',
                                        rate: parseFloat(item.rate) || 0, // Parse Decimal string
                                    });
                                });
                                setItemGroups(Object.values(groupsMap));
                            }
                        }
                    } catch (err) {
                        console.error('Failed to fetch document:', err);
                    }
                }

                if (settingsData) {
                    // Map settings from API
                    const mappedSettings = {
                        companyName: settingsData.companyName || defaultCompanySettings.companyName,
                        legalName: settingsData.legalName || settingsData.companyName || defaultCompanySettings.legalName,
                        address: settingsData.address || defaultCompanySettings.address,
                        city: settingsData.city || defaultCompanySettings.city,
                        email: settingsData.email || defaultCompanySettings.email,
                        phone: settingsData.phone || defaultCompanySettings.phone,
                        workshop: settingsData.workshop || defaultCompanySettings.workshop,
                        logo: settingsData.logo,
                        quotationPrefix: settingsData.quotationPrefix || defaultCompanySettings.quotationPrefix,
                        quotationNextNum: settingsData.quotationNextNum || defaultCompanySettings.quotationNextNum,
                        invoicePrefix: settingsData.invoicePrefix || defaultCompanySettings.invoicePrefix,
                        invoiceNextNum: settingsData.invoiceNextNum || defaultCompanySettings.invoiceNextNum,
                        sphPrefix: settingsData.sphPrefix || 'SPH/{YYYY}/',
                        sphNextNum: settingsData.sphNextNum,
                        defaultTaxRate: settingsData.defaultTaxRate || defaultCompanySettings.defaultTaxRate,
                        defaultTerms: settingsData.defaultTerms || defaultCompanySettings.defaultTerms,
                        documentIntroText: settingsData.documentIntroText || defaultCompanySettings.documentIntroText,
                        signatureName: settingsData.signatureName || defaultCompanySettings.signatureName,
                        signatureImage: settingsData.signatureImage || null,
                    };
                    setCompanySettings(mappedSettings);

                    // Store bank accounts from settings
                    const banks = settingsData.bankAccounts || [];
                    setBankAccounts(banks);

                    // Find default bank
                    const defaultBank = banks.find(b => b.isDefault) || banks[0];

                    if (isNew) {
                        let defaultIntro = mappedSettings.documentIntroText;
                        // Use specific text for Invoice
                        if (docType === 'Invoice') {
                            defaultIntro = 'Dengan ini kami sampaikan rincian pesanan berdasarkan PO {PO_NUMBER} dengan nomor invoice {INVOICE_NUMBER}';
                        }

                        setFormData(prev => ({
                            ...prev,
                            number: generateDocNumber(mappedSettings),
                            taxRate: mappedSettings.defaultTaxRate,
                            terms: mappedSettings.defaultTerms,
                            introText: defaultIntro,
                            signatureName: mappedSettings.signatureName,
                            signatureImage: mappedSettings.signatureImage,
                            selectedBankId: defaultBank?.id || '',
                        }));

                        // Check if converting from quotation
                        const fromType = searchParams.get('from');
                        const refId = searchParams.get('ref');
                        if (fromType === 'quotation' && refId && docType === 'Invoice') {
                            try {
                                const sourceQuotation = await quotations.getOne(refId);
                                if (sourceQuotation) {
                                    // Prefill from quotation data
                                    const parsedTaxRate = parseFloat(sourceQuotation.taxRate) || 11;
                                    const parsedDiscountAmount = parseFloat(sourceQuotation.discount) || 0;
                                    const parsedSubtotal = parseFloat(sourceQuotation.subtotal) || 0;
                                    let calculatedDiscountPercent = 0;
                                    if (parsedSubtotal > 0 && parsedDiscountAmount > 0) {
                                        calculatedDiscountPercent = (parsedDiscountAmount / parsedSubtotal) * 100;
                                        calculatedDiscountPercent = Math.round(calculatedDiscountPercent * 100) / 100;
                                    }

                                    // Set flag that this invoice is from a quotation
                                    setIsFromQuotation(true);

                                    // Invoice-specific intro text with placeholders
                                    const invoiceIntroText = 'Dengan ini kami sampaikan rincian pesanan berdasarkan PO {PO_NUMBER} dengan nomor invoice {INVOICE_NUMBER}';

                                    setFormData(prev => ({
                                        ...prev,
                                        // Keep new invoice number, but copy other data
                                        poNumber: sourceQuotation.poNumber || sourceQuotation.projectName || '',
                                        sourceQuotationNumber: sourceQuotation.quotationNumber || '', // Store source quotation number
                                        clientId: sourceQuotation.clientId || '',
                                        selectedClient: sourceQuotation.client || null,
                                        applyTax: parsedTaxRate > 0,
                                        taxRate: parsedTaxRate,
                                        discountPercent: calculatedDiscountPercent,
                                        introText: invoiceIntroText, // Use invoice-specific intro
                                        terms: sourceQuotation.terms || prev.terms,
                                        signatureName: sourceQuotation.signatureName || prev.signatureName,
                                    }));

                                    // Copy items from quotation
                                    if (sourceQuotation.items && sourceQuotation.items.length > 0) {
                                        const groupsMap = {};
                                        sourceQuotation.items.forEach((item, idx) => {
                                            const groupName = item.groupName || 'ITEMS';
                                            if (!groupsMap[groupName]) {
                                                groupsMap[groupName] = {
                                                    id: Object.keys(groupsMap).length + 1,
                                                    name: groupName,
                                                    expanded: true,
                                                    items: []
                                                };
                                            }
                                            groupsMap[groupName].items.push({
                                                id: idx + 100,
                                                model: item.model || '',
                                                description: item.description || '',
                                                qty: item.quantity || 1,
                                                unit: item.unit || 'unit',
                                                rate: parseFloat(item.rate) || 0,
                                            });
                                        });
                                        setItemGroups(Object.values(groupsMap));
                                    }
                                }
                            } catch (err) {
                                console.error('Failed to fetch source quotation:', err);
                            }
                        }
                    }
                } else {
                    if (isNew) {
                        setFormData(prev => ({
                            ...prev,
                            number: generateDocNumber(defaultCompanySettings),
                            taxRate: defaultCompanySettings.defaultTaxRate,
                            terms: defaultCompanySettings.defaultTerms,
                            introText: defaultCompanySettings.documentIntroText,
                            signatureName: defaultCompanySettings.signatureName,
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
    const discountAmount = subtotal * (formData.discountPercent / 100);
    const afterDiscount = subtotal - discountAmount;
    const taxAmount = formData.applyTax ? afterDiscount * (formData.taxRate / 100) : 0;
    const total = afterDiscount + taxAmount;

    // Auto-calculate terbilang
    const terbilangText = terbilang(total);

    // Get selected bank details
    const selectedBank = bankAccounts.find(b => b.id === formData.selectedBankId);

    // Process intro text with PO number
    const processedIntroText = formData.introText?.replace('{PO_NUMBER}', formData.poNumber || '____') || '';

    // Filter clients based on search
    const filteredClients = clientsList.filter(c =>
        c.name?.toLowerCase().includes(clientSearch.toLowerCase()) ||
        c.contactName?.toLowerCase().includes(clientSearch.toLowerCase())
    );

    // Select client
    const selectClient = (client) => {
        setFormData({ ...formData, clientId: client.id, selectedClient: client });
        setClientSearch('');
        setNewContactName('');
        setShowClientDropdown(false);
        setCreatingNewClient(false);
    };

    // Start creating new client
    const startNewClient = () => {
        setCreatingNewClient(true);
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

    // Validate mandatory fields
    const validateFields = () => {
        const missing = [];
        if (!formData.selectedClient && !clientSearch.trim()) missing.push('Customer');
        if (!formData.date) missing.push('Date');
        if (itemGroups.length === 0) missing.push('Items');
        const hasValidItems = itemGroups.some(g => g.items.some(i => i.description && i.qty > 0 && i.rate > 0));
        if (!hasValidItems) missing.push('At least one valid item (with description, qty, and rate)');
        if (!formData.signatureName) missing.push('Signature Name');
        // For quotations, bank account is recommended but not strictly required per user request
        return missing;
    };

    // State for incomplete save confirmation popup
    const [showIncompletePopup, setShowIncompletePopup] = useState(false);
    const [incompleteMissingFields, setIncompleteMissingFields] = useState([]);

    // Save document handler - new simplified flow
    const handleSave = async (forceDraft = false) => {
        // Validate fields
        const missingFields = validateFields();

        // If fields are missing and not forcing draft, show popup
        if (missingFields.length > 0 && !forceDraft) {
            setIncompleteMissingFields(missingFields);
            setShowIncompletePopup(true);
            return;
        }

        // Determine target status based on completeness
        const targetStatus = missingFields.length === 0 ? 'sent' : 'draft';

        // Check if we have a client selected or need to create one
        let clientForDocument = formData.selectedClient;

        if (!clientForDocument && clientSearch.trim()) {
            // Create new client on the fly
            setSaving(true);
            setError('');
            try {
                const newClient = await clientsApi.create({
                    name: clientSearch.trim(),
                    contactName: newContactName.trim() || clientSearch.trim(),
                    email: '',
                    phone: '',
                    address: '',
                });
                clientForDocument = newClient;
                setFormData(prev => ({ ...prev, selectedClient: newClient, clientId: newClient.id }));
                setClientsList(prev => [...prev, newClient]);
                setClientSearch('');
                setNewContactName('');
                setCreatingNewClient(false);
            } catch (err) {
                setError('Failed to create new client: ' + (err.message || 'Unknown error'));
                setSaving(false);
                return;
            }
        }

        if (!clientForDocument && targetStatus === 'sent') {
            setError('Please select or enter a customer name');
            return;
        }

        setSaving(true);
        setError('');
        setShowIncompletePopup(false);

        try {
            // Flatten items for API
            const flatItems = itemGroups.flatMap(group =>
                group.items.map(item => ({
                    groupName: group.name,
                    model: item.model,
                    description: item.description,
                    quantity: item.qty,
                    unit: item.unit,
                    rate: item.rate,
                }))
            );

            const documentData = {
                clientId: clientForDocument?.id || null,
                issueDate: formData.date,
                status: targetStatus,
                poNumber: formData.poNumber,
                notes: formData.introText,
                terms: formData.terms,
                taxRate: formData.applyTax ? formData.taxRate : 0,
                discount: formData.discountPercent,
                // Bank account only for Quotations - include holder name (AN)
                ...(docType === 'Quotation' && selectedBank ? {
                    bankAccount: `${selectedBank.bankName}\n${selectedBank.accountNum || selectedBank.accountNumber}\nAN : ${selectedBank.holderName || selectedBank.accountHolder || ''}`
                } : {}),
                signatureName: formData.signatureName,
                items: flatItems,
            };

            let savedDoc;

            if (docType === 'Quotation') {
                if (isNew) {
                    savedDoc = await quotations.create(documentData);
                } else {
                    savedDoc = await quotations.update(id, documentData);
                }

                // Always download PDF on successful save (if status is sent)
                if (targetStatus === 'sent') {
                    try {
                        await quotations.downloadPDF(savedDoc.id, savedDoc.quotationNumber);
                    } catch (e) {
                        console.error('PDF download failed:', e);
                    }
                }

                navigate('/quotations');
            } else {
                if (isNew) {
                    savedDoc = await invoices.create(documentData);
                } else {
                    savedDoc = await invoices.update(id, documentData);
                }

                // Always download PDF on successful save (if status is sent)
                if (targetStatus === 'sent') {
                    try {
                        await invoices.downloadPDF(savedDoc.id, savedDoc.invoiceNumber);
                    } catch (e) {
                        console.error('PDF download failed:', e);
                    }
                }

                navigate('/invoices');
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
                    <Link to={docType === 'Quotation' ? '/quotations' : '/invoices'} className="text-text-secondary hover:text-primary">{docType === 'Quotation' ? 'Penawaran' : 'Faktur'}</Link>
                    <span className="text-text-secondary">/</span>
                    <span className="text-text-main dark:text-white font-medium">
                        {isViewOnly ? `Lihat ${docType === 'Quotation' ? 'Penawaran' : 'Faktur'}` : (isNew ? `Buat ${docType === 'Quotation' ? 'Penawaran' : 'Faktur'}` : `Ubah ${docType === 'Quotation' ? 'Penawaran' : 'Faktur'}`)}
                    </span>
                </div>
                <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                    {isViewOnly ? (
                        <>
                            <Button
                                variant="secondary"
                                icon={Edit}
                                onClick={() => navigate(`${docType === 'Quotation' ? '/quotations' : '/invoices'}/${id}`)}
                            >
                                Ubah
                            </Button>
                            <Button
                                icon={Download}
                                onClick={async () => {
                                    try {
                                        if (docType === 'Quotation') {
                                            await quotations.downloadPDF(id, formData.number);
                                        } else {
                                            await invoices.downloadPDF(id, formData.number);
                                        }
                                    } catch (e) {
                                        console.error('PDF download failed:', e);
                                    }
                                }}
                            >
                                Unduh PDF
                            </Button>
                        </>
                    ) : (
                        <>
                            {savedJustNow && (
                                <span className="text-green-500 text-sm flex items-center gap-1">
                                    <Check size={14} /> Disimpan baru saja
                                </span>
                            )}
                            <Button
                                icon={Save}
                                onClick={() => handleSave()}
                                disabled={saving}
                            >
                                {saving ? 'Menyimpan...' : 'Simpan'}
                            </Button>
                        </>
                    )}
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

            {/* Incomplete Fields Popup */}
            {showIncompletePopup && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-surface-light dark:bg-surface-dark rounded-xl border border-border-light dark:border-border-dark p-6 max-w-md w-full mx-4 shadow-xl">
                        <h3 className="text-lg font-semibold text-text-main dark:text-white mb-3 flex items-center gap-2">
                            ⚠️ Dokumen Tidak Lengkap
                        </h3>
                        <p className="text-sm text-text-secondary mb-4">
                            Field berikut belum diisi atau tidak lengkap:
                        </p>
                        <ul className="list-disc list-inside text-sm text-red-600 dark:text-red-400 mb-4 space-y-1">
                            {incompleteMissingFields.map((field, idx) => (
                                <li key={idx}>{field}</li>
                            ))}
                        </ul>
                        <p className="text-sm text-text-secondary mb-6">
                            Apakah Anda ingin menyimpan ini sebagai <strong>Draft</strong>? Anda dapat melengkapinya nanti.
                        </p>
                        <div className="flex gap-3 justify-end">
                            <Button
                                variant="secondary"
                                onClick={() => setShowIncompletePopup(false)}
                            >
                                Batal
                            </Button>
                            <Button
                                onClick={() => handleSave(true)}
                            >
                                Simpan sebagai Draft
                            </Button>
                        </div>
                    </div>
                </div>
            )}

            {/* Main Form + Preview Grid */}
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                {/* Form Section */}
                <div className={`space-y-6 ${isViewOnly ? 'pointer-events-none opacity-90' : ''}`}>
                    {/* Document Details Card */}
                    <div className="bg-surface-light dark:bg-surface-dark rounded-xl border border-border-light dark:border-border-dark p-6">
                        <h3 className="text-sm font-semibold text-text-main dark:text-white flex items-center gap-2 mb-4">
                            <span className="text-primary">📄</span> Detail Dokumen
                        </h3>

                        <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-medium text-text-secondary mb-2">TANGGAL</label>
                                    <input
                                        type="date"
                                        value={formData.date}
                                        onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                                        className="w-full px-3 py-2.5 bg-background-light dark:bg-background-dark border border-border-light dark:border-border-dark rounded-lg text-sm text-text-main dark:text-white"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-text-secondary mb-2">
                                        {docType === 'Invoice' ? 'NO INVOICE' : 'NO SPH'}
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.number}
                                        onChange={(e) => setFormData({ ...formData, number: e.target.value })}
                                        placeholder="Auto-generated from settings"
                                        className="w-full px-3 py-2.5 bg-background-light dark:bg-background-dark border border-border-light dark:border-border-dark rounded-lg text-sm text-text-main dark:text-white"
                                    />
                                </div>
                                {/* Show source quotation number for Invoice from Quotation */}
                                {docType === 'Invoice' && isFromQuotation && formData.sourceQuotationNumber && (
                                    <div>
                                        <label className="block text-xs font-medium text-text-secondary mb-2">NO SPH (Sumber)</label>
                                        <input
                                            type="text"
                                            value={formData.sourceQuotationNumber}
                                            readOnly
                                            className="w-full px-3 py-2.5 bg-gray-100 dark:bg-gray-700 border border-border-light dark:border-border-dark rounded-lg text-sm text-text-main dark:text-white cursor-not-allowed"
                                        />
                                    </div>
                                )}
                            </div>

                            {/* Customer Selection */}
                            <div>
                                <label className="block text-xs font-medium text-text-secondary mb-2">PELANGGAN</label>
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
                                    <div className="space-y-2">
                                        <div className="relative">
                                            <input
                                                type="text"
                                                placeholder="Ketik nama pelanggan atau cari..."
                                                value={clientSearch}
                                                onChange={(e) => {
                                                    setClientSearch(e.target.value);
                                                    setShowClientDropdown(true);
                                                    setCreatingNewClient(false);
                                                }}
                                                onFocus={() => setShowClientDropdown(true)}
                                                onBlur={() => setTimeout(() => setShowClientDropdown(false), 200)}
                                                className="w-full px-3 py-2.5 bg-background-light dark:bg-background-dark border border-border-light dark:border-border-dark rounded-lg text-sm text-text-main dark:text-white"
                                            />
                                            {showClientDropdown && (
                                                <div className="absolute z-20 w-full mt-1 bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark rounded-lg shadow-xl max-h-48 overflow-y-auto">
                                                    {filteredClients.length > 0 ? (
                                                        <>
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
                                                            {clientSearch.trim() && !filteredClients.some(c => c.name.toLowerCase() === clientSearch.toLowerCase()) && (
                                                                <button
                                                                    onClick={startNewClient}
                                                                    className="w-full px-4 py-3 text-left hover:bg-green-50 dark:hover:bg-green-900/20 border-t border-border-light dark:border-border-dark bg-green-50/50 dark:bg-green-900/10"
                                                                >
                                                                    <p className="font-medium text-green-600 dark:text-green-400 text-sm flex items-center gap-1">
                                                                        <Plus size={14} /> Buat "{clientSearch}" sebagai pelanggan baru
                                                                    </p>
                                                                </button>
                                                            )}
                                                        </>
                                                    ) : clientSearch.trim() ? (
                                                        <button
                                                            onClick={startNewClient}
                                                            className="w-full px-4 py-3 text-left hover:bg-green-50 dark:hover:bg-green-900/20"
                                                        >
                                                            <p className="font-medium text-green-600 dark:text-green-400 text-sm flex items-center gap-1">
                                                                <Plus size={14} /> Buat "{clientSearch}" sebagai pelanggan baru
                                                            </p>
                                                            <p className="text-xs text-text-secondary">Klik untuk menambah info kontak</p>
                                                        </button>
                                                    ) : (
                                                        <div className="px-4 py-3 text-text-secondary text-sm">
                                                            Ketik nama pelanggan...
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                        {/* Contact name field for new customer */}
                                        {creatingNewClient && clientSearch.trim() && (
                                            <div className="p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                                                <p className="text-xs text-green-700 dark:text-green-400 mb-2">
                                                    Pelanggan baru: <strong>{clientSearch}</strong>
                                                </p>
                                                <input
                                                    type="text"
                                                    placeholder="Nama kontak (UP)"
                                                    value={newContactName}
                                                    onChange={(e) => setNewContactName(e.target.value)}
                                                    className="w-full px-3 py-2 bg-white dark:bg-gray-800 border border-border-light dark:border-border-dark rounded-lg text-sm text-text-main dark:text-white"
                                                />
                                                <p className="text-xs text-text-secondary mt-1">Akan dibuat saat Anda menyimpan dokumen</p>
                                            </div>
                                        )}
                                        {clientSearch.trim() && !creatingNewClient && !formData.selectedClient && (
                                            <p className="text-xs text-green-600 dark:text-green-400">
                                                💡 Ini akan membuat pelanggan baru saat Anda menyimpan
                                            </p>
                                        )}
                                    </div>
                                )}
                            </div>

                            {/* Intro Text (Editable) */}
                            <div>
                                <label className="block text-xs font-medium text-text-secondary mb-2">Teks Pengantar Dokumen</label>
                                <div className="flex gap-2">
                                    <input
                                        type="text"
                                        value={formData.poNumber}
                                        onChange={(e) => setFormData({ ...formData, poNumber: e.target.value })}
                                        placeholder="No PO"
                                        className="w-24 px-3 py-2.5 bg-background-light dark:bg-background-dark border border-border-light dark:border-border-dark rounded-lg text-sm text-text-main dark:text-white"
                                    />
                                    <input
                                        type="text"
                                        value={formData.introText}
                                        onChange={(e) => setFormData({ ...formData, introText: e.target.value })}
                                        placeholder="Dengan ini kami sampaikan..."
                                        className="flex-1 px-3 py-2.5 bg-background-light dark:bg-background-dark border border-border-light dark:border-border-dark rounded-lg text-sm text-text-main dark:text-white"
                                    />
                                </div>
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
                                <Plus size={14} /> Tambah Grup
                            </button>
                        </div>

                        {/* Item Groups */}
                        <div className="space-y-4">
                            {itemGroups.length === 0 && (
                                <div className="text-center py-8 text-text-secondary">
                                    <p className="text-sm">Belum ada item. Klik <strong>"+ Tambah Grup"</strong> untuk memulai.</p>
                                </div>
                            )}
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
                                            placeholder="Tambah Judul (e.g. PERALATAN UTAMA)"
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
                                            <div className="overflow-x-auto -mx-3 px-3">
                                                <table className="w-full text-sm min-w-[620px]">
                                                    <thead>
                                                        <tr className="text-text-secondary text-xs">
                                                            <th className="text-left pb-2 font-medium w-24">MODEL</th>
                                                            <th className="text-left pb-2 font-medium min-w-[120px]">DESKRIPSI</th>
                                                            <th className="text-center pb-2 font-medium w-36">JML/SAT</th>
                                                            <th className="text-right pb-2 font-medium w-32">HARGA</th>
                                                            <th className="w-10"></th>
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
                                                                            className="w-12 px-1 py-1.5 text-xs bg-white dark:bg-gray-800 border border-border-light dark:border-border-dark rounded text-center text-text-main dark:text-white"
                                                                        />
                                                                        <select
                                                                            value={item.unit}
                                                                            onChange={(e) => updateItem(group.id, item.id, 'unit', e.target.value)}
                                                                            className="w-20 px-1 py-1.5 text-xs bg-white dark:bg-gray-800 border border-border-light dark:border-border-dark rounded text-text-main dark:text-white"
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
                                            </div>
                                            <button
                                                onClick={() => addItem(group.id)}
                                                className="w-full mt-2 py-2 text-xs text-text-secondary hover:text-primary hover:bg-primary/5 rounded border border-dashed border-border-light dark:border-border-dark flex items-center justify-center gap-1"
                                            >
                                                <Plus size={12} /> Tambah Item Baru
                                            </button>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>

                        {/* Tax and Discount */}
                        <div className="mt-4 flex flex-wrap items-center gap-4">
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => setFormData({ ...formData, applyTax: !formData.applyTax })}
                                    className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${formData.applyTax ? 'bg-primary border-primary text-white' : 'border-border-light dark:border-border-dark'
                                        }`}
                                >
                                    {formData.applyTax && <Check size={12} />}
                                </button>
                                <span className="text-sm text-text-main dark:text-white">Terapkan PPN {formData.taxRate}%</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <label className="text-sm text-text-secondary">Diskon:</label>
                                <input
                                    type="number"
                                    value={formData.discountPercent}
                                    onChange={(e) => setFormData({ ...formData, discountPercent: parseFloat(e.target.value) || 0 })}
                                    className="w-16 px-2 py-1 text-sm bg-background-light dark:bg-background-dark border border-border-light dark:border-border-dark rounded text-center text-text-main dark:text-white"
                                    min="0"
                                    max="100"
                                />
                                <span className="text-sm text-text-secondary">%</span>
                            </div>
                        </div>
                    </div>

                    {/* Terbilang Card (Auto-calculated) */}
                    <div className="bg-surface-light dark:bg-surface-dark rounded-xl border border-border-light dark:border-border-dark p-6">
                        <label className="block text-xs font-medium text-text-secondary mb-2">Terbilang (Auto-calculated)</label>
                        <div className="px-3 py-2.5 bg-primary/5 border border-primary/20 rounded-lg text-sm text-text-main dark:text-white italic">
                            {terbilangText}
                        </div>
                    </div>

                    {/* Syarat dan Ketentuan Card */}
                    <div className="bg-surface-light dark:bg-surface-dark rounded-xl border border-border-light dark:border-border-dark p-6">
                        <label className="block text-xs font-medium text-text-secondary mb-2">Syarat dan Ketentuan</label>
                        <textarea
                            value={formData.terms}
                            onChange={(e) => setFormData({ ...formData, terms: e.target.value })}
                            rows={5}
                            placeholder="Masukkan syarat dan ketentuan..."
                            className="w-full px-3 py-2.5 bg-background-light dark:bg-background-dark border border-border-light dark:border-border-dark rounded-lg text-sm text-text-main dark:text-white resize-none"
                        />
                    </div>

                    {/* Bank Selection Card - Only for Quotations */}
                    {docType === 'Quotation' && (
                        <div className="bg-surface-light dark:bg-surface-dark rounded-xl border border-border-light dark:border-border-dark p-6">
                            <label className="block text-xs font-medium text-text-secondary mb-2">Rekening Bank</label>
                            {bankAccounts.length > 0 ? (
                                <select
                                    value={formData.selectedBankId}
                                    onChange={(e) => setFormData({ ...formData, selectedBankId: e.target.value })}
                                    className="w-full px-3 py-2.5 bg-background-light dark:bg-background-dark border border-border-light dark:border-border-dark rounded-lg text-sm text-text-main dark:text-white"
                                >
                                    <option value="">Pilih rekening bank</option>
                                    {bankAccounts.map(bank => (
                                        <option key={bank.id} value={bank.id}>
                                            {bank.bankName} - {bank.accountNum || bank.accountNumber} ({bank.holderName || bank.accountHolder})
                                        </option>
                                    ))}
                                </select>
                            ) : (
                                <div className="p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg text-sm text-yellow-700 dark:text-yellow-400">
                                    Belum ada rekening bank yang dikonfigurasi. <Link to="/settings" className="text-primary underline">Tambah di Pengaturan</Link>
                                </div>
                            )}
                            {selectedBank && (
                                <div className="mt-2 p-3 bg-background-light dark:bg-background-dark rounded-lg text-xs text-text-secondary">
                                    <p><strong>Bank:</strong> {selectedBank.bankName}</p>
                                    <p><strong>AN:</strong> {selectedBank.holderName || selectedBank.accountHolder}</p>
                                    <p><strong>AC:</strong> {selectedBank.accountNum || selectedBank.accountNumber}</p>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Signature Card */}
                    <div className="bg-surface-light dark:bg-surface-dark rounded-xl border border-border-light dark:border-border-dark p-6">
                        <label className="block text-xs font-medium text-text-secondary mb-2">Tanda Tangan</label>
                        <input
                            type="text"
                            value={formData.signatureName}
                            onChange={(e) => setFormData({ ...formData, signatureName: e.target.value })}
                            placeholder="Nama penanda tangan"
                            className="w-full px-3 py-2.5 bg-background-light dark:bg-background-dark border border-border-light dark:border-border-dark rounded-lg text-sm text-text-main dark:text-white"
                        />
                        {docType === 'Quotation' ? (
                            <p className="text-xs text-text-secondary mt-1">Gambar tanda tangan dapat dikonfigurasi di Pengaturan.</p>
                        ) : (
                            <p className="text-xs text-text-secondary mt-1">Faktur menggunakan tanda tangan basah. Ruang akan dikosongkan untuk tanda tangan.</p>
                        )}
                    </div>
                </div>

                {/* Preview Section - Matching Original Design */}
                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <h3 className="text-sm font-semibold text-text-main dark:text-white flex items-center gap-2">
                            <span className="text-primary">👁️</span> Pratinjau Langsung
                        </h3>
                        <span className="text-xs text-text-secondary bg-background-light dark:bg-background-dark px-2 py-1 rounded">
                            Format A4
                        </span>
                    </div>

                    {/* Document Preview - Matching Export Format */}
                    <div className="bg-white rounded-lg shadow-lg overflow-hidden text-slate-700 border" style={{ fontSize: '9px' }}>
                        <div className="p-5">
                            {/* Header with Logo & Company Info (Dynamic from Settings) */}
                            <div className="flex gap-4 items-start pb-3 border-b-2 border-blue-800">
                                <div className="flex-shrink-0">
                                    {companySettings.logo ? (
                                        <img src={companySettings.logo} alt="Logo" className="w-14 h-14 object-contain" />
                                    ) : (
                                        <div className="w-14 h-14 bg-gradient-to-br from-blue-600 to-orange-500 rounded flex items-center justify-center">
                                            <span className="text-white font-bold text-lg">SHT</span>
                                        </div>
                                    )}
                                </div>
                                <div className="flex-1">
                                    <h1 className="text-xl font-bold text-blue-800">{companySettings.companyName}</h1>
                                    <p className="text-[8px] text-slate-600">Alamat: {companySettings.address}</p>
                                    <p className="text-[8px] text-slate-600">{companySettings.city}</p>
                                    {companySettings.workshop && (
                                        <p className="text-[8px] text-slate-600">Workshop: {companySettings.workshop}</p>
                                    )}
                                    <p className="text-[8px] text-slate-600">Email: {companySettings.email}</p>
                                    <p className="text-[8px] text-slate-600">Telp/Fax: {companySettings.phone}</p>
                                </div>
                                <div className="text-right text-[8px]">
                                    <table className="border border-slate-300">
                                        <tbody>
                                            <tr>
                                                <td className="border border-slate-300 px-2 py-1 font-medium bg-slate-50">TANGGAL</td>
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
                                            <td className="bg-blue-800 text-white px-3 py-1.5 font-bold w-24" style={{ fontSize: '10px' }}>PELANGGAN</td>
                                            <td className="bg-blue-100 px-3 py-1.5 text-blue-800 font-medium" style={{ fontSize: '10px' }}>
                                                {formData.selectedClient?.name || (creatingNewClient && clientSearch ? clientSearch : 'Pilih Pelanggan')} / UP : {formData.selectedClient?.contactName || (creatingNewClient ? (newContactName || '-') : '-')}
                                            </td>
                                        </tr>
                                    </tbody>
                                </table>
                                <p className="text-[8px] text-slate-600 mt-2">
                                    {processedIntroText}
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
                                        <div className="text-slate-600 whitespace-pre-line leading-relaxed">
                                            {formData.terms}
                                        </div>
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
                                            {formData.discountPercent > 0 && (
                                                <tr className="text-red-600">
                                                    <td className="border border-slate-300 px-2 py-1 font-bold bg-slate-50">Diskon {formData.discountPercent}%</td>
                                                    <td className="border border-slate-300 px-2 py-1 text-right">Rp</td>
                                                    <td className="border border-slate-300 px-2 py-1 text-right">-{formatIDR(discountAmount)}</td>
                                                </tr>
                                            )}
                                            {formData.applyTax && (
                                                <tr>
                                                    <td className="border border-slate-300 px-2 py-1 font-bold bg-slate-50">PPN {formData.taxRate}%</td>
                                                    <td className="border border-slate-300 px-2 py-1 text-right">Rp</td>
                                                    <td className="border border-slate-300 px-2 py-1 text-right">{formatIDR(taxAmount)}</td>
                                                </tr>
                                            )}
                                            <tr className="bg-yellow-100">
                                                <td className="border border-slate-300 px-2 py-1.5 font-bold">Total Akhir</td>
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
                                                {terbilangText}
                                            </td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>

                            {/* Bank & Signature */}
                            <div className="mt-4 flex justify-between items-end text-[8px]">
                                <div>
                                    {/* Bank details only for Quotation */}
                                    {docType === 'Quotation' && selectedBank && (
                                        <>
                                            <p className="font-medium text-slate-800">{selectedBank.bankName}</p>
                                            <p>AN : <span className="font-semibold">{selectedBank.holderName || selectedBank.accountHolder}</span></p>
                                            <p>AC : <span>{selectedBank.accountNum || selectedBank.accountNumber}</span></p>
                                        </>
                                    )}
                                </div>
                                <div className="text-center">
                                    <p className="mb-1">Hormat Kami</p>
                                    <p className="font-bold text-slate-800">{companySettings.legalName}</p>
                                    {/* Signature image only for Quotation */}
                                    {docType === 'Quotation' ? (
                                        formData.signatureImage ? (
                                            <img src={formData.signatureImage} alt="Signature" className="my-2 mx-auto h-12 object-contain" />
                                        ) : (
                                            <div className="my-2 mx-auto w-12 h-12 bg-gradient-to-br from-blue-600 to-orange-500 rounded flex items-center justify-center">
                                                <span className="text-white font-bold text-sm">SHT</span>
                                            </div>
                                        )
                                    ) : (
                                        /* For Invoice: Leave space for wet signature */
                                        <div className="my-2 mx-auto w-20 h-10 border-b border-dashed border-slate-400"></div>
                                    )}
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
