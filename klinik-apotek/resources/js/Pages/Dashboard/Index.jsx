import React, { useState, useEffect } from 'react';
import { Head, useForm, Link, router } from '@inertiajs/react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

export default function Dashboard({ auth, financials, activeBatches, allMedicines, lowStockMedicines, filters }) {
    const isOwner = auth.user.role === 'owner';
    const [showMedForm, setShowMedForm] = useState(false);
    const [activeTx, setActiveTx] = useState(null);
    const [sortBy, setSortBy] = useState('alphabet'); 
    const [editingMed, setEditingMed] = useState(null);
    const [currentTime, setCurrentTime] = useState(new Date());

    const [filterType, setFilterType] = useState(filters.filter_type || 'monthly');
    const [filterValue, setFilterValue] = useState(filters.filter_value || '');

    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date()), 1000);
        const autoPoll = setInterval(() => {
            router.reload({ 
                only: ['activeBatches', 'financials', 'lowStockMedicines'], 
                preserveState: true, preserveScroll: true 
            });
        }, 5000); 

        return () => { clearInterval(timer); clearInterval(autoPoll); };
    }, [filterType, filterValue]);

    useEffect(() => {
        if (!filters.filter_value || filters.filter_type !== filterType) {
            const today = new Date();
            if (filterType === 'monthly') {
                setFilterValue(today.toISOString().substring(0, 7));
            } else {
                setFilterValue(today.getFullYear().toString());
            }
        }
    }, [filterType]);

    const { data: medData, setData: setMedData, post: postMed, processing: medProcessing, reset: resetMed, errors: medErrors } = useForm({
        name: '', purchase_price: '', selling_price: '', minimum_stock: 10
    });

    const { data: editData, setData: setEditData, put: putMed, processing: editProcessing, reset: resetEdit, errors: editErrors } = useForm({
        name: '', purchase_price: '', selling_price: '', minimum_stock: ''
    });

    const { data: txData, setData: setTxData, post: postTx, processing: txProcessing, reset: resetTx, errors: txErrors } = useForm({
        medicine_id: '', type: '', quantity: '', expired_date: ''
    });

    const submitMedicine = (e) => { e.preventDefault(); postMed('/admin/medicines', { onSuccess: () => { resetMed(); setShowMedForm(false); } }); };
    const submitEditMedicine = (e) => { e.preventDefault(); putMed(`/admin/medicines/${editingMed.id}`, { onSuccess: () => { resetEdit(); setEditingMed(null); } }); };
    const openEditForm = (med) => { setEditingMed(med); setEditData({ name: med.name, purchase_price: med.purchase_price, selling_price: med.selling_price, minimum_stock: med.minimum_stock }); };
    const openTransaction = (type) => { setActiveTx(type); setTxData({ medicine_id: '', type: type, quantity: '', expired_date: '' }); setShowMedForm(false); };
    const submitTransaction = (e) => { e.preventDefault(); postTx('/admin/transactions', { onSuccess: () => { resetTx(); setActiveTx(null); } }); };
    const applyDateFilter = () => { router.get('/admin', { filter_type: filterType, filter_value: filterValue }, { preserveState: true }); };

    const formatRp = (angka) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(angka);
    
    const CustomTooltip = ({ active, payload, label }) => {
        if (active && payload && payload.length) {
            return (
                <div className="bg-white p-4 border border-slate-200 rounded-xl shadow-lg">
                    <p className="font-bold text-slate-800 mb-2 border-b pb-1">{label}</p>
                    {payload.map((entry, index) => (
                        <p key={index} style={{ color: entry.color }} className="text-sm font-semibold">
                            {entry.name}: {formatRp(entry.value)}
                        </p>
                    ))}
                </div>
            );
        }
        return null;
    };

    const getExpiryStyle = (dateStr) => {
        if (!dateStr) return ''; 
        const diffDays = Math.ceil((new Date(dateStr) - new Date()) / (1000 * 60 * 60 * 24));
        if (diffDays <= 30) return 'bg-red-50 text-red-700 border-l-4 border-red-500';
        if (diffDays <= 60) return 'bg-orange-50 text-orange-700 border-l-4 border-orange-400';
        return 'border-l-4 border-transparent';
    };

    const displayedBatches = [...activeBatches].sort((a, b) => {
        if (sortBy === 'expiry') {
            if (!a.expired_date) return 1; if (!b.expired_date) return -1;
            return new Date(a.expired_date) - new Date(b.expired_date);
        }
        return a.medicine_name.localeCompare(b.medicine_name);
    });

    const currentYear = new Date().getFullYear();
    const yearsList = Array.from({ length: 10 }, (_, i) => currentYear - 5 + i);

    return (
        <div className="min-h-screen bg-slate-50 font-sans pb-12 relative">
            <Head title="Dashboard Admin" />
            
            <header className="bg-white border-b border-slate-200 px-8 py-5 flex flex-wrap justify-between items-center sticky top-0 z-30 shadow-sm gap-4">
                <div className="flex items-center gap-3">
                    <div className="bg-teal-600 p-2 rounded-lg text-white"><span className="text-xl">⚕️</span></div>
                    <div>
                        <h1 className="text-xl font-extrabold text-slate-800">Manajemen Apotek</h1>
                        <p className="text-slate-400 text-xs font-bold uppercase tracking-wider">Login sebagai: {isOwner ? '👑 Pemilik / Manajer' : '👨‍💻 Staf Kasir'}</p>
                    </div>
                </div>
                <div className="bg-slate-900 text-teal-400 px-5 py-2 rounded-2xl font-mono text-sm font-bold shadow-inner flex items-center gap-2 border border-slate-800">
                    <span>⏱️ LIVE:</span>
                    <span>{currentTime.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })} | {currentTime.toLocaleTimeString('id-ID')}</span>
                </div>
                <div className="flex gap-3 items-center">
                    {isOwner && (<button onClick={() => { setShowMedForm(true); setActiveTx(null); }} className="bg-slate-800 hover:bg-slate-900 text-white font-bold py-2 px-5 rounded-xl text-sm transition-all">+ Master Obat</button>)}
                    <button onClick={() => openTransaction('in')} className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-5 rounded-xl text-sm transition-all">↓ Stok Masuk</button>
                    <button onClick={() => openTransaction('out')} className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2 px-5 rounded-xl text-sm transition-all">↑ Stok Keluar</button>
                    <div className="w-px h-8 bg-slate-200 mx-2"></div>
                    <Link href={route('logout')} method="post" as="button" className="text-slate-400 font-bold hover:text-red-500 text-sm transition-colors">Logout ⏏</Link>
                </div>
            </header>

            {/* MODAL TAMBAH MASTER */}
            {showMedForm && isOwner && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
                    <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-2xl overflow-hidden">
                        <div className="bg-slate-800 p-6 text-center relative">
                            <button onClick={() => { setShowMedForm(false); resetMed(); }} className="absolute top-6 right-6 text-slate-300 hover:text-white font-bold text-xl">✕</button>
                            <h3 className="text-2xl font-extrabold text-white">➕ Daftarkan Master Obat</h3>
                        </div>
                        <div className="p-8">
                            <form onSubmit={submitMedicine} className="grid grid-cols-1 md:grid-cols-3 gap-5">
                                <div className="md:col-span-3">
                                    <label className="block text-sm font-bold text-slate-600 mb-2">Nama Obat</label>
                                    <input type="text" value={medData.name} onChange={e => setMedData('name', e.target.value)} required className="w-full ring-1 ring-slate-200 rounded-xl p-3 bg-slate-50 focus:bg-white outline-none focus:ring-2 focus:ring-slate-800" />
                                    {medErrors.name && <span className="text-red-500 text-xs font-bold mt-2 block">{medErrors.name}</span>}
                                </div>
                                <div><label className="block text-sm font-bold text-slate-600 mb-2">Harga Modal</label><input type="number" min="0" value={medData.purchase_price} onChange={e => setMedData('purchase_price', e.target.value)} required className="w-full ring-1 ring-slate-200 rounded-xl p-3 bg-slate-50" /></div>
                                <div><label className="block text-sm font-bold text-slate-600 mb-2">Harga Jual</label><input type="number" min="0" value={medData.selling_price} onChange={e => setMedData('selling_price', e.target.value)} required className="w-full ring-1 ring-slate-200 rounded-xl p-3 bg-slate-50" /></div>
                                <div><label className="block text-sm font-bold text-slate-600 mb-2">Min Stok</label><input type="number" min="1" value={medData.minimum_stock} onChange={e => setMedData('minimum_stock', e.target.value)} required className="w-full ring-1 ring-slate-200 rounded-xl p-3 bg-slate-50" /></div>
                                <div className="md:col-span-3 mt-4 flex gap-3">
                                    <button type="button" onClick={() => { setShowMedForm(false); resetMed(); }} className="flex-1 bg-slate-100 font-bold py-3 rounded-xl">Batal</button>
                                    <button type="submit" disabled={medProcessing} className="flex-1 bg-slate-800 text-white font-bold py-3 rounded-xl">Simpan Master Data</button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}

            {/* MODAL EDIT MASTER */}
            {editingMed && isOwner && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
                    <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-2xl overflow-hidden ring-4 ring-amber-500/20">
                        <div className="bg-amber-500 p-6 text-center relative">
                            <button onClick={() => { setEditingMed(null); resetEdit(); }} className="absolute top-6 right-6 text-amber-100 hover:text-white font-bold text-xl">✕</button>
                            <h3 className="text-2xl font-extrabold text-white">✏️ Edit Master Obat</h3>
                        </div>
                        <div className="p-8">
                            <form onSubmit={submitEditMedicine} className="grid grid-cols-1 md:grid-cols-3 gap-5">
                                <div className="md:col-span-3">
                                    <label className="block text-sm font-bold text-slate-600 mb-2">Nama Obat</label>
                                    <input type="text" value={editData.name} onChange={e => setEditData('name', e.target.value)} required className="w-full ring-1 ring-slate-200 rounded-xl p-3 bg-slate-50 focus:bg-white outline-none focus:ring-2 focus:ring-amber-500" />
                                    {editErrors.name && <span className="text-red-500 text-xs font-bold mt-2 block">{editErrors.name}</span>}
                                </div>
                                <div><label className="block text-sm font-bold text-slate-600 mb-2">Harga Modal</label><input type="number" min="0" value={editData.purchase_price} onChange={e => setEditData('purchase_price', e.target.value)} required className="w-full ring-1 ring-slate-200 rounded-xl p-3 bg-slate-50" /></div>
                                <div><label className="block text-sm font-bold text-slate-600 mb-2">Harga Jual</label><input type="number" min="0" value={editData.selling_price} onChange={e => setEditData('selling_price', e.target.value)} required className="w-full ring-1 ring-slate-200 rounded-xl p-3 bg-slate-50" /></div>
                                <div><label className="block text-sm font-bold text-slate-600 mb-2">Min Stok</label><input type="number" min="1" value={editData.minimum_stock} onChange={e => setEditData('minimum_stock', e.target.value)} required className="w-full ring-1 ring-slate-200 rounded-xl p-3 bg-slate-50" /></div>
                                <div className="md:col-span-3 mt-4 flex gap-3">
                                    <button type="button" onClick={() => { setEditingMed(null); resetEdit(); }} className="flex-1 bg-slate-100 font-bold py-3 rounded-xl">Batal</button>
                                    <button type="submit" disabled={editProcessing} className="flex-1 bg-amber-500 text-white font-bold py-3 rounded-xl">Simpan Perubahan</button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}

            {/* MODAL TRANSAKSI */}
            {activeTx && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
                    <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-lg overflow-hidden">
                        <div className={`p-6 text-center relative ${activeTx === 'in' ? 'bg-blue-600' : 'bg-emerald-600'}`}>
                            <button onClick={() => { setActiveTx(null); resetTx(); }} className="absolute top-6 right-6 text-white/70 hover:text-white font-bold text-xl">✕</button>
                            <h3 className="text-2xl font-extrabold text-white">{activeTx === 'in' ? '📥 Stok Masuk' : '📤 Stok Keluar'}</h3>
                        </div>
                        <div className="p-8">
                            <form onSubmit={submitTransaction} className="flex flex-col gap-5">
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-2">Pilih Obat</label>
                                    <select value={txData.medicine_id} onChange={e => setTxData('medicine_id', e.target.value)} required className="w-full ring-1 ring-slate-200 rounded-xl p-3 bg-slate-50 focus:ring-2 focus:ring-blue-500">
                                        <option value="">-- Cari Obat --</option>
                                        {allMedicines.map(med => <option key={med.id} value={med.id}>{med.name} (Sisa: {med.stock})</option>)}
                                    </select>
                                </div>
                                <div className={activeTx === 'in' ? 'grid grid-cols-2 gap-4' : ''}>
                                    <div><label className="block text-sm font-bold text-slate-700 mb-2">Jumlah</label><input type="number" min="1" value={txData.quantity} onChange={e => setTxData('quantity', e.target.value)} required className="w-full ring-1 ring-slate-200 rounded-xl p-3 bg-slate-50 focus:ring-2 focus:ring-blue-500" /></div>
                                    {activeTx === 'in' && (
                                        <div><label className="block text-sm font-bold text-slate-700 mb-2">Expired Date</label><input type="date" value={txData.expired_date} onChange={e => setTxData('expired_date', e.target.value)} required className="w-full ring-1 ring-slate-200 rounded-xl p-3 bg-slate-50 focus:ring-2 focus:ring-blue-500" /></div>
                                    )}
                                </div>
                                <div className="mt-4 flex gap-3">
                                    <button type="button" onClick={() => { setActiveTx(null); resetTx(); }} className="flex-1 bg-slate-100 font-bold py-3 rounded-xl">Batal</button>
                                    <button type="submit" disabled={txProcessing} className={`flex-1 font-bold py-3 rounded-xl text-white ${activeTx === 'in' ? 'bg-blue-600' : 'bg-emerald-600'}`}>Konfirmasi</button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}

            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
                
                {/* 1. KARTU REKAP FINANSIAL (Khusus Owner) */}
                {isOwner && (
                    <div className="bg-white rounded-3xl shadow-sm p-6 mb-8 border border-slate-200">
                        <div className="flex flex-col md:flex-row justify-between items-end md:items-center gap-4 mb-6">
                            <div>
                                <h3 className="text-xl font-extrabold text-slate-800">Laporan Finansial Klinik</h3>
                                <p className="text-slate-500 text-sm">Analisis performa pendapatan terfilter</p>
                            </div>
                            
                            <div className="flex flex-wrap gap-2 items-center bg-slate-100 p-1.5 rounded-2xl border border-slate-200">
                                <select value={filterType} onChange={e => setFilterType(e.target.value)} className="border-none bg-white rounded-xl p-2 text-sm font-bold text-slate-700 outline-none shadow-sm">
                                    <option value="monthly">📅 Filter Bulanan</option>
                                    <option value="yearly">🏢 Filter Tahunan</option>
                                </select>
                                {filterType === 'monthly' ? (
                                    <input type="month" value={filterValue} onChange={e => setFilterValue(e.target.value)} className="border-none rounded-xl p-2 text-sm font-bold bg-white text-slate-700 outline-none shadow-sm" />
                                ) : (
                                    <select value={filterValue} onChange={e => setFilterValue(e.target.value)} className="border-none rounded-xl p-2 text-sm font-bold bg-white text-slate-700 outline-none shadow-sm min-w-[100px]">
                                        {yearsList.map(y => <option key={y} value={y}>{y}</option>)}
                                    </select>
                                )}
                                <button onClick={applyDateFilter} className="bg-teal-600 hover:bg-teal-700 text-white px-4 py-2 rounded-xl text-sm font-bold shadow-sm transition-all">Terapkan</button>
                                <a href={`/admin/export-csv?filter_type=${filterType}&filter_value=${filterValue}`} className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 shadow-sm transition-all">📥 Excel</a>
                            </div>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div className="bg-gradient-to-br from-indigo-500 to-blue-600 p-6 rounded-2xl text-white">
                                <p className="text-blue-100 font-semibold uppercase text-xs">Pendapatan Kotor</p>
                                <p className="text-3xl font-extrabold">{formatRp(financials.revenue)}</p>
                            </div>
                            <div className="bg-gradient-to-br from-rose-500 to-red-600 p-6 rounded-2xl text-white">
                                <p className="text-rose-100 font-semibold uppercase text-xs">Modal Obat Terjual (HPP)</p>
                                <p className="text-3xl font-extrabold">{formatRp(financials.capital)}</p>
                            </div>
                            <div className="bg-gradient-to-br from-teal-500 to-emerald-600 p-6 rounded-2xl text-white ring-4 ring-emerald-500/30">
                                <p className="text-teal-100 font-semibold uppercase text-xs">Laba Bersih Terfilter</p>
                                <p className="text-4xl font-black">{formatRp(financials.net_profit)}</p>
                            </div>
                        </div>
                    </div>
                )}

                {/* 2. PERINGATAN STOK HABIS */}
                {lowStockMedicines.length > 0 && (
                    <div className="bg-rose-50 border-2 border-rose-200 rounded-3xl p-6 mb-8 shadow-sm">
                        <h3 className="text-lg font-bold text-rose-800 mb-4">🚨 Peringatan: Stok Hampir Habis!</h3>
                        <div className="flex flex-wrap gap-3">
                            {lowStockMedicines.map(med => (
                                <div key={med.id} className="bg-white px-4 py-2 rounded-xl shadow-sm border border-rose-100">
                                    <span className="font-bold text-slate-700">{med.name}</span>
                                    <span className="ml-2 bg-rose-600 text-white text-xs px-2 py-1 rounded-full font-bold">
                                        Sisa: {med.stock} (Min: {med.minimum_stock})
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* 3. MONITOR STOK PER BATCH */}
                <div className="bg-white rounded-3xl shadow-sm p-6 sm:p-8 border border-slate-200 mb-8">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
                        <h3 className="text-xl font-extrabold text-slate-800">📊 Monitor Stok per Batch</h3>
                        <div className="flex items-center gap-3">
                            <label className="text-sm font-bold text-slate-500">Urutkan:</label>
                            <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} className="ring-1 ring-slate-200 rounded-xl p-2 bg-slate-50 text-sm font-bold">
                                <option value="alphabet">🔤 Abjad (A-Z)</option>
                                <option value="expiry">⚠️ Kedaluwarsa Terdekat</option>
                            </select>
                        </div>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-slate-50 text-slate-500 text-sm uppercase">
                                    <th className="p-4 font-bold rounded-tl-xl">Nama Obat</th>
                                    <th className="p-4 font-bold text-center">Sisa Stok (Batch)</th>
                                    <th className="p-4 font-bold rounded-tr-xl">Tanggal Expired</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {displayedBatches.map((batch) => (
                                    <tr key={batch.id} className={`hover:bg-slate-50/50 ${getExpiryStyle(batch.expired_date)}`}>
                                        <td className="p-4 font-bold text-slate-800">{batch.medicine_name}</td>
                                        <td className="p-4 text-center">
                                            <span className="bg-slate-100 text-slate-700 px-3 py-1 rounded-full text-sm font-bold">
                                                {batch.stock_remain} unit
                                            </span>
                                        </td>
                                        <td className="p-4 font-medium text-slate-600">
                                            {batch.expired_date ? new Date(batch.expired_date).toLocaleDateString('id-ID') : '-'}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* 4. SECTION BARU: GRAFIK BAR (Khusus Owner, dipindah ke bawah Monitor Stok) */}
                {isOwner && (
                    <div className="bg-white rounded-3xl shadow-sm p-6 sm:p-8 border border-slate-200 mb-8">
                        <h3 className="text-xl font-extrabold text-slate-800 mb-6 flex items-center gap-2">
                            📈 Grafik Pendapatan & Laba Rugi
                        </h3>
                        <div className="h-80 w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={financials.chart_data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                                    <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#64748b' }} axisLine={false} tickLine={false} />
                                    <YAxis tickFormatter={(value) => `${value / 1000}k`} tick={{ fontSize: 12, fill: '#64748b' }} axisLine={false} tickLine={false} />
                                    <Tooltip content={<CustomTooltip />} cursor={{ fill: '#f8fafc' }} />
                                    <Legend wrapperStyle={{ paddingTop: '20px' }} />
                                    <Bar dataKey="Pendapatan" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                                    <Bar dataKey="Modal" fill="#f43f5e" radius={[4, 4, 0, 0]} />
                                    <Bar dataKey="Laba" fill="#10b981" radius={[4, 4, 0, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                )}

                {/* 5. DATABASE MASTER OBAT */}
                {isOwner && (
                    <div className="bg-white rounded-3xl shadow-sm p-6 sm:p-8 border border-slate-200 mb-8">
                        <h3 className="text-xl font-extrabold text-slate-800 mb-6 flex items-center gap-2">
                            📦 Database Master Obat
                        </h3>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="bg-slate-50 text-slate-500 text-sm uppercase">
                                        <th className="p-4 font-bold rounded-tl-xl">Nama Obat</th>
                                        <th className="p-4 font-bold">Harga Modal</th>
                                        <th className="p-4 font-bold">Harga Jual</th>
                                        <th className="p-4 font-bold text-center">Batas Minimum</th>
                                        <th className="p-4 font-bold text-center rounded-tr-xl">Aksi</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {allMedicines.map((med) => (
                                        <tr key={med.id} className="hover:bg-slate-50/50">
                                            <td className="p-4 font-bold text-slate-800">{med.name}</td>
                                            <td className="p-4 font-medium text-rose-600">{formatRp(med.purchase_price)}</td>
                                            <td className="p-4 font-bold text-emerald-600">{formatRp(med.selling_price)}</td>
                                            <td className="p-4 text-center font-bold text-slate-500">{med.minimum_stock}</td>
                                            <td className="p-4 text-center">
                                                <button onClick={() => openEditForm(med)} className="bg-amber-100 hover:bg-amber-200 text-amber-700 font-bold py-1 px-4 rounded-lg text-sm transition-all">
                                                    Edit Harga
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
}