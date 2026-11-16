import { OrgRole } from '@grafana/data';
import { OrgUser } from 'app/types';

import { organizationProtection } from './organizationProtection';

const admin = { userId: 7, role: OrgRole.Admin } as OrgUser;
const current = { id: 7, orgId: 3, orgRole: OrgRole.Admin };
it('protects self by user ID and org ID even with two administrators', () => {
  expect(organizationProtection(admin, 3, current, [7, 8]).roleReason).toBeTruthy();
  expect(organizationProtection(admin, 3, current, [7, 8]).removeReason).toBeTruthy();
  expect(organizationProtection(admin, 4, current, [7, 8]).roleReason).toBeUndefined();
});
it('protects the last active administrator without inferring the server administrator flag', () => {
  expect(organizationProtection(admin, 3, { ...current, id: 8 }, [7]).roleReason).toBeTruthy();
  expect(organizationProtection(admin, 3, { ...current, id: 8 }, [7]).removeReason).toBeTruthy();
  expect(organizationProtection(admin, 3, { ...current, id: 8 }, [7, 8]).roleReason).toBeUndefined();
});
it('allows existing RBAC to handle other users and never equates anonymous ID zero with a user', () => {
  expect(organizationProtection({ ...admin, userId: 9, role: OrgRole.Viewer }, 3, current, [7])).toEqual({
    roleReason: undefined,
    removeReason: undefined,
  });
  expect(
    organizationProtection({ ...admin, userId: 0 }, 3, { ...current, id: 0 }, undefined).removeReason
  ).toBeUndefined();
});
