// Theme tokens, data, formatters

const THEMES = {
  dark: {
    bg: '#0a0c10',
    surface: '#0d1117',
    surfaceAlt: '#11161e',
    border: '#1a212c',
    borderStrong: '#243042',
    text: '#e6e9ef',
    textDim: '#94a3b8',
    textMute: '#64748b',
    textFaint: '#475569',
    income: '#22c55e',
    expense: '#f87171',
    incomeBar: '#16a34a',
    expenseBar: '#334155',
    chip: '#11161e',
  },
  light: {
    bg: '#f8f8f5',
    surface: '#ffffff',
    surfaceAlt: '#f1f3f0',
    border: '#e6e8e3',
    borderStrong: '#d1d5cd',
    text: '#0a0c10',
    textDim: '#475569',
    textMute: '#64748b',
    textFaint: '#94a3b8',
    income: '#15803d',
    expense: '#b91c1c',
    incomeBar: '#16a34a',
    expenseBar: '#cbd5d0',
    chip: '#f1f3f0',
  },
};

const ACCENTS = {
  blue: { hue: '#3b82f6', soft: '#60a5fa', deep: '#2563eb', tint: '#1e3a8a' },
  green: { hue: '#22c55e', soft: '#4ade80', deep: '#16a34a', tint: '#14532d' },
  emerald: { hue: '#10b981', soft: '#34d399', deep: '#059669', tint: '#064e3b' },
  violet: { hue: '#a78bfa', soft: '#c4b5fd', deep: '#7c3aed', tint: '#3b0764' },
  orange: { hue: '#f97316', soft: '#fb923c', deep: '#ea580c', tint: '#7c2d12' },
  amber: { hue: '#eab308', soft: '#facc15', deep: '#ca8a04', tint: '#713f12' },
};

const MONTHS_DATA = {
  set: { label: 'Setembro', short: 'Set', balance: 11530.10, income: 8200, expense: 3610, txCount: 78,
    history: [{m:'Abr',r:7600,d:3100},{m:'Mai',r:7800,d:3200},{m:'Jun',r:8000,d:3450},{m:'Jul',r:8200,d:3680},{m:'Ago',r:8200,d:3520},{m:'Set',r:8200,d:3610}] },
  out: { label: 'Outubro', short: 'Out', balance: 12480.32, income: 8800, expense: 3745, txCount: 85,
    history: [{m:'Mai',r:7800,d:3200},{m:'Jun',r:8000,d:3450},{m:'Jul',r:8200,d:3680},{m:'Ago',r:8200,d:3520},{m:'Set',r:8200,d:3610},{m:'Out',r:8800,d:3745}] },
  nov: { label: 'Novembro', short: 'Nov', balance: 13200.55, income: 8800, expense: 2980, txCount: 42,
    history: [{m:'Jun',r:8000,d:3450},{m:'Jul',r:8200,d:3680},{m:'Ago',r:8200,d:3520},{m:'Set',r:8200,d:3610},{m:'Out',r:8800,d:3745},{m:'Nov',r:8800,d:2980}] },
};

const CATEGORIES = [
  { id: 'moradia', name: 'Moradia', value: 1685.40, sub: 'Aluguel + condomínio', icon: '◇' },
  { id: 'fin', name: 'Financiamentos', value: 967.93, sub: 'Carro · 28/60', icon: '◐' },
  { id: 'transp', name: 'Transporte', value: 412.40, sub: 'Combustível, Uber', icon: '→' },
  { id: 'assin', name: 'Assinaturas', value: 296.10, sub: '6 serviços ativos', icon: '∞' },
  { id: 'alim', name: 'Alimentação', value: 224.80, sub: 'Mercado, delivery', icon: '◌' },
  { id: 'saude', name: 'Saúde', value: 148.00, sub: 'Plano + farmácia', icon: '+' },
  { id: 'lazer', name: 'Lazer', value: 11.40, sub: 'Cinema', icon: '◇' },
];

const TRANSACTIONS = [
  { id: 1, name: 'Pão de Açúcar', cat: 'alim', value: -245.90, date: 'Hoje · 14:32', method: 'Cartão Itaú' },
  { id: 2, name: 'Salário', cat: 'income', value: 8200.00, date: 'Ontem', method: 'Itaú' },
  { id: 3, name: 'Netflix', cat: 'assin', value: -55.90, date: '02 out', method: 'Cartão Nubank' },
  { id: 4, name: 'Posto Shell', cat: 'transp', value: -180.00, date: '02 out', method: 'Débito' },
  { id: 5, name: 'Uber para reunião', cat: 'transp', value: -18.40, date: '01 out', method: 'Pix' },
  { id: 6, name: 'Aluguel', cat: 'moradia', value: -1685.40, date: '01 out', method: 'Boleto' },
  { id: 7, name: 'iFood — almoço', cat: 'alim', value: -34.50, date: '01 out', method: 'Cartão Nubank' },
  { id: 8, name: 'Drogasil', cat: 'saude', value: -86.20, date: '30 set', method: 'Pix' },
  { id: 9, name: 'Spotify', cat: 'assin', value: -21.90, date: '29 set', method: 'Cartão Nubank' },
  { id: 10, name: 'Mercadinho', cat: 'alim', value: -67.30, date: '29 set', method: 'Pix' },
  { id: 11, name: 'Reembolso projeto', cat: 'income', value: 600.00, date: '28 set', method: 'Pix' },
  { id: 12, name: 'Financiamento Honda', cat: 'fin', value: -967.93, date: '28 set', method: 'Boleto' },
];

const fmt = (v, opts = {}) => {
  const { hideValues, showSign } = opts;
  if (hideValues) return '••••••';
  const abs = Math.abs(v);
  const formatted = abs.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const sign = showSign ? (v >= 0 ? '+' : '−') + ' ' : (v < 0 ? '−' : '');
  return sign + 'R$ ' + formatted;
};

const fmtShort = (v, hide) => {
  if (hide) return '•••';
  if (v >= 1000) return 'R$ ' + (v / 1000).toFixed(1).replace('.', ',') + 'k';
  return 'R$ ' + v.toFixed(0);
};

window.WALLETY = { THEMES, ACCENTS, MONTHS_DATA, CATEGORIES, TRANSACTIONS, fmt, fmtShort };
