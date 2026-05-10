// Shared UI: Logo (W mantida), Sidebar, Header, icons
const { THEMES, ACCENTS, MONTHS_DATA, CATEGORIES, TRANSACTIONS, fmt, fmtShort } = window.WALLETY;

const Logo = ({ size = 28, accent = '#3b82f6', mode = 'dark' }) => (
  <div style={{
    width: size, height: size, borderRadius: size * 0.28,
    background: `linear-gradient(135deg, ${accent}, ${accent}dd)`,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    color: '#fff', fontWeight: 800, fontSize: size * 0.55,
    fontFamily: 'inherit', letterSpacing: '-0.04em', flexShrink: 0,
    boxShadow: mode === 'dark' ? `0 0 0 1px ${accent}33, 0 6px 18px ${accent}33` : `0 4px 12px ${accent}40`,
  }}>W</div>
);

// minimalist line icons
const Icon = ({ name, size = 16, color = 'currentColor', strokeWidth = 1.6 }) => {
  const paths = {
    home: <><path d="M3 11l9-8 9 8" /><path d="M5 10v10h14V10" /></>,
    list: <><path d="M8 6h13M8 12h13M8 18h13" /><circle cx="3" cy="6" r="1" fill={color} /><circle cx="3" cy="12" r="1" fill={color} /><circle cx="3" cy="18" r="1" fill={color} /></>,
    target: <><circle cx="12" cy="12" r="9" /><circle cx="12" cy="12" r="5" /><circle cx="12" cy="12" r="1.5" fill={color} stroke="none" /></>,
    chart: <><path d="M3 3v18h18" /><path d="M7 14l4-4 4 4 5-7" /></>,
    settings: <><circle cx="12" cy="12" r="3" /><path d="M19 12a7 7 0 0 0-.1-1.2l2-1.6-2-3.4-2.4 1a7 7 0 0 0-2-1.2L14 3h-4l-.5 2.6a7 7 0 0 0-2 1.2l-2.4-1-2 3.4 2 1.6A7 7 0 0 0 5 12c0 .4 0 .8.1 1.2l-2 1.6 2 3.4 2.4-1c.6.5 1.3.9 2 1.2L10 21h4l.5-2.6a7 7 0 0 0 2-1.2l2.4 1 2-3.4-2-1.6c.1-.4.1-.8.1-1.2z" /></>,
    eye: <><path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7-10-7-10-7z" /><circle cx="12" cy="12" r="3" /></>,
    eyeOff: <><path d="M2 12s4-7 10-7c2 0 3.7.6 5.2 1.5M22 12s-4 7-10 7c-2 0-3.7-.6-5.2-1.5" /><path d="M9.9 9.9a3 3 0 0 0 4.2 4.2" /><path d="M3 3l18 18" /></>,
    plus: <><path d="M12 5v14M5 12h14" /></>,
    arrowRight: <><path d="M5 12h14M13 5l7 7-7 7" /></>,
    arrowUp: <><path d="M12 19V5M5 12l7-7 7 7" /></>,
    arrowDown: <><path d="M12 5v14M5 12l7 7 7-7" /></>,
    bell: <><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" /><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" /></>,
    search: <><circle cx="11" cy="11" r="7" /><path d="M21 21l-4.3-4.3" /></>,
    filter: <><path d="M3 6h18M6 12h12M10 18h4" /></>,
    calendar: <><rect x="3" y="5" width="18" height="16" rx="2" /><path d="M3 9h18M8 3v4M16 3v4" /></>,
    chevronDown: <><path d="M6 9l6 6 6-6" /></>,
    chevronRight: <><path d="M9 6l6 6-6 6" /></>,
    chevronLeft: <><path d="M15 6l-6 6 6 6" /></>,
    x: <><path d="M6 6l12 12M6 18L18 6" /></>,
    sun: <><circle cx="12" cy="12" r="4" /><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" /></>,
    moon: <><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" /></>,
    wallet: <><path d="M3 7a2 2 0 0 1 2-2h14v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /><path d="M3 7v10" /><circle cx="16" cy="13" r="1" fill={color} /></>,
    sparkle: <><path d="M12 3l1.5 5L19 9.5 13.5 11 12 16l-1.5-5L5 9.5 10.5 8z" /></>,
  };
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
      {paths[name]}
    </svg>
  );
};

const Sidebar = ({ theme, accent, current, onNav, density = 'cozy' }) => {
  const T = theme;
  const items = [
    { id: 'dashboard', label: 'Visão geral', icon: 'home' },
    { id: 'transacoes', label: 'Transações', icon: 'list' },
    { id: 'metas', label: 'Metas', icon: 'target' },
    { id: 'relatorios', label: 'Relatórios', icon: 'chart' },
  ];
  const items2 = [
    { id: 'configuracoes', label: 'Configurações', icon: 'settings' },
  ];

  const padV = density === 'compact' ? 7 : 10;

  return (
    <aside style={{
      width: 232, padding: '24px 14px', borderRight: `1px solid ${T.border}`,
      display: 'flex', flexDirection: 'column', flexShrink: 0,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 11, marginBottom: 32, padding: '0 8px' }}>
        <Logo accent={accent.hue} size={28} />
        <span style={{ fontWeight: 700, fontSize: 16, letterSpacing: '-0.02em', color: T.text }}>Wallety</span>
      </div>

      <div style={{ fontSize: 10, color: T.textFaint, textTransform: 'uppercase', letterSpacing: 1.2, fontWeight: 700, padding: '0 12px', marginBottom: 8 }}>
        Geral
      </div>
      {items.map(it => {
        const active = current === it.id;
        return (
          <button key={it.id} onClick={() => onNav(it.id)} style={{
            background: active ? T.surfaceAlt : 'transparent',
            border: 0, padding: `${padV}px 12px`, borderRadius: 9,
            display: 'flex', alignItems: 'center', gap: 11,
            color: active ? T.text : T.textDim,
            fontWeight: active ? 600 : 500, fontSize: 13,
            cursor: 'pointer', textAlign: 'left', marginBottom: 2,
            position: 'relative', fontFamily: 'inherit',
            transition: 'background 0.15s, color 0.15s',
          }}>
            {active && <div style={{ position: 'absolute', left: -14, top: 8, bottom: 8, width: 2, background: accent.hue, borderRadius: 2 }} />}
            <Icon name={it.icon} size={16} color={active ? accent.hue : T.textMute} strokeWidth={1.6} />
            {it.label}
          </button>
        );
      })}

      <div style={{ flex: 1 }} />

      {items2.map(it => {
        const active = current === it.id;
        return (
          <button key={it.id} onClick={() => onNav(it.id)} style={{
            background: active ? T.surfaceAlt : 'transparent',
            border: 0, padding: `${padV}px 12px`, borderRadius: 9,
            display: 'flex', alignItems: 'center', gap: 11,
            color: active ? T.text : T.textDim,
            fontWeight: active ? 600 : 500, fontSize: 13,
            cursor: 'pointer', textAlign: 'left', marginBottom: 2,
            fontFamily: 'inherit',
          }}>
            <Icon name={it.icon} size={16} color={active ? accent.hue : T.textMute} strokeWidth={1.6} />
            {it.label}
          </button>
        );
      })}

      {/* user card */}
      <div style={{ marginTop: 12, padding: '10px 10px', borderRadius: 12, background: T.surfaceAlt, display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{ width: 32, height: 32, borderRadius: '50%', background: `linear-gradient(135deg, ${accent.hue}, ${accent.deep})`, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700 }}>BR</div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: T.text, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>Bruno Reis</div>
          <div style={{ fontSize: 10, color: T.textMute }}>Plano grátis</div>
        </div>
      </div>
    </aside>
  );
};

const PageHeader = ({ theme, accent, title, subtitle, period, onPeriodChange, hideBalance, onToggleHide, onAddTx }) => {
  const T = theme;
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 24, gap: 16 }}>
      <div>
        <div style={{ fontSize: 11, color: T.textMute, letterSpacing: 1.2, textTransform: 'uppercase', fontWeight: 700, marginBottom: 6 }}>{subtitle}</div>
        <h1 style={{ fontSize: 28, fontWeight: 600, margin: 0, letterSpacing: '-0.03em', color: T.text }}>{title}</h1>
      </div>
      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
        <button onClick={onToggleHide} title={hideBalance ? 'Mostrar saldo' : 'Ocultar saldo'} style={{
          background: 'transparent', border: `1px solid ${T.border}`, color: T.textDim,
          padding: 9, borderRadius: 9, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <Icon name={hideBalance ? 'eyeOff' : 'eye'} size={16} />
        </button>
        <select value={period} onChange={e => onPeriodChange(e.target.value)} style={{
          background: 'transparent', border: `1px solid ${T.border}`, color: T.text,
          padding: '9px 12px', borderRadius: 9, fontSize: 12, fontWeight: 500,
          fontFamily: 'inherit', cursor: 'pointer', appearance: 'none',
          backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='${encodeURIComponent(T.textDim)}' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E")`,
          backgroundRepeat: 'no-repeat', backgroundPosition: 'right 10px center', paddingRight: 30,
        }}>
          <option value="set">Setembro</option>
          <option value="out">Outubro</option>
          <option value="nov">Novembro</option>
        </select>
        <button onClick={onAddTx} style={{
          background: accent.hue, border: 0, color: '#fff',
          padding: '9px 16px', borderRadius: 9, fontSize: 12, fontWeight: 600,
          cursor: 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: 6,
        }}>
          <Icon name="plus" size={14} strokeWidth={2.2} color="#fff" />
          Nova transação
        </button>
      </div>
    </div>
  );
};

const ThemeToggle = ({ theme, mode, onToggle }) => (
  <button onClick={onToggle} title="Trocar tema" style={{
    position: 'fixed', top: 16, right: 16, zIndex: 50,
    width: 36, height: 36, borderRadius: 18,
    background: theme.surfaceAlt, border: `1px solid ${theme.border}`,
    color: theme.textDim, cursor: 'pointer',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
  }}>
    <Icon name={mode === 'dark' ? 'sun' : 'moon'} size={16} />
  </button>
);

Object.assign(window, { Logo, Icon, Sidebar, PageHeader, ThemeToggle });
