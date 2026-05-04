/** SPEED OF LIGHT: DashboardLayout is now rendered at route level */
import { AccountSecurity } from "@/components/AccountSecurity";
import { PageHeader } from "@/components/PageHeader";
import { AtmosphericLayer } from "@/components/AtmosphericLayer";
import { motion } from "framer-motion";

const OwnerSecurity = () => {
  return (
    <div className="w-full pb-24 min-h-screen bg-background relative">
      <AtmosphericLayer variant="indigo" />
      <div className="p-4 sm:p-6 lg:p-8 relative z-10">
        <div className="max-w-4xl mx-auto space-y-8">
          <PageHeader
            title="Security Protocol"
            subtitle="Protect your authority and access"
            showBack={true}
            backTo="/owner/settings"
          />
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ type: "spring", stiffness: 500, damping: 30 }}
            className="rounded-[2.5rem] overflow-hidden bg-background border border-border shadow-2xl p-8"
          >
            <AccountSecurity userRole="owner" />
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default OwnerSecurity;
