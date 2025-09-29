  // Your web app's Firebase configuration
  const firebaseConfig = {
    apiKey: "AIzaSyCK2sZb2_O0K8tq0KWKwmSV8z4He30dcDc",
    authDomain: "jompo-farmlink-web.firebaseapp.com",
    projectId: "jompo-farmlink-web",
    storageBucket: "jompo-farmlink-web.firebasestorage.app",
    messagingSenderId: "497296091103",
    appId: "1:497296091103:web:72b3e8223ea0cbb306066a"
  };

  // Initialize Firebase
  const app = initializeApp(firebaseConfig);
</script>

firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();

// Marketplace Listings
const marketplaceContainer = document.getElementById('marketplaceContainer');
if (marketplaceContainer) {
  const renderListings = (listings) => {
    marketplaceContainer.innerHTML = '';
    listings.forEach(doc => {
      const data = doc.data();
      marketplaceContainer.innerHTML += `
        <div class="bg-white p-4 rounded shadow hover:shadow-lg transition">
          <h3 class="font-bold text-green-800">${data.name}</h3>
          <p>Category: ${data.category}</p>
          ${data.quantity ? `<p>Quantity: ${data.quantity}</p>` : ''}
          <p>Price: KSh ${data.price}</p>
          <p>Location: ${data.location}</p>
        </div>
      `;
    });
  };

  // Fetch all listings from Firestore
  db.collection('listings').get().then(snapshot => {
    renderListings(snapshot.docs);
  });

  // Filters (optional)
  const searchInput = document.getElementById('searchInput');
  const filterLocation = document.getElementById('filterLocation');
  const filterCategory = document.getElementById('filterCategory');

  [searchInput, filterLocation, filterCategory].forEach(el => {
    if (el) {
      el.addEventListener('input', async () => {
        const snapshot = await db.collection('listings').get();
        let filtered = snapshot.docs;

        if (searchInput.value) {
          filtered = filtered.filter(d =>
            d.data().name.toLowerCase().includes(searchInput.value.toLowerCase())
          );
        }
        if (filterLocation.value) {
          filtered = filtered.filter(d =>
            d.data().location.toLowerCase().includes(filterLocation.value.toLowerCase())
          );
        }
        if (filterCategory.value) {
          filtered = filtered.filter(d =>
            d.data().category === filterCategory.value
          );
        }

        renderListings(filtered);
      });
    }
  });
}

// Services Listings
const servicesContainer = document.getElementById('servicesContainer');
if (servicesContainer) {
  const renderServices = (services) => {
    servicesContainer.innerHTML = '';
    services.forEach(doc => {
      const data = doc.data();
      servicesContainer.innerHTML += `
        <div class="bg-white p-4 rounded shadow hover:shadow-lg transition">
          <h3 class="font-bold text-green-800">${data.name}</h3>
          <p>Category: ${data.category}</p>
          <p>Price: KSh ${data.price}</p>
          <p>Location: ${data.location}</p>
          <p class="text-sm mt-2">${data.description || ''}</p>
          <button class="mt-4 px-4 py-2 bg-green-700 text-white rounded hover:bg-green-800">
            Book Now
          </button>
        </div>
      `;
    });
  };

  // Fetch all services from Firestore
  db.collection('services').get().then(snapshot => {
    renderServices(snapshot.docs);
  });

  // Filters (optional)
  const searchService = document.getElementById('searchService');
  const filterServiceLocation = document.getElementById('filterServiceLocation');

  [searchService, filterServiceLocation].forEach(el => {
    if (el) {
      el.addEventListener('input', async () => {
        const snapshot = await db.collection('services').get();
        let filtered = snapshot.docs;

        if (searchService.value) {
          filtered = filtered.filter(d =>
            d.data().name.toLowerCase().includes(searchService.value.toLowerCase())
          );
        }
        if (filterServiceLocation.value) {
          filtered = filtered.filter(d =>
            d.data().location.toLowerCase().includes(filterServiceLocation.value.toLowerCase())
          );
        }

        renderServices(filtered);
      });
    }
  });
}


// REGISTER
const registerForm = document.getElementById('registerForm');
if(registerForm){
  registerForm.addEventListener('submit', async (e)=>{
    e.preventDefault();
    const name = document.getElementById('name').value;
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const location = document.getElementById('location').value;
    const role = document.getElementById('role').value;

    try {
      const userCredential = await auth.createUserWithEmailAndPassword(email, password);
      await db.collection('users').doc(userCredential.user.uid).set({name,email,location,role});
      alert('Registration successful!');
      window.location.href = "dashboard.html";
    } catch(err){
      alert(err.message);
    }
  });
}

// LOGIN
const loginForm = document.getElementById('loginForm');
if(loginForm){
  loginForm.addEventListener('submit', async (e)=>{
    e.preventDefault();
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;

    try {
      await auth.signInWithEmailAndPassword(email, password);
      window.location.href = "dashboard.html";
    } catch(err){
      alert(err.message);
    }
  });
}

// LOGOUT
const logoutBtn = document.getElementById('logoutBtn');
if(logoutBtn){
  logoutBtn.addEventListener('click', ()=>{
    auth.signOut().then(()=>{ window.location.href = 'index.html'; });
  });
}

// ADD LISTING (Product/Service)
const addListingForm = document.getElementById('addListingForm');
if(addListingForm){
  addListingForm.addEventListener('submit', async (e)=>{
    e.preventDefault();
    const name = document.getElementById('productName').value;
    const category = document.getElementById('category').value;
    const quantity = document.getElementById('quantity').value;
    const price = document.getElementById('price').value;
    const location = document.getElementById('locationListing').value;

    const user = auth.currentUser;
    if(!user){ alert('Not logged in'); return; }

    await db.collection('listings').add({
      name, category, quantity, price, location, farmerID: user.uid
    });
    alert('Listing added!');
    addListingForm.reset();
  });
}

// DISPLAY DASHBOARD LISTINGS
const listingsContainer = document.getElementById('listingsContainer');
if(listingsContainer){
  auth.onAuthStateChanged(async user=>{
    if(user){
      const snapshot = await db.collection('listings').where('farmerID','==',user.uid).get();
      listingsContainer.innerHTML = '';
      snapshot.forEach(doc=>{
        const data = doc.data();
        listingsContainer.innerHTML += `
          <div class="bg-white p-4 rounded shadow">
            <h3 class="font-bold text-green-800">${data.name}</h3>
            <p>Category: ${data.category}</p>
            <p>Quantity: ${data.quantity}</p>
            <p>Price: KSh ${data.price}</p>
            <p>Location: ${data.location}</p>
          </div>
        `;
      });
    } else {
      window.location.href = 'login.html';
    }
  });
}

// DISPLAY MARKETPLACE LISTINGS
const marketplaceContainer = document.getElementById('marketplaceContainer');
if(marketplaceContainer){
  const renderListings = (listings)=>{
    marketplaceContainer.innerHTML = '';
    listings.forEach(doc=>{
      const data = doc.data();
      marketplaceContainer.innerHTML += `
        <div class="bg-white p-4 rounded shadow hover:shadow-lg transition">
          <h3 class="font-bold text-green-800">${data.name}</h3>
          <p>Category: ${data.category}</p>
          ${data.quantity ? `<p>Quantity: ${data.quantity}</p>` : ''}
          <p>Price: KSh ${data.price}</p>
          <p>Location: ${data.location}</p>
        </div>
      `;
    });
  }

  const fetchListings = async ()=>{
    const snapshot = await db.collection('listings').get();
    renderListings(snapshot.docs);
  }

  fetchListings();

  // Filters
  const searchInput = document.getElementById('searchInput');
  const filterLocation = document.getElementById('filterLocation');
  const filterCategory = document.getElementById('filterCategory');

  [searchInput, filterLocation, filterCategory].forEach(el=>{
    el.addEventListener('input', async ()=>{
      const snapshot = await db.collection('listings').get();
      let filtered = snapshot.docs;

      if(searchInput.value){
        filtered = filtered.filter(d=>d.data().name.toLowerCase().includes(searchInput.value.toLowerCase()));
      }
      if(filterLocation.value){
        filtered = filtered.filter(d=>d.data().location.toLowerCase().includes(filterLocation.value.toLowerCase()));
      }
      if(filterCategory.value){
        filtered = filtered.filter(d=>d.data().category === filterCategory.value);
      }

      renderListings(filtered);
    });
  });
}

// DISPLAY SERVICES
const servicesContainer = document.getElementById('servicesContainer');
if(servicesContainer){
  const renderServices = (services)=>{
    servicesContainer.innerHTML = '';
    services.forEach(doc=>{
      const data = doc.data();
      servicesContainer.innerHTML += `
        <div class="bg-white p-4 rounded shadow hover:shadow-lg transition">
          <h3 class="font-bold text-green-800">${data.name}</h3>
          <p>Category: ${data.category}</p>
          <p>Price: KSh ${data.price}</p>
          <p>Location: ${data.location}</p>
          <p class="text-sm mt-2">${data.description || ''}</p>
          <button class="mt-4 px-4 py-2 bg-green-700 text-white rounded hover:bg-green-800">Book Now</button>
        </div>
      `;
    });
  }

  const fetchServices = async ()=>{
    const snapshot = await db.collection('services').get();
    renderServices(snapshot.docs);
  }

  fetchServices();

  // Filters
  const searchService = document.getElementById('searchService');
  const filterServiceLocation = document.getElementById('filterServiceLocation');

  [searchService, filterServiceLocation].forEach(el=>{
    el.addEventListener('input', async ()=>{
      const snapshot = await db.collection('services').get();
      let filtered = snapshot.docs;

      if(searchService.value){
        filtered = filtered.filter(d=>d.data().name.toLowerCase().includes(searchService.value.toLowerCase()));
      }
      if(filterServiceLocation.value){
        filtered = filtered.filter(d=>d.data().location.toLowerCase().includes(filterServiceLocation.value.toLowerCase()));
      }

      renderServices(filtered);
    });
  });
}

