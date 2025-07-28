# TaxHacker DataTable System

A comprehensive, reusable table system built on top of @tanstack/react-table with shadcn/ui components.

## Architecture

### Base Components

#### `DataTable`
The core reusable table component that provides:
- Sorting, filtering, pagination
- Row selection (single/multi)
- Column visibility management
- Responsive design
- Accessibility features

#### `DataTableColumnHeader`
Sortable column header with dropdown for:
- Ascending/Descending sort
- Hide column option
- Clean visual indicators

#### `DataTablePagination`
Full-featured pagination with:
- Page size selector
- Navigation controls
- Row count display
- Selection indicators

## Usage Examples

### Basic Table

```tsx
import { DataTable } from "@/components/ui/data-table"
import { DataTableColumnHeader } from "@/components/ui/data-table/DataTableColumnHeader"

const columns = [
  {
    accessorKey: "name",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Name" />
    ),
  },
  // ... more columns
]

function MyTable({ data }) {
  return (
    <DataTable
      columns={columns}
      data={data}
      searchKey="name"
      searchPlaceholder="Search items..."
      enableRowSelection
      enablePagination
    />
  )
}
```

### Specialized Table with Custom Toolbar

```tsx
function SpecializedTable({ data, onAdd }) {
  const renderToolbar = (table) => (
    <div className="flex items-center justify-between">
      <Input
        placeholder="Search..."
        value={(table.getColumn("name")?.getFilterValue() as string) ?? ""}
        onChange={(event) =>
          table.getColumn("name")?.setFilterValue(event.target.value)
        }
      />
      <Button onClick={onAdd}>
        <Plus className="mr-2 h-4 w-4" />
        Add Item
      </Button>
    </div>
  )

  return (
    <DataTable
      columns={columns}
      data={data}
      renderToolbar={renderToolbar}
    />
  )
}
```

## Specialized Tables

### CategoriesTable
- Color picker integration
- LLM prompt field
- Inline editing with dialogs
- Bulk operations

### ProjectsTable
- Similar to categories
- Project-specific validation
- Color coding

### CurrenciesTable
- Currency code validation
- Name editing only (code immutable)
- Simple CRUD operations

### FieldsTable ✅
- Already implemented with advanced features
- Inline editing
- Complex field types
- Visibility controls

## Features

### Row Selection
- Single or multi-row selection
- Bulk action support
- Visual selection indicators
- Keyboard navigation

### Sorting & Filtering
- Column-level sorting
- Global search
- Custom filter components
- Reset functionality

### Responsive Design
- Mobile-friendly layouts
- Collapsible columns
- Touch-friendly controls
- Proper spacing

### Accessibility
- ARIA labels
- Keyboard navigation
- Screen reader support
- Focus management

## Best Practices

### Data Stability
Always use `useMemo` for stable references:

```tsx
const columns = useMemo(() => [
  // column definitions
], [])

const data = useMemo(() => processedData, [rawData])
```

### State Management
Use controlled state for server-side operations:

```tsx
const [sorting, setSorting] = useState([])
const [filtering, setFiltering] = useState([])

// Pass to DataTable state prop
```

### Type Safety
Leverage TypeScript for better DX:

```tsx
interface MyDataType {
  id: string
  name: string
  // ...
}

const columns: ColumnDef<MyDataType>[] = [
  // type-safe column definitions
]
```

## Migration Guide

### From CrudTable

**Before:**
```tsx
<CrudTable
  items={data}
  columns={[
    { key: "name", label: "Name", editable: true }
  ]}
  onAdd={handleAdd}
  onEdit={handleEdit}
  onDelete={handleDelete}
/>
```

**After:**
```tsx
<CategoryTable
  data={data}
  onAdd={handleAdd}
  onEdit={handleEdit}
  onDelete={handleDelete}
/>
```

### From TransactionList

**Before:**
```tsx
<TransactionList
  transactions={transactions}
  fields={fields}
/>
```

**After:**
```tsx
<TransactionsTable
  data={transactions}
  fields={fields}
  onRowClick={handleRowClick}
  onBulkAction={handleBulkAction}
/>
```

## Performance Considerations

### Virtualization
For large datasets (>1000 rows), consider adding virtualization:

```tsx
import { useVirtualizer } from '@tanstack/react-virtual'

// Implement row virtualization in DataTable
```

### Memoization
- Memoize expensive calculations
- Use stable column definitions
- Optimize render functions

### Server-Side Operations
For very large datasets, implement:
- Server-side pagination
- Server-side sorting
- Server-side filtering

## Development Roadmap

### Phase 1 ✅ (Completed)
- Base DataTable components
- Categories, Projects, Currencies tables
- Migration from CrudTable

### Phase 2 (Next)
- Advanced TransactionsTable
- Bulk operations framework
- Export functionality

### Phase 3 (Future)
- Server-side pagination
- Advanced filtering
- Column resizing
- Row reordering

## Contributing

When adding new table features:

1. Extend base DataTable if possible
2. Create specialized table for complex use cases
3. Maintain consistent API patterns
4. Add TypeScript types
5. Include accessibility features
6. Test on mobile devices

## Dependencies

- `@tanstack/react-table` - Core table logic
- `@radix-ui/react-icons` - UI icons
- `shadcn/ui` - Base components
- React 19+ - Framework
- TypeScript - Type safety