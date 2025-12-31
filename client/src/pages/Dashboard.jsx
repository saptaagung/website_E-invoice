import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Wallet, CreditCard, FileEdit, TrendingUp, MoreVertical, ArrowRight } from 'lucide-react';
import { StatusBadge, KPICard, Button } from '../components/ui';
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

export default function Dashboard() {
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({
        outstanding: 0,
        paidThisMonth: 0,
        drafts: 0,
    });
    const [recentDocuments, setRecentDocuments] = useState([]);

    useEffect(() => {
        const fetchDashboardData = async () => {
            setLoading(true);
            try {
                // Fetch invoices and quotations
                const [invoicesData, quotationsData] = await Promise.all([
                    invoices.getAll(),
                    quotations.getAll()
                ]);

                // Calculate stats
                const outstanding = invoicesData
                    .filter(i => ['sent', 'pending', 'overdue'].includes(i.status))
                    .reduce((sum, i) => sum + Number(i.total), 0);

                const thisMonth = new Date();
                const paidThisMonth = invoicesData
                    .filter(i => {
                        if (i.status !== 'paid') return false;
                        const paidDate = new Date(i.updatedAt);
                        return paidDate.getMonth() === thisMonth.getMonth() &&
                            paidDate.getFullYear() === thisMonth.getFullYear();
                    })
                    .reduce((sum, i) => sum + Number(i.total), 0);

                const drafts = invoicesData.filter(i => i.status === 'draft').length +
                    quotationsData.filter(q => q.status === 'draft').length;

                setStats({ outstanding, paidThisMonth, drafts });

                // Combine and sort recent documents
                const allDocs = [
                    ...invoicesData.map(i => ({
                        id: i.id,
                        displayId: i.invoiceNumber,
                        client: i.client?.name || 'Unknown',
                        date: formatDate(i.issueDate),
                        type: 'Invoice',
                        amount: Number(i.total),
                        status: i.status,
                        createdAt: i.createdAt,
                    })),
                    ...quotationsData.map(q => ({
                        id: q.id,
                        displayId: q.quotationNumber,
                        client: q.client?.name || 'Unknown',
                        date: formatDate(q.issueDate),
                        type: 'Quotation',
                        amount: Number(q.total),
                        status: q.status,
                        createdAt: q.createdAt,
                    }))
                ];

                // Sort by createdAt and take first 5
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
        <div className="flex flex-col gap-8 pb-10">
            {/* Welcome & Actions Row */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <h2 className="text-2xl font-bold text-text-main dark:text-white tracking-tight">Dashboard</h2>
                    <p className="text-text-secondary dark:text-gray-400 text-sm mt-1">Overview of your financial activities.</p>
                </div>
                <div className="flex flex-wrap gap-3">
                    <Link to="/quotations/new">
                        <Button icon={Plus}>New Quotation</Button>
                    </Link>
                    <Link to="/invoices/select">
                        <Button variant="secondary" icon={Plus}>New Invoice</Button>
                    </Link>
                </div>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 lg:gap-6">
                <KPICard
                    icon={Wallet}
                    iconBgColor="bg-orange-50 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400"
                    title="Outstanding Amount"
                    value={loading ? '...' : formatIDR(stats.outstanding)}
                    trend="up"
                    trendValue={stats.outstanding > 0 ? 'Active' : 'None'}
                />
                <KPICard
                    icon={CreditCard}
                    iconBgColor="bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400"
                    title="Paid This Month"
                    value={loading ? '...' : formatIDR(stats.paidThisMonth)}
                    trend="up"
                    trendValue="This month"
                />
                <KPICard
                    icon={FileEdit}
                    iconBgColor="bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400"
                    title="Active Drafts"
                    value={loading ? '...' : String(stats.drafts)}
                    trendLabel="Not sent"
                />
            </div>

            {/* Recent Documents Section */}
            <div className="flex flex-col gap-4">
                <div className="flex items-center justify-between px-1">
                    <h3 className="text-lg font-bold text-text-main dark:text-white">Recent Documents</h3>
                    <Link to="/invoices" className="text-sm font-medium text-primary hover:text-primary-dark">View all</Link>
                </div>

                <div className="bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark rounded-xl shadow-sm overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-background-light/50 dark:bg-gray-800/50 border-b border-border-light dark:border-border-dark">
                                    <th className="py-3 px-6 text-xs font-semibold text-text-secondary dark:text-gray-400 uppercase tracking-wider w-24">ID</th>
                                    <th className="py-3 px-6 text-xs font-semibold text-text-secondary dark:text-gray-400 uppercase tracking-wider">Client Name</th>
                                    <th className="py-3 px-6 text-xs font-semibold text-text-secondary dark:text-gray-400 uppercase tracking-wider w-32">Date</th>
                                    <th className="py-3 px-6 text-xs font-semibold text-text-secondary dark:text-gray-400 uppercase tracking-wider w-32">Type</th>
                                    <th className="py-3 px-6 text-xs font-semibold text-text-secondary dark:text-gray-400 uppercase tracking-wider text-right w-32">Amount</th>
                                    <th className="py-3 px-6 text-xs font-semibold text-text-secondary dark:text-gray-400 uppercase tracking-wider w-32 text-center">Status</th>
                                    <th className="py-3 px-6 text-xs font-semibold text-text-secondary dark:text-gray-400 uppercase tracking-wider w-16 text-right"></th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border-light dark:divide-border-dark">
                                {loading ? (
                                    <tr>
                                        <td colSpan={7} className="py-12 text-center">
                                            <div className="flex justify-center">
                                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                                            </div>
                                        </td>
                                    </tr>
                                ) : recentDocuments.length === 0 ? (
                                    <tr>
                                        <td colSpan={7} className="py-12 text-center text-text-secondary">
                                            No documents yet. Create your first quotation or invoice.
                                        </td>
                                    </tr>
                                ) : (
                                    recentDocuments.map((doc) => (
                                        <tr key={doc.id} className="hover:bg-background-light dark:hover:bg-gray-800/50 transition-colors group">
                                            <td className="py-4 px-6 text-sm font-medium text-primary">#{doc.displayId}</td>
                                            <td className="py-4 px-6">
                                                <div className="flex items-center gap-3">
                                                    <div className="size-8 rounded-full bg-primary/10 flex items-center justify-center text-primary text-xs font-bold">
                                                        {getInitials(doc.client)}
                                                    </div>
                                                    <span className="text-sm font-medium text-text-main dark:text-white">{doc.client}</span>
                                                </div>
                                            </td>
                                            <td className="py-4 px-6 text-sm text-text-secondary dark:text-gray-400">{doc.date}</td>
                                            <td className="py-4 px-6 text-sm text-text-main dark:text-white">{doc.type}</td>
                                            <td className="py-4 px-6 text-sm font-semibold text-text-main dark:text-white text-right">{formatIDR(doc.amount)}</td>
                                            <td className="py-4 px-6 text-center">
                                                <StatusBadge status={doc.status} />
                                            </td>
                                            <td className="py-4 px-6 text-right">
                                                <Link
                                                    to={doc.type === 'Invoice' ? `/invoices/${doc.id}` : `/quotations/${doc.id}`}
                                                    className="text-text-secondary hover:text-text-main dark:hover:text-white"
                                                >
                                                    <MoreVertical size={20} />
                                                </Link>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                    <div className="bg-background-light/30 dark:bg-gray-800/30 p-4 border-t border-border-light dark:border-border-dark flex items-center justify-center">
                        <Link to="/invoices" className="text-sm font-medium text-text-secondary hover:text-primary transition-colors flex items-center gap-1">
                            Show all documents
                            <ArrowRight size={16} />
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}
