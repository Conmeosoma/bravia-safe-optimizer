import { ArrowUpRight, Play, TelevisionSimple } from '@phosphor-icons/react';
import type { Inventory } from '../../shared/src/index';
import catalog from './data/curated-apps.json';
import vi from './i18n/vi.json';

export function FavoriteApps({ inventory }: { inventory: Inventory | null }) {
  return <div className="favorite-grid">{catalog.map(app => {
    const id = app.id as keyof typeof vi.favoriteNames;
    const scanned = inventory?.packages.find(p => p.name === app.packageName);
    const status = !inventory ? vi.notScanned : !scanned ? vi.notInScan : scanned.enabled ? vi.enabled : vi.disabled;
    return <article key={app.id} className={`favorite-card favorite-${app.id}`}>
      <div className="favorite-card-top"><div className={`app-icon ${app.id}`} aria-hidden="true">
        {app.id === 'vtvgo' ? <TelevisionSimple size={34} weight="regular"/> : app.id === 'youtube' ? <Play size={34} weight="fill"/> : <span>{vi.netflixMonogram}</span>}
      </div><span className={`app-state ${scanned?.enabled ? 'is-enabled' : ''}`}>{status}</span></div>
      <h3>{vi.favoriteNames[id]}</h3><p>{vi.favoriteDescriptions[id]}</p>
      <div className="favorite-card-bottom"><code>{app.packageName}</code><a href={app.source} target="_blank" rel="noreferrer" aria-label={`${vi.appSource}: ${vi.favoriteNames[id]}`}><ArrowUpRight size={17}/></a></div>
    </article>;
  })}</div>;
}
