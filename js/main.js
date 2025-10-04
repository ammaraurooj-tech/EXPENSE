
// Navbar toggle
document.addEventListener('DOMContentLoaded', () => {
  const btn = document.getElementById('menuToggle');
  const nav = document.getElementById('navlinks');
  if(btn){
    btn.addEventListener('click', () => {
      nav.classList.toggle('show');
    });
  }
});
