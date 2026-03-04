/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
  Home, 
  BookOpen, 
  Utensils, 
  BarChart2, 
  Users, 
  MessageSquare, 
  Plus, 
  ChevronRight, 
  Search, 
  CheckCircle2, 
  Flame, 
  Trophy, 
  Settings,
  LogOut,
  ArrowRight,
  Dumbbell,
  Droplets,
  Moon,
  Zap,
  Activity,
  User,
  Heart,
  Camera,
  Share2,
  Trash2,
  Send,
  X,
  Loader2
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

// --- CONFIGURATION ---
const FIREBASE_CONFIG = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_AUTH_DOMAIN",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_STORAGE_BUCKET",
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
  appId: "YOUR_APP_ID"
};

const CLAUDE_API_KEY = "YOUR_CLAUDE_API_KEY_HERE";

// --- TYPES ---
type Screen = 'AUTH' | 'ONBOARDING' | 'LIFESTYLE' | 'DIET_MODE' | 'PLAN_BUILDER' | 'DASHBOARD' | 'LIBRARY' | 'DIET' | 'PROGRESS' | 'SOCIAL';

interface UserProfile {
  uid: string;
  name: string;
  username: string;
  dob: string;
  gender: 'Male' | 'Female' | 'Other';
  weight: number; // kg
  height: number; // cm
  bmi: number;
  fitnessLevel: 'Beginner' | 'Intermediate' | 'Expert';
  goal: 'CUT' | 'MAINTAIN' | 'BULK';
  tdee: number;
  dietMode: 'CLEAN' | 'IIFYM' | 'BUDGET';
  xp: number;
  level: string;
  streak: number;
  gymStreak: number;
}

// --- FIREBASE INITIALIZATION ---
// We use the compat version from CDN as requested
declare global {
  interface Window {
    firebase: any;
  }
}

let auth: any;
let db: any;

if (typeof window !== 'undefined' && window.firebase) {
  if (!window.firebase.apps.length) {
    window.firebase.initializeApp(FIREBASE_CONFIG);
  }
  auth = window.firebase.auth();
  db = window.firebase.firestore();
}

// --- UTILS ---
const calculateBMI = (weight: number, height: number) => {
  const heightInM = height / 100;
  return parseFloat((weight / (heightInM * heightInM)).toFixed(1));
};

const getBMICategory = (bmi: number) => {
  if (bmi < 18.5) return { label: 'Underweight', color: '#ffcc00' };
  if (bmi < 25) return { label: 'Normal', color: '#00e5ff' };
  if (bmi < 30) return { label: 'Overweight', color: '#ff9500' };
  return { label: 'Obese', color: '#ff3b30' };
};

const calculateTDEE = (profile: Partial<UserProfile>, activityLevel: number) => {
  // Mifflin-St Jeor
  const age = new Date().getFullYear() - new Date(profile.dob || '').getFullYear();
  let bmr = 0;
  if (profile.gender === 'Male') {
    bmr = 10 * (profile.weight || 0) + 6.25 * (profile.height || 0) - 5 * age + 5;
  } else {
    bmr = 10 * (profile.weight || 0) + 6.25 * (profile.height || 0) - 5 * age - 161;
  }
  return Math.round(bmr * activityLevel);
};

// --- COMPONENTS ---

const LoadingScreen = () => (
  <div className="fixed inset-0 bg-bg flex flex-col items-center justify-center z-[100]">
    <div className="w-16 h-16 border-4 border-border border-t-accent rounded-full animate-spin mb-4"></div>
    <h1 className="font-display text-2xl tracking-widest uppercase">FORGE</h1>
  </div>
);

export default function App() {
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [currentScreen, setCurrentScreen] = useState<Screen>('AUTH');
  const [aiChatOpen, setAiChatOpen] = useState(false);

  // Auth Listener
  useEffect(() => {
    if (!auth) return;
    const unsubscribe = auth.onAuthStateChanged(async (u: any) => {
      setUser(u);
      if (u) {
        // Fetch profile
        const doc = await db.collection('users').doc(u.uid).get();
        if (doc.exists) {
          const data = doc.data();
          setProfile(data as UserProfile);
          setCurrentScreen('DASHBOARD');
        } else {
          setCurrentScreen('ONBOARDING');
        }
      } else {
        setCurrentScreen('AUTH');
      }
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  // PWA Setup
  useEffect(() => {
    const manifest = {
      name: "FORGE Fitness",
      short_name: "FORGE",
      start_url: "/",
      display: "standalone",
      background_color: "#f8f9fa",
      theme_color: "#00e5ff",
      icons: [
        {
          src: "https://picsum.photos/seed/forge/192/192",
          sizes: "192x192",
          type: "image/png"
        },
        {
          src: "https://picsum.photos/seed/forge/512/512",
          sizes: "512x512",
          type: "image/png"
        }
      ]
    };
    const stringManifest = JSON.stringify(manifest);
    const blob = new Blob([stringManifest], {type: 'application/json'});
    const manifestURL = URL.createObjectURL(blob);
    const link = document.createElement('link');
    link.rel = 'manifest';
    link.href = manifestURL;
    document.head.appendChild(link);
    
    // Service Worker
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch(() => {});
    }
  }, []);

  if (loading) return <LoadingScreen />;

  return (
    <div className="max-w-[430px] mx-auto min-h-screen bg-bg relative overflow-x-hidden pb-24">
      <AnimatePresence mode="wait">
        {currentScreen === 'AUTH' && <AuthScreen key="auth" />}
        {currentScreen === 'ONBOARDING' && <OnboardingScreen key="onboarding" onComplete={() => setCurrentScreen('LIFESTYLE')} />}
        {currentScreen === 'LIFESTYLE' && <LifestyleScreen key="lifestyle" onComplete={() => setCurrentScreen('DIET_MODE')} />}
        {currentScreen === 'DIET_MODE' && <DietModeScreen key="diet_mode" onComplete={() => setCurrentScreen('PLAN_BUILDER')} />}
        {currentScreen === 'PLAN_BUILDER' && <PlanBuilderScreen key="plan_builder" onComplete={() => setCurrentScreen('DASHBOARD')} />}
        
        {/* Main Tabs */}
        {['DASHBOARD', 'LIBRARY', 'DIET', 'PROGRESS', 'SOCIAL'].includes(currentScreen) && (
          <div className="px-6 pt-12 pb-6">
            {currentScreen === 'DASHBOARD' && <DashboardScreen profile={profile!} />}
            {currentScreen === 'LIBRARY' && <LibraryScreen />}
            {currentScreen === 'DIET' && <DietScreen profile={profile!} />}
            {currentScreen === 'PROGRESS' && <ProgressScreen profile={profile!} />}
            {currentScreen === 'SOCIAL' && <SocialScreen profile={profile!} />}
          </div>
        )}
      </AnimatePresence>

      {/* Navigation */}
      {['DASHBOARD', 'LIBRARY', 'DIET', 'PROGRESS', 'SOCIAL'].includes(currentScreen) && (
        <nav className="glass-nav h-20 flex items-center justify-around px-2">
          <NavButton active={currentScreen === 'DASHBOARD'} onClick={() => setCurrentScreen('DASHBOARD')} icon={<Home size={24} />} label="Home" />
          <NavButton active={currentScreen === 'LIBRARY'} onClick={() => setCurrentScreen('LIBRARY')} icon={<BookOpen size={24} />} label="Library" />
          <NavButton active={currentScreen === 'DIET'} onClick={() => setCurrentScreen('DIET')} icon={<Utensils size={24} />} label="Diet" />
          <NavButton active={currentScreen === 'PROGRESS'} onClick={() => setCurrentScreen('PROGRESS')} icon={<BarChart2 size={24} />} label="Stats" />
          <NavButton active={currentScreen === 'SOCIAL'} onClick={() => setCurrentScreen('SOCIAL')} icon={<Users size={24} />} label="Social" />
        </nav>
      )}

      {/* AI Assistant Button */}
      {['DASHBOARD', 'LIBRARY', 'DIET', 'PROGRESS', 'SOCIAL'].includes(currentScreen) && (
        <button 
          onClick={() => setAiChatOpen(true)}
          className="fixed bottom-24 right-6 w-14 h-14 bg-accent text-ink rounded-full shadow-lg flex items-center justify-center z-40 active:scale-90 transition-transform"
        >
          <MessageSquare size={28} />
        </button>
      )}

      {/* AI Chat Panel */}
      <AiChatPanel isOpen={aiChatOpen} onClose={() => setAiChatOpen(false)} profile={profile} />
    </div>
  );
}

// --- SUB-COMPONENTS ---

function NavButton({ active, onClick, icon, label }: { active: boolean, onClick: () => void, icon: React.ReactNode, label: string }) {
  return (
    <button onClick={onClick} className={`flex flex-col items-center justify-center gap-1 transition-colors ${active ? 'text-accent' : 'text-gray-400'}`}>
      {icon}
      <span className="text-[10px] font-display uppercase tracking-wider">{label}</span>
      {active && <motion.div layoutId="nav-underline" className="h-0.5 w-4 bg-accent rounded-full mt-0.5" />}
    </button>
  );
}

// Placeholder Screens (to be implemented)
function AuthScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLogin, setIsLogin] = useState(true);

  const handleAuth = async () => {
    try {
      if (isLogin) {
        await auth.signInWithEmailAndPassword(email, password);
      } else {
        await auth.createUserWithEmailAndPassword(email, password);
      }
    } catch (e: any) {
      alert(e.message);
    }
  };

  const handleGoogle = async () => {
    const provider = new window.firebase.auth.GoogleAuthProvider();
    await auth.signInWithPopup(provider);
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="min-h-screen flex flex-col px-8 pt-24">
      <div className="mb-12">
        <h1 className="font-display text-5xl font-bold tracking-tighter mb-2">FORGE</h1>
        <p className="text-gray-500">Your clinical fitness companion.</p>
      </div>

      <div className="space-y-4">
        <input 
          type="email" placeholder="Email" className="forge-input w-full" 
          value={email} onChange={e => setEmail(e.target.value)} 
        />
        <input 
          type="password" placeholder="Password" className="forge-input w-full" 
          value={password} onChange={e => setPassword(e.target.value)} 
        />
        <button onClick={handleAuth} className="forge-button-primary w-full">
          {isLogin ? 'Sign In' : 'Create Account'}
        </button>
        <div className="flex items-center gap-4 py-2">
          <div className="h-px bg-border flex-1" />
          <span className="text-xs text-gray-400 uppercase">OR</span>
          <div className="h-px bg-border flex-1" />
        </div>
        <button onClick={handleGoogle} className="forge-button-secondary w-full flex items-center justify-center gap-2">
          <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" className="w-5 h-5" alt="Google" />
          Continue with Google
        </button>
      </div>

      <button onClick={() => setIsLogin(!isLogin)} className="mt-8 text-sm text-gray-500 underline">
        {isLogin ? "Don't have an account? Sign Up" : "Already have an account? Sign In"}
      </button>
    </motion.div>
  );
}

// Onboarding, Lifestyle, etc. will be added in the next turn...
function OnboardingScreen({ onComplete }: { onComplete: () => void, key?: string }) {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    name: '',
    username: '',
    dob: '',
    gender: 'Male' as const,
    weight: 70,
    height: 170,
    fitnessLevel: 'Beginner' as const
  });

  const bmi = calculateBMI(formData.weight, formData.height);
  const category = getBMICategory(bmi);

  const handleNext = async () => {
    if (step < 3) {
      setStep(step + 1);
    } else {
      // Check username uniqueness
      const usernameDoc = await db.collection('usernames').doc(formData.username.toLowerCase()).get();
      if (usernameDoc.exists) {
        alert('Username already taken');
        return;
      }
      onComplete();
      // We save at the very end of the onboarding flow
      localStorage.setItem('forge_onboarding', JSON.stringify(formData));
    }
  };

  return (
    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="min-h-screen flex flex-col px-6 pt-12">
      <div className="flex items-center justify-between mb-8">
        <div className="flex gap-1">
          {[1, 2, 3].map(i => (
            <div key={i} className={`h-1 w-8 rounded-full ${step >= i ? 'bg-accent' : 'bg-border'}`} />
          ))}
        </div>
        <span className="text-xs font-display text-gray-400 uppercase tracking-widest">Step {step} of 3</span>
      </div>

      {step === 1 && (
        <div className="space-y-6">
          <h2 className="font-display text-3xl font-bold">The Basics</h2>
          <div className="space-y-4">
            <div className="space-y-1">
              <label className="text-xs font-display uppercase text-gray-400">Display Name</label>
              <input type="text" className="forge-input w-full" placeholder="John Doe" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-display uppercase text-gray-400">Username</label>
              <input type="text" className="forge-input w-full" placeholder="johndoe123" value={formData.username} onChange={e => setFormData({...formData, username: e.target.value})} />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-display uppercase text-gray-400">Date of Birth</label>
              <input type="date" className="forge-input w-full" value={formData.dob} onChange={e => setFormData({...formData, dob: e.target.value})} />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-display uppercase text-gray-400">Gender</label>
              <div className="flex gap-2">
                {['Male', 'Female', 'Other'].map(g => (
                  <button 
                    key={g} 
                    onClick={() => setFormData({...formData, gender: g as any})}
                    className={`flex-1 py-3 rounded-xl border font-display text-sm transition-all ${formData.gender === g ? 'bg-ink text-white border-ink' : 'bg-white text-ink border-border'}`}
                  >
                    {g}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {step === 2 && (
        <div className="space-y-6">
          <h2 className="font-display text-3xl font-bold">Physical Profile</h2>
          <div className="space-y-8">
            <div className="space-y-4">
              <div className="flex justify-between items-end">
                <label className="text-xs font-display uppercase text-gray-400">Weight (kg)</label>
                <span className="font-mono text-2xl">{formData.weight}</span>
              </div>
              <input type="range" min="40" max="200" step="0.5" className="w-full accent-accent" value={formData.weight} onChange={e => setFormData({...formData, weight: parseFloat(e.target.value)})} />
            </div>
            <div className="space-y-4">
              <div className="flex justify-between items-end">
                <label className="text-xs font-display uppercase text-gray-400">Height (cm)</label>
                <span className="font-mono text-2xl">{formData.height}</span>
              </div>
              <input type="range" min="120" max="230" className="w-full accent-accent" value={formData.height} onChange={e => setFormData({...formData, height: parseInt(e.target.value)})} />
            </div>

            <div className="forge-card mt-8 flex flex-col items-center">
              <span className="text-xs font-display uppercase text-gray-400 mb-2">Calculated BMI</span>
              <span className="font-mono text-5xl font-bold mb-1">{bmi}</span>
              <span className="font-display text-sm uppercase tracking-widest" style={{ color: category.color }}>{category.label}</span>
              
              <div className="w-full h-2 bg-border rounded-full mt-6 relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-r from-yellow-400 via-accent to-red-500 opacity-30" />
                <motion.div 
                  className="absolute top-0 bottom-0 w-1 bg-ink z-10"
                  animate={{ left: `${Math.min(Math.max((bmi - 15) / 25 * 100, 0), 100)}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {step === 3 && (
        <div className="space-y-6">
          <h2 className="font-display text-3xl font-bold">Experience</h2>
          <div className="space-y-4">
            <p className="text-gray-500 text-sm">How would you describe your current fitness level?</p>
            {['Beginner', 'Intermediate', 'Expert'].map(level => (
              <button 
                key={level}
                onClick={() => setFormData({...formData, fitnessLevel: level as any})}
                className={`w-full p-6 rounded-2xl border text-left transition-all ${formData.fitnessLevel === level ? 'bg-ink border-ink' : 'bg-white border-border'}`}
              >
                <div className="flex justify-between items-center">
                  <span className={`font-display text-lg ${formData.fitnessLevel === level ? 'text-white' : 'text-ink'}`}>{level}</span>
                  {formData.fitnessLevel === level && <CheckCircle2 className="text-accent" />}
                </div>
                <p className={`text-xs mt-1 ${formData.fitnessLevel === level ? 'text-gray-400' : 'text-gray-500'}`}>
                  {level === 'Beginner' && 'Just starting out or returning after a long break.'}
                  {level === 'Intermediate' && 'Regularly active with some knowledge of training.'}
                  {level === 'Expert' && 'Advanced athlete with consistent high-performance history.'}
                </p>
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="mt-auto pb-12">
        <button onClick={handleNext} className="forge-button-primary w-full flex items-center justify-center gap-2">
          {step === 3 ? 'Finish Profile' : 'Continue'}
          <ArrowRight size={18} />
        </button>
      </div>
    </motion.div>
  );
}

function LifestyleScreen({ onComplete }: { onComplete: () => void, key?: string }) {
  const [step, setStep] = useState(1);
  const [lifestyle, setLifestyle] = useState({
    job: 'Sedentary',
    sleep: '7h',
    workouts: 3,
    stress: 'Medium',
    water: '1-2L'
  });
  const [goal, setGoal] = useState<'CUT' | 'MAINTAIN' | 'BULK' | null>(null);

  const onboardingData = JSON.parse(localStorage.getItem('forge_onboarding') || '{}');

  const activityMultipliers: Record<string, number> = {
    'Sedentary': 1.2,
    'Light': 1.375,
    'Moderate': 1.55,
    'Very Active': 1.725,
    'Athlete': 1.9
  };

  const tdee = calculateTDEE(onboardingData, activityMultipliers[lifestyle.job]);

  const handleFinish = async () => {
    if (!goal) return;
    
    const finalProfile: UserProfile = {
      ...onboardingData,
      ...lifestyle,
      goal,
      tdee,
      bmi: calculateBMI(onboardingData.weight, onboardingData.height),
      uid: auth.currentUser.uid,
      xp: 0,
      level: 'STONE',
      streak: 0,
      gymStreak: 0,
      dietMode: 'CLEAN' // Default
    };

    await db.collection('users').doc(auth.currentUser.uid).set(finalProfile);
    await db.collection('usernames').doc(finalProfile.username.toLowerCase()).set({ uid: auth.currentUser.uid });
    
    onComplete();
  };

  return (
    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="min-h-screen flex flex-col px-6 pt-12">
      <div className="flex items-center justify-between mb-8">
        <div className="flex gap-1">
          {[1, 2].map(i => (
            <div key={i} className={`h-1 w-12 rounded-full ${step >= i ? 'bg-accent' : 'bg-border'}`} />
          ))}
        </div>
        <span className="text-xs font-display text-gray-400 uppercase tracking-widest">Lifestyle</span>
      </div>

      {step === 1 ? (
        <div className="space-y-8 no-scrollbar overflow-y-auto pb-12">
          <h2 className="font-display text-3xl font-bold">Daily Habits</h2>
          
          <div className="space-y-4">
            <label className="text-xs font-display uppercase text-gray-400">Job Type</label>
            <div className="grid grid-cols-2 gap-2">
              {['Sedentary', 'Light', 'Moderate', 'Very Active', 'Athlete'].map(j => (
                <button key={j} onClick={() => setLifestyle({...lifestyle, job: j})} className={`p-3 rounded-xl border text-sm font-display ${lifestyle.job === j ? 'bg-ink text-white border-ink' : 'bg-white text-ink border-border'}`}>{j}</button>
              ))}
            </div>
          </div>

          <div className="space-y-4">
            <label className="text-xs font-display uppercase text-gray-400">Sleep Duration</label>
            <div className="flex gap-2 overflow-x-auto no-scrollbar">
              {['<5h', '6h', '7h', '8h', '9h+'].map(s => (
                <button key={s} onClick={() => setLifestyle({...lifestyle, sleep: s})} className={`px-5 py-3 rounded-xl border text-sm font-display whitespace-nowrap ${lifestyle.sleep === s ? 'bg-ink text-white border-ink' : 'bg-white text-ink border-border'}`}>{s}</button>
              ))}
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex justify-between items-end">
              <label className="text-xs font-display uppercase text-gray-400">Workouts / Week</label>
              <span className="font-mono text-xl">{lifestyle.workouts}</span>
            </div>
            <input type="range" min="0" max="7" className="w-full accent-accent" value={lifestyle.workouts} onChange={e => setLifestyle({...lifestyle, workouts: parseInt(e.target.value)})} />
          </div>

          <div className="space-y-4">
            <label className="text-xs font-display uppercase text-gray-400">Stress Level</label>
            <div className="flex gap-2">
              {['Low', 'Medium', 'High'].map(s => (
                <button key={s} onClick={() => setLifestyle({...lifestyle, stress: s})} className={`flex-1 py-3 rounded-xl border text-sm font-display ${lifestyle.stress === s ? 'bg-ink text-white border-ink' : 'bg-white text-ink border-border'}`}>{s}</button>
              ))}
            </div>
          </div>

          <button onClick={() => setStep(2)} className="forge-button-primary w-full mt-4">Calculate Goal</button>
        </div>
      ) : (
        <div className="space-y-8">
          <div className="text-center">
            <span className="text-xs font-display uppercase text-gray-400">Your Daily TDEE</span>
            <h2 className="font-mono text-5xl font-bold text-accent">{tdee} <span className="text-xl">kcal</span></h2>
            <p className="text-xs text-gray-500 mt-2">Total Daily Energy Expenditure based on your profile.</p>
          </div>

          <div className="space-y-4">
            <label className="text-xs font-display uppercase text-gray-400">Choose Your Path</label>
            
            <GoalCard 
              selected={goal === 'CUT'} 
              onClick={() => setGoal('CUT')}
              emoji="🔪" title="CUT" 
              desc="Lose fat while maintaining muscle."
              kcal={tdee - 400} 
              delta="-0.4kg/week" 
              macros="40/30/30"
            />
            
            <GoalCard 
              selected={goal === 'MAINTAIN'} 
              onClick={() => setGoal('MAINTAIN')}
              emoji="⚖️" title="MAINTAIN" 
              desc="Keep your current weight and improve form."
              kcal={tdee} 
              delta="0.0kg/week" 
              macros="30/40/30"
            />
            
            <GoalCard 
              selected={goal === 'BULK'} 
              onClick={() => setGoal('BULK')}
              emoji="🏗️" title="BULK" 
              desc="Gain size and strength efficiently."
              kcal={tdee + 400} 
              delta="+0.4kg/week" 
              macros="30/50/20"
            />
          </div>

          <button onClick={handleFinish} disabled={!goal} className="forge-button-primary w-full mt-4 disabled:opacity-50">Confirm Goal</button>
        </div>
      )}
    </motion.div>
  );
}

function GoalCard({ selected, onClick, emoji, title, desc, kcal, delta, macros }: any) {
  return (
    <button onClick={onClick} className={`w-full p-5 rounded-2xl border text-left transition-all ${selected ? 'bg-ink border-ink' : 'bg-white border-border'}`}>
      <div className="flex justify-between items-start mb-2">
        <div className="flex items-center gap-3">
          <span className="text-2xl">{emoji}</span>
          <div>
            <h3 className={`font-display font-bold ${selected ? 'text-white' : 'text-ink'}`}>{title}</h3>
            <p className={`text-[10px] ${selected ? 'text-gray-400' : 'text-gray-500'}`}>{desc}</p>
          </div>
        </div>
        <div className="text-right">
          <span className={`font-mono text-lg block ${selected ? 'text-accent' : 'text-ink'}`}>{kcal} kcal</span>
          <span className="text-[10px] text-gray-400">{delta}</span>
        </div>
      </div>
      <div className="flex gap-2 mt-3">
        {['Protein', 'Carbs', 'Fats'].map((m, i) => (
          <div key={m} className="flex-1 flex flex-col">
            <span className="text-[8px] uppercase text-gray-400">{m}</span>
            <div className="h-1 bg-border rounded-full mt-1 overflow-hidden">
              <div className="h-full bg-accent" style={{ width: `${macros.split('/')[i]}%` }} />
            </div>
          </div>
        ))}
      </div>
    </button>
  );
}
function DietModeScreen({ onComplete }: { onComplete: () => void, key?: string }) {
  const [mode, setMode] = useState<'CLEAN' | 'IIFYM' | 'BUDGET' | null>(null);

  const handleSelect = async () => {
    if (!mode) return;
    await db.collection('users').doc(auth.currentUser.uid).update({ dietMode: mode });
    onComplete();
  };

  return (
    <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="min-h-screen flex flex-col px-6 pt-12">
      <h2 className="font-display text-3xl font-bold mb-2">Diet Strategy</h2>
      <p className="text-gray-500 text-sm mb-8">How do you prefer to track your nutrition?</p>

      <div className="space-y-4">
        <DietOption 
          selected={mode === 'CLEAN'} onClick={() => setMode('CLEAN')}
          emoji="🥗" title="CLEAN EATING" 
          desc="Structured meal plans with full macro tracking. Best for strict results." 
        />
        <DietOption 
          selected={mode === 'IIFYM'} onClick={() => setMode('IIFYM')}
          emoji="⚡" title="IIFYM" 
          desc="If It Fits Your Macros. Flexible eating with focus on daily targets." 
        />
        <DietOption 
          selected={mode === 'BUDGET'} onClick={() => setMode('BUDGET')}
          emoji="🎯" title="CALORIE BUDGET" 
          desc="Simple calorie counting. No macro tracking required. Minimalist approach." 
        />
      </div>

      <button onClick={handleSelect} disabled={!mode} className="forge-button-primary w-full mt-auto mb-12 disabled:opacity-50">Continue to Training</button>
    </motion.div>
  );
}

function DietOption({ selected, onClick, emoji, title, desc }: any) {
  return (
    <button onClick={onClick} className={`w-full p-6 rounded-2xl border text-left transition-all ${selected ? 'bg-ink border-ink' : 'bg-white border-border'}`}>
      <div className="flex items-center gap-4 mb-2">
        <span className="text-2xl">{emoji}</span>
        <h3 className={`font-display font-bold ${selected ? 'text-white' : 'text-ink'}`}>{title}</h3>
      </div>
      <p className={`text-xs leading-relaxed ${selected ? 'text-gray-400' : 'text-gray-500'}`}>{desc}</p>
    </button>
  );
}

function PlanBuilderScreen({ onComplete }: { onComplete: () => void, key?: string }) {
  const [mode, setMode] = useState<'CUSTOM' | 'AI' | null>(null);
  const [aiChat, setAiChat] = useState<{ role: 'user' | 'assistant', content: string }[]>([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);

  const handleAiSend = async () => {
    if (!input.trim()) return;
    const newMsg = { role: 'user' as const, content: input };
    setAiChat([...aiChat, newMsg]);
    setInput('');
    setIsTyping(true);

    try {
      const profile = (await db.collection('users').doc(auth.currentUser.uid).get()).data();
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': CLAUDE_API_KEY,
          'anthropic-version': '2023-06-01',
          'anthropic-dangerous-direct-browser-access': 'true'
        },
        body: JSON.stringify({
          model: 'claude-3-5-sonnet-20240620',
          max_tokens: 1000,
          system: `You are FORGE AI, an expert personal trainer. The user's profile: ${JSON.stringify(profile)}. Be concise, precise, and motivating. Format plans clearly with days, exercises, sets, reps.`,
          messages: [...aiChat, newMsg]
        })
      });
      const data = await response.json();
      setAiChat(prev => [...prev, { role: 'assistant', content: data.content[0].text }]);
    } catch (e) {
      setAiChat(prev => [...prev, { role: 'assistant', content: "FORGE AI is temporarily unavailable. Try again." }]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleSavePlan = async (plan: any) => {
    await db.collection('users').doc(auth.currentUser.uid).collection('plan').doc('current').set({
      content: plan,
      createdAt: new Date().toISOString()
    });
    onComplete();
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="min-h-screen flex flex-col px-6 pt-12">
      {!mode ? (
        <div className="space-y-6">
          <h2 className="font-display text-3xl font-bold">Training Plan</h2>
          <p className="text-gray-500 text-sm">Do you already have a workout plan?</p>
          <button onClick={() => setMode('CUSTOM')} className="forge-card w-full text-left flex items-center justify-between group">
            <div>
              <h3 className="font-display font-bold">Yes, I have one</h3>
              <p className="text-xs text-gray-500">Build your custom routine manually.</p>
            </div>
            <ChevronRight className="text-gray-300 group-hover:text-accent transition-colors" />
          </button>
          <button onClick={() => setMode('AI')} className="forge-card w-full text-left flex items-center justify-between group border-accent/30 bg-accent/5">
            <div>
              <h3 className="font-display font-bold">No, build one for me</h3>
              <p className="text-xs text-gray-500">Claude AI will design a plan based on your goals.</p>
            </div>
            <ChevronRight className="text-accent" />
          </button>
        </div>
      ) : mode === 'AI' ? (
        <div className="flex flex-col h-[80vh]">
          <div className="flex-1 overflow-y-auto no-scrollbar space-y-4 pb-4">
            {aiChat.length === 0 && (
              <div className="bg-white border border-border p-4 rounded-2xl text-sm text-gray-600">
                Hi! I'm FORGE AI. To build your perfect plan, tell me:
                <ul className="list-disc ml-4 mt-2 space-y-1">
                  <li>Available days per week?</li>
                  <li>Equipment (Home/Gym/None)?</li>
                  <li>Any injuries or limitations?</li>
                  <li>Preferred split (PPL, Full Body, etc.)?</li>
                </ul>
              </div>
            )}
            {aiChat.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[85%] p-4 rounded-2xl text-sm ${msg.role === 'user' ? 'bg-accent text-ink' : 'bg-white border border-border text-ink'}`}>
                  {msg.content}
                </div>
              </div>
            ))}
            {isTyping && (
              <div className="flex justify-start">
                <div className="bg-white border border-border p-4 rounded-2xl flex gap-1">
                  <div className="w-1.5 h-1.5 bg-gray-300 rounded-full animate-bounce" />
                  <div className="w-1.5 h-1.5 bg-gray-300 rounded-full animate-bounce [animation-delay:0.2s]" />
                  <div className="w-1.5 h-1.5 bg-gray-300 rounded-full animate-bounce [animation-delay:0.4s]" />
                </div>
              </div>
            )}
          </div>
          <div className="pt-4 space-y-3">
            <div className="flex gap-2">
              <input 
                type="text" className="forge-input flex-1" placeholder="Type your answer..." 
                value={input} onChange={e => setInput(e.target.value)}
                onKeyPress={e => e.key === 'Enter' && handleAiSend()}
              />
              <button onClick={handleAiSend} className="w-12 h-12 bg-ink text-white rounded-xl flex items-center justify-center">
                <Send size={20} />
              </button>
            </div>
            {aiChat.some(m => m.role === 'assistant') && (
              <button onClick={() => handleSavePlan(aiChat[aiChat.length-1].content)} className="forge-button-primary w-full">Confirm & Save Plan</button>
            )}
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          <h2 className="font-display text-2xl font-bold">Custom Plan Editor</h2>
          <p className="text-xs text-gray-500">Coming soon in this demo. For now, use the AI Builder for the full experience.</p>
          <button onClick={() => setMode('AI')} className="forge-button-secondary w-full">Use AI Builder Instead</button>
        </div>
      )}
    </motion.div>
  );
}

function DashboardScreen({ profile }: { profile: UserProfile }) {
  const [steps, setSteps] = useState(6420);
  const [workoutChecked, setWorkoutChecked] = useState(false);
  const [dietChecked, setDietChecked] = useState(false);

  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 18) return 'Good Afternoon';
    return 'Good Evening';
  }, []);

  const levelInfo = useMemo(() => {
    const levels = [
      { name: 'STONE', min: 0, icon: '🪨' },
      { name: 'BRONZE', min: 7, icon: '🥉' },
      { name: 'SILVER', min: 30, icon: '🥈' },
      { name: 'GOLD', min: 90, icon: '🥇' },
      { name: 'DIAMOND', min: 180, icon: '💎' },
      { name: 'GLADIATOR', min: 365, icon: '⚔️' }
    ];
    return levels.find((l, i) => profile.streak >= l.min && (i === levels.length - 1 || profile.streak < levels[i+1].min)) || levels[0];
  }, [profile.streak]);

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">
      <header className="flex justify-between items-start">
        <div>
          <p className="text-xs font-display text-gray-400 uppercase tracking-widest">{new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</p>
          <h1 className="font-display text-2xl font-bold">{greeting}, {profile.name.split(' ')[0]}</h1>
        </div>
        <div className="bg-accent/10 text-accent px-3 py-1 rounded-full text-[10px] font-display font-bold tracking-widest border border-accent/20">
          {profile.goal}
        </div>
      </header>

      <div className="grid grid-cols-2 gap-4">
        <div className="forge-card flex flex-col items-center justify-center py-8 relative overflow-hidden">
          <div className="absolute inset-0 opacity-5 pointer-events-none">
            <Activity size={120} className="absolute -right-4 -bottom-4" />
          </div>
          <div className="relative w-32 h-32 flex items-center justify-center">
            <svg className="w-full h-full -rotate-90">
              <circle cx="64" cy="64" r="58" fill="none" stroke="#f0f0f0" strokeWidth="8" />
              <motion.circle 
                cx="64" cy="64" r="58" fill="none" stroke="#00e5ff" strokeWidth="8" 
                strokeDasharray="364.4" 
                initial={{ strokeDashoffset: 364.4 }}
                animate={{ strokeDashoffset: 364.4 - (364.4 * Math.min(steps / 10000, 1)) }}
                transition={{ duration: 1, ease: "easeOut" }}
              />
            </svg>
            <div className="absolute flex flex-col items-center">
              <span className="font-mono text-2xl font-bold">{steps.toLocaleString()}</span>
              <span className="text-[8px] text-gray-400 uppercase">Steps</span>
            </div>
          </div>
          <div className="flex gap-2 mt-4">
            <button onClick={() => setSteps(s => s + 500)} className="w-8 h-8 bg-border rounded-lg flex items-center justify-center text-[10px] font-bold">+500</button>
            <button onClick={() => setSteps(s => s + 1000)} className="w-8 h-8 bg-border rounded-lg flex items-center justify-center text-[10px] font-bold">+1k</button>
          </div>
        </div>

        <div className="flex flex-col gap-4">
          <div className="forge-card flex-1 flex flex-col items-center justify-center text-center">
            <span className="text-[24px] mb-1">{levelInfo.icon}</span>
            <span className="text-[10px] font-display text-gray-400 uppercase tracking-widest">{levelInfo.name}</span>
            <div className="w-full h-1 bg-border rounded-full mt-2 overflow-hidden">
              <div className="h-full bg-accent" style={{ width: '45%' }} />
            </div>
          </div>
          <div className="forge-card flex-1 flex items-center justify-around">
            <div className="text-center">
              <Flame size={20} className="text-orange-500 mx-auto mb-1" />
              <span className="font-mono text-lg font-bold">{profile.gymStreak}</span>
              <span className="text-[8px] text-gray-400 block uppercase">Gym</span>
            </div>
            <div className="w-px h-8 bg-border" />
            <div className="text-center">
              <Zap size={20} className="text-accent mx-auto mb-1" />
              <span className="font-mono text-lg font-bold">{profile.streak}</span>
              <span className="text-[8px] text-gray-400 block uppercase">Routine</span>
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="font-display text-xs font-bold uppercase tracking-widest text-gray-400">Daily Check-in</h3>
        <CheckInItem 
          icon={<Dumbbell size={18} />} 
          label="Followed Workout Plan" 
          checked={workoutChecked} 
          onToggle={() => setWorkoutChecked(!workoutChecked)} 
        />
        <CheckInItem 
          icon={<Utensils size={18} />} 
          label="Hit Calorie/Diet Goal" 
          checked={dietChecked} 
          onToggle={() => setDietChecked(!dietChecked)} 
        />
      </div>

      <div className="forge-card bg-ink text-white">
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-display font-bold">Today's Workout</h3>
          <span className="text-[10px] font-mono text-accent">PUSH DAY</span>
        </div>
        <div className="space-y-3">
          <div className="flex justify-between text-xs">
            <span className="text-gray-400">Bench Press</span>
            <span>4 x 8-10</span>
          </div>
          <div className="flex justify-between text-xs">
            <span className="text-gray-400">Overhead Press</span>
            <span>3 x 12</span>
          </div>
          <div className="flex justify-between text-xs">
            <span className="text-gray-400">Lateral Raises</span>
            <span>3 x 15</span>
          </div>
        </div>
        <button className="w-full mt-6 py-3 bg-accent text-ink rounded-xl font-display font-bold text-sm">Start Session</button>
      </div>
    </motion.div>
  );
}

function CheckInItem({ icon, label, checked, onToggle }: any) {
  return (
    <button onClick={onToggle} className="w-full forge-card py-4 flex items-center justify-between group">
      <div className="flex items-center gap-4">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors ${checked ? 'bg-accent/10 text-accent' : 'bg-border text-gray-400'}`}>
          {icon}
        </div>
        <span className={`font-display text-sm ${checked ? 'text-ink' : 'text-gray-500'}`}>{label}</span>
      </div>
      <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${checked ? 'bg-accent border-accent' : 'border-border'}`}>
        {checked && <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }}><CheckCircle2 size={14} className="text-ink" /></motion.div>}
      </div>
    </button>
  );
}
function LibraryScreen() {
  const [activeTab, setActiveTab] = useState('Chest');
  const [disclaimerDismissed, setDisclaimerDismissed] = useState(false);

  const exercises: Record<string, any[]> = {
    'Chest': [
      { name: 'Bench Press', rank: 'S', type: 'Compound', diff: 4, equip: 'Barbell' },
      { name: 'Incline DB Press', rank: 'S', type: 'Compound', diff: 3, equip: 'Dumbbells' },
      { name: 'Weighted Dips', rank: 'A', type: 'Compound', diff: 4, equip: 'Bodyweight' },
      { name: 'Cable Flyes', rank: 'B', type: 'Isolation', diff: 2, equip: 'Cables' },
      { name: 'Pushups', rank: 'C', type: 'Compound', diff: 2, equip: 'Bodyweight' }
    ],
    'Back': [
      { name: 'Deadlift', rank: 'S', type: 'Compound', diff: 5, equip: 'Barbell' },
      { name: 'Pullups', rank: 'S', type: 'Compound', diff: 4, equip: 'Bodyweight' },
      { name: 'Barbell Row', rank: 'A', type: 'Compound', diff: 4, equip: 'Barbell' },
      { name: 'Lat Pulldown', rank: 'B', type: 'Compound', diff: 2, equip: 'Machine' }
    ],
    'Legs': [
      { name: 'Squat', rank: 'S', type: 'Compound', diff: 5, equip: 'Barbell' },
      { name: 'Leg Press', rank: 'A', type: 'Compound', diff: 3, equip: 'Machine' },
      { name: 'Bulgarian Split Squat', rank: 'S', type: 'Compound', diff: 5, equip: 'Dumbbells' }
    ]
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      {!disclaimerDismissed && (
        <div className="bg-orange-500/10 border border-orange-500/20 p-4 rounded-xl flex gap-3">
          <Activity className="text-orange-500 shrink-0" size={20} />
          <div className="space-y-1">
            <p className="text-[10px] text-orange-200 leading-tight">
              Rankings are general guidelines based on biomechanics. Consult a professional before starting. FORGE is not liable for injuries.
            </p>
            <button onClick={() => setDisclaimerDismissed(true)} className="text-[10px] font-bold text-orange-500 uppercase">Dismiss</button>
          </div>
        </div>
      )}

      <div className="flex gap-2 overflow-x-auto no-scrollbar pb-2">
        {['Chest', 'Back', 'Shoulders', 'Arms', 'Legs', 'Core'].map(tab => (
          <button 
            key={tab} 
            onClick={() => setActiveTab(tab)}
            className={`px-6 py-2 rounded-full font-display text-xs uppercase tracking-widest transition-all ${activeTab === tab ? 'bg-accent text-ink' : 'bg-white border border-border text-gray-400'}`}
          >
            {tab}
          </button>
        ))}
      </div>

      <div className="space-y-4">
        {(exercises[activeTab] || []).map((ex, i) => (
          <ExerciseCard key={i} exercise={ex} />
        ))}
      </div>
    </motion.div>
  );
}

function ExerciseCard({ exercise }: { exercise: any, key?: number }) {
  const [expanded, setExpanded] = useState(false);
  const rankColors: any = { 'S': 'text-yellow-500', 'A': 'text-green-500', 'B': 'text-blue-500', 'C': 'text-gray-400' };

  return (
    <div className="forge-card p-0 overflow-hidden">
      <div className="h-32 shimmer flex items-center justify-center relative">
        <span className="text-[10px] font-display text-gray-400 uppercase tracking-widest">GIF: {exercise.name}</span>
        <div className={`absolute top-3 right-3 w-8 h-8 bg-white/80 backdrop-blur-sm rounded-lg flex items-center justify-center font-mono font-bold ${rankColors[exercise.rank]}`}>
          {exercise.rank}
        </div>
      </div>
      <div className="p-4">
        <div className="flex justify-between items-start mb-1">
          <h3 className="font-display font-bold">{exercise.name}</h3>
          <div className="flex gap-0.5">
            {[1, 2, 3, 4, 5].map(d => (
              <div key={d} className={`w-1 h-1 rounded-full ${d <= exercise.diff ? 'bg-accent' : 'bg-border'}`} />
            ))}
          </div>
        </div>
        <div className="flex gap-2 text-[10px] text-gray-400 uppercase tracking-widest">
          <span>{exercise.type}</span>
          <span>•</span>
          <span>{exercise.equip}</span>
        </div>
        
        {expanded && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} className="mt-4 pt-4 border-t border-border space-y-3">
            <p className="text-xs text-gray-500 leading-relaxed">Focus on a controlled eccentric phase and full range of motion. Keep your core tight throughout the movement.</p>
            <div className="bg-accent/5 p-3 rounded-xl">
              <span className="text-[8px] font-bold text-accent uppercase block mb-1">Pro Tip</span>
              <p className="text-[10px] text-gray-600">Pause for 1 second at the peak contraction for maximum fiber recruitment.</p>
            </div>
            <button className="w-full py-2 bg-ink text-white rounded-lg text-[10px] font-display uppercase tracking-widest flex items-center justify-center gap-2">
              <MessageSquare size={12} /> Ask FORGE AI
            </button>
          </motion.div>
        )}
        
        <button onClick={() => setExpanded(!expanded)} className="w-full mt-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest">
          {expanded ? 'Show Less' : 'Show Details'}
        </button>
      </div>
    </div>
  );
}

function DietScreen({ profile }: { profile: UserProfile }) {
  const [consumed, setConsumed] = useState(1450);
  const [water, setWater] = useState(4);
  const [search, setSearch] = useState('');
  const [results, setResults] = useState<any[]>([]);

  const handleSearch = async () => {
    if (!search) return;
    const res = await fetch(`https://world.openfoodfacts.org/cgi/search.pl?search_terms=${search}&search_simple=1&action=process&json=1`);
    const data = await res.json();
    setResults(data.products.slice(0, 5));
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8">
      <div className="grid grid-cols-2 gap-4">
        <div className="forge-card flex flex-col items-center justify-center py-6">
          <span className="text-[10px] font-display text-gray-400 uppercase tracking-widest mb-1">Remaining</span>
          <span className="font-mono text-3xl font-bold text-accent">{profile.tdee - consumed}</span>
          <span className="text-[10px] text-gray-400 uppercase">kcal</span>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <MacroRing label="P" color="#00e5ff" value={65} />
          <MacroRing label="C" color="#ffcc00" value={40} />
          <MacroRing label="F" color="#ff3b30" value={30} />
          <MacroRing label="W" color="#007aff" value={water * 12.5} />
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input 
              type="text" className="forge-input w-full pl-12" placeholder="Search food..." 
              value={search} onChange={e => setSearch(e.target.value)}
              onKeyPress={e => e.key === 'Enter' && handleSearch()}
            />
          </div>
          <button onClick={handleSearch} className="w-12 h-12 bg-ink text-white rounded-xl flex items-center justify-center"><Search size={20} /></button>
        </div>

        {results.length > 0 && (
          <div className="space-y-2">
            {results.map((p, i) => (
              <div key={i} className="forge-card py-3 flex justify-between items-center">
                <div>
                  <h4 className="text-xs font-bold">{p.product_name}</h4>
                  <p className="text-[10px] text-gray-400">{p.brands}</p>
                </div>
                <button className="text-accent"><Plus size={20} /></button>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="space-y-4">
        <h3 className="font-display text-xs font-bold uppercase tracking-widest text-gray-400">Water Intake</h3>
        <div className="forge-card flex items-center justify-between">
          <div className="flex gap-2">
            {[1, 2, 3, 4, 5, 6, 7, 8].map(i => (
              <button 
                key={i} 
                onClick={() => setWater(i)}
                className={`w-8 h-10 rounded-lg border flex flex-col items-center justify-center transition-all ${water >= i ? 'bg-blue-500 border-blue-500 text-white' : 'bg-white border-border text-gray-300'}`}
              >
                <Droplets size={14} />
              </button>
            ))}
          </div>
          <span className="font-mono text-sm font-bold">{water}/8</span>
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="font-display text-xs font-bold uppercase tracking-widest text-gray-400">Weekly Summary</h3>
        <div className="forge-card h-48 flex items-end justify-around pb-2">
          {[1800, 2100, 1950, 2300, 2000, 1850, 2100].map((h, i) => (
            <div key={i} className="flex flex-col items-center gap-2 w-8">
              <div className="w-full bg-accent/20 rounded-t-lg relative" style={{ height: `${(h / 2500) * 100}%` }}>
                <div className="absolute bottom-0 left-0 right-0 bg-accent rounded-t-lg" style={{ height: '70%' }} />
              </div>
              <span className="text-[8px] text-gray-400 uppercase">MTWTFSS'[i]</span>
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  );
}

function MacroRing({ label, color, value }: any) {
  return (
    <div className="forge-card p-2 flex items-center gap-2">
      <div className="w-8 h-8 relative">
        <svg className="w-full h-full -rotate-90">
          <circle cx="16" cy="16" r="14" fill="none" stroke="#f0f0f0" strokeWidth="3" />
          <circle cx="16" cy="16" r="14" fill="none" stroke={color} strokeWidth="3" strokeDasharray="87.9" strokeDashoffset={87.9 - (87.9 * value / 100)} />
        </svg>
        <span className="absolute inset-0 flex items-center justify-center text-[8px] font-bold">{label}</span>
      </div>
      <span className="font-mono text-[10px] font-bold">{value}%</span>
    </div>
  );
}
function ProgressScreen({ profile }: { profile: UserProfile }) {
  const [activeTab, setActiveTab] = useState('Charts');
  const [measurements, setMeasurements] = useState({
    Chest: 102,
    Waist: 82,
    Arms: 38,
    Thighs: 62
  });

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8">
      <div className="flex gap-2 p-1 bg-border rounded-xl">
        {['Charts', 'Measurements', 'Photos'].map(t => (
          <button 
            key={t} 
            onClick={() => setActiveTab(t)}
            className={`flex-1 py-2 rounded-lg text-xs font-display uppercase tracking-widest transition-all ${activeTab === t ? 'bg-white text-ink shadow-sm' : 'text-gray-400'}`}
          >
            {t}
          </button>
        ))}
      </div>

      {activeTab === 'Charts' && (
        <div className="space-y-6">
          <div className="forge-card">
            <div className="flex justify-between items-center mb-6">
              <h3 className="font-display text-xs font-bold uppercase tracking-widest text-gray-400">Weight Trend</h3>
              <span className="font-mono text-xs text-accent">-2.4kg this month</span>
            </div>
            <div className="h-40 w-full relative">
              <svg className="w-full h-full overflow-visible">
                <path 
                  d="M 0 80 Q 50 70, 100 90 T 200 60 T 300 75 T 400 40" 
                  fill="none" stroke="#00e5ff" strokeWidth="3" strokeLinecap="round" 
                />
                <circle cx="400" cy="40" r="4" fill="#00e5ff" />
              </svg>
              <div className="absolute bottom-0 left-0 right-0 flex justify-between text-[8px] text-gray-400 uppercase font-mono">
                <span>Feb 01</span>
                <span>Feb 15</span>
                <span>Mar 01</span>
              </div>
            </div>
          </div>

          <div className="forge-card">
            <h3 className="font-display text-xs font-bold uppercase tracking-widest text-gray-400 mb-4">Consistency Heatmap</h3>
            <div className="grid grid-cols-13 gap-1">
              {Array.from({ length: 52 }).map((_, i) => (
                <div key={i} className={`aspect-square rounded-[2px] ${i % 3 === 0 ? 'bg-accent' : i % 5 === 0 ? 'bg-accent/40' : 'bg-border'}`} />
              ))}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'Measurements' && (
        <div className="space-y-4">
          {Object.entries(measurements).map(([key, val]) => (
            <div key={key} className="forge-card py-4 flex justify-between items-center">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-border rounded-lg flex items-center justify-center text-gray-400">
                  <Activity size={16} />
                </div>
                <span className="font-display text-sm">{key}</span>
              </div>
              <div className="flex items-center gap-4">
                <div className="text-right">
                  <span className="font-mono text-lg font-bold">{val}</span>
                  <span className="text-[10px] text-gray-400 ml-1">cm</span>
                </div>
                <ChevronRight size={16} className="text-gray-300" />
              </div>
            </div>
          ))}
          <button className="forge-button-secondary w-full flex items-center justify-center gap-2">
            <Plus size={18} /> Log New Entry
          </button>
        </div>
      )}

      {activeTab === 'Photos' && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <span className="text-[10px] font-display text-gray-400 uppercase tracking-widest">Before</span>
              <div className="aspect-[3/4] bg-border rounded-2xl overflow-hidden relative">
                <img src="https://picsum.photos/seed/before/300/400" className="w-full h-full object-cover grayscale" alt="Before" referrerPolicy="no-referrer" />
                <div className="absolute bottom-3 left-3 bg-black/50 backdrop-blur-sm px-2 py-1 rounded text-[8px] text-white font-mono">JAN 01, 2026</div>
              </div>
            </div>
            <div className="space-y-2">
              <span className="text-[10px] font-display text-gray-400 uppercase tracking-widest">Current</span>
              <div className="aspect-[3/4] bg-border rounded-2xl overflow-hidden relative border-2 border-accent">
                <img src="https://picsum.photos/seed/after/300/400" className="w-full h-full object-cover" alt="After" referrerPolicy="no-referrer" />
                <div className="absolute bottom-3 left-3 bg-accent px-2 py-1 rounded text-[8px] text-ink font-mono font-bold">TODAY</div>
              </div>
            </div>
          </div>
          
          <div className="forge-card bg-accent/5 border-accent/20">
            <h4 className="font-display text-sm font-bold mb-3 flex items-center gap-2">
              <Trophy size={16} className="text-accent" /> Progress Report
            </h4>
            <ul className="space-y-2">
              {['Chest Definition ✅', 'Shoulder Width ✅', 'Core Stability ✅'].map(item => (
                <li key={item} className="text-xs text-gray-600 flex items-center gap-2">
                  <div className="w-1 h-1 bg-accent rounded-full" /> {item}
                </li>
              ))}
            </ul>
            <button className="w-full mt-6 py-3 bg-ink text-white rounded-xl font-display text-xs uppercase tracking-widest flex items-center justify-center gap-2">
              <Share2 size={14} /> Share Transformation
            </button>
          </div>
        </div>
      )}
    </motion.div>
  );
}

function SocialScreen({ profile }: { profile: UserProfile }) {
  const [activeTab, setActiveTab] = useState('Friends');
  const [search, setSearch] = useState('');
  const [group, setGroup] = useState<any>(null);

  // Mock group data
  useEffect(() => {
    setGroup({
      name: 'IRON TRIBE',
      streak: 14,
      tier: 'IRON TRIBE',
      members: [
        { name: 'Alex', streak: 14, checkedIn: true },
        { name: 'Sarah', streak: 22, checkedIn: true },
        { name: 'Mike', streak: 5, checkedIn: false },
        { name: 'Elena', streak: 45, checkedIn: true }
      ]
    });
  }, []);

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8">
      <div className="flex gap-2 p-1 bg-border rounded-xl">
        {['Friends', 'Groups', 'Community'].map(t => (
          <button 
            key={t} 
            onClick={() => setActiveTab(t)}
            className={`flex-1 py-2 rounded-lg text-xs font-display uppercase tracking-widest transition-all ${activeTab === t ? 'bg-white text-ink shadow-sm' : 'text-gray-400'}`}
          >
            {t}
          </button>
        ))}
      </div>

      {activeTab === 'Friends' && (
        <div className="space-y-6">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input 
              type="text" className="forge-input w-full pl-12" placeholder="Search by username..." 
              value={search} onChange={e => setSearch(e.target.value)}
            />
          </div>

          <div className="space-y-4">
            <h3 className="font-display text-xs font-bold uppercase tracking-widest text-gray-400">Active Friends</h3>
            {[1, 2, 3].map(i => (
              <div key={i} className="forge-card py-4 flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-border rounded-full flex items-center justify-center font-display font-bold text-gray-400">
                    {['JD', 'AS', 'MK'][i-1]}
                  </div>
                  <div>
                    <h4 className="text-sm font-bold">{['JohnDoe', 'ActiveSarah', 'MikeFit'][i-1]}</h4>
                    <span className="text-[10px] text-gray-400 uppercase tracking-widest">🥉 BRONZE • 🔥 {i*5}d</span>
                  </div>
                </div>
                <ChevronRight size={16} className="text-gray-300" />
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'Groups' && group && (
        <div className="space-y-6">
          <div className="forge-card bg-ink text-white relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-10">
              <Users size={80} />
            </div>
            <div className="relative z-10">
              <span className="text-[10px] font-display text-accent uppercase tracking-widest font-bold">⚔️ {group.tier}</span>
              <h2 className="font-display text-2xl font-bold mt-1">{group.name}</h2>
              <div className="flex items-center gap-2 mt-4">
                <Flame size={20} className="text-orange-500" />
                <span className="font-mono text-3xl font-bold">{group.streak}</span>
                <span className="text-xs text-gray-400 uppercase tracking-widest">Day Streak</span>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="font-display text-xs font-bold uppercase tracking-widest text-gray-400">Member Status</h3>
              <span className="text-[10px] text-gray-500 uppercase">Resets at Midnight</span>
            </div>
            {group.members.map((m: any, i: number) => (
              <div key={i} className="forge-card py-4 flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <div className={`w-2 h-2 rounded-full ${m.checkedIn ? 'bg-accent' : 'bg-danger'}`} />
                  <span className="font-display text-sm">{m.name}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs text-gray-400">🔥 {m.streak}</span>
                  {m.checkedIn ? <CheckCircle2 size={16} className="text-accent" /> : <X size={16} className="text-danger" />}
                </div>
              </div>
            ))}
          </div>

          <div className="forge-card h-64 flex flex-col">
            <h3 className="font-display text-xs font-bold uppercase tracking-widest text-gray-400 mb-4">Group Chat</h3>
            <div className="flex-1 overflow-y-auto no-scrollbar space-y-3 mb-4">
              <div className="text-[10px] text-gray-400 text-center uppercase tracking-widest py-2">Today</div>
              <ChatMessage name="Sarah" text="Who's hitting legs today?" time="09:42" />
              <ChatMessage name="Mike" text="Just finished! Brutal session." time="10:15" />
              <div className="bg-accent/5 p-2 rounded-lg text-[10px] text-accent text-center font-bold uppercase tracking-widest">
                🏆 Group reached IRON TRIBE tier!
              </div>
            </div>
            <div className="flex gap-2">
              <input type="text" className="forge-input flex-1 py-2 text-sm" placeholder="Message group..." />
              <button className="w-10 h-10 bg-ink text-white rounded-xl flex items-center justify-center"><Send size={16} /></button>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'Community' && (
        <div className="space-y-6">
          <div className="forge-card border-accent/30 bg-accent/5">
            <h3 className="font-display text-sm font-bold mb-2">Share a Milestone</h3>
            <textarea className="w-full bg-white border border-border rounded-xl p-3 text-xs focus:outline-none focus:border-accent" rows={3} placeholder="What did you achieve today?"></textarea>
            <button className="forge-button-primary w-full mt-3 py-2 text-xs">Post to Feed</button>
          </div>

          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="forge-card space-y-3">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-border rounded-full" />
                    <div>
                      <h4 className="text-xs font-bold">User_{i}42</h4>
                      <span className="text-[8px] text-gray-400 uppercase">2 hours ago</span>
                    </div>
                  </div>
                  <button className="text-gray-300"><Heart size={16} /></button>
                </div>
                <p className="text-xs text-gray-600">Just hit a new PR on Bench Press! 100kg for 5 reps. Feeling stronger every day. 🔥 #FORGE #Progress</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </motion.div>
  );
}

function ChatMessage({ name, text, time }: any) {
  return (
    <div className="space-y-1">
      <div className="flex justify-between items-end">
        <span className="text-[10px] font-bold text-gray-400">{name}</span>
        <span className="text-[8px] text-gray-300">{time}</span>
      </div>
      <div className="bg-white border border-border p-3 rounded-2xl rounded-tl-none text-xs text-gray-600">
        {text}
      </div>
    </div>
  );
}
function AiChatPanel({ isOpen, onClose, profile }: { isOpen: boolean, onClose: () => void, profile: UserProfile | null }) {
  const [messages, setMessages] = useState<{ role: 'user' | 'assistant', content: string }[]>([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

  const handleSend = async () => {
    if (!input.trim() || !profile) return;
    const newMsg = { role: 'user' as const, content: input };
    setMessages([...messages, newMsg]);
    setInput('');
    setIsTyping(true);

    try {
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': CLAUDE_API_KEY,
          'anthropic-version': '2023-06-01',
          'anthropic-dangerous-direct-browser-access': 'true'
        },
        body: JSON.stringify({
          model: 'claude-3-5-sonnet-20240620',
          max_tokens: 1000,
          system: `You are FORGE AI, a clinical fitness assistant. 
          User Profile: ${JSON.stringify(profile)}.
          Be concise, clinical, and motivating. 
          Provide advice on training, nutrition, and recovery. 
          Always include a disclaimer for medical or injury-related questions.`,
          messages: [...messages, newMsg]
        })
      });
      const data = await response.json();
      if (data.content && data.content[0]) {
        setMessages(prev => [...prev, { role: 'assistant', content: data.content[0].text }]);
      } else {
        throw new Error('Invalid response');
      }
    } catch (e) {
      setMessages(prev => [...prev, { role: 'assistant', content: "FORGE AI is temporarily unavailable. Please check your connection or try again later." }]);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[60]"
          />
          <motion.div 
            initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed bottom-0 left-0 right-0 h-[85vh] bg-bg rounded-t-[32px] z-[70] flex flex-col shadow-2xl overflow-hidden"
          >
            <div className="p-6 border-b border-border flex justify-between items-center bg-white">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-accent rounded-xl flex items-center justify-center text-ink">
                  <MessageSquare size={20} />
                </div>
                <div>
                  <h3 className="font-display font-bold">FORGE AI</h3>
                  <span className="text-[10px] text-accent font-bold uppercase tracking-widest">Active Assistant</span>
                </div>
              </div>
              <button onClick={onClose} className="w-10 h-10 bg-border rounded-full flex items-center justify-center text-gray-400">
                <X size={20} />
              </button>
            </div>

            <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 space-y-4 no-scrollbar">
              {messages.length === 0 && (
                <div className="text-center py-12 space-y-4">
                  <div className="w-16 h-16 bg-accent/10 rounded-full flex items-center justify-center mx-auto text-accent">
                    <Zap size={32} />
                  </div>
                  <div className="space-y-1">
                    <h4 className="font-display font-bold">How can I help you today?</h4>
                    <p className="text-xs text-gray-500 max-w-[200px] mx-auto">Ask me about your plan, nutrition, or exercise form.</p>
                  </div>
                  <div className="flex flex-wrap justify-center gap-2 pt-4">
                    {['Suggest high protein snacks', 'Explain my TDEE', 'Tips for better sleep'].map(q => (
                      <button key={q} onClick={() => setInput(q)} className="px-4 py-2 bg-white border border-border rounded-full text-[10px] font-display uppercase tracking-widest text-gray-500 hover:border-accent hover:text-accent transition-colors">
                        {q}
                      </button>
                    ))}
                  </div>
                </div>
              )}
              {messages.map((msg, i) => (
                <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[85%] p-4 rounded-2xl text-sm leading-relaxed ${msg.role === 'user' ? 'bg-accent text-ink rounded-tr-none' : 'bg-white border border-border text-ink rounded-tl-none shadow-sm'}`}>
                    {msg.content}
                  </div>
                </div>
              ))}
              {isTyping && (
                <div className="flex justify-start">
                  <div className="bg-white border border-border p-4 rounded-2xl rounded-tl-none flex gap-1">
                    <div className="w-1.5 h-1.5 bg-gray-300 rounded-full animate-bounce" />
                    <div className="w-1.5 h-1.5 bg-gray-300 rounded-full animate-bounce [animation-delay:0.2s]" />
                    <div className="w-1.5 h-1.5 bg-gray-300 rounded-full animate-bounce [animation-delay:0.4s]" />
                  </div>
                </div>
              )}
            </div>

            <div className="p-6 bg-white border-t border-border">
              <div className="flex gap-3">
                <input 
                  type="text" className="forge-input flex-1" placeholder="Ask anything..." 
                  value={input} onChange={e => setInput(e.target.value)}
                  onKeyPress={e => e.key === 'Enter' && handleSend()}
                />
                <button onClick={handleSend} disabled={!input.trim() || isTyping} className="w-12 h-12 bg-ink text-white rounded-xl flex items-center justify-center disabled:opacity-50">
                  <Send size={20} />
                </button>
              </div>
              <p className="text-[8px] text-gray-400 text-center mt-4 uppercase tracking-widest">
                AI can make mistakes. Consult a professional for serious concerns.
              </p>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
