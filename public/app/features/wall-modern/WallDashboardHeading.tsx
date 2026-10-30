import { ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom-v5-compat';

export function WallDashboardHeading({ title, description }: { title: string; description?: string }) {
  return (
    <div className="wall-dashboard-heading">
      <div className="wall-breadcrumb">
        <Link to="/dashboards">대시보드</Link>
        <ChevronRight size={12} />
        <span>{title}</span>
      </div>
      <div className="wall-page-heading">
        <div>
          <h1>{title}</h1>
          <p>{description || '전체 인프라의 주요 지표와 상태를 한눈에 확인하세요.'}</p>
        </div>
      </div>
    </div>
  );
}
