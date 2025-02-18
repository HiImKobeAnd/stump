import { invalidateQueries, useSDK } from '@stump/client'
import { DropdownMenu, IconButton } from '@stump/components'
import { User } from '@stump/sdk'
import { Database, Lock, MoreVertical, Pencil, Search, Trash, Unlock } from 'lucide-react'
import { useCallback, useMemo } from 'react'
import toast from 'react-hot-toast'
import { useNavigate } from 'react-router'

import { useAppContext } from '@/context'
import paths from '@/paths'

import { useUserManagementContext } from '../context.ts'

type Props = {
	user: User
	onSelectForInspect: (user: User) => void
}

export default function UserActionMenu({ user, onSelectForInspect }: Props) {
	const { sdk } = useSDK()
	const { isServerOwner, user: byUser } = useAppContext()
	const { setDeletingUser, users } = useUserManagementContext()

	const navigate = useNavigate()
	const isSelf = byUser?.id === user.id

	const userSessionsCount = users.find((u) => u.id === user.id)?.login_sessions_count || 0

	const handleSetLockStatus = useCallback(
		async (lock: boolean) => {
			try {
				await sdk.user.lockUser(user.id, lock)
				await invalidateQueries({ keys: [sdk.user.keys.get] })
			} catch (error) {
				if (error instanceof Error) {
					toast.error(error.message)
				} else {
					console.error(error)
					toast.error('An unknown error occurred')
				}
			}
		},
		[sdk, user.id],
	)

	const handleClearUserSessions = useCallback(async () => {
		try {
			await sdk.user.deleteUserSessions(user.id)
			if (isSelf) {
				navigate('/')
			} else {
				await invalidateQueries({ keys: [sdk.user.keys.get] })
			}
		} catch (error) {
			if (error instanceof Error) {
				toast.error(error.message)
			} else {
				console.error(error)
				toast.error('An unknown error occurred')
			}
		}
	}, [sdk, user.id, isSelf, navigate])

	const groups = useMemo(
		() => [
			{
				items: [
					{
						label: 'Inspect',
						leftIcon: <Search className="mr-2 h-4 w-4" />,
						onClick: () => onSelectForInspect(user),
					},
					{
						disabled: userSessionsCount === 0,
						label: 'Clear sessions',
						leftIcon: <Database className="mr-2 h-4 w-4" />,
						onClick: handleClearUserSessions,
					},
				],
			},
			{
				items: [
					{
						label: 'Edit',
						leftIcon: <Pencil className="mr-2 h-4 w-4" />,
						onClick: () => navigate(paths.updateUser(user.id)),
					},
					{
						disabled: isSelf,
						label: 'Delete',
						leftIcon: <Trash className="mr-2 h-4 w-4" />,
						onClick: () => setDeletingUser(user),
					},
					{
						disabled: isSelf || user.is_server_owner,
						label: `${user.is_locked ? 'Unlock' : 'Lock'} account`,
						leftIcon: user.is_locked ? (
							<Unlock className="mr-2 h-4 w-4" />
						) : (
							<Lock className="mr-2 h-4 w-4" />
						),
						onClick: () => handleSetLockStatus(!user.is_locked),
					},
				],
			},
		],

		[
			setDeletingUser,
			user,
			isSelf,
			userSessionsCount,
			navigate,
			onSelectForInspect,
			handleClearUserSessions,
			handleSetLockStatus,
		],
	)

	if (!isServerOwner) {
		return null
	}

	return (
		<DropdownMenu
			groups={groups}
			trigger={
				<IconButton size="xs" variant="ghost">
					<MoreVertical className="h-4 w-4" />
				</IconButton>
			}
			align="end"
		/>
	)
}
