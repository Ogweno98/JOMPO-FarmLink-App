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

// ---------------------- Navbar Links (auth-aware) ----------------------
auth.onAuthStateChanged(user => {
  const authLinks = document.getElementById("authLinks");
  if (!authLinks) return;
  if (user) {
    authLinks.innerHTML = `
      <span class="mr-4">Hi, ${user.email}</span>
      <button id="logoutBtn" class="px-3 py-1 bg-red-500 hover:bg-red-600 rounded text-white">Logout</button>
    `;
    document.getElementById('logoutBtn').addEventListener('click', () => auth.signOut());
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

    try {
      const userCredential = await auth.createUserWithEmailAndPassword(email, password);
      const user = userCredential.user;
      await db.collection('users').doc(user.uid).set({ name, email, location, role, createdAt: firebase.firestore.FieldValue.serverTimestamp() });
      await user.sendEmailVerification();
      document.getElementById('message').classList.add('text-green-600');
      document.getElementById('message').textContent = 'Registration successful. Check your email to verify.';
      registerForm.reset();
      setTimeout(() => window.location.href = 'login.html', 3000);
    } catch (err) {
      document.getElementById('message').classList.add('text-red-600');
      document.getElementById('message').textContent = err.message;
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
        if (loginError) { loginError.textContent = 'Please verify your email before logging in.'; loginError.classList.remove('hidden'); }
        await auth.signOut();
        return;
      }
      window.location.href = 'dashboard.html';
    } catch (err) {
      if (loginError) { loginError.textContent = err.message; loginError.classList.remove('hidden'); }
      else alert(err.message);
    }
  });

  // forgot password link
  const forgotPasswordLink = document.getElementById('forgotPasswordLink');
  if (forgotPasswordLink) {
    forgotPasswordLink.addEventListener('click', async e => {
      e.preventDefault();
      const email = document.getElementById('loginEmail').value.trim();
      const loginError = document.getElementById('loginError');
      if (!email) {
        if (loginError) { loginError.textContent = 'Enter email then click Forgot Password'; loginError.classList.remove('hidden'); }
        return;
      }
      try {
        await auth.sendPasswordResetEmail(email);
        if (loginError) { loginError.textContent = 'Password reset email sent. Check your inbox.'; loginError.classList.remove('hidden'); loginError.classList.add('text-green-600'); }
      } catch (err) {
        if (loginError) { loginError.textContent = err.message; loginError.classList.remove('hidden'); }
      }
    });
  }
}

// ================== LOGOUT BUTTON (dashboard.html separate) ==================
const logoutBtn = document.getElementById('logoutBtn');
if (logoutBtn) logoutBtn.addEventListener('click', () => auth.signOut().then(() => window.location.href = 'index.html'));

// ================== ADD LISTING (dashboard) ==================
const addListingForm = document.getElementById('addListingForm');
if (addListingForm) {
  addListingForm.addEventListener('submit', async e => {
    e.preventDefault();
    const name = document.getElementById('productName').value.trim();
    const category = document.getElementById('category').value;
    const quantity = document.getElementById('quantity').value || null;
    const price = document.getElementById('price').value;
    const location = document.getElementById('locationListing').value.trim();
    const user = auth.currentUser;
    if (!user) return alert('Not logged in');

    const listingData = { name, category, quantity, price, location, farmerID: user.uid, createdAt: firebase.firestore.FieldValue.serverTimestamp() };
    try {
      if (category === 'service') await db.collection('services').add(listingData);
      else await db.collection('listings').add(listingData);
      alert('Listing added!');
      addListingForm.reset();
    } catch (err) {
      alert('Error: ' + err.message);
    }
  });
}

// ================== DASHBOARD: show user's listings & services ==================
const listingsContainer = document.getElementById('listingsContainer');
if (listingsContainer) {
  auth.onAuthStateChanged(async user => {
    if (!user) return window.location.href = 'login.html';
    listingsContainer.innerHTML = '';

    // user's products
    const prodSnap = await db.collection('listings').where('farmerID','==', user.uid).get();
    prodSnap.forEach(doc => {
      const d = doc.data();
      listingsContainer.innerHTML += `
        <div class="bg-white p-4 rounded shadow">
          <h3 class="font-bold text-green-800">${d.name}</h3>
          <p>Category: ${d.category}</p>
          <p>Quantity: ${d.quantity || '-'}</p>
          <p>Price: KSh ${d.price}</p>
          <p>Location: ${d.location}</p>
        </div>
      `;
    });

    // user's services
    const svcSnap = await db.collection('services').where('farmerID','==', user.uid).get();
    svcSnap.forEach(doc => {
      const d = doc.data();
      listingsContainer.innerHTML += `
        <div class="bg-white p-4 rounded shadow">
          <h3 class="font-bold text-green-800">${d.name}</h3>
          <p>Category: ${d.category}</p>
          <p>Price: KSh ${d.price}</p>
          <p>Location: ${d.location}</p>
        </div>
      `;
    });
  });
}

// ================== MARKETPLACE ==================
const marketplaceContainer = document.getElementById('marketplaceContainer');
if (marketplaceContainer) {
  const noResults = document.getElementById('noResults');

  // helper to render docs array
  function renderListings(docs) {
    marketplaceContainer.innerHTML = '';
    if (!docs || docs.length === 0) {
      if (noResults) noResults.classList.remove('hidden');
      return;
    }
    if (noResults) noResults.classList.add('hidden');
    docs.forEach(doc => {
      const d = doc.data();
      marketplaceContainer.innerHTML += `
        <div class="bg-white p-4 rounded shadow hover:shadow-lg transition">
          <h3 class="font-bold text-green-800">${d.name}</h3>
          <p>Category: ${d.category}</p>
          ${d.quantity ? `<p>Quantity: ${d.quantity}</p>` : ''}
          <p>Price: KSh ${d.price}</p>
          <p>Location: ${d.location}</p>
        </div>
      `;
    });
  }

  async function fetchAndRenderAll() {
    const snapshot = await db.collection('listings').get();
    renderListings(snapshot.docs);
    // populate categories select
    const catSel = document.getElementById('filterCategory');
    if (catSel) {
      const cats = new Set();
      snapshot.docs.forEach(d => { if (d.data().category) cats.add(d.data().category); });
      cats.forEach(c => { if (![...catSel.options].some(o=>o.value===c)) { const o=document.createElement('option'); o.value=c; o.text=c; catSel.appendChild(o);} });
    }
  }

  fetchAndRenderAll();

  // filters logic
  const searchInput = document.getElementById('searchInput');
  const filterLocation = document.getElementById('filterLocation');
  const filterCategory = document.getElementById('filterCategory');

  [searchInput, filterLocation, filterCategory].forEach(el => {
    if (!el) return;
    el.addEventListener('input', async () => {
      const snapshot = await db.collection('listings').get();
      let docs = snapshot.docs;
      if (searchInput && searchInput.value) docs = docs.filter(d => d.data().name?.toLowerCase().includes(searchInput.value.toLowerCase()));
      if (filterLocation && filterLocation.value) docs = docs.filter(d => d.data().location?.toLowerCase().includes(filterLocation.value.toLowerCase()));
      if (filterCategory && filterCategory.value) docs = docs.filter(d => d.data().category === filterCategory.value);
      renderListings(docs);
    });
  });
}

// ================== SERVICES PAGE ==================
const servicesContainer = document.getElementById('servicesContainer');
if (servicesContainer) {
  const noServices = document.getElementById('noServices');

  function renderServices(docs) {
    servicesContainer.innerHTML = '';
    if (!docs || docs.length === 0) {
      if (noServices) noServices.classList.remove('hidden');
      return;
    }
    if (noServices) noServices.classList.add('hidden');
    docs.forEach(doc => {
      const d = doc.data();
      servicesContainer.innerHTML += `
        <div class="bg-white p-4 rounded shadow hover:shadow-lg transition">
          <h3 class="font-bold text-green-800">${d.name}</h3>
          <p>Category: ${d.category}</p>
          <p>Price: KSh ${d.price}</p>
          <p>Location: ${d.location}</p>
          <p class="text-sm mt-2">${d.description || ''}</p>
          <button class="mt-4 px-4 py-2 bg-green-700 text-white rounded hover:bg-green-800">Book Now</button>
        </div>
      `;
    });
  }

  async function fetchServices() {
    const snapshot = await db.collection('services').get();
    renderServices(snapshot.docs);
    // populate service categories
    const catSel = document.getElementById('filterServiceCategory');
    if (catSel) {
      const cats = new Set();
      snapshot.docs.forEach(d => { if (d.data().category) cats.add(d.data().category); });
      cats.forEach(c => { if (![...catSel.options].some(o=>o.value===c)) { const o=document.createElement('option'); o.value=c; o.text=c; catSel.appendChild(o);} });
    }
  }

  fetchServices();

  const searchService = document.getElementById('searchService');
  const filterServiceLocation = document.getElementById('filterServiceLocation');
  const filterServiceCategory = document.getElementById('filterServiceCategory');

  [searchService, filterServiceLocation, filterServiceCategory].forEach(el => {
    if (!el) return;
    el.addEventListener('input', async () => {
      const snapshot = await db.collection('services').get();
      let docs = snapshot.docs;
      if (searchService && searchService.value) docs = docs.filter(d => d.data().name?.toLowerCase().includes(searchService.value.toLowerCase()));
      if (filterServiceLocation && filterServiceLocation.value) docs = docs.filter(d => d.data().location?.toLowerCase().includes(filterServiceLocation.value.toLowerCase()));
      if (filterServiceCategory && filterServiceCategory.value) docs = docs.filter(d => d.data().category === filterServiceCategory.value);
      renderServices(docs);
    });
  });
}

// ================== AI DASHBOARD INTEGRATION ==================
const askAIDashboardBtn = document.getElementById('askAIDashboard');
if (askAIDashboardBtn) {
  askAIDashboardBtn.addEventListener('click', async () => {
    const query = document.getElementById('aiQueryDashboard').value.trim();
    const responseBox = document.getElementById('aiDashboardResponse');
    const responseText = document.getElementById('aiDashboardText');
    if (!query) return alert('Please type a question for the AI.');
    responseText.textContent = 'Analyzing your question...';
    responseBox.classList.remove('hidden');

    try {
      const res = await fetch('https://us-central1-jompo-farmlink-web.cloudfunctions.net/askAI', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query })
      });
      const data = await res.json();
      responseText.textContent = data.reply || 'AI could not process this query.';
    } catch (err) {
      console.error(err);
      responseText.textContent = 'Error connecting to AI service.';
    }
  });
}

