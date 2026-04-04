import { useEffect, useState } from 'react'
import {
  buildAuthHeaders,
  buildJsonAuthHeaders,
} from '../../../lib/request-headers'
import type { ApiTask, Organization, StoreUser } from '../../home/model'

type UseArchivePageParams = {
  token: string | null
  rehydrated: boolean
  redirectToLogin: () => void
}

export default function useArchivePage({
  token,
  rehydrated,
  redirectToLogin,
}: UseArchivePageParams) {
  const [checking, setChecking] = useState(true)
  const [organization, setOrganization] = useState<Organization | null>(null)
  const [tasks, setTasks] = useState<ApiTask[]>([])
  const [integrationError, setIntegrationError] = useState<string | null>(null)
  const [busyTaskId, setBusyTaskId] = useState<number | null>(null)
  const [currentUser, setCurrentUser] = useState<StoreUser | null>(null)

  async function updateArchivedTask(taskId: number, archivedAt: string | null) {
    setBusyTaskId(taskId)
    setIntegrationError(null)

    try {
      if (currentUser?.role === 'guest') {
        setIntegrationError('Guests can only read archived tasks.')
        return false
      }

      const response = await fetch(`/api/task/${taskId}`, {
        method: 'PUT',
        headers: buildJsonAuthHeaders(token),
        body: JSON.stringify({ archivedAt }),
      })

      if (!response.ok) {
        const data = await response.json().catch(() => null)
        setIntegrationError(data?.error || 'Failed to update archived task.')
        return false
      }

      setTasks((prev) => prev.filter((task) => task.id !== taskId))
      return true
    } catch (error) {
      console.error('archive update error', error)
      setIntegrationError('Failed to update archived task.')
      return false
    } finally {
      setBusyTaskId(null)
    }
  }

  async function deleteArchivedTask(taskId: number) {
    setBusyTaskId(taskId)
    setIntegrationError(null)

    try {
      if (currentUser?.role === 'guest') {
        setIntegrationError('Guests can only read archived tasks.')
        return false
      }

      const response = await fetch(`/api/task/${taskId}`, {
        method: 'DELETE',
        headers: buildAuthHeaders(token),
      })
      if (!response.ok) {
        const data = await response.json().catch(() => null)
        setIntegrationError(data?.error || 'Failed to delete archived task.')
        return false
      }

      setTasks((prev) => prev.filter((task) => task.id !== taskId))
      return true
    } catch (error) {
      console.error('archive delete error', error)
      setIntegrationError('Failed to delete archived task.')
      return false
    } finally {
      setBusyTaskId(null)
    }
  }

  useEffect(() => {
    let mounted = true

    async function loadPage() {
      try {
        if (!rehydrated) return
        if (!token) {
          redirectToLogin()
          return
        }

        const verifyResponse = await fetch('/api/verify', {
          method: 'GET',
          headers: { Authorization: `Bearer ${token}` },
        })

        if (!verifyResponse.ok) {
          redirectToLogin()
          return
        }

        const verifyData = await verifyResponse.json().catch(() => null)
        const verifiedUser =
          verifyData && typeof verifyData === 'object' && 'user' in verifyData
            ? (verifyData.user as StoreUser)
            : null

        if (mounted) {
          setCurrentUser(verifiedUser)
        }

        const organizationId = verifiedUser?.organizationId ?? null
        if (organizationId) {
          const organizationResponse = await fetch(
            `/api/organization/${organizationId}`,
            { headers: buildAuthHeaders(token) }
          )
          if (organizationResponse.ok) {
            const organizationData =
              (await organizationResponse.json()) as Organization
            if (mounted) setOrganization(organizationData)
          }
        }

        const url = organizationId
          ? `/api/task?organizationId=${organizationId}&archived=only`
          : '/api/task?archived=only'

        const taskResponse = await fetch(url, {
          headers: buildAuthHeaders(token),
        })
        if (!taskResponse.ok) {
          const data = await taskResponse.json().catch(() => null)
          throw new Error(data?.error || 'Failed to load archived tasks')
        }

        const taskData = (await taskResponse.json()) as ApiTask[]
        if (mounted) {
          setTasks(Array.isArray(taskData) ? taskData : [])
        }
      } catch (error) {
        console.error('archive page load error', error)
        if (mounted) setIntegrationError('Failed to load archive.')
      } finally {
        if (mounted) setChecking(false)
      }
    }

    void loadPage()

    return () => {
      mounted = false
    }
  }, [rehydrated, token, redirectToLogin])

  return {
    checking,
    organization,
    tasks,
    integrationError,
    busyTaskId,
    currentUser,
    updateArchivedTask,
    deleteArchivedTask,
  }
}
