import React, { useState } from 'react';
import { Plus, Trash2, MapPin, Calendar, Check, AlertCircle, ChevronLeft, ChevronRight, ArrowRight, X } from 'lucide-react';
import { Subject, Task, CalendarBlock } from '../types';

interface CalendarTabProps {
  subjects: Subject[];
  tasks: Task[];
  setTasks: React.Dispatch<React.SetStateAction<Task[]>>;
  calendarBlocks: CalendarBlock[];
  setCalendarBlocks: React.Dispatch<React.SetStateAction<CalendarBlock[]>>;
  showToast: (msg: string, type?: 'success' | 'warning' | 'error') => void;
}

const HOURS = ['08:00', '09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00', '18:00'];
const DAYS = [
  { id: 'monday', label: 'SEG', dayNum: '16' },
  { id: 'tuesday', label: 'TER', dayNum: '17' },
  { id: 'wednesday', label: 'QUA', dayNum: '18' },
  { id: 'thursday', label: 'QUI', dayNum: '19' },
  { id: 'friday', label: 'SEX', dayNum: '20' },
  { id: 'saturday', label: 'SÁB', dayNum: '21' },
  { id: 'sunday', label: 'DOM', dayNum: '22' }
] as const;

export default function CalendarTab({
  subjects,
  tasks,
  setTasks,
  calendarBlocks,
  setCalendarBlocks,
  showToast
}: CalendarTabProps) {
  // Task input state
  const [taskTitle, setTaskTitle] = useState('');
  const [taskSubject, setTaskSubject] = useState(subjects[0]?.id || '');
  const [taskPriority, setTaskPriority] = useState<'low' | 'medium' | 'high'>('medium');

  // New Block manual form modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalTitle, setModalTitle] = useState('');
  const [modalSubject, setModalSubject] = useState(subjects[0]?.id || '');
  const [modalDay, setModalDay] = useState<'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday'>('monday');
  const [modalStart, setModalStart] = useState('09:00');
  const [modalEnd, setModalEnd] = useState('10:00');

  // Drag over target tracking
  const [dragOverCell, setDragOverCell] = useState<{ dayId: string; hourStr: string } | null>(null);
  const [isClearConfirmOpen, setIsClearConfirmOpen] = useState(false);

  // Toggle Task Completion (crossed out style in screenshot!)
  const handleToggleTask = (id: string) => {
    setTasks(prev => prev.map(t => {
      if (t.id === id) {
        const nextState = !t.completed;
        showToast(nextState ? 'Tarefa marcada como concluída!' : 'Tarefa reativada.', 'success');
        return { ...t, completed: nextState };
      }
      return t;
    }));
  };

  // Add Task
  const handleAddTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!taskTitle.trim()) return;

    const newTask: Task = {
      id: `t-${Date.now()}`,
      title: taskTitle.trim(),
      subjectId: taskSubject,
      priority: taskPriority,
      poms: 1,
      completed: false,
      subtitle: 'Hoje, ' + new Date().toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit' })
    };

    setTasks(prev => [newTask, ...prev]);
    setTaskTitle('');
    showToast('Tarefa criada!');
  };

  // Delete Task
  const handleDeleteTask = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setTasks(prev => prev.filter(t => t.id !== id));
    showToast('Tarefa removida.', 'warning');
  };

  // Add manual study block
  const handleAddBlock = (e: React.FormEvent) => {
    e.preventDefault();
    if (!modalTitle.trim()) return;

    const newBlock: CalendarBlock = {
      id: `cb-${Date.now()}`,
      subjectId: modalSubject,
      title: modalTitle.trim(),
      day: modalDay,
      startTime: modalStart,
      endTime: modalEnd
    };

    setCalendarBlocks(prev => [...prev, newBlock]);
    setIsModalOpen(false);
    setModalTitle('');
    showToast('Bloco adicionado ao cronograma!');
  };

  // Clear all blocks
  const handleClearCalendar = () => {
    setCalendarBlocks([]);
    setIsClearConfirmOpen(false);
    showToast('Cronograma semanal limpo.', 'warning');
  };

  // Delete Block
  const handleDeleteBlock = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setCalendarBlocks(prev => prev.filter(b => b.id !== id));
    showToast('Bloco removido do cronograma.', 'warning');
  };

  // Drag and drop handlers
  const handleDragStart = (e: React.DragEvent, taskId: string) => {
    e.dataTransfer.setData('text/plain', taskId);
  };

  const handleDragOver = (e: React.DragEvent, dayId: string, hourStr: string) => {
    e.preventDefault();
    setDragOverCell({ dayId, hourStr });
  };

  const handleDragLeave = () => {
    setDragOverCell(null);
  };

  const handleDrop = (e: React.DragEvent, dayId: typeof DAYS[number]['id'], hourStr: string) => {
    e.preventDefault();
    setDragOverCell(null);
    const taskId = e.dataTransfer.getData('text/plain');
    if (!taskId) return;

    const task = tasks.find(t => t.id === taskId);
    if (task) {
      // Create new study block starting at this hour
      const hourNum = parseInt(hourStr.split(':')[0]);
      const nextHourStr = String(hourNum + 1).padStart(2, '0') + ':00';

      const newBlock: CalendarBlock = {
        id: `cb-${Date.now()}`,
        subjectId: task.subjectId,
        title: task.title,
        day: dayId,
        startTime: hourStr,
        endTime: nextHourStr
      };

      setCalendarBlocks(prev => [...prev, newBlock]);
      // Remove task or mark completed? Let's mark it as completed so the user still sees it!
      setTasks(prev => prev.map(t => t.id === taskId ? { ...t, completed: true } : t));
      showToast(`Alocado no cronograma: ${task.title}`);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Grid de layout principal com Bento Grid e Paleta Pastel */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
        
        {/* Coluna Esquerda: Tarefas Pendentes */}
        <div className="lg:col-span-1 bg-white border border-slate-100 rounded-2xl p-5 shadow-soft space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-extrabold text-slate-900 text-sm tracking-tight">Tarefas Pendentes</h3>
            
            {/* Botão circular elegante para abrir formulário */}
            <button 
              onClick={() => setIsModalOpen(true)}
              className="w-6 h-6 rounded-full bg-indigo-50 border border-indigo-100 hover:bg-indigo-100 text-indigo-600 flex items-center justify-center transition-all cursor-pointer shadow-sm"
              title="Criar tarefa ou bloco"
            >
              <Plus size={12} className="stroke-[2.5]" />
            </button>
          </div>

          {/* Mini formulário de adicionar tarefa rápida */}
          <form onSubmit={handleAddTask} className="flex gap-2">
            <input 
              type="text" 
              placeholder="Adicionar tarefa rápida..."
              value={taskTitle}
              onChange={e => setTaskTitle(e.target.value)}
              className="flex-grow text-xs border border-slate-200 rounded-xl px-3 py-2 bg-slate-50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-slate-400 transition-all font-medium"
            />
            <button 
              type="submit" 
              className="px-3 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-xl transition-all cursor-pointer shadow-sm"
            >
              Ok
            </button>
          </form>

          {/* Listagem de Tarefas com Checkbox do Stitch */}
          <div className="space-y-2 max-h-[360px] overflow-y-auto pr-1">
            {tasks.map(t => {
              const subject = subjects.find(s => s.id === t.subjectId) || { name: 'Geral', hexText: '#4f46e5' };
              
              return (
                <div 
                  key={t.id}
                  draggable
                  onDragStart={(e) => handleDragStart(e, t.id)}
                  onClick={() => handleToggleTask(t.id)}
                  className={`group flex items-center gap-3 p-3 rounded-2xl border transition-all cursor-pointer ${
                    t.completed 
                      ? 'bg-slate-50/70 border-slate-100' 
                      : 'bg-white border-slate-200/50 hover:border-slate-300 hover:shadow-sm'
                  }`}
                >
                  {/* Checkbox custom */}
                  <div className={`w-5 h-5 rounded-lg border flex items-center justify-center transition-all shrink-0 ${
                    t.completed 
                      ? 'bg-indigo-600 border-indigo-600 text-white' 
                      : 'border-slate-300 bg-white group-hover:border-indigo-400'
                  }`}>
                    {t.completed && <Check size={11} className="stroke-[3]" />}
                  </div>

                  {/* Detalhes da tarefa */}
                  <div className="flex-grow min-w-0">
                    <p className={`text-xs font-bold leading-tight truncate ${
                      t.completed ? 'text-slate-400 line-through' : 'text-slate-800'
                    }`}>
                      {t.title}
                    </p>
                    {t.subtitle && (
                      <p className="text-[10px] text-slate-400 font-medium mt-0.5">
                        {t.subtitle}
                      </p>
                    )}
                  </div>

                  {/* Delete button on hover */}
                  <button 
                    onClick={(e) => handleDeleteTask(t.id, e)}
                    className="opacity-0 group-hover:opacity-100 text-slate-300 hover:text-rose-500 transition-opacity p-0.5 cursor-pointer shrink-0"
                    title="Excluir tarefa"
                  >
                    <Trash2 size={11} />
                  </button>
                </div>
              );
            })}
          </div>

          {/* Ver todas as tarefas button */}
          <button 
            onClick={() => showToast('Funcionalidade de Gestão Expandida de Tarefas ativada!')}
            className="w-full py-2.5 text-center text-[10px] font-extrabold tracking-wider text-indigo-600 hover:text-indigo-700 bg-indigo-50/50 hover:bg-indigo-50 rounded-xl transition-all uppercase cursor-pointer"
          >
            Ver todas as tarefas
          </button>
        </div>

        {/* Coluna Direita (Cronograma Semanal) */}
        <div className="lg:col-span-3 bg-white border border-slate-100 rounded-2xl p-5 shadow-soft space-y-4">
          
          {/* Header do Cronograma */}
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h3 className="font-extrabold text-slate-900 text-sm tracking-tight">Cronograma Semanal</h3>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-0.5">Outubro 16 - 22, 2023</p>
            </div>
            
            {/* Arrow buttons & Clear button */}
            <div className="flex items-center gap-2">
              <button 
                onClick={() => setIsClearConfirmOpen(true)}
                className="px-3 py-1.5 border border-slate-200 text-slate-500 hover:bg-slate-50 text-[10px] font-bold rounded-lg transition-colors cursor-pointer"
                title="Limpar Cronograma"
              >
                Limpar
              </button>
              <div className="flex items-center border border-slate-200 rounded-lg overflow-hidden bg-slate-50 shadow-sm">
                <button className="p-1.5 hover:bg-slate-100 text-slate-600 transition-colors cursor-pointer border-r border-slate-200">
                  <ChevronLeft size={12} />
                </button>
                <button className="p-1.5 hover:bg-slate-100 text-slate-600 transition-colors cursor-pointer">
                  <ChevronRight size={12} />
                </button>
              </div>
            </div>
          </div>

          {/* Grelha de Calendário */}
          <div className="overflow-x-auto">
            <div className="min-w-[700px] grid grid-cols-[60px_repeat(7,_1fr)] gap-2">
              
              {/* Empty Top-Left Cell */}
              <div></div>

              {/* Day Headers */}
              {DAYS.map(day => (
                <div key={day.id} className="text-center py-2 bg-slate-50/60 rounded-xl border border-slate-100/50">
                  <p className="text-[9px] font-extrabold text-slate-400 uppercase tracking-widest">{day.label}</p>
                  <p className="text-sm font-black text-slate-800 mt-0.5">{day.dayNum}</p>
                </div>
              ))}

              {/* Hourly Rows with grid cells */}
              {HOURS.filter((_, idx) => idx % 2 === 0).map(hour => {
                const hourNum = parseInt(hour.split(':')[0]);

                return (
                  <React.Fragment key={hour}>
                    {/* Hour Column Label */}
                    <div className="text-[10px] font-bold text-slate-400 flex items-center justify-center select-none bg-slate-50/40 rounded-lg">
                      {hour}
                    </div>

                    {/* Day Cells for this specific hour */}
                    {DAYS.map(day => {
                      // Find blocks that fall into this hour slot
                      const activeBlocks = calendarBlocks.filter(b => {
                        const blockStartHour = parseInt(b.startTime.split(':')[0]);
                        return b.day === day.id && blockStartHour === hourNum;
                      });

                      const isHighlighted = dragOverCell?.dayId === day.id && dragOverCell?.hourStr === hour;

                      return (
                        <div
                          key={day.id}
                          onDragOver={(e) => handleDragOver(e, day.id, hour)}
                          onDragLeave={handleDragLeave}
                          onDrop={(e) => handleDrop(e, day.id, hour)}
                          className={`min-h-[72px] rounded-xl border p-1.5 transition-all flex flex-col justify-center items-stretch gap-1 relative ${
                            isHighlighted 
                              ? 'bg-indigo-50/80 border-indigo-400 border-2 scale-[1.01] shadow-sm'
                              : 'bg-slate-50/20 border-slate-100/70 hover:bg-slate-50/50 hover:border-slate-200'
                          }`}
                        >
                          {activeBlocks.map(block => {
                            const subject = subjects.find(s => s.id === block.subjectId) || {
                              hexBg: '#f3e8ff',
                              hexBorder: '#c084fc',
                              hexText: '#7e22ce'
                            };

                            // Styling for Focus Session dashed border as shown in screenshot
                            const isDashed = block.title.toLowerCase().includes('focus') || block.title.toLowerCase().includes('sessão');

                            return (
                              <div
                                key={block.id}
                                style={{
                                  backgroundColor: subject.hexBg,
                                  borderColor: subject.hexBorder,
                                  color: subject.hexText
                                }}
                                className={`border rounded-xl p-2 text-[10px] font-bold leading-normal flex flex-col justify-between shadow-sm hover:shadow relative group transition-all ${
                                  isDashed ? 'border-dashed border-2' : 'border-solid'
                                }`}
                              >
                                <div className="flex items-start justify-between gap-1">
                                  <span className="font-extrabold truncate pr-1 text-[9px] uppercase tracking-wide">
                                    {block.title}
                                  </span>
                                  <button 
                                    onClick={(e) => handleDeleteBlock(block.id, e)}
                                    className="text-slate-400 hover:text-rose-600 opacity-0 group-hover:opacity-100 transition-opacity p-0.5 cursor-pointer"
                                    title="Excluir bloco"
                                  >
                                    <Trash2 size={9} />
                                  </button>
                                </div>
                                <span className="text-[8px] opacity-75 mt-1 select-none">
                                  {block.startTime} - {block.endTime}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      );
                    })}
                  </React.Fragment>
                );
              })}

            </div>
          </div>
          
        </div>

      </div>

      {/* Bottom Row Bento Layout: Próximos Eventos & Progresso Semanal */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Próximos Eventos */}
        <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-soft space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2">
            <h4 className="font-extrabold text-slate-900 text-sm tracking-tight">Próximos Eventos</h4>
            <span className="text-[9px] font-extrabold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-md uppercase tracking-wider">Brevemente</span>
          </div>

          <div className="space-y-3">
            {/* Event 1 */}
            <div 
              onClick={() => showToast('Detalhes do Exame de História')}
              className="group flex items-center justify-between p-3.5 bg-slate-50/50 hover:bg-slate-50 border border-slate-200/40 hover:border-slate-300 rounded-2xl transition-all cursor-pointer"
            >
              <div className="flex items-center gap-3.5">
                {/* Custom Date badge */}
                <div className="bg-[#fff1f2] border border-[#fecdd3] text-[#e11d48] w-12 h-12 rounded-xl flex flex-col items-center justify-center select-none shadow-sm shrink-0">
                  <span className="text-[8px] font-black uppercase tracking-wider leading-none">OUT</span>
                  <span className="text-base font-extrabold leading-none mt-1">22</span>
                </div>
                <div>
                  <h5 className="text-xs font-extrabold text-slate-800 group-hover:text-slate-950 transition-colors">Exame de História</h5>
                  <p className="text-[10px] text-slate-400 font-medium mt-0.5">Em 3 dias • Bloco 8/12</p>
                </div>
              </div>
              <ArrowRight size={14} className="text-slate-300 group-hover:text-slate-650 group-hover:translate-x-1 transition-all" />
            </div>

            {/* Event 2 */}
            <div 
              onClick={() => showToast('Detalhes do Projeto Biologia')}
              className="group flex items-center justify-between p-3.5 bg-slate-50/50 hover:bg-slate-50 border border-slate-200/40 hover:border-slate-300 rounded-2xl transition-all cursor-pointer"
            >
              <div className="flex items-center gap-3.5">
                {/* Custom Date badge */}
                <div className="bg-[#f3e8ff] border border-[#e9d5ff] text-[#7e22ce] w-12 h-12 rounded-xl flex flex-col items-center justify-center select-none shadow-sm shrink-0">
                  <span className="text-[8px] font-black uppercase tracking-wider leading-none">OUT</span>
                  <span className="text-base font-extrabold leading-none mt-1">25</span>
                </div>
                <div>
                  <h5 className="text-xs font-extrabold text-slate-800 group-hover:text-slate-950 transition-colors">Entrega de Projeto</h5>
                  <p className="text-[10px] text-slate-400 font-medium mt-0.5">Em 6 dias • Online</p>
                </div>
              </div>
              <ArrowRight size={14} className="text-slate-300 group-hover:text-slate-650 group-hover:translate-x-1 transition-all" />
            </div>
          </div>
        </div>

        {/* Progresso Semanal */}
        <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-soft space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2">
            <h4 className="font-extrabold text-slate-900 text-sm tracking-tight">Progresso Semanal</h4>
            <span className="text-[10px] text-emerald-600 font-bold bg-emerald-50 px-2 py-0.5 rounded-md uppercase tracking-wider">Ativo</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            {/* Left part: Progress bars */}
            <div className="space-y-3.5">
              {/* Stat 1 */}
              <div className="space-y-1">
                <div className="flex justify-between text-[10px] font-bold">
                  <span className="text-slate-500">Horas de Estudo Focado</span>
                  <span className="text-slate-800 font-extrabold">12 / 20h</span>
                </div>
                <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden border border-slate-200/10">
                  <div className="h-full bg-violet-600 rounded-full" style={{ width: '60%' }}></div>
                </div>
              </div>

              {/* Stat 2 */}
              <div className="space-y-1">
                <div className="flex justify-between text-[10px] font-bold">
                  <span className="text-slate-500">Tarefas Completadas</span>
                  <span className="text-slate-800 font-extrabold">8 / 12</span>
                </div>
                <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden border border-slate-200/10">
                  <div className="h-full bg-emerald-500 rounded-full" style={{ width: '66.6%' }}></div>
                </div>
              </div>
            </div>

            {/* Right part: Two gorgeous mini statistic cards as in Stitch */}
            <div className="grid grid-cols-2 gap-2">
              <div className="bg-[#f5f3ff] border border-[#ddd6fe] rounded-2xl p-3 text-center flex flex-col justify-center shadow-inner-soft">
                <p className="text-[9px] text-violet-500 font-black uppercase tracking-wider">Sequência</p>
                <p className="text-sm font-black text-violet-950 mt-1 leading-none">5 Dias</p>
              </div>
              <div className="bg-[#eff6ff] border border-[#bfdbfe] rounded-2xl p-3 text-center flex flex-col justify-center shadow-inner-soft">
                <p className="text-[9px] text-blue-500 font-black uppercase tracking-wider">Foco Médio</p>
                <p className="text-sm font-black text-blue-950 mt-1 leading-none">42m</p>
              </div>
            </div>

          </div>
        </div>

      </div>

      {/* Manual block creation modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className="bg-white border border-slate-100 rounded-2xl w-full max-w-sm p-6 shadow-xl mx-4 transform transition-all duration-300">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3 mb-4">
              <h4 className="font-extrabold text-slate-900 text-xs uppercase tracking-wider">Novo Bloco de Estudo</h4>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 cursor-pointer text-xs font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAddBlock} className="space-y-4">
              <div className="space-y-1">
                <label className="text-[9px] font-extrabold text-slate-400 uppercase tracking-wide">Título / Atividade</label>
                <input 
                  type="text" 
                  placeholder="Ex: Estudo Álgebra, Sessão Focus" 
                  required 
                  value={modalTitle}
                  onChange={e => setModalTitle(e.target.value)}
                  className="w-full text-xs border border-slate-200 rounded-xl px-3.5 py-2.5 bg-slate-50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-slate-400 font-semibold"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[9px] font-extrabold text-slate-400 uppercase tracking-wide">Disciplina associada</label>
                <select 
                  value={modalSubject}
                  onChange={e => setModalSubject(e.target.value)}
                  className="w-full text-xs border border-slate-200 rounded-xl px-3.5 py-2.5 bg-slate-50 focus:bg-white focus:outline-none font-semibold cursor-pointer"
                >
                  {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[9px] font-extrabold text-slate-400 uppercase tracking-wide">Dia da Semana</label>
                  <select 
                    value={modalDay}
                    onChange={e => setModalDay(e.target.value as any)}
                    className="w-full text-xs border border-slate-200 rounded-xl px-3 py-2.5 bg-slate-50 focus:bg-white focus:outline-none font-semibold"
                  >
                    <option value="monday">Segunda-feira</option>
                    <option value="tuesday">Terça-feira</option>
                    <option value="wednesday">Quarta-feira</option>
                    <option value="thursday">Quinta-feira</option>
                    <option value="friday">Sexta-feira</option>
                    <option value="saturday">Sábado</option>
                    <option value="sunday">Domingo</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] font-extrabold text-slate-400 uppercase tracking-wide">Início</label>
                  <select 
                    value={modalStart}
                    onChange={e => setModalStart(e.target.value)}
                    className="w-full text-xs border border-slate-200 rounded-xl px-3 py-2.5 bg-slate-50 focus:bg-white focus:outline-none font-semibold"
                  >
                    {HOURS.map(h => <option key={h} value={h}>{h}</option>)}
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-2.5 pt-3.5 border-t border-slate-100">
                <button 
                  type="button" 
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 text-slate-600 hover:bg-slate-50 text-[10px] font-bold rounded-xl transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button 
                  type="submit" 
                  className="px-4.5 py-2 bg-slate-900 hover:bg-slate-800 text-white text-[10px] font-bold rounded-xl transition-all shadow-sm cursor-pointer"
                >
                  Confirmar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Clear Confirmation Modal */}
      {isClearConfirmOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
          <div className="bg-white border border-slate-100 rounded-2xl w-full max-w-sm p-6 shadow-xl transform transition-all duration-300">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3 mb-4">
              <h4 className="font-extrabold text-slate-900 text-sm tracking-tight">Limpar Cronograma</h4>
              <button 
                onClick={() => setIsClearConfirmOpen(false)}
                className="text-slate-400 hover:text-slate-600 transition-colors p-1 rounded-lg"
              >
                <X size={16} />
              </button>
            </div>
            
            <p className="text-xs text-slate-500 font-medium leading-relaxed mb-6">
              Pretende limpar todos os blocos de estudo do seu cronograma semanal? Esta ação não pode ser desfeita.
            </p>
            
            <div className="flex justify-end gap-2.5 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setIsClearConfirmOpen(false)}
                className="px-4 py-2 border border-slate-200 text-slate-600 hover:bg-slate-50 text-[10px] font-bold rounded-xl transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleClearCalendar}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-[10px] font-bold rounded-xl transition-colors cursor-pointer shadow-sm"
              >
                Confirmar
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
