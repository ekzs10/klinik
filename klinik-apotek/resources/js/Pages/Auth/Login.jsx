import React from 'react';
import { Head, useForm } from '@inertiajs/react';

export default function Login({ status }) {
    const { data, setData, post, processing, errors } = useForm({
        email: '', password: '', remember: false,
    });

    const submit = (e) => {
        e.preventDefault();
        post(route('login'));
    };

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col justify-center items-center p-4 font-sans">
            <Head title="Log in Admin" />

            <div className="w-full max-w-md bg-white rounded-[2.5rem] shadow-2xl shadow-teal-900/5 overflow-hidden border border-slate-100">
                <div className="bg-gradient-to-br from-teal-600 to-emerald-500 p-10 text-center relative overflow-hidden">
                    <div className="absolute top-0 right-0 -mt-4 -mr-4 w-24 h-24 bg-white opacity-10 rounded-full blur-2xl"></div>
                    <div className="bg-white/20 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 backdrop-blur-sm border border-white/30 shadow-inner">
                        <span className="text-3xl">⚕️</span>
                    </div>
                    <h2 className="text-2xl font-extrabold text-white">Portal Admin</h2>
                    <p className="text-teal-100 mt-1 text-sm">Masuk untuk mengelola klinik & apotek</p>
                </div>

                <div className="p-8 sm:p-10">
                    {status && <div className="mb-4 font-medium text-sm text-emerald-600 bg-emerald-50 p-3 rounded-xl">{status}</div>}
                    
                    <form onSubmit={submit}>
                        <div className="mb-5">
                            <label className="block text-sm font-bold text-slate-700 mb-2">Email / Username</label>
                            <input type="text" value={data.email} onChange={(e) => setData('email', e.target.value)} required autoFocus
                                className="w-full px-4 py-3 rounded-xl bg-slate-50 border-none ring-1 ring-slate-200 focus:ring-2 focus:ring-teal-500 focus:bg-white outline-none transition-all text-slate-700" 
                                placeholder="email/username" />
                            {errors.email && <span className="text-red-500 text-xs font-bold mt-2 block">{errors.email}</span>}
                        </div>

                        <div className="mb-6">
                            <label className="block text-sm font-bold text-slate-700 mb-2">Password</label>
                            <input type="password" value={data.password} onChange={(e) => setData('password', e.target.value)} required
                                className="w-full px-4 py-3 rounded-xl bg-slate-50 border-none ring-1 ring-slate-200 focus:ring-2 focus:ring-teal-500 focus:bg-white outline-none transition-all text-slate-700" 
                                placeholder="••••••••" />
                            {errors.password && <span className="text-red-500 text-xs font-bold mt-2 block">{errors.password}</span>}
                        </div>

                        <button type="submit" disabled={processing} 
                            className="w-full bg-teal-600 hover:bg-teal-700 text-white font-bold py-3.5 rounded-xl shadow-lg shadow-teal-600/30 transition-all transform active:scale-95 mb-4">
                            Log in Sekarang
                        </button>
                        
                        <div className="text-center">
                            <a href="/" className="text-sm font-semibold text-slate-400 hover:text-teal-600 transition-colors">
                                ← Kembali ke Katalog
                            </a>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}