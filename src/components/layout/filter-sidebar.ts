import type { NavGroup, NavItem, NavCollapsible, NavLink } from './types'

function itemMatchesRoles(roles: string[] | undefined, userRoles: string[]) {
  if (!roles || roles.length === 0) return true
  return roles.some((r) => userRoles.includes(r))
}

function filterNavItem(
  item: NavItem,
  userRoles: string[]
): NavItem | null {
  if (!itemMatchesRoles(item.roles, userRoles)) return null

  if ('items' in item && item.items) {
    const filteredChildren = item.items.filter((child) =>
      itemMatchesRoles(child.roles, userRoles)
    )

    if (filteredChildren.length === 0) return null

    return { ...item, items: filteredChildren } as NavCollapsible
  }

  return item as NavLink
}

export function filterSidebar(
  navGroups: NavGroup[],
  userRoles: string[]
): NavGroup[] {
  return navGroups
    .map((group) => {
      if (!itemMatchesRoles(group.roles, userRoles)) return null

      const filteredItems = group.items
        .map((item) => filterNavItem(item, userRoles))
        .filter((item): item is NavItem => item !== null)

      if (filteredItems.length === 0) return null

      return { ...group, items: filteredItems }
    })
    .filter((group): group is NavGroup => group !== null)
}
