import { Menu } from '@base-ui/react/menu';
import {
  ChevronDown,
  MoreHorizontal,
  Search,
  ArrowDownUp,
  CircleCheck,
  CircleSlash,
  Check,
  ListFilter,
} from 'lucide-react';
import { PropsWithChildren, ReactNode, useEffect, useRef, useState } from 'react';

import { OrgRole, PageLayoutType, dateTimeFormat } from '@grafana/data';
import { Avatar, Link, FilterInput, useTheme2 } from '@grafana/ui';
import NativeScrollbar from 'app/core/components/NativeScrollbar';
import { Page } from 'app/core/components/Page/Page';
import { t, Trans } from 'app/core/internationalization';
import { wallApplicationTokens } from 'app/features/wall-modern/applicationTokens';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from 'app/features/wall-modern/components/ui/dropdown-menu';
import { Popover, PopoverContent, PopoverTrigger } from 'app/features/wall-modern/components/ui/popover';
import { wallSurfaceVariables } from 'app/features/wall-modern/surfaceTokens';
import { wallEditorTypographyVariables, wallTypographyVariables } from 'app/features/wall-modern/typography';
import { Button } from 'app/features/wall-modern/ui';

import 'app/features/wall-modern/modern.css';
import './users.css';

export function WallUsersRegion({ children }: PropsWithChildren) {
  const theme = useTheme2();
  return (
    <div
      className="wall-modern wall-users-region"
      data-wall-theme={theme.isDark ? 'dark' : 'light'}
      style={{
        ...wallSurfaceVariables(theme.isDark, true),
        ...wallTypographyVariables,
        ...wallEditorTypographyVariables,
        '--wall-users-primary-text': theme.colors.getContrastText(
          wallApplicationTokens[theme.isDark ? 'dark' : 'light'].primary
        ),
      }}
    >
      {children}
    </div>
  );
}

export function UsersWorkspace({ children, testId }: PropsWithChildren<{ testId?: string }>) {
  return (
    <section
      data-testid={testId}
      className="wall-users-workspace"
      aria-label={t('wall.users.workspace', '사용자 관리 작업 영역')}
    >
      {children}
    </section>
  );
}

export function UsersPageFrame({ children, navId = 'global-users' }: PropsWithChildren<{ navId?: string }>) {
  return (
    <Page navId={navId} pageNav={{ text: t('wall.users.title', '사용자 관리') }} layout={PageLayoutType.Custom}>
      <NativeScrollbar>
        <div className="wall-users-page-content">{children}</div>
      </NativeScrollbar>
    </Page>
  );
}

export function UsersWorkspaceHeader({
  description,
  actions,
  navigation,
}: {
  description: string;
  actions?: ReactNode;
  navigation?: ReactNode;
}) {
  return (
    <>
      <header className="wall-users-workspace-header">
        <div>
          <h1>{t('wall.users.title', '사용자 관리')}</h1>
          <p>{description}</p>
        </div>
        <div className="wall-users-toolbar-actions">{actions}</div>
      </header>
      {navigation}
    </>
  );
}

export function UsersListTools({ title, count, children }: PropsWithChildren<{ title: string; count?: number }>) {
  return (
    <div className="wall-users-toolbar">
      <div className="wall-members-heading">
        <h2>{title}</h2>
        {count !== undefined && <span aria-live="polite">{t('wall.users.count', '{{count}}명', { count })}</span>}
      </div>
      <div className="wall-members-tools">{children}</div>
    </div>
  );
}

export function UsersSearch({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  const [expanded, setExpanded] = useState(Boolean(value));
  const input = useRef<HTMLInputElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const open = expanded || Boolean(value);
  return (
    <div className="wall-member-search">
      {open && (
        <FilterInput
          ref={input}
          autoFocus
          value={value}
          onChange={onChange}
          aria-label={t('wall.users.search-label', '사용자 검색')}
          placeholder={t('wall.users.search-placeholder', '이름, 로그인 ID, 이메일 검색')}
          onKeyDown={(event) => {
            if (event.key === 'Escape' && !value) {
              setExpanded(false);
              trigger.current?.focus();
            }
          }}
        />
      )}
      <Button
        ref={trigger}
        variant="ghost"
        aria-label={t('wall.users.search-toggle', '사용자 검색 열기')}
        aria-expanded={open}
        onClick={() => {
          if (value) {
            input.current?.focus();
          } else {
            setExpanded(!expanded);
          }
        }}
      >
        <Search size={14} aria-hidden="true" />
        {!open && t('wall.users.search', '검색')}
      </Button>
    </div>
  );
}

export function UsersFilters({ active, children }: PropsWithChildren<{ active: boolean }>) {
  return (
    <Popover>
      <PopoverTrigger
        render={<Button variant="ghost" />}
        aria-label={t('wall.users.filters', '사용자 필터')}
        className={active ? 'wall-users-filter-active' : undefined}
      >
        <ListFilter size={14} aria-hidden="true" />
        {t('wall.users.filter', '필터')}
      </PopoverTrigger>
      <PopoverContent className="wall-users-filter-popover">
        <div style={wallEditorTypographyVariables}>{children}</div>
      </PopoverContent>
    </Popover>
  );
}

export function MemberList({ children, label }: PropsWithChildren<{ label?: string }>) {
  return (
    <ul className="wall-member-list" aria-label={label ?? t('wall.users.account-list', '사용자 계정')}>
      {children}
    </ul>
  );
}

export function MemberItem({
  login,
  name,
  email,
  avatarUrl,
  href,
  isDisabled,
  lastSeenAt,
  lastSeenAtAge,
  authLabels,
  roleControl,
  actions,
  details,
}: {
  login: string;
  name?: string;
  email?: string;
  avatarUrl?: string;
  href?: string;
  isDisabled: boolean;
  lastSeenAt?: string;
  lastSeenAtAge?: string;
  authLabels?: string[];
  roleControl?: ReactNode;
  actions?: ReactNode;
  details?: ReactNode;
}) {
  const time =
    lastSeenAtAge === '10 years'
      ? t('wall.users.never', '로그인 기록 없음')
      : lastSeenAt && !lastSeenAt.startsWith('0001-') && Number.isFinite(Date.parse(lastSeenAt))
        ? dateTimeFormat(lastSeenAt, { format: 'YYYY-MM-DD HH:mm' })
        : lastSeenAtAge && lastSeenAtAge !== '?'
          ? lastSeenAtAge
          : undefined;
  const StatusIcon = isDisabled ? CircleSlash : CircleCheck;
  return (
    <li className="wall-member" data-user-login={login}>
      <div className="wall-member-main">
        <UserIdentity login={login} name={name} email={email} avatarUrl={avatarUrl} href={href} />
        <div className="wall-member-controls">
          {roleControl}
          {actions}
        </div>
      </div>
      <div className="wall-member-metadata">
        <span className={isDisabled ? 'wall-user-danger' : undefined}>
          <StatusIcon size={13} aria-hidden="true" />
          {isDisabled ? t('wall.users.disabled', '비활성') : t('wall.users.enabled', '사용 가능')}
        </span>
        {time && (
          <span title={lastSeenAt}>
            {lastSeenAtAge === '10 years' ? time : t('wall.users.last-seen', '최근 활동 {{time}}', { time })}
          </span>
        )}
        {!!authLabels?.length && <span title={authLabels.join(', ')}>{authLabels.join(', ')}</span>}
        {details}
      </div>
    </li>
  );
}

type UserSortField = 'login' | 'email' | 'name' | 'lastSeenAtAge';
export type UsersSortChange = (args: { sortBy: Array<{ id: UserSortField; desc: boolean }> }) => void;

/** Only changes the existing server sort request, never sorts or rewrites user data. */
export function UsersSort({ value, onChange }: { value?: string; onChange: UsersSortChange }) {
  const fields: Array<{ id: UserSortField; label: string }> = [
    { id: 'login', label: t('ablestack-wall.common.login', 'Login') },
    { id: 'name', label: t('ablestack-wall.common.name', 'Name') },
    { id: 'email', label: t('ablestack-wall.common.email', 'Email') },
    { id: 'lastSeenAtAge', label: t('ablestack-wall.common.last-active', 'Last active') },
  ];
  const field = fields.find(({ id }) => value?.startsWith(`${id}-`));
  const descending = value?.endsWith('-desc') ?? false;
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={<Button variant="ghost" />}
        aria-label={t('wall.users.sort-label', '사용자 정렬')}
        className="wall-users-sort"
      >
        <ArrowDownUp size={14} aria-hidden="true" />
        {field ? t('wall.users.sort-by', '정렬: {{field}}', { field: field.label }) : t('wall.users.sort', '정렬')}
        <ChevronDown size={14} aria-hidden="true" />
      </DropdownMenuTrigger>
      <DropdownMenuContent className="wall-users-menu" style={wallEditorTypographyVariables}>
        <Menu.RadioGroup
          value={field?.id ?? ''}
          onValueChange={(id) => {
            const next = fields.find((item) => item.id === id);
            if (next) {
              onChange({ sortBy: [{ id: next.id, desc: descending }] });
            }
          }}
        >
          {fields.map(({ id, label }) => (
            <Menu.RadioItem key={id} value={id} closeOnClick className="wall-users-menu-item">
              {label}
              <Menu.RadioItemIndicator>
                <Check size={14} aria-hidden="true" />
              </Menu.RadioItemIndicator>
            </Menu.RadioItem>
          ))}
        </Menu.RadioGroup>
        <Menu.Separator className="wall-users-menu-separator" />
        <Menu.RadioGroup
          value={field ? (descending ? 'desc' : 'asc') : ''}
          onValueChange={(direction) =>
            onChange({ sortBy: [{ id: field?.id ?? 'login', desc: direction === 'desc' }] })
          }
        >
          <Menu.RadioItem value="asc" closeOnClick className="wall-users-menu-item">
            <Trans i18nKey="wall.users.ascending">오름차순</Trans>
            <Menu.RadioItemIndicator>
              <Check size={14} aria-hidden="true" />
            </Menu.RadioItemIndicator>
          </Menu.RadioItem>
          <Menu.RadioItem value="desc" closeOnClick className="wall-users-menu-item">
            <Trans i18nKey="wall.users.descending">내림차순</Trans>
            <Menu.RadioItemIndicator>
              <Check size={14} aria-hidden="true" />
            </Menu.RadioItemIndicator>
          </Menu.RadioItem>
        </Menu.RadioGroup>
        <Menu.Separator className="wall-users-menu-separator" />
        <DropdownMenuItem className="wall-users-menu-item" onClick={() => onChange({ sortBy: [] })}>
          <Trans i18nKey="wall.users.default-sort">기본 순서</Trans>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export function UsersListFooter({
  visibleCount,
  totalCount,
  page,
  perPage,
  children,
}: PropsWithChildren<{ visibleCount: number; totalCount?: number; page: number; perPage?: number }>) {
  const start = visibleCount ? (Math.max(page, 1) - 1) * (perPage ?? visibleCount) + 1 : 0;
  return (
    <footer className="wall-users-list-footer">
      <span>
        {totalCount !== undefined
          ? t('wall.users.range', '{{start}}–{{end}} / {{total}}명', {
              start,
              end: visibleCount ? Math.min(totalCount, start + visibleCount - 1) : 0,
              total: totalCount,
            })
          : t('wall.users.visible-count', '{{count}}명 표시', { count: visibleCount })}
      </span>
      {children}
    </footer>
  );
}

/** Keep real custom photos; only replace the server-confirmed generated retro fallback. */
function UserAvatar({ src, initial }: { src?: string; initial: string }) {
  const [fallback, setFallback] = useState<string>();
  useEffect(() => {
    if (!src) {
      return;
    }
    let url: URL;
    try {
      url = new URL(src, window.location.href);
    } catch {
      return;
    }
    if (url.origin !== window.location.origin || !/\/avatar\/[a-f0-9]{32}$/i.test(url.pathname)) {
      return;
    }
    const abort = new AbortController();
    fetch(url, { signal: abort.signal, credentials: 'same-origin' })
      .then((response) => {
        if (!abort.signal.aborted && response.ok && response.headers.get('X-Wall-Avatar-Custom') === 'false') {
          setFallback(src);
        }
      })
      .catch(() => {
        /* Preserve existing image behavior when classification is unavailable. */
      });
    return () => abort.abort();
  }, [src]);
  return src && fallback !== src ? (
    <Avatar src={src} alt="" />
  ) : (
    <span className="wall-user-initial" aria-hidden="true">
      {initial}
    </span>
  );
}

export function UserIdentity({
  login,
  name,
  avatarUrl,
  email,
  href,
}: {
  login: string;
  name?: string;
  avatarUrl?: string;
  email?: string;
  href?: string;
}) {
  const content = (
    <>
      <UserAvatar src={avatarUrl} initial={(name || login).slice(0, 1).toUpperCase()} />
      <span className="wall-user-profile-copy">
        <span className="wall-user-profile-title">
          <span className="wall-user-display-name" title={name || login}>
            {name || login}
          </span>
          {name && name !== login && (
            <span className="wall-user-handle" title={login}>
              {login}
            </span>
          )}
        </span>
        {email && (
          <span className="wall-user-email" title={email}>
            {email}
          </span>
        )}
      </span>
    </>
  );
  return href ? (
    <Link
      className="wall-user-identity"
      href={href}
      aria-label={t('wall.users.open', '{{login}} 사용자 상세', { login })}
    >
      {content}
    </Link>
  ) : (
    <span className="wall-user-identity">{content}</span>
  );
}

export function UserText({ value, title }: { value?: string; title?: string }) {
  return (
    <span className={`wall-user-text${value ? '' : ' wall-user-muted'}`} title={title ?? value}>
      {value || '—'}
    </span>
  );
}

export function UsersEmptyState() {
  return (
    <div className="wall-users-empty" role="status">
      <p>
        <Trans i18nKey="wall.users.empty">표시할 사용자가 없습니다.</Trans>
      </p>
      <span>
        <Trans i18nKey="wall.users.empty-help">검색어와 필터 조건을 확인하세요.</Trans>
      </span>
    </div>
  );
}

/** This opt-in presentation keeps the existing organization role callback. */
export function WallUserRolePicker({
  value,
  disabled,
  reason,
  onChange,
  login,
}: {
  value: OrgRole;
  disabled: boolean;
  reason?: string;
  onChange: (role: OrgRole) => void;
  login: string;
}) {
  const roleNames: Record<string, string> = {
    [OrgRole.None]: t('wall.users.role-none', '기본 역할 없음'),
    [OrgRole.Admin]: t('wall.users.role-admin', '관리자'),
    [OrgRole.Editor]: t('wall.users.role-editor', '편집자'),
    [OrgRole.Viewer]: t('wall.users.role-viewer', '조회자'),
  };
  const descriptions: Record<string, string> = {
    [OrgRole.Admin]: '조직 사용자, 데이터 소스 및 설정 관리',
    [OrgRole.Editor]: '대시보드와 시각화 생성 및 편집',
    [OrgRole.Viewer]: '허용된 대시보드와 데이터 조회',
  };
  const roles = Object.values(OrgRole).filter((role) => role !== OrgRole.None);
  if (disabled) {
    return (
      <span className="wall-user-role-readonly" title={reason} aria-label={`${login} 권한: ${value}. ${reason ?? ''}`}>
        <span>{roleNames[value] ?? value}</span>
        <small>{reason}</small>
      </span>
    );
  }
  return (
    <span className="wall-user-role">
      <DropdownMenu>
        <DropdownMenuTrigger
          render={<Button />}
          disabled={disabled}
          aria-description={disabled ? reason : undefined}
          aria-label={t('wall.users.role-label', '{{login}} 권한: {{role}}', { login, role: value })}
        >
          {roleNames[value] ?? value}
          <ChevronDown size={14} aria-hidden="true" />
        </DropdownMenuTrigger>
        <DropdownMenuContent className="wall-users-menu" style={wallEditorTypographyVariables}>
          <Menu.RadioGroup
            value={value}
            onValueChange={(next) => {
              const role = roles.find((role) => role === next);
              if (!disabled && role && role !== value) {
                onChange(role);
              }
            }}
          >
            {roles.map((role) => (
              <Menu.RadioItem className="wall-users-menu-item" value={role} key={role} closeOnClick>
                <span>
                  {roleNames[role] ?? role}
                  <small className="wall-member-role-code">{role}</small>
                  <small className="wall-role-description">{descriptions[role]}</small>
                </span>
                <Menu.RadioItemIndicator className="wall-user-role-indicator">
                  <Check size={14} aria-hidden="true" />
                </Menu.RadioItemIndicator>
              </Menu.RadioItem>
            ))}
          </Menu.RadioGroup>
        </DropdownMenuContent>
      </DropdownMenu>
    </span>
  );
}

export function UserActions({
  login,
  editHref,
  onRemove,
}: {
  login: string;
  editHref?: string;
  onRemove?: () => void;
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={<Button variant="ghost" size="icon" />}
        className="wall-user-actions"
        aria-label={t('wall.users.actions', '{{login}} 사용자 작업', { login })}
      >
        <MoreHorizontal size={16} aria-hidden="true" />
      </DropdownMenuTrigger>
      <DropdownMenuContent className="wall-users-menu" style={wallEditorTypographyVariables}>
        {editHref && (
          <DropdownMenuItem
            render={<a href={editHref} aria-label={t('wall.users.edit', '사용자 상세')} />}
            className="wall-users-menu-item"
          >
            <Trans i18nKey="wall.users.edit">사용자 상세</Trans>
          </DropdownMenuItem>
        )}
        {onRemove && (
          <DropdownMenuItem className="wall-users-menu-item wall-user-danger" onClick={onRemove}>
            <Trans i18nKey="wall.users.remove">조직에서 제거</Trans>
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
