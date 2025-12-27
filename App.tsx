
import React, { useState, useEffect, useMemo } from 'react';
import { 
  Zap, 
  LayoutDashboard, 
  Calculator, 
  History, 
  LogOut, 
  Plus, 
  Trash2, 
  User as UserIcon,
  TrendingUp,
  Receipt,
  FileText,
  Loader2,
  Building2,
  Home,
  ChevronRight,
  ArrowRight,
  CheckCircle2,
  Info,
  ChevronDown,
  ChevronUp,
  Download,
  FileDown,
  AlertTriangle,
  ExternalLink,
  Facebook,
  Globe,
  Sparkles,
  RefreshCw,
  Gauge
} from 'lucide-react';
import { AppView, User, RoomInput, BillRecord, RentalProperty } from './types';
import { storageService } from './services/storageService';
import { calculateBill } from './logic/billCalculator';
import { exportService } from './services/exportService';
import { isFirebaseReady, firebaseConfig } from './firebase';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

// Official BrandLogo Component - Recreated as High-Fidelity SVG
const BrandLogo: React.FC<{ className?: string, textClassName?: string, hideText?: boolean }> = ({ 
  className = "h-10 w-10", 
  textClassName = "text-2xl",
  hideText = false
}) => (
  <div className="flex items-center gap-3 group">
    <div className={`relative ${className} transition-all duration-500 group-hover:scale-110 group-hover:drop-shadow-[0_0_15px_rgba(37,99,235,0.4)]`}>
      <svg viewBox="0 0 100 100" className="w-full h-full" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="50" cy="50" r="45" stroke="#2563eb" strokeWidth="6" />
        <circle cx="50" cy="50" r="38" stroke="#2563eb" strokeWidth="2" strokeDasharray="8 4" opacity="0.3" />
        <path d="M25 50 C 25 30, 40 25, 50 25 M75 50 C 75 70, 60 75, 50 75" stroke="#2563eb" strokeWidth="4" strokeLinecap="round" />
        <path d="M48 22 L52 25 L48 28" fill="#2563eb" />
        <path d="M52 72 L48 75 L52 78" fill="#2563eb" />
        <path d="M28 52 L32 48 L36 52 V58 H28 V52Z" fill="#2563eb" />
        <path d="M64 42 L68 38 L72 42 V48 H64 V42Z" fill="#2563eb" />
        <path d="M52 35 L40 55 H50 L48 70 L60 50 H50 L52 35Z" fill="#2563eb" />
      </svg>
    </div>
    {!hideText && (
      <span className={`font-black ${textClassName} tracking-tighter transition-colors duration-300`}>
        <span className="text-blue-600">Volt</span><span className="text-slate-400">Share</span>
      </span>
    )}
  </div>
);

// Animated Background Blobs
const EnergyField = () => (
  <div className="fixed inset-0 overflow-hidden pointer-events-none -z-10">
    <div className="energy-blob bg-blue-400 w-[500px] h-[500px] -top-24 -left-24" style={{ animationDelay: '0s' }}></div>
    <div className="energy-blob bg-indigo-400 w-[600px] h-[600px] top-1/2 -right-48" style={{ animationDelay: '-5s' }}></div>
    <div className="energy-blob bg-blue-600 w-[400px] h-[400px] -bottom-24 left-1/4" style={{ animationDelay: '-12s' }}></div>
  </div>
);

// Computation Breakdown Component
const ComputationBreakdown: React.FC<{ bill: BillRecord }> = ({ bill }) => (
  <div className="space-y-4 animate-in fade-in duration-500">
    <div className="overflow-x-auto">
      <table className="w-full text-left border-separate border-spacing-y-2">
        <thead>
          <tr className="text-[8px] font-black text-blue-400 uppercase tracking-widest">
            <th className="px-4 pb-2">Unit</th>
            <th className="px-4 pb-2 text-right">Raw kWh</th>
            <th className="px-4 pb-2 text-right">Share %</th>
            <th className="px-4 pb-2 text-right">Loss Shared</th>
            <th className="px-4 pb-2 text-right">Total</th>
          </tr>
        </thead>
        <tbody className="text-xs">
          {bill.rooms.map(room => (
            <tr key={room.id} className="bg-white/5 border border-white/10 rounded-xl">
              <td className="px-4 py-3 font-bold text-slate-200">{room.name}</td>
              <td className="px-4 py-3 text-right text-slate-400">{room.originalKwh.toFixed(2)}</td>
              <td className="px-4 py-3 text-right text-blue-400 font-black">{(room.share * 100).toFixed(1)}%</td>
              <td className="px-4 py-3 text-right text-amber-400">+{room.compensationKwh.toFixed(2)}</td>
              <td className="px-4 py-3 text-right font-black text-white">₱{room.billAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
    <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-2xl">
      <p className="text-[10px] font-medium text-blue-300 leading-relaxed italic flex gap-2">
        <Info size={12} className="shrink-0" />
        Loss Distribution Formula: [Raw Consumption / Total Submeter] × [Main Meter - Total Submeter]. This ensures system losses are paid proportionally by usage.
      </p>
    </div>
  </div>
);

// Firebase Config Error View
const ConfigErrorView: React.FC = () => (
  <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-slate-50 text-center relative overflow-hidden">
    <EnergyField />
    <div className="max-w-md w-full bg-white p-10 rounded-[3rem] shadow-2xl border border-red-100 space-y-6 z-10 glass">
      <div className="w-20 h-20 bg-red-50 text-red-500 rounded-3xl flex items-center justify-center mx-auto mb-4">
        <AlertTriangle size={40} />
      </div>
      <h2 className="text-3xl font-black text-slate-900 tracking-tighter">System Offline</h2>
      <p className="text-slate-500 font-medium text-sm">Firebase credentials are missing or invalid. Please configure your environment variables to activate the VoltShare engine.</p>
      <div className="bg-slate-50 p-4 rounded-2xl text-[10px] font-mono text-left overflow-auto text-slate-400 border border-slate-100">
        FIREBASE_API_KEY=...<br/>
        FIREBASE_PROJECT_ID=...
      </div>
      <a href="https://console.firebase.google.com/" target="_blank" rel="noopener noreferrer" className="block w-full py-4 bg-slate-900 text-white rounded-2xl font-black hover:bg-slate-800 transition shadow-xl shadow-slate-900/20">Open Firebase Console</a>
    </div>
  </div>
);

interface LandingViewProps {
  setView: (v: AppView) => void;
  landingMainKwh: string;
  setLandingMainKwh: (v: string) => void;
  rate: string;
  setRate: (v: string) => void;
  landingRooms: RoomInput[];
  setLandingRooms: (v: RoomInput[]) => void;
  landingResult: BillRecord | null;
  setLandingResult: (v: BillRecord | null) => void;
  showBreakdown: boolean;
  setShowBreakdown: (v: boolean) => void;
  saveLandingCalc: () => void;
  handleLandingCalculate: () => void;
  actionLoading: boolean;
  user: User | null;
  globalUsage: number;
  isStale: boolean;
}

const LandingView: React.FC<LandingViewProps> = ({ 
  setView, landingMainKwh, setLandingMainKwh, rate, setRate, 
  landingRooms, setLandingRooms, landingResult, setLandingResult, showBreakdown, 
  setShowBreakdown, saveLandingCalc, handleLandingCalculate, actionLoading, user, globalUsage, isStale
}) => {
  const liveTotalSubmeter = useMemo(() => {
    return landingRooms.reduce((sum, r) => sum + (Number(r.kwh) || 0), 0);
  }, [landingRooms]);

  const liveMissingKwh = useMemo(() => {
    const main = Number(landingMainKwh) || 0;
    return Math.max(0, main - liveTotalSubmeter);
  }, [landingMainKwh, liveTotalSubmeter]);

  return (
    <div className="min-h-screen flex flex-col relative">
      <EnergyField />
      
      <nav className="p-6 flex justify-between items-center max-w-7xl mx-auto w-full z-10 animate-in fade-in slide-in-from-top-4 duration-700">
        <BrandLogo />
        <div className="flex gap-4 items-center">
          <div className="hidden sm:flex items-center gap-2 bg-white/50 border border-slate-200/50 px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-tighter text-slate-500 glass">
            <Globe size={12} className="text-blue-500 animate-pulse" />
            {globalUsage.toLocaleString()} Calcs Worldwide
          </div>
          <button onClick={() => setView('signin')} className="px-4 py-2 text-slate-600 hover:text-blue-600 font-bold transition">Login</button>
          <button onClick={() => setView('signup')} className="px-6 py-2 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition shadow-lg shadow-blue-200/50 hover:-translate-y-1 active:scale-95">Register</button>
        </div>
      </nav>

      <main className="flex-1 max-w-7xl mx-auto w-full px-6 flex flex-col lg:flex-row items-center lg:items-start gap-12 pt-12 pb-20 z-10">
        <div className="flex-1 space-y-10 animate-in fade-in slide-in-from-left-8 duration-1000">
          <div className="inline-flex items-center gap-2 bg-blue-100/80 text-blue-700 px-4 py-2 rounded-full text-xs font-black uppercase tracking-widest glass">
            <Sparkles size={14} className="animate-spin-slow" /> Powering Rental Clusters
          </div>
          <h1 className="text-6xl md:text-8xl font-black text-slate-900 leading-[0.9] tracking-tighter">
            Master Your <br/>
            <span className="gradient-text">Utility Logic.</span>
          </h1>
          <p className="text-xl text-slate-500 max-w-lg leading-relaxed font-medium">
            The ultimate proportional distribution algorithm. Eliminate tenant disputes by fairly allocating system losses based on real-time consumption shares.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-6 pt-4">
            <button onClick={() => setView('signup')} className="px-10 py-5 bg-slate-900 text-white rounded-2xl font-bold text-lg hover:bg-slate-800 transition shadow-2xl flex items-center justify-center gap-3 group">
              Get Started Free <ArrowRight size={20} className="group-hover:translate-x-2 transition-transform"/>
            </button>
            <div className="flex items-center gap-4 p-4 rounded-2xl border border-slate-200/50 glass">
              <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center text-white shadow-xl shadow-blue-500/20">
                 <Receipt size={24} />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Audit Trails</p>
                <p className="text-sm font-black text-slate-900">PDF & Excel Exports</p>
              </div>
            </div>
          </div>
        </div>

        <div className="flex-1 w-full max-w-2xl bg-white/80 p-8 rounded-[3rem] shadow-[0_32px_64px_-16px_rgba(0,0,0,0.1)] border border-white/50 glass animate-in fade-in slide-in-from-right-8 duration-1000 delay-200">
          <div className="space-y-8">
            <div className="flex justify-between items-end">
              <div>
                <h3 className="text-3xl font-black text-slate-900">Live Lab</h3>
                <p className="text-slate-500 text-sm font-medium">Configure and execute distribution</p>
              </div>
              {liveMissingKwh > 0 && (
                <div className="flex flex-col items-end animate-in fade-in zoom-in-90">
                  <span className="text-[10px] font-black text-amber-500 uppercase tracking-widest">Live Discrepancy</span>
                  <span className="text-xl font-black text-amber-600">+{liveMissingKwh.toFixed(2)} kWh</span>
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-2 group">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-2 group-hover:text-blue-500 transition">Main Meter (kWh)</label>
                <input type="text" inputMode="decimal" value={landingMainKwh} onChange={(e) => setLandingMainKwh(e.target.value)} className="w-full bg-slate-50/50 px-5 py-4 rounded-2xl border-2 border-transparent focus:border-blue-500/20 focus:bg-white transition text-xl font-black outline-none" />
              </div>
              <div className="space-y-2 group">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-2 group-hover:text-blue-500 transition">Rate (₱/kWh)</label>
                <input type="text" inputMode="decimal" value={rate} onChange={(e) => setRate(e.target.value)} className="w-full bg-slate-50/50 px-5 py-4 rounded-2xl border-2 border-transparent focus:border-blue-500/20 focus:bg-white transition text-xl font-black outline-none" />
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex justify-between items-center px-2">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Property Units</label>
                <button onClick={() => setLandingRooms([...landingRooms, { id: Date.now().toString(), name: `Unit ${landingRooms.length+1}`, kwh: '0' }])} className="bg-blue-50 text-blue-600 px-3 py-1.5 rounded-lg text-[10px] font-black hover:bg-blue-100 transition uppercase tracking-wider">+ New Unit</button>
              </div>
              <div className="space-y-3 max-h-64 overflow-y-auto pr-2 scrollbar-hide">
                {landingRooms.map(r => (
                  <div key={r.id} className="flex gap-4 items-center bg-white border border-slate-100 p-5 rounded-[1.5rem] shadow-sm hover:shadow-md hover:border-blue-200 transition-all duration-300">
                    <input type="text" value={r.name} onChange={(e) => setLandingRooms(landingRooms.map(lr => lr.id === r.id ? {...lr, name: e.target.value} : lr))} className="flex-1 bg-transparent border-none p-0 text-sm font-black text-slate-700 focus:ring-0" />
                    <div className="flex items-center gap-3">
                      <input type="text" inputMode="decimal" value={r.kwh} onChange={(e) => setLandingRooms(landingRooms.map(lr => lr.id === r.id ? {...lr, kwh: e.target.value} : lr))} className="w-24 bg-slate-50 border-none px-4 py-2 rounded-xl text-right font-black text-sm focus:ring-2 focus:ring-blue-500/20" />
                      <span className="text-[10px] text-slate-400 font-black uppercase tracking-widest">kWh</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex justify-center">
              <button 
                onClick={handleLandingCalculate} 
                disabled={actionLoading}
                className={`px-10 py-3 rounded-xl font-black text-sm shadow-xl transition active:scale-95 flex items-center justify-center gap-2 border-2 ${isStale ? 'bg-amber-500 border-amber-600 text-white' : 'bg-blue-600 border-blue-700 text-white hover:bg-blue-700'}`}
              >
                {actionLoading ? <Loader2 className="animate-spin" size={20}/> : <><Calculator size={20}/> Calculate bill</>}
              </button>
            </div>

            {landingResult && (
              <div className={`bg-slate-900 rounded-[2.5rem] p-8 text-white space-y-8 animate-in zoom-in-95 duration-500 shadow-2xl relative overflow-hidden transition-all duration-500 ${isStale ? 'opacity-40 grayscale-[0.5] scale-[0.98]' : 'opacity-100'}`}>
                <div className="absolute top-0 right-0 p-8 opacity-5"><Zap size={100} /></div>
                <div className="relative z-10 flex justify-between items-start">
                  <div>
                    <p className="text-[10px] text-blue-400 uppercase font-bold tracking-widest mb-1">Energy Loss Shared</p>
                    <p className="text-3xl font-black text-amber-400">{landingResult.missingKwh.toFixed(2)} <span className="text-sm font-medium">kWh</span></p>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] text-blue-400 uppercase font-bold tracking-widest mb-1">Total Cluster Bill</p>
                    <p className="text-3xl font-black">₱{landingResult.rooms.reduce((s, r) => s + r.billAmount, 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
                  </div>
                </div>

                <div className="relative z-10 space-y-4">
                  <div className="flex justify-between items-center">
                    <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Statement Overview</h4>
                    <button onClick={() => setShowBreakdown(!showBreakdown)} className="text-[10px] font-black text-blue-400 flex items-center gap-2 uppercase hover:underline">
                      {showBreakdown ? 'Hide Logic' : 'Audit Math'}
                      {showBreakdown ? <ChevronUp size={14}/> : <ChevronDown size={14}/>}
                    </button>
                  </div>
                  
                  {!showBreakdown ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {landingResult.rooms.map(room => (
                        <div key={room.id} className="flex justify-between items-center bg-white/5 border border-white/10 p-4 rounded-2xl">
                          <span className="text-xs font-bold text-slate-300">{room.name}</span>
                          <span className="font-black text-sm">₱{room.billAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <ComputationBreakdown bill={landingResult} />
                  )}
                </div>

                <div className="relative z-10 flex flex-col sm:flex-row gap-4">
                  <button onClick={() => setLandingResult(null)} className="flex-1 py-4 bg-white/10 hover:bg-white/20 rounded-2xl font-black text-[10px] uppercase tracking-widest transition border border-white/10">
                    Reset Values
                  </button>
                  <button onClick={() => exportService.toPDF(landingResult)} className="flex-1 py-4 bg-white/10 hover:bg-white/20 rounded-2xl font-black text-[10px] uppercase tracking-widest transition flex items-center justify-center gap-2 border border-white/10">
                    <FileDown size={16}/> PDF Report
                  </button>
                  <button onClick={saveLandingCalc} disabled={actionLoading || isStale} className="flex-[2] py-4 bg-blue-600 rounded-2xl font-black text-lg flex items-center justify-center gap-3 hover:bg-blue-500 transition shadow-2xl shadow-blue-600/20 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed">
                    {actionLoading ? <Loader2 className="animate-spin" size={24}/> : user ? <><CheckCircle2 size={24}/> Cloud Sync</> : <><Plus size={24}/> Secure Data</>}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>

      <footer className="max-w-7xl mx-auto w-full px-6 py-12 border-t border-slate-200 flex flex-col md:flex-row justify-between items-center gap-8 z-10 animate-in fade-in duration-1000">
        <div className="flex flex-col gap-1">
          <BrandLogo className="h-8 w-8" textClassName="text-xl" />
          <p className="text-slate-400 text-xs font-bold">The Gold Standard for Submeter Management.</p>
        </div>
        
        <a href="https://www.facebook.com/shemz.rhiew" target="_blank" rel="noopener noreferrer" className="flex items-center gap-4 bg-white px-6 py-4 rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-100 hover:border-blue-400 transition-all duration-300 group">
          <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
            <Facebook size={24} />
          </div>
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest group-hover:text-blue-500 transition">Contact Developer</p>
            <p className="text-sm font-black text-slate-900">Inquiries & Suggestions</p>
          </div>
          <ExternalLink size={14} className="text-slate-300 group-hover:text-blue-500" />
        </a>

        <div className="text-slate-300 text-[10px] font-black uppercase tracking-widest">
          © 2024 VoltShare System v2.0
        </div>
      </footer>
    </div>
  );
};

// Main App Component
const App: React.FC = () => {
  if (!isFirebaseReady) return <ConfigErrorView />;

  const [view, setView] = useState<AppView>('landing');
  const [user, setUser] = useState<User | null>(null);
  const [bills, setBills] = useState<BillRecord[]>([]);
  const [rentals, setRentals] = useState<RentalProperty[]>([]);
  const [globalUsage, setGlobalUsage] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);
  const [actionLoading, setActionLoading] = useState<boolean>(false);
  const [showBreakdown, setShowBreakdown] = useState(false);

  // States for Calculator
  const [rate, setRate] = useState<string>('12');
  const [month, setMonth] = useState<string>(new Date().toLocaleString('default', { month: 'long' }));
  const [year, setYear] = useState<number>(new Date().getFullYear());
  const [landingMainKwh, setLandingMainKwh] = useState<string>('200');
  const [landingRooms, setLandingRooms] = useState<RoomInput[]>([
    { id: 'l1', name: 'Unit 101', kwh: '90' },
    { id: 'l2', name: 'Unit 102', kwh: '100' },
  ]);
  const [landingResult, setLandingResult] = useState<BillRecord | null>(null);
  const [isStale, setIsStale] = useState<boolean>(false);

  const [selectedPropertyId, setSelectedPropertyId] = useState<string>('');
  const [mainKwh, setMainKwh] = useState<string>('0');
  const [rooms, setRooms] = useState<RoomInput[]>([]);
  const [tempCalculation, setTempCalculation] = useState<BillRecord | null>(null);
  const [newRentalName, setNewRentalName] = useState('');
  const [isAddingRental, setIsAddingRental] = useState(false);

  // Real-time Global Stats
  useEffect(() => {
    const unsub = storageService.onUsageUpdate((count) => setGlobalUsage(count));
    return () => unsub();
  }, []);

  // Sync Staleness
  useEffect(() => {
    if (landingResult) {
      setIsStale(true);
    }
  }, [landingMainKwh, rate, landingRooms]);

  // Auth & Data fetching
  useEffect(() => {
    const unsubscribe = storageService.onAuthUpdate(async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        try {
          const [fetchedBills, fetchedRentals] = await Promise.all([
            storageService.getBills(currentUser.id),
            storageService.getRentals(currentUser.id)
          ]);
          setBills(fetchedBills);
          setRentals(fetchedRentals);
          if (view === 'signin' || view === 'signup') setView('dashboard');
        } catch (e) { console.error(e); }
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const handleLandingCalculate = async () => {
    setActionLoading(true);
    // Simulate complex calculation process
    await new Promise(r => setTimeout(r, 600));
    const result = calculateBill(landingMainKwh, rate, landingRooms, month, year);
    setLandingResult(result);
    setIsStale(false);
    await storageService.incrementUsage();
    setActionLoading(false);
  };

  const handleAuth = async (e: React.FormEvent, type: 'signin' | 'signup') => {
    e.preventDefault();
    setActionLoading(true);
    const form = e.target as HTMLFormElement;
    const email = (form.elements.namedItem('email') as HTMLInputElement).value;
    const pass = (form.elements.namedItem('password') as HTMLInputElement).value;
    try {
      if (type === 'signin') await storageService.signIn(email, pass);
      else await storageService.signUp(email, pass, (form.elements.namedItem('fullname') as HTMLInputElement).value);
    } catch (err: any) { alert(err.message); }
    finally { setActionLoading(false); }
  };

  const handleLogout = async () => {
    await storageService.logout();
    setUser(null);
    setView('landing');
  };

  const saveLandingCalc = async () => {
    if (!user) { setView('signup'); return; }
    if (isStale) return;
    setActionLoading(true);
    try {
      await storageService.saveBill(landingResult!, user.id);
      setBills(await storageService.getBills(user.id));
      setView('history');
    } catch (e: any) { alert(e.message); }
    finally { setActionLoading(false); }
  };

  const handleCalculate = async () => {
    const result = calculateBill(mainKwh, rate, rooms, month, year);
    const selectedProp = rentals.find(p => p.id === selectedPropertyId);
    if (selectedProp) {
      result.propertyId = selectedProp.id;
      result.propertyName = selectedProp.name;
    }
    setTempCalculation(result);
    // Increment global stats on every audit trail generation
    await storageService.incrementUsage();
  };

  const saveBill = async () => {
    if (tempCalculation && user) {
      setActionLoading(true);
      try {
        await storageService.saveBill(tempCalculation, user.id);
        setBills(await storageService.getBills(user.id));
        setTempCalculation(null);
        setMainKwh('0');
        setView('history');
      } catch (err: any) { alert(err.message); }
      finally { setActionLoading(false); }
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 relative overflow-hidden">
        <EnergyField />
        <div className="relative">
          <Loader2 className="animate-spin text-blue-600 mb-4" size={64} />
          <div className="absolute inset-0 blur-2xl bg-blue-400/20 rounded-full animate-pulse"></div>
        </div>
        <p className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] animate-pulse">VoltShare Syncing</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex overflow-x-hidden">
      {user && (
        <aside className="hidden lg:flex w-80 flex-col bg-white border-r border-slate-200 p-8 fixed h-full z-30 shadow-2xl shadow-slate-200/50">
          <div className="mb-12 cursor-pointer" onClick={() => setView('dashboard')}>
            <BrandLogo />
          </div>
          <nav className="flex-1 space-y-3">
            <button onClick={() => setView('dashboard')} className={`w-full flex items-center gap-4 px-5 py-4 rounded-2xl font-black text-sm transition-all duration-300 ${view === 'dashboard' ? 'bg-blue-600 text-white shadow-xl shadow-blue-500/30 -translate-y-1' : 'text-slate-500 hover:bg-slate-50'}`}><LayoutDashboard size={20} /> Dashboard</button>
            <button onClick={() => setView('rentals')} className={`w-full flex items-center gap-4 px-5 py-4 rounded-2xl font-black text-sm transition-all duration-300 ${view === 'rentals' ? 'bg-blue-600 text-white shadow-xl shadow-blue-500/30 -translate-y-1' : 'text-slate-500 hover:bg-slate-50'}`}><Building2 size={20} /> Properties</button>
            <button onClick={() => setView('calculator')} className={`w-full flex items-center gap-4 px-5 py-4 rounded-2xl font-black text-sm transition-all duration-300 ${view === 'calculator' ? 'bg-blue-600 text-white shadow-xl shadow-blue-500/30 -translate-y-1' : 'text-slate-500 hover:bg-slate-50'}`}><Calculator size={20} /> Logic Lab</button>
            <button onClick={() => setView('history')} className={`w-full flex items-center gap-4 px-5 py-4 rounded-2xl font-black text-sm transition-all duration-300 ${view === 'history' ? 'bg-blue-600 text-white shadow-xl shadow-blue-500/30 -translate-y-1' : 'text-slate-500 hover:bg-slate-50'}`}><History size={20} /> History</button>
          </nav>
          
          <div className="mt-6 pt-6 border-t border-slate-100 mb-8 space-y-4">
            <div className="bg-slate-50 p-4 rounded-2xl">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Community Pulse</p>
              <div className="flex items-center gap-2 text-slate-700">
                <Globe size={14} className="text-blue-500" />
                <span className="text-xs font-black">{globalUsage.toLocaleString()} Cycles</span>
              </div>
            </div>
            <a href="https://www.facebook.com/shemz.rhiew" target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 px-5 py-3 text-[10px] font-black text-slate-400 hover:text-blue-600 transition group border border-dashed border-slate-200 rounded-2xl">
              <Facebook size={14} className="group-hover:text-blue-600" />
              <span>Reach Developer</span>
            </a>
          </div>

          <div className="pt-8 border-t border-slate-100">
            <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-2xl mb-4">
               <div className="w-10 h-10 bg-white shadow-sm border border-slate-100 text-blue-600 rounded-xl flex items-center justify-center"><UserIcon size={20} /></div>
               <div className="overflow-hidden"><p className="text-sm font-black text-slate-900 truncate">{user?.name}</p><p className="text-[10px] font-bold text-slate-400 truncate uppercase tracking-tighter">{user?.email}</p></div>
            </div>
            <button onClick={handleLogout} className="w-full flex items-center gap-4 px-5 py-4 rounded-2xl font-black text-slate-400 hover:text-red-500 transition hover:bg-red-50"><LogOut size={20} /> Sign Out</button>
          </div>
        </aside>
      )}

      <main className={`flex-1 ${user ? 'lg:ml-80' : ''} p-0 min-h-screen relative`}>
        {view === 'landing' ? (
          <LandingView 
            setView={setView}
            landingMainKwh={landingMainKwh}
            setLandingMainKwh={setLandingMainKwh}
            rate={rate}
            setRate={setRate}
            landingRooms={landingRooms}
            setLandingRooms={setLandingRooms}
            landingResult={landingResult}
            setLandingResult={setLandingResult}
            showBreakdown={showBreakdown}
            setShowBreakdown={setShowBreakdown}
            saveLandingCalc={saveLandingCalc}
            handleLandingCalculate={handleLandingCalculate}
            actionLoading={actionLoading}
            user={user}
            globalUsage={globalUsage}
            isStale={isStale}
          />
        ) : (
          <>
            <EnergyField />
            <div className="p-6 md:p-12 pb-24 lg:pb-12 z-10 relative">
              {view === 'signin' || view === 'signup' ? (
                <AuthView type={view as any} handleAuth={handleAuth} actionLoading={actionLoading} setView={setView} />
              ) : (
                <div className="max-w-6xl mx-auto space-y-12 animate-in fade-in slide-in-from-bottom-8 duration-700">
                   {view === 'dashboard' && (
                     <div className="space-y-8">
                       <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                         <div>
                           <h1 className="text-5xl font-black text-slate-900 tracking-tighter">Command <span className="text-blue-600">Center</span></h1>
                           <p className="text-slate-500 font-medium">Hello, {user?.name}. Your rental network is healthy.</p>
                         </div>
                         <button onClick={() => setView('calculator')} className="px-8 py-4 bg-blue-600 text-white rounded-2xl font-black shadow-2xl shadow-blue-500/30 flex items-center gap-3 hover:-translate-y-1 transition active:scale-95">
                           <Plus size={24} /> New Audit Trail
                         </button>
                       </header>
                       <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                          <StatCard title="Global Rank" value={`#${Math.floor(globalUsage/100)+1}`} icon={<Sparkles size={20} />} color="blue" />
                          <StatCard title="Properties" value={rentals.length} icon={<Home size={20} />} color="emerald" />
                          <StatCard title="Cycles Ran" value={bills.length} icon={<History size={20} />} color="amber" />
                          <StatCard title="Total Collected" value={`₱${bills.reduce((s, b) => s + b.rooms.reduce((rs, r) => rs + r.billAmount, 0), 0).toLocaleString()}`} icon={<Receipt size={20} />} color="indigo" />
                       </div>
                     </div>
                   )}
                   {view === 'calculator' && (
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                         <div className="space-y-6">
                            <h2 className="text-3xl font-black text-slate-900 tracking-tighter">Audit Logic <span className="text-blue-600">Input</span></h2>
                            <div className="bg-white p-8 rounded-[2.5rem] shadow-xl border border-slate-100 glass space-y-8">
                               <div>
                                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-2 block">Cluster Selection</label>
                                  <select value={selectedPropertyId} onChange={(e) => {
                                    setSelectedPropertyId(e.target.value);
                                    const p = rentals.find(x => x.id === e.target.value);
                                    if(p) setRooms(p.rooms.map(r => ({ id: r.id, name: r.name, kwh: '0' })));
                                  }} className="w-full bg-slate-50 border-none px-5 py-4 rounded-2xl font-black text-slate-700 outline-none focus:ring-2 focus:ring-blue-500/20">
                                     <option value="">Manual Entry</option>
                                     {rentals.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                                  </select>
                               </div>
                               <div className="grid grid-cols-2 gap-6">
                                  <div className="group">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block group-hover:text-blue-600 transition">Rate (₱)</label>
                                    <input type="text" inputMode="decimal" value={rate} onChange={(e) => setRate(e.target.value)} className="w-full bg-slate-50 border-none px-5 py-4 rounded-2xl font-black text-blue-600 text-xl outline-none focus:ring-2 focus:ring-blue-500/20" />
                                  </div>
                                  <div className="group">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block group-hover:text-blue-600 transition">Main Meter</label>
                                    <input type="text" inputMode="decimal" value={mainKwh} onChange={(e) => setMainKwh(e.target.value)} className="w-full bg-slate-50 border-none px-5 py-4 rounded-2xl font-black text-slate-900 text-xl outline-none focus:ring-2 focus:ring-blue-500/20" />
                                  </div>
                               </div>
                            </div>
                            <div className="space-y-3">
                               {rooms.map(r => (
                                 <div key={r.id} className="flex gap-4 items-center bg-white p-4 rounded-2xl border border-slate-100">
                                    <span className="flex-1 font-black text-sm">{r.name}</span>
                                    <input type="text" inputMode="decimal" value={r.kwh} onChange={(e) => setRooms(rooms.map(rm => rm.id === r.id ? {...rm, kwh: e.target.value} : rm))} className="w-24 bg-slate-50 border-none px-4 py-2 rounded-xl text-right font-black text-sm focus:ring-2 focus:ring-blue-500/20" />
                                 </div>
                               ))}
                            </div>
                            <button onClick={handleCalculate} className="w-full py-5 bg-blue-600 text-white rounded-[2rem] font-black text-xl shadow-2xl shadow-blue-500/30 hover:bg-blue-500 transition active:scale-95">Generate Audit Trail</button>
                         </div>
                         <div>
                            {tempCalculation ? (
                               <div className="bg-slate-900 text-white p-10 rounded-[3rem] shadow-2xl space-y-10 animate-in zoom-in-95 duration-500">
                                  <div className="flex justify-between items-end border-b border-white/10 pb-8">
                                     <h3 className="text-4xl font-black tracking-tighter">{tempCalculation.month} {tempCalculation.year}</h3>
                                     <button onClick={saveBill} disabled={actionLoading} className="px-8 py-3 bg-blue-600 rounded-xl font-black hover:bg-blue-500 transition shadow-xl shadow-blue-500/20">{actionLoading ? <Loader2 className="animate-spin" /> : 'Cloud Save'}</button>
                                  </div>
                                  <ComputationBreakdown bill={tempCalculation} />
                               </div>
                            ) : (
                               <div className="h-full bg-white/50 border-2 border-dashed border-slate-200 rounded-[3rem] flex flex-col items-center justify-center p-20 text-center glass">
                                  <Calculator size={80} className="text-slate-200 mb-6" />
                                  <h4 className="text-xl font-black text-slate-400">Logic Lab Offline</h4>
                                  <p className="text-slate-300 font-medium">Configure your inputs to generate a trail.</p>
                               </div>
                            )}
                         </div>
                      </div>
                   )}
                   {view === 'history' && (
                     <div className="grid grid-cols-1 gap-4">
                        {bills.map(b => (
                          <div key={b.id} className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm flex items-center justify-between hover:shadow-xl transition duration-500 group glass">
                             <div className="flex items-center gap-6">
                                <div className="w-16 h-16 bg-slate-50 border border-slate-100 rounded-2xl flex flex-col items-center justify-center group-hover:bg-blue-600 group-hover:border-blue-500 transition-colors duration-500">
                                   <span className="text-blue-600 font-black text-sm group-hover:text-white uppercase">{b.month.substring(0,3)}</span>
                                   <span className="text-slate-400 text-[10px] font-black group-hover:text-blue-100">{b.year}</span>
                                </div>
                                <div>
                                   <p className="text-xl font-black text-slate-900 tracking-tighter">{b.propertyName || 'Custom Cluster'}</p>
                                   <div className="flex gap-3 mt-1">
                                      <span className="px-2 py-0.5 bg-blue-50 text-blue-600 rounded-md text-[8px] font-black uppercase tracking-widest">{b.rooms.length} Units</span>
                                      <span className="px-2 py-0.5 bg-amber-50 text-amber-600 rounded-md text-[8px] font-black uppercase tracking-widest">P{b.ratePerKwh}/kWh</span>
                                   </div>
                                </div>
                             </div>
                             <div className="text-right">
                                <p className="text-2xl font-black text-slate-900 tracking-tighter">₱{b.rooms.reduce((s,r) => s+r.billAmount,0).toLocaleString()}</p>
                                <div className="flex gap-2 justify-end mt-1">
                                   <button onClick={() => exportService.toPDF(b)} className="text-blue-500 hover:text-blue-700 transition"><Download size={18}/></button>
                                   <button onClick={() => storageService.deleteBill(b.id).then(() => storageService.getBills(user!.id).then(setBills))} className="text-slate-300 hover:text-red-500 transition"><Trash2 size={18}/></button>
                                </div>
                             </div>
                          </div>
                        ))}
                     </div>
                   )}
                </div>
              )}
            </div>
          </>
        )}
      </main>

      {user && (
        <nav className="lg:hidden fixed bottom-6 left-6 right-6 bg-white/80 border border-white/50 px-6 py-4 flex justify-between items-center z-40 rounded-[2.5rem] shadow-[0_24px_48px_-12px_rgba(0,0,0,0.1)] glass">
          <button onClick={() => setView('dashboard')} className={`flex flex-col items-center gap-1 ${view === 'dashboard' ? 'text-blue-600' : 'text-slate-400'}`}><LayoutDashboard size={24} /></button>
          <button onClick={() => setView('rentals')} className={`flex flex-col items-center gap-1 ${view === 'rentals' ? 'text-blue-600' : 'text-slate-400'}`}><Building2 size={24} /></button>
          <button onClick={() => setView('calculator')} className={`flex flex-col items-center gap-1 ${view === 'calculator' ? 'text-blue-600' : 'text-slate-400'}`}><div className="w-12 h-12 bg-blue-600 -mt-8 rounded-full flex items-center justify-center text-white shadow-xl shadow-blue-500/40"><Plus size={24}/></div></button>
          <button onClick={() => setView('history')} className={`flex flex-col items-center gap-1 ${view === 'history' ? 'text-blue-600' : 'text-slate-400'}`}><History size={24} /></button>
          <button onClick={handleLogout} className="flex flex-col items-center gap-1 text-slate-400"><LogOut size={24} /></button>
        </nav>
      )}
    </div>
  );
};

const StatCard: React.FC<{ title: string, value: any, icon: any, color: string }> = ({ title, value, icon, color }) => (
  <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100 hover:shadow-2xl hover:border-blue-100 transition-all duration-500 group glass">
    <div className={`w-12 h-12 bg-${color}-50 text-${color}-600 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform`}>{icon}</div>
    <p className="text-[10px] text-slate-400 uppercase font-black tracking-widest mb-1">{title}</p>
    <p className="text-3xl font-black text-slate-900 tracking-tighter">{value}</p>
  </div>
);

const AuthView: React.FC<{ type: 'signin' | 'signup', handleAuth: any, actionLoading: boolean, setView: any }> = ({ type, handleAuth, actionLoading, setView }) => (
  <div className="min-h-[80vh] flex items-center justify-center p-6">
    <div className="bg-white/80 p-12 rounded-[3rem] shadow-2xl w-full max-w-md space-y-10 border border-white/50 glass animate-in zoom-in-95 duration-500">
      <div className="text-center">
        <div className="inline-flex items-center justify-center w-20 h-20 mb-6 animate-bounce-slow">
           <BrandLogo hideText />
        </div>
        <h2 className="text-4xl font-black text-slate-900 tracking-tighter">{type === 'signin' ? 'Welcome Back' : 'Create Cluster'}</h2>
        <p className="text-slate-500 mt-2 font-medium">Control your grid from anywhere.</p>
      </div>
      <form onSubmit={(e) => handleAuth(e, type)} className="space-y-6">
        {type === 'signup' && (
          <div className="group"><label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1 group-focus-within:text-blue-600 transition">Full Identity</label><input name="fullname" type="text" required className="w-full px-5 py-4 rounded-2xl bg-slate-50/50 border-none outline-none focus:ring-2 focus:ring-blue-500/20 font-black text-slate-700" placeholder="Juan Dela Cruz" /></div>
        )}
        <div className="group"><label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1 group-focus-within:text-blue-600 transition">Access Mail</label><input name="email" type="email" required className="w-full px-5 py-4 rounded-2xl bg-slate-50/50 border-none outline-none focus:ring-2 focus:ring-blue-500/20 font-black text-slate-700" placeholder="admin@voltshare.com" /></div>
        <div className="group"><label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1 group-focus-within:text-blue-600 transition">Security Key</label><input name="password" type="password" required className="w-full px-5 py-4 rounded-2xl bg-slate-50/50 border-none outline-none focus:ring-2 focus:ring-blue-500/20 font-black text-slate-700" placeholder="••••••••" /></div>
        <button disabled={actionLoading} className="w-full py-5 bg-blue-600 text-white rounded-[1.5rem] font-black text-xl hover:bg-blue-700 transition shadow-2xl shadow-blue-500/20 flex items-center justify-center active:scale-95">{actionLoading ? <Loader2 className="animate-spin mr-2" /> : (type === 'signin' ? 'Authorize' : 'Initialize')}</button>
      </form>
      <div className="text-center space-y-4">
        <button onClick={() => setView(type === 'signin' ? 'signup' : 'signin')} className="text-sm text-blue-600 font-black hover:underline uppercase tracking-widest">{type === 'signin' ? "No ID? Join Network" : "Existing Node? Connect"}</button>
        <button onClick={() => setView('landing')} className="block w-full text-[10px] text-slate-400 font-black hover:text-slate-600 transition uppercase tracking-widest">← Return to Lobby</button>
      </div>
    </div>
  </div>
);

export default App;
