import { Tabs } from '@base-ui/react/tabs';
import {
  ArrowDownAZ,
  ArrowRight,
  ChevronRight,
  Folder,
  LayoutGrid,
  List,
  Loader2,
  Search,
  Settings2,
  Star,
  X,
} from 'lucide-react';
import { useState } from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom-v5-compat';

import { locationUtil } from '@grafana/data';
import { contextSrv } from 'app/core/services/context_srv';

import { categories, categoryOf, filterDashboards } from './model';
import { Button, Card } from './ui';
import { useWallDashboards } from './useWallDashboards';

export default function WallDashboardLibrary({ onManage }: { onManage?: () => void }) {
  const { items, loading, error, toggleStar, pendingStars, reload } = useWallDashboards();
  const { uid: folderUid } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const params = new URLSearchParams(location.search);
  const query = params.get('query') ?? '';
  const category = params.get('category') ?? 'all';
  const starred = params.has('starred');
  const [view, setView] = useState<'grid' | 'list'>('grid');
  const [descending, setDescending] = useState(false);
  const folders = items.filter((item) => item.type === 'dash-folder');
  const folder = folders.find((item) => item.uid === folderUid);
  const dashboards = items.filter((item) => item.type === 'dash-db');
  const selectedCategory = categories.find((item) => item.id === category) ?? categories[0];
  const filtered = filterDashboards(items, query, selectedCategory.id, starred, folderUid);
  if (descending) {
    filtered.reverse();
  }
  const setFilter = (key: string, value?: string) => {
    const next = new URLSearchParams(location.search);
    if (value) {
      next.set(key, value);
    } else {
      next.delete(key);
    }
    navigate({ pathname: location.pathname, search: next.toString() }, { replace: true });
  };

  return (
    <div className="wall-library" data-testid="wall-dashboard-library">
      <div className="wall-breadcrumb">
        <Link to="/dashboards">워크스페이스</Link>
        <ChevronRight size={12} />
        <span>{folder?.title || '대시보드'}</span>
      </div>
      <div className="wall-page-heading">
        <div>
          <div className="wall-eyebrow">OBSERVABILITY WORKSPACE</div>
          <h1>
            {folder?.title || '대시보드'}
            <span className="wall-title-count">
              {loading
                ? '…'
                : folderUid
                  ? dashboards.filter((item) => item.folderUid === folderUid).length
                  : dashboards.length}
            </span>
          </h1>
          <p>인프라의 모든 흐름을, 하나의 시야로.</p>
        </div>
        <div className="wall-heading-actions">
          {onManage && (
            <Button onClick={onManage}>
              <Settings2 size={15} />
              대시보드 관리
            </Button>
          )}
          <span className="wall-workspace-label">
            <span className="wall-product-dot" />
            {contextSrv.user.orgName || 'ABLESTACK Wall'}
          </span>
        </div>
      </div>
      <div className="wall-library-stats">
        <Card>
          <span className="wall-stat-icon">
            <LayoutGrid size={18} />
          </span>
          <div>
            <span>전체 대시보드</span>
            <strong>{loading ? '—' : dashboards.length}</strong>
          </div>
          <span className="wall-stat-caption">Dashboards</span>
        </Card>
        <Card>
          <span className="wall-stat-icon is-amber">
            <Star size={18} />
          </span>
          <div>
            <span>즐겨찾기</span>
            <strong>{loading ? '—' : dashboards.filter((item) => item.isStarred).length}</strong>
          </div>
          <span className="wall-stat-caption">Favorites</span>
        </Card>
        <Card>
          <span className="wall-stat-icon is-purple">
            <Folder size={18} />
          </span>
          <div>
            <span>폴더</span>
            <strong>{loading ? '—' : folders.length}</strong>
          </div>
          <span className="wall-stat-caption">Collections</span>
        </Card>
      </div>
      {folders.length > 0 && !folderUid && (
        <section className="wall-folders" aria-label="폴더">
          <div className="wall-section-heading">
            <h2>폴더</h2>
            <span>기존 폴더별로 살펴보세요</span>
          </div>
          <div className="wall-folder-row">
            {folders.map((item) => (
              <Link key={item.uid} className="wall-folder-chip" to={locationUtil.stripBaseFromUrl(item.url)}>
                <Folder size={17} />
                <span>{item.title}</span>
                <ChevronRight size={14} />
              </Link>
            ))}
          </div>
        </section>
      )}
      <section className="wall-library-section">
        <div className="wall-section-heading">
          <h2>{starred ? '즐겨찾기' : selectedCategory.label}</h2>
          <span>{selectedCategory.description}</span>
        </div>
        <div className="wall-library-tools">
          <Tabs.Root
            value={starred ? 'starred' : 'all'}
            onValueChange={(value) => setFilter('starred', value === 'starred' ? 'true' : undefined)}
            className="wall-tabs"
          >
            <Tabs.List aria-label="대시보드 필터">
              <Tabs.Tab value="all">전체 보기</Tabs.Tab>
              <Tabs.Tab value="starred">
                <Star size={13} />
                즐겨찾기
              </Tabs.Tab>
            </Tabs.List>
          </Tabs.Root>
          <div className="wall-filter-search">
            <Search size={16} />
            <input
              aria-label="대시보드 검색"
              placeholder="이름, 폴더 또는 태그 검색"
              value={query}
              onChange={(event) => setFilter('query', event.target.value)}
            />
            {query && (
              <button aria-label="필터 검색어 지우기" onClick={() => setFilter('query')}>
                <X size={14} />
              </button>
            )}
          </div>
          <select
            className="wall-category-select"
            aria-label="대시보드 분류"
            value={selectedCategory.id}
            onChange={(event) => setFilter('category', event.target.value === 'all' ? undefined : event.target.value)}
          >
            {categories.map((item) => (
              <option key={item.id} value={item.id}>
                {item.label}
              </option>
            ))}
          </select>
          <Button variant="ghost" aria-label="이름 정렬 순서 변경" onClick={() => setDescending(!descending)}>
            <ArrowDownAZ size={16} />
            {descending ? '이름 역순' : '이름순'}
          </Button>
          <div className="wall-view-switch">
            <Button
              variant="ghost"
              size="icon"
              aria-label="카드 보기"
              aria-pressed={view === 'grid'}
              onClick={() => setView('grid')}
            >
              <LayoutGrid size={16} />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              aria-label="목록 보기"
              aria-pressed={view === 'list'}
              onClick={() => setView('list')}
            >
              <List size={17} />
            </Button>
          </div>
        </div>
        {loading && (
          <div className="wall-empty" role="status">
            <Loader2 className="wall-spin" size={24} />
            <strong>대시보드를 불러오는 중입니다</strong>
          </div>
        )}
        {!loading && error && (
          <div className="wall-empty" role="alert">
            <strong>{error}</strong>
            <Button onClick={reload}>다시 시도</Button>
          </div>
        )}
        {!loading && !error && filtered.length === 0 && (
          <div className="wall-empty">
            <Search size={28} />
            <strong>조건에 맞는 대시보드가 없습니다</strong>
            <p>검색어나 분류를 변경해 보세요.</p>
            <Button onClick={() => navigate('/dashboards')}>전체 대시보드 보기</Button>
          </div>
        )}
        {!loading && !error && (
          <div className={`wall-dashboard-collection is-${view}`}>
            {filtered.map((item) => {
              const categoryInfo = categories.find((entry) => entry.id === categoryOf(item))!;
              return (
                <Card className="wall-dashboard-card" key={item.uid}>
                  <div className="wall-dashboard-card-top">
                    <span className={`wall-dashboard-glyph category-${categoryInfo.id}`}>
                      <LayoutGrid size={20} />
                    </span>
                    <span className="wall-category-badge">{categoryInfo.label}</span>
                    {contextSrv.isSignedIn && (
                      <Button
                        size="icon"
                        variant="ghost"
                        className={item.isStarred ? 'wall-star is-starred' : 'wall-star'}
                        aria-label={`${item.title} ${item.isStarred ? '즐겨찾기 해제' : '즐겨찾기 추가'}`}
                        aria-pressed={item.isStarred}
                        disabled={pendingStars.has(item.uid)}
                        onClick={() => {
                          void toggleStar(item).catch(() => undefined);
                        }}
                      >
                        <Star size={17} fill={item.isStarred ? 'currentColor' : 'none'} />
                      </Button>
                    )}
                  </div>
                  <Link to={locationUtil.stripBaseFromUrl(item.url)} className="wall-dashboard-card-link">
                    <h3>{item.title}</h3>
                    <p>{categoryInfo.description}</p>
                    <div className="wall-card-bottom">
                      <span>
                        <Folder size={13} />
                        {item.folderTitle || '일반'}
                      </span>
                      <span className="wall-card-open">
                        대시보드 열기
                        <ArrowRight size={14} />
                      </span>
                    </div>
                  </Link>
                  {item.tags?.length > 0 && (
                    <div className="wall-card-tags">
                      {item.tags.map((tag) => (
                        <span key={tag}>{tag}</span>
                      ))}
                    </div>
                  )}
                </Card>
              );
            })}
          </div>
        )}
        {!loading && !error && (
          <div className="wall-results-caption">
            {filtered.length}개의 대시보드<span>ABLESTACK Wall · 통합 모니터링</span>
          </div>
        )}
      </section>
    </div>
  );
}
