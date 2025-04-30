<table className="w-full border mb-2 text-sm rounded-xl overflow-hidden shadow">
  <thead className="bg-gradient-to-r from-blue-200 to-blue-100 sticky top-0">
    <tr>
      <th className="border px-3 py-2">Department</th>
      <th className="border px-3 py-2">License Count</th>
    </tr>
  </thead>
  <tbody>
    {Object.entries(data.usage).map(([dept, count], i) => (
      <tr key={dept} className={i % 2 === 0 ? "bg-white" : "bg-blue-50 hover:bg-blue-100"}>
        <td className="border px-3 py-2">{dept}</td>
        <td className="border px-3 py-2">{count}</td>
      </tr>
    ))}
  </tbody>
</table>
