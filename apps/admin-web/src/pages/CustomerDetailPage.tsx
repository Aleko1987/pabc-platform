import { Link, useParams } from "react-router-dom";

import { getCustomerBySlug } from "../data/customers";
import { getStaffByName } from "../data/staffDirectory";

export function CustomerDetailPage() {
  const { customerSlug } = useParams<{ customerSlug: string }>();
  const customer = customerSlug ? getCustomerBySlug(customerSlug) : undefined;

  if (!customer) {
    return (
      <div className="page">
        <h1>Customer not found</h1>
        <p className="page-lead">No customer matches this link.</p>
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
      <h1>{customer.name}</h1>
      <p className="page-lead">Sites and assigned guards (mock).</p>
      <section className="customer-sites">
        {customer.sites.map((site) => (
          <div key={site.siteName} className="customer-site-block">
            <h2 className="customer-site-title">{site.siteName}</h2>
            <div className="customer-guards">
              {site.guards.map((name) => {
                const staff = getStaffByName(name);
                return staff ? (
                  <Link key={name} to={`/staff/${staff.slug}`} className="customer-guard-pill">
                    {name}
                  </Link>
                ) : (
                  <span key={name} className="customer-guard-pill customer-guard-pill--muted">
                    {name}
                  </span>
                );
              })}
            </div>
          </div>
        ))}
      </section>
    </div>
  );
}
