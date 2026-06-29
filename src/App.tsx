import React, { useState, useEffect } from 'react';
import { Bell } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

// Core imports
import { Subject, Task, CalendarBlock, Grade, Note, TabType, UserProfile } from './types';
import { 
  DEFAULT_SUBJECTS, 
  INITIAL_TASKS, 
  INITIAL_CALENDAR_BLOCKS, 
  INITIAL_GRADES, 
  INITIAL_NOTES 
} from './data';

// Supabase integrations
import {
  getSubjectsFromSupabase,
  upsertSubjectInSupabase,
  deleteSubjectFromSupabase,
  getEventsFromSupabase,
  upsertEventInSupabase,
  deleteEventFromSupabase,
  clearAllEventsFromSupabase,
  getGradesFromSupabase,
  upsertGradeInSupabase,
  deleteGradeFromSupabase,
  isSupabaseConfigured
} from './supabaseClient';

// Component imports
import PomodoroWidget from './components/PomodoroWidget';
import CalendarTab from './components/CalendarTab';
import UploadTab from './components/UploadTab';
import GradesTab from './components/GradesTab';
import NotesTab from './components/NotesTab';
import ProfileTab from './components/ProfileTab';

interface ToastMsg {
  id: string;
  msg: string;
  type: 'success' | 'warning' | 'error';
}

export default function App() {
  const [activeTab, setActiveTab] = useState<TabType>('dashboard');
  const [subjects, setSubjectsState] = useState<Subject[]>(DEFAULT_SUBJECTS);

  // User Profile State with LocalStorage hydration
  const [user, setUser] = useState<UserProfile>(() => {
    const saved = localStorage.getItem('academiq_user_profile');
    return saved ? JSON.parse(saved) : {
      name: 'Maria Couto',
      email: 'MariaCCBCouto@gmail.com',
      photoUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&h=150&q=80',
      isLoggedIn: true
    };
  });
  
  // Data State with LocalStorage re-hydration
  const [tasks, setTasks] = useState<Task[]>(() => {
    const saved = localStorage.getItem('academiq_tasks');
    return saved ? JSON.parse(saved) : INITIAL_TASKS;
  });

  const [calendarBlocks, setCalendarBlocksState] = useState<CalendarBlock[]>(() => {
    const saved = localStorage.getItem('academiq_calendar_blocks');
    return saved ? JSON.parse(saved) : INITIAL_CALENDAR_BLOCKS;
  });

  const [grades, setGradesState] = useState<Grade[]>(() => {
    const saved = localStorage.getItem('academiq_grades');
    return saved ? JSON.parse(saved) : INITIAL_GRADES;
  });

  const [notes, setNotes] = useState<Note[]>(() => {
    const saved = localStorage.getItem('academiq_notes');
    return saved ? JSON.parse(saved) : INITIAL_NOTES;
  });

  // Wrapped custom setters to synchronize changes to Supabase in real-time
  const setCalendarBlocks: React.Dispatch<React.SetStateAction<CalendarBlock[]>> = (valueOrFunc) => {
    setCalendarBlocksState(prev => {
      const next = typeof valueOrFunc === 'function' ? (valueOrFunc as any)(prev) : valueOrFunc;
      
      if (isSupabaseConfigured()) {
        // Find deleted blocks
        const deleted = prev.filter(p => !next.some(n => n.id === p.id));
        deleted.forEach(item => {
          deleteEventFromSupabase(item.id).catch(err => console.error('Error deleting event from Supabase:', err));
        });

        // If next is empty and prev was not, and it was a "clear all" action
        if (next.length === 0 && prev.length > 0) {
          clearAllEventsFromSupabase().catch(err => console.error('Error clearing events from Supabase:', err));
        } else {
          // Find added or modified blocks
          const addedOrModified = next.filter(n => {
            const existing = prev.find(p => p.id === n.id);
            return !existing || JSON.stringify(existing) !== JSON.stringify(n);
          });
          addedOrModified.forEach(item => {
            upsertEventInSupabase(item).catch(err => console.error('Error saving event to Supabase:', err));
          });
        }
      }
      return next;
    });
  };

  const setGrades: React.Dispatch<React.SetStateAction<Grade[]>> = (valueOrFunc) => {
    setGradesState(prev => {
      const next = typeof valueOrFunc === 'function' ? (valueOrFunc as any)(prev) : valueOrFunc;
      
      if (isSupabaseConfigured()) {
        // Find deleted grades
        const deleted = prev.filter(p => !next.some(n => n.id === p.id));
        deleted.forEach(item => {
          deleteGradeFromSupabase(item.id).catch(err => console.error('Error deleting grade from Supabase:', err));
        });

        // Find added or modified grades
        const addedOrModified = next.filter(n => {
          const existing = prev.find(p => p.id === n.id);
          return !existing || JSON.stringify(existing) !== JSON.stringify(n);
        });
        addedOrModified.forEach(item => {
          upsertGradeInSupabase(item).catch(err => console.error('Error saving grade to Supabase:', err));
        });
      }
      return next;
    });
  };

  // Synchronize on mount from Supabase
  useEffect(() => {
    async function loadDataFromSupabase() {
      if (!isSupabaseConfigured()) {
        console.log('Supabase is not configured yet. Running in offline/localStorage mode.');
        return;
      }

      try {
        console.log('Synchronizing data with Supabase...');
        
        // 1. Subjects
        const dbSubjects = await getSubjectsFromSupabase();
        if (dbSubjects && dbSubjects.length > 0) {
          setSubjectsState(dbSubjects);
        } else {
          // Seed initial subjects
          for (const sub of DEFAULT_SUBJECTS) {
            await upsertSubjectInSupabase(sub);
          }
          setSubjectsState(DEFAULT_SUBJECTS);
        }

        // 2. Events (Calendar blocks)
        const dbEvents = await getEventsFromSupabase();
        if (dbEvents && dbEvents.length > 0) {
          setCalendarBlocksState(dbEvents);
        } else {
          // Seed initial events
          for (const block of INITIAL_CALENDAR_BLOCKS) {
            await upsertEventInSupabase(block);
          }
          setCalendarBlocksState(INITIAL_CALENDAR_BLOCKS);
        }

        // 3. Grades
        const dbGrades = await getGradesFromSupabase();
        if (dbGrades && dbGrades.length > 0) {
          setGradesState(dbGrades);
        } else {
          // Seed initial grades
          for (const grade of INITIAL_GRADES) {
            await upsertGradeInSupabase(grade);
          }
          setGradesState(INITIAL_GRADES);
        }

        showToast('Dados sincronizados com o Supabase!', 'success');
      } catch (err) {
        console.error('Error synchronizing with Supabase on mount:', err);
        showToast('Erro ao sincronizar com o Supabase, modo offline ativo.', 'warning');
      }
    }

    loadDataFromSupabase();
  }, []);

  // Toasts state
  const [toasts, setToasts] = useState<ToastMsg[]>([]);

  // LocalStorage synchronizer
  useEffect(() => {
    localStorage.setItem('academiq_tasks', JSON.stringify(tasks));
  }, [tasks]);

  useEffect(() => {
    localStorage.setItem('academiq_calendar_blocks', JSON.stringify(calendarBlocks));
  }, [calendarBlocks]);

  useEffect(() => {
    localStorage.setItem('academiq_grades', JSON.stringify(grades));
  }, [grades]);

  useEffect(() => {
    localStorage.setItem('academiq_notes', JSON.stringify(notes));
  }, [notes]);

  useEffect(() => {
    localStorage.setItem('academiq_user_profile', JSON.stringify(user));
  }, [user]);

  // Toast notifier helper
  const showToast = (msg: string, type: 'success' | 'warning' | 'error' = 'success') => {
    const id = Date.now().toString();
    setToasts(prev => [...prev, { id, msg, type }]);
    
    // Auto clear after 3 seconds
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 3000);
  };

  return (
    <div className="bg-slate-50 text-slate-800 font-sans min-h-screen flex flex-col antialiased overflow-x-hidden">
      
      {/* Header Principal Minimalista - Idêntico ao Logótipo do Screenshot */}
      <header className="bg-white border-b border-slate-100 sticky top-0 z-40 shadow-sm">
        <div className="py-4.5 px-6 md:px-10 flex items-center justify-between">
          
          {/* Branding + Tabs Navigation */}
          <div className="flex items-center gap-10 lg:gap-14">
            
            {/* Logo Branding */}
            <div className="flex items-center select-none shrink-0">
              <span className="text-[28px] font-bold text-indigo-600 tracking-tight leading-none">
                Academiq
              </span>
            </div>

            {/* Navegação de Abas Principal (Desktop) */}
            <nav className="hidden md:flex items-center gap-8">
              {(['dashboard', 'upload', 'grades', 'notes'] as TabType[]).map((tab) => {
                const label = {
                  dashboard: 'Painel',
                  upload: 'Horário IA',
                  grades: 'Notas & Médias',
                  notes: 'Anotações'
                }[tab];

                const isActive = activeTab === tab;

                return (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`relative py-1.5 text-sm font-semibold transition-colors cursor-pointer select-none ${
                      isActive
                        ? 'text-[#7c3aed] font-bold'
                        : 'text-slate-550 hover:text-slate-800'
                    }`}
                  >
                    {label}
                    {isActive && (
                      <span className="absolute bottom-[-22px] left-0 right-0 h-[3px] bg-[#7c3aed] rounded-full" />
                    )}
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Right side widgets (Pomodoro, Bell, Settings, Avatar) */}
          <div className="flex items-center gap-4.5">
            {/* Pomodoro Timer Widget */}
            <PomodoroWidget />

            {/* Bell Notification */}
            <button 
              onClick={() => showToast('Não tem notificações novas de momento.')}
              className="text-slate-400 hover:text-slate-650 p-1.5 rounded-full hover:bg-slate-50 transition-colors cursor-pointer shrink-0"
              title="Notificações"
            >
              <Bell size={18} className="stroke-[2]" />
            </button>

            {/* Avatar Image */}
            <button 
              onClick={() => setActiveTab('profile')}
              className={`w-8.5 h-8.5 rounded-full overflow-hidden shrink-0 shadow-sm hover:ring-2 hover:ring-indigo-400 transition-all select-none cursor-pointer ${activeTab === 'profile' ? 'ring-2 ring-indigo-500' : ''}`}
              title="Ver Perfil"
            >
              <img 
                src={user.photoUrl} 
                alt={user.name} 
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
            </button>
          </div>
        </div>

        {/* Navegação de Abas Principal (Mobile Only) */}
        <div className="md:hidden border-t border-slate-100 bg-white/95 backdrop-blur-sm px-4 py-2.5 flex items-center justify-around gap-2 overflow-x-auto scrollbar-none">
          {(['dashboard', 'upload', 'grades', 'notes'] as TabType[]).map((tab) => {
            const label = {
              dashboard: 'Painel',
              upload: 'Horário IA',
              grades: 'Notas & Médias',
              notes: 'Anotações'
            }[tab];

            const isActive = activeTab === tab;

            return (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-3.5 py-2 text-xs font-bold rounded-xl transition-colors cursor-pointer ${
                  isActive
                    ? 'bg-indigo-50 text-indigo-700'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                {label}
              </button>
            );
          })}
        </div>
      </header>

      {/* Contentor SPA Principal */}
      <main className="flex-grow p-5 md:p-8 max-w-[1440px] w-full mx-auto">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className="w-full"
          >
            {activeTab === 'dashboard' && (
              <CalendarTab 
                subjects={subjects}
                tasks={tasks}
                setTasks={setTasks}
                calendarBlocks={calendarBlocks}
                setCalendarBlocks={setCalendarBlocks}
                showToast={showToast}
              />
            )}
            {activeTab === 'upload' && (
              <UploadTab 
                subjects={subjects}
                setCalendarBlocks={setCalendarBlocks}
                navigate={setActiveTab}
                showToast={showToast}
              />
            )}
            {activeTab === 'grades' && (
              <GradesTab 
                subjects={subjects}
                grades={grades}
                setGrades={setGrades}
                showToast={showToast}
              />
            )}
            {activeTab === 'notes' && (
              <NotesTab 
                subjects={subjects}
                notes={notes}
                setNotes={setNotes}
                showToast={showToast}
              />
            )}
            {activeTab === 'profile' && (
              <ProfileTab 
                user={user}
                setUser={setUser}
                showToast={showToast}
              />
            )}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Toast Notification Container */}
      <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-2.5 pointer-events-none">
        <AnimatePresence>
          {toasts.map(toast => {
            const styles = {
              success: 'border-emerald-100 bg-white text-slate-700',
              warning: 'border-amber-150 bg-white text-slate-700',
              error: 'border-rose-100 bg-white text-slate-700'
            }[toast.type];

            return (
              <motion.div
                key={toast.id}
                initial={{ opacity: 0, y: 20, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 15, scale: 0.95 }}
                transition={{ duration: 0.2 }}
                className={`flex items-center gap-2.5 px-4.5 py-3 rounded-2xl shadow-md border text-xs font-semibold max-w-xs ${styles} pointer-events-auto`}
              >
                <span className="flex-shrink-0">
                  {toast.type === 'success' && <span className="text-emerald-500">✔</span>}
                  {toast.type === 'warning' && <span className="text-amber-500">⚠</span>}
                  {toast.type === 'error' && <span className="text-rose-500">✘</span>}
                </span>
                <span className="leading-tight">{toast.msg}</span>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

    </div>
  );
}
