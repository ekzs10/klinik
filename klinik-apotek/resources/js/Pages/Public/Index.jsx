import React, { useState, useMemo, useEffect } from 'react';
import { Head, useForm, Link } from '@inertiajs/react';

export default function PublicDashboard({ availableStock }) {
    const { data, setData, post, processing, reset } = useForm({
        medicine_id: '', quantity: 1
    });

    const [selectedMed, setSelectedMed] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');

    // FITUR REAL-TIME: Jam Digital untuk Pasien/User
    const [currentTime, setCurrentTime] = useState(new Date());

    useEffect(() => {
        const timer = setInterval(() => {
            setCurrentTime(new Date());
        }, 1000);
        return () => clearInterval(timer);
    }, []);

    const handleDeduct = (e) => {
        e.preventDefault();
        post('/quick-deduct', {
            onSuccess: () => { reset(); setSelectedMed(null); }
        });
    };

    const formatRp = (angka) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(angka);

    const getExpiryStyle = (dateStr) => {
        if (!dateStr) return ''; 
        const diffDays = Math.ceil((new Date(dateStr) - new Date()) / (1000 * 60 * 60 * 24));
        if (diffDays <= 30) return 'bg-red-50 text-red-700 border-l-4 border-red-500';
        if (diffDays <= 60) return 'bg-orange-50 text-orange-700 border-l-4 border-orange-400';
        return 'border-l-4 border-transparent';
    };

    const filteredStock = useMemo(() => {
        if (!searchQuery.trim()) return availableStock;
        const lowerCaseQuery = searchQuery.toLowerCase();
        return availableStock.filter(med => med.name.toLowerCase().includes(lowerCaseQuery));
    }, [searchQuery, availableStock]);

    return (
        <div className="min-h-screen bg-slate-50 font-sans relative pb-12">
            <Head title="Katalog Obat" />
            
            <div className="bg-gradient-to-r from-teal-600 to-emerald-500 pb-24 pt-8 px-8 shadow-lg">
                <header className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
                    <div className="flex items-center gap-3">
                        <div className="bg-white p-3 rounded-2xl shadow-sm hidden md:flex items-center justify-center">
                            <span className="text-3xl">⚕️</span>
                        </div>
                        <div className="text-center md:text-left">
                            <h1 className="text-3xl font-extrabold text-white tracking-tight">Katalog Apotek</h1>
                            <p className="text-teal-100 mt-1 font-medium">Layanan Cepat & Mandiri</p>
                        </div>
                    </div>

                    {/* TAMPILAN JAM REAL-TIME UNTUK USER */}
                    <div className="bg-white/10 backdrop-blur-md border border-white/20 text-white px-6 py-2.5 rounded-2xl font-mono text-sm font-bold shadow-inner flex items-center gap-3">
                        <span className="animate-pulse">⏱️</span>
                        <span>
                            {currentTime.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                        </span>
                        <span className="bg-white/20 px-2 py-0.5 rounded-lg">
                            {currentTime.toLocaleTimeString('id-ID')}
                        </span>
                    </div>

                    <Link href={route('login')} className="bg-white/20 hover:bg-white/30 backdrop-blur-md text-white border border-white/40 font-bold py-2.5 px-6 rounded-full transition-all shadow-sm">
                        Masuk Admin →
                    </Link>
                </header>
            </div>

            <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 -mt-12">
                {selectedMed && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 animate-fade-in">
                        <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-md overflow-hidden transform transition-all border border-white">
                            <div className="bg-teal-50 p-6 text-center border-b border-teal-100">
                                <span className="text-4xl mb-2 block">💊</span>
                                <h3 className="text-2xl font-extrabold text-teal-800">Pakai Obat</h3>
                            </div>
                            <div className="p-8">
                                <div className="text-center mb-6">
                                    <h4 className="text-xl font-bold text-slate-800">{selectedMed.name}</h4>
                                    <p className="text-slate-500 mt-2">
                                        Harga: <span className="font-bold text-teal-600 text-lg">{formatRp(selectedMed.selling_price)}</span> / unit
                                    </p>
                                    <span className="inline-block bg-slate-100 text-slate-600 text-xs font-bold px-3 py-1 rounded-full mt-3">
                                        Sisa Batch: {selectedMed.stock_remain} unit
                                    </span>
                                </div>
                                <form onSubmit={handleDeduct}>
                                    <div className="mb-6 flex justify-center">
                                        <input type="number" min="1" max={selectedMed.stock_remain} value={data.quantity} onChange={e => setData('quantity', e.target.value)} required 
                                            className="w-32 text-center text-4xl font-black border-none rounded-2xl p-4 text-teal-700 bg-teal-50 outline-none ring-2 ring-teal-200 focus:ring-teal-500 shadow-inner transition-all" />
                                    </div>
                                    <div className="flex gap-3">
                                        <button type="button" onClick={() => { setSelectedMed(null); reset(); }} className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-3 px-4 rounded-2xl transition-all">
                                            Batal
                                        </button>
                                        <button type="submit" disabled={processing} className="flex-1 bg-teal-600 hover:bg-teal-700 text-white font-bold py-3 px-4 rounded-2xl shadow-lg shadow-teal-600/30 transition-all transform active:scale-95 disabled:opacity-70">
                                            Konfirmasi
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    </div>
                )}

                <div className="bg-white rounded-3xl shadow-xl shadow-slate-200/50 p-6 sm:p-8 border border-slate-100">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
                        <h3 className="text-xl font-extrabold text-slate-800 flex items-center gap-2">
                            Daftar Obat Tersedia
                        </h3>
                        <div className="w-full md:w-96 relative">
                            <span className="absolute left-4 top-3.5 text-slate-400">🔍</span>
                            <input type="text" placeholder="Cari nama obat..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full border-none ring-1 ring-slate-200 rounded-2xl pl-12 pr-4 py-3 bg-slate-50 text-slate-700 outline-none focus:ring-2 focus:ring-teal-500 focus:bg-white shadow-sm transition-all" />
                        </div>
                    </div>

                    {filteredStock.length === 0 ? (
                        <div className="bg-slate-50 p-10 rounded-2xl text-center border border-dashed border-slate-300">
                            <span className="text-4xl block mb-3">🍃</span>
                            <p className="text-slate-500 font-medium text-lg">Stok obat kosong atau tidak ditemukan.</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="bg-slate-50 text-slate-500 text-sm uppercase tracking-wider">
                                        <th className="p-5 font-bold rounded-tl-2xl">Nama Obat</th>
                                        <th className="p-5 font-bold">Harga Jual</th>
                                        <th className="p-5 font-bold text-center">Sisa Stok</th>
                                        <th className="p-5 font-bold">Tgl Expired</th>
                                        <th className="p-5 font-bold rounded-tr-2xl text-right">Aksi</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {filteredStock.map((med, idx) => (
                                        <tr key={idx} className={`hover:bg-slate-50/80 transition-all group ${getExpiryStyle(med.expired_date)}`}>
                                            <td className="p-5 font-bold text-slate-800">{med.name}</td>
                                            <td className="p-5 font-semibold text-teal-600">{formatRp(med.selling_price)}</td>
                                            <td className="p-5 text-center">
                                                <span className="bg-slate-100 text-slate-700 px-3 py-1 rounded-full text-sm font-bold border border-slate-200">
                                                    {med.stock_remain}
                                                </span>
                                            </td>
                                            <td className="p-5 font-medium text-slate-500">
                                                {new Date(med.expired_date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                                            </td>
                                            <td className="p-5 text-right">
                                                <button onClick={() => { setSelectedMed(med); setData('medicine_id', med.id); }}
                                                    className="bg-white text-teal-600 hover:bg-teal-600 hover:text-white border border-teal-200 font-bold py-2 px-5 rounded-xl shadow-sm text-sm transition-all transform active:scale-95">
                                                    Gunakan
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
}