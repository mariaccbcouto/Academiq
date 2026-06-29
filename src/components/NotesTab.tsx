import React, { useState } from 'react';
import { Plus, Folder, FileText, Trash2, Save, Sparkles, X, Info } from 'lucide-react';
import { Subject, Note } from '../types';

interface NotesTabProps {
  subjects: Subject[];
  notes: Note[];
  setNotes: React.Dispatch<React.SetStateAction<Note[]>>;
  showToast: (msg: string, type?: 'success' | 'warning' | 'error') => void;
}

export default function NotesTab({
  subjects,
  notes,
  setNotes,
  showToast
}: NotesTabProps) {
  const [activeNoteId, setActiveNoteId] = useState<string | null>(
    notes.length > 0 ? notes[0].id : null
  );
  const [activeSubjectId, setActiveSubjectId] = useState<string | null>(
    subjects[0]?.id || null
  );
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);

  // Active note lookup
  const activeNote = notes.find(n => n.id === activeNoteId) || null;

  // Add new note
  const handleCreateNote = () => {
    const subId = activeSubjectId || (subjects.length > 0 ? subjects[0].id : 'geral');
    const newNote: Note = {
      id: `n-${Date.now()}`,
      subjectId: subId,
      title: '',
      body: '',
      date: new Date().toISOString().split('T')[0],
      aiSummary: undefined
    };

    setNotes(prev => [...prev, newNote]);
    setActiveNoteId(newNote.id);
    setActiveSubjectId(subId);
    showToast('Nova anotação criada!');
  };

  // Delete note
  const handleDeleteNote = () => {
    if (!activeNoteId) return;
    setNotes(prev => prev.filter(n => n.id !== activeNoteId));
    setActiveNoteId(null);
    setIsDeleteConfirmOpen(false);
    showToast('Anotação eliminada.', 'warning');
  };

  // Edit fields
  const handleTitleChange = (val: string) => {
    if (!activeNoteId) return;
    setNotes(prev => prev.map(n => {
      if (n.id === activeNoteId) {
        return { ...n, title: val };
      }
      return n;
    }));
  };

  const handleBodyChange = (val: string) => {
    if (!activeNoteId) return;
    setNotes(prev => prev.map(n => {
      if (n.id === activeNoteId) {
        return { ...n, body: val };
      }
      return n;
    }));
  };

  // Save current note explicitly
  const handleSaveNote = () => {
    showToast('Anotação guardada com sucesso!');
  };

  // Generate Real AI Summary via Gemini API
  const handleAiSummarize = async () => {
    if (!activeNote) return;
    if (!activeNote.body.trim()) {
      showToast('Escreve algum conteúdo antes de pedir um resumo!', 'error');
      return;
    }

    setIsAiLoading(true);

    try {
      const response = await fetch('/api/gemini/summarize-note', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          title: activeNote.title,
          body: activeNote.body
        })
      });

      if (!response.ok) {
        throw new Error('Falha ao gerar o resumo com o Gemini');
      }

      const data = await response.json();
      
      if (data.summary) {
        setNotes(prev => prev.map(n => {
          if (n.id === activeNoteId) {
            return { ...n, aiSummary: data.summary };
          }
          return n;
        }));
        showToast('Resumo gerado com sucesso via Gemini!', 'success');
      } else {
        throw new Error('Resposta inválida do servidor Gemini');
      }
    } catch (err: any) {
      console.error('Error generating summary with Gemini:', err);
      showToast(err.message || 'Erro ao comunicar com o servidor de IA.', 'error');
    } finally {
      setIsAiLoading(false);
    }
  };

  // Clear/remove summary
  const handleRemoveSummary = () => {
    if (!activeNoteId) return;
    setNotes(prev => prev.map(n => {
      if (n.id === activeNoteId) {
        return { ...n, aiSummary: undefined };
      }
      return n;
    }));
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-xl font-extrabold text-slate-900 font-sans">Caderno Digital</h3>
        <p className="text-sm text-slate-500">Escreve apontamentos organizados por disciplina e clica no botão IA para resumos inteligentes.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 items-stretch">
        
        {/* Pastas / Disciplinas (Barra Lateral Esquerda) */}
        <div className="lg:col-span-1 bg-white border border-slate-100 rounded-2xl p-5 shadow-soft flex flex-col gap-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h4 className="font-bold text-slate-800 text-xs uppercase tracking-wider">Cadernos</h4>
            <button 
              onClick={handleCreateNote}
              className="w-8 h-8 rounded-lg bg-slate-50 border border-slate-200 hover:bg-slate-100 text-slate-700 flex items-center justify-center transition-colors cursor-pointer" 
              title="Nova Anotação"
            >
              <Plus size={15} />
            </button>
          </div>
          
          <div className="space-y-4 overflow-y-auto flex-grow max-h-[350px] lg:max-h-none pr-1">
            {subjects.map(subject => {
              const subNotes = notes.filter(n => n.subjectId === subject.id);
              const isActiveFolder = activeSubjectId === subject.id;

              return (
                <div key={subject.id} className="space-y-1.5 border border-slate-100/70 rounded-xl p-2.5 bg-slate-50/20">
                  {/* Folder Header */}
                  <div 
                    onClick={() => {
                      setActiveSubjectId(subject.id);
                      // Auto load first note of this folder if exists
                      if (subNotes.length > 0) {
                        setActiveNoteId(subNotes[0].id);
                      }
                    }}
                    className={`flex items-center justify-between p-2 rounded-lg border cursor-pointer transition-colors ${
                      isActiveFolder 
                        ? 'bg-slate-100/80 border-slate-300' 
                        : 'border-transparent hover:bg-slate-100/50'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <Folder size={14} className={isActiveFolder ? 'text-slate-700 fill-slate-200' : 'text-slate-400'} />
                      <span className="font-bold text-slate-700 text-[10px] uppercase tracking-wider">
                        {subject.name}
                      </span>
                    </div>
                    <span className="text-[9px] font-bold bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full">
                      {subNotes.length}
                    </span>
                  </div>

                  {/* Folder Notes list */}
                  <div className="pl-2.5 border-l border-slate-100 space-y-1 mt-1.5">
                    {subNotes.length === 0 ? (
                      <div className="text-[9px] text-slate-400 italic py-1 pl-1">Sem notas.</div>
                    ) : (
                      subNotes.map(note => {
                        const isActiveNote = activeNoteId === note.id;
                        return (
                          <div 
                            key={note.id}
                            onClick={() => {
                              setActiveNoteId(note.id);
                              setActiveSubjectId(subject.id);
                            }}
                            className={`flex items-center justify-between p-2 rounded-lg border text-[10px] transition-all cursor-pointer ${
                              isActiveNote 
                                ? 'bg-white border-slate-200 shadow-sm font-semibold' 
                                : 'border-transparent text-slate-500 hover:bg-slate-50 hover:text-slate-800'
                            }`}
                          >
                            <span className="truncate max-w-[120px]">{note.title || 'Nota sem título'}</span>
                            <span className="text-[8px] text-slate-400 font-medium shrink-0 ml-1">
                              {note.date.substring(5)}
                            </span>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Bloco do Editor (Lado Direito) */}
        <div className="lg:col-span-3 bg-white border border-slate-100 rounded-2xl p-6 shadow-soft flex flex-col min-h-[520px]">
          {activeNote ? (
            <div className="flex flex-col flex-grow gap-4">
              
              {/* Barra Superior do Editor */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
                <div className="flex-grow space-y-2">
                  <input 
                    type="text" 
                    placeholder="Nota sem título" 
                    value={activeNote.title}
                    onChange={e => handleTitleChange(e.target.value)}
                    className="w-full text-xl font-extrabold text-slate-900 border-none outline-none focus:ring-0 p-0 placeholder-slate-300 bg-transparent"
                  />
                  
                  <div className="flex items-center gap-2">
                    <span className="text-[9px] font-extrabold px-3 py-1 rounded-full bg-slate-100 text-slate-600 border border-slate-200 uppercase tracking-wider">
                      {subjects.find(s => s.id === activeNote.subjectId)?.name || 'Geral'}
                    </span>
                    <span className="text-[10px] text-slate-400 font-semibold">
                      Criada em: {activeNote.date}
                    </span>
                  </div>
                </div>
                
                {/* Ações */}
                <div className="flex gap-2 shrink-0">
                  <button 
                    onClick={handleAiSummarize}
                    className="px-4 py-2 bg-gradient-to-tr from-slate-900 to-slate-800 hover:from-slate-850 hover:to-slate-750 text-white text-xs font-bold rounded-xl transition-all shadow-sm flex items-center gap-1.5 cursor-pointer"
                  >
                    <Sparkles size={12} className="text-amber-300 fill-amber-300 animate-pulse" />
                    Resumir IA
                  </button>
                  <button 
                    onClick={handleSaveNote}
                    className="px-4 py-2 border border-slate-200 text-slate-600 hover:bg-slate-50 text-xs font-bold rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer"
                  >
                    <Save size={12} />
                    Salvar
                  </button>
                  <button 
                    onClick={() => setIsDeleteConfirmOpen(true)}
                    className="p-2 border border-rose-100 text-rose-600 hover:bg-rose-50 rounded-xl transition-colors cursor-pointer" 
                    title="Apagar Nota"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>

              {/* Loader IA */}
              {isAiLoading && (
                <div className="bg-blue-50/40 border border-blue-100 rounded-xl p-6 text-center flex flex-col items-center justify-center py-8">
                  <div className="w-8 h-8 rounded-full border-2 border-slate-200 border-t-blue-500 animate-spin mb-3"></div>
                  <h5 className="text-xs font-bold text-slate-800 flex items-center gap-1">
                    <Sparkles size={12} className="text-blue-500 animate-pulse" /> Gemini 1.5 Flash a analisar...
                  </h5>
                  <p className="text-[10px] text-slate-400 mt-0.5">Sintetizando os teus apontamentos de aula.</p>
                </div>
              )}

              {/* Bloco de Resumo IA */}
              {activeNote.aiSummary && !isAiLoading && (
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 space-y-3 relative">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 text-blue-600">
                      <Sparkles size={12} className="fill-blue-100" />
                      <h5 className="text-[9px] font-extrabold uppercase tracking-wider text-slate-700">
                        Resumo IA (Gemini 1.5 Flash)
                      </h5>
                    </div>
                    <button 
                      onClick={handleRemoveSummary}
                      className="text-slate-400 hover:text-slate-600 text-xs cursor-pointer p-0.5" 
                      title="Ocultar Resumo"
                    >
                      <X size={13} />
                    </button>
                  </div>
                  
                  {/* Structured AI response rendering */}
                  <div 
                    className="markdown-summary"
                    dangerouslySetInnerHTML={{ __html: activeNote.aiSummary }}
                  ></div>
                </div>
              )}

              {/* Editor Textarea */}
              <div className="flex-grow flex flex-col mt-2">
                <textarea 
                  value={activeNote.body}
                  onChange={e => handleBodyChange(e.target.value)}
                  placeholder="Começa a escrever as tuas anotações de aula, fórmulas ou apontamentos aqui..."
                  className="w-full flex-grow text-sm border-none outline-none focus:ring-0 p-0 text-slate-600 leading-relaxed resize-none min-h-[300px] bg-transparent"
                />
              </div>

            </div>
          ) : (
            /* Empty State */
            <div className="flex-grow flex flex-col items-center justify-center text-center p-10 my-auto">
              <div className="w-14 h-14 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-350 mb-3 shadow-sm">
                <FileText size={22} className="text-slate-400" />
              </div>
              <h4 className="font-bold text-slate-700 text-xs">Sem nota selecionada</h4>
              <p className="text-[11px] text-slate-450 mt-1 max-w-xs mx-auto">
                Seleciona um apontamento na barra lateral ou cria uma nova nota clicando no botão "+" no painel de Cadernos.
              </p>
              <button 
                onClick={handleCreateNote}
                className="mt-4 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl transition-all shadow-sm flex items-center gap-1 cursor-pointer mx-auto"
              >
                <Plus size={13} /> Nova Nota
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {isDeleteConfirmOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
          <div className="bg-white border border-slate-100 rounded-2xl w-full max-w-sm p-6 shadow-xl transform transition-all duration-300">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3 mb-4">
              <h4 className="font-extrabold text-slate-900 text-sm tracking-tight">Eliminar Apontamento</h4>
              <button 
                onClick={() => setIsDeleteConfirmOpen(false)}
                className="text-slate-400 hover:text-slate-600 transition-colors p-1 rounded-lg"
              >
                <X size={16} />
              </button>
            </div>
            
            <p className="text-xs text-slate-500 font-medium leading-relaxed mb-6">
              Tens a certeza de que desejas eliminar este apontamento permanentemente? Esta ação não pode ser desfeita.
            </p>
            
            <div className="flex justify-end gap-2.5 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setIsDeleteConfirmOpen(false)}
                className="px-4 py-2 border border-slate-200 text-slate-600 hover:bg-slate-50 text-[10px] font-bold rounded-xl transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleDeleteNote}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-[10px] font-bold rounded-xl transition-colors cursor-pointer shadow-sm"
              >
                Eliminar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
