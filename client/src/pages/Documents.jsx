import { useState, useEffect } from 'react';
import { Link, useSearchParams, useNavigate, useLocation } from 'react-router-dom';
import { Search, Plus, ChevronDown, Calendar, Filter, Download, Eye, Edit, MoreVertical, Check, X, Trash2 } from 'lucide-react';
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
const quotationStatuses = ['draft', 'sent', 'accepted', 'rejected', 'expired'];
const invoiceStatuses = ['draft', 'sent', 'paid', 'partial', 'overdue', 'cancelled'];

const tabs = [
    { key: 'all', label: 'Semua Dokumen', count: null },
    { key: 'quotations', label: 'Penawaran', count: null },
    { key: 'invoices', label: 'Faktur', count: null },
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
                        <p className="px-3 py-1.5 text-xs font-semibold text-text-secondary uppercase tracking-wider">Ubah Status</p>
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
    const location = useLocation();

    // Determine page context from URL
    const isQuotationsPage = location.pathname.startsWith('/quotations');
    const isInvoicesPage = location.pathname.startsWith('/invoices');
    const isDocumentsPage = location.pathname === '/documents';

    // Set active tab based on URL or search params
    const activeTab = isQuotationsPage ? 'quotations' :
        isInvoicesPage ? 'invoices' :
            (searchParams.get('tab') || 'quotations');

    const [searchQuery, setSearchQuery] = useState('');
    const [loading, setLoading] = useState(true);
    const [downloadingId, setDownloadingId] = useState(null);
    const [pageSize, setPageSize] = useState(20);
    const [currentPage, setCurrentPage] = useState(1);

    // Filter state
    const [dateFilter, setDateFilter] = useState('all'); // 'all', 'today', 'week', 'month', 'year'
    const [statusFilter, setStatusFilter] = useState('all');
    const [showDateDropdown, setShowDateDropdown] = useState(false);
    const [showStatusDropdown, setShowStatusDropdown] = useState(false);

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

    // Action handlers - View shows read-only preview
    const handleView = (item) => {
        const basePath = item.type === 'quotation' ? '/quotations' : '/invoices';
        navigate(`${basePath}/${item.id}?view=true`);
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

    const handleDelete = async (item) => {
        const confirmMessage = item.type === 'quotation'
            ? `Apakah Anda yakin ingin menghapus penawaran ${item.displayId}?`
            : `Apakah Anda yakin ingin menghapus faktur ${item.displayId}?`;

        if (!window.confirm(confirmMessage)) {
            return;
        }

        try {
            if (item.type === 'quotation') {
                await quotations.delete(item.id);
                setQuotationsData(prev => prev.filter(q => q.id !== item.id));
            } else {
                await invoices.delete(item.id);
                setInvoicesData(prev => prev.filter(i => i.id !== item.id));
            }
        } catch (error) {
            console.error('Failed to delete:', error);
            alert('Failed to delete. Please try again.');
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
            case 'invoices': return 'Faktur Baru';
            default: return 'Penawaran Baru';
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

    // Date filter helper
    const isWithinDateRange = (dateStr) => {
        if (dateFilter === 'all') return true;
        const now = new Date();
        const itemDate = new Date(dateStr);

        switch (dateFilter) {
            case 'today':
                return itemDate.toDateString() === now.toDateString();
            case 'week': {
                const weekAgo = new Date(now);
                weekAgo.setDate(now.getDate() - 7);
                return itemDate >= weekAgo;
            }
            case 'month': {
                const monthAgo = new Date(now);
                monthAgo.setMonth(now.getMonth() - 1);
                return itemDate >= monthAgo;
            }
            case 'year': {
                const yearAgo = new Date(now);
                yearAgo.setFullYear(now.getFullYear() - 1);
                return itemDate >= yearAgo;
            }
            default:
                return true;
        }
    };

    const filteredData = data.filter(item => {
        // Text search
        const matchesSearch = item.client.toLowerCase().includes(searchQuery.toLowerCase()) ||
            item.id.toLowerCase().includes(searchQuery.toLowerCase());

        // Status filter
        const matchesStatus = statusFilter === 'all' || item.status === statusFilter;

        // Date filter
        const matchesDate = isWithinDateRange(item.date);

        return matchesSearch && matchesStatus && matchesDate;
    });

    // Pagination logic
    const totalPages = Math.ceil(filteredData.length / pageSize);
    const startIndex = (currentPage - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    const paginatedData = filteredData.slice(startIndex, endIndex);

    return (
        <div className="flex flex-col gap-6 pb-10">
            {/* Main Card */}
            <div className="bg-surface-light dark:bg-surface-dark rounded-xl shadow-sm border border-border-light dark:border-border-dark flex flex-col min-h-[600px]">
                {/* Card Header / Tabs */}
                {/* Card Header - Title Only (Tabs Removed) */}
                <div className="border-b border-border-light dark:border-border-dark px-6 pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-center pt-4 pb-3">
                        <h1 className="text-lg font-bold text-text-main dark:text-white">
                            {isQuotationsPage ? 'Penawaran' : (isInvoicesPage ? 'Faktur' : 'Dokumen')}
                        </h1>
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
                            placeholder="Cari berdasarkan klien atau ID..."
                            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-border-light dark:border-border-dark bg-background-light dark:bg-background-dark text-sm font-medium focus:border-primary focus:ring-1 focus:ring-primary placeholder:text-text-secondary"
                        />
                    </div>
                    {/* Quick Filters */}
                    <div className="flex gap-3 flex-wrap justify-center lg:justify-end">
                        {/* Date Filter Dropdown */}
                        <div className="relative">
                            <button
                                onClick={() => { setShowDateDropdown(!showDateDropdown); setShowStatusDropdown(false); }}
                                className={`flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-xl border transition-colors ${dateFilter !== 'all'
                                        ? 'bg-primary/10 border-primary text-primary'
                                        : 'bg-background-light dark:bg-background-dark border-border-light dark:border-border-dark text-text-secondary hover:text-text-main dark:hover:text-white'
                                    }`}
                            >
                                <Calendar size={16} />
                                <span>
                                    {dateFilter === 'all' && 'Tanggal'}
                                    {dateFilter === 'today' && 'Hari Ini'}
                                    {dateFilter === 'week' && '7 Hari Terakhir'}
                                    {dateFilter === 'month' && '30 Hari Terakhir'}
                                    {dateFilter === 'year' && 'Tahun Ini'}
                                </span>
                                <ChevronDown size={14} />
                            </button>
                            {showDateDropdown && (
                                <>
                                    <div className="fixed inset-0 z-40" onClick={() => setShowDateDropdown(false)} />
                                    <div className="absolute right-0 mt-2 w-44 bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-border-light dark:border-border-dark z-50 py-1 overflow-hidden">
                                        <p className="px-3 py-1.5 text-xs font-semibold text-text-secondary uppercase tracking-wider">Filter Tanggal</p>
                                        {[
                                            { key: 'all', label: 'Semua Tanggal' },
                                            { key: 'today', label: 'Hari Ini' },
                                            { key: 'week', label: '7 Hari Terakhir' },
                                            { key: 'month', label: '30 Hari Terakhir' },
                                            { key: 'year', label: 'Tahun Ini' },
                                        ].map((option) => (
                                            <button
                                                key={option.key}
                                                onClick={() => { setDateFilter(option.key); setShowDateDropdown(false); setCurrentPage(1); }}
                                                className={`w-full px-3 py-2 text-left text-sm flex items-center gap-2 hover:bg-background-light dark:hover:bg-gray-700 transition-colors ${option.key === dateFilter ? 'bg-primary/10 text-primary font-medium' : 'text-text-main dark:text-white'
                                                    }`}
                                            >
                                                {option.key === dateFilter && <Check size={14} />}
                                                <span>{option.label}</span>
                                            </button>
                                        ))}
                                    </div>
                                </>
                            )}
                        </div>

                        {/* Status Filter Dropdown */}
                        <div className="relative">
                            <button
                                onClick={() => { setShowStatusDropdown(!showStatusDropdown); setShowDateDropdown(false); }}
                                className={`flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-xl border transition-colors ${statusFilter !== 'all'
                                        ? 'bg-primary/10 border-primary text-primary'
                                        : 'bg-background-light dark:bg-background-dark border-border-light dark:border-border-dark text-text-secondary hover:text-text-main dark:hover:text-white'
                                    }`}
                            >
                                <Filter size={16} />
                                <span className="capitalize">{statusFilter === 'all' ? 'Status' : statusFilter}</span>
                                <ChevronDown size={14} />
                            </button>
                            {showStatusDropdown && (
                                <>
                                    <div className="fixed inset-0 z-40" onClick={() => setShowStatusDropdown(false)} />
                                    <div className="absolute right-0 mt-2 w-40 bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-border-light dark:border-border-dark z-50 py-1 overflow-hidden">
                                        <p className="px-3 py-1.5 text-xs font-semibold text-text-secondary uppercase tracking-wider">Filter Status</p>
                                        <button
                                            onClick={() => { setStatusFilter('all'); setShowStatusDropdown(false); setCurrentPage(1); }}
                                            className={`w-full px-3 py-2 text-left text-sm flex items-center gap-2 hover:bg-background-light dark:hover:bg-gray-700 transition-colors ${statusFilter === 'all' ? 'bg-primary/10 text-primary font-medium' : 'text-text-main dark:text-white'
                                                }`}
                                        >
                                            {statusFilter === 'all' && <Check size={14} />}
                                            <span>Semua Status</span>
                                        </button>
                                        {(activeTab === 'invoices' ? invoiceStatuses : quotationStatuses).map((status) => (
                                            <button
                                                key={status}
                                                onClick={() => { setStatusFilter(status); setShowStatusDropdown(false); setCurrentPage(1); }}
                                                className={`w-full px-3 py-2 text-left text-sm flex items-center gap-2 hover:bg-background-light dark:hover:bg-gray-700 transition-colors ${status === statusFilter ? 'bg-primary/10 text-primary font-medium' : 'text-text-main dark:text-white'
                                                    }`}
                                            >
                                                {status === statusFilter && <Check size={14} />}
                                                <span className="capitalize">{status}</span>
                                            </button>
                                        ))}
                                    </div>
                                </>
                            )}
                        </div>

                        {/* Clear Filters Button */}
                        {(dateFilter !== 'all' || statusFilter !== 'all') && (
                            <button
                                onClick={() => { setDateFilter('all'); setStatusFilter('all'); setCurrentPage(1); }}
                                className="flex items-center gap-1 px-3 py-2 text-sm font-medium rounded-xl text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                            >
                                <X size={14} />
                                <span>Hapus Filter</span>
                            </button>
                        )}
                    </div>
                </div>

                {/* Table */}
                <div className="flex-1 overflow-x-auto">
                    <table className="w-full min-w-[700px]">
                        <thead className="border-b border-border-light dark:border-border-dark bg-background-light/50 dark:bg-background-dark/30">
                            <tr>
                                <th className="py-3 px-6 text-xs font-semibold uppercase tracking-wider text-text-secondary text-left">ID</th>
                                <th className="py-3 px-6 text-xs font-semibold uppercase tracking-wider text-text-secondary text-left">Klien</th>
                                <th className="py-3 px-6 text-xs font-semibold uppercase tracking-wider text-text-secondary text-left">Tanggal</th>
                                <th className="py-3 px-6 text-xs font-semibold uppercase tracking-wider text-text-secondary text-left">Jumlah</th>
                                <th className="py-3 px-6 text-xs font-semibold uppercase tracking-wider text-text-secondary text-left">Status</th>
                                <th className="py-3 px-6 text-xs font-semibold uppercase tracking-wider text-text-secondary text-right">Tindakan</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border-light dark:divide-border-dark">
                            {paginatedData.map((item) => (
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
                                            <button
                                                onClick={() => handleDelete(item)}
                                                className="p-2 text-text-secondary hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                                                title="Delete"
                                            >
                                                <Trash2 size={18} />
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
                        <p className="text-text-secondary text-sm">Tidak ada dokumen yang ditemukan.</p>
                    </div>
                )}

                {/* Pagination */}
                <div className="px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-border-light dark:border-border-dark mt-auto">
                    <div className="flex items-center gap-4">
                        <p className="text-sm text-text-secondary dark:text-gray-400">
                            Menampilkan <span className="font-medium text-text-main dark:text-white">{startIndex + 1}</span> sampai{' '}
                            <span className="font-medium text-text-main dark:text-white">{Math.min(endIndex, filteredData.length)}</span> dari{' '}
                            <span className="font-medium text-text-main dark:text-white">{filteredData.length}</span> dokumen
                        </p>
                        <div className="flex items-center gap-2">
                            <span className="text-sm text-text-secondary">Tampilkan:</span>
                            <select
                                value={pageSize}
                                onChange={(e) => { setPageSize(Number(e.target.value)); setCurrentPage(1); }}
                                className="px-2 py-1 border border-border-light dark:border-border-dark rounded-lg text-sm bg-surface-light dark:bg-surface-dark text-text-main dark:text-white focus:outline-none focus:ring-1 focus:ring-primary"
                            >
                                <option value={20}>20</option>
                                <option value={50}>50</option>
                                <option value={100}>100</option>
                            </select>
                        </div>
                    </div>
                    <div className="flex gap-2">
                        <button
                            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                            disabled={currentPage === 1}
                            className="px-3 py-1.5 rounded-lg border border-border-light dark:border-border-dark text-sm font-medium text-text-secondary hover:bg-background-light dark:hover:bg-background-dark/30 hover:text-text-main dark:hover:text-white transition-colors disabled:opacity-50"
                        >
                            Sebelumnya
                        </button>
                        <span className="px-3 py-1.5 text-sm text-text-secondary">
                            Halaman {currentPage} dari {totalPages || 1}
                        </span>
                        <button
                            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                            disabled={currentPage >= totalPages}
                            className="px-3 py-1.5 rounded-lg border border-border-light dark:border-border-dark text-sm font-medium text-text-secondary hover:bg-background-light dark:hover:bg-background-dark/30 hover:text-text-main dark:hover:text-white transition-colors disabled:opacity-50"
                        >
                            Berikutnya
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
