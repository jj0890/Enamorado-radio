import { useState, useMemo, type ReactNode, type ComponentType } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Search,
  ChevronUp,
  ChevronDown,
  MoreHorizontal,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Trash2,
  Check,
  X,
  Star,
  Filter,
  RefreshCw
} from "lucide-react";

export interface Column<T> {
  key: string;
  header: string;
  sortable?: boolean;
  width?: string;
  render?: (item: T, index: number) => ReactNode;
  className?: string;
}

export interface BulkAction<T> {
  label: string;
  icon?: ComponentType<{ className?: string }>;
  variant?: "default" | "destructive" | "outline";
  onClick: (selectedItems: T[]) => void;
}

export interface RowAction<T> {
  label: string;
  icon?: ComponentType<{ className?: string }>;
  onClick: (item: T) => void;
  variant?: "default" | "destructive";
  show?: (item: T) => boolean;
}

export interface FilterOption {
  label: string;
  value: string;
}

interface DataTableProps<T extends { id: number | string }> {
  data: T[];
  columns: Column<T>[];
  bulkActions?: BulkAction<T>[];
  rowActions?: RowAction<T>[];
  searchPlaceholder?: string;
  searchKeys?: (keyof T)[];
  filters?: {
    key: string;
    label: string;
    options: FilterOption[];
  }[];
  pageSize?: number;
  isLoading?: boolean;
  emptyMessage?: string;
  onRefresh?: () => void;
  getRowId?: (item: T) => string | number;
}

export default function DataTable<T extends { id: number | string }>({
  data,
  columns,
  bulkActions = [],
  rowActions = [],
  searchPlaceholder = "Search...",
  searchKeys = [],
  filters = [],
  pageSize = 10,
  isLoading = false,
  emptyMessage = "No items found",
  onRefresh,
  getRowId = (item) => item.id,
}: DataTableProps<T>) {
  const [searchQuery, setSearchQuery] = useState("");
  const [sortColumn, setSortColumn] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
  const [selectedIds, setSelectedIds] = useState<Set<string | number>>(new Set());
  const [currentPage, setCurrentPage] = useState(1);
  const [activeFilters, setActiveFilters] = useState<Record<string, string>>({});

  // Filter data
  const filteredData = useMemo(() => {
    let result = [...data];

    // Apply search
    if (searchQuery && searchKeys.length > 0) {
      const query = searchQuery.toLowerCase();
      result = result.filter(item =>
        searchKeys.some(key => {
          const value = item[key];
          return value && String(value).toLowerCase().includes(query);
        })
      );
    }

    // Apply filters
    Object.entries(activeFilters).forEach(([key, value]) => {
      if (value && value !== "all") {
        result = result.filter(item => String((item as any)[key]) === value);
      }
    });

    // Apply sorting
    if (sortColumn) {
      result.sort((a, b) => {
        const aVal = (a as any)[sortColumn];
        const bVal = (b as any)[sortColumn];
        
        if (aVal === bVal) return 0;
        if (aVal === null || aVal === undefined) return 1;
        if (bVal === null || bVal === undefined) return -1;
        
        const comparison = aVal < bVal ? -1 : 1;
        return sortDirection === "asc" ? comparison : -comparison;
      });
    }

    return result;
  }, [data, searchQuery, searchKeys, sortColumn, sortDirection, activeFilters]);

  // Pagination
  const totalPages = Math.ceil(filteredData.length / pageSize);
  const paginatedData = filteredData.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  // Selection helpers
  const allOnPageSelected = paginatedData.length > 0 && 
    paginatedData.every(item => selectedIds.has(getRowId(item)));
  
  const someSelected = selectedIds.size > 0;

  const toggleSelectAll = () => {
    if (allOnPageSelected) {
      const newSelected = new Set(selectedIds);
      paginatedData.forEach(item => newSelected.delete(getRowId(item)));
      setSelectedIds(newSelected);
    } else {
      const newSelected = new Set(selectedIds);
      paginatedData.forEach(item => newSelected.add(getRowId(item)));
      setSelectedIds(newSelected);
    }
  };

  const toggleSelect = (id: string | number) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedIds(newSelected);
  };

  const handleSort = (column: string) => {
    if (sortColumn === column) {
      setSortDirection(prev => prev === "asc" ? "desc" : "asc");
    } else {
      setSortColumn(column);
      setSortDirection("asc");
    }
  };

  const selectedItems = data.filter(item => selectedIds.has(getRowId(item)));

  const clearSelection = () => setSelectedIds(new Set());

  return (
    <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
      {/* Toolbar */}
      <div className="p-4 border-b border-gray-200 space-y-3">
        <div className="flex flex-wrap items-center gap-3">
          {/* Search */}
          <div className="relative flex-1 min-w-[200px] max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              type="text"
              placeholder={searchPlaceholder}
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              className="pl-9 h-9"
              data-testid="input-search"
            />
          </div>

          {/* Filters */}
          {filters.map((filter) => (
            <Select
              key={filter.key}
              value={activeFilters[filter.key] || "all"}
              onValueChange={(value) => {
                setActiveFilters(prev => ({ ...prev, [filter.key]: value }));
                setCurrentPage(1);
              }}
            >
              <SelectTrigger className="w-[140px] h-9" data-testid={`filter-${filter.key}`}>
                <Filter className="w-3 h-3 mr-2" />
                <SelectValue placeholder={filter.label} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All {filter.label}</SelectItem>
                {filter.options.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          ))}

          {/* Refresh */}
          {onRefresh && (
            <Button
              variant="outline"
              size="sm"
              onClick={onRefresh}
              disabled={isLoading}
              className="h-9"
              data-testid="button-refresh"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            </Button>
          )}
        </div>

        {/* Bulk Actions */}
        {someSelected && bulkActions.length > 0 && (
          <div className="flex items-center gap-2 p-2 bg-navy/5 rounded-lg">
            <span className="text-sm font-medium text-navy">
              {selectedIds.size} selected
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={clearSelection}
              className="text-xs h-7"
            >
              Clear
            </Button>
            <div className="h-4 w-px bg-gray-300" />
            {bulkActions.map((action, index) => {
              const Icon = action.icon;
              return (
                <Button
                  key={index}
                  variant={action.variant || "outline"}
                  size="sm"
                  onClick={() => {
                    action.onClick(selectedItems);
                    clearSelection();
                  }}
                  className="h-7 text-xs"
                  data-testid={`bulk-action-${action.label.toLowerCase().replace(/\s+/g, '-')}`}
                >
                  {Icon && <Icon className="w-3 h-3 mr-1" />}
                  {action.label}
                </Button>
              );
            })}
          </div>
        )}
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              {/* Checkbox column */}
              {bulkActions.length > 0 && (
                <th className="w-12 px-4 py-3">
                  <Checkbox
                    checked={allOnPageSelected}
                    onCheckedChange={toggleSelectAll}
                    aria-label="Select all"
                    data-testid="checkbox-select-all"
                  />
                </th>
              )}
              
              {/* Data columns */}
              {columns.map((column) => (
                <th
                  key={column.key}
                  className={`px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider ${column.className || ''}`}
                  style={{ width: column.width }}
                >
                  {column.sortable ? (
                    <button
                      onClick={() => handleSort(column.key)}
                      className="flex items-center gap-1 hover:text-gray-900 transition-colors"
                      data-testid={`sort-${column.key}`}
                    >
                      {column.header}
                      {sortColumn === column.key ? (
                        sortDirection === "asc" ? (
                          <ChevronUp className="w-3 h-3" />
                        ) : (
                          <ChevronDown className="w-3 h-3" />
                        )
                      ) : (
                        <div className="w-3 h-3 opacity-0 group-hover:opacity-50">
                          <ChevronUp className="w-3 h-3" />
                        </div>
                      )}
                    </button>
                  ) : (
                    column.header
                  )}
                </th>
              ))}

              {/* Actions column */}
              {rowActions.length > 0 && (
                <th className="w-16 px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Actions
                </th>
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {isLoading ? (
              <tr>
                <td 
                  colSpan={columns.length + (bulkActions.length > 0 ? 1 : 0) + (rowActions.length > 0 ? 1 : 0)}
                  className="px-4 py-12 text-center"
                >
                  <div className="flex items-center justify-center gap-2 text-gray-500">
                    <RefreshCw className="w-5 h-5 animate-spin" />
                    <span>Loading...</span>
                  </div>
                </td>
              </tr>
            ) : paginatedData.length === 0 ? (
              <tr>
                <td 
                  colSpan={columns.length + (bulkActions.length > 0 ? 1 : 0) + (rowActions.length > 0 ? 1 : 0)}
                  className="px-4 py-12 text-center text-gray-500"
                >
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              paginatedData.map((item, index) => {
                const id = getRowId(item);
                const isSelected = selectedIds.has(id);
                
                return (
                  <tr 
                    key={id}
                    className={`hover:bg-gray-50 transition-colors ${isSelected ? 'bg-navy/5' : ''}`}
                    data-testid={`row-${id}`}
                  >
                    {/* Checkbox */}
                    {bulkActions.length > 0 && (
                      <td className="px-4 py-3">
                        <Checkbox
                          checked={isSelected}
                          onCheckedChange={() => toggleSelect(id)}
                          aria-label={`Select row ${id}`}
                          data-testid={`checkbox-row-${id}`}
                        />
                      </td>
                    )}
                    
                    {/* Data cells */}
                    {columns.map((column) => (
                      <td 
                        key={column.key} 
                        className={`px-4 py-3 text-sm text-gray-900 ${column.className || ''}`}
                      >
                        {column.render 
                          ? column.render(item, index)
                          : String((item as any)[column.key] ?? '')
                        }
                      </td>
                    ))}

                    {/* Row Actions */}
                    {rowActions.length > 0 && (
                      <td className="px-4 py-3 text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0"
                              data-testid={`row-actions-${id}`}
                            >
                              <MoreHorizontal className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            {rowActions
                              .filter(action => !action.show || action.show(item))
                              .map((action, actionIndex) => {
                                const Icon = action.icon;
                                return (
                                  <DropdownMenuItem
                                    key={actionIndex}
                                    onClick={() => action.onClick(item)}
                                    className={action.variant === 'destructive' ? 'text-red-600' : ''}
                                    data-testid={`action-${action.label.toLowerCase().replace(/\s+/g, '-')}-${id}`}
                                  >
                                    {Icon && <Icon className="w-4 h-4 mr-2" />}
                                    {action.label}
                                  </DropdownMenuItem>
                                );
                              })}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </td>
                    )}
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="px-4 py-3 border-t border-gray-200 flex items-center justify-between">
          <div className="text-sm text-gray-500">
            Showing {(currentPage - 1) * pageSize + 1} to {Math.min(currentPage * pageSize, filteredData.length)} of {filteredData.length} results
          </div>
          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(1)}
              disabled={currentPage === 1}
              className="h-8 w-8 p-0"
              data-testid="pagination-first"
            >
              <ChevronsLeft className="w-4 h-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
              className="h-8 w-8 p-0"
              data-testid="pagination-prev"
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            
            <div className="flex items-center gap-1 mx-2">
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let pageNum: number;
                if (totalPages <= 5) {
                  pageNum = i + 1;
                } else if (currentPage <= 3) {
                  pageNum = i + 1;
                } else if (currentPage >= totalPages - 2) {
                  pageNum = totalPages - 4 + i;
                } else {
                  pageNum = currentPage - 2 + i;
                }
                
                return (
                  <Button
                    key={pageNum}
                    variant={currentPage === pageNum ? "default" : "outline"}
                    size="sm"
                    onClick={() => setCurrentPage(pageNum)}
                    className={`h-8 w-8 p-0 ${currentPage === pageNum ? 'bg-navy hover:bg-navy/90' : ''}`}
                    data-testid={`pagination-page-${pageNum}`}
                  >
                    {pageNum}
                  </Button>
                );
              })}
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
              disabled={currentPage === totalPages}
              className="h-8 w-8 p-0"
              data-testid="pagination-next"
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(totalPages)}
              disabled={currentPage === totalPages}
              className="h-8 w-8 p-0"
              data-testid="pagination-last"
            >
              <ChevronsRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

// Helper components for common column renders
export const StatusBadge = ({ status, variants }: { status: string; variants?: Record<string, string> }) => {
  const defaultVariants: Record<string, string> = {
    pending: "bg-yellow-100 text-yellow-800 border-yellow-200",
    approved: "bg-green-100 text-green-800 border-green-200",
    featured: "bg-purple-100 text-purple-800 border-purple-200",
    rejected: "bg-red-100 text-red-800 border-red-200",
    published: "bg-blue-100 text-blue-800 border-blue-200",
    draft: "bg-gray-100 text-gray-800 border-gray-200",
    active: "bg-green-100 text-green-800 border-green-200",
    inactive: "bg-gray-100 text-gray-800 border-gray-200",
  };

  const classes = variants?.[status] || defaultVariants[status] || defaultVariants.pending;

  return (
    <Badge variant="outline" className={`${classes} capitalize font-medium`}>
      {status}
    </Badge>
  );
};

export const DateCell = ({ date }: { date: string | Date }) => {
  const d = new Date(date);
  return (
    <span className="text-gray-600">
      {d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
    </span>
  );
};

export const TruncatedText = ({ text, maxLength = 40 }: { text: string; maxLength?: number }) => {
  if (!text) return <span className="text-gray-400">—</span>;
  if (text.length <= maxLength) return <span>{text}</span>;
  return (
    <span title={text}>
      {text.substring(0, maxLength)}...
    </span>
  );
};
