// navbar.js
document.addEventListener("DOMContentLoaded", () => {
  const navbarHTML = `
    <nav class="navbar bg-green-800 text-white p-4 flex justify-between flex-wrap items-center">
      <a href="index.html" class="font-bold text-xl">JOMPO FarmLink</a>
      <div class="space-x-4 mt-2 md:mt-0">
        <a href="dashboard.html" class="hover:underline">Dashboard</a>
        <a href="farm-records.html" class="hover:underline">Farm Records</a>
        <a href="market-access.html" class="hover:underline">Market Access</a>
        <a href="community.html" class="hover:underline">Community</a>
        <a href="ai.html" class="hover:underline">AI Assistant</a>
        <a href="weather.html" class="hover:underline">Weather</a>
        <a href="support.html" class="hover:underline">Support</a>
      </div>
    </nav>
  `;
  document.body.insertAdjacentHTML("afterbegin", navbarHTML);
});
