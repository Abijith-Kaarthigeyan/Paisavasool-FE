import React from "react"
import { NavLink, useLocation } from "react-router-dom"
import { cn } from "@/lib/utils"
import { NAV_ICON_COLORS } from "@/lib/design-tokens"
import type { NavItem } from "./navigation"

export type SidebarNavVariant = "icon" | "full"

interface SidebarNavProps {
  items: NavItem[]
  onNavigate?: () => void
  variant?: SidebarNavVariant
}

function resolveItemPath(item: NavItem): string {
  return item.primaryPath ?? item.path ?? item.children?.[0]?.path ?? "/"
}

function isItemActive(item: NavItem, pathname: string, search: string): boolean {
  const target = resolveItemPath(item)

  if (item.children && item.children.length > 0) {
    return item.children.some((child) => {
      const [childPath, childSearch] = child.path.split("?")
      if (childSearch) {
        return pathname === childPath && search === `?${childSearch}`
      }
      if (child.path === "/collections") {
        return pathname === child.path
      }
      return pathname === child.path || pathname.startsWith(`${child.path}/`)
    })
  }

  if (target === "/collections") {
    return pathname === target
  }

  return pathname === target || pathname.startsWith(`${target}/`)
}

function getNavColors(name: string) {
  return NAV_ICON_COLORS[name] ?? { icon: "#4F46E5", activeBg: "#EEF2FF" }
}

const childLinkClass = ({ isActive }: { isActive: boolean }) =>
  cn(
    "flex items-center rounded-md py-2 pl-3 pr-3 text-sm font-medium transition-colors duration-150 border-l-2",
    isActive
      ? "border-l-primary bg-muted text-foreground"
      : "border-l-transparent text-muted-foreground hover:bg-muted/60 hover:text-foreground"
  )

const topLinkClass = ({ isActive }: { isActive: boolean }) =>
  cn(
    "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors duration-150 border-l-2",
    isActive
      ? "border-l-primary bg-muted text-foreground [&_svg]:text-foreground"
      : "border-l-transparent text-muted-foreground hover:bg-muted/60 hover:text-foreground [&_svg]:text-muted-foreground hover:[&_svg]:text-foreground"
  )

export const SidebarNav: React.FC<SidebarNavProps> = ({
  items,
  onNavigate,
  variant = "full",
}) => {
  const location = useLocation()

  if (variant === "icon") {
    return (
      <nav className="flex flex-1 flex-col items-center gap-1 overflow-y-auto px-2 py-3 no-scrollbar">
        {items.map((item) => {
          const target = resolveItemPath(item)
          const active = isItemActive(item, location.pathname, location.search)
          const colors = getNavColors(item.name)

          return (
            <NavLink
              key={item.name}
              to={target}
              end={target === "/collections"}
              title={item.name}
              aria-label={item.name}
              onClick={onNavigate}
              className={cn(
                "flex h-10 w-10 items-center justify-center rounded-full transition-colors duration-150",
                "focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-primary/40",
                active ? "" : "hover:bg-muted/80"
              )}
              style={active ? { backgroundColor: colors.activeBg } : undefined}
            >
              <item.icon
                className="h-5 w-5 shrink-0"
                style={{ color: colors.icon }}
                aria-hidden
              />
            </NavLink>
          )
        })}
      </nav>
    )
  }

  return (
    <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4 no-scrollbar">
      {items.map((item) => {
        const colors = getNavColors(item.name)

        if (item.children && item.children.length > 0) {
          return (
            <div key={item.name} className="space-y-0.5 pt-3 first:pt-0">
              <div className="flex items-center gap-2 px-3 py-1.5 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                <item.icon className="h-4 w-4 shrink-0" style={{ color: colors.icon }} aria-hidden />
                {item.name}
              </div>
              <div className="space-y-0.5">
                {item.children.map((child) => (
                  <NavLink
                    key={child.name}
                    to={child.path}
                    end={child.path === "/collections"}
                    onClick={onNavigate}
                    className={childLinkClass}
                  >
                    {child.name}
                  </NavLink>
                ))}
              </div>
            </div>
          )
        }

        return (
          <NavLink
            key={item.name}
            to={item.path!}
            onClick={onNavigate}
            className={topLinkClass}
          >
            <item.icon className="h-4 w-4 shrink-0" style={{ color: colors.icon }} aria-hidden />
            {item.name}
          </NavLink>
        )
      })}
    </nav>
  )
}
