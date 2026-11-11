import { ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom-v5-compat';

import { Trans } from 'app/core/internationalization';

export function WallDashboardHeading({ title, description }: { title: string; description?: string }) {
  return (
    <div className="wall-dashboard-heading">
      <div className="wall-breadcrumb">
        <Link to="/dashboards">
          <Trans i18nKey="wall.wall-dashboard-heading.text-2859873b">대시보드</Trans>
        </Link>
        <ChevronRight size={12} />
        <span>{title}</span>
      </div>
      <div className="wall-page-heading">
        <div>
          <h1>{title}</h1>
          {description?.trim() && <p>{description}</p>}
        </div>
      </div>
    </div>
  );
}
