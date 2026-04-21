/** SPEED OF LIGHT: DashboardLayout is now rendered at route level */
import { AccountSecurity } from "@/components/AccountSecurity";
import { useNavigate } from "react-router-dom";

const OwnerSecurity = () => {
  const _navigate = useNavigate();
  return (
    <div className="w-full">

      <div className="p-4 sm:p-6 md:p-8 pb-24 sm:pb-8">
        <div className="max-w-4xl mx-auto">
          <AccountSecurity userRole="owner" />
        </div>
      </div>
    </div>
  );
};

export default OwnerSecurity;

