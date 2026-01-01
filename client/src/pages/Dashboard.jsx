import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Plus, FileEdit, DollarSign, Clock, ArrowRight, FileText, Receipt, AlertTriangle, Inbox, Hourglass } from 'lucide-react';
import { StatusBadge, Button } from '../components/ui';
import { invoices, quotations } from '../lib/api';

// Format currency helper
const formatIDR = (amount) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(amount);
};

// Format date helper
const formatDate = (dateString) => {
    const date = new Date(dateString);
    return {
        day: date.toLocaleDateString('id-ID', { day: 'numeric' }),
        monthYear: date.toLocaleDateString('id-ID', { month: 'short', year: 'numeric' })
    };
};

// Get initials from name
const getInitials = (name) => {
    return name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || '??';
};

export default function Dashboard() {
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({
        draftsCount: 0,
        unpaidAmount: 0,
        unpaidCount: 0,
        awaitingResponseCount: 0,
        quotationStats: { total: 0, draft: 0, sent: 0, accepted: 0, rejected: 0, expired: 0 },
        invoiceStats: { total: 0, draft: 0, sent: 0, paid: 0, partial: 0, overdue: 0, cancelled: 0 },
    });
    const [recentDocuments, setRecentDocuments] = useState([]);

    useEffect(() => {
        const fetchDashboardData = async () => {
            setLoading(true);
            try {
                const [invoicesData, quotationsData] = await Promise.all([
                    invoices.getAll(),
                    quotations.getAll()
                ]);

                // Calculate KPI stats
                const draftsCount = invoicesData.filter(i => i.status === 'draft').length +
                    quotationsData.filter(q => q.status === 'draft').length;

                const unpaidInvoices = invoicesData.filter(i => ['sent', 'partial', 'overdue'].includes(i.status));
                const unpaidAmount = unpaidInvoices.reduce((sum, i) => sum + Number(i.total), 0);
                const unpaidCount = unpaidInvoices.length;

                const awaitingResponseCount = quotationsData.filter(q => q.status === 'sent').length;

                // Detailed quotation stats
                const quotationStats = {
                    total: quotationsData.length,
                    draft: quotationsData.filter(q => q.status === 'draft').length,
                    sent: quotationsData.filter(q => q.status === 'sent').length,
                    accepted: quotationsData.filter(q => q.status === 'accepted').length,
                    rejected: quotationsData.filter(q => q.status === 'rejected').length,
                    expired: quotationsData.filter(q => q.status === 'expired').length,
                };

                // Detailed invoice stats
                const invoiceStats = {
                    total: invoicesData.length,
                    draft: invoicesData.filter(i => i.status === 'draft').length,
                    sent: invoicesData.filter(i => i.status === 'sent').length,
                    paid: invoicesData.filter(i => i.status === 'paid').length,
                    partial: invoicesData.filter(i => i.status === 'partial').length,
                    overdue: invoicesData.filter(i => i.status === 'overdue').length,
                    cancelled: invoicesData.filter(i => i.status === 'cancelled').length,
                };

                setStats({ draftsCount, unpaidAmount, unpaidCount, awaitingResponseCount, quotationStats, invoiceStats });

                // Combine and sort recent documents
                const allDocs = [
                    ...invoicesData.map(i => ({
                        id: i.id,
                        displayId: i.invoiceNumber,
                        client: i.client?.name || 'Unknown',
                        date: i.issueDate,
                        type: 'Invoice',
                        amount: Number(i.total),
                        status: i.status,
                        createdAt: i.createdAt,
                    })),
                    ...quotationsData.map(q => ({
                        id: q.id,
                        displayId: q.quotationNumber,
                        client: q.client?.name || 'Unknown',
                        date: q.issueDate,
                        type: 'Quotation',
                        amount: Number(q.total),
                        status: q.status,
                        createdAt: q.createdAt,
                    }))
                ];

                allDocs.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
                setRecentDocuments(allDocs.slice(0, 5));

            } catch (error) {
                console.error('Failed to fetch dashboard data:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchDashboardData();
    }, []);

    return (
        <div className="flex flex-col gap-8 pb-10 max-w-[1200px] mx-auto">
            {/* Welcome & Actions Row */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <h2 className="text-2xl font-bold text-text-main dark:text-white tracking-tight">Dashboard</h2>
                    <p className="text-text-secondary dark:text-gray-400 text-sm mt-1">Ringkasan aktivitas keuangan Anda.</p>
                </div>
                <div className="flex flex-wrap gap-3">
                    <Link to="/quotations/new">
                        <Button icon={Plus}>Penawaran Baru</Button>
                    </Link>
                    <Link to="/invoices/select">
                        <Button variant="secondary" icon={Plus}>Faktur Baru</Button>
                    </Link>
                </div>
            </div>

            {/* Action-Focused KPI Cards - Enhanced Design */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 lg:gap-6">
                {/* Drafts Card */}
                <div className="bg-surface-light dark:bg-surface-dark rounded-xl p-5 border border-border-light dark:border-border-dark flex flex-col justify-between h-40 relative overflow-hidden group">
                    {/* Background Icon */}
                    <div className="absolute right-0 top-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                        <FileEdit size={100} />
                    </div>
                    <div className="flex items-start justify-between relative z-10">
                        <div className="size-10 rounded-lg bg-gray-100 dark:bg-white/5 flex items-center justify-center text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-white/5">
                            <FileEdit size={20} />
                        </div>
                        <span className="text-text-secondary text-xs font-medium text-right max-w-[50%] leading-tight">Draft yang perlu diselesaikan</span>
                    </div>
                    <div className="relative z-10">
                        <div className="flex items-center gap-2 mb-1">
                            <Inbox size={16} className="text-red-400" />
                            <span className="text-xs text-text-secondary">Perlu Tindakan</span>
                        </div>
                        <h3 className="text-3xl font-bold text-text-main dark:text-white">{loading ? '...' : stats.draftsCount}</h3>
                    </div>
                </div>

                {/* Unpaid Invoices Card */}
                <div className="bg-surface-light dark:bg-surface-dark rounded-xl p-5 border border-border-light dark:border-border-dark flex flex-col justify-between h-40 relative overflow-hidden group">
                    {/* Background Icon */}
                    <div className="absolute right-0 top-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                        <DollarSign size={100} />
                    </div>
                    <div className="flex items-start justify-between relative z-10">
                        <div className="size-10 rounded-lg bg-orange-50 dark:bg-orange-500/10 flex items-center justify-center text-orange-500 border border-orange-200 dark:border-orange-500/20">
                            <DollarSign size={20} />
                        </div>
                        {stats.unpaidCount > 0 && (
                            <span className="px-2 py-1 bg-green-50 dark:bg-green-500/10 text-green-600 dark:text-green-400 text-xs font-semibold rounded text-center border border-green-200 dark:border-green-500/20">
                                {stats.unpaidCount} faktur
                            </span>
                        )}
                    </div>
                    <div className="relative z-10">
                        <div className="flex items-center gap-2 mb-1">
                            <AlertTriangle size={16} className="text-orange-500" />
                            <span className="text-xs text-text-secondary">Tagihan Belum Dibayar</span>
                        </div>
                        <h3 className="text-2xl font-bold text-text-main dark:text-white tracking-tight">{loading ? '...' : formatIDR(stats.unpaidAmount)}</h3>
                    </div>
                </div>

                {/* Awaiting Response Card */}
                <div className="bg-surface-light dark:bg-surface-dark rounded-xl p-5 border border-border-light dark:border-border-dark flex flex-col justify-between h-40 relative overflow-hidden group">
                    {/* Background Icon */}
                    <div className="absolute right-0 top-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                        <Clock size={100} />
                    </div>
                    <div className="flex items-start justify-between relative z-10">
                        <div className="size-10 rounded-lg bg-blue-50 dark:bg-blue-500/10 flex items-center justify-center text-blue-500 border border-blue-200 dark:border-blue-500/20">
                            <Clock size={20} />
                        </div>
                        <span className="text-text-secondary text-xs font-medium text-right max-w-[50%] leading-tight">Penawaran terkirim</span>
                    </div>
                    <div className="relative z-10">
                        <div className="flex items-center gap-2 mb-1">
                            <Hourglass size={16} className="text-yellow-500" />
                            <span className="text-xs text-text-secondary">Menunggu Respon</span>
                        </div>
                        <h3 className="text-3xl font-bold text-text-main dark:text-white">{loading ? '...' : stats.awaitingResponseCount}</h3>
                    </div>
                </div>
            </div>

            {/* Stats Breakdown */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Quotation Stats */}
                <div className="bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark rounded-xl p-6">
                    <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-2">
                            <FileText size={20} className="text-blue-500" />
                            <h3 className="font-bold text-text-main dark:text-white">Penawaran</h3>
                        </div>
                        <Link to="/quotations" className="text-xs text-blue-500 hover:text-blue-400">Lihat semua</Link>
                    </div>
                    <div className="space-y-4">
                        <div className="flex justify-between items-center pb-3 border-b border-border-light dark:border-border-dark">
                            <span className="text-sm text-text-secondary">Total</span>
                            <span className="text-sm font-bold text-text-main dark:text-white">{loading ? '...' : stats.quotationStats.total}</span>
                        </div>
                        <div className="flex justify-between items-center text-sm">
                            <div className="flex items-center gap-2">
                                <div className="size-2 rounded-full bg-gray-500"></div>
                                <span className="text-gray-500 dark:text-gray-400">Draft</span>
                            </div>
                            <span className="text-text-main dark:text-white">{loading ? '...' : stats.quotationStats.draft}</span>
                        </div>
                        <div className="flex justify-between items-center text-sm">
                            <div className="flex items-center gap-2">
                                <div className="size-2 rounded-full bg-blue-500"></div>
                                <span className="text-blue-500 dark:text-blue-400">Terkirim</span>
                            </div>
                            <span className="text-text-main dark:text-white">{loading ? '...' : stats.quotationStats.sent}</span>
                        </div>
                        <div className="flex justify-between items-center text-sm">
                            <div className="flex items-center gap-2">
                                <div className="size-2 rounded-full bg-green-500"></div>
                                <span className="text-green-500 dark:text-green-400">Diterima</span>
                            </div>
                            <span className="text-text-main dark:text-white">{loading ? '...' : stats.quotationStats.accepted}</span>
                        </div>
                        <div className="flex justify-between items-center text-sm">
                            <div className="flex items-center gap-2">
                                <div className="size-2 rounded-full bg-red-500"></div>
                                <span className="text-red-500 dark:text-red-400">Ditolak</span>
                            </div>
                            <span className="text-text-main dark:text-white">{loading ? '...' : stats.quotationStats.rejected}</span>
                        </div>
                        <div className="flex justify-between items-center text-sm">
                            <div className="flex items-center gap-2">
                                <div className="size-2 rounded-full bg-orange-500"></div>
                                <span className="text-orange-500 dark:text-orange-400">Kedaluwarsa</span>
                            </div>
                            <span className="text-text-main dark:text-white">{loading ? '...' : stats.quotationStats.expired}</span>
                        </div>
                    </div>
                </div>

                {/* Invoice Stats */}
                <div className="bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark rounded-xl p-6">
                    <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-2">
                            <Receipt size={20} className="text-green-500" />
                            <h3 className="font-bold text-text-main dark:text-white">Faktur</h3>
                        </div>
                        <Link to="/invoices" className="text-xs text-blue-500 hover:text-blue-400">Lihat semua</Link>
                    </div>
                    <div className="space-y-4">
                        <div className="flex justify-between items-center pb-3 border-b border-border-light dark:border-border-dark">
                            <span className="text-sm text-text-secondary">Total</span>
                            <span className="text-sm font-bold text-text-main dark:text-white">{loading ? '...' : stats.invoiceStats.total}</span>
                        </div>
                        <div className="flex justify-between items-center text-sm">
                            <div className="flex items-center gap-2">
                                <div className="size-2 rounded-full bg-gray-500"></div>
                                <span className="text-gray-500 dark:text-gray-400">Draft</span>
                            </div>
                            <span className="text-text-main dark:text-white">{loading ? '...' : stats.invoiceStats.draft}</span>
                        </div>
                        <div className="flex justify-between items-center text-sm">
                            <div className="flex items-center gap-2">
                                <div className="size-2 rounded-full bg-blue-500"></div>
                                <span className="text-blue-500 dark:text-blue-400">Terkirim</span>
                            </div>
                            <span className="text-text-main dark:text-white">{loading ? '...' : stats.invoiceStats.sent}</span>
                        </div>
                        <div className="flex justify-between items-center text-sm">
                            <div className="flex items-center gap-2">
                                <div className="size-2 rounded-full bg-green-500"></div>
                                <span className="text-green-500 dark:text-green-400">Lunas</span>
                            </div>
                            <span className="text-text-main dark:text-white">{loading ? '...' : stats.invoiceStats.paid}</span>
                        </div>
                        <div className="flex justify-between items-center text-sm">
                            <div className="flex items-center gap-2">
                                <div className="size-2 rounded-full bg-yellow-500"></div>
                                <span className="text-yellow-500 dark:text-yellow-400">Parsial</span>
                            </div>
                            <span className="text-text-main dark:text-white">{loading ? '...' : stats.invoiceStats.partial}</span>
                        </div>
                        <div className="flex justify-between items-center text-sm">
                            <div className="flex items-center gap-2">
                                <div className="size-2 rounded-full bg-red-500"></div>
                                <span className="text-red-500 dark:text-red-400">Jatuh Tempo</span>
                            </div>
                            <span className="text-text-main dark:text-white">{loading ? '...' : stats.invoiceStats.overdue}</span>
                        </div>
                        <div className="flex justify-between items-center text-sm">
                            <div className="flex items-center gap-2">
                                <div className="size-2 rounded-full bg-slate-500"></div>
                                <span className="text-slate-500 dark:text-slate-400">Dibatalkan</span>
                            </div>
                            <span className="text-text-main dark:text-white">{loading ? '...' : stats.invoiceStats.cancelled}</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Recent Documents Section */}
            <div className="flex flex-col gap-4">
                <div className="flex items-center justify-between px-1">
                    <h3 className="text-lg font-bold text-text-main dark:text-white">Dokumen Terbaru</h3>
                    <Link to="/invoices" className="text-sm font-medium text-blue-500 hover:text-blue-400">Lihat semua</Link>
                </div>

                <div className="bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark rounded-xl shadow-sm overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-background-light/50 dark:bg-background-dark/50 border-b border-border-light dark:border-border-dark">
                                    <th className="py-4 px-6 text-xs font-semibold text-text-secondary dark:text-gray-400 uppercase tracking-wider w-32">ID</th>
                                    <th className="py-4 px-6 text-xs font-semibold text-text-secondary dark:text-gray-400 uppercase tracking-wider">Nama Klien</th>
                                    <th className="py-4 px-6 text-xs font-semibold text-text-secondary dark:text-gray-400 uppercase tracking-wider w-32">Tanggal</th>
                                    <th className="py-4 px-6 text-xs font-semibold text-text-secondary dark:text-gray-400 uppercase tracking-wider w-32">Tipe</th>
                                    <th className="py-4 px-6 text-xs font-semibold text-text-secondary dark:text-gray-400 uppercase tracking-wider text-right w-48">Jumlah</th>
                                    <th className="py-4 px-6 text-xs font-semibold text-text-secondary dark:text-gray-400 uppercase tracking-wider w-32 text-center">Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border-light dark:divide-border-dark">
                                {loading ? (
                                    <tr>
                                        <td colSpan={6} className="py-12 text-center">
                                            <div className="flex justify-center">
                                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                                            </div>
                                        </td>
                                    </tr>
                                ) : recentDocuments.length === 0 ? (
                                    <tr>
                                        <td colSpan={6} className="py-12 text-center text-text-secondary">
                                            Belum ada dokumen. Buat penawaran atau faktur pertama Anda.
                                        </td>
                                    </tr>
                                ) : (
                                    recentDocuments.map((doc) => {
                                        const dateFormatted = formatDate(doc.date);
                                        return (
                                            <tr key={doc.id} className="hover:bg-background-light dark:hover:bg-white/5 transition-colors group">
                                                <td className="py-4 px-6 text-sm font-medium text-blue-500">
                                                    <Link to={doc.type === 'Invoice' ? `/invoices/${doc.id}?view=true` : `/quotations/${doc.id}?view=true`}>
                                                        #{doc.displayId}
                                                    </Link>
                                                </td>
                                                <td className="py-4 px-6">
                                                    <div className="flex items-center gap-3">
                                                        <div className="size-8 rounded bg-blue-900/50 dark:bg-blue-900/50 flex items-center justify-center text-xs font-bold text-blue-300">
                                                            {getInitials(doc.client)}
                                                        </div>
                                                        <span className="text-sm font-bold text-text-main dark:text-white">{doc.client}</span>
                                                    </div>
                                                </td>
                                                <td className="py-4 px-6 text-sm text-text-secondary dark:text-gray-400">
                                                    <div className="flex flex-col text-xs">
                                                        <span>{dateFormatted.day} {dateFormatted.monthYear.split(' ')[0]}</span>
                                                        <span>{dateFormatted.monthYear.split(' ')[1]}</span>
                                                    </div>
                                                </td>
                                                <td className="py-4 px-6 text-sm text-text-main dark:text-white">{doc.type}</td>
                                                <td className="py-4 px-6 text-sm font-bold text-text-main dark:text-white text-right">{formatIDR(doc.amount)}</td>
                                                <td className="py-4 px-6 text-center">
                                                    <StatusBadge status={doc.status} />
                                                </td>
                                            </tr>
                                        );
                                    })
                                )}
                            </tbody>
                        </table>
                    </div>
                    <div className="bg-surface-light dark:bg-surface-dark p-4 border-t border-border-light dark:border-border-dark flex items-center justify-center">
                        <Link to="/invoices" className="text-sm font-medium text-text-secondary dark:text-gray-400 hover:text-text-main dark:hover:text-white transition-colors flex items-center gap-1">
                            Lihat semua dokumen
                            <ArrowRight size={16} />
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}
