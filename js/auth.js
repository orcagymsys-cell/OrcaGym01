/**
 * Orca Gymnastics Authentication & Role Management
 */

class Auth {
  constructor() {
    this.store = window.orcaStore;
  }

  login(username, password) {
    const users = this.store.getUsers();
    const user = users.find(u => u.username.trim().toLowerCase() === username.trim().toLowerCase() && u.password === password);
    
    if (!user) {
      return { success: false, message: 'ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง' };
    }

    this.store.setCurrentUser(user);
    return { success: true, user };
  }

  registerParent(data) {
    const users = this.store.getUsers();
    if (users.some(u => u.username.trim().toLowerCase() === data.phone.trim())) {
      return { success: false, message: 'เบอร์โทรศัพท์นี้ถูกใช้งานเป็นชื่อบัญชีแล้ว' };
    }

    const newUser = {
      id: 'u_' + Date.now(),
      username: data.phone.trim(),
      password: data.password,
      role: 'parent',
      name: data.fullName,
      phone: data.phone,
      termsAccepted: true,
      createdAt: new Date().toISOString()
    };

    this.store.saveUser(newUser);
    this.store.setCurrentUser(newUser);
    return { success: true, user: newUser };
  }

  logout() {
    this.store.logout();
  }

  getCurrentUser() {
    return this.store.getCurrentUser();
  }

  isAdmin() {
    const user = this.getCurrentUser();
    return user && user.role === 'admin';
  }
}

window.orcaAuth = new Auth();
