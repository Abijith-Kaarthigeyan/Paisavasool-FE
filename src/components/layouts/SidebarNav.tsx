import React from "react"
import { NavLink } from "react-router-dom"
import { cn } from "@/lib/utils"
import type { NavItem } from "./navigation"

interface SidebarNavProps {
  items: NavItem[]
  onNavigate?: () => void
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

export const SidebarNav: React.FC<SidebarNavProps> = ({ items, onNavigate }) => {
  return (
    <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4 no-scrollbar">
      {items.map((item) => {
        if (item.children && item.children.length > 0) {
          return (
            <div key={item.name} className="space-y-0.5 pt-3 first:pt-0">
              <div className="flex items-center gap-2 px-3 py-1.5 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                <item.icon className="h-4 w-4 shrink-0" aria-hidden />
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
            <item.icon className="h-4 w-4 shrink-0" aria-hidden />
            {item.name}
          </NavLink>
        )
      })}
    </nav>
  )
}
