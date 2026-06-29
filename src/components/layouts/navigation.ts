import {
  LayoutDashboard,
  FileText,
  History,
  CreditCard,
  AlertTriangle,
  type LucideIcon,
} from "lucide-react"

export interface NavChildItem {
  name: string
  path: string
  roles?: string[]
}

export interface NavItem {
  name: string
  path?: string
  /** Landing path when sidebar shows a single icon for grouped nav items */
  primaryPath?: string
  icon: LucideIcon
  roles: string[]
  children?: NavChildItem[]
}

export const navigationItems: NavItem[] = [
  {
    name: "Dashboard",
    path: "/dashboard",
    icon: LayoutDashboard,
    roles: ["ADMIN", "FINANCE_MANAGER", "FINANCE_ASSOCIATE"],
  },
  {
    name: "Disputes",
    primaryPath: "/disputes",
    roles: ["FINANCE_MANAGER", "FINANCE_ASSOCIATE"],
    icon: AlertTriangle,
    children: [
      { name: "Disputes Dashboard", path: "/disputes", roles: ["FINANCE_MANAGER", "FINANCE_ASSOCIATE"] },
      { name: "Open Disputes", path: "/disputes/open", roles: ["FINANCE_MANAGER", "FINANCE_ASSOCIATE"] },
      { name: "My Assigned Disputes", path: "/disputes/assigned", roles: ["FINANCE_ASSOCIATE"] },
      { name: "Escalated Disputes", path: "/disputes/escalated", roles: ["FINANCE_MANAGER", "FINANCE_ASSOCIATE"] },
      { name: "SLA Breaches", path: "/disputes/open?sla=breached", roles: ["FINANCE_MANAGER"] },
      { name: "Review Queue", path: "/disputes/review-queue", roles: ["FINANCE_MANAGER", "FINANCE_ASSOCIATE"] },
      { name: "Waiting Customer", path: "/disputes/waiting-customer", roles: ["FINANCE_MANAGER", "FINANCE_ASSOCIATE"] },
      { name: "Waiting Internal Team", path: "/disputes/waiting-internal", roles: ["FINANCE_MANAGER", "FINANCE_ASSOCIATE"] },
      { name: "Team Disputes", path: "/disputes/open?team=true", roles: ["FINANCE_MANAGER"] },
      { name: "Dispute Cases", path: "/disputes/cases", roles: ["FINANCE_MANAGER", "FINANCE_ASSOCIATE"] },
    ],
  },
  {
    name: "Invoices",
    primaryPath: "/invoices",
    roles: ["FINANCE_ASSOCIATE"],
    icon: FileText,
    children: [
      { name: "Invoice List", path: "/invoices", roles: ["FINANCE_ASSOCIATE"] },
    ],
  },
  {
    name: "Payments",
    primaryPath: "/payment-reviews",
    roles: ["FINANCE_ASSOCIATE"],
    icon: CreditCard,
    children: [
      { name: "Upload History", path: "/payment-upload-history", roles: ["FINANCE_ASSOCIATE"] },
      { name: "Matching Reviews", path: "/payment-reviews", roles: ["FINANCE_ASSOCIATE"] },
    ],
  },
  {
    name: "Collections",
    primaryPath: "/collections",
    roles: ["FINANCE_MANAGER", "FINANCE_ASSOCIATE"],
    icon: History,
    children: [
      { name: "Collections Dashboard", path: "/collections", roles: ["FINANCE_MANAGER", "FINANCE_ASSOCIATE"] },
      { name: "Open Cases", path: "/collections/open", roles: ["FINANCE_MANAGER", "FINANCE_ASSOCIATE"] },
      { name: "My Assigned Cases", path: "/collections/assigned", roles: ["FINANCE_ASSOCIATE"] },
      { name: "Team Collections", path: "/collections/assigned", roles: ["FINANCE_MANAGER"] },
      { name: "Escalated Cases", path: "/collections/escalated", roles: ["FINANCE_MANAGER"] },
      { name: "Broken Promises", path: "/collections/broken-promises", roles: ["FINANCE_MANAGER", "FINANCE_ASSOCIATE"] },
      { name: "Reminder History", path: "/collections/reminders", roles: ["FINANCE_ASSOCIATE", "FINANCE_MANAGER"] },
    ],
  },
]

export function filterNavItemsForRole(
  items: NavItem[],
  role: string | undefined
): NavItem[] {
  return items
    .filter((item) => role && item.roles.includes(role))
    .map((item) => {
      if (item.children) {
        return {
          ...item,
          children: item.children.filter(
            (child) => !child.roles || (role && child.roles.includes(role))
          ),
        }
      }
      return item
    })
}
