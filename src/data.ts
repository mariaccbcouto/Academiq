import { Subject, Task, CalendarBlock, Grade, Note } from './types';

export const DEFAULT_SUBJECTS: Subject[] = [
  { id: 'matematica', name: 'Cálculo II', colorClass: 'pastel-purple', hexBg: '#f3e8ff', hexBorder: '#c084fc', hexText: '#7e22ce' },
  { id: 'programacao', name: 'Biologia Cel.', colorClass: 'pastel-green', hexBg: '#dcfce7', hexBorder: '#4ade80', hexText: '#15803d' },
  { id: 'fisica', name: 'Física Teórica', colorClass: 'pastel-rose', hexBg: '#fae8ff', hexBorder: '#e879f9', hexText: '#a21caf' },
  { id: 'quimica', name: 'Sessão Focus', colorClass: 'pastel-blue', hexBg: '#e0e7ff', hexBorder: '#818cf8', hexText: '#4338ca' },
  { id: 'ingles', name: 'História', colorClass: 'pastel-orange', hexBg: '#fef3c7', hexBorder: '#fbbf24', hexText: '#b45309' }
];

export const INITIAL_TASKS: Task[] = [
  { id: 't-1', title: 'Revisão de Cálculo II', subjectId: 'matematica', priority: 'high', poms: 1, subtitle: 'Hoje, 18:00', completed: false },
  { id: 't-2', title: 'Relatório de Lab', subjectId: 'programacao', priority: 'medium', poms: 1, subtitle: 'Amanhã, 10:00', completed: false },
  { id: 't-3', title: 'Leitura: Bioética', subjectId: 'programacao', priority: 'low', poms: 1, subtitle: '22 Out', completed: true },
  { id: 't-4', title: 'Inscrição Evento', subjectId: 'quimica', priority: 'low', poms: 1, subtitle: 'Concluído', completed: true }
];

export const INITIAL_CALENDAR_BLOCKS: CalendarBlock[] = [
  { id: 'cb-1', subjectId: 'matematica', title: 'Cálculo II', day: 'monday', startTime: '08:00', endTime: '10:00' },
  { id: 'cb-2', subjectId: 'programacao', title: 'Química Org.', day: 'tuesday', startTime: '11:00', endTime: '12:30' },
  { id: 'cb-3', subjectId: 'fisica', title: 'Física Teórica', day: 'wednesday', startTime: '09:30', endTime: '12:00' },
  { id: 'cb-4', subjectId: 'quimica', title: 'Sessão Focus', day: 'thursday', startTime: '14:00', endTime: '15:30' },
  { id: 'cb-5', subjectId: 'programacao', title: 'Biologia Cel.', day: 'friday', startTime: '10:30', endTime: '12:00' }
];

export const INITIAL_GRADES: Grade[] = [
  { id: 'g-1', subjectId: 'matematica', name: 'Exame de Cálculo II', value: 14.5, weight: 60, date: '2026-06-12' },
  { id: 'g-2', subjectId: 'matematica', name: 'Trabalho de Grupo', value: 16.0, weight: 40, date: '2026-05-25' },
  { id: 'g-3', subjectId: 'programacao', name: 'Projeto Prático', value: 18.5, weight: 50, date: '2026-06-02' },
  { id: 'g-4', subjectId: 'fisica', name: 'Teste Escrito', value: 11.0, weight: 50, date: '2026-04-20' },
  { id: 'g-5', subjectId: 'ingles', name: 'Apresentação Oral', value: 17.5, weight: 30, date: '2026-05-18' }
];

export const INITIAL_NOTES: Note[] = [
  {
    id: 'n-1',
    subjectId: 'matematica',
    title: 'Cálculo Diferencial: Limites',
    body: `O conceito de limite é fundamental na análise matemática. Representa o valor do qual uma função se aproxima à medida que o seu argumento se aproxima de um determinado ponto.

Fórmulas importantes:
- lim (x -> c) f(x) = L

Casos de indeterminação comuns:
- 0/0, inf/inf, 0 * inf.

Para resolver indeterminações:
1. Factorização do polinómio.
2. Uso de limites notáveis.`,
    date: '2026-06-15',
    aiSummary: `<h3><strong>Resumo Geral:</strong></h3><p>Introdução teórica aos limites de funções, englobando assíntotas e técnicas para levantar indeterminações algébricas.</p><h3><strong>Pontos-Chave:</strong></h3><ul><li>Noção intuitiva de aproximação local de f(x).</li><li>Resolução de indeterminações por fatorização clássica.</li><li>Importância de limites notáveis para simplificar cálculos complexos.</li></ul><h3><strong>Glossário:</strong></h3><p><strong>Limite:</strong> O valor tendencial da ordenada de uma função à medida que a abcissa tende a um ponto específico.</p>`
  },
  {
    id: 'n-2',
    subjectId: 'programacao',
    title: 'Biologia Celular: Estrutura do Núcleo',
    body: `O núcleo celular é a organela que contém a maior parte do material genético da célula (DNA).

Funções principais:
- Armazenamento de informação genética.
- Controle da expressão gênica e replicação de DNA.
- Síntese de RNA ribossômico no nucléolo.

Estruturas:
1. Carioteca (envelope nuclear com poros).
2. Nucleoplasma.
3. Cromatina (DNA associado a histonas).
4. Nucléolo.`,
    date: '2026-06-22',
    aiSummary: `<h3><strong>Resumo Geral:</strong></h3><p>Estudo anatômico e funcional do núcleo celular de eucariontes.</p><h3><strong>Pontos-Chave:</strong></h3><ul><li>Compartimentalização do genoma eucariótico.</li><li>Regulação da passagem de macromoléculas através dos complexos de poro.</li><li>Nucléolo como centro organizador da síntese de ribossomas.</li></ul><h3><strong>Glossário:</strong></h3><p><strong>Carioteca:</strong> Membrana dupla bi-lipídica pontuada por poros nucleares.</p>`
  }
];
