import React, { useState, useRef } from 'react';
import { Upload, Info, Check, Trash2, Plus, Sparkles } from 'lucide-react';
import { Subject, CalendarBlock, TabType } from '../types';

interface UploadTabProps {
  subjects: Subject[];
  setCalendarBlocks: React.Dispatch<React.SetStateAction<CalendarBlock[]>>;
  navigate: (tab: TabType) => void;
  showToast: (msg: string, type?: 'success' | 'warning' | 'error') => void;
}

interface ExtractedClass {
  subjectId: string;
  day: 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday';
  startTime: string;
  endTime: string;
  room: string;
}

const DAYS_OPTIONS = [
  { id: 'monday', label: 'Segunda-feira' },
  { id: 'tuesday', label: 'Terça-feira' },
  { id: 'wednesday', label: 'Quarta-feira' },
  { id: 'thursday', label: 'Quinta-feira' },
  { id: 'friday', label: 'Sexta-feira' },
  { id: 'saturday', label: 'Sábado' },
  { id: 'sunday', label: 'Domingo' }
] as const;

export default function UploadTab({
  subjects,
  setCalendarBlocks,
  navigate,
  showToast
}: UploadTabProps) {
  const [extractedClasses, setExtractedClasses] = useState<ExtractedClass[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Handle Drag Over
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  // Handle Drop
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  // Handle File Input Select
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  };

  const onButtonClick = () => {
    fileInputRef.current?.click();
  };

  // Real Gemini extraction via backend API
  const processFile = (file: File) => {
    setIsAnalyzing(true);
    setExtractedClasses([]);

    const reader = new FileReader();
    reader.onload = async () => {
      try {
        const base64String = (reader.result as string).split(',')[1];
        
        const response = await fetch('/api/gemini/process-schedule', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            fileData: base64String,
            mimeType: file.type || 'image/jpeg',
            fileName: file.name
          })
        });

        if (!response.ok) {
          throw new Error('Erro ao processar o horário com o Gemini');
        }

        const data = await response.json();
        
        if (data.classes && Array.isArray(data.classes)) {
          setExtractedClasses(data.classes);
          if (data.warning) {
            showToast(data.warning, 'warning');
          } else {
            showToast('Aulas extraídas com sucesso através do Gemini!', 'success');
          }
        } else {
          throw new Error('Formato de resposta inválido do Gemini');
        }
      } catch (err: any) {
        console.error('Error analyzing file with Gemini:', err);
        showToast(err.message || 'Erro de comunicação com o servidor.', 'error');
      } finally {
        setIsAnalyzing(false);
      }
    };

    reader.onerror = () => {
      showToast('Erro ao ler o ficheiro local.', 'error');
      setIsAnalyzing(false);
    };

    reader.readAsDataURL(file);
  };

  // Add Empty Row
  const insertEmptyRow = () => {
    const firstSubjectId = subjects[0]?.id || 'geral';
    setExtractedClasses(prev => [
      ...prev,
      { subjectId: firstSubjectId, day: 'monday', startTime: '10:00', endTime: '11:00', room: 'Sala 102' }
    ]);
  };

  // Delete Row
  const handleDeleteRow = (index: number) => {
    setExtractedClasses(prev => prev.filter((_, idx) => idx !== index));
    showToast('Aula removida da revisão.', 'warning');
  };

  // Handle field edits
  const handleFieldChange = (index: number, field: keyof ExtractedClass, value: string) => {
    setExtractedClasses(prev => prev.map((item, idx) => {
      if (idx === index) {
        return { ...item, [field]: value };
      }
      return item;
    }));
  };

  // Integrate reviewed classes into main calendar blocks
  const handleIntegrateIntoCalendar = () => {
    if (extractedClasses.length === 0) return;

    const newBlocks: CalendarBlock[] = extractedClasses.map(item => {
      const subject = subjects.find(s => s.id === item.subjectId);
      return {
        id: `cb-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        subjectId: item.subjectId,
        title: subject ? `${subject.name} - Aula` : 'Aula Extraída',
        day: item.day,
        startTime: item.startTime,
        endTime: item.endTime,
        room: item.room || undefined
      };
    });

    setCalendarBlocks(prev => [...prev, ...newBlocks]);
    setExtractedClasses([]);
    showToast('Aulas guardadas com sucesso no planeamento!');
    navigate('dashboard');
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-xl font-extrabold text-slate-900">Importação de Horário</h3>
        <p className="text-sm text-slate-500">Mapeia instantaneamente as tuas aulas arrastando um ficheiro de horário. O Gemini 1.5 Flash extrairá os dados.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        
        {/* Área de Upload (Dropzone) */}
        <div className="lg:col-span-1 bg-white border border-slate-100 rounded-2xl p-6 shadow-soft space-y-4">
          <div 
            onDragEnter={handleDrag}
            onDragOver={handleDrag}
            onDragLeave={handleDrag}
            onDrop={handleDrop}
            onClick={onButtonClick}
            className={`border border-dashed rounded-xl p-10 flex flex-col items-center justify-center text-center cursor-pointer transition-all ${
              dragActive 
                ? 'border-blue-500 bg-blue-50' 
                : 'border-slate-200 hover:border-slate-400 bg-slate-50 hover:bg-slate-100/50'
            }`}
          >
            <div className="w-14 h-14 rounded-full bg-white border border-slate-100 flex items-center justify-center text-slate-600 mb-3 shadow-sm">
              <Upload size={22} className="text-slate-500" />
            </div>
            <h4 className="font-bold text-slate-800 text-xs">Carrega o teu ficheiro</h4>
            <p className="text-[11px] text-slate-400 mt-1 mb-4">Imagem, PDF ou folha Excel</p>
            <input 
              type="file" 
              ref={fileInputRef}
              onChange={handleFileChange}
              className="hidden" 
              accept=".pdf,.png,.jpg,.jpeg,.csv,.xls,.xlsx"
            />
            <span className="text-xs font-bold bg-white border border-slate-200 px-4 py-2 rounded-lg hover:bg-slate-50 transition-colors shadow-sm">
              Escolher Ficheiro
            </span>
          </div>

          {/* Loader de Processamento IA */}
          {isAnalyzing && (
            <div className="flex flex-col items-center justify-center py-8 text-center bg-slate-50 border border-slate-200 rounded-xl">
              <div className="relative w-12 h-12 mb-3">
                <div className="w-12 h-12 rounded-full border-2 border-slate-100 border-t-blue-500 animate-spin"></div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <Sparkles size={14} className="text-blue-500 animate-pulse" />
                </div>
              </div>
              <h5 className="text-xs font-bold text-slate-800">Gemini 1.5 Flash a analisar...</h5>
              <p className="text-[10px] text-slate-400 mt-0.5">A mapear aulas, dias e salas.</p>
            </div>
          )}
          
          <div className="bg-slate-50 border border-slate-200/65 rounded-xl p-4 flex gap-3 text-xs text-slate-650 leading-relaxed shadow-sm">
            <Info size={16} className="text-slate-450 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-slate-800 mb-0.5">Como funciona?</p>
              O processamento do Gemini analisa visualmente o horário para poupar tempo. Podes depois rever e ajustar antes de consolidar.
            </div>
          </div>
        </div>

        {/* Tabela de Confirmação */}
        <div className="lg:col-span-2 bg-white border border-slate-100 rounded-2xl p-6 shadow-soft space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h4 className="font-bold text-slate-800 text-xs uppercase tracking-wider">Revisão de Horário</h4>
            <span className="text-xs font-bold bg-slate-100 text-slate-600 px-3 py-0.5 rounded-full">
              {extractedClasses.length} aulas detetadas
            </span>
          </div>

          <div className="overflow-x-auto border border-slate-100 rounded-xl">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100 text-slate-400 uppercase tracking-wider font-semibold text-[10px]">
                  <th className="px-4 py-3">Disciplina</th>
                  <th className="px-4 py-3">Dia</th>
                  <th className="px-4 py-3">Início</th>
                  <th className="px-4 py-3">Fim</th>
                  <th className="px-4 py-3">Sala</th>
                  <th className="px-4 py-3 text-center">Remover</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {extractedClasses.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-12 text-center text-slate-400 italic">
                      Carrega um ficheiro de horário à esquerda para rever as aulas extraídas automaticamente pela IA do Gemini.
                    </td>
                  </tr>
                ) : (
                  extractedClasses.map((item, idx) => {
                    return (
                      <tr key={idx} className="hover:bg-slate-50/50">
                        <td className="px-4 py-2 bg-white">
                          <select 
                            value={item.subjectId}
                            onChange={e => handleFieldChange(idx, 'subjectId', e.target.value)}
                            className="bg-transparent focus:outline-none w-full border-b border-transparent focus:border-slate-300 font-medium py-1 cursor-pointer"
                          >
                            {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                          </select>
                        </td>
                        <td className="px-4 py-2 bg-white">
                          <select 
                            value={item.day}
                            onChange={e => handleFieldChange(idx, 'day', e.target.value)}
                            className="bg-transparent focus:outline-none w-full border-b border-transparent focus:border-slate-300 font-medium py-1 cursor-pointer"
                          >
                            {DAYS_OPTIONS.map(d => <option key={d.id} value={d.id}>{d.label}</option>)}
                          </select>
                        </td>
                        <td className="px-4 py-2 bg-white">
                          <input 
                            type="time" 
                            value={item.startTime}
                            onChange={e => handleFieldChange(idx, 'startTime', e.target.value)}
                            className="bg-transparent focus:outline-none border-b border-transparent focus:border-slate-300 py-1"
                          />
                        </td>
                        <td className="px-4 py-2 bg-white">
                          <input 
                            type="time" 
                            value={item.endTime}
                            onChange={e => handleFieldChange(idx, 'endTime', e.target.value)}
                            className="bg-transparent focus:outline-none border-b border-transparent focus:border-slate-300 py-1"
                          />
                        </td>
                        <td className="px-4 py-2 bg-white">
                          <input 
                            type="text" 
                            value={item.room}
                            onChange={e => handleFieldChange(idx, 'room', e.target.value)}
                            className="bg-transparent border-b border-transparent focus:border-slate-300 focus:outline-none w-full font-medium py-1"
                            placeholder="Sala..."
                          />
                        </td>
                        <td className="px-4 py-2 text-center bg-white">
                          <button 
                            onClick={() => handleDeleteRow(idx)}
                            className="text-slate-300 hover:text-rose-500 transition-colors p-1 cursor-pointer"
                          >
                            <Trash2 size={13} />
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {extractedClasses.length > 0 && (
            <div className="flex justify-end gap-2.5 pt-2">
              <button 
                onClick={insertEmptyRow}
                className="px-4 py-2 border border-slate-200 text-slate-600 hover:bg-slate-50 text-xs font-bold rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <Plus size={13} /> Inserir Aula
              </button>
              <button 
                onClick={handleIntegrateIntoCalendar}
                className="px-4.5 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-lg transition-all shadow-sm flex items-center gap-1.5 cursor-pointer"
              >
                <Check size={14} />
                Confirmar e Salvar
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
