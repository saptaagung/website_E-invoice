import { useState, useEffect } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { Search, Plus, ChevronDown, Calendar, Filter, Download, Eye, Edit, MoreVertical, Check, X } from 'lucide-react';
import { StatusBadge, Button } from '../components/ui';
import { invoices, quotations } from '../lib/api';

// Format currency helper
const formatIDR = (amount) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(amount);
};

// Format date helper
const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
};

// Get initials from name
const getInitials = (name) => {
    return name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || '??';
};

// Get color based on name hash
const getColor = (name) => {
    const colors = [
        'bg-blue-100 text-blue-600',
        'bg-green-100 text-green-600',
        'bg-orange-100 text-orange-600',
        'bg-purple-100 text-purple-600',
        'bg-pink-100 text-pink-600',
        'bg-cyan-100 text-cyan-600',
        'bg-indigo-100 text-indigo-600',
        'bg-teal-100 text-teal-600',
    ];
    const hash = name?.split('').reduce((a, b) => a + b.charCodeAt(0), 0) || 0;
    return colors[hash % colors.length];
};

// Status options for different document types
const quotationStatuses = ['draft', 'pending', 'sent', 'accepted', 'rejected'];
const invoiceStatuses = ['draft', 'pending', 'sent', 'paid', 'overdue', 'cancelled'];

const tabs = [
    { key: 'all', label: 'All Documents', count: null },
    { key: 'quotations', label: 'Quotations', count: null },
    { key: 'invoices', label: 'Invoices', count: null },
];

// Status Dropdown Component
function StatusDropdown({ currentStatus, statuses, onStatusChange, itemId }) {
    const [isOpen, setIsOpen] = useState(false);

    const handleStatusSelect = (newStatus) => {
        onStatusChange(itemId, newStatus);
        setIsOpen(false);
    };

    return (
        <div className="relative">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="focus:outline-none focus:ring-2 focus:ring-primary/50 rounded-full"
            >
                <StatusBadge status={currentStatus} />
            </button>

            {isOpen && (
                <>
                    <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
                    <div className="absolute left-0 mt-2 w-36 bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-border-light dark:border-border-dark z-50 py-1 overflow-hidden">
                        <p className="px-3 py-1.5 text-xs font-semibold text-text-secondary uppercase tracking-wider">Change Status</p>
                        {statuses.map((status) => (
                            <button
                                key={status}
                                onClick={() => handleStatusSelect(status)}
                                className={`w-full px-3 py-2 text-left text-sm flex items-center gap-2 hover:bg-background-light dark:hover:bg-gray-700 transition-colors ${status === currentStatus ? 'bg-primary/10 text-primary font-medium' : 'text-text-main dark:text-white'
                                    }`}
                            >
                                {status === currentStatus && <Check size={14} />}
                                <span className="capitalize">{status}</span>
                            </button>
                        ))}
                    </div>
                </>
            )}
        </div>
    );
}

export default function Documents() {
    const [searchParams, setSearchParams] = useSearchParams();
    const navigate = useNavigate();
    const activeTab = searchParams.get('tab') || 'quotations';
    const [searchQuery, setSearchQuery] = useState('');
    const [loading, setLoading] = useState(true);
    const [downloadingId, setDownloadingId] = useState(null);

    // State for documents
    const [quotationsData, setQuotationsData] = useState([]);
    const [invoicesData, setInvoicesData] = useState([]);

    // Fetch data from API
    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                const [quotationsRes, invoicesRes] = await Promise.all([
                    quotations.getAll({ search: searchQuery }),
                    invoices.getAll({ search: searchQuery })
                ]);

                // Transform data for display
                setQuotationsData(quotationsRes.map(q => ({
                    id: q.id,
                    displayId: q.quotationNumber,
                    client: q.client?.name || 'Unknown',
                    initials: getInitials(q.client?.name),
                    color: getColor(q.client?.name),
                    date: formatDate(q.issueDate),
                    amount: Number(q.total),
                    status: q.status,
                    type: 'quotation'
                })));

                setInvoicesData(invoicesRes.map(i => ({
                    id: i.id,
                    displayId: i.invoiceNumber,
                    client: i.client?.name || 'Unknown',
                    initials: getInitials(i.client?.name),
                    color: getColor(i.client?.name),
                    date: formatDate(i.issueDate),
                    amount: Number(i.total),
                    status: i.status,
                    type: 'invoice'
                })));
            } catch (error) {
                console.error('Failed to fetch documents:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [searchQuery]);

    // Status change handlers
    const handleQuotationStatusChange = async (id, newStatus) => {
        try {
            await quotations.update(id, { status: newStatus });
            setQuotationsData(prev =>
                prev.map(item => item.id === id ? { ...item, status: newStatus } : item)
            );
        } catch (error) {
            console.error('Failed to update status:', error);
        }
    };

    const handleInvoiceStatusChange = async (id, newStatus) => {
        try {
            await invoices.update(id, { status: newStatus });
            setInvoicesData(prev =>
                prev.map(item => item.id === id ? { ...item, status: newStatus } : item)
            );
        } catch (error) {
            console.error('Failed to update status:', error);
        }
    };

    // Action handlers
    const handleView = (item) => {
        const basePath = item.type === 'quotation' ? '/quotations' : '/invoices';
        navigate(`${basePath}/${item.id}`);
    };

    const handleEdit = (item) => {
        const basePath = item.type === 'quotation' ? '/quotations' : '/invoices';
        navigate(`${basePath}/${item.id}/edit`);
    };

    const handleDownload = async (item) => {
        setDownloadingId(item.id);
        try {
            if (item.type === 'quotation') {
                await quotations.downloadPDF(item.id, item.displayId);
            } else {
                await invoices.downloadPDF(item.id, item.displayId);
            }
        } catch (error) {
            console.error('Failed to download PDF:', error);
            alert('Failed to download PDF. Please try again.');
        } finally {
            setDownloadingId(null);
        }
    };

    const getActiveData = () => {
        switch (activeTab) {
            case 'quotations': return quotationsData;
            case 'invoices': return invoicesData;
            case 'all': return [...quotationsData, ...invoicesData];
            default: return quotationsData;
        }
    };

    const getNewButtonLabel = () => {
        switch (activeTab) {
            case 'invoices': return 'New Invoice';
            default: return 'New Quotation';
        }
    };

    const getNewButtonLink = () => {
        switch (activeTab) {
            case 'invoices': return '/invoices/select';
            default: return '/quotations/new';
        }
    };

    const getStatusOptions = (item) => {
        return item.type === 'quotation' ? quotationStatuses : invoiceStatuses;
    };

    const handleStatusChange = (item, newStatus) => {
        if (item.type === 'quotation') {
            handleQuotationStatusChange(item.id, newStatus);
        } else {
            handleInvoiceStatusChange(item.id, newStatus);
        }
    };

    const data = getActiveData();
    const filteredData = data.filter(item =>
        item.client.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.id.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="flex flex-col gap-6 pb-10">
            {/* Main Card */}
            <div className="bg-surface-light dark:bg-surface-dark rounded-xl shadow-sm border border-border-light dark:border-border-dark flex flex-col min-h-[600px]">
                {/* Card Header / Tabs */}
                <div className="border-b border-border-light dark:border-border-dark px-6 pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    {/* Tabs */}
                    <div className="flex gap-8 overflow-x-auto no-scrollbar">
                        {tabs.map((tab) => (
                            <button
                                key={tab.key}
                                onClick={() => setSearchParams({ tab: tab.key })}
                                className={`flex flex-col items-center justify-center border-b-[3px] pb-[13px] pt-4 px-1 transition-colors whitespace-nowrap ${activeTab === tab.key
                                    ? 'border-b-primary text-primary'
                                    : 'border-b-transparent text-text-secondary dark:text-gray-400 hover:text-text-main dark:hover:text-white'
                                    }`}
                            >
                                <p className="text-sm font-semibold">
                                    {tab.label} {tab.count !== null && `(${tab.count})`}
                                </p>
                            </button>
                        ))}
                    </div>

                    {/* Header Action */}
                    <div className="pb-3 pt-3 sm:pt-0">
                        <Link to={getNewButtonLink()}>
                            <Button icon={Plus}>{getNewButtonLabel()}</Button>
                        </Link>
                    </div>
                </div>

                {/* Filters Toolbar */}
                <div className="p-4 flex flex-col lg:flex-row gap-4 items-center justify-between bg-surface-light dark:bg-surface-dark">
                    {/* Search */}
                    <div className="relative w-full lg:w-96">
                        <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-secondary" />
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Search by client or ID..."
                            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-border-light dark:border-border-dark bg-background-light dark:bg-background-dark text-sm font-medium focus:border-primary focus:ring-1 focus:ring-primary placeholder:text-text-secondary"
                        />
                    </div>
                    {/* Quick Filters */}
                    <div className="flex gap-3 flex-wrap justify-center lg:justify-end">
                        <button className="flex items-center gap-2 px-3 py-2 bg-background-light dark:bg-background-dark text-sm font-medium rounded-xl border border-border-light dark:border-border-dark text-text-secondary hover:text-text-main dark:hover:text-white transition-colors">
                            <Calendar size={16} />
                            <span>Date</span>
                            <ChevronDown size={14} />
                        </button>
                        <button className="flex items-center gap-2 px-3 py-2 bg-background-light dark:bg-background-dark text-sm font-medium rounded-xl border border-border-light dark:border-border-dark text-text-secondary hover:text-text-main dark:hover:text-white transition-colors">
                            <Filter size={16} />
                            <span>Status</span>
                            <ChevronDown size={14} />
                        </button>
                    </div>
                </div>

                {/* Table */}
                <div className="flex-1 overflow-x-auto">
                    <table className="w-full min-w-[700px]">
                        <thead className="border-b border-border-light dark:border-border-dark bg-background-light/50 dark:bg-background-dark/30">
                            <tr>
                                <th className="py-3 px-6 text-xs font-semibold uppercase tracking-wider text-text-secondary text-left">ID</th>
                                <th className="py-3 px-6 text-xs font-semibold uppercase tracking-wider text-text-secondary text-left">Client</th>
                                <th className="py-3 px-6 text-xs font-semibold uppercase tracking-wider text-text-secondary text-left">Date Issued</th>
                                <th className="py-3 px-6 text-xs font-semibold uppercase tracking-wider text-text-secondary text-left">Amount</th>
                                <th className="py-3 px-6 text-xs font-semibold uppercase tracking-wider text-text-secondary text-left">Status</th>
                                <th className="py-3 px-6 text-xs font-semibold uppercase tracking-wider text-text-secondary text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border-light dark:divide-border-dark">
                            {filteredData.map((item) => (
                                <tr key={item.id} className="group hover:bg-background-light dark:hover:bg-background-dark/30 transition-colors">
                                    <td className="py-4 px-6">
                                        <button
                                            onClick={() => handleView(item)}
                                            className="text-primary font-semibold text-sm hover:underline"
                                        >
                                            #{item.displayId || item.id}
                                        </button>
                                    </td>
                                    <td className="py-4 px-6">
                                        <div className="flex items-center gap-3">
                                            <div className={`size-8 rounded-full ${item.color} flex items-center justify-center text-xs font-bold`}>
                                                {item.initials}
                                            </div>
                                            <span className="text-sm font-medium text-text-main dark:text-white">{item.client}</span>
                                        </div>
                                    </td>
                                    <td className="py-4 px-6">
                                        <span className="text-sm text-text-secondary dark:text-gray-400">{item.date}</span>
                                    </td>
                                    <td className="py-4 px-6">
                                        <span className="text-sm font-bold text-text-main dark:text-white">{formatIDR(item.amount)}</span>
                                    </td>
                                    <td className="py-4 px-6">
                                        <StatusDropdown
                                            currentStatus={item.status}
                                            statuses={getStatusOptions(item)}
                                            onStatusChange={(id, newStatus) => handleStatusChange(item, newStatus)}
                                            itemId={item.id}
                                        />
                                    </td>
                                    <td className="py-4 px-6 text-right">
                                        <div className="flex items-center justify-end gap-1">
                                            <button
                                                onClick={() => handleView(item)}
                                                className="p-2 text-text-secondary hover:text-primary hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                                                title="View"
                                            >
                                                <Eye size={18} />
                                            </button>
                                            <button
                                                onClick={() => handleEdit(item)}
                                                className="p-2 text-text-secondary hover:text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-lg transition-colors"
                                                title="Edit"
                                            >
                                                <Edit size={18} />
                                            </button>
                                            <button
                                                onClick={() => handleDownload(item)}
                                                disabled={downloadingId === item.id}
                                                className="p-2 text-text-secondary hover:text-purple-600 hover:bg-purple-50 dark:hover:bg-purple-900/20 rounded-lg transition-colors disabled:opacity-50"
                                                title="Download PDF"
                                            >
                                                {downloadingId === item.id ? (
                                                    <div className="size-[18px] border-2 border-purple-300 border-t-purple-600 rounded-full animate-spin" />
                                                ) : (
                                                    <Download size={18} />
                                                )}
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Empty State */}
                {filteredData.length === 0 && (
                    <div className="flex-1 flex flex-col items-center justify-center py-12">
                        <p className="text-text-secondary text-sm">No documents found matching your search.</p>
                    </div>
                )}

                {/* Pagination */}
                <div className="px-6 py-4 flex items-center justify-between border-t border-border-light dark:border-border-dark mt-auto">
                    <p className="text-sm text-text-secondary dark:text-gray-400">
                        Showing <span className="font-medium text-text-main dark:text-white">1</span> to{' '}
                        <span className="font-medium text-text-main dark:text-white">{filteredData.length}</span> of{' '}
                        <span className="font-medium text-text-main dark:text-white">{data.length}</span> documents
                    </p>
                    <div className="flex gap-2">
                        <button
                            disabled
                            className="px-3 py-1.5 rounded-lg border border-border-light dark:border-border-dark text-sm font-medium text-text-secondary hover:bg-background-light dark:hover:bg-background-dark/30 hover:text-text-main dark:hover:text-white transition-colors disabled:opacity-50"
                        >
                            Previous
                        </button>
                        <button className="px-3 py-1.5 rounded-lg border border-border-light dark:border-border-dark text-sm font-medium text-text-secondary hover:bg-background-light dark:hover:bg-background-dark/30 hover:text-text-main dark:hover:text-white transition-colors">
                            Next
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
