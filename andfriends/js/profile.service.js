/**
 * &FRIENDS — profile.service.js
 * Handles ALL Firebase Auth + Firestore profile logic securely
 */

const ProfileService = (() => {

  async function getCurrentUser(session) {
    await Store.Users.fetchAll();

    return Store.Users.getById(session.id) || {
      ...session,
      phone: '',
      dob: '',
      createdAt: new Date().toISOString()
    };
  }

  async function updateProfile(userId, data) {
    return await Store.Users.updateProfile(userId, data);
  }

  // 🔐 REAL PASSWORD CHANGE (Firebase Auth secure)
  async function changePassword(newPassword) {
    const user = firebase.auth().currentUser;

    if (!user) throw new Error("No authenticated user");

    await user.updatePassword(newPassword);
    return true;
  }

  async function deleteAccount(userId) {
    await Store.Users.delete(userId);

    const user = firebase.auth().currentUser;
    if (user) await user.delete();

    await Store.Auth.logout();
  }

  return {
    getCurrentUser,
    updateProfile,
    changePassword,
    deleteAccount
  };

})();