export default function AdminDashboardPage() {
  return (
    <div>
      <h1 className="text-3xl font-bold text-[#183363] mb-6">Admin Dashboard</h1>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-xl shadow border border-gray-100">
          <h2 className="text-lg font-bold text-gray-700">Total Members</h2>
          <p className="text-4xl font-bold text-blue-600 mt-2">24</p>
        </div>
        <div className="bg-white p-6 rounded-xl shadow border border-gray-100">
          <h2 className="text-lg font-bold text-gray-700">Pending Approvals</h2>
          <p className="text-4xl font-bold text-yellow-500 mt-2">3</p>
        </div>
        <div className="bg-white p-6 rounded-xl shadow border border-gray-100">
          <h2 className="text-lg font-bold text-gray-700">Classes Today</h2>
          <p className="text-4xl font-bold text-green-500 mt-2">5</p>
        </div>
      </div>
    </div>
  );
}
