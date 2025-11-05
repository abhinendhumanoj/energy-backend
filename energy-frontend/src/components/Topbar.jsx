export default function Topbar() {
  const user = JSON.parse(localStorage.getItem("user")) || { email: "guest@demo.com" };

  return (
    <header className="flex items-center justify-between p-4 bg-[#041C32]/70 backdrop-blur-md border-b border-cyan-700/30">
      <h1 className="text-xl font-semibold text-cyan-300">AI Energy Intelligence</h1>
      <div className="text-sm text-gray-300">👋 {user.email}</div>
    </header>
  );
}
