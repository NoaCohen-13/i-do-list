export function isFullyPaid(committedCost: number, paidAmount: number) {
  return committedCost > 0 && paidAmount >= committedCost;
}
