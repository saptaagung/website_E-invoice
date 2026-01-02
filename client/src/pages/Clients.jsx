import { useState, useEffect } from 'react';
import { Search, Filter, Plus, MoreVertical, User, Mail, Phone, MapPin, X, Edit, Trash2, Save } from 'lucide-react';
import { Button } from '../components/ui';
import { clients as clientsApi } from '../lib/api';

// Get initials from name
const getInitials = (name) => {
    return name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || '??';
};

// Get color based on name hash
const getColor = (name) => {
    const colors = [
        'bg-blue-100 text-blue-600 dark:bg-blue-900/50 dark:text-blue-400',
        'bg-purple-100 text-purple-600 dark:bg-purple-900/50 dark:text-purple-400',
        'bg-orange-100 text-orange-600 dark:bg-orange-900/50 dark:text-orange-400',
        'bg-red-100 text-red-600 dark:bg-red-900/50 dark:text-red-400',
        'bg-teal-100 text-teal-600 dark:bg-teal-900/50 dark:text-teal-400',
        'bg-green-100 text-green-600 dark:bg-green-900/50 dark:text-green-400',
        'bg-pink-100 text-pink-600 dark:bg-pink-900/50 dark:text-pink-400',
        'bg-indigo-100 text-indigo-600 dark:bg-indigo-900/50 dark:text-indigo-400',
    ];
    const hash = name?.split('').reduce((a, b) => a + b.charCodeAt(0), 0) || 0;
    return colors[hash % colors.length];
};

function ClientDrawer({ client, onClose, onUpdate }) {
    if (!client) return null;

    return (
        <div className="fixed inset-0 z-30 overflow-hidden">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-slate-900/20 backdrop-blur-[1px]"
                onClick={onClose}
            />

            {/* Drawer Panel */}
            <div className="absolute top-0 right-0 h-full w-full max-w-[420px] bg-surface-light dark:bg-surface-dark shadow-xl flex flex-col border-l border-border-light dark:border-border-dark">
                {/* Drawer Header */}
                <div className="flex items-center justify-between px-6 py-5 border-b border-border-light dark:border-border-dark">
                    <div className="flex items-center gap-3">
                        <div className={`size-10 rounded-lg ${getColor(client.name)} flex items-center justify-center text-sm font-bold`}>
                            {getInitials(client.name)}
                        </div>
                        <div>
                            <h2 className="text-lg font-bold text-text-main dark:text-white leading-tight">{client.name}</h2>
                            <span className="text-xs text-text-secondary dark:text-gray-400">
                                Ditambahkan pada {new Date(client.createdAt).toLocaleDateString('id-ID', { month: 'short', day: 'numeric', year: 'numeric' })}
                            </span>
                        </div>
                    </div>
                    <div className="flex items-center gap-1">
                        <button className="p-2 rounded-full text-text-secondary hover:text-primary hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                            <Edit size={20} />
                        </button>
                        <button
                            onClick={onClose}
                            className="p-2 rounded-full text-text-secondary hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                        >
                            <X size={20} />
                        </button>
                    </div>
                </div>

                {/* Drawer Body */}
                <div className="flex-1 overflow-y-auto p-6 space-y-8">
                    {/* Contact Info */}
                    <section>
                        <h3 className="text-xs font-semibold text-text-secondary uppercase tracking-wider mb-4">Informasi Kontak</h3>
                        <div className="space-y-4">
                            <div className="flex items-start gap-3">
                                <User size={20} className="mt-0.5 text-text-secondary" />
                                <div>
                                    <p className="text-sm font-medium text-text-main dark:text-white">{client.contactName || 'N/A'}</p>
                                    <p className="text-xs text-text-secondary">Contact Person</p>
                                </div>
                            </div>
                            <div className="flex items-start gap-3">
                                <Mail size={20} className="mt-0.5 text-text-secondary" />
                                <div>
                                    <p className="text-sm font-medium text-text-main dark:text-white">{client.email || 'N/A'}</p>
                                    <p className="text-xs text-text-secondary">Primary Email</p>
                                </div>
                            </div>
                            <div className="flex items-start gap-3">
                                <Phone size={20} className="mt-0.5 text-text-secondary" />
                                <div>
                                    <p className="text-sm font-medium text-text-main dark:text-white">{client.phone || 'N/A'}</p>
                                    <p className="text-xs text-text-secondary">Work Phone</p>
                                </div>
                            </div>
                        </div>
                    </section>

                    <hr className="border-border-light dark:border-border-dark" />

                    {/* Address */}
                    <section>
                        <h3 className="text-xs font-semibold text-text-secondary uppercase tracking-wider mb-4">Alamat Penagihan</h3>
                        <div className="flex items-start gap-3 p-4 rounded-xl bg-background-light dark:bg-gray-800/50 border border-border-light dark:border-border-dark">
                            <MapPin size={20} className="mt-0.5 text-text-secondary" />
                            <div>
                                <p className="text-sm text-text-main dark:text-gray-300 leading-relaxed">
                                    {client.address || 'No address provided'}<br />
                                    {client.city && `${client.city}, `}{client.postalCode}<br />
                                    {client.country || 'Indonesia'}
                                </p>
                            </div>
                        </div>
                    </section>

                    <hr className="border-border-light dark:border-border-dark" />

                    {/* Stats */}
                    <section>
                        <h3 className="text-xs font-semibold text-text-secondary uppercase tracking-wider mb-4">Activity</h3>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="p-3 rounded-xl border border-border-light dark:border-border-dark bg-white dark:bg-gray-800">
                                <p className="text-xs text-text-secondary">Total Invoices</p>
                                <p className="text-lg font-bold text-text-main dark:text-white mt-1">{client._count?.invoices || 0}</p>
                            </div>
                            <div className="p-3 rounded-xl border border-border-light dark:border-border-dark bg-white dark:bg-gray-800">
                                <p className="text-xs text-text-secondary">Total Quotations</p>
                                <p className="text-lg font-bold text-text-main dark:text-white mt-1">{client._count?.quotations || 0}</p>
                            </div>
                        </div>
                    </section>

                    {/* Notes */}
                    {client.notes && (
                        <section>
                            <h3 className="text-xs font-semibold text-text-secondary uppercase tracking-wider mb-4">Catatan</h3>
                            <p className="text-sm text-text-main dark:text-gray-300">
                                {client.notes || 'Tidak ada catatan.'}
                            </p>
                        </section>
                    )}
                </div>

                {/* Drawer Footer */}
                <div className="p-6 border-t border-border-light dark:border-border-dark bg-background-light dark:bg-gray-800/30">
                    <Button className="w-full justify-center" icon={Plus}>
                        Buat Dokumen
                    </Button>
                    <div className="mt-3 flex justify-center">
                        <p className="text-xs text-text-secondary">Creates a new Quotation or Invoice for this client</p>
                    </div>
                </div>
            </div>
        </div>
    );
}

// Add/Edit Client Modal
function ClientModal({ client, onClose, onSave }) {
    const [formData, setFormData] = useState({
        name: client?.name || '',
        contactName: client?.contactName || '',
        email: client?.email || '',
        phone: client?.phone || '',
        address: client?.address || '',
        city: client?.city || '',
        postalCode: client?.postalCode || '',
        country: client?.country || 'Indonesia',
        taxId: client?.taxId || '',
        notes: client?.notes || '',
    });
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!formData.name.trim()) {
            setError('Client name is required');
            return;
        }
        setSaving(true);
        setError('');

        try {
            let result;
            if (client) {
                result = await clientsApi.update(client.id, formData);
            } else {
                result = await clientsApi.create(formData);
            }
            onSave(result);
            onClose();
        } catch (err) {
            setError(err.message || 'Failed to save client');
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-slate-900/50" onClick={onClose} />
            <div className="relative bg-surface-light dark:bg-surface-dark rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
                <div className="p-6 border-b border-border-light dark:border-border-dark">
                    <h2 className="text-xl font-bold text-text-main dark:text-white">
                        {client ? 'Edit Client' : 'Add New Client'}
                    </h2>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    {error && (
                        <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-600 dark:text-red-400 text-sm">
                            {error}
                        </div>
                    )}

                    <div>
                        <label className="block text-sm font-medium text-text-main dark:text-gray-300 mb-1">
                            Company/Client Name *
                        </label>
                        <input
                            type="text"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            className="w-full px-3 py-2.5 bg-background-light dark:bg-background-dark border border-border-light dark:border-border-dark rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
                            placeholder="PT Example Company"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-text-main dark:text-gray-300 mb-1">
                                Contact Person
                            </label>
                            <input
                                type="text"
                                value={formData.contactName}
                                onChange={(e) => setFormData({ ...formData, contactName: e.target.value })}
                                className="w-full px-3 py-2.5 bg-background-light dark:bg-background-dark border border-border-light dark:border-border-dark rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
                                placeholder="John Doe"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-text-main dark:text-gray-300 mb-1">
                                Phone
                            </label>
                            <input
                                type="tel"
                                value={formData.phone}
                                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                className="w-full px-3 py-2.5 bg-background-light dark:bg-background-dark border border-border-light dark:border-border-dark rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
                                placeholder="021-12345678"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-text-main dark:text-gray-300 mb-1">
                            Email
                        </label>
                        <input
                            type="email"
                            value={formData.email}
                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                            className="w-full px-3 py-2.5 bg-background-light dark:bg-background-dark border border-border-light dark:border-border-dark rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
                            placeholder="email@company.com"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-text-main dark:text-gray-300 mb-1">
                            Address
                        </label>
                        <textarea
                            value={formData.address}
                            onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                            rows={2}
                            className="w-full px-3 py-2.5 bg-background-light dark:bg-background-dark border border-border-light dark:border-border-dark rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary resize-none"
                            placeholder="Jl. Example No. 123"
                        />
                    </div>

                    <div className="grid grid-cols-3 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-text-main dark:text-gray-300 mb-1">
                                City
                            </label>
                            <input
                                type="text"
                                value={formData.city}
                                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                                className="w-full px-3 py-2.5 bg-background-light dark:bg-background-dark border border-border-light dark:border-border-dark rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
                                placeholder="Jakarta"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-text-main dark:text-gray-300 mb-1">
                                Postal Code
                            </label>
                            <input
                                type="text"
                                value={formData.postalCode}
                                onChange={(e) => setFormData({ ...formData, postalCode: e.target.value })}
                                className="w-full px-3 py-2.5 bg-background-light dark:bg-background-dark border border-border-light dark:border-border-dark rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
                                placeholder="12345"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-text-main dark:text-gray-300 mb-1">
                                Negara
                            </label>
                            <input
                                type="text"
                                value={formData.country}
                                onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                                className="w-full px-3 py-2.5 bg-background-light dark:bg-background-dark border border-border-light dark:border-border-dark rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-text-main dark:text-gray-300 mb-1">
                            Tax ID (NPWP)
                        </label>
                        <input
                            type="text"
                            value={formData.taxId}
                            onChange={(e) => setFormData({ ...formData, taxId: e.target.value })}
                            className="w-full px-3 py-2.5 bg-background-light dark:bg-background-dark border border-border-light dark:border-border-dark rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
                            placeholder="XX.XXX.XXX.X-XXX.XXX"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-text-main dark:text-gray-300 mb-1">
                            Catatan
                        </label>
                        <textarea
                            value={formData.notes}
                            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                            rows={2}
                            className="w-full px-3 py-2.5 bg-background-light dark:bg-background-dark border border-border-light dark:border-border-dark rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary resize-none"
                            placeholder="Catatan internal tentang klien ini..."
                        />
                    </div>

                    <div className="flex gap-3 pt-4">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 py-2.5 px-4 border border-border-light dark:border-border-dark rounded-xl text-sm font-medium text-text-main dark:text-gray-300 hover:bg-background-light dark:hover:bg-gray-800 transition-colors"
                        >
                            Batal
                        </button>
                        <button
                            type="submit"
                            disabled={saving}
                            className="flex-1 py-2.5 px-4 bg-primary hover:bg-primary-dark text-white font-semibold rounded-xl transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                        >
                            {saving ? (
                                <>
                                    <div className="size-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    Saving...
                                </>
                            ) : (
                                <>
                                    <Save size={16} />
                                    {client ? 'Perbarui Klien' : 'Tambah Klien'}
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

export default function Clients() {
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedClient, setSelectedClient] = useState(null);
    const [clientsData, setClientsData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingClient, setEditingClient] = useState(null);
    const [pageSize, setPageSize] = useState(20);
    const [currentPage, setCurrentPage] = useState(1);

    // Fetch clients from API
    useEffect(() => {
        const fetchClients = async () => {
            setLoading(true);
            try {
                const data = await clientsApi.getAll({ search: searchQuery });
                setClientsData(data);
            } catch (error) {
                console.error('Failed to fetch clients:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchClients();
    }, [searchQuery]);

    const handleAddClient = () => {
        setEditingClient(null);
        setShowModal(true);
    };

    const handleClientSaved = (savedClient) => {
        if (editingClient) {
            setClientsData(prev => prev.map(c => c.id === savedClient.id ? savedClient : c));
        } else {
            setClientsData(prev => [savedClient, ...prev]);
        }
    };

    const filteredClients = clientsData;

    // Pagination logic
    const totalPages = Math.ceil(filteredClients.length / pageSize);
    const startIndex = (currentPage - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    const paginatedClients = filteredClients.slice(startIndex, endIndex);

    return (
        <div className="flex flex-col gap-6 pb-10">
            {/* Action Bar */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="relative flex-1 w-full max-w-md group">
                    <Search size={20} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary group-focus-within:text-primary transition-colors" />
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Filter klien berdasarkan nama, email, atau perusahaan..."
                        className="block w-full pl-10 pr-3 py-2.5 border border-border-light dark:border-border-dark rounded-xl leading-5 bg-surface-light dark:bg-surface-dark placeholder-text-secondary focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary sm:text-sm shadow-sm transition-all"
                    />
                </div>
                <div className="flex items-center gap-3 w-full sm:w-auto">
                    <button className="flex items-center justify-center gap-2 px-4 py-2.5 bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark rounded-xl text-sm font-medium text-text-main dark:text-gray-200 hover:bg-background-light dark:hover:bg-gray-800 transition-colors shadow-sm">
                        <Filter size={20} />
                        <span>Filter</span>
                    </button>
                    <Button icon={Plus} className="flex-1 sm:flex-none" onClick={handleAddClient}>
                        Klien Baru
                    </Button>
                </div>
            </div>

            {/* Clients Table */}
            <div className="bg-surface-light dark:bg-surface-dark rounded-xl border border-border-light dark:border-border-dark shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse min-w-[700px]">
                        <thead>
                            <tr className="bg-background-light/50 dark:bg-gray-800/50 border-b border-border-light dark:border-border-dark">
                                <th className="px-6 py-4 text-xs font-semibold text-text-secondary uppercase tracking-wider w-[25%]">Nama Klien</th>
                                <th className="px-6 py-4 text-xs font-semibold text-text-secondary uppercase tracking-wider w-[20%]">Kontak Person</th>
                                <th className="px-6 py-4 text-xs font-semibold text-text-secondary uppercase tracking-wider w-[25%]">Alamat Email</th>
                                <th className="px-6 py-4 text-xs font-semibold text-text-secondary uppercase tracking-wider w-[15%]">Status</th>
                                <th className="px-6 py-4 text-xs font-semibold text-text-secondary uppercase tracking-wider w-[15%] text-right">Tindakan</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border-light dark:divide-border-dark">
                            {loading ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-12 text-center">
                                        <div className="flex justify-center">
                                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                                        </div>
                                    </td>
                                </tr>
                            ) : filteredClients.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-12 text-center text-text-secondary">
                                        Tidak ada klien ditemukan. Klik "Klien Baru" untuk membuat satu.
                                    </td>
                                </tr>
                            ) : (
                                paginatedClients.map((client) => (
                                    <tr
                                        key={client.id}
                                        onClick={() => setSelectedClient(client)}
                                        className={`hover:bg-background-light dark:hover:bg-gray-800/50 transition-colors cursor-pointer group ${selectedClient?.id === client.id ? 'bg-primary/5 dark:bg-primary/10' : ''
                                            }`}
                                    >
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className={`size-10 rounded-lg ${getColor(client.name)} flex items-center justify-center text-sm font-bold`}>
                                                    {getInitials(client.name)}
                                                </div>
                                                <div>
                                                    <p className="text-sm font-semibold text-text-main dark:text-white">{client.name}</p>
                                                    <p className="text-xs text-text-secondary">{client.city || 'No location'}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-text-secondary dark:text-gray-300">{client.contactName || '-'}</td>
                                        <td className="px-6 py-4 text-sm text-text-secondary dark:text-gray-300">{client.email || '-'}</td>
                                        <td className="px-6 py-4">
                                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${client.status === 'active'
                                                ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                                                : 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-400'
                                                }`}>
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <button
                                                onClick={(e) => e.stopPropagation()}
                                                className="text-text-secondary hover:text-primary transition-colors p-1 rounded-full hover:bg-background-light dark:hover:bg-gray-800 opacity-0 group-hover:opacity-100"
                                            >
                                                <MoreVertical size={20} />
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                <div className="px-6 py-4 border-t border-border-light dark:border-border-dark flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                        <p className="text-sm text-text-secondary">
                            Menampilkan <span className="font-medium text-text-main dark:text-white">{startIndex + 1}</span> sampai{' '}
                            <span className="font-medium text-text-main dark:text-white">{Math.min(endIndex, filteredClients.length)}</span> dari{' '}
                            <span className="font-medium text-text-main dark:text-white">{filteredClients.length}</span> klien
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
                            className="px-3 py-1.5 rounded-lg border border-border-light dark:border-border-dark text-sm font-medium text-text-secondary hover:bg-background-light dark:hover:bg-gray-800 hover:text-text-main dark:hover:text-white transition-colors disabled:opacity-50"
                        >
                            Sebelumnya
                        </button>
                        <span className="px-3 py-1.5 text-sm text-text-secondary">
                            Halaman {currentPage} dari {totalPages || 1}
                        </span>
                        <button
                            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                            disabled={currentPage >= totalPages}
                            className="px-3 py-1.5 rounded-lg border border-border-light dark:border-border-dark text-sm font-medium text-text-secondary hover:bg-background-light dark:hover:bg-gray-800 hover:text-text-main dark:hover:text-white transition-colors disabled:opacity-50"
                        >
                            Berikutnya
                        </button>
                    </div>
                </div>
            </div>

            {/* Client Detail Drawer */}
            {selectedClient && (
                <ClientDrawer client={selectedClient} onClose={() => setSelectedClient(null)} />
            )}

            {/* Add/Edit Client Modal */}
            {showModal && (
                <ClientModal
                    client={editingClient}
                    onClose={() => setShowModal(false)}
                    onSave={handleClientSaved}
                />
            )}
        </div>
    );
}
