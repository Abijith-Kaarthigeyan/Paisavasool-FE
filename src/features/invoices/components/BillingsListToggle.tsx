import { useNavigate } from "react-router-dom"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"

export type BillingsListTab = "invoices" | "purchase-orders" | "grns"

interface BillingsListToggleProps {
  active: BillingsListTab
}

const TAB_PATHS: Record<BillingsListTab, string> = {
  invoices: "/invoices",
  "purchase-orders": "/purchase-orders",
  grns: "/grns",
}

export function BillingsListToggle({ active }: BillingsListToggleProps) {
  const navigate = useNavigate()

  return (
    <Tabs
      value={active}
      defaultValue={active}
      onValueChange={(value) => {
        const tab = value as BillingsListTab
        navigate(TAB_PATHS[tab])
      }}
    >
      <TabsList className="w-auto">
        <TabsTrigger value="invoices">Invoices</TabsTrigger>
        <TabsTrigger value="purchase-orders">Purchase orders</TabsTrigger>
        <TabsTrigger value="grns">GRNs</TabsTrigger>
      </TabsList>
    </Tabs>
  )
}
