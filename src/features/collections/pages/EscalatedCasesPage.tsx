import React, { useMemo, useState } from "react"
import { useNavigate } from "react-router-dom"
import { useQuery } from "@tanstack/react-query"
import {
  useEscalatedCases,
  useReassignCase,
  useCloseCase,
  useOverrideStatus,
} from "../hooks/useCollections"
import { userService } from "@/features/users/services/userService"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { TableSkeleton } from "@/components/ui/skeleton"
import { Pagination } from "@/components/ui/pagination"
import { PageHeader } from "@/components/ui/page-header"
import { FilterBar } from "@/components/ui/filter-bar"
import { EmptyState } from "@/components/ui/empty-state"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Select } from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { AGING_BUCKET_VARIANT, getStatusVariant } from "@/lib/design-tokens"
import { useToast } from "@/components/ui/toast"
import {
  AlertTriangle,
  ArrowUpDown,
  RefreshCw,
  UserPlus,
  XCircle,
  Settings,
  Eye,
} from "lucide-react"

export const EscalatedCasesPage: React.FC = () => {
  const navigate = useNavigate()
  const { toast } = useToast()
  const { data: cases = [], isLoading, isError, refetch } = useEscalatedCases()

  const { data: allUsers = [] } = useQuery({
    queryKey: ["users"],
    queryFn: userService.listUsers,
  })

  const associates = useMemo(() => {
    return allUsers.filter((u) => u.role.role_name === "FINANCE_ASSOCIATE" && u.is_active)
  }, [allUsers])

  const reassignMutation = useReassignCase()
  const closeMutation = useCloseCase()
  const overrideMutation = useOverrideStatus()

  const [searchTerm, setSearchTerm] = useState("")
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 10

  const [sortField, setSortField] = useState("escalated_at")
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc")

  const [selectedCaseId, setSelectedCaseId] = useState<string | null>(null)
  const [isReassignOpen, setIsReassignOpen] = useState(false)
  const [isCloseOpen, setIsCloseOpen] = useState(false)
  const [isOverrideOpen, setIsOverrideOpen] = useState(false)

  const [targetAssociateId, setTargetAssociateId] = useState("")
  const [targetStatus, setTargetStatus] = useState("")

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc")
    } else {
      setSortField(field)
      setSortDirection("desc")
    }
    setCurrentPage(1)
  }

  const getSortAria = (field: string): "none" | "ascending" | "descending" => {
    if (sortField !== field) return "none"
    return sortDirection === "asc" ? "ascending" : "descending"
  }

  const filteredCases = useMemo(() => {
    return cases
      .filter((c) => {
        const term = searchTerm.toLowerCase()
        return (
          c.id.toLowerCase().includes(term) ||
          (c.customer?.customer_name || "").toLowerCase().includes(term) ||
          (c.invoice?.invoice_number || "").toLowerCase().includes(term)
        )
      })
      .sort((a, b) => {
        let aVal: unknown
        let bVal: unknown

        if (sortField === "invoice_number") {
          aVal = a.invoice?.invoice_number || ""
          bVal = b.invoice?.invoice_number || ""
        } else if (sortField === "customer_name") {
          aVal = a.customer?.customer_name || ""
          bVal = b.customer?.customer_name || ""
        } else if (sortField === "outstanding_amount") {
          aVal = a.invoice?.outstanding_amount ?? a.outstanding_amount_snapshot
          bVal = b.invoice?.outstanding_amount ?? b.outstanding_amount_snapshot
        } else {
          aVal = a[sortField as keyof typeof a]
          bVal = b[sortField as keyof typeof b]
        }

        if (aVal === undefined || aVal === null) return 1
        if (bVal === undefined || bVal === null) return -1

        if (typeof aVal === "string") {
          return sortDirection === "asc"
            ? aVal.localeCompare(String(bVal))
            : String(bVal).localeCompare(aVal)
        }
        return sortDirection === "asc"
          ? Number(aVal) - Number(bVal)
          : Number(bVal) - Number(aVal)
      })
  }, [cases, searchTerm, sortField, sortDirection])

  const totalItems = filteredCases.length
  const totalPages = Math.max(1, Math.ceil(totalItems / itemsPerPage))
  const startIndex = (currentPage - 1) * itemsPerPage
  const paginatedCases = filteredCases.slice(startIndex, startIndex + itemsPerPage)

  const handleReassignSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedCaseId || !targetAssociateId) return

    reassignMutation.mutate(
      { caseId: selectedCaseId, associateId: targetAssociateId },
      {
        onSuccess: () => {
          setIsReassignOpen(false)
          setSelectedCaseId(null)
          setTargetAssociateId("")
          toast({
            title: "Case reassigned",
            description: "The case has been reassigned to the selected associate.",
            type: "success",
          })
        },
        onError: () => {
          toast({
            title: "Reassignment failed",
            description: "There was an error reassigning this case.",
            type: "error",
          })
        },
      }
    )
  }

  const handleCloseSubmit = () => {
    if (!selectedCaseId) return

    closeMutation.mutate(selectedCaseId, {
      onSuccess: () => {
        setIsCloseOpen(false)
        setSelectedCaseId(null)
        toast({
          title: "Case closed",
          description: "The collection case has been manually closed.",
          type: "success",
        })
      },
      onError: () => {
        toast({
          title: "Failed to close case",
          description: "There was an error closing this case.",
          type: "error",
        })
      },
    })
  }

  const handleOverrideSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedCaseId || !targetStatus) return

    overrideMutation.mutate(
      { caseId: selectedCaseId, newStatus: targetStatus },
      {
        onSuccess: () => {
          setIsOverrideOpen(false)
          setSelectedCaseId(null)
          setTargetStatus("")
          toast({
            title: "Status overridden",
            description: "The collection status has been overridden successfully.",
            type: "success",
          })
        },
        onError: () => {
          toast({
            title: "Override failed",
            description: "There was an error overriding the collection status.",
            type: "error",
          })
        },
      }
    )
  }

  const closeDialog = (setter: (open: boolean) => void) => {
    setter(false)
    setSelectedCaseId(null)
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-150">
      <PageHeader
        title="Escalated cases"
        description="Review cases requiring manager intervention, status override, or workload reassignment."
        actions={
          <Button variant="secondary" size="sm" onClick={() => refetch()}>
            <RefreshCw className="h-3.5 w-3.5" aria-hidden />
            Refresh list
          </Button>
        }
      />

      <Card>
        <CardContent className="p-4">
          <FilterBar
            searchValue={searchTerm}
            onSearchChange={(value) => {
              setSearchTerm(value)
              setCurrentPage(1)
            }}
            searchPlaceholder="Search escalated cases by customer or invoice…"
            showClear={!!searchTerm}
            onClear={() => {
              setSearchTerm("")
              setCurrentPage(1)
            }}
          />
        </CardContent>
      </Card>

      <Card className="border-t-2 border-t-destructive/40">
        <CardContent className="p-0">
          {isLoading ? (
            <TableSkeleton rows={8} columns={7} />
          ) : isError ? (
            <EmptyState
              icon={<AlertTriangle className="h-6 w-6 text-destructive" />}
              title="Failed to load escalated cases"
              description="Ensure you have manager permissions and the API is online."
              action={
                <Button size="sm" onClick={() => refetch()}>
                  Retry
                </Button>
              }
            />
          ) : paginatedCases.length === 0 ? (
            <EmptyState
              icon={<AlertTriangle className="h-6 w-6 text-success" />}
              title="No escalated cases"
              description="No collection cases are currently in escalated state."
            />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>
                    <button
                      type="button"
                      onClick={() => handleSort("customer_name")}
                      aria-sort={getSortAria("customer_name")}
                      className="inline-flex items-center gap-1 hover:text-foreground"
                    >
                      Customer
                      <ArrowUpDown className="h-3 w-3" aria-hidden />
                    </button>
                  </TableHead>
                  <TableHead>Invoice</TableHead>
                  <TableHead className="text-right">Outstanding</TableHead>
                  <TableHead className="text-center">Bucket</TableHead>
                  <TableHead className="text-center">
                    <button
                      type="button"
                      onClick={() => handleSort("escalated_at")}
                      aria-sort={getSortAria("escalated_at")}
                      className="mx-auto inline-flex items-center gap-1 hover:text-foreground"
                    >
                      Escalated at
                      <ArrowUpDown className="h-3 w-3" aria-hidden />
                    </button>
                  </TableHead>
                  <TableHead>Associate</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedCases.map((c) => {
                  const outstanding =
                    c.invoice?.outstanding_amount ?? c.outstanding_amount_snapshot
                  return (
                    <TableRow key={c.id}>
                      <TableCell className="max-w-[150px] truncate font-medium">
                        {c.customer?.customer_name || "Active client"}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {c.invoice?.invoice_number || "INV-N/A"}
                      </TableCell>
                      <TableCell className="text-right font-medium tabular-nums">
                        ₹{outstanding.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge
                          variant={getStatusVariant(AGING_BUCKET_VARIANT, c.aging_bucket)}
                          shape="pill"
                        >
                          {c.aging_bucket}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center tabular-nums text-destructive">
                        {c.escalated_at
                          ? new Date(c.escalated_at).toLocaleString()
                          : new Date(c.updated_at).toLocaleString()}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {c.assigned_associate_name}
                      </TableCell>
                      <TableCell className="text-right">
                        <div
                          className="flex justify-end items-center gap-1.5"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => navigate(`/collections/${c.id}`)}
                          >
                            <Eye className="h-3.5 w-3.5" aria-hidden />
                            Details
                          </Button>
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => {
                              setSelectedCaseId(c.id)
                              setTargetAssociateId(c.assigned_to || "")
                              setIsReassignOpen(true)
                            }}
                          >
                            <UserPlus className="h-3.5 w-3.5" aria-hidden />
                            Reassign
                          </Button>
                          <Button
                            variant="secondary"
                            size="sm"
                            className="text-warning"
                            onClick={() => {
                              setSelectedCaseId(c.id)
                              setTargetStatus(c.status)
                              setIsOverrideOpen(true)
                            }}
                          >
                            <Settings className="h-3.5 w-3.5" aria-hidden />
                            Override
                          </Button>
                          <Button
                            variant="danger"
                            size="sm"
                            onClick={() => {
                              setSelectedCaseId(c.id)
                              setIsCloseOpen(true)
                            }}
                          >
                            <XCircle className="h-3.5 w-3.5" aria-hidden />
                            Close
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {!isLoading && !isError && totalPages > 1 && (
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
          totalItems={totalItems}
          pageSize={itemsPerPage}
        />
      )}

      <Dialog open={isReassignOpen} onOpenChange={setIsReassignOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reassign collection case</DialogTitle>
            <DialogDescription>
              Assign this escalated case to another active Finance Associate.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleReassignSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="escalated-reassign-associate">Select associate</Label>
              <Select
                id="escalated-reassign-associate"
                value={targetAssociateId}
                onChange={(e) => setTargetAssociateId(e.target.value)}
                required
              >
                <option value="">Choose associate…</option>
                {associates.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.first_name} {a.last_name} ({a.email})
                  </option>
                ))}
              </Select>
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() => closeDialog(setIsReassignOpen)}
              >
                Cancel
              </Button>
              <Button type="submit" size="sm" loading={reassignMutation.isPending}>
                Confirm reassignment
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={isOverrideOpen} onOpenChange={setIsOverrideOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Override case status</DialogTitle>
            <DialogDescription>
              Manually set the collections workflow status. This overrides automated triggers.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleOverrideSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="escalated-override-status">New status</Label>
              <Select
                id="escalated-override-status"
                value={targetStatus}
                onChange={(e) => setTargetStatus(e.target.value)}
                required
              >
                <option value="OPEN">Open</option>
                <option value="IN_PROGRESS">In progress</option>
                <option value="PROMISED">Promised</option>
                <option value="ESCALATED">Escalated</option>
                <option value="DISPUTED">Disputed</option>
              </Select>
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() => closeDialog(setIsOverrideOpen)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                size="sm"
                variant="secondary"
                className="border-warning/30 bg-warning-muted text-warning"
                loading={overrideMutation.isPending}
              >
                Override status
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={isCloseOpen} onOpenChange={setIsCloseOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-5 w-5" aria-hidden />
              Close collection case
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to close this case manually? Closing indicates resolving all
              outstanding billing disputes or payment settlements.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => closeDialog(setIsCloseOpen)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="danger"
              size="sm"
              loading={closeMutation.isPending}
              onClick={handleCloseSubmit}
            >
              Yes, close case
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default EscalatedCasesPage
