import { OrgRole } from '@grafana/data';
import { OrgUser } from 'app/types';

/** Organization roles are distinct from the server-wide administrator flag. */
export function organizationProtection(
  user: OrgUser,
  orgId: number | undefined,
  current: { id: number; orgId: number; orgRole: string },
  administrators?: number[]
) {
  const sameOrg = orgId !== undefined && current.orgId === orgId;
  const self = sameOrg && current.id > 0 && user.userId === current.id;
  const ownAdmin = self && current.orgRole === OrgRole.Admin && user.role === OrgRole.Admin;
  const lastAdmin = user.role === OrgRole.Admin && administrators?.length === 1 && administrators[0] === user.userId;
  return {
    roleReason: ownAdmin
      ? '현재 계정의 관리자 권한을 변경할 수 없습니다.'
      : lastAdmin
        ? '조직에는 최소 1명의 사용 가능한 관리자가 필요합니다.'
        : undefined,
    removeReason: self
      ? '현재 계정은 이 조직에서 제거할 수 없습니다.'
      : lastAdmin
        ? '마지막 조직 관리자는 제거할 수 없습니다.'
        : undefined,
  };
}
