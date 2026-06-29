import React, { useState } from 'react';
import { Plus, Trash2, Award, Info, Calendar } from 'lucide-react';
import { Subject, Grade } from '../types';

interface GradesTabProps {
  subjects: Subject[];
  grades: Grade[];
  setGrades: React.Dispatch<React.SetStateAction<Grade[]>>;
  showToast: (msg: string, type?: 'success' | 'warning' | 'error') => void;
}

export default function GradesTab({
  subjects,
  grades,
  setGrades,
  showToast
}: GradesTabProps) {
  // Form State
  const [gradeSubject, setGradeSubject] = useState(subjects[0]?.id || '');
  const [gradeName, setGradeName] = useState('');
  const [gradeValue, setGradeValue] = useState('');
  const [gradeWeight, setGradeWeight] = useState('');
  const [gradeDate, setGradeDate] = useState(new Date().toISOString().split('T')[0]);

  // Hover state for custom SVG chart tooltips
  const [hoveredPoint, setHoveredPoint] = useState<number | null>(null);

  // Calculate Averages
  const subjectAverages = subjects.reduce((acc, sub) => {
    const subGrades = grades.filter(g => g.subjectId === sub.id);
    let weightedSum = 0;
    let totalWeights = 0;

    subGrades.forEach(g => {
      weightedSum += g.value * g.weight;
      totalWeights += g.weight;
    });

    const average = totalWeights > 0 ? weightedSum / totalWeights : null;
    acc[sub.id] = { average, grades: subGrades };
    return acc;
  }, {} as Record<string, { average: number | null; grades: Grade[] }>);

  // Calculate global average of the active subjects
  const activeAverages = Object.values(subjectAverages)
    .map(data => data.average)
    .filter((avg): avg is number => avg !== null);

  const globalAverage = activeAverages.length > 0 
    ? activeAverages.reduce((sum, val) => sum + val, 0) / activeAverages.length 
    : null;

  // Add Grade
  const handleAddGrade = (e: React.FormEvent) => {
    e.preventDefault();
    const val = parseFloat(gradeValue);
    const w = parseFloat(gradeWeight);

    if (!gradeName.trim() || isNaN(val) || val < 0 || val > 20 || isNaN(w) || w <= 0 || w > 100 || !gradeDate) {
      showToast('Por favor, introduz valores corretos (Nota de 0 a 20, Peso de 1 a 100%).', 'error');
      return;
    }

    const newGrade: Grade = {
      id: `g-${Date.now()}`,
      subjectId: gradeSubject,
      name: gradeName.trim(),
      value: val,
      weight: w,
      date: gradeDate
    };

    setGrades(prev => [...prev, newGrade]);
    setGradeName('');
    setGradeValue('');
    setGradeWeight('');
    showToast('Nota adicionada à pauta escolar!');
  };

  // Delete Grade
  const handleDeleteGrade = (id: string) => {
    setGrades(prev => prev.filter(g => g.id !== id));
    showToast('Nota removida.', 'warning');
  };

  // Prepare sorted grades for the evolution chart
  const sortedGrades = [...grades].sort((a, b) => a.date.localeCompare(b.date));

  // Custom SVG Line Chart Drawing Dimensions
  const paddingX = 40;
  const paddingY = 30;
  const width = 600;
  const height = 240;
  const graphWidth = width - paddingX * 2;
  const graphHeight = height - paddingY * 2;

  // SVG path coordinates builder
  let points: { x: number; y: number; grade: Grade; index: number }[] = [];
  let polylinePath = '';

  if (sortedGrades.length > 1) {
    const minVal = 0;
    const maxVal = 20;

    points = sortedGrades.map((g, idx) => {
      const x = paddingX + (idx / (sortedGrades.length - 1)) * graphWidth;
      // Invert Y so 20 is at the top, 0 is at the bottom
      const y = paddingY + graphHeight - ((g.value - minVal) / (maxVal - minVal)) * graphHeight;
      return { x, y, grade: g, index: idx };
    });

    polylinePath = points.map(p => `${p.x},${p.y}`).join(' ');
  }

  return (
    <div className="space-y-6">
      {/* Cabeçalho */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-xl font-extrabold text-slate-900">Evolução & Médias</h3>
          <p className="text-sm text-slate-500">Regista notas e acompanha as médias ponderadas das disciplinas em tempo real.</p>
        </div>
        
        {/* Card Média Geral */}
        <div className="bg-white border border-slate-100 rounded-2xl px-6 py-3.5 shadow-soft flex items-center gap-4 border-l-4 border-l-blue-500">
          <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600 shadow-inner-soft">
            <Award size={20} />
          </div>
          <div>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Média Geral</p>
            <h4 className="text-xl font-extrabold text-slate-800 leading-none mt-1">
              {globalAverage !== null ? globalAverage.toFixed(2) : '--'}
            </h4>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        
        {/* Formulário Registar Nota */}
        <div className="lg:col-span-1 bg-white border border-slate-100 rounded-2xl p-6 shadow-soft space-y-4">
          <h4 className="font-bold text-slate-800 text-xs uppercase tracking-wider border-b border-slate-100 pb-3">
            Registar Nota
          </h4>
          
          <form onSubmit={handleAddGrade} className="space-y-4">
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Disciplina</label>
              <select 
                value={gradeSubject}
                onChange={e => setGradeSubject(e.target.value)}
                className="w-full text-xs border border-slate-200 rounded-xl px-3.5 py-2.5 bg-slate-50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-slate-400 font-medium cursor-pointer"
                required
              >
                {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>
            
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Descrição / Avaliação</label>
              <input 
                type="text" 
                placeholder="Ex: Teste 1, Exame Final, Projeto" 
                required 
                value={gradeName}
                onChange={e => setGradeName(e.target.value)}
                className="w-full text-xs border border-slate-200 rounded-xl px-3.5 py-2.5 bg-slate-50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-slate-400 font-medium"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Nota (0 a 20)</label>
                <input 
                  type="number" 
                  min="0" 
                  max="20" 
                  step="0.1" 
                  placeholder="14.5" 
                  required 
                  value={gradeValue}
                  onChange={e => setGradeValue(e.target.value)}
                  className="w-full text-xs border border-slate-200 rounded-xl px-3.5 py-2.5 bg-slate-50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-slate-400 font-bold"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Peso (%)</label>
                <input 
                  type="number" 
                  min="1" 
                  max="100" 
                  placeholder="45" 
                  required 
                  value={gradeWeight}
                  onChange={e => setGradeWeight(e.target.value)}
                  className="w-full text-xs border border-slate-200 rounded-xl px-3.5 py-2.5 bg-slate-50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-slate-400 font-bold"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Data</label>
              <input 
                type="date" 
                required 
                value={gradeDate}
                onChange={e => setGradeDate(e.target.value)}
                className="w-full text-xs border border-slate-200 rounded-xl px-3.5 py-2.5 bg-slate-50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-slate-400 font-medium"
              />
            </div>

            <button 
              type="submit" 
              className="w-full bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl py-3.5 transition-all flex items-center justify-center gap-1.5 shadow-sm mt-3 cursor-pointer"
            >
              <Plus size={13} /> Inserir Nota
            </button>
          </form>
        </div>

        {/* Tabela & Gráfico */}
        <div className="lg:col-span-2 bg-white border border-slate-100 rounded-2xl p-6 shadow-soft space-y-6">
          <div className="space-y-4">
            <h4 className="font-bold text-slate-800 text-xs uppercase tracking-wider">Pauta Escolar</h4>
            <div className="overflow-x-auto border border-slate-100 rounded-xl">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-100 text-slate-400 uppercase tracking-wider font-semibold text-[10px]">
                    <th className="px-4 py-3">Disciplina</th>
                    <th className="px-4 py-3">Avaliações</th>
                    <th className="px-4 py-3">Média Calculada</th>
                    <th className="px-4 py-3 text-center">Estado</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {subjects.map(subject => {
                    const data = subjectAverages[subject.id];
                    let avgText = '--';
                    let statusBadge = (
                      <span className="px-2.5 py-0.5 rounded-full text-[8px] font-bold bg-slate-100 text-slate-400 uppercase tracking-wider">
                        Vazio
                      </span>
                    );

                    if (data.average !== null) {
                      avgText = data.average.toFixed(2);
                      statusBadge = data.average >= 9.5 ? (
                        <span className="px-2.5 py-0.5 rounded-full text-[8px] font-bold bg-emerald-50 text-emerald-600 uppercase border border-emerald-100 tracking-wider">
                          Aprovado
                        </span>
                      ) : (
                        <span className="px-2.5 py-0.5 rounded-full text-[8px] font-bold bg-rose-50 text-rose-600 uppercase border border-rose-100 tracking-wider animate-pulse">
                          Em Risco
                        </span>
                      );
                    }

                    return (
                      <tr key={subject.id} className="hover:bg-slate-50/20">
                        {/* Subject */}
                        <td className="px-4 py-3 align-top">
                          <div className="flex items-center gap-1.5 mt-1">
                            <span 
                              className="w-2.5 h-2.5 rounded-full shadow-sm" 
                              style={{ backgroundColor: subject.hexText }}
                            ></span>
                            <span className="font-bold text-slate-800 text-xs">
                              {subject.name}
                            </span>
                          </div>
                        </td>

                        {/* Individual Grades pills */}
                        <td className="px-4 py-3">
                          <div className="space-y-1.5 max-w-[280px]">
                            {data.grades.length === 0 ? (
                              <div className="text-[10px] text-slate-450 italic py-1">Sem notas registadas.</div>
                            ) : (
                              data.grades.map(g => (
                                <div 
                                  key={g.id} 
                                  className="flex justify-between items-center bg-slate-50 border border-slate-200 p-1 px-2.5 rounded-lg text-[10px] hover:bg-slate-100/50 hover:border-slate-300 transition-colors"
                                >
                                  <div className="truncate max-w-[150px]">
                                    <span className="font-bold text-slate-700">{g.name}</span>{' '}
                                    <span className="text-slate-400">({g.weight}%)</span>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <span className="font-extrabold text-slate-800 bg-white px-1.5 py-0.5 border border-slate-100 rounded-md">
                                      {g.value.toFixed(1)}
                                    </span>
                                    <button 
                                      onClick={() => handleDeleteGrade(g.id)}
                                      className="text-slate-300 hover:text-rose-500 transition-colors p-0.5 cursor-pointer"
                                      title="Remover Nota"
                                    >
                                      <Trash2 size={10} />
                                    </button>
                                  </div>
                                </div>
                              ))
                            )}
                          </div>
                        </td>

                        {/* Average */}
                        <td className="px-4 py-3 align-top font-extrabold text-slate-800 text-xs">
                          {avgText}
                        </td>

                        {/* Status */}
                        <td className="px-4 py-3 align-top text-center">
                          {statusBadge}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Evolution Chart */}
          <div className="border-t border-slate-100 pt-5 space-y-4">
            <div className="flex justify-between items-center">
              <h4 className="font-bold text-slate-800 text-xs uppercase tracking-wider">Evolução do Desempenho</h4>
              {sortedGrades.length > 0 && (
                <span className="text-[10px] text-slate-400 font-medium">Cronológico ({sortedGrades.length} notas)</span>
              )}
            </div>
            
            <div className="w-full relative bg-slate-50/50 rounded-xl border border-slate-100/80 p-4 flex flex-col items-center justify-center min-h-[220px]">
              {sortedGrades.length < 2 ? (
                <div className="text-center p-6 text-slate-400 italic text-[11px] flex flex-col items-center gap-2">
                  <Info size={16} className="text-slate-300" />
                  Insere pelo menos duas avaliações para visualizar a linha de tendência de desempenho.
                </div>
              ) : (
                <div className="w-full h-[240px] relative">
                  {/* SVG drawing with responsive view box */}
                  <svg 
                    viewBox={`0 0 ${width} ${height}`} 
                    className="w-full h-full"
                  >
                    {/* Horizontal gridlines for 0, 4, 8, 12, 16, 20 grades */}
                    {[0, 4, 8, 12, 16, 20].map((tick) => {
                      const y = paddingY + graphHeight - (tick / 20) * graphHeight;
                      return (
                        <g key={tick}>
                          <line 
                            x1={paddingX} 
                            y1={y} 
                            x2={width - paddingX} 
                            y2={y} 
                            stroke="#f1f5f9" 
                            strokeWidth={1} 
                          />
                          <text 
                            x={paddingX - 10} 
                            y={y + 3} 
                            textAnchor="end" 
                            className="fill-slate-400 text-[9px] font-medium font-sans"
                          >
                            {tick}
                          </text>
                        </g>
                      );
                    })}

                    {/* Polyline Path Shadow */}
                    <path 
                      d={`M ${points.map(p => `${p.x},${p.y}`).join(' L ')}`} 
                      fill="none" 
                      stroke="#f1f5f9" 
                      strokeWidth={4} 
                      strokeLinecap="round"
                    />

                    {/* Main Polyline line */}
                    <path 
                      d={`M ${points.map(p => `${p.x},${p.y}`).join(' L ')}`} 
                      fill="none" 
                      stroke="#1e293b" 
                      strokeWidth={1.5} 
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />

                    {/* Circle indicators */}
                    {points.map((p) => {
                      const subject = subjects.find(s => s.id === p.grade.subjectId) || { hexText: '#475569' };
                      const isHovered = hoveredPoint === p.index;

                      return (
                        <circle 
                          key={p.grade.id}
                          cx={p.x}
                          cy={p.y}
                          r={isHovered ? 7 : 4.5}
                          fill={subject.hexText}
                          stroke="#ffffff"
                          strokeWidth={isHovered ? 2 : 1.5}
                          className="transition-all duration-150 cursor-pointer"
                          onMouseEnter={() => setHoveredPoint(p.index)}
                          onMouseLeave={() => setHoveredPoint(null)}
                        />
                      );
                    })}

                    {/* Horizontal Date labels */}
                    {points.map((p, idx) => {
                      // Only show some date labels to avoid crowding
                      if (points.length > 5 && idx % 2 !== 0 && idx !== points.length - 1) return null;
                      const parts = p.grade.date.split('-');
                      const displayDate = parts.length === 3 ? `${parts[2]}/${parts[1]}` : p.grade.date;

                      return (
                        <text 
                          key={p.grade.id}
                          x={p.x} 
                          y={height - 8} 
                          textAnchor="middle" 
                          className="fill-slate-400 text-[8px] font-sans"
                        >
                          {displayDate}
                        </text>
                      );
                    })}
                  </svg>

                  {/* HTML Overlay Tooltip inside the SVG bounds */}
                  {hoveredPoint !== null && points[hoveredPoint] && (
                    <div 
                      className="absolute bg-slate-900 text-white rounded-xl p-2.5 shadow-md pointer-events-none text-[10px] space-y-1 border border-slate-800"
                      style={{
                        left: `${(points[hoveredPoint].x / width) * 100}%`,
                        top: `${(points[hoveredPoint].y / height) * 100 - 45}%`,
                        transform: 'translate(-50%, -100%)',
                        zIndex: 10,
                        minWidth: '120px'
                      }}
                    >
                      <div className="font-extrabold text-[9px] uppercase tracking-wider text-slate-350 leading-none">
                        {subjects.find(s => s.id === points[hoveredPoint].grade.subjectId)?.name || 'Disciplina'}
                      </div>
                      <div className="font-bold text-white leading-tight">
                        {points[hoveredPoint].grade.name}
                      </div>
                      <div className="flex justify-between text-slate-300 pt-1 border-t border-slate-800 text-[9px]">
                        <span>Nota: {points[hoveredPoint].grade.value.toFixed(1)}</span>
                        <span>Peso: {points[hoveredPoint].grade.weight}%</span>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
