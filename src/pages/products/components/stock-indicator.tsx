export function StockIndicator({ stock }: { stock: number }) {
  if (stock === 0) {
    return (
      <span className="flex items-center gap-1.5 text-sm text-destructive">
        <span className="size-2 shrink-0 rounded-full bg-destructive" />
        Out of stock
      </span>
    )
  }

  if (stock <= 20) {
    return (
      <span className="flex items-center gap-1.5 text-sm text-amber-600 dark:text-amber-500">
        <span className="size-2 shrink-0 rounded-full bg-amber-500" />
        {stock} in stock
      </span>
    )
  }

  return (
    <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
      <span className="size-2 shrink-0 rounded-full bg-emerald-500" />
      {stock} in stock
    </span>
  )
}
