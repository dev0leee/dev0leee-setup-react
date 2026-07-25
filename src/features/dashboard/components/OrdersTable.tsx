import { useSuspenseQuery } from '@tanstack/react-query'
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from '@tanstack/react-table'
import { format, parseISO } from 'date-fns'

import { ordersQuery } from '@/features/dashboard/queries/ordersQuery'
import type { Order } from '@/features/dashboard/types/dashboard'
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/shared/components/ui/table'
import { DATE_FORMAT } from '@/shared/constants/format'
import { formatPrice } from '@/shared/utils/formatNumber'

const columnHelper = createColumnHelper<Order>()

const columns = [
  columnHelper.accessor('id', { header: '주문번호' }),
  columnHelper.accessor('customer', { header: '고객' }),
  columnHelper.accessor('amount', {
    header: '금액',
    cell: (context) => {
      return formatPrice({ price: context.getValue() })
    },
  }),
  columnHelper.accessor('createdAt', {
    header: '주문일',
    cell: (context) => {
      return format(parseISO(context.getValue()), DATE_FORMAT)
    },
  }),
]

export const OrdersTable = () => {
  const { data } = useSuspenseQuery(ordersQuery)

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
  })

  return (
    <Card>
      <CardHeader>
        <CardTitle>최근 주문</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => {
              return (
                <TableRow key={headerGroup.id}>
                  {headerGroup.headers.map((header) => {
                    return (
                      <TableHead key={header.id}>
                        {flexRender(header.column.columnDef.header, header.getContext())}
                      </TableHead>
                    )
                  })}
                </TableRow>
              )
            })}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows.map((row) => {
              return (
                <TableRow key={row.id}>
                  {row.getVisibleCells().map((cell) => {
                    return (
                      <TableCell key={cell.id}>
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </TableCell>
                    )
                  })}
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}
