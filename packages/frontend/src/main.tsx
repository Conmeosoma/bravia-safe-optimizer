import React, { useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { validAdbPath, validIp, validPort, validPairingCode, type Device, type DeviceIdentity, type DeviceInfo, type Inventory, type Reading } from '../../shared/src/index';
import vi from './i18n/vi.json';
import './style.css';
import { ApiError, loadSession, postApi, scanAvailableDevices } from './api';
import { CirclesFour, Cpu, GridFour, ShieldCheck, TelevisionSimple, WifiHigh } from '@phosphor-icons/react';
import { FavoriteApps } from './FavoriteApps';
import { TVHomePreview } from './TVHomePreview';

type Page = keyof typeof vi.nav;
type Badge = keyof typeof vi.badge;
type Selection = { serial: string; identity: DeviceIdentity; ticket: string };
const pageIcons = { overview: GridFour, connection: WifiHigh, device: Cpu, apps: CirclesFour };
function Identity({ identity }: { identity: DeviceIdentity }) {
  return <dl className="details">{(Object.keys(vi.identity) as (keyof DeviceIdentity)[]).map(key => <div key={key}><dt>{vi.identity[key]}</dt><dd>{identity[key] ?? vi.optionalId}</dd></div>)}</dl>;
}
function reading<T>(value: Reading<T>, render: (value: T) => React.ReactNode = value => String(value)): React.ReactNode {
  return value.available ? render(value.value) : <span className="unavailable">{vi.unavailable}<small>{value.reason}</small></span>;
}
function App() {
  const [page, setPage] = useState<Page>('overview');
  const [token, setToken] = useState('');
  const [candidates, setCandidates] = useState<string[]>([]);
  const [adbPath, setAdbPath] = useState('');
  const [ready, setReady] = useState(false);
  const [version, setVersion] = useState('');
  const [devices, setDevices] = useState<Device[] | null>(null);
  const [scannedAt, setScannedAt] = useState<string | null>(null);
  const [selection, setSelection] = useState<Selection | null>(null);
  const [confirmed, setConfirmed] = useState(false);
  const [info, setInfo] = useState<DeviceInfo | null>(null);
  const [inventory, setInventory] = useState<Inventory | null>(null);
  const [badge, setBadge] = useState<Badge>('idle');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [method, setMethod] = useState<'pair' | 'legacy'>('pair');
  const [ip, setIp] = useState(''); const [pairPort, setPairPort] = useState('');
  const [connectPort, setConnectPort] = useState(''); const [code, setCode] = useState('');
  const [commands, setCommands] = useState<{ pair?: string; connect: string } | null>(null);
  const [wirelessError, setWirelessError] = useState('');
  const [query, setQuery] = useState(''); const [kind, setKind] = useState('all');
  const [showAllPackages, setShowAllPackages] = useState(false);
  function reset() { setSelection(null); setConfirmed(false); setInfo(null); setInventory(null); }
  useEffect(() => {
    const controller = new AbortController();
    loadSession(controller.signal).then(data => {
      setToken(data.token); setCandidates(data.candidates); setAdbPath(data.configuredPath ?? data.candidates[0] ?? ''); setReady(Boolean(data.configuredPath));
    }).catch(() => { if (!controller.signal.aborted) { setError(vi.networkError); setBadge('error'); } });
    return () => controller.abort();
  }, []);
  async function api<T>(route: string, input: object = {}): Promise<T> {
    return postApi<T>(token, route, input);
  }
  async function act(work: () => Promise<void>) {
    if (busy) return;
    setBusy(true); setError(''); setBadge('connecting');
    try { await work(); }
    catch (e) { reset(); setError(e instanceof Error ? e.message : vi.requestError); setBadge(e instanceof ApiError && e.code === 'UNAUTHORIZED' ? 'unauthorized' : 'error'); }
    finally { setBusy(false); }
  }
  function preview() {
    if (!validAdbPath(adbPath) || !validIp(ip) || !validPort(connectPort) || (method === 'pair' && (!validPort(pairPort) || !validPairingCode(code)))) {
      setWirelessError(vi.invalidWireless); setCommands(null); return;
    }
    const executable = "& '" + adbPath.replace(/'/g, "''") + "'";
    setCommands({ pair: method === 'pair' ? `${executable} pair ${ip}:${pairPort}` : undefined, connect: `${executable} connect ${ip}:${connectPort}` });
    setCode(''); setWirelessError('');
  }
  const navigate = (next: Page) => { setPage(next); };
  const filtered = inventory?.packages.filter(p => p.name.toLowerCase().includes(query.toLowerCase()) && (kind === 'all' || p.kind === kind)) ?? [];
  if (page === 'overview') return <TVHomePreview dashboard={{ navigate, inventory, badge, error, model: confirmed && selection ? selection.identity.model : null }}/>;
  return <div className="shell dashboard-tv">
    <a className="skip" href="#main">{vi.skip}</a>
    <aside className="sidebar">
      <div className="brand"><span className="brand-mark" aria-hidden="true"><TelevisionSimple size={24}/></span><div><strong>{vi.brand}</strong><span>{vi.product}</span></div></div>
      <p className="eyebrow sidebar-caption">{vi.local}</p>
      <nav aria-label={vi.local}>{(Object.keys(vi.nav) as Page[]).map(key => { const Icon = pageIcons[key]; return <button key={key} className={page === key ? 'nav-active' : ''} aria-current={page === key ? 'page' : undefined} onClick={() => navigate(key)}><Icon size={20} aria-hidden="true"/>{vi.nav[key]}</button>; })}</nav>
      <div className="sidebar-bottom"><div className="readonly"><ShieldCheck size={15} aria-hidden="true"/>{vi.mode}</div><p>{vi.modeHelp}</p><small>{vi.footer}</small></div>
    </aside>
    <div className="workspace">
      <header className="topbar"><span><span className="session-dot"/>{vi.localSession}</span><div className={`badge ${badge}`} role="status"><span aria-hidden="true"/>{vi.badge[badge]}</div></header>
      <main id="main" tabIndex={-1}>
        <div className="page-heading"><p className="eyebrow">{vi.nav[page]} / {vi.phaseNote}</p><h1>{vi.titles[page]}</h1><p>{vi.subtitles[page]}</p></div>
        {error && <div className="alert" role="alert">{error}</div>}
        {busy && <div className="loading" role="status">{vi.busy}<div className="loading-line"/></div>}
        {page === 'connection' && <>
          <section className="panel"><h2>{vi.adbTitle}</h2><p>{vi.downloadHelp}</p><a href="https://developer.android.com/tools/releases/platform-tools" target="_blank" rel="noreferrer">{vi.download}</a>
            {candidates.length > 0 && <label>{vi.candidates}<select value={candidates.includes(adbPath) ? adbPath : ''} onChange={e => { setAdbPath(e.target.value); setReady(false); reset(); setBadge('idle'); setCommands(null); }}><option value="">{vi.customPath}</option>{candidates.map(path => <option key={path}>{path}</option>)}</select></label>}
            <label>{vi.adbLabel}<input value={adbPath} disabled={busy} onChange={e => { setAdbPath(e.target.value); setReady(false); setVersion(''); reset(); setBadge('idle'); setCommands(null); }} placeholder={vi.adbPlaceholder} spellCheck={false}/></label>
            <button disabled={busy || !validAdbPath(adbPath)} onClick={() => void act(async () => { reset(); setReady(false); const session = await loadSession(); setToken(session.token); const result = await postApi<{version: string}>(session.token, 'adb/configure', { path: adbPath }); setVersion(result.version); setReady(true); setBadge('idle'); })}>{vi.checkAdb}</button>
            {version && <div className="success"><strong>{vi.adbReady}</strong><pre>{version}</pre></div>}
          </section>
          <section className="panel"><h2>{vi.usbTitle}</h2><p>{vi.usbNote}</p><button className="primary" disabled={busy || !validAdbPath(adbPath)} onClick={() => void act(async () => { reset(); setDevices(null); setScannedAt(null); const result = await scanAvailableDevices(adbPath); setToken(result.session.token); setCandidates(result.session.candidates); setReady(true); setDevices(result.devices); setScannedAt(new Date().toISOString()); setBadge(result.devices.some(d => d.state === 'unauthorized') ? 'unauthorized' : 'idle'); })}>{vi.scan}</button>
            {!validAdbPath(adbPath) && <p className="notice">{vi.scanNeedsPath}</p>}
            {!ready && validAdbPath(adbPath) && <p className="fineprint">{vi.scanConfiguresAdb}</p>}
            {scannedAt && devices && <div className="success" role="status"><strong>{vi.scanComplete}: {devices.length} {vi.deviceCount}</strong><p>{vi.scannedAt}: {new Date(scannedAt).toLocaleTimeString('vi-VN')}</p>{devices.length > 0 && <p>{vi.selectNext}</p>}</div>}
            {devices?.length === 0 && <div className="empty compact"><h3>{vi.noUsb}</h3><p>{vi.noUsbHelp}</p></div>}
            {devices && devices.length > 1 && <p className="notice">{vi.manyDevices}</p>}
            {devices && devices.length > 0 && <div className="device-list">{devices.map(device => <div className="device-row" key={device.serial}><div><code>{device.serial}</code><p>{vi.state[device.state]}</p><small>{device.details}</small></div><button disabled={busy || device.state !== 'device'} onClick={() => void act(async () => { reset(); const result = await api<Selection>('select', { serial: device.serial }); setSelection(result); setBadge('idle'); })}>{vi.choose}</button></div>)}</div>}
          </section>
          <section className="panel"><h2>{vi.wirelessTitle}</h2><p>{vi.wirelessHelp}</p><div className="segmented"><button aria-pressed={method === 'pair'} onClick={() => { setMethod('pair'); setCommands(null); }}>{vi.pairMode}</button><button aria-pressed={method === 'legacy'} onClick={() => { setMethod('legacy'); setCommands(null); }}>{vi.legacyMode}</button></div><p>{method === 'pair' ? vi.pairHelp : vi.legacyHelp}</p>
            <div className="form-grid"><label>{vi.ip}<input value={ip} onChange={e => { setIp(e.target.value); setCommands(null); }} inputMode="decimal"/></label>{method === 'pair' && <label>{vi.pairPort}<input value={pairPort} onChange={e => { setPairPort(e.target.value); setCommands(null); }} inputMode="numeric"/></label>}<label>{vi.connectPort}<input value={connectPort} onChange={e => { setConnectPort(e.target.value); setCommands(null); }} inputMode="numeric"/></label>{method === 'pair' && <label>{vi.pairCode}<input type="password" autoComplete="off" maxLength={6} value={code} onChange={e => { setCode(e.target.value); setCommands(null); }} inputMode="numeric"/></label>}</div>
            <button onClick={preview}>{vi.preview}</button>{wirelessError && <p className="notice" role="alert">{wirelessError}</p>}<p className="notice">{vi.manualOnly}</p>
            {commands && <div className="commands">{commands.pair && <><h3>{vi.pairCommand}</h3><pre>{commands.pair}</pre><p>{vi.manualCode}</p></>}<h3>{vi.connectCommand}</h3><pre>{commands.connect}</pre></div>}<p>{vi.wirelessTrouble}</p>
          </section>
          {selection && <section className="panel identity-panel"><h2>{vi.identityTitle}</h2><p>{vi.identityHelp}</p><Identity identity={selection.identity}/><p><strong>{vi.serial}: </strong><code>{selection.serial}</code></p><p>{vi.transportHelp}</p><button className="primary" disabled={busy || confirmed} onClick={() => void act(async () => { await api('confirm', { ticket: selection.ticket }); setConfirmed(true); setBadge('connected'); })}>{confirmed ? vi.confirmed : vi.confirm}</button></section>}
        </>}
        {page === 'device' && <>
          {!confirmed ? <Empty onConnect={() => navigate('connection')}/> : <><button className="primary" disabled={busy} onClick={() => void act(async () => { setInfo(null); setInfo(await api<DeviceInfo>('inspect')); setBadge('connected'); })}>{vi.scanInfo}</button>{info ? <section className="panel info-panel"><Identity identity={info.identity}/><dl className="details"><div><dt>{vi.release}</dt><dd>{reading(info.release)}</dd></div><div><dt>{vi.api}</dt><dd>{reading(info.api)}</dd></div><div><dt>{vi.abi}</dt><dd>{reading(info.abi)}</dd></div><div><dt>{vi.uptime}</dt><dd>{reading(info.uptimeSeconds, n => n.toLocaleString('vi-VN'))}</dd></div><div><dt>{vi.memory}</dt><dd>{reading(info.memory, v => `${vi.total}: ${v.totalKiB.toLocaleString('vi-VN')} · ${vi.available}: ${v.availableKiB.toLocaleString('vi-VN')}`)}</dd></div><div><dt>{vi.storage}</dt><dd>{reading(info.storage, v => `${vi.total}: ${v.totalKiB.toLocaleString('vi-VN')} · ${vi.available}: ${v.availableKiB.toLocaleString('vi-VN')}`)}</dd></div><div><dt>{vi.launcher}</dt><dd>{reading(info.launcher)}</dd></div></dl><p className="fineprint">{vi.scannedAt}: {new Date(info.scannedAt).toLocaleString('vi-VN')}<br/>{vi.historical}</p></section> : <p className="empty compact">{vi.notRead}</p>}</>}
        </>}
        {page === 'apps' && <>
          <FavoriteApps inventory={inventory}/><p className="fineprint favorite-note">{vi.favoriteHelp}</p>
          {!confirmed ? <Empty onConnect={() => navigate('connection')}/> : <><button className="primary" disabled={busy} onClick={() => void act(async () => { setInventory(null); setInventory(await api<Inventory>('packages')); setBadge('connected'); })}>{vi.scanApps}</button>{inventory ? <section className="panel inventory"><div className="section-heading"><h2>{vi.technicalInventory}</h2><button className="text-button" aria-expanded={showAllPackages} onClick={() => setShowAllPackages(!showAllPackages)}>{showAllPackages ? vi.hideAllPackages : vi.showAllPackages}</button></div>{showAllPackages && <><div className="table-controls"><label>{vi.search}<input type="search" value={query} onChange={e => setQuery(e.target.value)}/></label><label>{vi.kind}<select value={kind} onChange={e => setKind(e.target.value)}><option value="all">{vi.all}</option><option value="system">{vi.system}</option><option value="third-party">{vi.thirdParty}</option></select></label></div><p className="fineprint">{vi.results}: {filtered.length} · {vi.scannedAt}: {new Date(inventory.scannedAt).toLocaleString('vi-VN')}</p><div className="table-scroll"><table><thead><tr><th>{vi.package}</th><th>{vi.kind}</th><th>{vi.enabledState}</th></tr></thead><tbody>{filtered.map(p => <tr key={p.name}><td><code>{p.name}</code></td><td>{p.kind === 'system' ? vi.system : vi.thirdParty}</td><td><span className={p.enabled ? 'state-enabled' : 'state-disabled'}>{p.enabled ? vi.enabled : vi.disabled}</span></td></tr>)}</tbody></table></div>{filtered.length === 0 && <p>{vi.noResults}</p>}<p className="fineprint">{vi.historical}</p></>}</section> : <p className="empty compact">{vi.inventoryEmpty}</p>}</>}
        </>}
      </main>
    </div>
  </div>;
}
function Empty({ onConnect }: { onConnect: () => void }) { return <section className="panel empty"><div className="empty-mark" aria-hidden="true"><TelevisionSimple size={30}/></div><h2>{vi.noDevice}</h2><p>{vi.noDeviceText}</p><button onClick={onConnect}>{vi.start}</button></section>; }
const previewTv = new URLSearchParams(window.location.search).get('preview') === 'tv';
createRoot(document.getElementById('root')!).render(<React.StrictMode>{previewTv ? <TVHomePreview/> : <App/>}</React.StrictMode>);
