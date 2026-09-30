import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { canInScope } from '@/lib/account-scope';
import { canAssignRole, canManageMemberRole } from '@/lib/business/permissions';
import { INVITABLE_BUSINESS_ROLES } from '@/lib/business/constants';
import { listBusinessTeam } from '@/lib/business/service';
import { getDashboardContext } from '@/lib/dashboard-context';
import TeamClient from './team-client';

export const metadata: Metadata = {
  title: 'Team · Catcher',
};

export default async function BusinessTeamPage() {
  const { scope } = await getDashboardContext();

  if (scope.kind !== 'business') {
    redirect('/dashboard/business');
  }

  const { members, invites } = await listBusinessTeam(scope);
  const canManage = canInScope(scope, 'manageMembers');

  return (
    <TeamClient
      businessName={scope.business.name}
      currentUserId={scope.userId}
      currentRole={scope.role}
      canManage={canManage}
      canTransferOwnership={canInScope(scope, 'transferOwnership')}
      invitableRoles={INVITABLE_BUSINESS_ROLES.filter((role) => canAssignRole(scope.role, role))}
      members={members.map((member) => ({
        id: member.id,
        userId: member.user.id,
        name: member.user.name,
        email: member.user.email,
        imageUrl: member.user.profileImageUrl,
        role: member.role,
        joinedAt: member.createdAt.toISOString(),
        isManageable: member.user.id !== scope.userId && canManageMemberRole(scope.role, member.role),
      }))}
      invites={
        canManage
          ? invites.map((invite) => ({
              id: invite.id,
              email: invite.email,
              role: invite.role,
              invitedBy: invite.invitedBy.name,
              expiresAt: invite.expiresAt.toISOString(),
            }))
          : []
      }
    />
  );
}
