import { getCurrentUser } from "@/lib/auth/session";
import { listAddresses } from "@/lib/repo/addresses";
import { AddressBook } from "@/components/account/AddressBook";
export default async function AddressesPage() {
  const user = (await getCurrentUser())!;
  return <div className="card p-5"><h2 className="text-lg font-bold">Address book</h2><AddressBook initial={await listAddresses(user.id)} /></div>;
}
