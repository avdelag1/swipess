/** SPEED OF LIGHT: DashboardLayout is now rendered at route level */
import { AccountSecurity } from "@/components/AccountSecurity";
import { PageHeader } from "@/components/PageHeader";

const ClientSecurity = () => {
  return (
    <div className="w-full pb-24">
      <div className="p-4 sm:p-6 lg:p-8">
        <div className="max-w-4xl mx-auto">
          <PageHeader
            title="Security"
            subtitle="Manage your account security settings"
          />
          <AccountSecurity userRole="client" />
        </div>
      </div>
    </div>
  );
};

export default ClientSecurity;
