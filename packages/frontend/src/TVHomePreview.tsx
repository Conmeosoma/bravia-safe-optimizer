import { useRef, useState, type KeyboardEvent } from 'react';
import { ArrowLeft, ArrowRight, Check, GearSix, Info, Play, ShieldCheck, X, YoutubeLogo } from '@phosphor-icons/react';
import type { Inventory } from '../../shared/src/index';
import catalog from './data/curated-apps.json';
import vi from './i18n/vi.json';
import './tv-home.css';

const appIds = ['vtvgo', 'youtube', 'netflix'] as const;
type AppId = typeof appIds[number];

interface DashboardHome {
  navigate: (page: keyof typeof vi.nav) => void;
  inventory: Inventory | null;
  badge: keyof typeof vi.badge;
  error: string;
  model: string | null;
}
export function TVHomePreview({ dashboard }: { dashboard?: DashboardHome }) {
  const [selected, setSelected] = useState<AppId>('vtvgo');
  const [dialog, setDialog] = useState<AppId | 'settings' | null>(null);
  const cardRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const closeRef = useRef<HTMLButtonElement | null>(null);
  const previousFocus = useRef<HTMLElement | null>(null);
  function openDialog(value: AppId | 'settings') {
    previousFocus.current = document.activeElement as HTMLElement | null;
    setDialog(value);
    requestAnimationFrame(() => closeRef.current?.focus());
  }
  function closeDialog() { setDialog(null); previousFocus.current?.focus(); }
  function focusCard(index: number) { cardRefs.current[(index + appIds.length) % appIds.length]?.focus(); }
  function navigateApps(event: KeyboardEvent<HTMLElement>) {
    if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
    event.preventDefault();
    const index = appIds.indexOf(selected);
    focusCard(event.key === 'Home' ? 0 : event.key === 'End' ? 2 : index + (event.key === 'ArrowRight' ? 1 : -1));
  }
  return <div className={`tv-home-preview theme-${selected} ${dashboard ? 'tv-dashboard-home' : ''}`}>
    <div className="cinema-background" aria-hidden="true"><div className="cinema-landscape"/><div className="cinema-vignette"/></div>
    <a className="tv-skip" href="#tv-apps">{vi.tvPreview.skip}</a>
    <header className="tv-topbar">
      <a className="tv-brand" href="/" aria-label={vi.tvPreview.backDashboard} onClick={event => { if (dashboard) { event.preventDefault(); dashboard.navigate('overview'); } }}>{vi.brand}<span>{vi.tvPreview.edition}</span></a>
      <nav className="tv-navigation" aria-label={vi.tvPreview.navigation}>
        {dashboard ? (Object.keys(vi.nav) as (keyof typeof vi.nav)[]).map(key => <button key={key} className={key === 'overview' ? 'tv-nav-active' : ''} aria-current={key === 'overview' ? 'page' : undefined} onClick={() => dashboard.navigate(key)}>{vi.nav[key]}</button>) : <><button className="tv-nav-active" onClick={() => focusCard(0)}>{vi.tvPreview.home}</button><button onClick={() => focusCard(appIds.indexOf(selected))}>{vi.nav.apps}</button></>}
      </nav>
      <div className="tv-top-actions">{dashboard ? <><span className="readonly"><ShieldCheck size={15}/>{vi.mode}</span><div className={`badge ${dashboard.badge}`} role="status"><span/>{vi.badge[dashboard.badge]}</div></> : <span className="tv-preview-badge"><span/>{vi.tvPreview.preview}</span>}<button className="tv-icon-button" aria-label={dashboard ? vi.connectionDetails : vi.tvPreview.settings} onClick={() => dashboard ? dashboard.navigate('connection') : openDialog('settings')}><GearSix size={23}/></button></div>
    </header>
    <main className="tv-living-room">
      {dashboard?.error && <div className="alert" role="alert">{dashboard.error}</div>}
      <section className="cinema-intro" aria-labelledby="tv-title">
        <p className="tv-eyebrow"><span/>{vi.tvPreview.eyebrow}</p>
        <h1 id="tv-title">{vi.tvPreview.titleLineOne}<br/><span>{vi.tvPreview.titleLineTwo}</span></h1>
        <p className="tv-intro-copy">{vi.tvPreview.intro}</p>
        {dashboard && <p className="tv-device-context">{dashboard.model ?? vi.noDevice}</p>}
        <button className="tv-primary" onClick={() => dashboard ? dashboard.navigate(dashboard.model ? 'apps' : 'connection') : focusCard(0)}><Play size={18} weight="fill"/>{dashboard ? dashboard.model ? vi.manageApps : vi.start : vi.tvPreview.explore}<ArrowRight size={17}/></button>
      </section>
      <section className="tv-app-section" id="tv-apps" aria-labelledby="tv-apps-title">
        <div className="tv-section-heading"><div><p className="tv-eyebrow">{vi.tvPreview.collection}</p><h2 id="tv-apps-title">{vi.favoriteTitle}</h2></div><span className="tv-collection-count">{vi.tvPreview.collectionCount}</span></div>
        <div className="tv-app-dock" onKeyDown={navigateApps} role="group" aria-label={vi.favoriteTitle}>
          {appIds.map((id, index) => {
            const item = dashboard?.inventory?.packages.find(p => p.name === catalog.find(app => app.id === id)?.packageName);
            const status = !dashboard?.inventory ? vi.notScanned : !item ? vi.notInScan : item.enabled ? vi.enabled : vi.disabled;
            return <button key={id} ref={element => { cardRefs.current[index] = element; }} className={`tv-app-card tv-card-${id} ${selected === id ? 'tv-app-selected' : ''}`} aria-pressed={selected === id} onFocus={() => setSelected(id)} onClick={() => { setSelected(id); if (dashboard) dashboard.navigate('apps'); else openDialog(id); }}>
            <span className="tv-card-index">0{index + 1}</span>
            <span className={`tv-app-wordmark wordmark-${id}`}>{id === 'youtube' && <YoutubeLogo size={52} weight="fill"/>}{vi.favoriteNames[id]}</span>
            <span className="tv-card-footer"><span>{vi.favoriteDescriptions[id]}</span>{dashboard ? <span className="app-state">{status}</span> : <ArrowRight size={20}/>}</span>
            <span className="tv-card-selected-mark" aria-hidden="true">{selected === id && <Check size={17}/>}</span>
          </button>; })}
        </div>
        <div className="tv-focus-info"><span><Info size={16}/>{dashboard ? vi.dashboardAppHelp : vi.tvPreview.interactionHelp}</span><span className="tv-keyboard-help"><kbd>←</kbd><kbd>→</kbd>{vi.tvPreview.navigate}<span className="tv-key-separator"/><kbd>Enter</kbd>{vi.tvPreview.details}</span></div>
      </section>
    </main>
    <footer className="tv-preview-footer"><span>{dashboard ? vi.privacy : vi.tvPreview.designNote}</span>{dashboard ? <span>{vi.footer}</span> : <a href="/"><ArrowLeft size={16}/>{vi.tvPreview.backDashboard}</a>}</footer>
    {dialog && <div className="tv-modal-backdrop" onClick={closeDialog}>
      <section className="tv-modal" role="dialog" aria-modal="true" aria-labelledby="tv-dialog-title" onClick={event => event.stopPropagation()} onKeyDown={event => {
        if (event.key === 'Escape') { event.preventDefault(); closeDialog(); }
        if (event.key === 'Tab') { event.preventDefault(); closeRef.current?.focus(); }
      }}>
        <button ref={closeRef} className="tv-icon-button tv-modal-close" aria-label={vi.tvPreview.close} onClick={closeDialog}><X size={23}/></button>
        <p className="tv-eyebrow">{vi.tvPreview.preview}</p>
        <h2 id="tv-dialog-title">{dialog === 'settings' ? vi.tvPreview.settings : vi.favoriteNames[dialog]}</h2>
        <p>{dialog === 'settings' ? vi.tvPreview.settingsCopy : vi.favoriteDescriptions[dialog]}</p>
        <div className="tv-modal-note"><Info size={20}/><p>{vi.tvPreview.modalNote}</p></div>
      </section>
    </div>}
  </div>;
}
