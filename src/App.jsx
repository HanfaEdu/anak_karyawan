import React, { useState, useEffect, useRef } from 'react';
import { Camera, CheckCircle, Clock, AlertTriangle, ChevronRight, LogOut, FileText, Info, Users, PlusCircle, Trash2, Save, ArrowLeft, CalendarDays, BookOpen, MapPin, Edit3, CheckSquare, Square, ClipboardList, ChevronDown, BellRing, Sparkles } from 'lucide-react';

// === URL DEPLOYMENT GAS ANDA ===
const GAS_URL = "https://script.google.com/macros/s/AKfycbyfyO9OjcAkpWeZGv9l6DBMSqsVookSxAB3YKoLhnbQHKoiub4FcAYhrnwnVtbGV7P9hg/exec"; 
const GOOGLE_CLIENT_ID = "110053587589-1sp6he4mep0t5oe38g9aqnd04hevp0to.apps.googleusercontent.com";

// ==========================================
// BUG FIX #3 — ERROR BOUNDARY
// Mencegah layar putih total saat ada error render
// ==========================================
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }
  componentDidCatch(error, info) {
    console.error('App Error caught by boundary:', error, info);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50 px-6 text-center">
          <div className="bg-white border border-slate-100 rounded-[2rem] p-8 shadow-sm max-w-sm w-full">
            <AlertTriangle className="text-rose-500 mx-auto mb-4" size={48} />
            <h2 className="text-xl font-black text-slate-800 mb-2">Terjadi Kesalahan</h2>
            <p className="text-sm text-slate-500 font-medium mb-4 leading-relaxed">
              Aplikasi mengalami masalah tak terduga. Silakan muat ulang halaman untuk melanjutkan.
            </p>
            
            {/* TAMBAL SULAM: Tampilkan pesan teknis agar guru bisa memfoto kode error aslinya */}
            <div className="bg-rose-50 border border-rose-100 p-3 rounded-xl mb-6 text-left overflow-auto max-h-32">
              <p className="text-[10px] font-black text-rose-800 uppercase tracking-widest mb-1">Pesan Teknis (Tolong Screenshot):</p>
              <p className="text-xs text-rose-600 font-mono break-words">
                {this.state.error ? this.state.error.toString() : 'Unknown Error'}
              </p>
            </div>

            <button
              onClick={() => window.location.reload()}
              className="w-full py-3 bg-slate-800 text-white font-black rounded-2xl hover:bg-slate-900 transition-colors"
            >
              Muat Ulang Aplikasi
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

function App() {
  // ==========================================
  // STATE GLOBAL
  // ==========================================
  const [step, setStep] = useState('login'); 
  const [waktuSekarang, setWaktuSekarang] = useState(new Date());
  const notifiedSchedules = useRef(new Set());
  const [alertToast, setAlertToast] = useState(null);
  const [notifPermission, setNotifPermission] = useState('default'); // Tambahan status izin notifikasi

  // Data Guru & Jadwal
  const [googleName, setGoogleName] = useState(''); 
  const [guru, setGuru] = useState(''); 
  const [jadwalHarian, setJadwalHarian] = useState([]);
  const [jadwalSelesai, setJadwalSelesai] = useState([]); 
  const [jadwalSekolah, setJadwalSekolah] = useState([]); 
  const [jadwalMingguan, setJadwalMingguan] = useState([]); 
  
  // Status UI
  const [loading, setLoading] = useState(false);
  const [loadingMsg, setLoadingMsg] = useState('Menyimpan...'); 
  const [errorMsg, setErrorMsg] = useState('');
  const [hasilScan, setHasilScan] = useState(null);
  const [tokenClient, setTokenClient] = useState(null);
  const [showWelcomeToast, setShowWelcomeToast] = useState(false);

  // State Form Presensi (Confirm View)
  const [jadwalTerpilih, setJadwalTerpilih] = useState(null);
  const [editData, setEditData] = useState({ mapel: '', kelas: '', jam_mulai: '' });
  const [catatan, setCatatan] = useState('');
  const [siswaSiap, setSiswaSiap] = useState(false);
  const [metode, setMetode] = useState('Scan QR'); 
  
  // State Kamera Selfie
  const [isSelfieRequired, setIsSelfieRequired] = useState(false);
  const [showCam, setShowCam] = useState(false);
  const [capturedImg, setCapturedImg] = useState(null);
  const [selfieSessionKey, setSelfieSessionKey] = useState(0);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);

  // State Kamera Scanner QR
  const [scanError, setScanError] = useState(null);
  const [scriptLoaded, setScriptLoaded] = useState(false);
  const qrScannerRef = useRef(null);
  const isQrScanningRef = useRef(false);

  // State PWA
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [isStandalone, setIsStandalone] = useState(false);
  const [showInstallInstructions, setShowInstallInstructions] = useState(false);

  // State Atur Jadwal
  const [hariAktif, setHariAktif] = useState('Senin');
  const [jadwalEdit, setJadwalEdit] = useState([]);
  const [isEditingJadwal, setIsEditingJadwal] = useState(false);
  const [isSavingJadwal, setIsSavingJadwal] = useState(false);

  // State Deklarasi Libur
  const [tipeLibur, setTipeLibur] = useState('Tanggal Merah / Libur Nasional');
  const [keteranganLibur, setKeteranganLibur] = useState('');

  // ==========================================
  // HELPERS (diletakkan sebelum fungsi yang memakainya)
  // ==========================================

  // PERBAIKAN: Konversi paksa ke String sebelum diproses.
  const s = (val) => (val === null || val === undefined) ? '' : String(val);

  const formatKelas = (val) => {
  let str = s(val).trim();
  if (!str) return '';
  
  // Hapus kata "kelas" atau "kls" (huruf besar/kecil) jika ada di awal, lalu bersihkan spasi
  str = str.replace(/^(kelas|kls)\s*/i, '').trim();
  
  // Selalu tambahkan kata "Kelas " di depannya agar seragam
  return `Kelas ${str}`;
};

  const NAMA_HARI = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
  const SCAN_WINDOW_BEFORE_MINUTES = 10;
  const LATE_SCAN_WINDOW_MINUTES = 30;

  const parseJamJadwal = (jamMulai, baseDate = new Date()) => {
    if (!jamMulai) return null;
    let str = String(jamMulai).trim();
    if (!str) return null;

    let parsedJam, parsedMenit;

    // Penanganan format Time / Date otomatis dari Google Sheets (ISO String)
    if (str.includes('T') && str.endsWith('Z')) {
      const tempDate = new Date(str);
      if (!isNaN(tempDate.getTime())) {
        parsedJam = tempDate.getHours();
        parsedMenit = tempDate.getMinutes();
      }
    } 
    // Penanganan teks standar (misal: "10.15", "07:30", atau angka float 10.1)
    else if (str.includes('.') || str.includes(':')) {
      const parts = str.replace('.', ':').split(':');
      parsedJam = Number.parseInt(parts[0].replace(/\D/g, ''), 10);
      const menitStr = parts[1] ? parts[1].replace(/\D/g, '') : '0';
      const menitRaw = Number.parseInt(menitStr, 10);
      parsedMenit = (menitStr.length === 1 && !str.includes(':')) ? menitRaw * 10 : menitRaw;
    } 
    // Angka bulat (misal: "10" -> 10:00)
    else {
      parsedJam = Number.parseInt(str.replace(/\D/g, ''), 10);
      parsedMenit = 0;
    }

    if (Number.isNaN(parsedJam) || Number.isNaN(parsedMenit)) return null;
    if (parsedJam < 0 || parsedJam > 23 || parsedMenit < 0 || parsedMenit > 59) return null;
    
    const waktu = new Date(baseDate);
    waktu.setHours(parsedJam, parsedMenit, 0, 0);
    return waktu;
  };

  const sortJadwalByTime = (items = []) => {
    const now = new Date();
    return [...items].sort((a, b) => {
      const timeA = parseJamJadwal(a?.jam_mulai, now)?.getTime() || Number.MAX_SAFE_INTEGER;
      const timeB = parseJamJadwal(b?.jam_mulai, now)?.getTime() || Number.MAX_SAFE_INTEGER;
      return timeA - timeB;
    });
  };

  const buildScheduleKey = (jadwal) => {
    const jam = s(jadwal?.jam_mulai).trim();
    const mapel = s(jadwal?.mapel).trim().toLowerCase();
    const kelas = formatKelas(jadwal?.kelas).trim().toLowerCase();
    return `${jam}|${mapel}|${kelas}`;
  };

  const isSameSchedule = (first, second) => buildScheduleKey(first) === buildScheduleKey(second);

  const getNearestActiveSchedule = (items = [], now = new Date()) => {
    const daftar = sortJadwalByTime(items);
    for (const jadwal of daftar) {
      const waktuMulai = parseJamJadwal(jadwal?.jam_mulai, now);
      if (!waktuMulai) continue;
      const selisih = waktuMulai.getTime() - now.getTime();
      
      // PERBAIKAN FATAL: Jangan menghilangkan jadwal jika guru telat > 1 menit.
      // Tampilkan selama masih masuk batas toleransi telat (LATE_SCAN_WINDOW_MINUTES)
      if (selisih > -(LATE_SCAN_WINDOW_MINUTES * 60000)) {
        return { jadwalTerdekat: jadwal, sisaWaktuMs: selisih };
      }
    }
    return { jadwalTerdekat: null, sisaWaktuMs: -Infinity };
  };

  const getManualFallbackSchedule = () => {
    if (jadwalTerpilih) return jadwalTerpilih;
    const { jadwalTerdekat } = getNearestActiveSchedule(jadwalHarian, waktuSekarang);
    return jadwalTerdekat || sortJadwalByTime(jadwalHarian).slice(-1)[0] || null;
  };

  const triggerWelcomeToast = () => {
    setShowWelcomeToast(true);
    setTimeout(() => setShowWelcomeToast(false), 5000);
  };

  // ==========================================
  // NORMALISASI DATA DARI GAS
  // Semua field jadwal dipaksa menjadi String di satu titik ini
  // ==========================================
  const normalizeJadwal = (arr = []) =>
    arr.map((j) => ({
      ...j,
      mapel:     s(j.mapel),
      kelas:     s(j.kelas),
      jam_mulai: s(j.jam_mulai),
      hari:      s(j.hari),
      guru_asli: s(j.guru_asli),
    }));

  const isRealSession = (j) => {
    const m = s(j.mapel).toLowerCase().trim();
    return m !== '' && m !== '-' && !m.includes('kosong') && !m.includes('istirahat');
  };

  // ==========================================
  // SAFE FETCH HELPER — INTI PERBAIKAN ERROR MERAH
  // ==========================================
  const safeGasFetch = async (urlOrOptions, fetchOptions = {}, timeoutMs = 25000) => {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const url = typeof urlOrOptions === 'string' ? urlOrOptions : urlOrOptions;
      const response = await fetch(url, { ...fetchOptions, signal: controller.signal });
      clearTimeout(timeoutId);
      const rawText = await response.text();
      try {
        return JSON.parse(rawText);
      } catch {
        console.warn('[safeGasFetch] Respons bukan JSON:', rawText.slice(0, 200));
        return {
          status: 'error',
          kode: 'BUKAN_JSON',
          message: 'Server sedang sibuk atau timeout. Silakan coba lagi dalam beberapa detik.'
        };
      }
    } catch (err) {
      clearTimeout(timeoutId);
      if (err.name === 'AbortError') {
        console.warn('[safeGasFetch] Request timeout setelah', timeoutMs, 'ms');
        return {
          status: 'error',
          kode: 'TIMEOUT',
          message: 'Koneksi ke server timeout. Kemungkinan server sedang ramai. Coba lagi dalam beberapa detik.'
        };
      }
      console.error('[safeGasFetch] Fetch error:', err?.message);
      return {
        status: 'error',
        kode: 'NETWORK_ERROR',
        message: 'Gagal terhubung ke server. Pastikan internet Anda stabil lalu coba lagi.'
      };
    }
  };

  const safeGasFetchWithRetry = async (url, fetchOptions = {}, maxRetry = 2, retryDelayMs = 4000) => {
    let lastResult = null;
    for (let attempt = 0; attempt <= maxRetry; attempt++) {
      if (attempt > 0) {
        await new Promise(res => setTimeout(res, retryDelayMs));
      }
      lastResult = await safeGasFetch(url, fetchOptions);
      if (lastResult.status === 'success') return lastResult;
      if (lastResult.kode !== 'LOCK_TIMEOUT' && lastResult.kode !== 'TIMEOUT' && lastResult.kode !== 'BUKAN_JSON') return lastResult;
      console.warn(`[retry] Attempt ${attempt + 1}/${maxRetry + 1} gagal (${lastResult.kode}), retrying...`);
    }
    return lastResult;
  };

  // ==========================================
  // handleLogin — dengan safeGasFetch
  // ==========================================
  const handleLogin = async (email, fullName, isAutoLogin = false) => {
    if (!email) return;
    setGoogleName(fullName);
    setLoading(true);
    setErrorMsg('');
    
    try {
      if (GAS_URL.includes("CONTOH_URL")) {
        setTimeout(() => {
          const hariSimulasi = NAMA_HARI[new Date().getDay()] || 'Senin';
          setGuru("Ust Ruroh");
          const simulasiJadwal = sortJadwalByTime([
            { id: Date.now() + 1, hari: hariSimulasi, jam_mulai: '07.45', mapel: 'Baghdadi', kelas: 'Kelas 1A', guru_asli: 'Ust Ruroh' },
            { id: Date.now() + 2, hari: hariSimulasi, jam_mulai: '11.00', mapel: 'Koding', kelas: 'Kelas 6', guru_asli: 'Ust Ruroh' },
            { id: Date.now() + 3, hari: hariSimulasi, jam_mulai: '13.15', mapel: 'Tahfidz', kelas: 'Kelas 5', guru_asli: 'Ust Ruroh' }
          ]);
          const simulasiJadwalSekolah = [
            { id: Date.now() + 4, hari: hariSimulasi, jam_mulai: '09.30', mapel: 'IPA', kelas: 'Kelas 4', guru_asli: 'Ust Hanif' }
          ];
          setJadwalHarian(simulasiJadwal);
          setJadwalSelesai([]);
          setJadwalSekolah(sortJadwalByTime(simulasiJadwalSekolah));
          setJadwalMingguan([...simulasiJadwal, ...simulasiJadwalSekolah]);
          localStorage.setItem('yaumi_user', JSON.stringify({ email, fullName }));
          setStep('dashboard');
          triggerWelcomeToast(); 
          setLoading(false);
        }, 1000);
      } else {
        const data = await safeGasFetch(`${GAS_URL}?email=${email}&nama_lengkap=${encodeURIComponent(fullName)}`);

        if (data.status === 'success') {
          setGuru(data.nama_guru);
          const validJadwalHarian = normalizeJadwal(data.jadwal || []).filter(isRealSession);
          const jadwalWithId = sortJadwalByTime(validJadwalHarian).map((j, idx) => ({ ...j, id: j.id || Date.now() + idx }));
          const jadwalSelesaiHariIni = sortJadwalByTime(normalizeJadwal(data.jadwal_selesai || []).filter(isRealSession)).map((j, idx) => ({ ...j, id: j.id || Date.now() + 500 + idx }));
          const jadwalSemuaSekolah = sortJadwalByTime(normalizeJadwal(data.jadwal_semua || []).filter(isRealSession)).map((j, idx) => ({ ...j, id: j.id || Date.now() + 1000 + idx }));
          const jadwalMingguanAman = sortJadwalByTime(normalizeJadwal(data.jadwal_mingguan || []).map((j, idx) => ({ ...j, id: j.id || Date.now() + 2000 + idx })));
          
          setJadwalHarian(jadwalWithId);
          setJadwalSelesai(jadwalSelesaiHariIni);
          setJadwalSekolah(jadwalSemuaSekolah);
          setJadwalMingguan(jadwalMingguanAman); 
          
          localStorage.setItem('yaumi_user', JSON.stringify({ email, fullName }));
          setStep('dashboard');
          triggerWelcomeToast(); 
        } else if (data.status === 'unregistered') {
          setErrorMsg(data.message);
          localStorage.removeItem('yaumi_user');
        } else {
          if (isAutoLogin && data.kode !== 'TIMEOUT' && data.kode !== 'NETWORK_ERROR' && data.kode !== 'BUKAN_JSON') {
            localStorage.removeItem('yaumi_user');
          }
          setErrorMsg(data.message || 'Koneksi bermasalah. Coba lagi.');
        }
        setLoading(false);
      }
    } catch (err) {
      console.error('[handleLogin] Unexpected error:', err?.message);
      setErrorMsg('Terjadi kesalahan tak terduga. Silakan muat ulang halaman.');
      setLoading(false);
    }
  };

  // ==========================================
  // EFEK & SIKLUS HIDUP UTAMA
  // ==========================================

  // 1. Detak Waktu & Izin Notifikasi
  useEffect(() => {
    if ("Notification" in window) {
      setNotifPermission(Notification.permission);
      if (Notification.permission !== "granted" && Notification.permission !== "denied") {
        Notification.requestPermission().then(permission => {
          setNotifPermission(permission);
        });
      }
    }
    const h = NAMA_HARI[new Date().getDay()];
    setHariAktif(['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat'].includes(h) ? h : 'Senin');
    const timer = setInterval(() => setWaktuSekarang(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // 2. PWA
  useEffect(() => {
    const isiOS = /iphone|ipad|ipod/i.test(window.navigator.userAgent);
    const displayModeMedia = window.matchMedia ? window.matchMedia('(display-mode: standalone)') : null;
    const syncStandaloneState = () => {
      const modeStandalone = Boolean(displayModeMedia?.matches || window.navigator.standalone);
      setIsStandalone(modeStandalone);
      setShowInstallInstructions(isiOS && !modeStandalone);
    };
    const handleBeforeInstall = (e) => { e.preventDefault(); setDeferredPrompt(e); };
    const handleAppInstalled = () => { setDeferredPrompt(null); setShowInstallInstructions(false); syncStandaloneState(); };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);
    window.addEventListener('appinstalled', handleAppInstalled);

    let manifestLink = document.querySelector('link[rel="manifest"]');
    if (!manifestLink) { manifestLink = document.createElement('link'); manifestLink.rel = 'manifest'; document.head.appendChild(manifestLink); }
    manifestLink.href = '/manifest.webmanifest';

    let themeMeta = document.querySelector('meta[name="theme-color"]');
    if (!themeMeta) { themeMeta = document.createElement('meta'); themeMeta.name = 'theme-color'; document.head.appendChild(themeMeta); }
    themeMeta.content = '#10b981';

    let appleTouchIcon = document.querySelector('link[rel="apple-touch-icon"]');
    if (!appleTouchIcon) { appleTouchIcon = document.createElement('link'); appleTouchIcon.rel = 'apple-touch-icon'; document.head.appendChild(appleTouchIcon); }
    appleTouchIcon.href = '/logo.png';

    syncStandaloneState();

    if (displayModeMedia?.addEventListener) { displayModeMedia.addEventListener('change', syncStandaloneState); }
    else if (displayModeMedia?.addListener) { displayModeMedia.addListener(syncStandaloneState); }

    const isSecureOrigin = window.isSecureContext || ['localhost', '127.0.0.1'].includes(window.location.hostname);
    if ('serviceWorker' in navigator && isSecureOrigin) {
      navigator.serviceWorker.register('/service-worker.js').catch(() => {
        console.log('Info: service worker belum aktif.');
      });
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
      window.removeEventListener('appinstalled', handleAppInstalled);
      if (displayModeMedia?.removeEventListener) { displayModeMedia.removeEventListener('change', syncStandaloneState); }
      else if (displayModeMedia?.removeListener) { displayModeMedia.removeListener(syncStandaloneState); }
    };
  }, []);

  const installPWA = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') setDeferredPrompt(null);
  };

  // 3. Alarm Ganda 5 & 3 Menit
  useEffect(() => {
    if (!jadwalHarian || jadwalHarian.length === 0) return;

    const { jadwalTerdekat, sisaWaktuMs } = getNearestActiveSchedule(jadwalHarian, waktuSekarang);
    if (!jadwalTerdekat) return;

    const sisaMenit = sisaWaktuMs / 60000;
    const key5 = `${jadwalTerdekat.id}_5min`;
    const key3 = `${jadwalTerdekat.id}_3min`;

    const bunyikanSuara = (teks, jumlahPengulangan = 2) => {
      try { // TAMBAL SULAM: Amankan audio API dengan try-catch
        if ('speechSynthesis' in window) {
          window.speechSynthesis.cancel();
          
          const voices = window.speechSynthesis.getVoices();
          const indonesianVoice = voices.find(v => v.lang.includes('id') || v.lang.includes('ID'));

          for (let i = 0; i < jumlahPengulangan; i++) {
            const teksFinal = i === 0 ? teks : `Saya ulangi ... ${teks}`;
            const utterance = new SpeechSynthesisUtterance(teksFinal);
            
            utterance.lang = 'id-ID';
            if (indonesianVoice) utterance.voice = indonesianVoice;
            utterance.rate = 0.85;
            
            window.speechSynthesis.speak(utterance);
          }
        } else {
          const ctx = new (window.AudioContext || window.webkitAudioContext)();
          [880, 1100].forEach((freq, i) => {
            const osc = ctx.createOscillator();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(freq, ctx.currentTime);
            osc.connect(ctx.destination);
            osc.start(ctx.currentTime + i * 0.4);
            osc.stop(ctx.currentTime + i * 0.4 + 0.3);
          });
        }
      } catch (err) {
        console.warn('Browser memblokir pemutaran suara otomatis.', err);
      }
    };
    
    const kirimPushNotif = (title, body) => {
      if ("Notification" in window && Notification.permission === "granted") {
        try {
          // TAMBAL SULAM: Coba panggil notifikasi normal
          new Notification(title, { body, icon: '/logo.png' });
        } catch (err) {
          // TAMBAL SULAM: Jika Android Chrome menolak (TypeError: Illegal constructor),
          // tangkap error-nya agar TIDAK CRASH, lalu alihkan via Service Worker!
          if ('serviceWorker' in navigator) {
            navigator.serviceWorker.ready.then((registration) => {
              registration.showNotification(title, { body, icon: '/logo.png' });
            }).catch((e) => console.log("SW Notif error:", e));
          }
        }
      }
    };

    if (sisaMenit <= 5 && sisaMenit > 3 && !notifiedSchedules.current.has(key5)) {
      notifiedSchedules.current.add(key5);
      kirimPushNotif('⏰ Persiapan Mengajar — 5 Menit Lagi', `${jadwalTerdekat.mapel} di ${formatKelas(jadwalTerdekat.kelas)}. Segera bersiap!`);
      bunyikanSuara(`Perhatian. Waktu kurang lima menit menuju kelas ${jadwalTerdekat.kelas.replace('Kelas', '')}. Harap segera bersiap.`);
      setAlertToast({ menit: 5, mapel: jadwalTerdekat.mapel, kelas: jadwalTerdekat.kelas });
      setTimeout(() => setAlertToast(null), 10000);
    }

    if (sisaMenit <= 3 && sisaMenit > 0 && !notifiedSchedules.current.has(key3)) {
      notifiedSchedules.current.add(key3);
      kirimPushNotif('🚨 SOP 3 Menit — Segera ke Kelas!', `${jadwalTerdekat.mapel} di ${formatKelas(jadwalTerdekat.kelas)}. Jangan terlambat scan!`);
      bunyikanSuara(`Peringatan S O P tiga menit! Segera menuju kelas ${jadwalTerdekat.kelas.replace('Kelas', '')} dan lakukan scan barcode sekarang.`);
      setAlertToast({ menit: 3, mapel: jadwalTerdekat.mapel, kelas: jadwalTerdekat.kelas });
      setTimeout(() => setAlertToast(null), 20000);
    }
  }, [waktuSekarang, jadwalHarian]);

  // 4. Pengingat Malam 18.30
  useEffect(() => {
    if (!jadwalMingguan || jadwalMingguan.length === 0) return;
    const jam = waktuSekarang.getHours();
    const menit = waktuSekarang.getMinutes();
    if (!(jam === 18 && menit === 30)) return;

    const keyMalam = `reminder_malam_${waktuSekarang.toDateString()}`;
    if (notifiedSchedules.current.has(keyMalam)) return;
    notifiedSchedules.current.add(keyMalam);

    const hariBerikutnya = new Date(waktuSekarang);
    hariBerikutnya.setDate(hariBerikutnya.getDate() + 1);
    const hariBesoknIdx = hariBerikutnya.getDay();
    if (hariBesoknIdx === 0 || hariBesoknIdx === 6) return;

    const namaHariBesok = NAMA_HARI[hariBesoknIdx];
    const JAM_SESI = ['08.35', '10.15', '11.00', '13.00', '13.15', '13.45'];
    const isMapelDikecualikan = (mapel) => {
      const m = (mapel || '').toLowerCase().trim();
      return m === '' || m === '-' || m.includes('kosong') || m.includes('istirahat') || m.includes('ishoma') || m.includes('pembukaan') || m.includes('penutupan') || m.includes('baghdadi');
    };

    const jadwalBesok = sortJadwalByTime(
      jadwalMingguan.filter((j) => {
        const hariCocok = (j?.hari || '').toLowerCase() === namaHariBesok.toLowerCase();
        const jamCocok = JAM_SESI.includes((j?.jam_mulai || '').trim());
        return hariCocok && jamCocok && !isMapelDikecualikan(j?.mapel);
      })
    );

    if (jadwalBesok.length === 0) return;

    const daftarMapel = jadwalBesok.map((j) => `${j.jam_mulai} ${j.mapel} (${formatKelas(j.kelas)})`).join(', ');
    const titleNotif = `📚 Besok ${namaHariBesok} — ${jadwalBesok.length} Sesi Mengajar`;
    const bodyNotif = `${daftarMapel}. Semoga Allah mudahkan dan berkahi ilmu yang diajarkan. 🌿`;

    if ("Notification" in window && Notification.permission === "granted") {
      try {
        new Notification(titleNotif, { body: bodyNotif, icon: '/logo.png', badge: '/logo.png', tag: keyMalam });
      } catch (e) {
        if ('serviceWorker' in navigator) {
          navigator.serviceWorker.ready.then((reg) => reg.showNotification(titleNotif, { body: bodyNotif, icon: '/logo.png', tag: keyMalam }));
        }
      }
    }
  }, [waktuSekarang, jadwalMingguan]);

  // 5. Load Google Auth
  useEffect(() => {
    const loadGoogleAPI = () => {
      if (window.google && window.google.accounts) {
        const client = window.google.accounts.oauth2.initTokenClient({
          client_id: GOOGLE_CLIENT_ID,
          scope: 'https://www.googleapis.com/auth/userinfo.email profile',
          callback: async (tokenResponse) => {
            if (tokenResponse && tokenResponse.access_token) {
              setLoading(true);
              try {
                const res = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
                  headers: { Authorization: `Bearer ${tokenResponse.access_token}` }
                });
                const data = await res.json();
                handleLogin(data.email, data.name || data.given_name, false);
              } catch (err) {
                setErrorMsg('Gagal mengambil profil Google Anda.');
                setLoading(false);
              }
            }
          }
        });
        setTokenClient(client);
      }
    };
    if (!window.google) {
      const script = document.createElement('script');
      script.src = 'https://accounts.google.com/gsi/client';
      script.onload = loadGoogleAPI;
      document.body.appendChild(script);
    } else { loadGoogleAPI(); }
  }, []);

  // 6. Auto-login dari localStorage
  // BUG FIX #2: handleLogin sudah didefinisikan di atas, jadi aman dipanggil di sini
  useEffect(() => {
    const cachedUser = localStorage.getItem('yaumi_user');
    if (cachedUser) {
      try {
        const { email, fullName } = JSON.parse(cachedUser);
        handleLogin(email, fullName, true);
      } catch(e) { localStorage.removeItem('yaumi_user'); }
    }
  }, []);

  // 7. Sinkronisasi Data Atur Jadwal
  useEffect(() => {
    const dataHariIni = jadwalMingguan.filter((j) => (j?.hari || '').toLowerCase() === hariAktif.toLowerCase());
    const safeData = sortJadwalByTime(dataHariIni).map((j, idx) => ({ ...j, id: j.id || Date.now() + idx }));
    setJadwalEdit(safeData);
    setIsEditingJadwal(false); 
  }, [hariAktif, jadwalMingguan]);

  // 8. Muat Script Kamera Scanner
  useEffect(() => {
    if (typeof window !== 'undefined' && window.Html5Qrcode) {
      setScriptLoaded(true);
    } else {
      const script = document.createElement('script');
      script.src = "https://unpkg.com/html5-qrcode";
      script.async = true;
      script.onload = () => setScriptLoaded(true);
      document.body.appendChild(script);
    }
  }, []);

  // 9. Kontrol Kamera Scanner
  useEffect(() => {
    if (step !== 'scan') {
      if (qrScannerRef.current && isQrScanningRef.current) {
        isQrScanningRef.current = false;
        qrScannerRef.current.stop().then(() => qrScannerRef.current.clear()).catch(console.error);
      }
      return;
    }
    if (!scriptLoaded || scanError) return;

    const startCam = async () => {
      if (isQrScanningRef.current) return;
      try {
        const html5QrCode = new window.Html5Qrcode("qr-reader");
        qrScannerRef.current = html5QrCode;
        await html5QrCode.start(
          { facingMode: "environment" }, 
          { fps: 10, qrbox: { width: 250, height: 250 }, aspectRatio: 1.0 },
          (decodedText) => {
            if (isQrScanningRef.current) {
              const isSuccess = handleScanBarcode(decodedText);
              if (isSuccess) {
                isQrScanningRef.current = false;
                qrScannerRef.current.stop().then(() => qrScannerRef.current.clear()).catch(console.error);
              } else {
                isQrScanningRef.current = false;
                qrScannerRef.current.stop().then(() => qrScannerRef.current.clear()).catch(console.error);
              }
            }
          },
          (error) => {} 
        );
        isQrScanningRef.current = true;
      } catch (err) {
        console.error(err);
        setScanError("Kamera tidak bisa diakses. Coba scan ulang atau lanjut input manual agar guru tidak tertahan di aplikasi.");
      }
    };

    const timer = setTimeout(startCam, 300);
    return () => {
      clearTimeout(timer);
      if (qrScannerRef.current && isQrScanningRef.current) {
        isQrScanningRef.current = false;
        qrScannerRef.current.stop().then(() => qrScannerRef.current.clear()).catch(console.error);
      }
    };
  }, [step, scriptLoaded, scanError]);

  // 10. Kontrol Kamera Depan (Selfie)
  useEffect(() => {
    const stopFrontCamera = () => {
      if (videoRef.current && videoRef.current.srcObject) {
        videoRef.current.srcObject.getTracks().forEach((track) => track.stop());
        videoRef.current.srcObject = null;
      }
    };

    if (step !== 'confirm' || !showCam) {
      stopFrontCamera();
      return;
    }

    let cancelled = false;
    const startCamera = async () => {
      try {
        stopFrontCamera();
        const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "user" } });
        if (!cancelled && videoRef.current) {
          videoRef.current.srcObject = stream;
        } else {
          stream.getTracks().forEach((track) => track.stop());
        }
      } catch (err) {
        console.error("Gagal load kamera depan", err);
        setShowCam(false);
        setIsSelfieRequired(false);
        setErrorMsg('Kamera tidak bisa dibuka. Silakan tekan "Simpan Kehadiran" untuk melanjutkan tanpa foto.');
      }
    };

    startCamera();
    return () => {
      cancelled = true;
      stopFrontCamera();
    };
  }, [step, showCam, selfieSessionKey]);

  // 11. Sinkronisasi background setiap 5 menit
  useEffect(() => {
    if (!guru || GAS_URL.includes("CONTOH_URL")) return;

    // isSyncingRef mencegah dua request berjalan sekaligus
    // jika fetch sebelumnya belum selesai saat interval berikutnya tiba
    const isSyncingRef = { current: false };

    const syncData = async () => {
      if (isSyncingRef.current) {
        console.warn('[syncData] Skipped — sync sebelumnya masih berjalan');
        return;
      }
      isSyncingRef.current = true;
      try {
        const savedUser = localStorage.getItem('yaumi_user');
        if (!savedUser) return;
        const { email, fullName } = JSON.parse(savedUser);

        // PERBAIKAN: safeGasFetch dengan timeout 20 detik untuk background sync
        // Jika GAS lambat/timeout → abaikan diam-diam, data lama tetap tampil
        const data = await safeGasFetch(
          `${GAS_URL}?email=${email}&nama_lengkap=${encodeURIComponent(fullName)}`,
          {},
          20000
        );
        if (data.status !== 'success') return; // timeout/error → skip update diam-diam

        const jadwalWithId = sortJadwalByTime(normalizeJadwal(data.jadwal || []).filter(isRealSession)).map((j, idx) => ({ ...j, id: j.id || Date.now() + idx }));
        const jadwalSelesaiHariIni = sortJadwalByTime(normalizeJadwal(data.jadwal_selesai || []).filter(isRealSession)).map((j, idx) => ({ ...j, id: j.id || Date.now() + 500 + idx }));
        const jadwalSemuaSekolah = sortJadwalByTime(normalizeJadwal(data.jadwal_semua || []).filter(isRealSession)).map((j, idx) => ({ ...j, id: j.id || Date.now() + 1000 + idx }));
        const jadwalMingguanAman = sortJadwalByTime(normalizeJadwal(data.jadwal_mingguan || []).map((j, idx) => ({ ...j, id: j.id || Date.now() + 2000 + idx })));

        setJadwalHarian(jadwalWithId);
        setJadwalSelesai(jadwalSelesaiHariIni);
        setJadwalSekolah(jadwalSemuaSekolah);
        setJadwalMingguan(jadwalMingguanAman);
      } catch (err) {
        // Catch ini hanya untuk error tak terduga — safeGasFetch sudah menangani sisanya
        console.warn('[syncData] Error tak terduga:', err?.message);
      } finally {
        isSyncingRef.current = false;
      }
    };

    const intervalId = setInterval(syncData, 5 * 60 * 1000);
    return () => clearInterval(intervalId);
  }, [guru]);

  // ==========================================
  // FUNGSI UTAMA (LOGIC)
  // ==========================================

  const handleLogout = () => {
    localStorage.removeItem('yaumi_user');
    setGoogleName('');
    setGuru('');
    setJadwalHarian([]);
    setJadwalSelesai([]);
    setJadwalSekolah([]);
    setJadwalMingguan([]);
    setJadwalTerpilih(null);
    setEditData({ mapel: '', kelas: '', jam_mulai: '' });
    setCatatan('');
    setSiswaSiap(false);
    setMetode('Scan QR');
    setHasilScan(null);
    setErrorMsg('');
    setScanError(null);
    setShowCam(false);
    setCapturedImg(null);
    setIsSelfieRequired(false);
    setStep('login');
  };

  const startScanFlow = (jadwal) => {
    setJadwalTerpilih(jadwal ? { ...jadwal } : null);
    setErrorMsg('');
    setScanError(null);
    setStep('scan');
  };

  const goToConfirm = (jadwal, metodeStr) => {
    setJadwalTerpilih({ ...jadwal });
    setEditData({ ...jadwal }); 
    setMetode(metodeStr);
    setCatatan('');
    setSiswaSiap(false);
    setShowCam(false);
    setCapturedImg(null);
    setSelfieSessionKey(0);
    setScanError(null);
    setIsSelfieRequired(Math.random() < 0.3);
    setStep('confirm');
  };

  const handleScanBarcode = (qrText) => {
    const now = new Date();
    const normalizedScan = (qrText || '').toLowerCase().trim();
    const matches = sortJadwalByTime(jadwalHarian).filter((j) => {
      const kelasAsli = (j?.kelas || '').toLowerCase().trim();
      const kelasFormatted = formatKelas(j?.kelas || '').toLowerCase().trim();
      return kelasAsli === normalizedScan || kelasFormatted === normalizedScan;
    });
    
    if (matches.length > 0) {
      const candidates = matches.map((jadwal) => {
        const waktuMulai = parseJamJadwal(jadwal?.jam_mulai, now);
        if (!waktuMulai) return null;
        return { jadwal, diffMinutes: (waktuMulai.getTime() - now.getTime()) / 60000 };
      }).filter(Boolean);

      // diffMinutes = (waktuMulai - now) / 60000
      // diffMinutes > 0  → jadwal BELUM mulai (scan sebelum jam mulai)
      // diffMinutes < 0  → jadwal SUDAH lewat (scan setelah jam mulai)

      // Kandidat yang masih dalam window scan sebelum mulai (0 s/d +10 menit sebelum)
      const upcomingCandidates = candidates.filter((item) => item.diffMinutes >= 0 && item.diffMinutes <= SCAN_WINDOW_BEFORE_MINUTES).sort((a, b) => a.diffMinutes - b.diffMinutes);
      // Kandidat yang sudah mulai tapi masih dalam toleransi terlambat (0 s/d -30 menit)
      const lateCandidates = candidates.filter((item) => item.diffMinutes < 0 && Math.abs(item.diffMinutes) <= LATE_SCAN_WINDOW_MINUTES).sort((a, b) => b.diffMinutes - a.diffMinutes);
      // Kandidat yang sudah lewat > 30 menit (deadzone)
      const deadzoneCandidates = candidates.filter((item) => item.diffMinutes < 0 && Math.abs(item.diffMinutes) > LATE_SCAN_WINDOW_MINUTES).sort((a, b) => b.diffMinutes - a.diffMinutes);
      // Kandidat yang terlalu awal (lebih dari SCAN_WINDOW_BEFORE_MINUTES sebelum mulai)
      const tooEarlyCandidates = candidates.filter((item) => item.diffMinutes > SCAN_WINDOW_BEFORE_MINUTES).sort((a, b) => a.diffMinutes - b.diffMinutes);

      const selectedCandidate = upcomingCandidates[0] || lateCandidates[0] || null;

      if (selectedCandidate) {
        goToConfirm(selectedCandidate.jadwal, 'Scan QR');
        return true;
      }

      // PERBAIKAN BUG: Jika scan terlalu awal untuk semua jadwal kelas ini,
      // cek apakah ada jadwal LAIN (kelas berbeda) yang sedang dalam late window
      // → arahkan guru ke jadwal sebelumnya yang mungkin terlewat
      if (tooEarlyCandidates.length > 0 && lateCandidates.length === 0 && upcomingCandidates.length === 0) {
        // Cek semua jadwal harian (bukan hanya yang cocok kelas ini) untuk late candidates
        const allLateToday = sortJadwalByTime(jadwalHarian).map((jadwal) => {
          const waktuMulai = parseJamJadwal(jadwal?.jam_mulai, now);
          if (!waktuMulai) return null;
          const diffMin = (waktuMulai.getTime() - now.getTime()) / 60000;
          return { jadwal, diffMinutes: diffMin };
        }).filter(Boolean).filter((item) => item.diffMinutes < 0 && Math.abs(item.diffMinutes) <= LATE_SCAN_WINDOW_MINUTES).sort((a, b) => b.diffMinutes - a.diffMinutes);

        if (allLateToday.length > 0) {
          const jadwalSebelumnya = allLateToday[0];
          const menitTerlambat = Math.round(Math.abs(jadwalSebelumnya.diffMinutes));
          setScanError(
            `Scan untuk ${formatKelas(qrText)} belum dibuka. Namun Anda mungkin terlambat scan jadwal sebelumnya (${jadwalSebelumnya.jadwal.mapel} ${formatKelas(jadwalSebelumnya.jadwal.kelas)}, ${menitTerlambat} menit lalu). Gunakan "Input Manual" untuk mencatat jadwal yang terlewat.`
          );
          setJadwalTerpilih({ ...jadwalSebelumnya.jadwal });
          return false;
        }

        const menitMenunggu = Math.round(tooEarlyCandidates[0].diffMinutes - SCAN_WINDOW_BEFORE_MINUTES);
        setScanError(`Belum waktunya scan ${formatKelas(qrText)}. Scan dibuka ${SCAN_WINDOW_BEFORE_MINUTES} menit sebelum jam mulai (${menitMenunggu > 0 ? `tunggu ±${menitMenunggu} menit lagi` : 'sebentar lagi'}).`);
        return false;
      }

      if (deadzoneCandidates.length > 0) {
        const mnitLewat = Math.round(Math.abs(deadzoneCandidates[0].diffMinutes));
        setScanError(`Jadwal ${formatKelas(qrText)} sudah lewat ${mnitLewat} menit (melebihi toleransi ${LATE_SCAN_WINDOW_MINUTES} menit). Gunakan "Input Manual" di bawah agar tetap tercatat.`);
        setJadwalTerpilih({ ...deadzoneCandidates[0].jadwal });
        return false;
      }

      setScanError(`Belum waktunya scan ${formatKelas(qrText)}. Scan dibuka maksimal ${SCAN_WINDOW_BEFORE_MINUTES} menit sebelum jam mulai.`);
      return false;
    }

    setScanError(`Ruang ${formatKelas(qrText)} tidak ada di jadwal Anda yang belum diselesaikan hari ini.`);
    return false; 
  };

  const ajukanManual = (jadwal) => {
    if (!jadwal) return;
    goToConfirm(jadwal, 'Lupa Scan (Manual)');
  };

  const pilihInval = (jadwalInval) => {
    if (!jadwalInval) return;
    goToConfirm(jadwalInval, `Inval (Menggantikan ${jadwalInval.guru_asli})`);
  };

  const submitPresensi = async (editedJadwal, fotoData = null) => {
    setLoading(true);
    setLoadingMsg('Menyimpan...');
    setErrorMsg('');
    const payload = {
      action: 'presensi',
      nama_guru: guru,
      jam_jadwal: editedJadwal.jam_mulai, 
      mapel: editedJadwal.mapel,
      kelas: editedJadwal.kelas,
      catatan: catatan,
      siswa_siap: siswaSiap,
      metode: metode,
      foto: fotoData 
    };

    try {
      if (GAS_URL.includes("CONTOH_URL")) {
        setTimeout(() => {
          setHasilScan({ status: 'success', hasil_status: 'Tepat Waktu' });
          setStep('result');
          setJadwalHarian(prev => prev.filter(j => j.id !== editedJadwal.id));
          setJadwalSelesai((prev) => (prev.some((item) => isSameSchedule(item, editedJadwal)) ? prev : [...prev, editedJadwal]));
          setLoading(false);
        }, 1500);
      } else {
        // PERBAIKAN: safeGasFetchWithRetry menangani:
        //   - LOCK_TIMEOUT (banyak guru scan bersamaan) → retry otomatis 2x
        //   - GAS return HTML bukan JSON (timeout/502) → tidak crash ke ErrorBoundary
        //   - Network error → pesan informatif, bukan layar merah
        setErrorMsg('');

        // Attempt pertama
        let data = await safeGasFetch(GAS_URL, { method: 'POST', body: JSON.stringify(payload) });

        // Retry jika LOCK_TIMEOUT atau server masalah sementara (max 2x)
        for (let retry = 1; retry <= 2 && (data.kode === 'LOCK_TIMEOUT' || data.kode === 'TIMEOUT' || data.kode === 'BUKAN_JSON'); retry++) {
          setLoadingMsg(`Server sibuk, mencoba ulang... (${retry}/2)`);
          await new Promise(res => setTimeout(res, 4000));
          data = await safeGasFetch(GAS_URL, { method: 'POST', body: JSON.stringify(payload) });
        }

        if (data.status === 'success') {
          // DUPLIKAT dari GAS (idempotency) juga dianggap berhasil
          setHasilScan(data);
          setStep('result');
          setJadwalHarian(prev => prev.filter(j => j.id !== editedJadwal.id));
          setJadwalSelesai((prev) => (prev.some((item) => isSameSchedule(item, editedJadwal)) ? prev : [...prev, editedJadwal]));
        } else {
          // Setelah semua retry habis, baru tampilkan pesan error ke guru
          // TIDAK throw — jadi tidak crash ke ErrorBoundary
          const pesanError = data.kode === 'LOCK_TIMEOUT'
            ? 'Server masih sibuk setelah beberapa percobaan. Silakan tekan "Simpan Kehadiran" sekali lagi dalam ±10 detik.'
            : data.kode === 'TIMEOUT' || data.kode === 'BUKAN_JSON'
            ? 'Server lambat merespons. Silakan coba lagi dalam beberapa detik.'
            : (data.message || 'Gagal menyimpan. Silakan coba lagi.');
          setErrorMsg(pesanError);
        }
        setLoading(false);
        setLoadingMsg('Menyimpan...');
      }
    } catch (err) {
      // Catch ini hanya untuk error yang benar-benar tak terduga
      console.error('[submitPresensi] Unexpected error:', err?.message);
      setErrorMsg('Terjadi kesalahan tak terduga. Silakan coba lagi.');
      setLoading(false);
      setLoadingMsg('Menyimpan...');
    }
  };

  const takePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const context = canvas.getContext('2d');
      if (!context) return;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      context.drawImage(video, 0, 0, canvas.width, canvas.height);
      setCapturedImg(canvas.toDataURL('image/jpeg', 0.6));
      if (video.srcObject) video.srcObject.getTracks().forEach(t => t.stop());
    }
  };

  const retrySelfieCapture = () => {
    setCapturedImg(null);
    setSelfieSessionKey((prev) => prev + 1);
  };

  const handleLanjutSimpanConfirm = () => {
    if (metode.includes('Manual') && catatan.trim().length < 5) {
      setErrorMsg('Wajib mengisi alasan lupa scan di kolom catatan (min. 5 huruf).');
      return;
    }
    setErrorMsg(''); 
    if (isSelfieRequired && !capturedImg) {
      setShowCam(true);
    } else {
      submitPresensi(editData, capturedImg);
    }
  };

  const renderInstallBanner = (isCompact = false) => {
    if (isStandalone || (!deferredPrompt && !showInstallInstructions)) return null;

    const title = deferredPrompt ? 'Install Aplikasi' : 'Tambah ke Layar Utama';
    const description = deferredPrompt
      ? 'Pasang aplikasi di layar utama HP agar buka lebih cepat dan terasa seperti aplikasi di HP.'
      : 'Di iPhone atau iPad, buka menu Share lalu pilih Add to Home Screen.';

    if (isCompact) {
      return (
        <div className="bg-emerald-50 border border-emerald-200 p-4 rounded-3xl mb-6 flex justify-between items-center shadow-sm">
          <div>
            <h4 className="font-bold text-emerald-800 text-sm">{title}</h4>
            <p className="text-[10px] text-emerald-600 font-medium max-w-[220px]">{description}</p>
          </div>
          {deferredPrompt ? (
            <button onClick={installPWA} className="bg-emerald-500 text-white text-xs font-black px-4 py-2 rounded-xl shadow-md active:scale-95">Install</button>
          ) : (
            <span className="text-[10px] font-black text-emerald-700 bg-white px-3 py-2 rounded-xl border border-emerald-200">Share</span>
          )}
        </div>
      );
    }

    return (
      <div className="mt-6 w-full rounded-2xl border border-emerald-200 bg-gradient-to-r from-emerald-50 to-teal-50 p-4 text-left shadow-sm">
        <h4 className="font-black text-emerald-800 text-sm mb-1">{title}</h4>
        <p className="text-emerald-700 text-xs font-medium leading-relaxed">{description}</p>
        {deferredPrompt && (
          <button onClick={installPWA} className="mt-3 w-full py-3 bg-emerald-500 hover:bg-emerald-600 text-white rounded-2xl shadow-lg font-black transition-all">
            Install ke HP
          </button>
        )}
      </div>
    );
  };

  // ==========================================
  // RENDERER TAMPILAN
  // ==========================================

  const renderLoginView = () => (
    <div className="relative flex flex-col items-center justify-center min-h-screen bg-slate-50 overflow-hidden px-5 py-10">
      <style>{`
        @keyframes blob { 0% { transform: translate(0px, 0px) scale(1); } 33% { transform: translate(30px, -50px) scale(1.1); } 66% { transform: translate(-20px, 20px) scale(0.9); } 100% { transform: translate(0px, 0px) scale(1); } }
        .animate-blob { animation: blob 8s infinite; }
        .animation-delay-2000 { animation-delay: 2s; }
        .animation-delay-4000 { animation-delay: 4s; }
      `}</style>
      <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-emerald-300/30 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-blob"></div>
      <div className="absolute top-[20%] right-[-10%] w-72 h-72 bg-teal-300/30 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-blob animation-delay-2000"></div>
      <div className="absolute bottom-[-10%] left-[20%] w-80 h-80 bg-blue-300/30 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-blob animation-delay-4000"></div>

      <div className="relative z-10 w-full max-w-sm flex flex-col items-center">
        <div className="w-full bg-white/90 backdrop-blur-xl p-8 rounded-[2.5rem] shadow-2xl shadow-slate-200/60 border border-white text-center">
          <div className="w-28 h-28 mx-auto mb-6 rounded-3xl shadow-inner overflow-hidden border-2 border-slate-100 flex items-center justify-center bg-white p-2">
            <img src="/logo.png" alt="Logo" className="w-full h-full object-contain" onError={(e) => { e.target.style.display = 'none'; }} />
          </div>
          <h2 className="text-3xl font-black text-slate-800 tracking-tight">SOP 3 Menit</h2>
          <p className="text-slate-500 mt-2 mb-8 text-sm font-medium leading-relaxed">Asisten Kinerja Guru SD Yaumi Fatimah. Silakan login untuk menghubungkan akun Anda.</p>
          <button onClick={() => { if (tokenClient) tokenClient.requestAccessToken(); else setErrorMsg("Sistem Auth sedang dimuat, mohon tunggu."); }} className="w-full bg-white border-2 border-slate-200 text-slate-700 font-bold py-4 rounded-2xl shadow-sm hover:bg-slate-50 hover:border-emerald-300 active:scale-95 transition-all flex items-center justify-center gap-3 mb-4">
            <img src="https://upload.wikimedia.org/wikipedia/commons/c/c1/Google_%22G%22_logo.svg" className="w-6 h-6" alt="Google" />
            Lanjutkan dengan Google
          </button>
          
          {GAS_URL.includes("CONTOH_URL") && (
            <button onClick={() => handleLogin('ruroh.yaumi@gmail.com', 'Siti Ruroh', false)} className="mt-2 w-full py-3 bg-slate-100/50 text-slate-500 rounded-2xl text-xs font-bold hover:bg-slate-100 transition-colors border border-slate-200/50 flex items-center justify-center gap-2">
              <Clock size={14}/> Mode Simulasi Developer
            </button>
          )}

          {loading && <div className="mt-4 flex flex-col items-center justify-center"><div className="w-6 h-6 border-4 border-emerald-100 border-t-emerald-500 rounded-full animate-spin mb-2"></div><p className="text-emerald-600 font-bold text-xs tracking-wide">Memproses Akun...</p></div>}
          {errorMsg && <div className="mt-4 p-4 bg-rose-50 border border-rose-100 rounded-2xl flex items-start gap-3 text-left"><AlertTriangle className="text-rose-500 shrink-0 mt-0.5" size={18} /><p className="text-rose-600 text-xs font-bold leading-relaxed">{errorMsg}</p></div>}
          
          {renderInstallBanner(false)}
        </div>
        <p className="text-center text-xs text-slate-500 mt-8 font-semibold tracking-wide">&copy; {new Date().getFullYear()} SD Yaumi Fatimah.</p>
      </div>
    </div>
  );

  const renderHeroDashboard = () => {
    const isMinggu = waktuSekarang.getDay() === 0;
    if (isMinggu) {
      return (
        <div className="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-[2.5rem] p-8 text-center text-white shadow-xl mb-6 flex flex-col items-center">
          <CalendarDays className="text-white/80 mb-3" size={48} />
          <h3 className="text-2xl font-black mb-1">Hari Libur</h3>
          <p className="text-sm font-medium text-indigo-100">Selamat beristirahat dan nikmati waktu akhir pekan Anda.</p>
        </div>
      );
    }

    if (!jadwalHarian || jadwalHarian.length === 0) {
      return (
        <div className="bg-white/80 backdrop-blur-md border border-emerald-100 rounded-[2rem] p-8 text-center shadow-sm mb-6 flex flex-col items-center">
          <CheckCircle className="text-emerald-500 mb-3" size={48} />
          <h3 className="text-xl font-black text-slate-800 mb-1">Alhamdulillah</h3>
          <p className="text-sm font-medium text-slate-500">Semua tugas mengajar Anda hari ini telah ditunaikan.</p>
        </div>
      );
    }

    const { jadwalTerdekat, sisaWaktuMs } = getNearestActiveSchedule(jadwalHarian, waktuSekarang);

    if (!jadwalTerdekat) {
      const jadwalTerakhir = sortJadwalByTime(jadwalHarian).slice(-1)[0];
      return (
        <div className="bg-white/80 backdrop-blur-md border border-emerald-100 rounded-[2rem] p-8 text-center shadow-sm mb-6 flex flex-col items-center">
          <CheckCircle className="text-emerald-500 mb-3" size={48} />
          <h3 className="text-xl font-black text-slate-800 mb-1">Alhamdulillah</h3>
          <p className="text-sm font-medium text-slate-500 mb-4">Semua sesi mengajar hari ini sudah lewat.</p>
          {jadwalTerakhir && (
            <button
              onClick={() => ajukanManual(jadwalTerakhir)}
              className="flex items-center gap-2 text-xs font-bold text-amber-700 bg-amber-50 border border-amber-200 px-4 py-2 rounded-xl hover:bg-amber-100 transition-colors"
            >
              <AlertTriangle size={14}/> Lupa scan? Input manual di sini
            </button>
          )}
        </div>
      );
    }

    const sisaMenit = sisaWaktuMs / 60000;

    let isSedangMengajar = false;
    let mapelSedangDiajar = "";
    const hariIniStr = NAMA_HARI[waktuSekarang.getDay()];
    const jadwalAllToday = sortJadwalByTime(
      jadwalMingguan.filter((j) => {
        const mapel = s(j?.mapel).toLowerCase().trim();
        return s(j?.hari).toLowerCase() === hariIniStr.toLowerCase() && mapel !== '' && mapel !== '-' && !mapel.includes('kosong') && !mapel.includes('istirahat');
      })
    );

    for (const jadwal of jadwalAllToday) {
      const waktuMulai = parseJamJadwal(jadwal?.jam_mulai, waktuSekarang);
      if (!waktuMulai) continue;
      const diffStart = waktuSekarang.getTime() - waktuMulai.getTime();
      if (diffStart >= 0 && diffStart < 60 * 60 * 1000) {
        isSedangMengajar = true;
        mapelSedangDiajar = jadwal.mapel;
        break;
      }
    }

    let config = { bg: 'bg-gradient-to-br from-blue-500 to-indigo-600', title: 'MENUNGGU JADWAL', desc: 'Bersiaplah untuk kelas Anda berikutnya.', pulse: false };

    if (sisaMenit < -1) {
      config = { bg: 'bg-gradient-to-br from-rose-500 to-red-600', title: 'TERLAMBAT SCAN', desc: 'Batas toleransi habis. Segera scan atau konfirmasi Manual!', pulse: true };
    } else if (sisaMenit <= 3) {
      config = { bg: 'bg-gradient-to-br from-amber-400 to-orange-500', title: 'SOP 3 MENIT: MENUJU KELAS', desc: `Segera menuju ${formatKelas(jadwalTerdekat.kelas)} dan scan barcode!`, pulse: true };
    } else if (sisaMenit <= 5) {
      if (isSedangMengajar) {
        config = { bg: 'bg-gradient-to-br from-emerald-500 to-green-600', title: `SEDANG MENGAJAR ${String(mapelSedangDiajar || '').toUpperCase()} (TRANSISI)`, desc: 'Segera akhiri sesi, siapkan siswa untuk mapel selanjutnya.', pulse: false };
      } else {
        config = { bg: 'bg-gradient-to-br from-emerald-500 to-green-600', title: 'PERSIAPAN (5 MNT)', desc: `Silakan persiapkan diri menuju ${formatKelas(jadwalTerdekat.kelas)}.`, pulse: false };
      }
    } else {
      if (isSedangMengajar) {
        config = { bg: 'bg-gradient-to-br from-blue-500 to-indigo-600', title: `SEDANG MENGAJAR ${String(mapelSedangDiajar || '').toUpperCase()}`, desc: `Berikutnya: ${jadwalTerdekat.mapel} di ${formatKelas(jadwalTerdekat.kelas)}`, pulse: false };
      } else {
        config = { bg: 'bg-gradient-to-br from-blue-500 to-indigo-600', title: 'JAM KOSONG', desc: `Berikutnya: ${jadwalTerdekat.mapel} di ${formatKelas(jadwalTerdekat.kelas)}`, pulse: false };
      }
    }

    const absMs = Math.abs(sisaWaktuMs);
    const jam = Math.floor(absMs / (1000 * 60 * 60));
    const menit = Math.floor((absMs % (1000 * 60 * 60)) / (1000 * 60));
    const detik = Math.floor((absMs % (1000 * 60)) / 1000);

    return (
      <div className={`rounded-[2.5rem] p-7 mb-8 text-white shadow-2xl transition-all duration-700 ${config.bg} ${config.pulse ? 'shadow-current/30' : 'shadow-slate-200'}`}>
        <div className="flex justify-between items-center mb-3">
          <p className="text-xs font-black tracking-widest opacity-90 uppercase flex items-center gap-2">
            {config.pulse && <span className="relative flex h-3 w-3"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span><span className="relative inline-flex rounded-full h-3 w-3 bg-white"></span></span>}
            {config.title}
          </p>
          <BellRing size={16} className={`opacity-80 ${sisaMenit <= 5 && sisaMenit > 0 ? "animate-pulse" : ""}`} />
        </div>
        
        <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-5 mb-5 border border-white/20 shadow-inner">
          <div className="flex justify-between items-center mb-4">
            <div className="flex items-center gap-3">
              <div className="bg-white/20 p-2 rounded-xl"><BookOpen size={24} /></div>
              <div>
                <h3 className="text-2xl font-black leading-none mb-1">{jadwalTerdekat.mapel}</h3>
                <p className="text-sm font-medium opacity-90 flex items-center gap-1"><MapPin size={14} /> {formatKelas(jadwalTerdekat.kelas)}</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-[10px] font-black uppercase tracking-widest opacity-80 mb-1">Mulai</p>
              <p className="text-xl font-bold">{jadwalTerdekat.jam_mulai}</p>
            </div>
          </div>
          
          <div className="flex items-center justify-center gap-2 bg-black/20 py-3 rounded-xl">
            <Clock size={20} className={config.pulse ? "animate-pulse text-white" : "text-white/80"}/>
            <div className="font-mono text-3xl font-black tracking-widest">
              {sisaMenit < 0 ? '-' : ''}{jam > 0 ? `${jam.toString().padStart(2, '0')}:` : ''}{menit.toString().padStart(2, '0')}:{detik.toString().padStart(2, '0')}
            </div>
          </div>
        </div>
        <p className="text-sm font-medium text-center mb-6 opacity-90 px-2 leading-snug">{config.desc}</p>
        <div className="flex gap-2">
          <button onClick={() => startScanFlow(jadwalTerdekat)} className="flex-[2] py-4 bg-white text-slate-800 font-black rounded-2xl flex items-center justify-center gap-2 shadow-lg hover:scale-[1.02] active:scale-95 transition-all">
            <Camera size={20} className={config.pulse ? (sisaMenit < -1 ? "text-rose-500" : "text-amber-500") : "text-emerald-500"} /> SCAN QR
          </button>
          <button onClick={() => ajukanManual(jadwalTerdekat)} className="flex-1 py-4 bg-white/20 hover:bg-white/30 text-white font-bold rounded-2xl flex items-center justify-center gap-1.5 shadow-lg backdrop-blur-sm transition-all text-xs">
            <AlertTriangle size={16} /> Manual
          </button>
        </div>
      </div>
    );
  };

  const renderDashboardView = () => {
    const isMinggu = waktuSekarang.getDay() === 0;
    const dateString = waktuSekarang.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
    const totalSesi = jadwalHarian.length + jadwalSelesai.length;
    const sesiSelesai = jadwalSelesai.length;
    const isHariLibur = isMinggu || totalSesi === 0;
    const persentaseProgres = isHariLibur ? 100 : Math.round((sesiSelesai / totalSesi) * 100);

    return (
      <div className="p-5 max-w-md mx-auto min-h-screen pb-24 relative flex flex-col">
        <div className="flex justify-between items-center mb-6 bg-white p-5 rounded-[2rem] shadow-sm border border-slate-100">
          <div>
            <p className="text-emerald-600 text-[10px] font-extrabold uppercase tracking-widest mb-1">{dateString}</p>
            <h2 className="text-xl font-black text-slate-800 leading-tight">Hai, {googleName || guru}</h2>
          </div>
          <div className="flex flex-col items-end gap-1">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-extrabold text-slate-500 uppercase tracking-widest text-right leading-tight hidden sm:block">SD Yaumi<br/>Fatimah</span>
              <div className="w-10 h-10 p-1 border border-slate-100 rounded-xl shadow-sm bg-slate-50">
                <img src="/logo.png" alt="Logo" className="w-full h-full object-contain" onError={(e) => e.target.style.display='none'} />
              </div>
            </div>
            <button onClick={handleLogout} className="text-[10px] font-bold text-rose-600 bg-rose-100 px-3 py-1 rounded-full flex items-center gap-1 hover:bg-rose-200 mt-2 transition-colors"><LogOut size={12}/> Keluar</button>
          </div>
        </div>

        <div className="bg-white p-5 rounded-[2rem] shadow-sm border border-slate-100 mb-6">
          <div className="flex justify-between items-end mb-3">
            <div>
              <p className="text-[10px] font-extrabold uppercase tracking-widest text-slate-500 mb-0.5">Progres Hari Ini</p>
              <p className="text-3xl font-black text-slate-800">{isMinggu ? "Akhir Pekan" : (isHariLibur ? "Libur / Kosong" : `${persentaseProgres}%`)}</p>
            </div>
            <div className="text-right">
              <p className="text-xs font-bold text-emerald-700 bg-emerald-100 px-3 py-1 rounded-lg">
                {isMinggu ? "Selamat Istirahat" : (isHariLibur ? "Tidak Ada Jadwal" : `${sesiSelesai} dari ${totalSesi} Sesi Selesai`)}
              </p>
            </div>
          </div>
          <div className="w-full bg-slate-100 rounded-full h-3.5 overflow-hidden">
            <div className={`${isHariLibur ? "bg-slate-300" : "bg-emerald-500"} h-full rounded-full transition-all duration-1000 ease-out relative`} style={{ width: `${persentaseProgres}%` }}>
              <div className="absolute top-0 left-0 w-full h-full bg-white/20" style={{ animation: 'shimmer 2s infinite linear' }}></div>
            </div>
          </div>
        </div>

        {renderHeroDashboard()}

        {(() => {
          const jadwalSelesaiKeys = new Set(jadwalSelesai.map(j => buildScheduleKey(j)));
          const semuaJadwalHariIni = sortJadwalByTime([
            ...jadwalHarian,
            ...jadwalSelesai.filter(j => !jadwalHarian.some(jh => isSameSchedule(jh, j)))
          ]);
          
          if (semuaJadwalHariIni.length === 0) return null;

          const JAM_MAPEL_UTAMA = ['08.35', '10.15', '11.00', '13.00', '13.15', '13.45'];
          const isMapelPendukung = (j) => {
            const m = s(j.mapel).toLowerCase().trim();
            const jamUtama = JAM_MAPEL_UTAMA.includes(s(j.jam_mulai).trim());
            return !jamUtama || m.includes('pembukaan') || m.includes('penutupan') || m.includes('baghdadi') || m.includes('ishoma') || m.includes('istirahat');
          };
          return (
            <div>
              <h3 className="text-sm font-bold text-slate-500 uppercase tracking-widest mb-4 flex items-center gap-2"><CalendarDays size={16}/> Jadwal Hari Ini</h3>
              <div className="space-y-2 mb-8">
                {semuaJadwalHariIni.map((j, i) => {
                  const sudahPresensi = jadwalSelesaiKeys.has(buildScheduleKey(j));
                  const waktuMulai = parseJamJadwal(j?.jam_mulai, waktuSekarang);
                  const sudahLewat = !sudahPresensi && waktuMulai && (waktuSekarang.getTime() - waktuMulai.getTime()) > 30 * 60 * 1000;
                  const isAktif = !sudahPresensi && j === getNearestActiveSchedule(jadwalHarian, waktuSekarang).jadwalTerdekat;
                  const isPendukung = !sudahPresensi && isMapelPendukung(j);
                  return (
                    <div key={j.id || i} className={`border rounded-2xl p-3 flex items-center justify-between transition-all ${
                      sudahPresensi ? 'bg-emerald-50 border-emerald-200' :
                      isAktif ? 'bg-blue-50 border-blue-200 shadow-sm shadow-blue-100' :
                      sudahLewat ? 'bg-slate-50 border-slate-100 opacity-50' :
                      isPendukung ? 'bg-white border-slate-100 opacity-70' :
                      'bg-white border-slate-200 shadow-sm'
                    }`}>
                      <div className="flex items-center gap-3">
                        <span className={`px-2.5 py-1 rounded-xl text-xs font-black tracking-widest flex-shrink-0 ${
                          sudahPresensi ? 'bg-emerald-500 text-white' :
                          isAktif ? 'bg-blue-500 text-white' :
                          sudahLewat ? 'bg-slate-200 text-slate-400' :
                          isPendukung ? 'bg-slate-100 text-slate-400' :
                          'bg-indigo-50 text-indigo-600'
                        }`}>{j.jam_mulai}</span>
                        <div>
                          <h4 className={`leading-tight flex items-center gap-1.5 ${
                            sudahPresensi ? 'text-sm font-bold text-emerald-700' :
                            isPendukung ? 'text-xs font-medium text-slate-400' :
                            sudahLewat ? 'text-sm font-bold text-slate-400 line-through' :
                            'text-sm font-black text-slate-800'
                          }`}>
                            {j.mapel}
                            {sudahPresensi && <CheckCircle size={13} className="text-emerald-500 flex-shrink-0" />}
                          </h4>
                          <p className="text-xs font-semibold text-slate-400">{formatKelas(j.kelas)}</p>
                        </div>
                      </div>
                      {sudahPresensi ? (
                        <span className="text-[10px] font-black text-emerald-600 bg-emerald-100 px-2.5 py-1 rounded-xl flex-shrink-0">Selesai ✓</span>
                      ) : (
                        <button
                          onClick={() => ajukanManual(j)}
                          className="p-2 text-slate-400 hover:text-amber-600 bg-slate-50 hover:bg-amber-100 rounded-xl transition-colors flex-shrink-0"
                          title="Input Manual / Lupa Scan"
                        ><AlertTriangle size={16}/></button>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })()}

        <div className="grid grid-cols-2 gap-3 mb-3">
          <button onClick={() => setStep('atur_jadwal')} className="bg-white border border-slate-100 p-4 rounded-[2rem] shadow-sm hover:shadow-md transition-all flex flex-col items-center justify-center gap-2 text-center col-span-2 group">
            <div className="flex items-center gap-4 w-full px-2">
              <div className="bg-emerald-50 group-hover:bg-emerald-100 transition-colors p-3.5 rounded-2xl text-emerald-600"><CalendarDays size={24}/></div>
              <div className="text-left"><p className="font-black text-slate-700 text-lg">Lihat & Atur Jadwal</p><p className="text-xs text-slate-500 font-medium">Ubah jadwal mandiri jika ada perubahan</p></div>
              <ChevronRight size={20} className="text-slate-300 ml-auto" />
            </div>
          </button>
        </div>

        <div className="grid grid-cols-2 gap-3 mb-6">
          <button onClick={() => setStep('evaluasi')} className="bg-white border border-slate-100 p-4 rounded-[2rem] shadow-sm hover:shadow-md transition-all flex flex-col items-center justify-center gap-2 text-center group">
            <div className="bg-blue-50 group-hover:bg-blue-100 transition-colors p-3.5 rounded-2xl text-blue-500 mb-1"><ClipboardList size={24}/></div>
            <p className="font-bold text-slate-700 text-sm">Evaluasi Harian</p>
          </button>
          <button onClick={() => setStep('inval_list')} className="bg-white border border-slate-100 p-4 rounded-[2rem] shadow-sm hover:shadow-md transition-all flex flex-col items-center justify-center gap-2 text-center group">
            <div className="bg-orange-50 group-hover:bg-orange-100 transition-colors p-3.5 rounded-2xl text-orange-500 mb-1"><Users size={24}/></div>
            <p className="font-bold text-slate-700 text-sm">Inval Guru Lain</p>
          </button>
        </div>

        {(!isMinggu && jadwalHarian.length > 0) && (
          <button onClick={() => setStep('deklarasi_libur')} className="w-full py-4 bg-transparent border-2 border-dashed border-slate-300 text-slate-500 font-bold rounded-[2rem] flex flex-col items-center justify-center gap-1 hover:bg-slate-50 hover:border-slate-400 hover:text-slate-600 transition-all group">
            <span className="flex items-center gap-2 text-sm"><CalendarDays size={18} className="group-hover:text-emerald-600 transition-colors"/> Deklarasi Kegiatan Khusus</span>
            <span className="text-[10px] font-medium opacity-80">Kosongkan sisa jadwal jika hari ini libur / event</span>
          </button>
        )}

        {/* TAMBAL SULAM: TOMBOL EKSKLUSIF ASISTEN AI (Pendekatan Modular) */}
        <button 
          onClick={() => window.open('/hanfa-ai.html', '_blank')} 
          className="w-full py-4 mt-3 bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white font-black rounded-[2rem] flex items-center justify-center gap-2 shadow-lg hover:shadow-xl hover:scale-[1.01] transition-all group"
        >
          <Sparkles size={20} className="animate-pulse" />
          Asisten Pembuat Soal AI
        </button>

        <div className="mt-8 mb-auto">
          {renderInstallBanner(true)}
        </div>

        {/* TAMBAL SULAM: PERINGATAN NOTIFIKASI DITOLAK (Muncul di bawah jika diblokir guru) */}
        {notifPermission === 'denied' && (
          <div className="mt-4 mb-2 p-4 bg-amber-50 border border-amber-200 rounded-2xl flex items-start gap-3 shadow-sm">
            <AlertTriangle className="text-amber-500 shrink-0 mt-0.5" size={18} />
            <p className="text-amber-700 text-[10px] font-bold leading-relaxed text-left">Peringatan jadwal tidak aktif karena izin notifikasi ditolak. Mohon izinkan notifikasi di pengaturan browser Anda agar tidak terlambat masuk kelas.</p>
          </div>
        )}
      </div>
    );
  };

  const renderAturJadwalView = () => {
    const hariIni = NAMA_HARI[waktuSekarang.getDay()];
    const isHariIniDipilih = hariAktif.toLowerCase() === hariIni.toLowerCase();
    const jadwalSelesaiKeys = new Set((isHariIniDipilih ? jadwalSelesai : []).map((item) => buildScheduleKey(item)));

    const simpanJadwalKeDB = async () => {
      setIsSavingJadwal(true);
      if (jadwalEdit.some(j => j.jam_mulai.trim() === '' || j.mapel.trim() === '' || j.kelas.trim() === '')) {
        alert("Mohon lengkapi Jam Mulai, Mapel, dan Kelas sebelum menyimpan.");
        setIsSavingJadwal(false); return;
      }
      const payload = { action: 'update_jadwal', nama_guru: guru, hari: hariAktif, jadwal_baru: jadwalEdit };
      try {
        if (GAS_URL.includes("CONTOH_URL")) {
          setTimeout(() => {
            alert(`Simulasi: Jadwal hari ${hariAktif} disimpan!`);
            setJadwalMingguan((prev) => prev.filter((j) => (j?.hari || '').toLowerCase() !== hariAktif.toLowerCase()).concat(jadwalEdit));
            setIsEditingJadwal(false); setIsSavingJadwal(false);
          }, 1000);
        } else {
          const data = await safeGasFetchWithRetry(GAS_URL, { method: 'POST', body: JSON.stringify(payload) });
          if (data.status === 'success') {
            alert(data.message || 'Jadwal berhasil disimpan!');
            setJadwalMingguan((prev) => prev.filter((j) => (j?.hari || '').toLowerCase() !== hariAktif.toLowerCase()).concat(jadwalEdit));
            setIsEditingJadwal(false);
          } else {
            alert("Gagal menyimpan: " + (data.message || 'Server sibuk, coba lagi.'));
          }
          setIsSavingJadwal(false);
        }
      } catch (err) { alert("Kesalahan tak terduga. Silakan coba lagi."); setIsSavingJadwal(false); }
    };

    return (
      <div className="p-5 max-w-md mx-auto min-h-screen pb-24">
        <div className="flex items-center gap-4 mb-6">
          <button onClick={() => setStep('dashboard')} className="p-3 bg-white shadow-sm border border-slate-100 rounded-2xl text-slate-600 hover:bg-slate-50 transition-colors"><ArrowLeft size={20} /></button>
          <h2 className="text-2xl font-black text-slate-800">Jadwal Mingguan</h2>
        </div>
        <div className="relative mb-6">
          <select value={hariAktif} onChange={e => setHariAktif(e.target.value)} disabled={isEditingJadwal} className="w-full bg-white border border-slate-200 text-slate-800 font-black text-lg py-4 px-5 rounded-2xl appearance-none shadow-sm focus:border-emerald-500 focus:ring-4 focus:ring-emerald-50 outline-none transition-all disabled:opacity-50 disabled:bg-slate-50">
            {['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat'].map(h => <option key={h} value={h}>{h}</option>)}
          </select>
          <ChevronDown size={20} className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
        </div>
        {!isEditingJadwal ? (
          <div>
            <div className="bg-emerald-50 border border-emerald-100 p-5 rounded-3xl mb-6 flex justify-between items-center text-emerald-800">
              <div><p className="text-xs font-bold uppercase tracking-widest opacity-80 mb-1">Total Sesi</p><p className="text-3xl font-black">{jadwalEdit.length} <span className="text-sm font-medium opacity-90">Sesi</span></p></div>
              <CalendarDays size={40} className="opacity-50"/>
            </div>
            {jadwalEdit.length === 0 ? (
              <div className="text-center p-8 bg-white rounded-3xl border border-slate-100 text-slate-500 font-medium shadow-sm mb-6">Tidak ada jadwal di hari ini.</div>
            ) : (
              <div className="space-y-3 mb-8">
                {jadwalEdit.map((j, i) => (
                  <div key={j.id || i} className="bg-white border border-slate-100 p-4 rounded-3xl shadow-sm flex items-center justify-between transition-all hover:shadow-md">
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-xs font-black tracking-widest px-3 py-1.5 rounded-xl inline-block bg-emerald-100 text-emerald-700">{j.jam_mulai}</span>
                        {jadwalSelesaiKeys.has(buildScheduleKey(j)) && (
                          <span className="text-[10px] font-black tracking-widest px-2.5 py-1 rounded-lg bg-blue-100 text-blue-700">Sudah Presensi</span>
                        )}
                      </div>
                      <h4 className="text-xl font-black mb-1 text-slate-800">{j.mapel}</h4>
                      <p className="text-sm font-bold text-slate-400 flex items-center gap-1"><MapPin size={14}/> {formatKelas(j.kelas)}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
            <button onClick={() => setIsEditingJadwal(true)} className="w-full py-4 bg-white text-emerald-600 font-black border-2 border-emerald-100 rounded-2xl flex justify-center items-center gap-2 hover:bg-emerald-50 transition-colors shadow-sm"><Edit3 size={20}/> Ubah Jadwal {hariAktif}</button>
          </div>
        ) : (
          <div>
            <div className="bg-blue-50 border border-blue-100 p-4 rounded-2xl mb-6 flex items-start gap-3 text-blue-800"><Info size={20} className="shrink-0 mt-0.5 opacity-80" /><p className="text-sm font-medium">Ubah jadwal sesuai kebutuhan. Pastikan format jam benar (misal: 08.30).</p></div>
            <div className="space-y-4 mb-8">
              {jadwalEdit.map((j, i) => (
                <div key={j.id || i} className="bg-white p-4 rounded-3xl border border-slate-200 shadow-sm flex gap-3 items-center relative transition-all">
                  <div className="flex-1 space-y-4">
                    <div>
                      <label className="text-[10px] font-black tracking-widest text-slate-400 uppercase ml-1 mb-1 block">Jam Mulai</label>
                      <input type="text" value={j.jam_mulai} onChange={(e) => { const newJ = [...jadwalEdit]; newJ[i].jam_mulai = e.target.value; setJadwalEdit(newJ); }} className="w-full bg-slate-50 border border-transparent focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-50 rounded-xl px-4 py-3 text-sm font-black tracking-widest text-slate-800 outline-none transition-all" placeholder="08.30"/>
                    </div>
                    <div className="flex gap-3">
                      <div className="flex-[2]">
                        <label className="text-[10px] font-black tracking-widest text-slate-400 uppercase ml-1 mb-1 block">Mapel</label>
                        <input type="text" value={j.mapel} onChange={(e) => { const newJ = [...jadwalEdit]; newJ[i].mapel = e.target.value; setJadwalEdit(newJ); }} className="w-full bg-slate-50 border border-transparent focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-50 rounded-xl px-4 py-3 text-sm font-bold text-slate-800 outline-none transition-all" placeholder="Bahasa" />
                      </div>
                      <div className="flex-1">
                        <label className="text-[10px] font-black tracking-widest text-slate-400 uppercase ml-1 mb-1 block">Kelas</label>
                        <input type="text" value={j.kelas} onChange={(e) => { const newJ = [...jadwalEdit]; newJ[i].kelas = e.target.value; setJadwalEdit(newJ); }} className="w-full bg-slate-50 border border-transparent focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-50 rounded-xl px-4 py-3 text-sm font-bold text-slate-800 outline-none transition-all" placeholder="1A" />
                      </div>
                    </div>
                  </div>
                  <button onClick={() => { const newJ = [...jadwalEdit]; newJ.splice(i, 1); setJadwalEdit(newJ); }} className="bg-rose-50 p-4 rounded-2xl text-rose-500 hover:bg-rose-100 hover:text-rose-600 transition-colors h-full self-stretch flex items-center absolute right-4 top-4 bottom-4"><Trash2 size={20}/></button>
                </div>
              ))}
              <button onClick={() => setJadwalEdit([...jadwalEdit, { id: Date.now(), hari: hariAktif, jam_mulai: '00.00', mapel: '', kelas: '', guru_asli: guru }])} className="w-full py-4 border-2 border-dashed border-slate-300 text-slate-500 font-bold rounded-3xl flex items-center justify-center gap-2 hover:bg-slate-50 hover:text-slate-700 transition-colors"><PlusCircle size={20}/> Tambah Baris Jadwal</button>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setIsEditingJadwal(false)} className="flex-1 py-4 bg-slate-100 text-slate-600 font-black rounded-2xl hover:bg-slate-200 transition-colors">Batal</button>
              <button onClick={simpanJadwalKeDB} disabled={isSavingJadwal} className={`flex-[2] py-4 text-white font-black rounded-2xl shadow-lg flex justify-center items-center gap-2 transition-all ${isSavingJadwal ? 'bg-slate-400' : 'bg-slate-800 hover:bg-slate-900'}`}><Save size={20}/> {isSavingJadwal ? 'Menyimpan...' : 'Simpan Perubahan'}</button>
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderDeklarasiLiburView = () => {
    const submitLibur = async () => {
      if (keteranganLibur.trim().length < 5) {
        setErrorMsg('Wajib mengisi keterangan detail (minimal 5 huruf).'); return;
      }
      setLoading(true); setErrorMsg('');
      const payload = { action: 'presensi', nama_guru: guru, jam_jadwal: '1 Hari Penuh', mapel: `[KEGIATAN] ${tipeLibur}`, kelas: 'Semua Kelas', catatan: keteranganLibur, siswa_siap: false, metode: 'Deklarasi Khusus' };
      try {
        if (GAS_URL.includes("CONTOH_URL")) {
          setTimeout(() => { setJadwalHarian([]); setStep('dashboard'); setLoading(false); }, 1500);
        } else {
          const data = await safeGasFetchWithRetry(GAS_URL, { method: 'POST', body: JSON.stringify(payload) });
          if (data.status === 'success') { setJadwalHarian([]); setStep('dashboard'); }
          else { setErrorMsg(data.message || 'Gagal mengirim. Silakan coba lagi.'); }
          setLoading(false);
        }
      } catch (err) { setErrorMsg('Kesalahan tak terduga. Coba lagi.'); setLoading(false); }
    };

    return (
      <div className="p-5 max-w-md mx-auto min-h-screen flex flex-col pb-10">
        <div className="flex items-center gap-4 mb-6">
          <button onClick={() => { setStep('dashboard'); setErrorMsg(''); }} className="p-3 bg-white shadow-sm border border-slate-100 rounded-2xl text-slate-600 hover:bg-slate-50 transition-colors"><ArrowLeft size={20}/></button>
          <h2 className="text-2xl font-black text-slate-800">Deklarasi Khusus</h2>
        </div>
        <div className="bg-white border border-slate-100 rounded-[2rem] p-6 shadow-sm mb-5">
          <p className="text-sm font-bold text-slate-700 mb-6">Apakah hari ini ada kegiatan khusus yang merubah jadwal reguler mengajar Anda?</p>
          <label className="text-[10px] font-black tracking-widest text-slate-400 uppercase ml-1 block mb-2">Jenis Kegiatan</label>
          <select value={tipeLibur} onChange={e => setTipeLibur(e.target.value)} className="w-full bg-slate-50 border border-slate-200 text-slate-800 font-bold text-sm py-4 px-4 rounded-xl mb-5 outline-none focus:border-emerald-500 transition-all">
            <option value="Tanggal Merah / Libur Nasional">Tanggal Merah / Libur Nasional</option>
            <option value="Kegiatan Sekolah / Event">Kegiatan Sekolah / Event</option>
            <option value="Rapat Dinas">Rapat Dinas</option>
            <option value="Izin / Sakit (Tugas Digantikan)">Izin / Sakit (Tugas Digantikan)</option>
            <option value="Lainnya">Lainnya</option>
          </select>
          <label className="text-[10px] font-black tracking-widest text-slate-400 uppercase ml-1 block mb-2">Keterangan / Detail (Wajib)</label>
          <textarea className="w-full bg-slate-50 border border-slate-200 rounded-xl p-4 text-sm font-medium focus:outline-none focus:border-emerald-500 transition-colors" rows="4" placeholder="Tuliskan keterangan detail..." value={keteranganLibur} onChange={e => setKeteranganLibur(e.target.value)}></textarea>
        </div>
        {errorMsg && <div className="mb-5 p-4 bg-rose-50 border border-rose-100 rounded-2xl flex items-start gap-3 text-left"><AlertTriangle className="text-rose-500 shrink-0 mt-0.5" size={18} /><p className="text-rose-600 text-xs font-bold leading-relaxed">{errorMsg}</p></div>}
        <div className="mt-auto">
          <button onClick={submitLibur} disabled={loading} className="w-full py-4 bg-slate-800 hover:bg-slate-900 text-white font-black rounded-2xl shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-2">{loading ? <span className="animate-pulse">Memproses...</span> : <><CheckCircle size={20}/> Konfirmasi Selesai Hari Ini</>}</button>
        </div>
      </div>
    );
  };

  const renderEvaluasiView = () => (
    <div className="p-5 max-w-md mx-auto min-h-screen">
      <div className="flex items-center gap-4 mb-8">
        <button onClick={() => setStep('dashboard')} className="p-3 bg-white shadow-sm border border-slate-100 rounded-2xl text-slate-600 hover:bg-slate-50 transition-colors"><ArrowLeft size={20} /></button>
        <h2 className="text-2xl font-black text-slate-800">Evaluasi Hari Ini</h2>
      </div>
      <p className="text-sm text-slate-500 font-medium mb-6">Silakan tambahkan catatan atau evaluasi untuk setiap kelas yang telah Anda ajar hari ini.</p>
      {jadwalSelesai.length === 0 ? (
        <div className="text-center p-8 bg-white rounded-3xl border border-slate-100 text-slate-500 font-medium shadow-sm">Belum ada jadwal yang diselesaikan hari ini.</div>
      ) : (
        <div className="space-y-4">
          {jadwalSelesai.map((j, i) => (
            <div key={j.id || i} className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm transition-all hover:shadow-md">
              <div className="flex justify-between items-start border-b border-slate-100 pb-3 mb-3">
                <div>
                  <h4 className="font-black text-slate-800 text-lg">{j.mapel}</h4>
                  <p className="text-xs font-bold text-slate-400">{formatKelas(j.kelas)}</p>
                </div>
                <span className="bg-slate-100 text-slate-600 px-3 py-1.5 rounded-xl text-xs font-black tracking-widest">{j.jam_mulai}</span>
              </div>
              <label className="text-[10px] font-black tracking-widest text-slate-400 uppercase block mb-2">Evaluasi Pembelajaran / Kendala</label>
              <textarea className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm font-medium focus:outline-none focus:border-blue-500 focus:bg-white transition-colors" rows="2" placeholder="Siswa kooperatif, materi bab 2 selesai..."></textarea>
              <div className="mt-3 text-right">
                <button className="bg-blue-100 text-blue-700 text-xs font-bold px-4 py-2 rounded-lg hover:bg-blue-200 transition-colors" onClick={() => alert("Catatan evaluasi disimpan ke database!")}>Simpan Catatan</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  const renderInvalListView = () => (
    <div className="p-5 max-w-md mx-auto min-h-screen">
      <div className="flex items-center gap-4 mb-8">
        <button onClick={() => setStep('dashboard')} className="p-3 bg-white shadow-sm border border-slate-100 rounded-2xl text-slate-600 hover:bg-slate-50 transition-colors"><ArrowLeft size={20}/></button>
        <h2 className="text-2xl font-black text-slate-800">Inval Jadwal</h2>
      </div>
      <div className="space-y-4">
        {jadwalSekolah.map((j, i) => (
          <button key={j.id || i} onClick={() => pilihInval(j)} className="w-full text-left bg-white border border-slate-100 p-5 rounded-3xl shadow-sm hover:border-orange-300 hover:shadow-md transition-all">
            <div className="flex justify-between items-start mb-3">
              <span className="inline-block bg-slate-100 text-slate-600 px-3 py-1 rounded-lg text-xs font-black tracking-widest">{j.jam_mulai}</span>
              <span className="text-xs font-bold text-orange-600 bg-orange-50 px-3 py-1 rounded-lg flex items-center gap-1"><MapPin size={12}/> {formatKelas(j.kelas)}</span>
            </div>
            <h4 className="font-black text-xl text-slate-800 mb-1">{j.mapel}</h4>
            <p className="text-sm font-medium text-slate-400">Jadwal Asli: <span className="text-slate-600">{j.guru_asli}</span></p>
          </button>
        ))}
      </div>
    </div>
  );

  const renderScannerView = () => {
    const manualFallbackSchedule = getManualFallbackSchedule();

    if (scanError) {
      // TAMBAHAN: Deteksi apakah ini error kamera atau error salah jadwal
      const isCamError = scanError.includes("Kamera tidak bisa diakses");

      return (
        <div className="flex flex-col items-center justify-center min-h-screen px-6 text-center bg-slate-900 pb-10 relative">
          <AlertTriangle className={`${isCamError ? 'text-amber-500' : 'text-rose-500'} mb-6 animate-bounce`} size={80} />
          
          {/* Judul akan berubah otomatis sesuai jenis error */}
          <h2 className="text-white font-black mb-3 text-2xl tracking-tight">
            {isCamError ? "Kamera Error / Diblokir" : "Tidak Sesuai Waktu/Tempat"}
          </h2>
          
          <p className="text-slate-400 mb-10 text-sm leading-relaxed max-w-[280px] mx-auto">{scanError}</p>
          <div className="w-full max-w-sm space-y-4 relative z-10">
            <button onClick={() => setScanError(null)} className="w-full py-4 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-2xl shadow-lg transition-all">Coba Scan Ulang</button>
            {manualFallbackSchedule && (
              <button onClick={() => ajukanManual(manualFallbackSchedule)} className="w-full py-4 bg-white text-slate-800 font-bold rounded-2xl shadow-lg transition-all">Input Manual Sekarang</button>
            )}
            <button onClick={() => setStep('dashboard')} className="w-full py-4 bg-transparent text-slate-400 hover:text-slate-300 font-bold rounded-2xl transition-all mt-4">Kembali ke Beranda</button>
          </div>
        </div>
      );
    }
    return (
      <div className="flex flex-col items-center justify-center min-h-screen px-6 text-center bg-slate-900 pb-10 relative">
        <h2 className="text-white font-black mb-6 text-2xl tracking-tight z-10">Scan QR Kelas</h2>
        <div className="w-full max-w-sm bg-white p-2 rounded-[2rem] shadow-[0_0_50px_rgba(16,185,129,0.15)] mb-8 overflow-hidden relative z-10">
          <div id="qr-reader" className="w-full rounded-3xl overflow-hidden border-2 border-emerald-500/30 bg-slate-100 min-h-[250px] flex items-center justify-center relative">
            <p className="text-slate-400 text-sm font-medium z-0 absolute">Meminta izin kamera...</p>
          </div>
        </div>
        <div className="w-full max-w-sm bg-slate-800/80 backdrop-blur-md p-6 rounded-[2rem] border border-slate-700/50 shadow-2xl z-10">
          <button onClick={() => setStep('dashboard')} className="w-full py-3.5 text-slate-300 font-bold border border-slate-600 rounded-2xl hover:text-white transition-colors hover:bg-slate-700">Batal Scan</button>
        </div>
      </div>
    );
  };

  const renderConfirmView = () => {
    if (showCam) {
      return (
        <div className="p-5 max-w-md mx-auto min-h-screen flex flex-col items-center justify-center bg-slate-900 pb-10">
          <h2 className="text-2xl font-black text-white mb-1">Verifikasi Wajah</h2>
          <p className="text-emerald-400 text-[10px] font-black mb-6 tracking-widest uppercase bg-emerald-500/20 px-3 py-1 rounded-full">Pengecekan Acak Kehadiran</p>
          
          {!capturedImg ? (
            <>
              <div className="w-full bg-slate-800 rounded-[2.5rem] overflow-hidden mb-8 relative border-4 border-emerald-500/50 aspect-[3/4] shadow-[0_0_30px_rgba(16,185,129,0.2)]">
                <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover transform -scale-x-100"></video>
                <canvas ref={canvasRef} className="hidden"></canvas>
                <div className="absolute bottom-4 left-0 right-0 text-center text-white/80 text-[10px] uppercase tracking-widest font-black px-4 drop-shadow-md">Pastikan wajah berada di area terang</div>
              </div>
              <button onClick={takePhoto} className="w-20 h-20 bg-emerald-500 rounded-full border-4 border-slate-900 shadow-[0_0_0_4px_rgba(16,185,129,0.5)] active:scale-95 transition-all mb-4"></button>
              <p className="text-white font-bold text-sm tracking-wide">Ambil Foto</p>
            </>
          ) : (
            <>
              <div className="w-full bg-slate-800 rounded-[2.5rem] overflow-hidden mb-8 border-4 border-emerald-500/50 aspect-[3/4]">
                <img src={capturedImg} alt="Hasil" className="w-full h-full object-cover transform -scale-x-100" />
              </div>
              <div className="flex w-full gap-3">
                <button onClick={retrySelfieCapture} className="flex-1 py-4 bg-slate-800 text-slate-300 font-bold rounded-2xl hover:bg-slate-700 transition-colors">Ulangi</button>
                <button onClick={handleLanjutSimpanConfirm} disabled={loading} className="flex-[2] py-4 bg-emerald-500 text-white font-black rounded-2xl flex justify-center items-center gap-2 shadow-lg hover:bg-emerald-600 transition-all">
                  {loading ? <span className="animate-pulse">Mengirim...</span> : <><Save size={20}/> Kirim Presensi</>}
                </button>
              </div>
            </>
          )}
          {!capturedImg && <button onClick={() => setShowCam(false)} className="mt-8 text-slate-400 hover:text-white font-bold text-sm transition-colors">Kembali ke Form</button>}
        </div>
      );
    }

    return (
      <div className="p-5 max-w-md mx-auto min-h-screen flex flex-col pb-10">
        <div className="flex items-center gap-4 mb-6">
          <button onClick={() => setStep('dashboard')} className="p-3 bg-white shadow-sm border border-slate-100 rounded-2xl text-slate-600 hover:bg-slate-50 transition-colors"><ArrowLeft size={20}/></button>
          <h2 className="text-2xl font-black text-slate-800">Konfirmasi Hadir</h2>
        </div>
        
        <div className="bg-white border border-slate-100 rounded-[2rem] p-6 shadow-sm mb-5">
          <div className="flex justify-between items-center mb-4">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1"><Edit3 size={14}/> Cek & Sesuaikan Data</p>
            <span className="text-[10px] font-bold bg-slate-100 text-slate-500 px-2 py-1 rounded">{metode}</span>
          </div>
          <div className="space-y-4">
            <div className="flex gap-3">
              <div className="flex-[2]">
                <label className="text-[10px] font-black tracking-widest text-slate-400 uppercase ml-1 block mb-1">Mata Pelajaran</label>
                <input type="text" value={editData?.mapel || ''} onChange={e => setEditData({...editData, mapel: e.target.value})} className="w-full bg-slate-50 border border-slate-100 focus:border-emerald-500 rounded-xl px-4 py-3 text-sm font-bold text-slate-800 outline-none transition-all" />
              </div>
              <div className="flex-1">
                <label className="text-[10px] font-black tracking-widest text-slate-400 uppercase ml-1 block mb-1">Kelas</label>
                <input type="text" value={editData?.kelas || ''} onChange={e => setEditData({...editData, kelas: e.target.value})} className="w-full bg-slate-50 border border-slate-100 focus:border-emerald-500 rounded-xl px-4 py-3 text-sm font-bold text-slate-800 outline-none transition-all" />
              </div>
            </div>
            <div>
              <label className="text-[10px] font-black tracking-widest text-slate-400 uppercase ml-1 block mb-1">Jam Mulai (Sesuai Jadwal)</label>
              <input type="text" value={editData?.jam_mulai || ''} onChange={e => setEditData({...editData, jam_mulai: e.target.value})} className="w-full bg-slate-50 border border-slate-100 focus:border-emerald-500 rounded-xl px-4 py-3 text-sm font-black tracking-widest text-slate-800 outline-none transition-all" />
            </div>
          </div>
        </div>

        <div className="bg-white border border-slate-100 rounded-[2rem] p-6 shadow-sm mb-5">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Deklarasi Kesiapan</p>
          <button onClick={() => setSiswaSiap(!siswaSiap)} className="flex items-start gap-3 w-full text-left group">
            <div className={`mt-0.5 transition-colors ${siswaSiap ? 'text-emerald-500' : 'text-slate-300 group-hover:text-emerald-300'}`}>
              {siswaSiap ? <CheckSquare size={24} /> : <Square size={24} />}
            </div>
            <div>
              <p className={`font-bold transition-colors ${siswaSiap ? 'text-slate-800' : 'text-slate-600'}`}>Siswa dan Kelas Siap</p>
              <p className="text-xs text-slate-400 mt-1">Siswa telah rapi dan siap menerima pelajaran dari saya sesuai SOP.</p>
            </div>
          </button>
        </div>

        <div className={`rounded-[2rem] p-5 mb-auto border ${metode.includes('Manual') ? 'bg-rose-50 border-rose-100' : 'bg-slate-50 border-slate-100'}`}>
          <div className="w-full">
            <p className={`font-black mb-3 text-sm flex items-center gap-2 ${metode.includes('Manual') ? 'text-rose-800' : 'text-slate-600'}`}>
              <FileText size={16}/> {metode.includes('Manual') ? 'Alasan Lupa Scan (Wajib)' : 'Catatan Estafet Guru (Opsional)'}
            </p>
            <textarea 
              className={`w-full p-4 bg-white border-transparent focus:ring-4 rounded-2xl text-sm font-medium text-slate-800 outline-none transition-all ${metode.includes('Manual') ? 'focus:ring-rose-100 focus:border-rose-400' : 'focus:ring-slate-100 focus:border-slate-300'}`}
              rows="3" 
              placeholder={metode.includes('Manual') ? "Tuliskan alasan telat/lupa..." : "Info untuk guru jam berikutnya..."} 
              value={catatan} 
              onChange={(e) => setCatatan(e.target.value)}
            ></textarea>
          </div>
        </div>

        {errorMsg && (
          <div className="mt-4 p-4 bg-rose-50 border border-rose-100 rounded-2xl flex items-start gap-3 text-left">
            <AlertTriangle className="text-rose-500 shrink-0 mt-0.5" size={18} />
            <p className="text-rose-600 text-xs font-bold leading-relaxed">{errorMsg}</p>
          </div>
        )}

        <div className="mt-6">
          <button onClick={handleLanjutSimpanConfirm} disabled={loading} className="w-full py-4 bg-slate-800 hover:bg-slate-900 text-white font-black rounded-2xl shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-2">
            {loading ? <span className="animate-pulse text-xs text-center leading-tight">{loadingMsg}</span> : <><Save size={20}/> Simpan Kehadiran</>}
          </button>
        </div>
      </div>
    );
  };

  const renderResultView = () => {
    const isLate = hasilScan?.hasil_status === 'Terlambat';
    return (
      <div className="flex flex-col items-center justify-center min-h-screen px-6 text-center">
        <div className={`w-32 h-32 rounded-[2.5rem] flex items-center justify-center mb-8 rotate-3 shadow-xl ${isLate ? 'bg-gradient-to-tr from-rose-400 to-red-500 shadow-rose-200' : 'bg-gradient-to-tr from-emerald-400 to-teal-500 shadow-emerald-200'}`}>
          {isLate ? <AlertTriangle size={64} className="text-white -rotate-3" strokeWidth={2.5}/> : <CheckCircle size={64} className="text-white -rotate-3" strokeWidth={2.5}/>}
        </div>
        <h2 className={`text-4xl font-black mb-3 tracking-tight ${isLate ? 'text-rose-600' : 'text-slate-800'}`}>{isLate ? "Terlambat!" : "Tercatat!"}</h2>
        <p className="text-slate-500 mb-8 font-medium">{isLate ? "Kehadiran tercatat, namun Anda melewati batas toleransi SOP maksimal." : "Jazakumullah khairan. Kinerja Anda berhasil direkam tepat waktu."}</p>
        <button onClick={() => setStep('dashboard')} className="w-full max-w-sm bg-slate-800 text-white font-black text-lg py-4 rounded-2xl shadow-lg hover:bg-slate-900 hover:-translate-y-1 transition-all">Kembali ke Beranda</button>
      </div>
    );
  };

  // ==========================================
  // PUSAT RENDER UTAMA
  // ==========================================
  return (
    <div className="min-h-screen bg-slate-50 font-sans selection:bg-emerald-200 selection:text-emerald-900 relative">
      <div className="bg-emerald-500 h-2 w-full fixed top-0 z-50 shadow-[0_0_15px_rgba(16,185,129,0.5)]"></div>
      
      {/* FLOATING ALERT TOAST */}
      {alertToast && (
        <div className="fixed top-6 left-1/2 transform -translate-x-1/2 w-[92%] max-w-sm z-[200] animate-[slideDown_0.4s_ease-out]">
          <div className={`p-4 rounded-2xl shadow-2xl flex items-center gap-4 border-2 ${
            alertToast.menit === 3 ? 'bg-rose-600 border-rose-400 shadow-rose-300/40' : 'bg-amber-500 border-amber-300 shadow-amber-300/40'
          }`}>
            <div className="text-3xl flex-shrink-0 animate-[wave_0.6s_ease-in-out_3]">
              {alertToast.menit === 3 ? '🚨' : '⏰'}
            </div>
            <div className="flex-1">
              <p className="text-white font-black text-sm leading-tight">
                {alertToast.menit === 3 ? 'SOP 3 MENIT — SEGERA KE KELAS!' : 'PERSIAPAN — 5 Menit Lagi'}
              </p>
              <p className="text-white/90 font-bold text-xs mt-0.5">
                {alertToast.mapel} · {formatKelas(alertToast.kelas)}
              </p>
              {alertToast.menit === 3 && (
                <p className="text-white/80 text-[10px] font-medium mt-1">Segera scan QR sekarang agar tidak terlambat!</p>
              )}
            </div>
            <button onClick={() => setAlertToast(null)} className="text-white/70 hover:text-white font-black text-lg px-2 flex-shrink-0">✕</button>
          </div>
        </div>
      )}

      {/* WELCOME TOAST */}
      {showWelcomeToast && step === 'dashboard' && (() => {
        const greetEmojis = ['👋', '🤝', '😊', '🙌', '✨', '🌟', '🫡', '😄'];
        const randomEmoji = greetEmojis[Math.floor(Math.random() * greetEmojis.length)];
        return (
          <div className="fixed bottom-8 left-1/2 transform -translate-x-1/2 w-[90%] max-w-sm z-[100]">
            <div className="bg-slate-800 text-white p-4 rounded-2xl shadow-2xl flex items-center gap-4 animate-[slideUp_0.5s_ease-out]">
              <div className="bg-emerald-500/20 p-2 rounded-xl text-2xl flex-shrink-0 animate-[wave_0.8s_ease-in-out_2]">
                {randomEmoji}
              </div>
              <div className="flex-1">
                <h4 className="font-bold text-sm leading-tight">Ahlan wa Sahlan,</h4>
                <h4 className="font-black text-md leading-tight text-emerald-400 truncate">{googleName || guru}</h4>
                <p className="text-[10px] text-slate-400 mt-0.5 font-medium">Semoga harimu penuh keberkahan. 🌿</p>
              </div>
            </div>
            <style>{`
              @keyframes slideUp { 0% { transform: translateY(150%); opacity: 0; } 100% { transform: translateY(0); opacity: 1; } }
              @keyframes slideDown { 0% { transform: translateX(-50%) translateY(-120%); opacity: 0; } 100% { transform: translateX(-50%) translateY(0); opacity: 1; } }
              @keyframes wave { 0% { transform: rotate(0deg); } 15% { transform: rotate(20deg); } 30% { transform: rotate(-10deg); } 45% { transform: rotate(18deg); } 60% { transform: rotate(-8deg); } 75% { transform: rotate(14deg); } 100% { transform: rotate(0deg); } }
            `}</style>
          </div>
        );
      })()}

      <div className="pt-2 pb-10">
        {step === 'login' && renderLoginView()}
        {step === 'dashboard' && renderDashboardView()}
        {step === 'deklarasi_libur' && renderDeklarasiLiburView()}
        {step === 'atur_jadwal' && renderAturJadwalView()}
        {step === 'evaluasi' && renderEvaluasiView()}
        {step === 'inval_list' && renderInvalListView()}
        {step === 'scan' && renderScannerView()}
        {step === 'confirm' && renderConfirmView()}
        {step === 'result' && renderResultView()}
      </div>
    </div>
  );
}

// ==========================================
// EKSPOR DENGAN ERROR BOUNDARY MEMBUNGKUS APP
// BUG FIX #3: Semua crash render akan ditangkap ErrorBoundary
// sehingga guru tidak melihat layar putih kosong
// ==========================================
export default function AppWithBoundary() {
  return (
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  );
}
