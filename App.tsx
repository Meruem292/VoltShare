
import React, { useState, useEffect } from 'react';
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
  ExternalLink
} from 'lucide-react';
import { AppView, User, RoomInput, BillRecord, RentalProperty } from './types';
import { storageService } from './services/storageService';
import { calculateBill } from './logic/billCalculator';
import { exportService } from './services/exportService';
import { isFirebaseReady, firebaseConfig } from './firebase';
import { 
  PieChart, 
  Pie, 
  Cell, 
  ResponsiveContainer, 
  Tooltip 
} from 'recharts';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

// Error Screen for missing environment variables
const ConfigErrorView: React.FC = () => (
  <div className="min-h-screen bg-slate-100 flex items-center justify-center p-6">
    <div className="bg-white max-w-lg w-full rounded-[2rem] shadow-2xl p-10 border border-slate-200">
      <div className="w-16 h-16 bg-amber-100 text-amber-600 rounded-2xl flex items-center justify-center mb-6 mx-auto">
        <AlertTriangle size={32} />
      </div>
      <h2 className="text-3xl font-black text-slate-900 text-center mb-2">Configuration Required</h2>
      <p className="text-slate-500 text-center mb-8">VoltShare needs your Firebase credentials to enable cloud sync, auth, and history tracking.</p>
      
      <div className="bg-slate-50 rounded-2xl p-6 mb-8 space-y-4">
        <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Environment Variables Missing:</h4>
        <div className="space-y-2">
          {!firebaseConfig.apiKey && <code className="block text-xs bg-white border p-2 rounded-lg text-red-500">FIREBASE_API_KEY</code>}
          {!firebaseConfig.projectId && <code className="block text-xs bg-white border p-2 rounded-lg text-red-500">FIREBASE_PROJECT_ID</code>}
          <p className="text-[10px] text-slate-400 mt-4 italic">Note: If using Vercel/Vite, prefix them with VITE_ (e.g. VITE_FIREBASE_API_KEY)</p>
        </div>
      </div>

      <div className="space-y-3">
        <a 
          href="https://console.firebase.google.com/" 
          target="_blank" 
          rel="noopener noreferrer"
          className="w-full py-4 bg-blue-600 text-white rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-blue-700 transition"
        >
          Firebase Console <ExternalLink size={18}/>
        </a>
        <button 
          onClick={() => window.location.reload()} 
          className="w-full py-4 bg-slate-100 text-slate-600 rounded-xl font-bold hover:bg-slate-200 transition"
        >
          I've added them, Refresh
        </button>
      </div>
    </div>
  </div>
);

const ComputationBreakdown: React.FC<{ bill: BillRecord }> = ({ bill }) => (
  <div className="bg-slate-800 rounded-2xl p-4 mt-4 space-y-4 text-xs">
    <div className="flex items-center gap-2 text-blue-400 font-bold uppercase tracking-widest border-b border-slate-700 pb-2">
      <Info size={14} /> Step-by-Step Math
    </div>
    <div className="space-y-3">
      <div className="p-2 bg-slate-700/30 rounded-lg">
        <p className="text-slate-400 mb-1">1. Identify Meter Discrepancy</p>
        <div className="flex justify-between items-center text-sm">
          <span>{bill.mainMeterKwh} (Main) - {bill.totalSubmeterKwh} (Sub)</span>
          <span className="font-bold text-amber-400">={bill.missingKwh.toFixed(2)} kWh Loss</span>
        </div>
      </div>
      <div className="p-2 bg-slate-700/30 rounded-lg">
        <p className="text-slate-400 mb-1">2. Proportional Distribution</p>
        <div className="space-y-2">
          {bill.rooms.map(room => (
            <div key={room.id} className="border-t border-slate-700/50 pt-2 first:border-none first:pt-0">
              <div className="flex justify-between font-bold text-slate-200">
                <span>{room.name}</span>
                <span>₱{room.billAmount.toFixed(2)}</span>
              </div>
              <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-[10px] text-slate-400 mt-1">
                <div>Usage: <span className="text-white">{room.originalKwh} kWh</span></div>
                <div>Share: <span className="text-white">{(room.share * 100).toFixed(2)}%</span></div>
                <div>Loss Share: <span className="text-white">+{room.compensationKwh.toFixed(2)} kWh</span></div>
                <div>Final: <span className="text-white">{room.finalKwh.toFixed(2)} kWh</span></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  </div>
);

interface LandingViewProps {
  setView: (v: AppView) => void;
  landingMainKwh: number;
  setLandingMainKwh: (v: number) => void;
  rate: number;
  setRate: (v: number) => void;
  landingRooms: RoomInput[];
  setLandingRooms: (v: RoomInput[]) => void;
  landingResult: BillRecord | null;
  showBreakdown: boolean;
  setShowBreakdown: (v: boolean) => void;
  saveLandingCalc: () => void;
  actionLoading: boolean;
  user: User | null;
}

const LandingView: React.FC<LandingViewProps> = ({ 
  setView, landingMainKwh, setLandingMainKwh, rate, setRate, 
  landingRooms, setLandingRooms, landingResult, showBreakdown, 
  setShowBreakdown, saveLandingCalc, actionLoading, user 
}) => (
  <div className="min-h-screen flex flex-col animate-in fade-in duration-500 bg-slate-50">
    <nav className="p-6 flex justify-between items-center max-w-7xl mx-auto w-full">
      <div className="flex items-center gap-2 text-blue-600 font-bold text-2xl">
        <Zap className="fill-current" />
        <span>VoltShare</span>
      </div>
      <div className="flex gap-4">
        <button onClick={() => setView('signin')} className="px-4 py-2 text-slate-600 hover:text-blue-600 font-medium transition">Sign In</button>
        <button onClick={() => setView('signup')} className="px-6 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition shadow-lg shadow-blue-200">Landlord Signup</button>
      </div>
    </nav>
    <main className="flex-1 max-w-7xl mx-auto w-full px-6 flex flex-col lg:flex-row items-start gap-12 pt-12 pb-20">
      <div className="flex-1 space-y-8 lg:sticky lg:top-24">
        <div className="inline-flex items-center gap-2 bg-blue-100 text-blue-700 px-4 py-2 rounded-full text-sm font-bold uppercase tracking-wider">
          <Building2 size={16} /> Utility Math Simplified
        </div>
        <h1 className="text-5xl md:text-7xl font-extrabold text-slate-900 leading-tight">
          Fair Bills for <br/>
          <span className="text-blue-600">Every Tenant.</span>
        </h1>
        <p className="text-xl text-slate-500 max-w-lg leading-relaxed">
          Automatic proportional distribution. When the main meter doesn't match the submeters, VoltShare fairly allocates the "missing" energy cost based on each room's consumption share.
        </p>
        <div className="flex items-center gap-6">
          <button onClick={() => setView('signup')} className="px-8 py-4 bg-blue-600 text-white rounded-xl font-bold text-lg hover:bg-blue-700 transition shadow-xl shadow-blue-200 flex items-center gap-2">
            Start Managing <ArrowRight size={20}/>
          </button>
        </div>
      </div>

      <div className="flex-1 w-full max-w-2xl bg-white p-8 rounded-[2rem] shadow-2xl border border-slate-100 relative overflow-hidden">
        <div className="absolute top-0 right-0 p-8 opacity-5"><Zap size={160} className="text-blue-600" /></div>
        
        <div className="relative z-10 space-y-8">
          <div>
            <h3 className="text-2xl font-black text-slate-900">Live Simulator</h3>
            <p className="text-slate-500 text-sm">See how the math works instantly</p>
          </div>

          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Main Meter (kWh)</label>
              <input type="number" value={landingMainKwh} onChange={(e) => setLandingMainKwh(parseFloat(e.target.value) || 0)} className="w-full bg-slate-50 px-4 py-3 rounded-xl border-none focus:ring-2 focus:ring-blue-500 text-lg font-bold" />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Rate (₱/kWh)</label>
              <input type="number" value={rate} onChange={(e) => setRate(parseFloat(e.target.value) || 0)} className="w-full bg-slate-50 px-4 py-3 rounded-xl border-none focus:ring-2 focus:ring-blue-500 text-lg font-bold" />
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Room Submeters</label>
              <button onClick={() => setLandingRooms([...landingRooms, { id: Date.now().toString(), name: `Room ${landingRooms.length+1}`, kwh: 0 }])} className="text-blue-600 text-xs font-bold hover:underline">+ Add Room</button>
            </div>
            <div className="space-y-3">
              {landingRooms.map(r => (
                <div key={r.id} className="flex gap-4 items-center bg-slate-50 p-4 rounded-2xl border border-transparent hover:border-slate-200 transition">
                  <input type="text" value={r.name} onChange={(e) => setLandingRooms(landingRooms.map(lr => lr.id === r.id ? {...lr, name: e.target.value} : lr))} className="flex-1 bg-transparent border-none p-0 text-sm font-bold text-slate-700 focus:ring-0" />
                  <div className="flex items-center gap-2">
                    <input type="number" value={r.kwh} onChange={(e) => setLandingRooms(landingRooms.map(lr => lr.id === r.id ? {...lr, kwh: parseFloat(e.target.value) || 0} : lr))} className="w-24 bg-white px-3 py-2 rounded-lg border border-slate-200 text-right font-bold text-sm" />
                    <span className="text-xs text-slate-400 font-bold">kWh</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {landingResult && (
            <div className="bg-slate-900 rounded-3xl p-6 text-white space-y-6 animate-in zoom-in-95">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-[10px] text-slate-400 uppercase font-bold tracking-widest">Total Discrepancy</p>
                  <p className="text-2xl font-bold text-amber-400">{landingResult.missingKwh.toFixed(2)} kWh</p>
                </div>
                <div className="text-right">
                  <p className="text-[10px] text-slate-400 uppercase font-bold tracking-widest">Grand Total Bill</p>
                  <p className="text-2xl font-black">₱{landingResult.rooms.reduce((s, r) => s + r.billAmount, 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Quick Summary</h4>
                  <button onClick={() => setShowBreakdown(!showBreakdown)} className="text-[10px] font-bold text-blue-400 flex items-center gap-1 uppercase hover:underline">
                    {showBreakdown ? 'Hide Breakdown' : 'View Detailed Breakdown'}
                    {showBreakdown ? <ChevronUp size={12}/> : <ChevronDown size={12}/>}
                  </button>
                </div>
                
                {!showBreakdown ? (
                  <div className="space-y-2">
                    {landingResult.rooms.map(room => (
                      <div key={room.id} className="flex justify-between items-center text-sm border-b border-slate-800 pb-2 last:border-none">
                        <span className="text-slate-300">{room.name}</span>
                        <span className="font-bold">₱{room.billAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <ComputationBreakdown bill={landingResult} />
                )}
              </div>

              <div className="flex gap-2">
                <button 
                  onClick={() => exportService.toPDF(landingResult)}
                  className="flex-1 py-3 bg-slate-800 text-white rounded-xl font-bold text-xs flex items-center justify-center gap-2 hover:bg-slate-700 transition"
                >
                  <FileDown size={14}/> PDF
                </button>
                <button 
                  onClick={() => exportService.toExcel(landingResult)}
                  className="flex-1 py-3 bg-slate-800 text-white rounded-xl font-bold text-xs flex items-center justify-center gap-2 hover:bg-slate-700 transition"
                >
                  <TrendingUp size={14}/> Excel
                </button>
              </div>

              <button onClick={saveLandingCalc} disabled={actionLoading} className="w-full py-4 bg-blue-600 rounded-2xl font-bold text-lg flex items-center justify-center gap-3 hover:bg-blue-500 transition shadow-xl shadow-blue-600/20">
                {actionLoading ? <Loader2 className="animate-spin" size={20}/> : user ? <><CheckCircle2 size={20}/> Cloud Sync Result</> : <><Plus size={20}/> Create Landlord Account</>}
              </button>
            </div>
          )}
        </div>
      </div>
    </main>
  </div>
);

const AuthView: React.FC<{ type: 'signin' | 'signup', handleAuth: any, actionLoading: boolean, setView: any }> = ({ type, handleAuth, actionLoading, setView }) => (
  <div className="min-h-screen flex items-center justify-center p-6 bg-slate-100 animate-in zoom-in-95 duration-300">
    <div className="bg-white p-10 rounded-3xl shadow-xl w-full max-w-md space-y-8 border border-slate-200">
      <div className="text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 text-blue-600 rounded-2xl mb-4"><Building2 size={32} /></div>
        <h2 className="text-3xl font-bold text-slate-900">{type === 'signin' ? 'Landlord Login' : 'Landlord Portal'}</h2>
        <p className="text-slate-500 mt-2">Manage your rental clusters and utility bills</p>
      </div>
      <form onSubmit={(e) => handleAuth(e, type)} className="space-y-4">
        {type === 'signup' && (
          <div><label className="block text-sm font-semibold text-slate-700 mb-1">Landlord Name</label><input name="fullname" type="text" required className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 transition" placeholder="Full Name" /></div>
        )}
        <div><label className="block text-sm font-semibold text-slate-700 mb-1">Email</label><input name="email" type="email" required className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 transition" placeholder="landlord@example.com" /></div>
        <div><label className="block text-sm font-semibold text-slate-700 mb-1">Password</label><input name="password" type="password" required className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 transition" placeholder="••••••••" /></div>
        <button disabled={actionLoading} className="w-full py-4 bg-blue-600 text-white rounded-xl font-bold text-lg hover:bg-blue-700 transition shadow-lg shadow-blue-200 flex items-center justify-center">{actionLoading ? <Loader2 className="animate-spin mr-2" /> : (type === 'signin' ? 'Sign In' : 'Create Account')}</button>
      </form>
      <button onClick={() => setView(type === 'signin' ? 'signup' : 'signin')} className="w-full text-sm text-blue-600 font-bold hover:underline">{type === 'signin' ? "Not a member? Sign Up" : "Already have an account? Sign In"}</button>
      <button onClick={() => setView('landing')} className="w-full text-xs text-slate-400 hover:text-slate-600 transition">Back to Landing Page</button>
    </div>
  </div>
);

const App: React.FC = () => {
  if (!isFirebaseReady) {
    return <ConfigErrorView />;
  }

  const [view, setView] = useState<AppView>('landing');
  const [user, setUser] = useState<User | null>(null);
  const [bills, setBills] = useState<BillRecord[]>([]);
  const [rentals, setRentals] = useState<RentalProperty[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [actionLoading, setActionLoading] = useState<boolean>(false);
  const [showBreakdown, setShowBreakdown] = useState(false);

  // Global Calculation Config
  const [rate, setRate] = useState<number>(12);
  const [month, setMonth] = useState<string>(new Date().toLocaleString('default', { month: 'long' }));
  const [year, setYear] = useState<number>(new Date().getFullYear());

  // Landing Calculator State
  const [landingMainKwh, setLandingMainKwh] = useState<number>(200);
  const [landingRooms, setLandingRooms] = useState<RoomInput[]>([
    { id: 'l1', name: 'Room 1', kwh: 90 },
    { id: 'l2', name: 'Room 2', kwh: 100 },
  ]);
  const [landingResult, setLandingResult] = useState<BillRecord | null>(null);

  // Main Calculator State
  const [selectedPropertyId, setSelectedPropertyId] = useState<string>('');
  const [mainKwh, setMainKwh] = useState<number>(0);
  const [rooms, setRooms] = useState<RoomInput[]>([
    { id: '1', name: 'Room 1', kwh: 0 },
    { id: '2', name: 'Room 2', kwh: 0 },
  ]);
  const [tempCalculation, setTempCalculation] = useState<BillRecord | null>(null);

  // Rental Management State
  const [newRentalName, setNewRentalName] = useState('');
  const [isAddingRental, setIsAddingRental] = useState(false);

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
          if (view === 'landing' || view === 'signin' || view === 'signup') {
            setView('dashboard');
          }
        } catch (e) {
          console.error("Error fetching initial data", e);
        }
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, [view]);

  useEffect(() => {
    const result = calculateBill(landingMainKwh, rate, landingRooms, month, year);
    setLandingResult(result);
  }, [landingMainKwh, rate, landingRooms, rate]);

  const handleAuth = async (e: React.FormEvent, type: 'signin' | 'signup') => {
    e.preventDefault();
    setActionLoading(true);
    const form = e.target as HTMLFormElement;
    const email = (form.elements.namedItem('email') as HTMLInputElement).value;
    const pass = (form.elements.namedItem('password') as HTMLInputElement).value;
    
    try {
      if (type === 'signin') {
        await storageService.signIn(email, pass);
      } else {
        const name = (form.elements.namedItem('fullname') as HTMLInputElement).value;
        await storageService.signUp(email, pass, name);
      }
    } catch (err: any) {
      alert(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleLogout = async () => {
    await storageService.logout();
    setUser(null);
    setView('landing');
  };

  const saveLandingCalc = async () => {
    if (!user || !landingResult) {
       setView('signup');
       return;
    }
    setActionLoading(true);
    try {
      await storageService.saveBill(landingResult, user.id);
      const updated = await storageService.getBills(user.id);
      setBills(updated);
      setView('history');
    } catch (e: any) {
      alert(e.message);
    } finally {
      setActionLoading(false);
    }
  };

  const createProperty = async () => {
    if (!newRentalName || !user) return;
    setActionLoading(true);
    try {
      await storageService.saveRental({
        name: newRentalName,
        userId: user.id,
        rooms: [{ id: Date.now().toString(), name: 'Room 1' }],
        createdAt: Date.now()
      });
      const updated = await storageService.getRentals(user.id);
      setRentals(updated);
      setNewRentalName('');
      setIsAddingRental(false);
    } finally {
      setActionLoading(false);
    }
  };

  const deleteProperty = async (id: string) => {
    if (!window.confirm("Delete this property and its room templates?")) return;
    setActionLoading(true);
    try {
      await storageService.deleteRental(id);
      if (user) setRentals(await storageService.getRentals(user.id));
    } finally {
      setActionLoading(false);
    }
  };

  const addRoomToProperty = async (propertyId: string) => {
    const property = rentals.find(r => r.id === propertyId);
    if (!property) return;
    const newRooms = [...property.rooms, { id: Date.now().toString(), name: `Room ${property.rooms.length + 1}` }];
    await storageService.updateRental(propertyId, { rooms: newRooms });
    if (user) setRentals(await storageService.getRentals(user.id));
  };

  const updateRoomInProperty = async (propertyId: string, roomId: string, newName: string) => {
    const property = rentals.find(r => r.id === propertyId);
    if (!property) return;
    const newRooms = property.rooms.map(r => r.id === roomId ? { ...r, name: newName } : r);
    await storageService.updateRental(propertyId, { rooms: newRooms });
    if (user) setRentals(await storageService.getRentals(user.id));
  };

  const removeRoomFromProperty = async (propertyId: string, roomId: string) => {
    const property = rentals.find(r => r.id === propertyId);
    if (!property) return;
    const newRooms = property.rooms.filter(r => r.id !== roomId);
    await storageService.updateRental(propertyId, { rooms: newRooms });
    if (user) setRentals(await storageService.getRentals(user.id));
  };

  const onSelectProperty = (id: string) => {
    setSelectedPropertyId(id);
    const property = rentals.find(r => r.id === id);
    if (property) {
      setRooms(property.rooms.map(r => ({ id: r.id, name: r.name, kwh: 0 })));
    }
  };

  const addRoom = () => {
    setRooms([...rooms, { id: Date.now().toString(), name: `Room ${rooms.length + 1}`, kwh: 0 }]);
  };

  const updateRoom = (id: string, updates: Partial<RoomInput>) => {
    setRooms(rooms.map(r => r.id === id ? { ...r, ...updates } : r));
  };

  const removeRoom = (id: string) => {
    setRooms(rooms.filter(r => r.id !== id));
  };

  const handleCalculate = () => {
    const result = calculateBill(mainKwh, rate, rooms, month, year);
    const selectedProp = rentals.find(p => p.id === selectedPropertyId);
    if (selectedProp) {
      result.propertyId = selectedProp.id;
      result.propertyName = selectedProp.name;
    }
    setTempCalculation(result);
  };

  const saveBill = async () => {
    if (tempCalculation && user) {
      setActionLoading(true);
      try {
        await storageService.saveBill(tempCalculation, user.id);
        const updated = await storageService.getBills(user.id);
        setBills(updated);
        setTempCalculation(null);
        setMainKwh(0);
        setRooms(rooms.map(r => ({ ...r, kwh: 0 })));
        setView('history');
      } catch (err: any) {
        alert("Failed to save: " + err.message);
      } finally {
        setActionLoading(false);
      }
    }
  };

  const deleteBill = async (id: string) => {
    if (!window.confirm("Delete this billing record?")) return;
    setActionLoading(true);
    try {
      await storageService.deleteBill(id);
      if (user) setBills(await storageService.getBills(user.id));
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <Loader2 className="animate-spin text-blue-600" size={48} />
      </div>
    );
  }

  const totalExpenses = bills.reduce((sum, b) => sum + b.rooms.reduce((rs, r) => rs + r.billAmount, 0), 0);
  const lastBill = bills[0];

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {user && (
        <aside className="hidden lg:flex w-72 flex-col bg-white border-r border-slate-200 p-8 fixed h-full z-30">
          <div className="flex items-center gap-2 text-blue-600 font-bold text-2xl mb-12 cursor-pointer" onClick={() => setView('dashboard')}><Zap className="fill-current" /><span>VoltShare</span></div>
          <nav className="flex-1 space-y-2">
            <button onClick={() => setView('dashboard')} className={`w-full flex items-center gap-4 px-4 py-3 rounded-xl font-bold transition ${view === 'dashboard' ? 'bg-blue-50 text-blue-600' : 'text-slate-500 hover:bg-slate-50'}`}><LayoutDashboard size={20} /> Overview</button>
            <button onClick={() => setView('rentals')} className={`w-full flex items-center gap-4 px-4 py-3 rounded-xl font-bold transition ${view === 'rentals' ? 'bg-blue-50 text-blue-600' : 'text-slate-500 hover:bg-slate-50'}`}><Building2 size={20} /> My Properties</button>
            <button onClick={() => setView('calculator')} className={`w-full flex items-center gap-4 px-4 py-3 rounded-xl font-bold transition ${view === 'calculator' ? 'bg-blue-50 text-blue-600' : 'text-slate-500 hover:bg-slate-50'}`}><Calculator size={20} /> Bill Calculator</button>
            <button onClick={() => setView('history')} className={`w-full flex items-center gap-4 px-4 py-3 rounded-xl font-bold transition ${view === 'history' ? 'bg-blue-50 text-blue-600' : 'text-slate-500 hover:bg-slate-50'}`}><History size={20} /> Records History</button>
          </nav>
          <div className="pt-8 border-t border-slate-100">
            <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-2xl mb-4">
               <div className="w-10 h-10 bg-blue-100 text-blue-600 rounded-lg flex items-center justify-center"><UserIcon size={20} /></div>
               <div className="overflow-hidden"><p className="text-sm font-bold text-slate-900 truncate">{user?.name}</p><p className="text-xs text-slate-500 truncate">{user?.email}</p></div>
            </div>
            <button onClick={handleLogout} className="w-full flex items-center gap-4 px-4 py-3 rounded-xl font-bold text-slate-400 hover:text-red-500 transition"><LogOut size={20} /> Sign Out</button>
          </div>
        </aside>
      )}

      <main className={`flex-1 ${user ? 'lg:ml-72' : ''} p-0 min-h-screen`}>
        {view === 'landing' && (
          <LandingView 
            setView={setView}
            landingMainKwh={landingMainKwh}
            setLandingMainKwh={setLandingMainKwh}
            rate={rate}
            setRate={setRate}
            landingRooms={landingRooms}
            setLandingRooms={setLandingRooms}
            landingResult={landingResult}
            showBreakdown={showBreakdown}
            setShowBreakdown={setShowBreakdown}
            saveLandingCalc={saveLandingCalc}
            actionLoading={actionLoading}
            user={user}
          />
        )}
        {(view === 'signin' || view === 'signup') && <AuthView type={view as 'signin' | 'signup'} handleAuth={handleAuth} actionLoading={actionLoading} setView={setView} />}
        {user && (
           <div className="p-6 md:p-12 pb-24 lg:pb-12">
            {view === 'dashboard' && (
              <div className="space-y-8 animate-in slide-in-from-bottom-4 duration-500">
                <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                  <div>
                    <h1 className="text-3xl font-bold text-slate-900">Landlord Portfolio</h1>
                    <p className="text-slate-500">Welcome back, <span className="text-blue-600 font-bold">{user?.name}</span></p>
                  </div>
                  <div className="flex gap-3">
                    <button onClick={() => setView('rentals')} className="px-6 py-3 bg-white border border-slate-200 text-slate-700 rounded-xl font-bold hover:bg-slate-50 transition">Properties</button>
                    <button onClick={() => setView('calculator')} className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition shadow-lg shadow-blue-200"><Plus size={20} /> New Billing</button>
                  </div>
                </header>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                  <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                    <div className="w-10 h-10 bg-blue-100 text-blue-600 rounded-xl flex items-center justify-center mb-4"><Receipt size={20} /></div>
                    <p className="text-xs text-slate-500 uppercase font-bold tracking-wider mb-1">Total Collection</p>
                    <p className="text-2xl font-black">₱{totalExpenses.toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
                  </div>
                  <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                    <div className="w-10 h-10 bg-emerald-100 text-emerald-600 rounded-xl flex items-center justify-center mb-4"><Home size={20} /></div>
                    <p className="text-xs text-slate-500 uppercase font-bold tracking-wider mb-1">Properties</p>
                    <p className="text-2xl font-black">{rentals.length} Clusters</p>
                  </div>
                  <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                    <div className="w-10 h-10 bg-amber-100 text-amber-600 rounded-xl flex items-center justify-center mb-4"><Calculator size={20} /></div>
                    <p className="text-xs text-slate-500 uppercase font-bold tracking-wider mb-1">Billing Cycles</p>
                    <p className="text-2xl font-black">{bills.length}</p>
                  </div>
                  <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                    <div className="w-10 h-10 bg-indigo-100 text-indigo-600 rounded-xl flex items-center justify-center mb-4"><UserIcon size={20} /></div>
                    <p className="text-xs text-slate-500 uppercase font-bold tracking-wider mb-1">Units Managed</p>
                    <p className="text-2xl font-black">{rentals.reduce((sum, r) => sum + r.rooms.length, 0)} Active</p>
                  </div>
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100">
                    <h3 className="font-bold text-lg mb-6">Latest Revenue Distribution</h3>
                    {lastBill ? (
                      <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie data={lastBill.rooms as any[]} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="billAmount">
                              {lastBill.rooms.map((_, index) => (<Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />))}
                            </Pie>
                            <Tooltip formatter={(value: number) => `₱${value.toFixed(2)}`} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
                          </PieChart>
                        </ResponsiveContainer>
                      </div>
                    ) : (
                      <div className="h-64 flex items-center justify-center text-slate-400">No synchronized data</div>
                    )}
                  </div>
                  <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100">
                    <h3 className="font-bold text-lg mb-6">Recent Records</h3>
                    <div className="space-y-4">
                      {bills.slice(0, 5).map((bill) => (
                        <div key={bill.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-xl hover:bg-slate-100 transition cursor-pointer" onClick={() => setView('history')}>
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-white rounded-lg border border-slate-200 flex items-center justify-center text-slate-600 font-bold">{bill.month.substring(0, 3)}</div>
                            <div>
                              <p className="font-bold text-slate-900">{bill.month} {bill.year}</p>
                              <p className="text-xs text-slate-500">{bill.propertyName || 'Custom Calculation'}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="font-bold text-slate-900">₱{bill.rooms.reduce((s, r) => s + r.billAmount, 0).toLocaleString()}</p>
                            <p className="text-[10px] text-emerald-600 font-bold uppercase tracking-widest">Valid</p>
                          </div>
                        </div>
                      ))}
                      {bills.length === 0 && <div className="text-center py-12 text-slate-400"><FileText className="mx-auto mb-2 opacity-20" size={48} /><p>Run your first billing cycle.</p></div>}
                    </div>
                  </div>
                </div>
              </div>
            )}
            {view === 'rentals' && (
              <div className="max-w-6xl mx-auto space-y-8 animate-in slide-in-from-bottom-4 duration-500 pb-12">
                <header className="flex justify-between items-center">
                  <div>
                    <h1 className="text-3xl font-bold text-slate-900">Property Clusters</h1>
                    <p className="text-slate-500">Manage property sets and tenant templates</p>
                  </div>
                  <button onClick={() => setIsAddingRental(true)} className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-xl font-bold shadow-lg shadow-blue-100 hover:bg-blue-700 transition">
                    <Plus size={20} /> Add Property
                  </button>
                </header>
                {isAddingRental && (
                  <div className="bg-white p-6 rounded-2xl border-2 border-blue-500 shadow-xl space-y-4 animate-in zoom-in-95">
                    <h3 className="font-bold text-lg text-slate-900">New Cluster Name</h3>
                    <div className="flex gap-4">
                      <input type="text" value={newRentalName} onChange={(e) => setNewRentalName(e.target.value)} className="flex-1 px-4 py-3 rounded-xl bg-slate-50 border-none focus:ring-2 focus:ring-blue-500" placeholder="e.g. Block 7 Apartments" />
                      <button onClick={createProperty} className="px-6 py-3 bg-blue-600 text-white rounded-xl font-bold">Save</button>
                      <button onClick={() => setIsAddingRental(false)} className="px-6 py-3 bg-slate-100 text-slate-600 rounded-xl font-bold">Cancel</button>
                    </div>
                  </div>
                )}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {rentals.map((property) => (
                    <div key={property.id} className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm hover:shadow-md transition">
                      <div className="flex justify-between items-start mb-6">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center"><Home size={24} /></div>
                          <div>
                            <h3 className="text-xl font-extrabold text-slate-900">{property.name}</h3>
                            <p className="text-sm text-slate-500">{property.rooms.length} Units Defined</p>
                          </div>
                        </div>
                        <button onClick={() => deleteProperty(property.id)} className="p-2 text-slate-300 hover:text-red-500 transition"><Trash2 size={20} /></button>
                      </div>
                      <div className="space-y-3 mb-6 max-h-64 overflow-y-auto pr-2 scrollbar-hide">
                        {property.rooms.map((room) => (
                          <div key={room.id} className="flex gap-2 items-center p-3 bg-slate-50 rounded-xl">
                            <input type="text" value={room.name} onChange={(e) => updateRoomInProperty(property.id, room.id, e.target.value)} className="flex-1 bg-transparent border-none p-0 text-sm font-bold text-slate-700 focus:ring-0" />
                            <button onClick={() => removeRoomFromProperty(property.id, room.id)} className="p-1 text-slate-300 hover:text-red-500"><Trash2 size={16} /></button>
                          </div>
                        ))}
                      </div>
                      <button onClick={() => addRoomToProperty(property.id)} className="w-full py-3 bg-blue-50 text-blue-600 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-blue-100 transition"><Plus size={18} /> New Room Unit</button>
                    </div>
                  ))}
                  {rentals.length === 0 && !isAddingRental && (
                    <div className="md:col-span-2 py-20 text-center bg-white rounded-3xl border-2 border-dashed border-slate-100 text-slate-400">
                      <Building2 className="mx-auto mb-4 opacity-20" size={64} /><h3 className="text-xl font-bold">Your Portfolio is Empty</h3>
                    </div>
                  )}
                </div>
              </div>
            )}
            {view === 'calculator' && (
              <div className="max-w-4xl mx-auto space-y-8 animate-in slide-in-from-right-4 duration-500 pb-12">
                <header className="flex justify-between items-center">
                  <div><h1 className="text-3xl font-bold text-slate-900">Billing Logic</h1><p className="text-slate-500">Calculate fair distribution shares</p></div>
                </header>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-6">
                    <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100 space-y-6">
                      <h3 className="font-bold text-lg border-b pb-4 border-slate-100">Global Inputs</h3>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Select Cluster</label>
                        <select value={selectedPropertyId} onChange={(e) => onSelectProperty(e.target.value)} className="w-full px-4 py-3 bg-slate-50 border-none rounded-xl focus:ring-2 focus:ring-blue-500 font-bold text-slate-700">
                          <option value="">-- Manual Calculation --</option>
                          {rentals.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                        </select>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div><label className="block text-[10px] font-bold text-slate-400 uppercase mb-2">Month</label><select value={month} onChange={(e) => setMonth(e.target.value)} className="w-full px-4 py-3 bg-slate-50 border-none rounded-xl focus:ring-2 focus:ring-blue-500">{['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'].map(m => (<option key={m} value={m}>{m}</option>))}</select></div>
                        <div><label className="block text-[10px] font-bold text-slate-400 uppercase mb-2">Year</label><input type="number" value={year} onChange={(e) => setYear(parseInt(e.target.value))} className="w-full px-4 py-3 bg-slate-50 border-none rounded-xl focus:ring-2 focus:ring-blue-500" /></div>
                      </div>
                      <div><label className="block text-[10px] font-bold text-slate-400 uppercase mb-2">Rate (₱/kWh)</label><input type="number" step="0.01" value={rate} onChange={(e) => setRate(parseFloat(e.target.value) || 0)} className="w-full px-4 py-3 bg-slate-50 border-none rounded-xl focus:ring-2 focus:ring-blue-500 text-xl font-bold text-blue-600" /></div>
                      <div><label className="block text-[10px] font-bold text-slate-400 uppercase mb-2">Main Meter Reading (kWh)</label><input type="number" step="0.01" value={mainKwh} onChange={(e) => setMainKwh(parseFloat(e.target.value) || 0)} className="w-full px-4 py-3 bg-slate-50 border-none rounded-xl focus:ring-2 focus:ring-blue-500 text-xl font-bold" /></div>
                    </div>
                    <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100">
                      <div className="flex justify-between items-center border-b pb-4 border-slate-100 mb-6"><h3 className="font-bold text-lg">Submeter Readings</h3><button onClick={addRoom} className="p-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition"><Plus size={20} /></button></div>
                      <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2 scrollbar-hide">
                        {rooms.map((room) => (
                          <div key={room.id} className="flex gap-4 items-center p-4 bg-slate-50 rounded-xl group relative border border-transparent hover:border-blue-100 transition">
                            <div className="flex-1">
                              <input type="text" value={room.name} onChange={(e) => updateRoom(room.id, { name: e.target.value })} className="w-full bg-transparent border-none p-0 text-sm font-bold text-slate-900 focus:ring-0" placeholder="Room ID" />
                              <div className="flex items-center gap-2 mt-1"><input type="number" value={room.kwh} onChange={(e) => updateRoom(room.id, { kwh: parseFloat(e.target.value) || 0 })} className="w-full bg-white px-3 py-2 rounded-lg border border-slate-200 focus:outline-none text-lg font-bold" /><span className="text-xs text-slate-400 font-bold">kWh</span></div>
                            </div>
                            <button onClick={() => removeRoom(room.id)} className="p-2 text-slate-300 hover:text-red-500 transition"><Trash2 size={18} /></button>
                          </div>
                        ))}
                      </div>
                    </div>
                    <button onClick={handleCalculate} className="w-full py-4 bg-blue-600 text-white rounded-2xl font-bold text-lg shadow-xl shadow-blue-200 hover:bg-blue-700 transition">Generate Audit Trail</button>
                  </div>
                  <div className="space-y-6">
                    {tempCalculation ? (
                      <div className="bg-slate-900 text-white p-8 rounded-3xl shadow-2xl relative overflow-hidden animate-in zoom-in-95 duration-300">
                        <div className="absolute top-0 right-0 p-8 opacity-10"><Receipt size={120} /></div>
                        <div className="relative z-10 space-y-8">
                          <div className="border-b border-slate-800 pb-6">
                            <h2 className="text-3xl font-bold">{tempCalculation.month} {tempCalculation.year}</h2>
                            {tempCalculation.propertyName && <p className="text-blue-400 text-sm font-bold uppercase tracking-widest">{tempCalculation.propertyName}</p>}
                          </div>
                          <div className="grid grid-cols-2 gap-8">
                            <div><p className="text-[10px] text-slate-400 uppercase font-bold tracking-widest">Main Meter</p><p className="text-2xl font-bold">{tempCalculation.mainMeterKwh.toFixed(2)} kWh</p></div>
                            <div><p className="text-[10px] text-slate-400 uppercase font-bold tracking-widest">Calculated Loss</p><p className="text-2xl font-bold text-amber-400">{tempCalculation.missingKwh.toFixed(2)} kWh</p></div>
                          </div>
                          <div className="space-y-4">
                            <div className="flex justify-between items-center">
                              <p className="text-[10px] text-slate-400 uppercase font-bold tracking-widest">Final Bill Totals</p>
                              <button onClick={() => setShowBreakdown(!showBreakdown)} className="text-[10px] font-bold text-blue-400 flex items-center gap-1 hover:underline">
                                {showBreakdown ? 'Hide Breakdown' : 'View Detailed Breakdown'}
                              </button>
                            </div>
                            {!showBreakdown ? (
                              <div className="space-y-3">
                                {tempCalculation.rooms.map((room) => (
                                  <div key={room.id} className="bg-slate-800/50 p-4 rounded-xl flex justify-between items-center border border-slate-700">
                                    <div><p className="font-bold">{room.name}</p><p className="text-[10px] text-slate-400">Actual Usage: {room.originalKwh} kWh</p></div>
                                    <div className="text-right"><p className="font-bold text-emerald-400">₱{room.billAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</p><p className="text-[10px] text-slate-500">{(room.share * 100).toFixed(1)}% Usage Share</p></div>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <ComputationBreakdown bill={tempCalculation} />
                            )}
                          </div>

                          <div className="flex gap-2">
                            <button 
                              onClick={() => exportService.toPDF(tempCalculation)}
                              className="flex-1 py-3 bg-slate-800 text-white rounded-xl font-bold text-xs flex items-center justify-center gap-2 hover:bg-slate-700 transition"
                            >
                              <FileDown size={14}/> Export PDF
                            </button>
                            <button 
                              onClick={() => exportService.toExcel(tempCalculation)}
                              className="flex-1 py-3 bg-slate-800 text-white rounded-xl font-bold text-xs flex items-center justify-center gap-2 hover:bg-slate-700 transition"
                            >
                              <TrendingUp size={14}/> Export Excel
                            </button>
                          </div>

                          <div className="pt-6 border-t border-slate-800 flex justify-between items-end">
                            <div><p className="text-[10px] text-slate-400 uppercase font-bold tracking-widest mb-1">Total Property Bill</p><p className="text-4xl font-black text-white">₱{tempCalculation.rooms.reduce((s, r) => s + r.billAmount, 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</p></div>
                            <button onClick={saveBill} disabled={actionLoading} className="px-6 py-3 bg-blue-600 rounded-xl font-bold hover:bg-blue-500 transition shadow-lg shadow-blue-500/20">{actionLoading ? <Loader2 className="animate-spin mr-2" /> : 'Cloud Save'}</button>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="h-full bg-white border-2 border-dashed border-slate-200 rounded-3xl flex flex-col items-center justify-center p-12 text-center text-slate-400"><Calculator size={64} className="mb-4 opacity-10" /><p className="text-lg font-medium text-slate-600">Computation Ready</p></div>
                    )}
                  </div>
                </div>
              </div>
            )}
            {view === 'history' && (
              <div className="max-w-6xl mx-auto space-y-8 animate-in slide-in-from-left-4 duration-500 pb-12">
                <header className="flex justify-between items-center">
                  <div><h1 className="text-3xl font-bold text-slate-900">Billing History</h1><p className="text-slate-500">Secure record of all property utility cycles</p></div>
                </header>
                <div className="grid grid-cols-1 gap-6">
                  {bills.map((bill) => (
                    <div key={bill.id} className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col md:flex-row gap-8 items-start md:items-center hover:shadow-md transition group">
                      <div className="w-24 h-24 bg-slate-50 border border-slate-200 rounded-2xl flex flex-col items-center justify-center flex-shrink-0 group-hover:bg-blue-50 group-hover:border-blue-100 transition"><span className="text-blue-600 font-black text-xl">{bill.month.substring(0, 3).toUpperCase()}</span><span className="text-slate-400 font-bold text-sm">{bill.year}</span></div>
                      <div className="flex-1 grid grid-cols-2 md:grid-cols-4 gap-4 w-full">
                        <div><p className="text-[10px] text-slate-400 uppercase font-bold tracking-widest mb-1">Final Total</p><p className="text-xl font-bold text-slate-900">₱{bill.rooms.reduce((s, r) => s + r.billAmount, 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</p></div>
                        <div><p className="text-[10px] text-slate-400 uppercase font-bold tracking-widest mb-1">Cluster</p><p className="text-lg font-semibold text-slate-700 truncate">{bill.propertyName || 'Custom'}</p></div>
                        <div><p className="text-[10px] text-slate-400 uppercase font-bold tracking-widest mb-1">Loss Shared</p><p className="text-lg font-semibold text-amber-600">{bill.missingKwh.toFixed(2)} kWh</p></div>
                        <div><p className="text-[10px] text-slate-400 uppercase font-bold tracking-widest mb-1">Downloads</p>
                          <div className="flex gap-2">
                            <button onClick={() => exportService.toPDF(bill)} className="text-blue-600 hover:text-blue-800 flex items-center gap-1 font-bold text-xs"><Download size={12}/> PDF</button>
                            <button onClick={() => exportService.toExcel(bill)} className="text-emerald-600 hover:text-emerald-800 flex items-center gap-1 font-bold text-xs"><Download size={12}/> Excel</button>
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-2 w-full md:w-auto">
                        <button onClick={() => deleteBill(bill.id)} disabled={actionLoading} className="px-4 py-2 text-slate-300 hover:text-red-500 transition">{actionLoading ? <Loader2 className="animate-spin" size={20} /> : <Trash2 size={20} />}</button>
                      </div>
                    </div>
                  ))}
                  {bills.length === 0 && <div className="bg-white p-20 rounded-3xl border-2 border-dashed border-slate-100 text-center text-slate-400"><History size={64} className="mx-auto mb-4 opacity-10" /><h3 className="text-xl font-bold mb-2">History is Empty</h3></div>}
                </div>
              </div>
            )}
           </div>
        )}
      </main>

      {user && (
        <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 px-6 py-4 flex justify-between items-center z-40">
          <button onClick={() => setView('dashboard')} className={`flex flex-col items-center gap-1 ${view === 'dashboard' ? 'text-blue-600' : 'text-slate-400'}`}><LayoutDashboard size={24} /><span className="text-[10px] font-bold">Dash</span></button>
          <button onClick={() => setView('rentals')} className={`flex flex-col items-center gap-1 ${view === 'rentals' ? 'text-blue-600' : 'text-slate-400'}`}><Building2 size={24} /><span className="text-[10px] font-bold">Props</span></button>
          <button onClick={() => setView('calculator')} className={`flex flex-col items-center gap-1 ${view === 'calculator' ? 'text-blue-600' : 'text-slate-400'}`}><Calculator size={24} /><span className="text-[10px] font-bold">Calc</span></button>
          <button onClick={() => setView('history')} className={`flex flex-col items-center gap-1 ${view === 'history' ? 'text-blue-600' : 'text-slate-400'}`}><History size={24} /><span className="text-[10px] font-bold">History</span></button>
          <button onClick={handleLogout} className="flex flex-col items-center gap-1 text-slate-400"><LogOut size={24} /><span className="text-[10px] font-bold">Out</span></button>
        </nav>
      )}
    </div>
  );
};

export default App;
