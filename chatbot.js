// 🌿 JOMPO FarmLink Floating Chatbot
document.addEventListener('DOMContentLoaded', () => {
  // Create chatbot elements
  const chatbotDiv = document.getElementById('chatbot');
  chatbotDiv.innerHTML = `
    <div id="chatbotWidget" class="fixed bottom-6 right-6 z-50">
      <button id="chatbotToggle" class="bg-green-700 text-white px-4 py-3 rounded-full shadow-lg hover:bg-green-800 transition">
        💬 Chat
      </button>

      <div id="chatbotWindow" class="hidden bg-white w-80 h-96 rounded-xl shadow-2xl flex flex-col mt-3 border border-green-200">
        <div class="bg-green-700 text-white p-3 flex justify-between items-center rounded-t-xl">
          <span class="font-semibold">JOMPO AI Assistant</span>
          <button id="closeChatbot" class="text-sm bg-red-500 hover:bg-red-600 px-2 py-1 rounded">X</button>
        </div>
        <div id="chatMessages" class="flex-1 overflow-y-auto p-3 space-y-2 text-sm"></div>
        <div class="p-2 flex items-center border-t">
          <input id="chatInput" type="text" placeholder="Type your question..." class="flex-1 border rounded px-2 py-1" />
          <button id="sendChat" class="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded ml-2">Send</button>
        </div>
      </div>
    </div>
  `;

  const chatbotToggle = document.getElementById('chatbotToggle');
  const chatbotWindow = document.getElementById('chatbotWindow');
  const closeChatbot = document.getElementById('closeChatbot');
  const sendChat = document.getElementById('sendChat');
  const chatInput = document.getElementById('chatInput');
  const chatMessages = document.getElementById('chatMessages');

  // Toggle open/close
  chatbotToggle.addEventListener('click', () => chatbotWindow.classList.toggle('hidden'));
  closeChatbot.addEventListener('click', () => chatbotWindow.classList.add('hidden'));

  // Function to send message to AI
  async function sendChatMessage() {
    const message = chatInput.value.trim();
    if (!message) return;

    const userMsg = document.createElement('div');
    userMsg.className = 'text-green-800 bg-green-50 p-2 rounded self-end';
    userMsg.textContent = message;
    chatMessages.appendChild(userMsg);
    chatInput.value = '';

    const botMsg = document.createElement('div');
    botMsg.className = 'text-gray-700 bg-gray-100 p-2 rounded self-start italic';
    botMsg.textContent = 'Thinking...';
    chatMessages.appendChild(botMsg);
    chatMessages.scrollTop = chatMessages.scrollHeight;

    try {
      const res = await fetch('https://us-central1-jompo-farmlink-web.cloudfunctions.net/askAI', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: message })
      });
      const data = await res.json();
      botMsg.textContent = data.reply || 'No AI response.';
    } catch (err) {
      botMsg.textContent = 'Error: Unable to connect to AI.';
    }

    chatMessages.scrollTop = chatMessages.scrollHeight;
  }

  sendChat.addEventListener('click', sendChatMessage);
  chatInput.addEventListener('keypress', e => {
    if (e.key === 'Enter') sendChatMessage();
  });
});
