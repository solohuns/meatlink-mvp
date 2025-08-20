// ===============================
// MeatLink JS - Persistent Login & Validators
// ===============================

// Helper shortcuts
const $ = (sel, root=document) => root.querySelector(sel);
const $$ = (sel, root=document) => Array.from(root.querySelectorAll(sel));

// ===============================
// Local Storage Wrapper
// ===============================
const store = {
  key: 'meatlink:v1',
  load() {
    try {
      const raw = localStorage.getItem(this.key);
      return raw ? JSON.parse(raw) : { users: [], stock: [], orders: [], transports: [], session: { userId: null } };
    } catch(e) { console.warn('Bad store', e); return { users: [], stock: [], orders: [], transports: [], session: { userId: null } }; }
  },
  save(data){ localStorage.setItem(this.key, JSON.stringify(data)); }
};

let db = store.load();

// ===============================
// Validators
// ===============================
function showValidator(input, msg, color='red'){
  let next = input.nextElementSibling;
  if(!next || (!next.classList.contains('validator-msg') && !next.classList.contains('error-message') && !next.classList.contains('success-message'))){
    next = document.createElement('div');
    next.className = 'validator-msg';
    input.insertAdjacentElement('afterend', next);
  }
  next.style.color = color;
  next.textContent = msg;
}
function clearValidator(input){
  const next = input.nextElementSibling;
  if(next && next.classList.contains('validator-msg')) next.textContent = '';
}

// ===============================
// AUTH - Sign Up / Sign In
// ===============================
document.addEventListener("DOMContentLoaded", function() {

  const user = JSON.parse(localStorage.getItem("meatlinkLoggedIn"));

  // -------- SIGN UP --------
  const signupForm = $('#signupForm');
  if(signupForm) {
    signupForm.addEventListener("submit", function(e){
      e.preventDefault();
      let valid = true;

      const fullname = $('#fullname').value.trim();
      const email = $('#email').value.trim().toLowerCase();
      const phone = $('#phone').value.trim();
      const location = $('#location').value.trim();
      const password = $('#password').value.trim();

      [$('#fullname'), $('#email'), $('#phone'), $('#location'), $('#password')].forEach(clearValidator);

      if(!fullname){ showValidator($('#fullname'), "Full name is required!"); valid=false; }
      if(!email){ showValidator($('#email'), "Email is required!"); valid=false; }
      else if(!/^[^ ]+@[^ ]+\.[a-z]{2,3}$/.test(email)){ showValidator($('#email'), "Invalid email format!"); valid=false; }
      if(!phone){ showValidator($('#phone'), "Phone is required!"); valid=false; }
      if(!location){ showValidator($('#location'), "Location is required!"); valid=false; }
      if(!password){ showValidator($('#password'), "Password is required!"); valid=false; }
      else if(password.length < 6){ showValidator($('#password'), "Password must be at least 6 characters!"); valid=false; }

      if(db.users.some(u=>u.email===email)){ showValidator($('#email'), "Email already registered."); valid=false; }

      if(!valid) return;

      const newUser = { id:'u'+(db.users.length+1), fullname, email, phone, location, password };
      db.users.push(newUser);
      store.save(db);

      localStorage.setItem("meatlinkLoggedIn", JSON.stringify(newUser));
      showValidator($('#signupForm button'), "Account created successfully!", 'green');
      setTimeout(()=> window.location.href = "dashboard.html", 1200);
    });
  }

  // -------- SIGN IN --------
  const signinForm = $('#signinForm');
  if(signinForm){
    signinForm.addEventListener("submit", function(e){
      e.preventDefault();
      const email = $('#signinEmail').value.trim().toLowerCase();
      const password = $('#signinPassword').value.trim();

      [$('#signinEmail'), $('#signinPassword')].forEach(clearValidator);

      let valid = true;
      if(!email){ showValidator($('#signinEmail'), "Email is required."); valid=false; }
      if(!password){ showValidator($('#signinPassword'), "Password is required."); valid=false; }
      if(!valid) return;

      const user = db.users.find(u=>u.email===email && u.password===password);
      if(user){
        localStorage.setItem("meatlinkLoggedIn", JSON.stringify(user));
        showValidator($('#signinForm button'), `Welcome back, ${user.fullname}!`, 'green');
        setTimeout(()=> window.location.href = "dashboard.html", 1000);
      } else {
        showValidator($('#signinEmail'), "Invalid email or password.");
      }
    });
  }

  // ---------------- DASHBOARD ----------------
  if(user){
    const welcomeEl = $('#welcome');
    if(welcomeEl) welcomeEl.textContent = `Welcome, ${user.fullname}!`;

    const logoutBtn = $('#logout');
    if(logoutBtn){
      logoutBtn.addEventListener('click', e=>{
        e.preventDefault();
        localStorage.removeItem("meatlinkLoggedIn");
        window.location.href = "signin.html";
      });
    }

    // Display stock
    const stockTableBody = $('#stockTableBody');
    if(stockTableBody){
      db.stock.filter(s=>s.userEmail===user.email).forEach(item=>{
        const tr = document.createElement('tr');
        tr.innerHTML = `<td>${item.item}</td><td>${item.qty}</td><td>R${item.price}</td><td>${item.status}</td>`;
        stockTableBody.appendChild(tr);
      });
    }

    // Add stock
    const addStockForm = $('#addStockForm');
    if(addStockForm){
      addStockForm.addEventListener('submit', e=>{
        e.preventDefault();
        let valid = true;

        const item = $('#item').value.trim();
        const qty = $('#qty').value.trim();
        const price = $('#price').value.trim();

        [$('#item'), $('#qty'), $('#price')].forEach(clearValidator);

        if(!item){ showValidator($('#item'), "Item name required."); valid=false; }
        if(!qty || isNaN(qty) || qty <= 0){ showValidator($('#qty'), "Enter valid quantity."); valid=false; }
        if(!price || isNaN(price) || price <= 0){ showValidator($('#price'), "Enter valid price."); valid=false; }

        if(!valid) return;

        db.stock.push({ userEmail: user.email, item, qty, price, status:"Available" });
        store.save(db);
        showValidator($('#addStockForm button'), "Stock added successfully!", 'green');
        setTimeout(()=> window.location.reload(), 800);
      });
    }

    // Orders table
    const ordersTableBody = $('#ordersTableBody');
    if(ordersTableBody){
      db.orders.filter(o=>o.userEmail===user.email).forEach(o=>{
        const tr=document.createElement('tr');
        tr.innerHTML=`<td>${o.id}</td><td>${o.item}</td><td>${o.qty}</td><td>R${o.price}</td><td>${o.status}</td>`;
        ordersTableBody.appendChild(tr);
      });
    }

    // Transport table
    const transportTableBody = $('#transportTableBody');
    if(transportTableBody){
      db.transports.filter(t=>t.userEmail===user.email).forEach(t=>{
        const tr=document.createElement('tr');
        tr.innerHTML=`<td>${t.id}</td><td>${t.item}</td><td>${t.qty}</td><td>${t.destination}</td><td>${t.status}</td>`;
        transportTableBody.appendChild(tr);
      });
    }

    // Profile
    const profileDiv = $('#profileInfo');
    if(profileDiv){
      profileDiv.innerHTML=`<p><strong>Full Name:</strong> ${user.fullname}</p>
                            <p><strong>Email:</strong> ${user.email}</p>
                            <p><strong>Phone:</strong> ${user.phone}</p>
                            <p><strong>Location:</strong> ${user.location}</p>`;
    }
  }
});








