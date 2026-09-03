'use client';

import { useState } from 'react';
import Link from 'next/link'
import { useRouter } from 'next/navigation';
import { FileText, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { getSupabaseConfigError } from '@/utils/supabase/keys';

export default function Login() {
    const router = useRouter();
    const { login } = useAuth();
    const configError = getSupabaseConfigError();
    const [showPassword, setShowPassword] = useState(false);
    const [formData, setFormData] = useState({
        email: '',
        password: '',
        remember: false,
    });
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');

        try {
            await login(formData.email, formData.password);
            router.push('/');
        } catch (err) {
            setError(err.message || 'Gagal masuk. Silakan periksa kredensial Anda.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-b from-white to-slate-50 dark:from-background-dark dark:to-gray-900 flex items-center justify-center p-4">
            <div className="w-full max-w-md">
                {/* Logo */}
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center gap-3 mb-4">
                        <div className="size-10 rounded-lg bg-primary flex items-center justify-center text-white">
                            <FileText size={22} />
                        </div>
                    </div>
                    <h1 className="text-xl font-semibold text-text-main dark:text-white">Masuk ke InvoiceFlow</h1>
                    <p className="text-text-secondary text-sm mt-1">Kelola faktur dan penawaran Anda</p>
                </div>

                {/* Login Card */}
                <div className="bg-surface-light dark:bg-surface-dark rounded-lg border border-border-light dark:border-border-dark shadow-sm p-6 sm:p-8">
                    <form onSubmit={handleSubmit} className="space-y-5">
                        {configError && (
                            <div className="p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg text-amber-800 dark:text-amber-200 text-sm">
                                {configError}
                            </div>)}
                        {/* Error Message */}
                        {error && (
                            <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-600 dark:text-red-400 text-sm">
                                {error}
                            </div>
                        )}
                        {/* Email */}
                        <div>
                            <label className="block text-sm font-medium text-text-main dark:text-gray-300 mb-1.5">
                                Email
                            </label>
                            <input
                                type="email"
                                value={formData.email}
                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                placeholder="nama@perusahaan.com"
                                required
                                className="w-full px-3 py-2.5 bg-background-light dark:bg-background-dark border border-border-light dark:border-border-dark rounded-lg text-sm text-text-main dark:text-white placeholder:text-text-secondary focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                            />
                        </div>

                        {/* Password */}
                        <div>
                            <div className="flex items-center justify-between mb-1.5">
                                <label className="block text-sm font-medium text-text-main dark:text-gray-300">
                                    Kata Sandi
                                </label>
                                <a href="#" className="text-xs text-primary hover:text-primary-dark">
                                    Lupa kata sandi?
                                </a>
                            </div>
                            <div className="relative">
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    value={formData.password}
                                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                    placeholder="••••••••"
                                    required
                                    className="w-full px-3 py-2.5 bg-background-light dark:bg-background-dark border border-border-light dark:border-border-dark rounded-lg text-sm text-text-main dark:text-white placeholder:text-text-secondary focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all pr-10"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-text-secondary hover:text-text-main dark:hover:text-white transition-colors"
                                >
                                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                </button>
                            </div>
                        </div>

                        {/* Remember Me */}
                        <div className="flex items-center">
                            <input
                                type="checkbox"
                                id="remember"
                                checked={formData.remember}
                                onChange={(e) => setFormData({ ...formData, remember: e.target.checked })}
                                className="size-4 rounded border-border-light text-primary focus:ring-primary"
                            />
                            <label htmlFor="remember" className="ml-2 text-sm text-text-secondary">
                                Ingat saya
                            </label>
                        </div>

                        {/* Submit Button */}
                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full py-2.5 px-4 bg-primary hover:bg-primary-dark text-white font-medium rounded-lg transition-colors disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        >
                            {isLoading ? (
                                <>
                                    <div className="size-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                    Memproses...
                                </>
                            ) : (
                                'Masuk'
                            )}
                        </button>
                    </form>
                </div>

                {/* Sign Up Link */}
                <p className="text-center mt-5 text-sm text-text-secondary">
                    Belum punya akun?{' '}
                    <Link href="/register" className="text-primary hover:text-primary-dark font-medium">
                        Buat akun
                    </Link>
                </p>
            </div>
        </div>
    );
}
