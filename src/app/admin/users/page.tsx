import { listUsers } from "@/lib/repo/users";
import { formatDate, formatMoney } from "@/lib/utils";
import { RoleToggle } from "@/components/admin/RoleToggle";
export default async function AdminUsers() {
  const users = await listUsers(200);
  return (
    <div className="card p-5"><h2 className="text-lg font-bold">Customers <span className="text-sm font-normal text-gray-500">({users.length})</span></h2>
      <div className="mt-4 overflow-x-auto"><table className="table"><thead><tr><th>Name</th><th>Email</th><th>Verified</th><th>Orders</th><th>Spent</th><th>Joined</th><th>Role</th></tr></thead>
        <tbody>{users.map((u) => <tr key={u.id}><td className="font-medium">{u.name}</td><td className="text-gray-700">{u.email}</td><td>{u.email_verified ? <span className="badge bg-leaf-100 text-leaf-800">Yes</span> : <span className="badge bg-amber-100 text-amber-800">No</span>}</td><td>{u.order_count}</td><td className="tabular-nums">{formatMoney(u.total_spent_cents)}</td><td className="text-xs text-gray-500">{formatDate(u.created_at, { dateStyle: "medium" })}</td><td><RoleToggle id={u.id} role={u.role} /></td></tr>)}</tbody></table></div>
    </div>
  );
}
