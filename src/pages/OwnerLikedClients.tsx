/** SPEED OF LIGHT: DashboardLayout is now rendered at route level */
import { LikedClients } from "@/components/LikedClients";

interface OwnerLikedClientsProps {
  embedded?: boolean;
}

const OwnerLikedClients = ({ embedded = false }: OwnerLikedClientsProps) => {
  return (
    <>
      <LikedClients embedded={embedded} />
    </>
  );
};

export default OwnerLikedClients;
