// Dashboard screen — hero saldo, KPIs, gráfico, categorias, últimas transações
const { Logo, Icon, PageHeader } = window;
const { CATEGORIES, TRANSACTIONS, MONTHS_DATA, fmt, fmtShort } = window.WALLETY;

const Sparkline = ({ data, color, width = 180, height = 44 }) => {
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;
  const pts = data.map((v, i) => {
    const x = (i / (data.length - 1)) * width;
    const y = height - 4 - ((v - min) / range) * (height - 8);
    return [x, y];
  });
  const path = pts.map((p, i) => (i === 0 ? 'M' : 'L') + p[0].toFixed(1) + ',' + p[1].toFixed(1)).join(' ');
  const area = path + ` L ${width},${height} L 0,${height} Z`;
  const id = 'spark-' + Math.random().toString(36).slice(2, 8);
  return (
    <svg viewBox={`0 0 ${width} ${height}`} width={width} height={height} style={{ display: 'block' }}>
      <defs>
        <linearGradient id={id} x1="0" x2="0" y1="0" y2="1">
          <stop offset="0" stopColor={color} stopOpacity="0.28" />
          <stop offset="1" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={area} fill={`url(#${id})`} />
      <path d={path} stroke={color} strokeWidth="1.8" fill="none" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={pts[pts.length - 1][0]} cy={pts[pts.length - 1][1]} r="3" fill={color} />
    </svg>
  );
};

const HeroBalance = ({ theme, accent, balance, history, hide, big }) => {
  const T = theme;
  const points = history.map(h => h.r - h.d);
  const sizeIn = big ? 64 : 44;
  const sizeCents = big ? 32 : 22;
  return (
    <div style={{
      gridColumn: big ? 'span 2' : 'span 1',
      background: T.surface, border: `1px solid ${T.border}`,
      borderRadius: 'var(--r-card)', padding: big ? '28px 30px' : '22px',
      position: 'relative', overflow: 'hidden',
      display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
      minHeight: big ? 200 : undefined,
    }}>
      <div>
        <div style={{ fontSize: 11, color: T.textMute, letterSpacing: 1.2, textTransform: 'uppercase', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8 }}>
          Saldo total
          <span style={{ fontSize: 9, padding: '2px 7px', borderRadius: 4, background: accent.hue + '22', color: accent.hue, fontWeight: 700, letterSpacing: 0.5 }}>ATUAL</span>
        </div>
        <div style={{ fontSize: sizeIn, fontWeight: 600, marginTop: 10, letterSpacing: '-0.035em', fontVariantNumeric: 'tabular-nums', lineHeight: 1, color: T.text }}>
          {hide ? (
            <span style={{ color: T.textFaint }}>R$ ••••••</span>
          ) : (
            <>
              R$ {Math.floor(balance).toLocaleString('pt-BR')}
              <span style={{ color: T.textFaint, fontSize: sizeCents }}>,{(balance.toFixed(2).split('.')[1])}</span>
            </>
          )}
        </div>
        <div style={{ display: 'flex', gap: 14, marginTop: 14, alignItems: 'center', flexWrap: 'wrap' }}>
          <span style={{ fontSize: 12, color: accent.hue, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4 }}>
            <Icon name="arrowUp" size={12} color={accent.hue} strokeWidth={2.2} />8,2%
          </span>
          <span style={{ fontSize: 12, color: T.textMute }}>vs. mês anterior</span>
        </div>
      </div>
      {big && (
        <div style={{ position: 'absolute', right: 24, bottom: 18, opacity: 0.85 }}>
          <Sparkline data={points} color={accent.hue} width={200} height={56} />
        </div>
      )}
    </div>
  );
};

const KpiCard = ({ theme, label, value, hint, hintColor, hide }) => {
  const T = theme;
  return (
    <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 'var(--r-card)', padding: 22 }}>
      <div style={{ fontSize: 11, color: T.textMute, letterSpacing: 1.2, textTransform: 'uppercase', fontWeight: 700 }}>{label}</div>
      <div style={{ fontSize: 26, fontWeight: 600, marginTop: 8, letterSpacing: '-0.025em', fontVariantNumeric: 'tabular-nums', color: T.text }}>
        {hide ? '••••' : value}
      </div>
      <div style={{ fontSize: 11, color: hintColor || T.textMute, marginTop: 10 }}>{hint}</div>
    </div>
  );
};

const FlowChart = ({ theme, accent, history, kind = 'bars' }) => {
  const T = theme;
  const max = Math.max(...history.map(m => Math.max(m.r, m.d))) * 1.05;
  const W = 600, H = 200, padL = 30, padB = 24, padT = 10, padR = 10;
  const innerW = W - padL - padR;
  const innerH = H - padT - padB;
  const stepX = innerW / (history.length - 1);

  const yFor = v => padT + innerH - (v / max) * innerH;
  const xFor = i => padL + i * stepX;

  const incomePath = history.map((h, i) => (i === 0 ? 'M' : 'L') + xFor(i) + ',' + yFor(h.r)).join(' ');
  const expensePath = history.map((h, i) => (i === 0 ? 'M' : 'L') + xFor(i) + ',' + yFor(h.d)).join(' ');
  const incomeArea = incomePath + ` L ${xFor(history.length - 1)},${padT + innerH} L ${padL},${padT + innerH} Z`;
  const expenseArea = expensePath + ` L ${xFor(history.length - 1)},${padT + innerH} L ${padL},${padT + innerH} Z`;

  const ticks = 4;
  const yTicks = Array.from({ length: ticks + 1 }, (_, i) => (max / ticks) * i);

  return (
    <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', height: H, display: 'block' }} preserveAspectRatio="none">
      <defs>
        <linearGradient id="grad-income" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0" stopColor={accent.hue} stopOpacity="0.32" />
          <stop offset="1" stopColor={accent.hue} stopOpacity="0" />
        </linearGradient>
        <linearGradient id="grad-expense" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0" stopColor={T.expenseBar} stopOpacity="0.4" />
          <stop offset="1" stopColor={T.expenseBar} stopOpacity="0" />
        </linearGradient>
      </defs>
      {/* y grid */}
      {yTicks.map((t, i) => (
        <g key={i}>
          <line x1={padL} x2={W - padR} y1={yFor(t)} y2={yFor(t)} stroke={T.border} strokeDasharray={i === 0 ? '0' : '2 4'} />
          <text x={padL - 6} y={yFor(t) + 3} fontSize="9" fill={T.textMute} textAnchor="end" fontFamily="inherit">
            {t >= 1000 ? (t / 1000).toFixed(0) + 'k' : t.toFixed(0)}
          </text>
        </g>
      ))}

      {kind === 'bars' && history.map((m, i) => {
        const cx = xFor(i);
        return (
          <g key={i}>
            <rect x={cx - 9} y={yFor(m.r)} width={8} height={padT + innerH - yFor(m.r)} fill={accent.hue} rx={2} />
            <rect x={cx + 1} y={yFor(m.d)} width={8} height={padT + innerH - yFor(m.d)} fill={T.expenseBar} rx={2} />
          </g>
        );
      })}

      {kind === 'lines' && (
        <>
          <path d={expensePath} stroke={T.expenseBar} strokeWidth="2" fill="none" strokeLinecap="round" />
          <path d={incomePath} stroke={accent.hue} strokeWidth="2.5" fill="none" strokeLinecap="round" />
          {history.map((m, i) => (
            <g key={i}>
              <circle cx={xFor(i)} cy={yFor(m.r)} r={i === history.length - 1 ? 4 : 2.5} fill={accent.hue} />
              <circle cx={xFor(i)} cy={yFor(m.d)} r="2.5" fill={T.expenseBar} />
            </g>
          ))}
        </>
      )}

      {kind === 'area' && (
        <>
          <path d={expenseArea} fill="url(#grad-expense)" />
          <path d={incomeArea} fill="url(#grad-income)" />
          <path d={expensePath} stroke={T.expenseBar} strokeWidth="2" fill="none" strokeLinecap="round" />
          <path d={incomePath} stroke={accent.hue} strokeWidth="2.5" fill="none" strokeLinecap="round" />
        </>
      )}

      {/* x labels */}
      {history.map((m, i) => (
        <text key={i} x={xFor(i)} y={H - 6} fontSize="10" fill={i === history.length - 1 ? T.text : T.textMute}
          textAnchor="middle" fontWeight={i === history.length - 1 ? 700 : 400} fontFamily="inherit">{m.m}</text>
      ))}
    </svg>
  );
};

const CategoryBreakdown = ({ theme, accent, total, hide }) => {
  const T = theme;
  // monochromatic stack of accent shades
  const shades = [accent.hue, accent.deep, accent.soft, accent.tint, T.borderStrong, T.expenseBar];
  const top = CATEGORIES.slice(0, 6);
  const sum = top.reduce((s, c) => s + c.value, 0);
  let acc = 0;
  const stops = top.map((c, i) => {
    const start = acc; acc += (c.value / sum) * 100;
    return `${shades[i]} ${start}% ${acc}%`;
  }).join(', ');

  return (
    <div style={{ display: 'flex', gap: 18, alignItems: 'center' }}>
      <div style={{
        width: 130, height: 130, borderRadius: '50%', flexShrink: 0,
        background: `conic-gradient(${stops})`, position: 'relative',
      }}>
        <div style={{
          position: 'absolute', inset: 18, borderRadius: '50%', background: T.surface,
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        }}>
          <div style={{ fontSize: 9, color: T.textMute, fontWeight: 700, letterSpacing: 1 }}>GASTO</div>
          <div style={{ fontSize: 14, fontWeight: 600, color: T.text, fontVariantNumeric: 'tabular-nums', marginTop: 2 }}>
            {hide ? '•••' : fmtShort(total)}
          </div>
        </div>
      </div>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 9 }}>
        {top.slice(0, 5).map((c, i) => {
          const pct = Math.round((c.value / sum) * 100);
          return (
            <div key={c.id}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                <span style={{ width: 6, height: 6, borderRadius: '50%', background: shades[i] }} />
                <span style={{ fontSize: 12, color: T.text, flex: 1 }}>{c.name}</span>
                <span style={{ fontSize: 11, color: T.textMute, fontVariantNumeric: 'tabular-nums', fontWeight: 600 }}>{pct}%</span>
              </div>
              <div style={{ height: 2, background: T.border, borderRadius: 1, overflow: 'hidden' }}>
                <div style={{ width: `${pct}%`, height: '100%', background: shades[i], transition: 'width 0.4s' }} />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

const TransactionRow = ({ theme, accent, t, hide }) => {
  const T = theme;
  const cat = CATEGORIES.find(c => c.id === t.cat);
  const isIncome = t.value > 0;
  const label = isIncome ? 'Receita' : (cat ? cat.name : '—');
  return (
    <div style={{ display: 'flex', alignItems: 'center', padding: '11px 0', borderTop: `1px solid ${T.border}` }}>
      <div style={{
        width: 30, height: 30, borderRadius: 8,
        background: isIncome ? accent.hue + '22' : T.surfaceAlt,
        border: `1px solid ${isIncome ? accent.hue + '44' : T.border}`,
        marginRight: 12, display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 13, color: isIncome ? accent.hue : T.textDim, fontWeight: 700,
      }}>
        {isIncome ? '↓' : (cat?.icon || '·')}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 13, fontWeight: 500, color: T.text, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{t.name}</div>
        <div style={{ fontSize: 11, color: T.textMute, marginTop: 1 }}>{label} · {t.date}</div>
      </div>
      <div style={{ fontSize: 13, fontWeight: 600, fontVariantNumeric: 'tabular-nums', color: isIncome ? accent.hue : T.text }}>
        {hide ? '••••' : fmt(t.value, { showSign: isIncome })}
      </div>
    </div>
  );
};

const InsightStrip = ({ theme, accent, period }) => {
  const T = theme;
  const monthData = MONTHS_DATA[period];
  const lastDelta = period === 'nov' ? 'Você gastou 17% menos em alimentação.' :
                    period === 'set' ? 'Setembro fechou +R$ 4.590 no seu saldo.' :
                    'No ritmo atual, vai sobrar R$ 5.055 até o fim do mês.';
  return (
    <div style={{
      background: 'linear-gradient(90deg, ' + accent.hue + '14, transparent)',
      border: `1px solid ${accent.hue}33`,
      borderRadius: 12, padding: '11px 16px',
      display: 'flex', alignItems: 'center', gap: 12, marginBottom: 18,
    }}>
      <div style={{ width: 26, height: 26, borderRadius: 8, background: accent.hue + '22', color: accent.hue, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        <Icon name="sparkle" size={14} color={accent.hue} strokeWidth={2} />
      </div>
      <div style={{ fontSize: 12.5, color: T.text, lineHeight: 1.4 }}>
        <span style={{ fontWeight: 600 }}>Insight do mês ·</span>{' '}
        <span style={{ color: T.textDim }}>{lastDelta}</span>
      </div>
    </div>
  );
};

const Dashboard = ({ theme, accent, period, onPeriodChange, hide, onToggleHide, onAddTx, density, chartKind, heroBig, onNav }) => {
  const T = theme;
  const monthData = MONTHS_DATA[period];

  return (
    <div style={{ flex: 1, padding: density === 'compact' ? '22px 28px' : '28px 36px', overflow: 'auto' }}>
      <PageHeader theme={T} accent={accent}
        title={`Bom dia, Bruno.`}
        subtitle={`${monthData.label} 2026 · resumo`}
        period={period} onPeriodChange={onPeriodChange}
        hideBalance={hide} onToggleHide={onToggleHide}
        onAddTx={onAddTx}
      />

      <InsightStrip theme={T} accent={accent} period={period} />

      {/* hero row */}
      <div style={{ display: 'grid', gridTemplateColumns: heroBig ? '1.6fr 1fr 1fr' : '1fr 1fr 1fr 1fr', gap: 14, marginBottom: 14 }}>
        <HeroBalance theme={T} accent={accent} balance={monthData.balance} history={monthData.history} hide={hide} big={heroBig} />
        <KpiCard theme={T} label="Receitas" value={fmt(monthData.income)} hint={`+ R$ 600 vs. ${period === 'out' ? 'set' : 'mês ant.'}`} hintColor={accent.hue} hide={hide} />
        <KpiCard theme={T} label="Despesas" value={fmt(monthData.expense)} hint={`${monthData.txCount} transações`} hide={hide} />
        {!heroBig && <KpiCard theme={T} label="Sobrou" value={fmt(monthData.income - monthData.expense)} hint="taxa de poupança 57%" hintColor={accent.hue} hide={hide} />}
      </div>

      {/* charts */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: 14, marginBottom: 14 }}>
        <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 'var(--r-card)', padding: 22 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <div>
              <div style={{ fontSize: 14, fontWeight: 600, color: T.text }}>Receitas e despesas</div>
              <div style={{ fontSize: 11, color: T.textMute, marginTop: 2 }}>Últimos 6 meses · em R$</div>
            </div>
            <div style={{ display: 'flex', gap: 14, fontSize: 11 }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: 6, color: T.textDim }}>
                <span style={{ width: 8, height: 8, borderRadius: 2, background: accent.hue }} /> Receita
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: 6, color: T.textDim }}>
                <span style={{ width: 8, height: 8, borderRadius: 2, background: T.expenseBar }} /> Despesa
              </span>
            </div>
          </div>
          <FlowChart theme={T} accent={accent} history={monthData.history} kind={chartKind} />
        </div>

        <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 'var(--r-card)', padding: 22 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <div>
              <div style={{ fontSize: 14, fontWeight: 600, color: T.text }}>Onde foi o dinheiro</div>
              <div style={{ fontSize: 11, color: T.textMute, marginTop: 2 }}>{monthData.label} · {hide ? '•••' : fmt(monthData.expense)}</div>
            </div>
            <button onClick={() => onNav('relatorios')} style={{ background: 'transparent', border: 0, color: accent.hue, fontSize: 11, cursor: 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: 4 }}>
              detalhes <Icon name="chevronRight" size={12} color={accent.hue} />
            </button>
          </div>
          <CategoryBreakdown theme={T} accent={accent} total={monthData.expense} hide={hide} />
        </div>
      </div>

      {/* transactions */}
      <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 'var(--r-card)', padding: 20 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
          <div>
            <div style={{ fontSize: 14, fontWeight: 600, color: T.text }}>Últimas transações</div>
            <div style={{ fontSize: 11, color: T.textMute, marginTop: 2 }}>{TRANSACTIONS.length} este mês</div>
          </div>
          <button onClick={() => onNav('transacoes')} style={{
            background: 'transparent', border: `1px solid ${T.border}`, color: T.textDim,
            padding: '6px 12px', borderRadius: 8, fontSize: 11, cursor: 'pointer', fontFamily: 'inherit',
            display: 'flex', alignItems: 'center', gap: 6,
          }}>
            Ver todas <Icon name="arrowRight" size={12} />
          </button>
        </div>
        {TRANSACTIONS.slice(0, 5).map(t => (
          <TransactionRow key={t.id} theme={T} accent={accent} t={t} hide={hide} />
        ))}
      </div>
    </div>
  );
};

window.Dashboard = Dashboard;
