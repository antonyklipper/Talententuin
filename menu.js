document.addEventListener('DOMContentLoaded', function() {
  const menuBtn = document.querySelector('.menu-toggle');
  const nav = document.querySelector('.impact-nav');
  let overlay;

  function openMenu() {
    nav.classList.add('open');
    document.body.classList.add('menu-open');
    overlay = document.createElement('div');
    overlay.className = 'menu-overlay';
    overlay.onclick = closeMenu;
    document.body.appendChild(overlay);
  }

  function closeMenu() {
    nav.classList.remove('open');
    document.body.classList.remove('menu-open');
    if (overlay) {
      overlay.remove();
      overlay = null;
    }
  }

  menuBtn.addEventListener('click', function() {
    if (nav.classList.contains('open')) {
      closeMenu();
    } else {
      openMenu();
    }
  });

  // Sluit menu bij klikken op een menu-item (alleen mobiel)
  nav.querySelectorAll('a').forEach(function(link) {
    link.addEventListener('click', function() {
      if (window.innerWidth <= 900) closeMenu();
    });
  });
}); 