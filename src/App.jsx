import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { Search, Users, GraduationCap, Briefcase, User, Lightbulb, ChevronDown, ChevronUp, Loader2, AlertCircle, Building2, RefreshCw } from 'lucide-react';

// ==========================================
// 1. KONFIGURASI URL BACKEND (GAS)
// ==========================================
// URL GAS Anda telah berhasil dipasang di sini
const GAS_URL = "https://script.google.com/macros/s/AKfycbyAuSYdm-IO9PqBBEC4CARCc7QkrLKsf1Cz2KsnHXoZqUeuC4YpBZo6qnw3vkLOUA2k/exec";

export default function App() {
  // ==========================================
  // 2. STATE MANAGEMENT
  // ==========================================
  const [dataKaryawan, setDataKaryawan] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false); // Untuk melacak sinkronisasi latar belakang
  const [lastUpdated, setLastUpdated] = useState('');
  const [error, setError] = useState(null);

  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('Semua');
  const [expandedIds, setExpandedIds] = useState({});

  // ==========================================
  // 3. FETCH DATA DARI GOOGLE APPS SCRIPT
  // ==========================================
  const fetchData = useCallback(async (isBackground = false) => {
    // Pengecekan jika URL belum diganti
    if (GAS_URL === "TARUH_URL_WEB_APP_ANDA_DISINI") {
      setError("Silakan masukkan URL Web App Google Apps Script Anda pada variabel GAS_URL di dalam kode.");
      setIsLoading(false);
      return;
    }

    if (isBackground) {
      setIsSyncing(true);
    } else {
      setIsLoading(true);
    }

    try {
      // Menggunakan opsi redirect: 'follow' karena GAS sering melakukan redirect internal
      const response = await fetch(GAS_URL, { redirect: 'follow' });
      
      // KITA AMBIL SEBAGAI TEKS DULU (Untuk mengecek apakah Google mengirim HTML error atau JSON asli)
      const rawText = await response.text();

      try {
        // Mencoba mengubah teks menjadi format JSON
        const result = JSON.parse(rawText);

        if (result.status === 'success') {
          setDataKaryawan(result.data);
          setError(null); // Reset error jika pemuatan berikutnya berhasil

          // Catat waktu sinkronisasi sukses
          const now = new Date();
          const timeString = now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
          setLastUpdated(timeString);
        } else {
          // Ini jika nama sheet salah atau ada error dari dalam GAS
          setError(`Pesan dari Server: ${result.message}`);
        }
      } catch (parseError) {
        // JIKA ERROR MASUK KE SINI: Artinya Google mengirim halaman HTML Login/Error, bukan JSON.
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

  // Memulai sinkronisasi pertama kali dan memasang interval polling otomatis
  useEffect(() => {
    fetchData(false);

    // Polling otomatis data dari Spreadsheet setiap 60 detik (60000 ms)
    const intervalId = setInterval(() => {
      fetchData(true);
    }, 60000);

    // Bersihkan interval saat komponen di-unmount agar menghemat memori
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
        if (a.status.toLowerCase().includes("sekolah") || a.status.toLowerCase().includes("kuliah")) {
          totalAnakSekolah++;
        } else {
          totalAnakLainnya++;
        }
      });
    });

    return { totalKaryawan, totalAnak, totalAnakSekolah, totalAnakLainnya };
  }, [dataKaryawan]);

  // ==========================================
  // 6. LOGIKA PENCARIAN & FILTER
  // ==========================================
  const filteredData = useMemo(() => {
    return dataKaryawan.filter(karyawan => {
      // Pencarian berdasarkan nama ortu atau nama anak
      const matchSearch = karyawan.namaOrtu.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          karyawan.anak.some(a => a.nama.toLowerCase().includes(searchTerm.toLowerCase()));
      if (!matchSearch) return false;

      // Filter status anak
      if (filterStatus === 'Semua') return true;
      
      const hasAnakSekolah = karyawan.anak.some(a => a.status.toLowerCase().includes("sekolah") || a.status.toLowerCase().includes("kuliah"));
      
      if (filterStatus === 'Ada Anak Sekolah') return hasAnakSekolah;
      if (filterStatus === 'Tidak Ada Anak Sekolah') return !hasAnakSekolah;
      
      return true;
    });
  }, [dataKaryawan, searchTerm, filterStatus]);


  // ==========================================
  // 7. TAMPILAN (UI)
  // ==========================================
  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-8 font-sans text-slate-800">
      
      {/* HEADER CANTIK DENGAN LOGO DAN INSTITUSI */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200/80 mb-8 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-5">
          {/* Logo Frame */}
          <div className="relative bg-slate-50 p-2.5 rounded-2xl border border-slate-100 flex items-center justify-center shrink-0 w-16 h-16 md:w-20 md:h-20 shadow-inner">
            <img 
              src="/logo.png" 
              alt="Logo BIAS Yaumi Fatimah" 
              className="w-full h-full object-contain rounded-xl"
              onError={(e) => {
                // Fallback jika logo.png gagal dimuat, akan mencoba memakai image.png
                e.target.onerror = null;
                e.target.src = "/image.png";
                // Jika image.png juga tidak ada, tampilkan ikon default
                e.target.style.display = 'none';
                const fallbackIcon = document.getElementById('logo-fallback-icon');
                if (fallbackIcon) fallbackIcon.classList.remove('hidden');
              }}
            />
            {/* Fallback Icon jika semua gambar gagal */}
            <div id="logo-fallback-icon" className="hidden text-blue-600">
              <Building2 size={36} />
            </div>
          </div>

          {/* Judul & Detail Branding */}
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-bold tracking-widest text-blue-600 bg-blue-50 px-3 py-1 rounded-full border border-blue-100 uppercase">
                BIAS Yaumi Fatimah
              </span>
              <span className="text-xs font-medium text-slate-400">
                • LPIT Terintegrasi
              </span>
            </div>
            <h1 className="text-xl md:text-3xl font-extrabold text-slate-900 mt-2 tracking-tight">
              Dashboard Rekap Data Anak
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              Sistem informasi interaktif rekapitulasi data anak karyawan berbasis Google Formulir
            </p>
          </div>
        </div>

        {/* Lencana Samping Kanan & Indikator Real-time (Desktop) */}
        <div className="hidden lg:flex flex-col gap-2 items-end">
          <div className="flex items-center gap-3 bg-slate-50 border border-slate-100 p-3 rounded-xl max-w-xs">
            <div className="p-2 bg-white rounded-lg border border-slate-200/60 shadow-sm shrink-0">
              <img 
                src="/image.png" 
                alt="Favicon" 
                className="w-7 h-7 object-contain"
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.src = "/logo.png";
                }}
              />
            </div>
            <div className="text-left pr-2">
              <span className="block text-xs font-bold text-slate-700">Manajemen LPIT</span>
              <span className="block text-[10px] text-slate-400">Data Real-Time</span>
            </div>
          </div>
          
          {/* Real-time Sync Indicator */}
          <div className="flex items-center gap-1.5 text-[11px] text-slate-500 mr-1 bg-slate-100/60 px-2.5 py-1 rounded-full border border-slate-200/40">
            {isSyncing ? (
              <span className="flex items-center gap-1 text-blue-600 font-semibold">
                <Loader2 size={12} className="animate-spin" /> Menyinkronkan...
              </span>
            ) : (
              <span className="flex items-center gap-1.5">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
                Aktif (Terakhir: {lastUpdated || '-'})
              </span>
            )}
            <button 
              onClick={() => fetchData(true)} 
              disabled={isSyncing}
              className="hover:text-blue-600 transition-colors p-0.5 rounded-md hover:bg-slate-200/60"
              title="Segarkan data sekarang"
            >
              <RefreshCw size={11} className={isSyncing ? "animate-spin text-blue-600" : "text-slate-400"} />
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Sync Indicator (Ditampilkan hanya pada perangkat mobile di atas statistik) */}
      <div className="flex lg:hidden items-center justify-between bg-white rounded-xl px-4 py-2.5 mb-5 text-xs text-slate-600 border border-slate-200/60 shadow-sm">
        <div className="flex items-center gap-2">
          {isSyncing ? (
            <span className="flex items-center gap-1.5 text-blue-600 font-semibold">
              <Loader2 size={12} className="animate-spin" /> Sinkronisasi data...
            </span>
          ) : (
            <span className="flex items-center gap-1.5">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              Sinkron Aktif ({lastUpdated || '-'})
            </span>
          )}
        </div>
        <button 
          onClick={() => fetchData(true)} 
          disabled={isSyncing}
          className="flex items-center gap-1 text-blue-600 font-bold active:scale-95 transition-transform"
        >
          <RefreshCw size={12} className={isSyncing ? "animate-spin" : ""} />
          Segarkan
        </button>
      </div>

      {/* Tampilan Loading Utama (Hanya saat inisialisasi awal) */}
      {isLoading && dataKaryawan.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 bg-white rounded-xl shadow-sm border border-slate-200">
          <Loader2 className="w-12 h-12 text-blue-600 animate-spin mb-4" />
          <p className="text-slate-600 font-medium text-lg">Mengambil data dari Spreadsheet...</p>
          <p className="text-slate-400 text-sm mt-1">Harap tunggu sebentar</p>
        </div>
      )}

      {/* Tampilan Error */}
      {!isLoading && error && dataKaryawan.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 bg-red-50 rounded-xl shadow-sm border border-red-200 text-center px-4">
          <AlertCircle className="w-16 h-16 text-red-500 mb-4" />
          <h2 className="text-xl font-bold text-red-700 mb-2">Oops! Gagal Memuat Data</h2>
          <p className="text-red-600 max-w-lg">{error}</p>
        </div>
      )}

      {/* Tampilan Utama Dashboard */}
      {dataKaryawan.length > 0 && (
        <>
          {/* Ringkasan Statistik */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200/60 flex items-center gap-4">
              <div className="p-3 bg-blue-100 text-blue-600 rounded-lg"><Users size={24} /></div>
              <div>
                <p className="text-sm text-slate-500 font-medium">Total Karyawan Terdata</p>
                <p className="text-2xl font-bold text-slate-950">{stats.totalKaryawan}</p>
              </div>
            </div>
            <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200/60 flex items-center gap-4">
              <div className="p-3 bg-green-100 text-green-600 rounded-lg"><GraduationCap size={24} /></div>
              <div>
                <p className="text-sm text-slate-500 font-medium">Anak Masih Sekolah</p>
                <p className="text-2xl font-bold text-slate-950">{stats.totalAnakSekolah}</p>
              </div>
            </div>
            <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200/60 flex items-center gap-4">
              <div className="p-3 bg-slate-200 text-slate-600 rounded-lg"><Briefcase size={24} /></div>
              <div>
                <p className="text-sm text-slate-500 font-medium">Lainnya / Belum Sekolah</p>
                <p className="text-2xl font-bold text-slate-950">{stats.totalAnakLainnya}</p>
              </div>
            </div>
          </div>

          {/* Bar Pencarian & Tombol Aksi */}
          <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200/60 mb-6 flex flex-col md:flex-row gap-4 justify-between items-center">
            <div className="relative w-full md:w-96">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" size={20} />
              <input 
                type="text" 
                placeholder="Cari nama Ortu atau Anak..." 
                className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all text-sm"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <div className="flex flex-wrap gap-2 w-full md:w-auto">
              {['Semua', 'Ada Anak Sekolah', 'Tidak Ada Anak Sekolah'].map(filter => (
                <button 
                  key={filter}
                  onClick={() => setFilterStatus(filter)}
                  className={`px-4 py-1.5 rounded-lg text-xs font-semibold tracking-wide transition-all ${
                    filterStatus === filter 
                      ? 'bg-blue-600 text-white shadow-sm' 
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {filter.toUpperCase()}
                </button>
              ))}
            </div>
          </div>

          {/* Kontrol Cepat Masal */}
          <div className="flex justify-between items-center mb-4 px-1">
            <p className="text-xs font-bold text-slate-400 tracking-wider">HASIL PENCARIAN ({filteredData.length} KARYAWAN)</p>
            <div className="flex gap-2">
              <button 
                onClick={() => toggleAll('expand')} 
                className="text-xs font-semibold text-blue-600 hover:text-blue-700 bg-blue-50 hover:bg-blue-100 px-3 py-1 rounded-md transition-all"
              >
                Buka Semua Detail
              </button>
              <button 
                onClick={() => toggleAll('collapse')} 
                className="text-xs font-semibold text-slate-600 hover:text-slate-700 bg-slate-100 hover:bg-slate-200 px-3 py-1 rounded-md transition-all"
              >
                Tutup Semua
              </button>
            </div>
          </div>

          {/* List Karyawan */}
          <div className="flex flex-col gap-3">
            {filteredData.map((karyawan, index) => {
              const anakSekolah = karyawan.anak.filter(a => a.status.toLowerCase().includes("sekolah") || a.status.toLowerCase().includes("kuliah")).length;
              const anakLainnya = karyawan.anak.length - anakSekolah;
              const isExpanded = !!expandedIds[karyawan.id];

              return (
                <div 
                  key={karyawan.id} 
                  className={`bg-white rounded-xl border transition-all duration-200 ${
                    isExpanded 
                      ? 'border-blue-400 shadow-md ring-1 ring-blue-400/30' 
                      : 'border-slate-200 hover:border-slate-300 shadow-sm'
                  }`}
                >
                  
                  {/* HEADER ACCORDION */}
                  <div 
                    onClick={() => toggleExpand(karyawan.id)}
                    className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 cursor-pointer select-none"
                  >
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg transition-colors ${isExpanded ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600'}`}>
                        <User size={20} />
                      </div>
                      <div>
                        <h3 className="text-base font-bold text-slate-900">{karyawan.namaOrtu}</h3>
                        <p className="text-xs text-slate-400 mt-0.5">ID: {karyawan.id}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 justify-between sm:justify-end">
                      <div className="flex flex-wrap gap-2 text-xs">
                        {anakSekolah > 0 && (
                          <span className="bg-green-50 text-green-700 border border-green-200 font-bold px-2.5 py-1 rounded-md flex items-center gap-1.5">
                            <GraduationCap size={14}/> {anakSekolah} Sekolah
                          </span>
                        )}
                        {anakLainnya > 0 && (
                          <span className="bg-slate-100 text-slate-600 border border-slate-200 font-bold px-2.5 py-1 rounded-md flex items-center gap-1.5">
                            <Briefcase size={14}/> {anakLainnya} Lainnya
                          </span>
                        )}
                        {karyawan.anak.length === 0 && (
                          <span className="bg-amber-50 text-amber-700 border border-amber-200 font-bold px-2.5 py-1 rounded-md">
                            Belum Ada Data Anak
                          </span>
                        )}
                      </div>
                      
                      <div className="text-slate-400">
                        {isExpanded ? <ChevronUp size={20} className="text-blue-500" /> : <ChevronDown size={20} />}
                      </div>
                    </div>
                  </div>

                  {/* DETAIL ANAK */}
                  {isExpanded && (
                    <div className="border-t border-slate-100 bg-slate-50/50 p-4 rounded-b-xl">
                      {karyawan.anak.length === 0 ? (
                        <p className="text-sm text-slate-500 italic text-center py-4">Karyawan ini belum memasukkan data anak.</p>
                      ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {karyawan.anak.map((anak, idx) => {
                            const isSekolah = anak.status.toLowerCase().includes("sekolah") || anak.status.toLowerCase().includes("kuliah");
                            return (
                              <div 
                                key={idx} 
                                className={`p-4 rounded-xl border bg-white shadow-sm transition-all ${
                                  isSekolah ? 'border-blue-100/80' : 'border-slate-200/80'
                                }`}
                              >
                                <div className="flex justify-between items-start mb-3 border-b border-slate-50 pb-2">
                                  <h4 className="font-bold text-slate-800 text-sm md:text-base">
                                    {idx + 1}. {anak.nama}
                                  </h4>
                                  <span className={`text-[10px] tracking-wider font-extrabold px-2.5 py-1 rounded-full text-center ${
                                    isSekolah ? 'bg-green-100 text-green-700' : 'bg-slate-200 text-slate-600'
                                  }`}>
                                    {isSekolah ? 'SEKOLAH / KULIAH' : 'BELUM SEKOLAH / LAINNYA'}
                                  </span>
                                </div>

                                {isSekolah ? (
                                  <div className="flex flex-col gap-2 text-xs text-slate-600">
                                    <div className="flex items-center gap-2.5 bg-slate-50 p-2 rounded-lg border border-slate-100">
                                      <GraduationCap size={14} className="text-blue-500 shrink-0" />
                                      <div>
                                        <span className="block text-[10px] text-slate-400">Sekolah & Kelas</span>
                                        <span className="font-semibold text-slate-700">{anak.sekolah || '-'} <span className="text-slate-400 font-normal">(Kelas {anak.kelas || '-'})</span></span>
                                      </div>
                                    </div>
                                    <div className="flex items-center gap-2.5 bg-slate-50 p-2 rounded-lg border border-slate-100">
                                      <Lightbulb size={14} className="text-amber-500 shrink-0" />
                                      <div>
                                        <span className="block text-[10px] text-slate-400">Keunggulan Anak</span>
                                        <span className="font-semibold text-slate-700">{anak.keunggulan || '-'}</span>
                                      </div>
                                    </div>
                                    <div className="flex items-center gap-2.5 bg-slate-50 p-2 rounded-lg border border-slate-100">
                                      <span className="text-[10px] font-bold text-emerald-500 bg-emerald-50 w-5 h-5 rounded flex items-center justify-center shrink-0">Rp</span>
                                      <div>
                                        <span className="block text-[10px] text-slate-400">Biaya per Tahun</span>
                                        <span className="font-semibold text-slate-700">{anak.biaya || '-'}</span>
                                      </div>
                                    </div>
                                  </div>
                                ) : (
                                  <div className="flex items-center gap-2 text-xs text-slate-500 bg-slate-50 p-3 rounded-lg border border-slate-100 font-medium">
                                    <Briefcase size={14} className="shrink-0" />
                                    {anak.status || 'Data status tidak tersedia'}
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}

            {/* State Kosong jika hasil pencarian nihil */}
            {filteredData.length === 0 && dataKaryawan.length > 0 && (
              <div className="py-16 text-center text-slate-500 bg-white rounded-xl border border-dashed border-slate-300">
                <Search size={48} className="mx-auto text-slate-300 mb-4 opacity-50" />
                <p className="text-xl font-bold text-slate-700">Data tidak ditemukan</p>
                <p className="text-sm mt-1">Coba gunakan nama orang tua atau anak yang berbeda.</p>
              </div>
            )}
          </div>
        </>
      )}

    </div>
  );
}
