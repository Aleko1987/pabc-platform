import { Link, useParams } from "react-router-dom";

import { StaffDetailSheet } from "../components/StaffDetailSheet";

export function StaffDetailPage() {
  const { staffSlug } = useParams<{ staffSlug: string }>();
  if (!staffSlug) {
    return (
      <div className="page">
        <h1>Staff not found</h1>
        <p className="page-lead">No profile matches this link.</p>
        <Link to="/dashboard" className="text-link">
          ← Back to Dashboard
        </Link>
      </div>
    );
  }

  return <StaffDetailSheet staffSlug={staffSlug} showBackLink />;
}
