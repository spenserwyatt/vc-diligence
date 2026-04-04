import Link from "next/link";
import { listDeals } from "@/lib/deals";
import { DealCard } from "@/components/DealCard";

export const dynamic = "force-dynamic";

export default function Dashboard() {
  const deals = listDeals();

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-navy">Deals</h1>
        <Link
          href="/new"
          className="px-4 py-2 bg-navy text-white rounded-lg text-sm font-medium hover:bg-blue transition-colors"
        >
          + New Deal
        </Link>
      </div>

      {deals.length === 0 ? (
        <div className="text-center py-20 text-muted">
          <p className="text-lg mb-2">No deals yet</p>
          <p className="text-sm">
            Create a new deal to get started with diligence.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {deals.map((deal) => (
            <DealCard key={deal.name} deal={deal} />
          ))}
        </div>
      )}
    </div>
  );
}
