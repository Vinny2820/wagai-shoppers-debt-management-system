import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardHeading } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/feedback";
import { PageHeader } from "@/components/layout/page-header";

const metrics = [["Total Customers", "—", "No data connected yet"], ["Active Debts", "—", "Awaiting debt records"], ["Outstanding Balance", "KSh —", "Awaiting live balances"], ["Total Payments", "KSh —", "Awaiting payment activity"]];

export function DashboardPlaceholder() {
  return <><PageHeader title="Dashboard" description="An at-a-glance view of your debt management activity." actions={<Button>New payment</Button>} /><div className="metric-grid">{metrics.map(([label, value, detail]) => <Card key={label} className="metric-card"><p>{label}</p><strong>{value}</strong><span>{detail}</span></Card>)}</div><div className="dashboard-grid"><Card><CardHeading title="Recent customers" description="Your newest customer records will appear here." action={<Badge>Coming soon</Badge>} /><EmptyState title="No customers to show" description="Customer activity will appear here when data is connected." /></Card><Card><CardHeading title="Recent payments" description="The latest payment activity will appear here." action={<Badge>Coming soon</Badge>} /><EmptyState title="No payments to show" description="Payments will appear once the dashboard is connected." /></Card><Card><CardHeading title="Quick actions" description="Shortcuts for common tasks." /><div className="quick-actions"><Button variant="secondary">Add customer</Button><Button variant="secondary">Create debt</Button><Button variant="secondary">Record payment</Button></div></Card><Card><CardHeading title="Activity feed" description="A timeline of important updates." /><div className="activity-placeholder"><span className="activity-dot" /><p>Activity will appear here once your workspace is connected.</p></div></Card></div></>;
}
