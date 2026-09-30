'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import {
  Crown,
  Loader2,
  LogOut,
  Mail,
  MoreHorizontal,
  Send,
  UserMinus,
  UserPlus,
  X,
} from 'lucide-react';
import {
  changeMemberRoleAction,
  inviteMemberAction,
  leaveBusinessAction,
  removeMemberAction,
  revokeInviteAction,
  transferOwnershipAction,
  type BusinessActionResult,
} from '@/app/dashboard/business/actions';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ACCOUNT_CHANGED_EVENT } from '@/lib/business/account-context-types';
import {
  BUSINESS_ROLE_DESCRIPTIONS,
  BUSINESS_ROLE_LABELS,
  type BusinessMemberRoleValue,
  type InvitableBusinessRole,
} from '@/lib/business/constants';
import { cn } from '@/lib/utils';

type Member = {
  id: string;
  userId: string;
  name: string;
  email: string;
  imageUrl: string | null;
  role: BusinessMemberRoleValue;
  joinedAt: string;
  isManageable: boolean;
};

type Invite = {
  id: string;
  email: string;
  role: BusinessMemberRoleValue;
  invitedBy: string;
  expiresAt: string;
};

type Confirmation =
  | { kind: 'remove'; member: Member }
  | { kind: 'transfer'; member: Member }
  | { kind: 'leave' };

const ROLE_TONE: Record<BusinessMemberRoleValue, string> = {
  owner: 'bg-[#0F2651] text-white',
  admin: 'bg-[#36689e]/15 text-[#0F2651]',
  member: 'bg-slate-100 text-slate-700',
  viewer: 'border border-slate-200 bg-white text-slate-600',
};

function RoleBadge({ role }: { role: BusinessMemberRoleValue }) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-medium',
        ROLE_TONE[role],
      )}
    >
      {role === 'owner' ? <Crown aria-hidden className="h-3 w-3" /> : null}
      {BUSINESS_ROLE_LABELS[role]}
    </span>
  );
}

function initials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('');
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat('en-NG', { day: 'numeric', month: 'short', year: 'numeric' }).format(
    new Date(value),
  );
}

export default function TeamClient({
  businessName,
  currentUserId,
  currentRole,
  canManage,
  canTransferOwnership,
  invitableRoles,
  members,
  invites,
}: {
  businessName: string;
  currentUserId: string;
  currentRole: BusinessMemberRoleValue;
  canManage: boolean;
  canTransferOwnership: boolean;
  invitableRoles: InvitableBusinessRole[];
  members: Member[];
  invites: Invite[];
}) {
  const router = useRouter();
  const [inviteOpen, setInviteOpen] = React.useState(false);
  const [inviteEmail, setInviteEmail] = React.useState('');
  const [inviteRole, setInviteRole] = React.useState<InvitableBusinessRole | ''>(
    invitableRoles.includes('member') ? 'member' : (invitableRoles[0] ?? ''),
  );
  const [inviteError, setInviteError] = React.useState<string | null>(null);
  const [confirmation, setConfirmation] = React.useState<Confirmation | null>(null);
  const [busyKey, setBusyKey] = React.useState<string | null>(null);
  const [notice, setNotice] = React.useState<{ tone: 'success' | 'error'; message: string } | null>(null);

  const run = async (key: string, action: () => Promise<BusinessActionResult>, onSuccess?: () => void) => {
    setBusyKey(key);
    setNotice(null);
    const result = await action();
    setBusyKey(null);

    if (!result.ok) {
      setNotice({ tone: 'error', message: result.error });
      return false;
    }

    if (result.message) {
      setNotice({ tone: 'success', message: result.message });
    }

    onSuccess?.();
    router.refresh();
    return true;
  };

  const handleInvite = async (event: React.FormEvent) => {
    event.preventDefault();
    setInviteError(null);

    if (!inviteRole) {
      setInviteError('Choose a role.');
      return;
    }

    setBusyKey('invite');
    const result = await inviteMemberAction(inviteEmail, inviteRole);
    setBusyKey(null);

    if (!result.ok) {
      setInviteError(result.error);
      return;
    }

    setInviteOpen(false);
    setInviteEmail('');
    setNotice({ tone: 'success', message: result.message ?? 'Invitation sent.' });
    router.refresh();
  };

  const handleConfirm = async () => {
    if (!confirmation) {
      return;
    }

    if (confirmation.kind === 'leave') {
      const left = await run('leave', leaveBusinessAction);

      if (left) {
        window.dispatchEvent(new Event(ACCOUNT_CHANGED_EVENT));
        router.push('/dashboard');
      }
    } else if (confirmation.kind === 'remove') {
      await run(`remove-${confirmation.member.id}`, () => removeMemberAction(confirmation.member.id));
    } else {
      await run(`transfer-${confirmation.member.id}`, () => transferOwnershipAction(confirmation.member.id));
      window.dispatchEvent(new Event(ACCOUNT_CHANGED_EVENT));
    }

    setConfirmation(null);
  };

  const confirmCopy = confirmation
    ? confirmation.kind === 'leave'
      ? {
          title: `Leave ${businessName}?`,
          body: 'You will lose access to the business assets, reports and billing. Assets you registered stay with the business.',
          action: 'Leave business',
          destructive: true,
        }
      : confirmation.kind === 'remove'
        ? {
            title: `Remove ${confirmation.member.name}?`,
            body: `${confirmation.member.name} will lose access to ${businessName}. Assets they registered stay with the business.`,
            action: 'Remove member',
            destructive: true,
          }
        : {
            title: `Make ${confirmation.member.name} the owner?`,
            body: `${confirmation.member.name} will become an owner of ${businessName} and you will become an admin. Only an owner can undo this.`,
            action: 'Transfer ownership',
            destructive: false,
          }
    : null;

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-[#0F2651]">Team</h1>
          <p className="mt-2 max-w-2xl text-slate-600">
            People who can access {businessName} on Catcher. Everyone sees the same assets; roles control who can
            change them.
          </p>
        </div>
        {canManage && invitableRoles.length > 0 ? (
          <Button
            className="h-11 cursor-pointer bg-[#0F2651] text-white hover:bg-[#36689e]"
            onClick={() => {
              setInviteError(null);
              setInviteOpen(true);
            }}
          >
            <UserPlus aria-hidden className="mr-2 h-4 w-4" />
            Invite member
          </Button>
        ) : null}
      </div>

      {notice ? (
        <p
          role="status"
          className={cn(
            'rounded-xl border px-4 py-3 text-sm',
            notice.tone === 'error'
              ? 'border-red-200 bg-red-50 text-red-700'
              : 'border-emerald-200 bg-emerald-50 text-emerald-800',
          )}
        >
          {notice.message}
        </p>
      ) : null}

      <Card className="border-slate-200">
        <CardHeader>
          <CardTitle className="text-lg text-[#0F2651]">Members</CardTitle>
          <CardDescription>
            {members.length} {members.length === 1 ? 'person has' : 'people have'} access.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <ul className="divide-y divide-slate-100">
            {members.map((member) => {
              const isSelf = member.userId === currentUserId;
              const showMenu = member.isManageable || (canTransferOwnership && !isSelf);

              return (
                <li key={member.id} className="flex flex-col gap-3 px-6 py-4 sm:flex-row sm:items-center">
                  <div className="flex min-w-0 flex-1 items-center gap-3">
                    <Avatar className="h-10 w-10">
                      {member.imageUrl ? <AvatarImage src={member.imageUrl} alt="" /> : null}
                      <AvatarFallback className="bg-[#36689e]/10 text-sm font-semibold text-[#0F2651]">
                        {initials(member.name)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-[#0F2651]">
                        {member.name}
                        {isSelf ? <span className="font-normal text-slate-500"> (you)</span> : null}
                      </p>
                      <p className="truncate text-xs text-slate-500">
                        {member.email} · Joined {formatDate(member.joinedAt)}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 pl-13 sm:pl-0">
                    {member.isManageable ? (
                      <Select
                        value={member.role}
                        disabled={busyKey === `role-${member.id}`}
                        onValueChange={(role) =>
                          void run(`role-${member.id}`, () => changeMemberRoleAction(member.id, role))
                        }
                      >
                        <SelectTrigger
                          className="h-10 w-32 cursor-pointer"
                          aria-label={`Role for ${member.name}`}
                        >
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent align="end">
                          {[member.role, ...invitableRoles.filter((role) => role !== member.role)].map((role) => (
                            <SelectItem key={role} value={role}>
                              <span className="flex flex-col">
                                <span>{BUSINESS_ROLE_LABELS[role]}</span>
                              </span>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    ) : (
                      <RoleBadge role={member.role} />
                    )}

                    {showMenu ? (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-10 w-10 cursor-pointer"
                            aria-label={`More actions for ${member.name}`}
                          >
                            <MoreHorizontal aria-hidden className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-52">
                          {canTransferOwnership && member.role !== 'owner' ? (
                            <DropdownMenuItem
                              className="cursor-pointer"
                              onSelect={() => setConfirmation({ kind: 'transfer', member })}
                            >
                              <Crown aria-hidden className="mr-2 h-4 w-4" />
                              Make owner
                            </DropdownMenuItem>
                          ) : null}
                          {member.isManageable ? (
                            <>
                              {canTransferOwnership && member.role !== 'owner' ? <DropdownMenuSeparator /> : null}
                              <DropdownMenuItem
                                className="cursor-pointer text-red-600 focus:text-red-700"
                                onSelect={() => setConfirmation({ kind: 'remove', member })}
                              >
                                <UserMinus aria-hidden className="mr-2 h-4 w-4" />
                                Remove from business
                              </DropdownMenuItem>
                            </>
                          ) : null}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    ) : (
                      <span className="hidden w-10 sm:block" />
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        </CardContent>
      </Card>

      {canManage ? (
        <Card className="border-slate-200">
          <CardHeader>
            <CardTitle className="text-lg text-[#0F2651]">Pending invitations</CardTitle>
            <CardDescription>Invitations expire after 7 days. Re-inviting an email replaces the old link.</CardDescription>
          </CardHeader>
          <CardContent className={invites.length ? 'p-0' : undefined}>
            {invites.length === 0 ? (
              <p className="text-sm text-slate-500">No pending invitations.</p>
            ) : (
              <ul className="divide-y divide-slate-100">
                {invites.map((invite) => (
                  <li key={invite.id} className="flex flex-col gap-3 px-6 py-4 sm:flex-row sm:items-center">
                    <div className="flex min-w-0 flex-1 items-center gap-3">
                      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-dashed border-slate-300">
                        <Mail aria-hidden className="h-4 w-4 text-slate-400" />
                      </span>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-[#0F2651]">{invite.email}</p>
                        <p className="truncate text-xs text-slate-500">
                          Invited by {invite.invitedBy} · Expires {formatDate(invite.expiresAt)}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 pl-13 sm:pl-0">
                      <RoleBadge role={invite.role} />
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-10 cursor-pointer text-slate-600 hover:text-red-600"
                        disabled={busyKey === `revoke-${invite.id}`}
                        onClick={() => void run(`revoke-${invite.id}`, () => revokeInviteAction(invite.id))}
                      >
                        {busyKey === `revoke-${invite.id}` ? (
                          <Loader2 aria-hidden className="h-4 w-4 animate-spin" />
                        ) : (
                          <X aria-hidden className="h-4 w-4" />
                        )}
                        <span className="ml-1">Revoke</span>
                      </Button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      ) : null}

      <Card className="border-slate-200">
        <CardContent className="flex flex-col gap-4 p-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-medium text-[#0F2651]">Leave this business</p>
            <p className="mt-1 text-sm text-slate-500">
              {currentRole === 'owner'
                ? 'If you are the only owner, make someone else an owner first.'
                : 'You can be invited back later by an owner or admin.'}
            </p>
          </div>
          <Button
            variant="outline"
            className="h-11 cursor-pointer border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700"
            onClick={() => setConfirmation({ kind: 'leave' })}
          >
            <LogOut aria-hidden className="mr-2 h-4 w-4" />
            Leave business
          </Button>
        </CardContent>
      </Card>

      {/* Invite dialog */}
      <Dialog open={inviteOpen} onOpenChange={setInviteOpen}>
        <DialogContent className="sm:max-w-md">
          <form onSubmit={handleInvite} className="space-y-5" noValidate>
            <DialogHeader>
              <DialogTitle className="text-[#0F2651]">Invite a team member</DialogTitle>
              <DialogDescription>
                They will get an email with a link to join {businessName}. It works only for this email address.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-1.5">
              <label htmlFor="invite-email" className="text-sm font-medium text-slate-900">
                Email address
              </label>
              <Input
                id="invite-email"
                type="email"
                autoComplete="off"
                autoFocus
                required
                value={inviteEmail}
                onChange={(event) => {
                  setInviteEmail(event.target.value);
                  setInviteError(null);
                }}
                placeholder="colleague@company.ng"
                className="h-11"
              />
            </div>

            <fieldset className="space-y-2">
              <legend className="text-sm font-medium text-slate-900">Role</legend>
              <div className="space-y-2">
                {invitableRoles.map((role) => (
                  <label
                    key={role}
                    className={cn(
                      'flex cursor-pointer items-start gap-3 rounded-xl border p-3 transition-colors',
                      inviteRole === role
                        ? 'border-[#36689e] bg-[#36689e]/5'
                        : 'border-slate-200 hover:bg-slate-50',
                    )}
                  >
                    <input
                      type="radio"
                      name="invite-role"
                      value={role}
                      checked={inviteRole === role}
                      onChange={() => setInviteRole(role)}
                      className="mt-1 h-4 w-4 cursor-pointer accent-[#36689e]"
                    />
                    <span>
                      <span className="block text-sm font-medium text-[#0F2651]">{BUSINESS_ROLE_LABELS[role]}</span>
                      <span className="block text-xs leading-5 text-slate-500">{BUSINESS_ROLE_DESCRIPTIONS[role]}</span>
                    </span>
                  </label>
                ))}
              </div>
            </fieldset>

            {inviteError ? (
              <p role="alert" className="text-sm font-medium text-red-600">
                {inviteError}
              </p>
            ) : null}

            <DialogFooter className="gap-2 sm:gap-0">
              <Button type="button" variant="outline" className="h-11 cursor-pointer" onClick={() => setInviteOpen(false)}>
                Cancel
              </Button>
              <Button
                type="submit"
                className="h-11 cursor-pointer bg-[#0F2651] text-white hover:bg-[#36689e]"
                disabled={busyKey === 'invite' || !inviteEmail.trim()}
              >
                {busyKey === 'invite' ? (
                  <Loader2 aria-hidden className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Send aria-hidden className="mr-2 h-4 w-4" />
                )}
                Send invitation
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Confirmation dialog */}
      <Dialog open={Boolean(confirmation)} onOpenChange={(open) => (open ? null : setConfirmation(null))}>
        <DialogContent className="sm:max-w-md">
          {confirmCopy ? (
            <>
              <DialogHeader>
                <DialogTitle className="text-[#0F2651]">{confirmCopy.title}</DialogTitle>
                <DialogDescription>{confirmCopy.body}</DialogDescription>
              </DialogHeader>
              <DialogFooter className="gap-2 sm:gap-0">
                <Button variant="outline" className="h-11 cursor-pointer" onClick={() => setConfirmation(null)}>
                  Cancel
                </Button>
                <Button
                  className={cn(
                    'h-11 cursor-pointer text-white',
                    confirmCopy.destructive ? 'bg-red-600 hover:bg-red-700' : 'bg-[#0F2651] hover:bg-[#36689e]',
                  )}
                  disabled={Boolean(busyKey)}
                  onClick={() => void handleConfirm()}
                >
                  {busyKey ? <Loader2 aria-hidden className="mr-2 h-4 w-4 animate-spin" /> : null}
                  {confirmCopy.action}
                </Button>
              </DialogFooter>
            </>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  );
}
