// ================== FIREBASE SETUP ==================
const firebaseConfig = {
  apiKey: "AIzaSyCK2sZb2_O0K8tq0KWKwmSV8z4He30dcDc",
  authDomain: "jompo-farmlink-web.firebaseapp.com",
  projectId: "jompo-farmlink-web",
  storageBucket: "jompo-farmlink-web.appspot.com",
  messagingSenderId: "497296091103",
  appId: "1:497296091103:web:72b3e8223ea0cbb306066a"
};

if (!firebase.apps.length) firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();
const storage = firebase.storage();

// ================== NAVBAR (Dynamic Auth Links) ==================
auth.onAuthStateChanged(user => {
  const authLinks = document.getElementById("authLinks");
  if (!authLinks) return;

  if (user) {
    db.collection('users').doc(user.uid).get().then(doc => {
      const data = doc.data();
      authLinks.innerHTML = `
        <span class="mr-2">Hi, ${data.name}</span>
        ${data.profilePic ? `<img src="${data.profilePic}" alt="Profile" class="w-8 h-8 rounded-full mr-2 inline">` : ''}
        <button id="logoutBtn" class="px-3 py-1 bg-red-500 hover:bg-red-600 rounded text-white">Logout</button>
      `;
      document.getElementById('logoutBtn').addEventListener('click', () => {
        auth.signOut().then(() => (window.location.href = "index.html"));
      });
    });
  } else {
    authLinks.innerHTML = `
      <a href="login.html" class="px-4 py-2">Login</a>
      <a href="register.html" class="px-4 py-2 bg-green-500 hover:bg-green-600 rounded text-white">Register</a>
    `;
  }
});

// ================== REGISTER ==================
const registerForm = document.getElementById('registerForm');
if (registerForm) {
  registerForm.addEventListener('submit', async e => {
    e.preventDefault();
    const name = document.getElementById('name').value.trim();
    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value;
    const location = document.getElementById('location').value.trim();
    const role = document.getElementById('role').value;
    const profilePicFile = document.getElementById('profilePic').files[0];
    const messageEl = document.getElementById('message');

    try {
      const userCredential = await auth.createUserWithEmailAndPassword(email, password);
      const user = userCredential.user;

      let profilePicUrl = '';
      if (profilePicFile) {
        const storageRef = storage.ref();
        const fileRef = storageRef.child(`profilePics/${user.uid}_${Date.now()}_${profilePicFile.name}`);
        await fileRef.put(profilePicFile);
        profilePicUrl = await fileRef.getDownloadURL();
      }

      await db.collection('users').doc(user.uid).set({
        name, email, location, role,
        profilePic: profilePicUrl,
        createdAt: firebase.firestore.FieldValue.serverTimestamp()
      });

      await user.sendEmailVerification();
      messageEl.classList.remove('text-red-600');
      messageEl.classList.add('text-green-600');
      messageEl.textContent = 'Registration successful. Check your email to verify.';
      registerForm.reset();
      setTimeout(() => window.location.href = 'login.html', 3000);

    } catch (err) {
      messageEl.classList.remove('text-green-600');
      messageEl.classList.add('text-red-600');
      messageEl.textContent = err.message;
    }
  });
}

// ================== LOGIN ==================
const loginForm = document.getElementById('loginForm');
if (loginForm) {
  loginForm.addEventListener('submit', async e => {
    e.preventDefault();
    const email = document.getElementById('loginEmail').value.trim();
    const password = document.getElementById('loginPassword').value;
    const loginError = document.getElementById('loginError');

    try {
      const userCred = await auth.signInWithEmailAndPassword(email, password);
      if (!userCred.user.emailVerified) {
        loginError.textContent = 'Please verify your email before logging in.';
        loginError.classList.remove('hidden');
        await auth.signOut();
        return;
      }
      window.location.href = 'dashboard.html';
    } catch (err) {
      loginError.textContent = err.message;
      loginError.classList.remove('hidden');
    }
  });

  const forgotPasswordLink = document.getElementById('forgotPasswordLink');
  if (forgotPasswordLink) {
    forgotPasswordLink.addEventListener('click', async e => {
      e.preventDefault();
      const email = document.getElementById('loginEmail').value.trim();
      const loginError = document.getElementById('loginError');
      if (!email) {
        loginError.textContent = 'Enter email first to reset password';
        loginError.classList.remove('hidden');
        return;
      }
      try {
        await auth.sendPasswordResetEmail(email);
        loginError.textContent = 'Password reset email sent. Check your inbox.';
        loginError.classList.remove('hidden');
        loginError.classList.add('text-green-600');
      } catch (err) {
        loginError.textContent = err.message;
        loginError.classList.remove('hidden');
      }
    });
  }
}

// ================== DASHBOARD ==================
const addListingForm = document.getElementById('addListingForm');
const listingsContainer = document.getElementById('listingsContainer');

auth.onAuthStateChanged(async user => {
  // redirect if dashboard but not logged in
  if (window.location.pathname.includes('dashboard.html') && !user) {
    window.location.href = 'login.html';
  }

  if (listingsContainer && user) {
    listingsContainer.innerHTML = '';

    // Display products
    const prodSnap = await db.collection('listings').where('farmerID', '==', user.uid).get();
    prodSnap.forEach(doc => {
      const d = doc.data();
      listingsContainer.innerHTML += `
        <div class="bg-white p-4 rounded shadow">
          <h3 class="font-bold text-green-800">${d.name}</h3>
          ${d.imageUrl ? `<img src="${d.imageUrl}" class="w-full h-48 object-cover rounded mb-2"/>` : ''}
          <p>Category: ${d.category}</p>
          <p>Quantity: ${d.quantity || '-'}</p>
          <p>Price: KSh ${d.price}</p>
          <p>Location: ${d.location}</p>
        </div>
      `;
    });

    // Display services
    const svcSnap = await db.collection('services').where('farmerID', '==', user.uid).get();
    svcSnap.forEach(doc => {
      const d = doc.data();
      listingsContainer.innerHTML += `
        <div class="bg-white p-4 rounded shadow">
          <h3 class="font-bold text-green-800">${d.name}</h3>
          ${d.imageUrl ? `<img src="${d.imageUrl}" class="w-full h-48 object-cover rounded mb-2"/>` : ''}
          <p>Category: ${d.category}</p>
          <p>Price: KSh ${d.price}</p>
          <p>Location: ${d.location}</p>
        </div>
      `;
    });
  }
});

// ================== ADD LISTING WITH IMAGE ==================
if (addListingForm) {
  addListingForm.addEventListener('submit', async e => {
    e.preventDefault();
    const name = document.getElementById('productName').value.trim();
    const category = document.getElementById('category').value;
    const quantity = document.getElementById('quantity').value || null;
    const price = document.getElementById('price').value;
    const location = document.getElementById('locationListing').value.trim();
    const imageFile = document.getElementById('productImage').files[0];
    const user = auth.currentUser;
    if (!user) return alert('Not logged in');

    try {
      let imageUrl = '';
      if (imageFile) {
        const storageRef = storage.ref();
        const fileRef = storageRef.child(`listings/${user.uid}/${Date.now()}_${imageFile.name}`);
        await fileRef.put(imageFile);
        imageUrl = await fileRef.getDownloadURL();
      }

      const listingData = {
        name, category, quantity, price, location,
        imageUrl,
        farmerID: user.uid,
        createdAt: firebase.firestore.FieldValue.serverTimestamp()
      };

      if (category === 'service') await db.collection('services').add(listingData);
      else await db.collection('listings').add(listingData);

      alert('Listing added!');
      addListingForm.reset();

      // Refresh dashboard display
      window.location.reload();

    } catch (err) {
      alert('Error: ' + err.message);
    }
  });
}

// ================== FARM RECORDS ==================
const farmForm = document.getElementById("farmRecordForm");
const recordsList = document.getElementById("recordsList");
if (farmForm && recordsList) {
  farmForm.addEventListener("submit", e => {
    e.preventDefault();
    const crop = document.getElementById("cropName").value;
    const qty = document.getElementById("harvestQty").value;
    const li = document.createElement("li");
    li.textContent = `${crop} — ${qty} kg`;
    recordsList.appendChild(li);
    farmForm.reset();
  });
}

// ================== COMMUNITY ==================
const communityForm = document.getElementById("communityForm");
const communityPosts = document.getElementById("communityPosts");
if (communityForm && communityPosts) {
  communityForm.addEventListener("submit", e => {
    e.preventDefault();
    const user = document.getElementById("userName").value;
    const message = document.getElementById("message").value;
    const li = document.createElement("li");
    li.innerHTML = `<strong>${user}:</strong> ${message}`;
    communityPosts.appendChild(li);
    communityForm.reset();
  });
}

// ================== SIMPLE AI CHATBOT ==================
const chatbotInput = document.getElementById("chatbotInput");
const chatbotMessages = document.getElementById("chatbotMessages");
if (chatbotInput && chatbotMessages) {
  chatbotInput.addEventListener("keypress", e => {
    if (e.key === "Enter" && chatbotInput.value.trim() !== "") {
      const userMsg = chatbotInput.value.trim();
      const li = document.createElement("div");
      li.innerHTML = `<strong>You:</strong> ${userMsg}`;
      chatbotMessages.appendChild(li);

      let reply = "Sorry, I don't understand.";
      if (userMsg.toLowerCase().includes("hello")) reply = "Hello! How can I help you today?";
      if (userMsg.toLowerCase().includes("listing")) reply = "You can add or view your listings on this dashboard.";
      if (userMsg.toLowerCase().includes("record")) reply = "Use the Farm Records section to track your crops.";
      const botMsg = document.createElement("div");
      botMsg.innerHTML = `<strong>FarmLink AI:</strong> ${reply}`;
      chatbotMessages.appendChild(botMsg);

      chatbotInput.value = "";
      chatbotMessages.scrollTop = chatbotMessages.scrollHeight;
    }
  });
}
