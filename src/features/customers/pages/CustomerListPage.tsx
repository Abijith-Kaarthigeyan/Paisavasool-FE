import React, { useState } from "react"
import { useNavigate } from "react-router-dom"
import { useCustomers } from "../hooks/useCustomers"
import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Pagination } from "@/components/ui/pagination"
import { 
  Search, 
  RefreshCw, 
  HelpCircle,
  Inbox,
  Users
} from "lucide-react"

export const CustomerListPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState<string>( "");
  const [currentPage, setCurrentPage] = useState<number>(1);
  const itemsPerPage = 10;

  const { 
    data: customers = [], 
    isLoading, 
    isError, 
    refetch 
  } = useCustomers();

  const handleRowClick = (customerId: string) => {
    navigate(`/customers/${customerId}`);
  };

  // Filter local calculations
  const filteredCustomers = customers.filter(cust => {
    const term = searchTerm.toLowerCase().trim();
    if (!term) return true;
    return (
      cust.customer_name.toLowerCase().includes(term) ||
      cust.customer_code.toLowerCase().includes(term) ||
      (cust.email && cust.email.toLowerCase().includes(term))
    );
  });

  const totalItems = filteredCustomers.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / itemsPerPage));
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedCustomers = filteredCustomers.slice(startIndex, startIndex + itemsPerPage);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-border pb-5 gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground m-0 flex items-center gap-2">
            <Users className="h-6 w-6 text-primary" /> Customers Directory
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            View active clients, register details, and check customer credit accounts.
          </p>
        </div>
        <button
          onClick={() => refetch()}
          className="flex items-center gap-1.5 self-start sm:self-center rounded-lg border border-border bg-card px-3.5 py-2 text-xs font-bold text-foreground hover:bg-muted transition-colors"
        >
          <RefreshCw className="h-3.5 w-3.5" /> Refresh Directory
        </button>
      </header>

      {/* Filter and Content Controls */}
      <Card className="border-border shadow-xs">
        <CardContent className="p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex flex-1 items-center space-x-2 w-full">
            <Search className="h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search by name, customer code, or email..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              className="rounded-lg border border-input bg-background px-3 py-1.5 text-xs font-semibold focus:ring-1 focus:ring-primary focus:outline-hidden text-foreground w-full max-w-md"
            />
          </div>
          <div className="text-xs text-muted-foreground self-end sm:self-center font-semibold">
            Total Customers: {filteredCustomers.length}
          </div>
        </CardContent>
      </Card>

      {/* Customers List Table */}
      <Card className="border-border shadow-xs">
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-6 space-y-4">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-24 w-full" />
              <Skeleton className="h-24 w-full" />
            </div>
          ) : isError ? (
            <div className="p-12 text-center space-y-4">
              <HelpCircle className="h-12 w-12 text-destructive mx-auto" />
              <h3 className="text-base font-bold text-foreground">Failed to Load Customers</h3>
              <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                Verify the Accounts Receivable database backend service is active and responsive.
              </p>
              <button
                onClick={() => refetch()}
                className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-xs font-bold text-primary-foreground hover:bg-primary/95 transition-colors"
              >
                <RefreshCw className="h-3.5 w-3.5" /> Retry Fetch
              </button>
            </div>
          ) : filteredCustomers.length === 0 ? (
            <div className="p-12 text-center space-y-3">
              <Inbox className="h-10 w-10 text-slate-300 mx-auto" />
              <p className="text-sm text-muted-foreground font-semibold">No customers match the search criteria.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-border text-muted-foreground uppercase text-xs font-semibold bg-slate-50/50 dark:bg-zinc-900/10">
                    <th className="py-3 px-4">Customer Code</th>
                    <th className="py-3 px-4">Name</th>
                    <th className="py-3 px-4">Email</th>
                    <th className="py-3 px-4">Phone</th>
                    <th className="py-3 px-4">Billing Address</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {paginatedCustomers.map((cust) => (
                    <tr
                      key={cust.id}
                      onClick={() => handleRowClick(cust.id)}
                      className="hover:bg-slate-50/50 dark:hover:bg-zinc-900/40 cursor-pointer transition-colors"
                    >
                      <td className="py-3.5 px-4 font-semibold text-primary hover:underline">
                        {cust.customer_code}
                      </td>
                      <td className="py-3.5 px-4 text-foreground font-semibold">
                        {cust.customer_name}
                      </td>
                      <td className="py-3.5 px-4 text-muted-foreground">
                        {cust.email || "—"}
                      </td>
                      <td className="py-3.5 px-4 text-muted-foreground">
                        {cust.phone || "—"}
                      </td>
                      <td className="py-3.5 px-4 text-muted-foreground truncate max-w-xs">
                        {cust.billing_address || "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Pagination controls */}
      {!isLoading && !isError && totalPages > 1 && (
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
        />
      )}
    </div>
  );
};

export default CustomerListPage;
