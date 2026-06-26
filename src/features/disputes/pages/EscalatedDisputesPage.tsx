import React, { useState, useMemo } from "react"
import { useNavigate } from "react-router-dom"
import { useQuery } from "@tanstack/react-query"
import { useDisputes, useReassignDispute } from "../hooks/useDisputes"
import { userService } from "@/features/users/services/userService"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { TableSkeleton, Skeleton } from "@/components/ui/skeleton"
import { Pagination } from "@/components/ui/pagination"
import { useToast } from "@/components/ui/toast"
import { PageHeader } from "@/components/ui/page-header"
import { FilterBar } from "@/components/ui/filter-bar"
import { EmptyState } from "@/components/ui/empty-state"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Select } from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { isTerminalDisputeStatus } from "../utils/disputeFormatters"
import { FolderOpen, ArrowUpDown, RefreshCw, UserMinus } from "lucide-react"

export const EscalatedDisputesPage: React.FC = () => {
  const navigate = useNavigate()
  const { toast } = useToast()
  const { data: disputes = [], isLoading, isError, refetch } = useDisputes()
  const reassignMutation = useReassignDispute()

  const [selectedDisputeId, setSelectedDisputeId] = useState<string | null>(null)
  const [selectedDisputeNum, setSelectedDisputeNum] = useState<string | null>(null)
  const [assigneeId, setAssigneeId] = useState("")

  const { data: users = [], isLoading: isUsersLoading } = useQuery({
    queryKey: ["users"],
    queryFn: userService.listUsers,
  })

  const associates = useMemo(() => {
    return users.filter((u) => u.role?.role_name === "FINANCE_ASSOCIATE")
  }, [users])

  const [searchTerm, setSearchTerm] = useState("")
  const [sortField, setSortField] = useState("created_at")
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc")
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 10

  const escalatedDisputes = useMemo(() => {
    return disputes.filter(
      (d) => d.sla?.status === "BREACHED" && !isTerminalDisputeStatus(d.status)
    )
  }, [disputes])

  const filteredEscalated = useMemo(() => {
    return escalatedDisputes
      .filter((d) => {
        const term = searchTerm.toLowerCase()
        return (
          d.dispute_number.toLowerCase().includes(term) ||
          (d.dispute_category || "").toLowerCase().includes(term)
        )
      })
      .sort((a, b) => {
        let aVal: unknown = a[sortField as keyof typeof a]
        let bVal: unknown = b[sortField as keyof typeof b]
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
  }, [escalatedDisputes, searchTerm, sortField, sortDirection])

  const totalItems = filteredEscalated.length
  const totalPages = Math.max(1, Math.ceil(totalItems / itemsPerPage))
  const startIndex = (currentPage - 1) * itemsPerPage
  const paginatedEscalated = filteredEscalated.slice(startIndex, startIndex + itemsPerPage)

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

  const handleOpenReassign = (e: React.MouseEvent, id: string, num: string) => {
    e.stopPropagation()
    setSelectedDisputeId(id)
    setSelectedDisputeNum(num)
    setAssigneeId("")
  }

  const handleConfirmReassign = async () => {
    if (!selectedDisputeId || !assigneeId) return

    try {
      await reassignMutation.mutateAsync({
        id: selectedDisputeId,
        assignedTo: assigneeId,
      })

      toast({
        title: "Dispute Reassigned",
        description: `Dispute ${selectedDisputeNum} reassigned successfully.`,
        type: "success",
      })

      setSelectedDisputeId(null)
      setSelectedDisputeNum(null)
    } catch {
      toast({
        title: "Reassignment Failed",
        description: "An error occurred while reassigning the dispute.",
        type: "error",
      })
    }
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-150">
      <PageHeader
        title="Escalated disputes"
        actions={
          <Button variant="secondary" size="sm" onClick={() => refetch()}>
            <RefreshCw className="h-3.5 w-3.5" aria-hidden />
            Refresh queue
          </Button>
        }
      />

      <FilterBar
        searchValue={searchTerm}
        onSearchChange={(value) => {
          setSearchTerm(value)
          setCurrentPage(1)
        }}
        searchPlaceholder="Search by dispute number or category…"
        showClear={!!searchTerm}
        onClear={() => {
          setSearchTerm("")
          setCurrentPage(1)
        }}
      />

      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <TableSkeleton rows={8} columns={7} />
          ) : isError ? (
            <EmptyState
              icon={<FolderOpen className="h-6 w-6 text-destructive" />}
              title="Failed to load escalated queue"
              action={
                <Button size="sm" onClick={() => refetch()}>
                  Retry
                </Button>
              }
            />
          ) : paginatedEscalated.length === 0 ? (
            <EmptyState
              title="No escalated disputes"
              description="No active SLA breaches or escalated disputes at this time."
            />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>
                    <button
                      type="button"
                      onClick={() => handleSort("dispute_number")}
                      aria-sort={getSortAria("dispute_number")}
                      className="inline-flex items-center gap-1 hover:text-foreground"
                    >
                      Dispute number
                      <ArrowUpDown className="h-3 w-3" aria-hidden />
                    </button>
                  </TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead className="text-center">Level</TableHead>
                  <TableHead>Manager</TableHead>
                  <TableHead className="text-center">SLA</TableHead>
                  <TableHead className="text-center">Escalated</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedEscalated.map((d) => (
                  <TableRow
                    key={d.id}
                    className="cursor-pointer"
                    onClick={() => navigate(`/disputes/${d.id}`)}
                  >
                    <TableCell className="font-medium text-primary">
                      {d.dispute_number}
                    </TableCell>
                    <TableCell className="text-muted-foreground">{d.dispute_category}</TableCell>
                    <TableCell className="text-center font-medium">Level 1</TableCell>
                    <TableCell className="text-muted-foreground">
                      {d.manager_name || "Finance manager"}
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge variant="destructive" shape="pill">
                        {d.sla?.status || "Breached"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-center tabular-nums text-muted-foreground">
                      {d.sla?.paused_at
                        ? new Date(d.sla.paused_at).toLocaleDateString()
                        : new Date(d.created_at).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={(e) => handleOpenReassign(e, d.id, d.dispute_number)}
                      >
                        <UserMinus className="h-3 w-3" aria-hidden />
                        Reassign
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
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

      <Dialog
        open={selectedDisputeId !== null}
        onOpenChange={(open) => !open && setSelectedDisputeId(null)}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Reassign dispute {selectedDisputeNum}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label htmlFor="reassign-associate">Finance associate</Label>
              {isUsersLoading ? (
                <Skeleton className="h-10 w-full" />
              ) : (
                <Select
                  id="reassign-associate"
                  value={assigneeId}
                  onChange={(e) => setAssigneeId(e.target.value)}
                >
                  <option value="">Choose associate…</option>
                  {associates.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.first_name} {a.last_name} ({a.email})
                    </option>
                  ))}
                </Select>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setSelectedDisputeId(null)}
            >
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={handleConfirmReassign}
              disabled={!assigneeId}
              loading={reassignMutation.isPending}
            >
              Confirm reassign
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default EscalatedDisputesPage
