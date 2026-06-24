/**
 * &FRIENDS — profile.component.js
 * Pure UI rendering (reusable anywhere)
 */

const ProfileComponent = (() => {

  function renderProfileHeader(user) {
    document.getElementById('profileAvatar').textContent =
      user.name.charAt(0).toUpperCase();

    document.getElementById('profileName').textContent = user.name;
    document.getElementById('profileEmail').textContent = user.email;

    document.getElementById('profileJoined').textContent =
      'Member since ' + new Date(user.createdAt)
        .toLocaleDateString('en-ZA', {
          year: 'numeric',
          month: 'long'
        });
  }

  function fillForm(user) {
    document.getElementById('pName').value = user.name || '';
    document.getElementById('pPhone').value = user.phone || '';
    document.getElementById('pDob').value = user.dob || '';
  }

  function showSuccess(id) {
    const el = document.getElementById(id);
    el.style.display = 'block';
    setTimeout(() => el.style.display = 'none', 3000);
  }

  function showError(id, msg) {
    const el = document.getElementById(id);
    el.textContent = msg;
    el.style.display = 'block';
  }

  function hideError(id) {
    const el = document.getElementById(id);
    el.style.display = 'none';
  }

  return {
    renderProfileHeader,
    fillForm,
    showSuccess,
    showError,
    hideError
  };

})();