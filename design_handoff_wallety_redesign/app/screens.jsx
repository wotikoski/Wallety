// Telas: Transações (lista filtrável), Metas (cards), Relatórios (placeholder), Configurações
const { Icon, PageHeader } = window;
const { CATEGORIES, TRANSACTIONS, MONTHS_DATA, fmt } = window.WALLETY;

const Transacoes = ({ theme, accent, period, onPeriodChange, hide, onToggleHide, onAddTx, density }) => {
  const T = theme;
  const [filter, setFilter] = React.useState('all');
  const [search, setSearch] = React.useState('');

  const filtered = TRANSACTIONS.filter(t => {
    if (filter === 'income' && t.value < 0) return false;
    if (filter === 'expense' && t.value > 0) return false;
    if (filter !== 'all' && filter !== 'income' && filter !== 'expense' && t.cat !== filter) return false;
    if (search && !t.name.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const total = filtered.reduce((s, t) => s + t.value, 0);

  const filterOptions = [
    { id: 'all', label: 'Todas' },
    { id: 'income', label: 'Receitas' },
    { id: 'expense', label: 'Despesas' },
    ...CATEGORIES.slice(0, 4).map(c => ({ id: c.id, label: c.name })),
  ];

  // group by date
  const groups = {};
  filtered.forEach(t => { groups[t.date] = groups[t.date] || []; groups[t.date].push(t); });

  return (
    <div style={{ flex: 1, padding: density === 'compact' ? '22px 28px' : '28px 36px', overflow: 'auto' }}>
      <PageHeader theme={T} accent={accent}
        title="Transações"
        subtitle={`${MONTHS_DATA[period].label} 2026 · ${filtered.length} resultados`}
        period={period} onPeriodChange={onPeriodChange}
        hideBalance={hide} onToggleHide={onToggleHide}
        onAddTx={onAddTx}
      />

      {/* search + filters */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 18, alignItems: 'center', flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', flex: '1 1 280px', maxWidth: 360 }}>
          <div style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: T.textMute }}>
            <Icon name="search" size={14} />
          </div>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar transações…" style={{
            width: '100%', background: T.surface, border: `1px solid ${T.border}`,
            color: T.text, fontFamily: 'inherit', fontSize: 13,
            padding: '9px 12px 9px 34px', borderRadius: 9, outline: 'none',
          }} />
        </div>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {filterOptions.map(f => (
            <button key={f.id} onClick={() => setFilter(f.id)} style={{
              padding: '7px 12px', borderRadius: 99, fontSize: 12, fontWeight: 500,
              border: `1px solid ${filter === f.id ? accent.hue : T.border}`,
              background: filter === f.id ? accent.hue + '22' : 'transparent',
              color: filter === f.id ? accent.hue : T.textDim,
              cursor: 'pointer', fontFamily: 'inherit',
            }}>{f.label}</button>
          ))}
        </div>
      </div>

      {/* totals strip */}
      <div style={{ display: 'flex', gap: 24, padding: '14px 20px', background: T.surface, border: `1px solid ${T.border}`, borderRadius: 'var(--r-card)', marginBottom: 14 }}>
        <div>
          <div style={{ fontSize: 10, color: T.textMute, textTransform: 'uppercase', letterSpacing: 1, fontWeight: 700 }}>Total filtrado</div>
          <div style={{ fontSize: 18, fontWeight: 600, color: total >= 0 ? accent.hue : T.text, fontVariantNumeric: 'tabular-nums', marginTop: 4 }}>
            {hide ? '••••' : fmt(total, { showSign: total >= 0 })}
          </div>
        </div>
        <div style={{ width: 1, background: T.border }} />
        <div>
          <div style={{ fontSize: 10, color: T.textMute, textTransform: 'uppercase', letterSpacing: 1, fontWeight: 700 }}>Receitas</div>
          <div style={{ fontSize: 18, fontWeight: 600, color: T.text, fontVariantNumeric: 'tabular-nums', marginTop: 4 }}>
            {hide ? '••••' : fmt(filtered.filter(t => t.value > 0).reduce((s, t) => s + t.value, 0))}
          </div>
        </div>
        <div style={{ width: 1, background: T.border }} />
        <div>
          <div style={{ fontSize: 10, color: T.textMute, textTransform: 'uppercase', letterSpacing: 1, fontWeight: 700 }}>Despesas</div>
          <div style={{ fontSize: 18, fontWeight: 600, color: T.text, fontVariantNumeric: 'tabular-nums', marginTop: 4 }}>
            {hide ? '••••' : fmt(Math.abs(filtered.filter(t => t.value < 0).reduce((s, t) => s + t.value, 0)))}
          </div>
        </div>
      </div>

      {/* list */}
      <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 'var(--r-card)', padding: '6px 20px 12px' }}>
        {Object.entries(groups).map(([date, items], gi) => (
          <div key={date}>
            <div style={{ fontSize: 10, color: T.textMute, textTransform: 'uppercase', letterSpacing: 1.2, fontWeight: 700, padding: '14px 0 6px', borderTop: gi ? `1px solid ${T.border}` : 0 }}>{date}</div>
            {items.map((t, i) => {
              const cat = CATEGORIES.find(c => c.id === t.cat);
              const isIncome = t.value > 0;
              return (
                <div key={t.id} style={{ display: 'grid', gridTemplateColumns: '36px 1fr auto auto', gap: 12, alignItems: 'center', padding: '8px 0', borderTop: i ? `1px solid ${T.border}` : 0 }}>
                  <div style={{
                    width: 30, height: 30, borderRadius: 8,
                    background: isIncome ? accent.hue + '22' : T.surfaceAlt,
                    border: `1px solid ${isIncome ? accent.hue + '44' : T.border}`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 13, color: isIncome ? accent.hue : T.textDim, fontWeight: 700,
                  }}>{isIncome ? '↓' : (cat?.icon || '·')}</div>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 500, color: T.text }}>{t.name}</div>
                    <div style={{ fontSize: 11, color: T.textMute, marginTop: 1 }}>{isIncome ? 'Receita' : (cat?.name || '—')} · {t.method}</div>
                  </div>
                  <div style={{ fontSize: 11, color: T.textMute }}>{t.method}</div>
                  <div style={{ fontSize: 13, fontWeight: 600, fontVariantNumeric: 'tabular-nums', color: isIncome ? accent.hue : T.text, minWidth: 110, textAlign: 'right' }}>
                    {hide ? '••••' : fmt(t.value, { showSign: isIncome })}
                  </div>
                </div>
              );
            })}
          </div>
        ))}
        {filtered.length === 0 && (
          <div style={{ padding: 40, textAlign: 'center', color: T.textMute, fontSize: 13 }}>Nenhuma transação encontrada.</div>
        )}
      </div>
    </div>
  );
};

const Metas = ({ theme, accent, period, onPeriodChange, hide, onToggleHide, onAddTx, density }) => {
  const T = theme;
  const goals = [
    { name: 'Viagem para o Japão', target: 14000, current: 9480, deadline: 'Mar 2027', emoji: '✈' },
    { name: 'Reserva de emergência', target: 18000, current: 14200, deadline: '6 meses', emoji: '◇' },
    { name: 'Notebook novo', target: 8500, current: 2100, deadline: 'Jul 2026', emoji: '◐' },
    { name: 'Curso de fotografia', target: 1800, current: 1800, deadline: 'Concluída', emoji: '✓' },
  ];

  return (
    <div style={{ flex: 1, padding: density === 'compact' ? '22px 28px' : '28px 36px', overflow: 'auto' }}>
      <PageHeader theme={T} accent={accent}
        title="Metas"
        subtitle={`${goals.filter(g => g.current < g.target).length} ativas · 1 concluída`}
        period={period} onPeriodChange={onPeriodChange}
        hideBalance={hide} onToggleHide={onToggleHide}
        onAddTx={onAddTx}
      />

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 14 }}>
        {goals.map(g => {
          const pct = Math.min(100, Math.round((g.current / g.target) * 100));
          const done = pct >= 100;
          return (
            <div key={g.name} style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 'var(--r-card)', padding: 22 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 }}>
                <div>
                  <div style={{ fontSize: 16, fontWeight: 600, color: T.text, letterSpacing: '-0.01em', display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ width: 28, height: 28, borderRadius: 8, background: done ? accent.hue : T.surfaceAlt, color: done ? '#fff' : accent.hue, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 700 }}>{g.emoji}</span>
                    {g.name}
                  </div>
                  <div style={{ fontSize: 11, color: T.textMute, marginTop: 6, marginLeft: 36 }}>Prazo: {g.deadline}</div>
                </div>
                <div style={{ fontSize: 11, color: done ? accent.hue : T.textMute, fontWeight: 700, padding: '3px 10px', borderRadius: 99, background: done ? accent.hue + '22' : T.surfaceAlt, border: `1px solid ${done ? accent.hue + '44' : T.border}` }}>
                  {pct}%
                </div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 6 }}>
                <div style={{ fontSize: 22, fontWeight: 600, color: T.text, fontVariantNumeric: 'tabular-nums', letterSpacing: '-0.02em' }}>
                  {hide ? '•••••' : fmt(g.current)}
                </div>
                <div style={{ fontSize: 12, color: T.textMute, fontVariantNumeric: 'tabular-nums' }}>
                  / {hide ? '•••••' : fmt(g.target)}
                </div>
              </div>
              <div style={{ height: 6, background: T.surfaceAlt, borderRadius: 99, overflow: 'hidden' }}>
                <div style={{ width: `${pct}%`, height: '100%', background: done ? accent.hue : `linear-gradient(90deg, ${accent.deep}, ${accent.hue})`, borderRadius: 99, transition: 'width 0.5s' }} />
              </div>
              <div style={{ fontSize: 11, color: T.textMute, marginTop: 10 }}>
                {done ? 'Meta atingida! 🎉' : `Faltam ${hide ? '•••' : fmt(g.target - g.current)}.`}
              </div>
            </div>
          );
        })}

        {/* add new goal */}
        <button style={{
          background: 'transparent', border: `1.5px dashed ${T.border}`, borderRadius: 'var(--r-card)',
          padding: 22, color: T.textMute, fontFamily: 'inherit', cursor: 'pointer',
          minHeight: 200, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 10,
        }}>
          <div style={{ width: 36, height: 36, borderRadius: '50%', background: T.surfaceAlt, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Icon name="plus" size={16} color={T.textDim} strokeWidth={2} />
          </div>
          <div style={{ fontSize: 13, fontWeight: 500 }}>Nova meta</div>
        </button>
      </div>
    </div>
  );
};

const Relatorios = ({ theme, accent, period, onPeriodChange, hide, onToggleHide, onAddTx, density }) => {
  const T = theme;
  const sum = CATEGORIES.reduce((s, c) => s + c.value, 0);
  return (
    <div style={{ flex: 1, padding: density === 'compact' ? '22px 28px' : '28px 36px', overflow: 'auto' }}>
      <PageHeader theme={T} accent={accent}
        title="Relatórios"
        subtitle={`${MONTHS_DATA[period].label} 2026 · todas as categorias`}
        period={period} onPeriodChange={onPeriodChange}
        hideBalance={hide} onToggleHide={onToggleHide}
        onAddTx={onAddTx}
      />
      <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 'var(--r-card)', padding: 22 }}>
        <div style={{ fontSize: 14, fontWeight: 600, color: T.text, marginBottom: 14 }}>Despesas por categoria</div>
        {CATEGORIES.map((c, i) => {
          const pct = (c.value / sum) * 100;
          return (
            <div key={c.id} style={{ display: 'grid', gridTemplateColumns: '32px 1fr 60px 110px', gap: 14, alignItems: 'center', padding: '12px 0', borderTop: i ? `1px solid ${T.border}` : 0 }}>
              <div style={{ width: 30, height: 30, borderRadius: 8, background: T.surfaceAlt, color: accent.hue, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700 }}>{c.icon}</div>
              <div>
                <div style={{ fontSize: 13, fontWeight: 500, color: T.text }}>{c.name}</div>
                <div style={{ fontSize: 11, color: T.textMute, marginTop: 2 }}>{c.sub}</div>
              </div>
              <div style={{ fontSize: 11, color: T.textMute, fontVariantNumeric: 'tabular-nums', textAlign: 'right' }}>{pct.toFixed(1)}%</div>
              <div style={{ fontSize: 14, fontWeight: 600, color: T.text, fontVariantNumeric: 'tabular-nums', textAlign: 'right' }}>{hide ? '••••' : fmt(c.value)}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

const Configuracoes = ({ theme, accent, density }) => {
  const T = theme;
  return (
    <div style={{ flex: 1, padding: density === 'compact' ? '22px 28px' : '28px 36px' }}>
      <h1 style={{ fontSize: 28, fontWeight: 600, margin: 0, color: T.text, letterSpacing: '-0.03em' }}>Configurações</h1>
      <p style={{ fontSize: 13, color: T.textMute, marginTop: 18, lineHeight: 1.6 }}>Use o painel <strong style={{ color: T.text }}>Tweaks</strong> (canto inferior direito) para customizar paleta, densidade, tipografia e mais.</p>
    </div>
  );
};

const AddTxModal = ({ theme, accent, onClose }) => {
  const T = theme;
  const [type, setType] = React.useState('expense');
  const [cat, setCat] = React.useState('alim');
  const [value, setValue] = React.useState('');

  return (
    <div onClick={onClose} style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(6px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100,
      animation: 'fadeIn 0.2s',
    }}>
      <div onClick={e => e.stopPropagation()} style={{
        background: T.surface, border: `1px solid ${T.border}`, borderRadius: 16,
        width: 440, maxWidth: '90vw', padding: 26,
        animation: 'slideUp 0.25s',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
          <div style={{ fontSize: 17, fontWeight: 600, color: T.text, letterSpacing: '-0.02em' }}>Nova transação</div>
          <button onClick={onClose} style={{ background: 'transparent', border: 0, color: T.textDim, cursor: 'pointer', padding: 4 }}>
            <Icon name="x" size={18} />
          </button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6, padding: 4, background: T.surfaceAlt, borderRadius: 10, marginBottom: 18 }}>
          {[
            { id: 'expense', label: 'Despesa' },
            { id: 'income', label: 'Receita' },
          ].map(t => (
            <button key={t.id} onClick={() => setType(t.id)} style={{
              padding: '10px', borderRadius: 7, border: 0, fontSize: 13, fontWeight: 600,
              background: type === t.id ? T.surface : 'transparent',
              color: type === t.id ? T.text : T.textMute,
              cursor: 'pointer', fontFamily: 'inherit',
              boxShadow: type === t.id ? `0 0 0 1px ${T.border}` : 'none',
            }}>{t.label}</button>
          ))}
        </div>

        <div style={{ marginBottom: 14 }}>
          <label style={{ fontSize: 11, color: T.textMute, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, display: 'block', marginBottom: 6 }}>Valor</label>
          <div style={{ position: 'relative' }}>
            <span style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', fontSize: 14, color: T.textMute, fontWeight: 600 }}>R$</span>
            <input value={value} onChange={e => setValue(e.target.value)} placeholder="0,00" style={{
              width: '100%', background: T.surfaceAlt, border: `1px solid ${T.border}`,
              color: T.text, fontFamily: 'inherit', fontSize: 22, fontWeight: 600,
              padding: '14px 14px 14px 42px', borderRadius: 10, outline: 'none',
              fontVariantNumeric: 'tabular-nums',
            }} />
          </div>
        </div>

        <div style={{ marginBottom: 14 }}>
          <label style={{ fontSize: 11, color: T.textMute, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, display: 'block', marginBottom: 6 }}>Descrição</label>
          <input placeholder="Ex.: Supermercado" style={{
            width: '100%', background: T.surfaceAlt, border: `1px solid ${T.border}`,
            color: T.text, fontFamily: 'inherit', fontSize: 13,
            padding: '11px 14px', borderRadius: 10, outline: 'none',
          }} />
        </div>

        {type === 'expense' && (
          <div style={{ marginBottom: 18 }}>
            <label style={{ fontSize: 11, color: T.textMute, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, display: 'block', marginBottom: 8 }}>Categoria</label>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {CATEGORIES.slice(0, 6).map(c => (
                <button key={c.id} onClick={() => setCat(c.id)} style={{
                  padding: '7px 12px', borderRadius: 99, fontSize: 12, fontWeight: 500,
                  border: `1px solid ${cat === c.id ? accent.hue : T.border}`,
                  background: cat === c.id ? accent.hue + '22' : 'transparent',
                  color: cat === c.id ? accent.hue : T.textDim,
                  cursor: 'pointer', fontFamily: 'inherit',
                  display: 'flex', alignItems: 'center', gap: 6,
                }}>
                  <span style={{ fontSize: 12, fontWeight: 700 }}>{c.icon}</span>
                  {c.name}
                </button>
              ))}
            </div>
          </div>
        )}

        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={onClose} style={{
            flex: 1, padding: '12px', borderRadius: 10, border: `1px solid ${T.border}`,
            background: 'transparent', color: T.textDim, fontFamily: 'inherit', fontSize: 13, fontWeight: 600, cursor: 'pointer',
          }}>Cancelar</button>
          <button onClick={onClose} style={{
            flex: 2, padding: '12px', borderRadius: 10, border: 0,
            background: accent.hue, color: '#fff', fontFamily: 'inherit', fontSize: 13, fontWeight: 700, cursor: 'pointer',
          }}>Adicionar</button>
        </div>
      </div>
    </div>
  );
};

Object.assign(window, { Transacoes, Metas, Relatorios, Configuracoes, AddTxModal });
