import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FileText, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Register() {
    const navigate = useNavigate();
    const { register } = useAuth();
    const [showPassword, setShowPassword] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        confirmPassword: '',
        terms: false,
    });
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (formData.password !== formData.confirmPassword) {
            setError('Kata sandi tidak cocok');
            return;
        }
        setIsLoading(true);

        try {
            await register(formData.name, formData.email, formData.password);
            navigate('/');
        } catch (err) {
            setError(err.message || 'Gagal membuat akun. Silakan coba lagi.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background-light to-blue-50 dark:from-background-dark dark:via-background-dark dark:to-gray-900 flex items-center justify-center p-4">
            {/* Background Pattern */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute -top-40 -right-40 w-80 h-80 bg-primary/10 rounded-full blur-3xl"></div>
                <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl"></div>
            </div>

            <div className="w-full max-w-md relative">
                {/* Logo */}
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center gap-3 mb-4">
                        <div className="size-12 rounded-xl bg-primary flex items-center justify-center text-white shadow-lg shadow-primary/30">
                            <FileText size={28} />
                        </div>
                    </div>
                    <h1 className="text-2xl font-bold text-text-main dark:text-white">Buat akun Anda</h1>
                    <p className="text-text-secondary mt-2">Kelola faktur Anda mulai hari ini</p>
                </div>

                {/* Register Card */}
                <div className="bg-surface-light dark:bg-surface-dark rounded-2xl border border-border-light dark:border-border-dark shadow-xl p-8">
                    <form onSubmit={handleSubmit} className="space-y-5">
                        {/* Error Message */}
                        {error && (
                            <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl text-red-600 dark:text-red-400 text-sm">
                                {error}
                            </div>
                        )}
                        {/* Name */}
                        <div>
                            <label className="block text-sm font-medium text-text-main dark:text-gray-300 mb-2">
                                Nama Lengkap
                            </label>
                            <input
                                type="text"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                placeholder="John Doe"
                                required
                                className="w-full px-4 py-3 bg-background-light dark:bg-background-dark border border-border-light dark:border-border-dark rounded-xl text-text-main dark:text-white placeholder:text-text-secondary focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                            />
                        </div>

                        {/* Email */}
                        <div>
                            <label className="block text-sm font-medium text-text-main dark:text-gray-300 mb-2">
                                Alamat Email
                            </label>
                            <input
                                type="email"
                                value={formData.email}
                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                placeholder="you@company.com"
                                required
                                className="w-full px-4 py-3 bg-background-light dark:bg-background-dark border border-border-light dark:border-border-dark rounded-xl text-text-main dark:text-white placeholder:text-text-secondary focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                            />
                        </div>

                        {/* Password */}
                        <div>
                            <label className="block text-sm font-medium text-text-main dark:text-gray-300 mb-2">
                                Kata Sandi
                            </label>
                            <div className="relative">
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    value={formData.password}
                                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                    placeholder="••••••••"
                                    required
                                    minLength={8}
                                    className="w-full px-4 py-3 bg-background-light dark:bg-background-dark border border-border-light dark:border-border-dark rounded-xl text-text-main dark:text-white placeholder:text-text-secondary focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all pr-12"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-4 top-1/2 -translate-y-1/2 text-text-secondary hover:text-text-main transition-colors"
                                >
                                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                                </button>
                            </div>
                        </div>

                        {/* Confirm Password */}
                        <div>
                            <label className="block text-sm font-medium text-text-main dark:text-gray-300 mb-2">
                                Konfirmasi Kata Sandi
                            </label>
                            <input
                                type="password"
                                value={formData.confirmPassword}
                                onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                                placeholder="••••••••"
                                required
                                className="w-full px-4 py-3 bg-background-light dark:bg-background-dark border border-border-light dark:border-border-dark rounded-xl text-text-main dark:text-white placeholder:text-text-secondary focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                            />
                        </div>

                        {/* Terms */}
                        <div className="flex items-start">
                            <input
                                type="checkbox"
                                id="terms"
                                checked={formData.terms}
                                onChange={(e) => setFormData({ ...formData, terms: e.target.checked })}
                                required
                                className="size-4 rounded border-border-light text-primary focus:ring-primary mt-0.5"
                            />
                            <label htmlFor="terms" className="ml-2 text-sm text-text-secondary">
                                Saya menyetujui{' '}
                                <a href="#" className="text-primary hover:underline">Ketentuan Layanan</a>
                                {' '}dan{' '}
                                <a href="#" className="text-primary hover:underline">Kebijakan Privasi</a>
                            </label>
                        </div>

                        {/* Submit Button */}
                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full py-3 px-4 bg-primary hover:bg-primary-dark text-white font-semibold rounded-xl shadow-lg shadow-primary/30 transition-all active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        >
                            {isLoading ? (
                                <>
                                    <div className="size-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                    Membuat akun...
                                </>
                            ) : (
                                'Buat Akun'
                            )}
                        </button>
                    </form>
                </div>

                {/* Sign In Link */}
                <p className="text-center mt-6 text-text-secondary">
                    Sudah punya akun?{' '}
                    <Link to="/login" className="text-primary hover:text-primary-dark font-semibold">
                        Masuk
                    </Link>
                </p>
            </div>
        </div>
    );
}
