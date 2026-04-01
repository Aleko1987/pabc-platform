import { Link, useParams } from "react-router-dom";

import { getCustomersByAreaSlug } from "../data/customers";
import { getAreaBySlug } from "../data/areas";

export function AreaPage() {
  const { areaSlug } = useParams<{ areaSlug: string }>();
  const area = areaSlug ? getAreaBySlug(areaSlug) : undefined;
  const stores = areaSlug ? getCustomersByAreaSlug(areaSlug) : [];

  if (!areaSlug || !area) {
    return (
      <div className="page">
        <h1>Area not found</h1>
        <p className="page-lead">No area matches this link.</p>
        <Link to="/dashboard" className="text-link">
          ← Back to Dashboard
        </Link>
      </div>
    );
  }

  return (
    <div className="page">
      <Link to="/dashboard" className="text-link">
        ← Dashboard
      </Link>
      <h1>{area.label}</h1>
      <p className="page-lead">Stores and sites in this area (mock).</p>
      <h2 className="area-stores-heading">Stores</h2>
      <ul className="area-store-list">
        {stores.map((c) => (
          <li key={c.slug}>
            <Link to={`/customers/${c.slug}`} className="text-link area-store-link">
              {c.name}
            </Link>
          </li>
        ))}
      </ul>
      {stores.length === 0 ? <p className="page-lead">No stores in this area yet.</p> : null}
    </div>
  );
}
