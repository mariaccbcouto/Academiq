import React, { useState } from 'react';
import { User, Mail, Image as ImageIcon, LogOut, LogIn, Check, Sparkles, UserCheck, ShieldCheck } from 'lucide-react';
import { UserProfile } from '../types';

interface ProfileTabProps {
  user: UserProfile;
  setUser: React.Dispatch<React.SetStateAction<UserProfile>>;
  showToast: (msg: string, type?: 'success' | 'warning' | 'error') => void;
}

const PRESET_AVATARS = [
  { id: 'av1', label: 'Estudante A', url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&h=150&q=80' },
  { id: 'av2', label: 'Estudante B', url: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=150&h=150&q=80' },
  { id: 'av3', label: 'Estudante C', url: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=150&h=150&q=80' },
  { id: 'av4', label: 'Estudante D', url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&h=150&q=80' }
];

export default function ProfileTab({ user, setUser, showToast }: ProfileTabProps) {
  // Local edit states
  const [editName, setEditName] = useState(user.name);
  const [editEmail, setEditEmail] = useState(user.email);
  const [selectedPhoto, setSelectedPhoto] = useState(user.photoUrl);

  // States for logging in when logged out
  const [loginName, setLoginName] = useState('');
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPhoto, setLoginPhoto] = useState(PRESET_AVATARS[0].url);

  const handleUpdateProfile = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editName.trim()) {
      showToast('O nome não pode estar vazio.', 'error');
      return;
    }
    if (!editEmail.trim() || !editEmail.includes('@')) {
      showToast('Por favor insira um email válido.', 'error');
      return;
    }

    setUser({
      name: editName.trim(),
      email: editEmail.trim(),
      photoUrl: selectedPhoto,
      isLoggedIn: true
    });
    showToast('Perfil atualizado com sucesso!', 'success');
  };

  const handleLogout = () => {
    setUser(prev => ({ ...prev, isLoggedIn: false }));
    showToast('Sessão terminada. Até breve!', 'warning');
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginName.trim()) {
      showToast('Insira o seu nome para entrar.', 'error');
      return;
    }
    if (!loginEmail.trim() || !loginEmail.includes('@')) {
      showToast('Por favor insira um email válido.', 'error');
      return;
    }

    setUser({
      name: loginName.trim(),
      email: loginEmail.trim(),
      photoUrl: loginPhoto,
      isLoggedIn: true
    });
    
    // Sync edit fields too
    setEditName(loginName.trim());
    setEditEmail(loginEmail.trim());
    setSelectedPhoto(loginPhoto);

    showToast(`Bem-vindo de volta, ${loginName.trim()}!`, 'success');
  };

  if (!user.isLoggedIn) {
    return (
      <div className="max-w-md mx-auto my-8 bg-white border border-slate-100 rounded-[24px] p-8 shadow-md space-y-6">
        <div className="text-center space-y-2">
          {/* Locked Icon */}
          <div className="w-14 h-14 bg-indigo-50 border border-indigo-100 rounded-2xl flex items-center justify-center text-indigo-600 mx-auto shadow-sm">
            <LogIn size={26} className="stroke-[2.25] translate-x-[1px]" />
          </div>
          <h2 className="font-extrabold text-slate-900 text-lg tracking-tight mt-3">Iniciar Sessão no Academiq</h2>
          <p className="text-xs text-slate-400 font-medium">Por favor, preencha os seus dados para aceder ao seu painel de estudos.</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          {/* Name Field */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wide flex items-center gap-1">
              <User size={11} /> Nome Completo
            </label>
            <input 
              type="text" 
              placeholder="Ex: Maria Couto" 
              value={loginName}
              onChange={e => setLoginName(e.target.value)}
              className="w-full text-xs border border-slate-200 rounded-xl px-4 py-3 bg-slate-50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-slate-400 font-semibold transition-all"
              required
            />
          </div>

          {/* Email Field */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wide flex items-center gap-1">
              <Mail size={11} /> Endereço de Email
            </label>
            <input 
              type="email" 
              placeholder="maria@exemplo.com" 
              value={loginEmail}
              onChange={e => setLoginEmail(e.target.value)}
              className="w-full text-xs border border-slate-200 rounded-xl px-4 py-3 bg-slate-50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-slate-400 font-semibold transition-all"
              required
            />
          </div>

          {/* Preset Avatar Selection */}
          <div className="space-y-2">
            <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wide flex items-center gap-1">
              <ImageIcon size={11} /> Escolha uma Foto de Perfil
            </label>
            <div className="grid grid-cols-4 gap-3">
              {PRESET_AVATARS.map(avatar => {
                const isSelected = loginPhoto === avatar.url;
                return (
                  <button
                    key={avatar.id}
                    type="button"
                    onClick={() => setLoginPhoto(avatar.url)}
                    className={`relative w-12 h-12 rounded-xl overflow-hidden cursor-pointer transition-all border-2 shrink-0 shadow-sm hover:scale-105 active:scale-95 ${
                      isSelected ? 'border-indigo-600 scale-[1.02]' : 'border-slate-100 hover:border-slate-300'
                    }`}
                  >
                    <img 
                      src={avatar.url} 
                      alt={avatar.label} 
                      className="w-full h-full object-cover" 
                      referrerPolicy="no-referrer"
                    />
                    {isSelected && (
                      <div className="absolute inset-0 bg-indigo-600/35 flex items-center justify-center">
                        <Check size={14} className="text-white stroke-[4.5]" />
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          <button
            type="submit"
            className="w-full py-3.5 mt-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl transition-all cursor-pointer shadow-sm flex items-center justify-center gap-2 hover:shadow"
          >
            <UserCheck size={14} /> Entrar na Conta
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      
      {/* Bento Grid layout for profile options */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
        
        {/* Left Card: Summary Card */}
        <div className="md:col-span-1 bg-white border border-slate-100 rounded-[20px] p-6 shadow-sm text-center space-y-5">
          <div className="relative inline-block mx-auto">
            {/* Avatar Frame */}
            <div className="w-24 h-24 rounded-[22px] overflow-hidden border-3 border-white ring-4 ring-indigo-50 shadow-md">
              <img 
                src={user.photoUrl} 
                alt={user.name} 
                className="w-full h-full object-cover" 
                referrerPolicy="no-referrer"
              />
            </div>
            <div className="absolute bottom-[-6px] right-[-6px] bg-indigo-600 text-white p-1.5 rounded-xl border-2 border-white shadow-sm" title="Utilizador Verificado">
              <ShieldCheck size={14} className="stroke-[2.5]" />
            </div>
          </div>

          <div>
            <h3 className="font-extrabold text-slate-900 text-base tracking-tight leading-tight truncate">
              {user.name}
            </h3>
            <p className="text-[11px] text-slate-400 font-semibold mt-1 truncate">
              {user.email}
            </p>
          </div>

          {/* User badge */}
          <div className="bg-indigo-50/50 border border-indigo-100 rounded-xl py-2 px-3 inline-flex items-center gap-1.5 mx-auto">
            <span className="w-1.5 h-1.5 rounded-full bg-indigo-600 animate-pulse"></span>
            <span className="text-[10px] text-indigo-700 font-extrabold uppercase tracking-wider">Estudante Ativo</span>
          </div>

          {/* Log Out Button */}
          <div className="border-t border-slate-100 pt-5">
            <button
              onClick={handleLogout}
              className="w-full py-2.5 text-center text-xs font-bold text-rose-600 hover:text-white bg-rose-50 hover:bg-rose-600 rounded-xl transition-all cursor-pointer shadow-sm flex items-center justify-center gap-1.5 active:scale-95 border border-rose-100/50 hover:border-rose-600"
            >
              <LogOut size={13} className="stroke-[2.5]" /> Terminar Sessão
            </button>
          </div>
        </div>

        {/* Right Card: Settings Forms */}
        <div className="md:col-span-2 bg-white border border-slate-100 rounded-[20px] p-6 md:p-7 shadow-sm space-y-6">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h3 className="font-extrabold text-slate-900 text-sm tracking-tight">Configurações de Perfil</h3>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-0.5">Mantenha a sua conta pessoal atualizada</p>
            </div>
            <Sparkles size={16} className="text-indigo-500" />
          </div>

          <form onSubmit={handleUpdateProfile} className="space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Name field */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wide">Nome Completo</label>
                <input 
                  type="text" 
                  value={editName}
                  onChange={e => setEditName(e.target.value)}
                  className="w-full text-xs border border-slate-200 rounded-xl px-4 py-3 bg-slate-50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-slate-400 font-semibold transition-all"
                  required
                />
              </div>

              {/* Email field */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wide">Endereço de Email</label>
                <input 
                  type="email" 
                  value={editEmail}
                  onChange={e => setEditEmail(e.target.value)}
                  className="w-full text-xs border border-slate-200 rounded-xl px-4 py-3 bg-slate-50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-slate-400 font-semibold transition-all"
                  required
                />
              </div>
            </div>

            {/* Photo Selection */}
            <div className="space-y-3 pt-1">
              <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wide block">Alterar Foto de Perfil</label>
              
              <div className="flex flex-wrap items-center gap-3">
                {PRESET_AVATARS.map(avatar => {
                  const isSelected = selectedPhoto === avatar.url;
                  return (
                    <button
                      key={avatar.id}
                      type="button"
                      onClick={() => setSelectedPhoto(avatar.url)}
                      className={`relative w-12 h-12 rounded-xl overflow-hidden cursor-pointer transition-all border-2 shrink-0 shadow-sm hover:scale-105 active:scale-95 ${
                        isSelected ? 'border-indigo-600 scale-[1.02]' : 'border-slate-100 hover:border-slate-300'
                      }`}
                    >
                      <img 
                        src={avatar.url} 
                        alt={avatar.label} 
                        className="w-full h-full object-cover" 
                        referrerPolicy="no-referrer"
                      />
                      {isSelected && (
                        <div className="absolute inset-0 bg-indigo-600/35 flex items-center justify-center">
                          <Check size={14} className="text-white stroke-[4.5]" />
                        </div>
                      )}
                    </button>
                  );
                })}

                {/* Alternative text-based photo url input */}
                <div className="flex-grow min-w-[200px] space-y-1">
                  <span className="text-[9px] text-slate-400 font-semibold block">Ou use uma URL de imagem personalizada:</span>
                  <input 
                    type="url"
                    placeholder="https://exemplo.com/suafoto.jpg"
                    value={selectedPhoto}
                    onChange={e => setSelectedPhoto(e.target.value)}
                    className="w-full text-[11px] border border-slate-200 rounded-lg px-3 py-1.5 bg-slate-50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-slate-400 font-medium transition-all"
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-3 border-t border-slate-100">
              <button
                type="submit"
                className="px-5 py-3 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl transition-all cursor-pointer shadow-sm flex items-center gap-1.5 hover:shadow"
              >
                Salvar Alterações
              </button>
            </div>
          </form>
        </div>

      </div>

    </div>
  );
}
