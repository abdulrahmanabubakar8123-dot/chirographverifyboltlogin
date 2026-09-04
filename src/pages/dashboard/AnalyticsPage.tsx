import { BarChart3 } from 'lucide-react';
import { DashboardPageHeader } from '@/layouts/DashboardLayout';
import { EmptyState } from '@/components/Feedback';

export default function AnalyticsPage() {
  return (
    <>
      <DashboardPageHeader title="Analytics" description="Insights into your verification traffic" />
      <div className="card p-6">
        <EmptyState
          icon={<BarChart3 size={24} />}
          title="Analytics data unavailable"
          description="Analytics are not currently available from the backend. Once analytics data is exposed via the API, it will appear here automatically."
        />
      </div>
    </>
  );
}
