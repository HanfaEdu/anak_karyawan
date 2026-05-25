import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { Search, Users, GraduationCap, Briefcase, User, Lightbulb, ChevronDown, ChevronUp, Loader2, AlertCircle, Building2, RefreshCw, X, Coins, Sparkles, MapPin } from 'lucide-react';

// IMPORT SENJATA RAHASIA (Animasi Berkelas Tinggi)
import { motion, AnimatePresence } from 'framer-motion';

// ==========================================
// 1. KONFIGURASI URL BACKEND (GAS)
// ==========================================
const GAS_URL = "https://script.google.com/macros/s/AKfycbyAuSYdm-IO9PqBBEC4CARCc7QkrLKsf1Cz2KsnHXoZqUeuC4YpBZo6qnw3vkLOUA2k/exec";

export default function App() {
  // ==========================================
  // 2. STATE MANAGEMENT
  // ==========================================
  const [dataKaryawan, setDataKaryawan] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false); 
  const [lastUpdated, setLastUpdated] = useState('');
  const [error, setError] = useState(null);

  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('Semua');
  const [expandedIds, setExpandedIds] = useState({});

  // ==========================================
  // 3. FETCH DATA DARI GOOGLE APPS SCRIPT
  // ==========================================
  const fetchData = useCallback(async (isBackground = false) => {
    if (GAS_URL === "TARUH_URL_WEB_APP_ANDA_DISINI") {
      setError("Silakan masukkan URL Web App Google Apps Script Anda pada variabel GAS_URL.");
      setIsLoading(false);
      return;
    }

    if (isBackground) {
      setIsSyncing(true);
    } else {
      setIsLoading(true);
    }

    try {
      const response = await fetch(GAS_URL, { redirect: 'follow' });
      const rawText = await response.text();

      try {
        const result = JSON.parse(rawText);

        if (result.status === 'success') {
          setDataKaryawan(result.data);
          setError(null); 

          const now = new Date();
          const timeString = now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
          setLastUpdated(timeString);
        } else {
          setError(`Pesan dari Server: ${result.message}`);
        }
      } catch (parseError) {
        console.error("Teks yang dikirim Google (Bukan JSON):", rawText);
        setError("Akses diblokir oleh Google! Silakan buka Apps Script Anda > Kelola Deployment > Edit > Wajib pilih 'Versi baru' pada kolom Versi > Terapkan.");
      }

    } catch (err) {
      console.error("Fetch error:", err);
      setError("Terjadi kesalahan jaringan (Network Error). Pastikan koneksi internet stabil atau matikan ekstensi AdBlocker jika ada.");
    } finally {
      setIsLoading(false);
      setIsSyncing(false);
    }
  }, []);

  useEffect(() => {
    fetchData(false);

    // Polling setiap 3 menit (180000 ms)
    const intervalId = setInterval(() => {
      fetchData(true);
    }, 180000);

    return () => clearInterval(intervalId);
  }, [fetchData]);

  // ==========================================
  // 4. FUNGSI BANTUAN (ACCORDION)
  // ==========================================
  const toggleExpand = (id) => {
    setExpandedIds(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  const toggleAll = (action) => {
    const newExpanded = {};
    if (action === 'expand') {
      filteredData.forEach(k => {
        newExpanded[k.id] = true;
      });
    }
    setExpandedIds(newExpanded);
  };

  // ==========================================
  // 5. LOGIKA PERHITUNGAN STATISTIK
  // ==========================================
  const stats = useMemo(() => {
    let totalKaryawan = dataKaryawan.length;
    let totalAnak = 0;
    let totalAnakSekolah = 0;
    let totalAnakLainnya = 0;

    dataKaryawan.forEach(karyawan => {
      totalAnak += karyawan.anak.length;
      karyawan.anak.forEach(a => {
        if (a.status.toLowerCase().includes("masih sekolah") || a.status.toLowerCase().includes("kuliah")) {
          totalAnakSekolah++;
        } else {
          totalAnakLainnya++;
        }
      });
    });

    const persentaseSekolah = totalAnak > 0 ? Math.round((totalAnakSekolah / totalAnak) * 100) : 0;
    const persentaseLainnya = totalAnak > 0 ? 100 - persentaseSekolah : 0;

    return { totalKaryawan, totalAnak, totalAnakSekolah, totalAnakLainnya, persentaseSekolah, persentaseLainnya };
  }, [dataKaryawan]);

  // ==========================================
  // 6. LOGIKA PENCARIAN & FILTER
  // ==========================================
  const filteredData = useMemo(() => {
    return dataKaryawan.filter(karyawan => {
      const matchSearch = karyawan.namaOrtu.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          karyawan.anak.some(a => a.nama.toLowerCase().includes(searchTerm.toLowerCase()));
      if (!matchSearch) return false;

      if (filterStatus === 'Semua') return true;
      
      const hasAnakSekolah = karyawan.anak.some(a => a.status.toLowerCase().includes("masih sekolah") || a.status.toLowerCase().includes("kuliah"));
      
      if (filterStatus === 'Ada Anak Sekolah') return hasAnakSekolah;
      if (filterStatus === 'Tidak Ada Anak Sekolah') return !hasAnakSekolah;
      
      return true;
    });
  }, [dataKaryawan, searchTerm, filterStatus]);

  // ==========================================
  // KONFIGURASI ANIMASI MOTION (Kurva Kecepatan Organik & Nyaman di Mata)
  // ==========================================
  const containerVariants = {
    hidden: { opacity: 0 },
    show: { 
      opacity: 1, 
      transition: { staggerChildren: 0.05, ease: [0.25, 1, 0.5, 1] } 
    }
  };
  
  const itemVariants = {
    hidden: { opacity: 0, y: 16, scale: 0.99 },
    show: { 
      opacity: 1, 
      y: 0, 
      scale: 1, 
      transition: { type: "spring", stiffness: 180, damping: 20 } 
    }
  };

  // ==========================================
  // 7. TAMPILAN (UI)
  // ==========================================
  return (
    <div className="min-h-screen bg-gradient-to-tr from-slate-100 via-[#f8fafc] to-indigo-50/40 p-4 md:p-8 font-sans text-slate-700 antialiased selection:bg-indigo-100 selection:text-indigo-900 relative overflow-x-hidden">
      
      {/* DEKORASI BULATAN AMBIEN MEWAH (Floating Soft Lighting) */}
      <div className="absolute top-[10%] left-[-5%] w-[45vw] h-[45vw] bg-indigo-200/20 rounded-full blur-[120px] pointer-events-none fixed" />
      <div className="absolute bottom-[20%] right-[-5%] w-[40vw] h-[40vw] bg-violet-200/25 rounded-full blur-[120px] pointer-events-none fixed" />
      
      {/* HEADER ELEGAN & PROFESIONAL */}
      <motion.div 
        initial={{ opacity: 0, y: -16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: [0.25, 1, 0.5, 1] }}
        className="bg-white/80 backdrop-blur-md rounded-3xl p-6 shadow-[0_4px_30px_rgba(0,0,0,0.015)] border border-white/60 mb-8 flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10"
      >
        <div className="flex items-center gap-6">
          {/* Logo Frame Premium */}
          <div className="relative bg-white p-3 rounded-2xl border border-slate-100 flex items-center justify-center shrink-0 w-16 h-16 md:w-20 md:h-20 shadow-[0_8px_20px_rgba(0,0,0,0.02)] hover:scale-[1.03] transition-all duration-300">
            <img 
              src="/logo.png" 
              alt="Logo BIAS Yaumi Fatimah" 
              className="w-full h-full object-contain rounded-xl"
              onError={(e) => {
                e.target.onerror = null;
                e.target.src = "/image.png";
                e.target.style.display = 'none';
                const fallbackIcon = document.getElementById('logo-fallback-icon');
                if (fallbackIcon) fallbackIcon.classList.remove('hidden');
              }}
            />
            <div id="logo-fallback-icon" className="hidden text-indigo-500">
              <Building2 size={36} />
            </div>
          </div>

          {/* Judul & Detail Branding */}
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[10px] font-bold tracking-widest text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-full border border-indigo-100/50 uppercase">
                BIAS Yaumi Fatimah
              </span>
              <span className="text-xs font-medium text-slate-400">
                • LPIT Terintegrasi Kudus
              </span>
            </div>
            <h1 className="text-xl md:text-2xl font-bold text-slate-800 mt-2 tracking-tight">
              Dashboard Rekap Data Anak
            </h1>
            <p className="text-xs md:text-sm text-slate-500 mt-1 max-w-xl font-medium">
              Sistem informasi interaktif rekapitulasi data putra-putri karyawan berbasis sinkronisasi data awan.
            </p>
          </div>
        </div>

        {/* Lencana Samping Kanan & Indikator Real-time (Desktop) */}
        <div className="hidden lg:flex flex-col gap-2 items-end">
          <div className="flex items-center gap-3 bg-slate-50/60 border border-slate-100 p-2.5 rounded-2xl">
            <div className="p-1.5 bg-white rounded-xl border border-slate-100 shadow-sm shrink-0">
              <img 
                src="/image.png" 
                alt="Favicon" 
                className="w-5 h-5 object-contain"
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.src = "/logo.png";
                }}
              />
            </div>
            <div className="text-left pr-4">
              <span className="block text-xs font-bold text-slate-700">Manajemen LPIT</span>
              <span className="block text-[10px] font-medium text-slate-400">Sistem Terintegrasi</span>
            </div>
          </div>
          
          {/* Real-time Sync Indicator */}
          <div className="flex items-center gap-2 text-[10px] text-slate-500 mr-1 bg-slate-100/60 px-3 py-1 rounded-full border border-slate-200/30">
            {isSyncing ? (
              <span className="flex items-center gap-1 text-indigo-600 font-semibold">
                <Loader2 size={10} className="animate-spin" /> Menyinkronkan...
              </span>
            ) : (
              <span className="flex items-center gap-1.5 font-medium">
                <span className="relative flex h-1.5 w-1.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500"></span>
                </span>
                Aktif (Terakhir: {lastUpdated || '-'})
              </span>
            )}
            <div className="w-[1px] h-2.5 bg-slate-300 mx-1" />
            <button 
              onClick={() => fetchData(true)} 
              disabled={isSyncing}
              className="hover:text-indigo-600 transition-colors p-0.5 rounded-md hover:bg-slate-200/60 active:scale-90"
              title="Segarkan data sekarang"
            >
              <RefreshCw size={10} className={isSyncing ? "animate-spin text-indigo-600" : "text-slate-400"} />
            </button>
          </div>
        </div>
      </motion.div>

      {/* Mobile Sync Indicator */}
      <div className="flex lg:hidden items-center justify-between bg-white/80 backdrop-blur-md rounded-2xl px-4 py-3 mb-6 text-xs text-slate-600 border border-slate-200/60 shadow-sm relative z-10">
        <div className="flex items-center gap-2">
          {isSyncing ? (
            <span className="flex items-center gap-1.5 text-indigo-600 font-semibold">
              <Loader2 size={12} className="animate-spin" /> Menyinkronkan...
            </span>
          ) : (
            <span className="flex items-center gap-1.5 font-medium">
              <span className="relative flex h-1.5 w-1.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500"></span>
              </span>
              Sinkron Aktif ({lastUpdated || '-'})
            </span>
          )}
        </div>
        <button 
          onClick={() => fetchData(true)} 
          disabled={isSyncing}
          className="flex items-center gap-1.5 text-indigo-600 font-semibold active:scale-95 transition-transform"
        >
          <RefreshCw size={12} className={isSyncing ? "animate-spin" : ""} />
          Segarkan
        </button>
      </div>

      {/* Tampilan Loading Utama */}
      {isLoading && dataKaryawan.length === 0 && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center justify-center py-24 bg-white/80 backdrop-blur-md rounded-3xl border border-white/60 shadow-sm relative z-10">
          <Loader2 className="w-10 h-10 text-indigo-600 animate-spin mb-3" />
          <p className="text-slate-700 font-semibold text-base">Menghubungkan Database...</p>
          <p className="text-slate-400 text-xs mt-1">Mengunduh data Google Spreadsheet real-time</p>
        </motion.div>
      )}

      {/* Tampilan Error */}
      {!isLoading && error && dataKaryawan.length === 0 && (
        <motion.div initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} className="flex flex-col items-center justify-center py-20 bg-rose-50/50 backdrop-blur-sm rounded-3xl border border-rose-100 text-center px-6 relative z-10">
          <AlertCircle className="w-12 h-12 text-rose-500 mb-3" />
          <h2 className="text-lg font-bold text-rose-800 mb-1">Gagal Menghubungkan Server</h2>
          <p className="text-rose-600/90 text-sm max-w-lg mb-6">{error}</p>
          <button 
            onClick={() => fetchData(false)} 
            className="px-5 py-2 bg-rose-600 hover:bg-rose-700 text-white font-semibold rounded-xl shadow-md transition-all active:scale-95 text-xs"
          >
            Coba Hubungkan Kembali
          </button>
        </motion.div>
      )}

      {/* Tampilan Utama Dashboard */}
      {dataKaryawan.length > 0 && (
        <div className="relative z-10">
          {/* Ringkasan Statistik Berdesain Premium */}
          <motion.div 
            variants={containerVariants}
            initial="hidden"
            animate="show" 
            className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8"
          >
            {/* Kartu 1: Total Karyawan */}
            <motion.div variants={itemVariants} className="bg-white/90 backdrop-blur-sm p-6 rounded-2xl shadow-[0_4px_20px_rgba(0,0,0,0.01)] border border-white flex flex-col justify-between hover:shadow-md transition-all duration-300 relative group overflow-hidden">
              <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-50/60 rounded-bl-full -mr-6 -mt-6 transition-all duration-300 group-hover:scale-105" />
              <div className="flex items-center gap-4 relative z-10">
                <div className="p-3 bg-indigo-50/80 text-indigo-600 rounded-xl"><Users size={20} /></div>
                <div>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Total Karyawan</p>
                  <p className="text-2xl font-bold text-slate-800 mt-0.5">{stats.totalKaryawan}</p>
                </div>
              </div>
              <div className="text-[11px] text-slate-400 mt-4 pt-3 border-t border-slate-100 font-medium relative z-10">
                Karyawan terdata mengisi kuesioner rekapitulasi data.
              </div>
            </motion.div>

            {/* Kartu 2: Anak Sekolah */}
            <motion.div variants={itemVariants} className="bg-white/90 backdrop-blur-sm p-6 rounded-2xl shadow-[0_4px_20px_rgba(0,0,0,0.01)] border border-white flex flex-col justify-between hover:shadow-md transition-all duration-300 relative group overflow-hidden">
              <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-50/60 rounded-bl-full -mr-6 -mt-6 transition-all duration-300 group-hover:scale-105" />
              <div className="flex items-center gap-4 relative z-10">
                <div className="p-3 bg-emerald-50/80 text-emerald-600 rounded-xl"><GraduationCap size={20} /></div>
                <div>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Anak Masih Sekolah / Kuliah</p>
                  <p className="text-2xl font-bold text-slate-800 mt-0.5">{stats.totalAnakSekolah} <span className="text-xs font-medium text-slate-400">anak</span></p>
                </div>
              </div>
              
              {/* Proportional Bar Rasio */}
              <div className="mt-4 pt-3 border-t border-slate-100 relative z-10">
                <div className="flex justify-between items-center text-[9px] font-bold text-slate-500 mb-1 tracking-wider uppercase">
                  <span>Rasio Sekolah</span>
                  <span>{stats.persentaseSekolah}%</span>
                </div>
                <div className="w-full h-1 bg-slate-100 rounded-full overflow-hidden">
                  <div className="h-full bg-emerald-500 rounded-full transition-all duration-1000" style={{ width: `${stats.persentaseSekolah}%` }} />
                </div>
              </div>
            </motion.div>

            {/* Kartu 3: Anak Lainnya */}
            <motion.div variants={itemVariants} className="bg-white/90 backdrop-blur-sm p-6 rounded-2xl shadow-[0_4px_20px_rgba(0,0,0,0.01)] border border-white flex flex-col justify-between hover:shadow-md transition-all duration-300 relative group overflow-hidden">
              <div className="absolute top-0 right-0 w-24 h-24 bg-amber-50/50 rounded-bl-full -mr-6 -mt-6 transition-all duration-300 group-hover:scale-105" />
              <div className="flex items-center gap-4 relative z-10">
                <div className="p-3 bg-amber-50/80 text-amber-600 rounded-xl"><Briefcase size={20} /></div>
                <div>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Bekerja / Menikah / Belum Sekolah</p>
                  <p className="text-2xl font-bold text-slate-800 mt-0.5">{stats.totalAnakLainnya} <span className="text-xs font-medium text-slate-400">anak</span></p>
                </div>
              </div>
              
              {/* Proportional Bar Rasio */}
              <div className="mt-4 pt-3 border-t border-slate-100 relative z-10">
                <div className="flex justify-between items-center text-[9px] font-bold text-slate-500 mb-1 tracking-wider uppercase">
                  <span>Rasio Non-Sekolah</span>
                  <span>{stats.persentaseLainnya}%</span>
                </div>
                <div className="w-full h-1 bg-slate-100 rounded-full overflow-hidden">
                  <div className="h-full bg-amber-500 rounded-full transition-all duration-1000" style={{ width: `${stats.persentaseLainnya}%` }} />
                </div>
              </div>
            </motion.div>
          </motion.div>

          {/* Bar Pencarian & Tombol Filter Kreatif */}
          <motion.div 
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="bg-white/80 backdrop-blur-md p-4 rounded-2xl shadow-[0_4px_20px_rgba(0,0,0,0.01)] border border-white/60 mb-6 flex flex-col lg:flex-row gap-4 justify-between items-center"
          >
            {/* Input Pencarian dengan Fitur Hapus Cepat */}
            <div className="relative w-full lg:w-96">
              <Search className="absolute left-3.5 top-1/2 transform -translate-y-1/2 text-slate-400" size={16} />
              <input 
                type="text" 
                placeholder="Cari nama Orang Tua atau Anak..." 
                className="w-full pl-10 pr-9 py-2.5 bg-slate-50/60 border border-slate-200/80 hover:border-slate-300 focus:border-indigo-400 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-100/50 transition-all text-xs md:text-sm font-medium text-slate-600 placeholder-slate-400"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <AnimatePresence>
                {searchTerm && (
                  <motion.button
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    onClick={() => setSearchTerm('')}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600 bg-slate-200/50 rounded-full hover:bg-slate-200 transition-all active:scale-90"
                  >
                    <X size={12} />
                  </motion.button>
                )}
              </AnimatePresence>
            </div>

            {/* Filter dengan Transisi Sliding Pill Dinamis */}
            <div className="flex p-1 bg-slate-100 rounded-xl w-full lg:w-auto overflow-x-auto relative">
              {['Semua', 'Ada Anak Sekolah', 'Tidak Ada Anak Sekolah'].map(filter => {
                const isActive = filterStatus === filter;
                return (
                  <button 
                    key={filter}
                    onClick={() => setFilterStatus(filter)}
                    className="relative px-4 py-2 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-colors duration-300 shrink-0 z-10 w-full lg:w-auto"
                  >
                    {isActive && (
                      <motion.div 
                        layoutId="activeFilterBg"
                        className="absolute inset-0 bg-indigo-600 rounded-lg shadow-sm"
                        transition={{ type: "spring", stiffness: 350, damping: 28 }}
                      />
                    )}
                    <span className={`relative z-20 transition-colors duration-200 ${isActive ? 'text-white' : 'text-slate-500 hover:text-slate-800'}`}>
                      {filter}
                    </span>
                  </button>
                );
              })}
            </div>
          </motion.div>

          {/* Kontrol Cepat Masal */}
          <div className="flex justify-between items-center mb-5 px-1">
            <p className="text-[9px] font-bold text-slate-400 tracking-widest uppercase">REKAPITULASI DATA ({filteredData.length} KARYAWAN)</p>
            <div className="flex gap-2.5">
              <button 
                onClick={() => toggleAll('expand')} 
                className="text-xs font-bold text-indigo-600 hover:text-indigo-700 bg-indigo-50/50 px-3.5 py-1.5 rounded-xl transition-all active:scale-95"
              >
                Buka Semua Detail
              </button>
              <button 
                onClick={() => toggleAll('collapse')} 
                className="text-xs font-bold text-slate-500 hover:text-slate-700 bg-slate-100/80 px-3.5 py-1.5 rounded-xl transition-all active:scale-95"
              >
                Tutup Semua
              </button>
            </div>
          </div>

          {/* List Karyawan */}
          <motion.div layout className="flex flex-col gap-4">
            <AnimatePresence>
              {filteredData.map((karyawan, index) => {
                const anakSekolah = karyawan.anak.filter(a => a.status.toLowerCase().includes("masih sekolah") || a.status.toLowerCase().includes("kuliah")).length;
                const anakLainnya = karyawan.anak.length - anakSekolah;
                const isExpanded = !!expandedIds[karyawan.id];

                return (
                  <motion.div 
                    layout
                    initial={{ opacity: 0, scale: 0.99 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.97 }}
                    transition={{ duration: 0.25 }}
                    key={karyawan.id} 
                    className={`bg-white rounded-2xl border transition-all duration-300 overflow-hidden ${
                      isExpanded 
                        ? 'border-indigo-200 shadow-[0_12px_24px_rgba(79,70,229,0.04)] ring-1 ring-indigo-400/5 border-l-4 border-l-indigo-600 scale-[1.002]' 
                        : 'border-slate-200 hover:border-slate-300 shadow-[0_2px_8px_rgba(0,0,0,0.005)]'
                    }`}
                  >
                    
                    {/* HEADER ACCORDION */}
                    <div 
                      onClick={() => toggleExpand(karyawan.id)}
                      className={`p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 cursor-pointer select-none transition-colors duration-200 ${
                        isExpanded ? 'bg-indigo-50/20 border-b border-slate-100' : 'hover:bg-slate-50/30'
                      }`}
                    >
                      <div className="flex items-center gap-4">
                        <div className={`p-2 rounded-xl transition-all duration-300 ${isExpanded ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/15' : 'bg-slate-100 text-slate-500'}`}>
                          <User size={16} />
                        </div>
                        <div>
                          <h3 className="text-sm md:text-base font-bold text-slate-800 tracking-tight">{karyawan.namaOrtu}</h3>
                          <p className="text-[10px] font-bold text-slate-400 mt-0.5 uppercase tracking-wider">ID: {karyawan.id}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-4 justify-between sm:justify-end">
                        <div className="flex flex-wrap gap-2 text-[10px] font-bold tracking-wide">
                          {anakSekolah > 0 && (
                            <span className="bg-emerald-50 text-emerald-700 border border-emerald-100/50 px-2.5 py-1 rounded-md flex items-center gap-1.5">
                              <GraduationCap size={12}/> {anakSekolah} Sekolah
                            </span>
                          )}
                          {anakLainnya > 0 && (
                            <span className="bg-slate-100 text-slate-600 border border-slate-200/50 px-2.5 py-1 rounded-md flex items-center gap-1.5">
                              <Briefcase size={12}/> {anakLainnya} Lainnya
                            </span>
                          )}
                          {karyawan.anak.length === 0 && (
                            <span className="bg-amber-50 text-amber-700 border border-amber-100/50 px-2.5 py-1 rounded-md">
                              Belum Mengisi Data
                            </span>
                          )}
                        </div>
                        
                        <motion.div 
                          animate={{ rotate: isExpanded ? 180 : 0 }} 
                          transition={{ type: "spring", stiffness: 220, damping: 20 }}
                          className="text-slate-400 shrink-0"
                        >
                          <ChevronDown size={18} className={isExpanded ? "text-indigo-600" : ""} />
                        </motion.div>
                      </div>
                    </div>

                    {/* DETAIL ANAK DENGAN ANIMASI LACI */}
                    <AnimatePresence>
                      {isExpanded && (
                        <motion.div 
                          key={`drawer-${karyawan.id}`}
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.35, ease: [0.25, 1, 0.5, 1] }}
                          className="overflow-hidden"
                        >
                          <div className="bg-slate-50/40 p-5 border-t border-slate-100/80">
                            {karyawan.anak.length === 0 ? (
                              <p className="text-xs text-slate-400 italic text-center py-4 font-medium">Karyawan ini belum mengisi data putra-putri.</p>
                            ) : (
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {karyawan.anak.map((anak, idx) => {
                                  const isSekolah = anak.status.toLowerCase().includes("masih sekolah") || anak.status.toLowerCase().includes("kuliah");
                                  return (
                                    <div 
                                      key={idx} 
                                      className={`p-4.5 rounded-xl border bg-white shadow-[0_2px_6px_rgba(0,0,0,0.005)] transition-all duration-300 relative overflow-hidden flex flex-col justify-between ${
                                        isSekolah ? 'border-indigo-100/60 hover:border-indigo-200' : 'border-slate-200/60 hover:border-slate-300'
                                      }`}
                                    >
                                      {isSekolah && (
                                        <div className="absolute top-0 right-0 w-10 h-10 bg-indigo-50/30 rounded-bl-full pointer-events-none" />
                                      )}

                                      <div>
                                        <div className="flex justify-between items-start mb-4 border-b border-slate-50 pb-3 gap-2">
                                          <h4 className="font-bold text-slate-800 text-sm tracking-tight flex items-center gap-1.5">
                                            <span className="flex items-center justify-center w-4.5 h-4.5 rounded-full bg-slate-100 text-slate-500 text-[10px] font-bold">{idx + 1}</span>
                                            {anak.nama}
                                          </h4>
                                          <span className={`text-[9px] tracking-widest font-bold px-2 py-0.5 rounded-full text-center shrink-0 border ${
                                            isSekolah ? 'bg-emerald-50/60 text-emerald-700 border-emerald-100' : 'bg-slate-50 text-slate-500 border-slate-200/60'
                                          }`}>
                                            {isSekolah ? 'SEKOLAH' : 'LAINNYA'}
                                          </span>
                                        </div>

                                        {isSekolah ? (
                                          <div className="flex flex-col gap-2 text-xs text-slate-600">
                                            {/* Baris Sekolah */}
                                            <div className="flex items-center gap-2.5 bg-slate-50/50 p-2 rounded-lg border border-slate-100/60">
                                              <div className="p-1 bg-white text-indigo-500 rounded border border-slate-200/30"><GraduationCap size={13} className="shrink-0" /></div>
                                              <div>
                                                <span className="block text-[8px] text-slate-400 font-bold uppercase tracking-wider">Sekolah & Kelas</span>
                                                <span className="font-semibold text-slate-700">{anak.sekolah || '-'} <span className="text-slate-400 font-medium">(Kelas {anak.kelas || '-'})</span></span>
                                              </div>
                                            </div>
                                            
                                            {/* Baris Keunggulan */}
                                            <div className="flex items-center gap-2.5 bg-slate-50/50 p-2 rounded-lg border border-slate-100/60">
                                              <div className="p-1 bg-white text-amber-500 rounded border border-slate-200/30"><Sparkles size={13} className="shrink-0" /></div>
                                              <div>
                                                <span className="block text-[8px] text-slate-400 font-bold uppercase tracking-wider">Keunggulan & Bakat</span>
                                                <span className="font-semibold text-slate-700">{anak.keunggulan || '-'}</span>
                                              </div>
                                            </div>
                                            
                                            {/* Baris Biaya */}
                                            <div className="flex items-center gap-2.5 bg-slate-50/50 p-2 rounded-lg border border-slate-100/60">
                                              <div className="p-1 bg-white text-emerald-500 rounded border border-slate-200/30"><Coins size={13} className="shrink-0" /></div>
                                              <div>
                                                <span className="block text-[8px] text-slate-400 font-bold uppercase tracking-wider">Estimasi Biaya per Tahun</span>
                                                <span className="font-semibold text-slate-700">{anak.biaya || '-'}</span>
                                              </div>
                                            </div>
                                          </div>
                                        ) : (
                                          <div className="flex items-center gap-2.5 text-xs text-slate-500 bg-slate-50/50 p-3 rounded-lg border border-slate-200/40 font-medium">
                                            <Briefcase size={13} className="shrink-0 text-slate-400" />
                                            {anak.status || 'Data status tidak tersedia'}
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            )}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                );
              })}
            </AnimatePresence>

            {/* State Kosong */}
            {filteredData.length === 0 && dataKaryawan.length > 0 && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="py-20 text-center text-slate-400 bg-white/80 backdrop-blur-md rounded-3xl border border-slate-200/50">
                <Search size={40} className="mx-auto text-slate-300 mb-3 opacity-60" />
                <p className="text-base font-bold text-slate-700 tracking-tight">Data tidak ditemukan</p>
                <p className="text-xs mt-1 text-slate-400 font-medium">Coba gunakan kata kunci nama orang tua atau anak yang lain.</p>
              </motion.div>
            )}
          </motion.div>
        </div>
      )}

    </div>
  );
}
