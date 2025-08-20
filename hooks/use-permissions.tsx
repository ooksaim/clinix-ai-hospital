import { useEffect, useState } from 'react'
import { 
  Role, 
  Permission, 
  hasPermission, 
  canAccessComponent, 
  getAvailableTabs,
  getPatientAccessLevel,
  getDataScope,
  ROLE_HIERARCHY
} from '@/lib/role-permissions'

interface UsePermissionsReturn {
  hasPermission: (permission: Permission) => boolean
  canAccessComponent: (componentId: string) => boolean
  getAvailableTabs: () => string[]
  patientAccessLevel: 'none' | 'view' | 'edit' | 'full'
  dataScope: 'all' | 'department' | 'own' | 'none'
  roleLevel: number
  canOverride: (otherRole: Role) => boolean
}

export function usePermissions(role: Role): UsePermissionsReturn {
  const [permissions, setPermissions] = useState<UsePermissionsReturn>({
    hasPermission: () => false,
    canAccessComponent: () => false,
    getAvailableTabs: () => [],
    patientAccessLevel: 'none',
    dataScope: 'none',
    roleLevel: 0,
    canOverride: () => false
  })

  useEffect(() => {
    setPermissions({
      hasPermission: (permission: Permission) => hasPermission(role, permission),
      canAccessComponent: (componentId: string) => canAccessComponent(role, componentId),
      getAvailableTabs: () => getAvailableTabs(role),
      patientAccessLevel: getPatientAccessLevel(role),
      dataScope: getDataScope(role),
      roleLevel: ROLE_HIERARCHY[role],
      canOverride: (otherRole: Role) => ROLE_HIERARCHY[role] > ROLE_HIERARCHY[otherRole]
    })
  }, [role])

  return permissions
}

// Component wrapper for permission-based rendering
interface PermissionGuardProps {
  role: Role
  permission?: Permission
  component?: string
  fallback?: React.ReactNode
  children: React.ReactNode
}

export function PermissionGuard({ 
  role, 
  permission, 
  component, 
  fallback = null, 
  children 
}: PermissionGuardProps) {
  const canAccess = permission 
    ? hasPermission(role, permission)
    : component 
    ? canAccessComponent(role, component)
    : true

  return canAccess ? <>{children}</> : <>{fallback}</>
}

// Hook for emergency override (for critical situations)
export function useEmergencyOverride(currentRole: Role) {
  const [isEmergencyMode, setIsEmergencyMode] = useState(false)
  const [overrideExpiry, setOverrideExpiry] = useState<Date | null>(null)

  const activateEmergencyOverride = (durationMinutes: number = 30) => {
    const expiry = new Date()
    expiry.setMinutes(expiry.getMinutes() + durationMinutes)
    
    setIsEmergencyMode(true)
    setOverrideExpiry(expiry)
    
    // Auto-deactivate after duration
    setTimeout(() => {
      setIsEmergencyMode(false)
      setOverrideExpiry(null)
    }, durationMinutes * 60 * 1000)
  }

  const deactivateEmergencyOverride = () => {
    setIsEmergencyMode(false)
    setOverrideExpiry(null)
  }

  return {
    isEmergencyMode,
    overrideExpiry,
    activateEmergencyOverride,
    deactivateEmergencyOverride,
    canActivateOverride: ROLE_HIERARCHY[currentRole] >= 3 // Doctor level or above
  }
}
