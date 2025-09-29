// ================== FIREBASE SETUP ==================
const firebaseConfig = {
  apiKey: "AIzaSyCK2sZb2_O0K8tq0KWKwmSV8z4He30dcDc",
  authDomain: "jompo-farmlink-web.firebaseapp.com",
  projectId: "jompo-farmlink-web",
  storageBucket: "jompo-farmlink-web.appspot.com",
  messagingSenderId: "497296091103",
  appId: "1:497296091103:web:72b3e8223ea0cbb306066a"
};

firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();

// ================== UTILITY ==================
function renderItems(container, items, isService=false) {
  container.innerHTML = '';
  if (!items.length) return false;
  items.forEach(item => {
    container.innerHTML += `
      <div class="bg-white p-4 rounded shadow hover:shadow-lg transition">
        <h3 class="font-bold text-green-800">${item.name}</h3>
        <p>Category: ${item.category}</p>
        ${item.quantity ? `<p>Quantity: ${item.quantity}</p>` : ''}
        <p>Price: KSh ${item.price}</p>
        <p>Location: ${item.location}</p>
        ${isService && item.description ? `<p class="text-sm mt-2">${item.description}</p>` : ''}
        ${isService ? `<button class="mt-4 px-4 py-2 bg-green-700 text-white rounded hover:bg-green-800">Book Now</button>` : ''}
      </div>
    `;
  });
  return true;
}

function applyFilters(items, filters) {
  return items.filter(item => 
    item.name.toLowerCase().includes(filters.search) &&
    item.location.toLowerCase().includes(filters.location) &&
    (filters.category ? item.category === filters.category : true)
  );
}

// ================== AUTH ==================
function setupAuth() {
  const registerForm = document.getElementById('registerForm');
  const loginForm = document.getElementById('loginForm');
  const logoutBtn = document.getElementById('logoutBtn');

  if (registerForm) {
    registerForm.addEventListener('submit', async e => {
      e.preventDefault();
      const name = document.getElementById('name').value;
      const email = document.getElementById('email').value;
      const password = document.getElementById('password').value;
      const location = document.getElementById('location').value;
      const role = document.getElementById('role').value;
      try {
        const userCredential = await auth.createUserWithEmailAndPassword(email, password);
        const user = userCredential.user;
        await db.collection('users').doc(user.uid).set({ name, email, location, role, verified:false });
        await user.sendEmailVerification();
        alert('Registration successful! Verify your email.');
        registerForm.reset();
      } catch (err) { alert(err.message); }
    });
  }

  if (loginForm) {
    const loginError = document.getElementById("loginError");
    loginForm.addEventListener('submit', async e => {
      e.preventDefault();
      const email = document.getElementById('loginEmail').value;
      const password = document.getElementById('loginPassword').value;
      try {
        const userCredential = await auth.signInWithEmailAndPassword(email, password);
        if (!userCredential.user.emailVerified) {
          if (loginError) { loginError.textContent = "Verify email first."; loginError.classList.remove("hidden"); }
          await auth.signOut();
          return;
        }
        window.location.href = "dashboard.html";
      } catch (err) {
        if (loginError) { loginError.textContent = err.message; loginError.classList.remove("hidden"); }
        else alert(err.message);
      }
    });
  }

  if (logoutBtn) logoutBtn.addEventListener('click', () => auth.signOut().then(()=> window.location.href='index.html'));
}

// ================== DASHBOARD ==================
function setupDashboard() {
  const listingsContainer = document.getElementById('listingsContainer');
  const addListingForm = document.getElementById('addListingForm');
  if (!listingsContainer && !addListingForm) return;

  auth.onAuthStateChanged(async user => {
    if (!user) return window.location.href = 'login.html';

    const fetchUserItems = async () => {
      const listingsSnap = await db.collection('listings').where('farmerID','==',user.uid).get();
      const servicesSnap = await db.collection('services').where('farmerID','==',user.uid).get();
      const allItems = [...listingsSnap.docs.map(d=>({...d.data()})), ...servicesSnap.docs.map(d=>({...d.data()}))];
      renderItems(listingsContainer, allItems);
    };

    fetchUserItems();

    if (addListingForm) {
      addListingForm.addEventListener('submit', async e => {
        e.preventDefault();
        const name = document.getElementById('productName').value;
        const category = document.getElementById('category').value;
        const quantity = document.getElementById('quantity').value;
        const price = document.getElementById('price').value;
        const location = document.getElementById('locationListing').value;
        const data = { name, category, quantity, price, location, farmerID:user.uid, createdAt: firebase.firestore.FieldValue.serverTimestamp() };
        if (category==='service') await db.collection('services').add(data);
        else await db.collection('listings').add(data);
        addListingForm.reset();
        fetchUserItems();
      });
    }
  });
}

// ================== MARKETPLACE ==================
function setupMarketplace() {
  const container = document.getElementById('marketplaceContainer');
  if (!container) return;
  const noResults = document.getElementById('noResults');
  const searchInput = document.getElementById('searchInput');
  const filterLocation = document.getElementById('filterLocation');
  const filterCategory = document.getElementById('filterCategory');

  let allItems = [];

  const fetchAll = async () => {
    const listingsSnap = await db.collection('listings').get();
    const servicesSnap = await db.collection('services').get();
    allItems = [...listingsSnap.docs.map(d=>({...d.data()})), ...servicesSnap.docs.map(d=>({...d.data()}))];

    // populate category dropdown
    if (filterCategory) {
      const cats = [...new Set(allItems.map(i=>i.category).filter(Boolean))];
      filterCategory.innerHTML = '<option value="">All Categories</option>';
      cats.forEach(cat => { const opt = document.createElement('option'); opt.value = cat; opt.textContent=cat; filterCategory.appendChild(opt); });
    }

    if (!renderItems(container, allItems)) noResults.classList.remove('hidden');
    else noResults.classList.add('hidden');
  };

  const filterItems = () => {
    const filters = {
      search: searchInput?.value.toLowerCase()||'',
      location: filterLocation?.value.toLowerCase()||'',
      category: filterCategory?.value||''
    };
    const filtered = applyFilters(allItems, filters);
    if (!renderItems(container, filtered)) noResults.classList.remove('hidden');
    else noResults.classList.add('hidden');
  };

  [searchInput, filterLocation, filterCategory].forEach(el=>{
    if(el) el.addEventListener('input', filterItems);
    if(el===filterCategory) el.addEventListener('change', filterItems);
  });

  fetchAll();
}

// ================== SERVICES PAGE ==================
function setupServicesPage() {
  const container = document.getElementById('servicesContainer');
  if (!container) return;
  const searchService = document.getElementById('searchService');
  const filterLocation = document.getElementById('filterServiceLocation');

  let servicesItems = [];

  const fetchServices = async () => {
    const snap = await db.collection('services').get();
    servicesItems = snap.docs.map(d=>({...d.data()}));
    renderItems(container, servicesItems, true);
  };

  const updateServices = () => {
    const filters = { search: searchService?.value.toLowerCase()||'', location: filterLocation?.value.toLowerCase()||'', category:'' };
    renderItems(container, applyFilters(servicesItems, filters), true);
  };

  [searchService, filterLocation].forEach(el => { if(el) el.addEventListener('input', updateServices); });

  fetchServices();
}

// ================== INIT ==================
document.addEventListener('DOMContentLoaded', () => {
  setupAuth();
  setupDashboard();
  setupMarketplace();
  setupServicesPage();
});



