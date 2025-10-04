
// Simple client-side auth for demo purposes.
// In production, use secure backend authentication.

function getUsers(){
  const raw = localStorage.getItem('et_users') || '[]';
  return JSON.parse(raw);
}
function saveUsers(users){ localStorage.setItem('et_users', JSON.stringify(users)); }

document.addEventListener('DOMContentLoaded', () => {
  const signupForm = document.getElementById('signupForm');
  const loginForm = document.getElementById('loginForm');

  if(signupForm){
    signupForm.addEventListener('submit', (e)=>{
      e.preventDefault();
      const name = document.getElementById('signupName').value.trim();
      const email = document.getElementById('signupEmail').value.trim();
      const pw = document.getElementById('signupPassword').value;
      const users = getUsers();
      if(users.find(u=>u.email === email)){
        alert('User already exists. Please login.');
        return;
      }
      users.push({name, email, password: pw});
      saveUsers(users);
      localStorage.setItem('et_current', email);
      window.location.href = 'dashboard.html';
    });
  }

  if(loginForm){
    loginForm.addEventListener('submit', (e)=>{
      e.preventDefault();
      const email = document.getElementById('loginEmail').value.trim();
      const pw = document.getElementById('loginPassword').value;
      const users = getUsers();
      // demo shortcut
      if(email === 'demo@user.com' && pw === 'demo123'){
        localStorage.setItem('et_current','demo@user.com');
        window.location.href = 'dashboard.html';
        return;
      }
      const u = users.find(u=>u.email === email && u.password === pw);
      if(!u){ alert('Invalid credentials'); return; }
      localStorage.setItem('et_current', email);
      window.location.href = 'dashboard.html';
    });
  }
});
