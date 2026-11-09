/**
 * Apex Banking Management System - API Client Integration
 * Dual-Mode Engine:
 * 1. Live Mode: Communicates with Spring Boot REST API (/api/**) on localhost:8080
 * 2. Cloud/Simulation Mode: Resilient in-browser stateful Database Engine (localStorage)
 *    Enables 100% functionality on Vercel, Netlify, GitHub Pages, and mobile browsers.
 */

// Determine API Base URL
const isLocalServer = (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');
const API_BASE = (isLocalServer && (window.location.port === '8080' || window.location.port === ''))
  ? '/api'
  : (isLocalServer ? 'http://localhost:8080/api' : null);

// Helper for formatted timestamps
function getNowFormattedDate() {
  const d = new Date();
  return d.toISOString().replace('T', ' ').substring(0, 19);
}

const BankAPI = {
  // Check if live Spring Boot backend is reachable
  async ping() {
    if (!API_BASE) return false;
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 1500);
      const res = await fetch(`${API_BASE}/account/details?email=alex.morgan@college.edu`, {
        method: 'GET',
        signal: controller.signal
      });
      clearTimeout(timeoutId);
      return res.ok;
    } catch (e) {
      return false;
    }
  },

  // Authentication: Login
  async login(email, password) {
    if (API_BASE) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 2000);
        const res = await fetch(`${API_BASE}/auth/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password }),
          signal: controller.signal
        });
        clearTimeout(timeoutId);
        if (res.ok) {
          return await res.json();
        }
      } catch (err) {
        console.info('Backend unreachable, executing login via simulation engine.');
      }
    }

    // Cloud / LocalStorage Simulation Fallback
    const store = getBankData();
    const cleanEmail = (email || '').trim().toLowerCase();

    // Admin login
    if (cleanEmail === 'admin' || cleanEmail.includes('admin')) {
      return {
        success: true,
        data: {
          id: 1,
          role: 'ADMIN',
          fullName: 'Executive Administrator',
          email: 'admin@apexbank.com'
        },
        message: 'Admin authorization granted'
      };
    }

    // Customer login
    let matchedUser = (store.adminCustomers || []).find(u => 
      (u.email && u.email.toLowerCase() === cleanEmail) || 
      (u.accNo && u.accNo.toLowerCase() === cleanEmail)
    );

    if (!matchedUser) {
      matchedUser = {
        id: 101,
        fullName: store.customer.fullName || 'Alex Morgan',
        email: email,
        accountNumber: store.customer.accountNumber || 'ACT88204910',
        accountType: store.customer.accountType || 'SAVINGS',
        balance: store.customer.balance || 24850.75,
        status: 'ACTIVE'
      };
    }

    return {
      success: true,
      data: {
        id: matchedUser.id,
        role: 'CUSTOMER',
        fullName: matchedUser.fullName || matchedUser.name,
        email: matchedUser.email,
        accountNumber: matchedUser.accountNumber || matchedUser.accNo,
        balance: matchedUser.balance,
        status: matchedUser.status
      },
      message: 'Login successful'
    };
  },

  // Authentication: Registration
  async register(registerData) {
    if (API_BASE) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 2000);
        const res = await fetch(`${API_BASE}/auth/register`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(registerData),
          signal: controller.signal
        });
        clearTimeout(timeoutId);
        if (res.ok) {
          return await res.json();
        }
      } catch (err) {
        console.info('Backend unreachable, registering via simulation engine.');
      }
    }

    // Cloud / LocalStorage Simulation Fallback
    const store = getBankData();
    const newAccNo = 'ACT' + Math.floor(10000000 + Math.random() * 90000000);
    const initialDeposit = parseFloat(registerData.initialDeposit) || 1000.00;

    const newUser = {
      id: Date.now(),
      name: registerData.fullName,
      accNo: newAccNo,
      type: registerData.accountType || 'SAVINGS',
      balance: initialDeposit,
      status: 'ACTIVE',
      email: registerData.email,
      phone: registerData.phone || registerData.phoneNumber || '+1 (555) 000-0000'
    };

    store.adminCustomers = store.adminCustomers || [];
    store.adminCustomers.push(newUser);

    store.customer = {
      fullName: registerData.fullName,
      email: registerData.email,
      phone: newUser.phone,
      accountNumber: newAccNo,
      accountType: newUser.type,
      balance: initialDeposit,
      monthlyIncome: 5000.00,
      monthlyExpense: 0.00,
      savingsGoal: 20000.00,
      status: 'ACTIVE'
    };

    // Log opening deposit transaction
    store.transactions = store.transactions || [];
    store.transactions.unshift({
      id: Date.now(),
      ref: 'TXN-' + Math.floor(100000 + Math.random() * 900000),
      type: 'DEPOSIT',
      amount: initialDeposit,
      balanceAfter: initialDeposit,
      description: 'Initial Account Opening Deposit',
      date: getNowFormattedDate(),
      status: 'SUCCESS'
    });

    saveBankData(store);
    return {
      success: true,
      message: 'Account registered successfully',
      data: newUser
    };
  },

  // Account: Details & Summary
  async getAccountDetails(email) {
    if (API_BASE) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 2000);
        const res = await fetch(`${API_BASE}/account/details?email=${encodeURIComponent(email)}`, {
          signal: controller.signal
        });
        clearTimeout(timeoutId);
        if (res.ok) {
          const json = await res.json();
          return json.data;
        }
      } catch (err) {
        console.info('Backend unreachable, loading account from simulation store.');
      }
    }

    const store = getBankData();
    return store.customer;
  },

  // Account: Update Profile
  async updateProfile(email, profileData) {
    if (API_BASE) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 2000);
        const res = await fetch(`${API_BASE}/auth/profile?email=${encodeURIComponent(email)}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(profileData),
          signal: controller.signal
        });
        clearTimeout(timeoutId);
        if (res.ok) {
          return await res.json();
        }
      } catch (err) {}
    }

    const store = getBankData();
    if (profileData.fullName) store.customer.fullName = profileData.fullName;
    if (profileData.phone) store.customer.phone = profileData.phone;
    if (profileData.savingsGoal) store.customer.savingsGoal = parseFloat(profileData.savingsGoal);

    // Sync in admin customers list
    const adminCust = (store.adminCustomers || []).find(u => u.accNo === store.customer.accountNumber);
    if (adminCust && profileData.fullName) adminCust.name = profileData.fullName;

    saveBankData(store);
    return { success: true, message: 'Profile updated successfully', data: store.customer };
  },

  // Transactions: Deposit
  async deposit(email, amount, description) {
    const depositAmt = parseFloat(amount);
    if (isNaN(depositAmt) || depositAmt <= 0) throw new Error('Invalid deposit amount');

    if (API_BASE) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 2000);
        const res = await fetch(`${API_BASE}/transactions/deposit?email=${encodeURIComponent(email)}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            amount: depositAmt,
            depositMethod: 'ONLINE',
            description: description || 'Online Deposit'
          }),
          signal: controller.signal
        });
        clearTimeout(timeoutId);
        if (res.ok) {
          return await res.json();
        }
      } catch (err) {}
    }

    const store = getBankData();
    store.customer.balance = (parseFloat(store.customer.balance) || 0) + depositAmt;

    const adminCust = (store.adminCustomers || []).find(u => u.accNo === store.customer.accountNumber);
    if (adminCust) adminCust.balance = store.customer.balance;

    const newTxn = {
      id: Date.now(),
      ref: 'TXN-' + Math.floor(100000 + Math.random() * 900000),
      type: 'DEPOSIT',
      amount: depositAmt,
      balanceAfter: store.customer.balance,
      description: description || 'Online Account Deposit',
      date: getNowFormattedDate(),
      status: 'SUCCESS'
    };
    store.transactions = store.transactions || [];
    store.transactions.unshift(newTxn);

    saveBankData(store);
    return { success: true, data: { balance: store.customer.balance }, message: 'Deposit successful' };
  },

  // Transactions: Withdraw
  async withdraw(email, amount, description) {
    const withdrawAmt = parseFloat(amount);
    if (isNaN(withdrawAmt) || withdrawAmt <= 0) throw new Error('Invalid withdrawal amount');

    if (API_BASE) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 2000);
        const res = await fetch(`${API_BASE}/transactions/withdraw?email=${encodeURIComponent(email)}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            amount: withdrawAmt,
            withdrawalChannel: 'ATM',
            description: description || 'Cash Withdrawal'
          }),
          signal: controller.signal
        });
        clearTimeout(timeoutId);
        if (res.ok) {
          return await res.json();
        }
      } catch (err) {}
    }

    const store = getBankData();
    const currentBalance = parseFloat(store.customer.balance) || 0;
    if (currentBalance < withdrawAmt) {
      throw new Error(`Insufficient funds. Your current available balance is ${formatUSD(currentBalance)}`);
    }

    store.customer.balance = currentBalance - withdrawAmt;

    const adminCust = (store.adminCustomers || []).find(u => u.accNo === store.customer.accountNumber);
    if (adminCust) adminCust.balance = store.customer.balance;

    const newTxn = {
      id: Date.now(),
      ref: 'TXN-' + Math.floor(100000 + Math.random() * 900000),
      type: 'WITHDRAWAL',
      amount: withdrawAmt,
      balanceAfter: store.customer.balance,
      description: description || 'ATM / Cash Counter Withdrawal',
      date: getNowFormattedDate(),
      status: 'SUCCESS'
    };
    store.transactions = store.transactions || [];
    store.transactions.unshift(newTxn);

    saveBankData(store);
    return { success: true, data: { balance: store.customer.balance }, message: 'Withdrawal successful' };
  },

  // Transactions: Transfer
  async transfer(email, targetAccountNumber, amount, description, saveBeneficiary) {
    const transferAmt = parseFloat(amount);
    if (isNaN(transferAmt) || transferAmt <= 0) throw new Error('Invalid transfer amount');

    if (API_BASE) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 2000);
        const res = await fetch(`${API_BASE}/transactions/transfer?email=${encodeURIComponent(email)}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            targetAccountNumber,
            amount: transferAmt,
            description: description || 'P2P Fund Transfer',
            saveBeneficiary: !!saveBeneficiary
          }),
          signal: controller.signal
        });
        clearTimeout(timeoutId);
        if (res.ok) {
          return await res.json();
        }
      } catch (err) {}
    }

    const store = getBankData();
    const currentBalance = parseFloat(store.customer.balance) || 0;
    if (currentBalance < transferAmt) {
      throw new Error(`Insufficient balance. Your current available balance is ${formatUSD(currentBalance)}`);
    }

    store.customer.balance = currentBalance - transferAmt;

    const senderAdmin = (store.adminCustomers || []).find(u => u.accNo === store.customer.accountNumber);
    if (senderAdmin) senderAdmin.balance = store.customer.balance;

    // Credit recipient account if present in directory
    const recipient = (store.adminCustomers || []).find(u => u.accNo === targetAccountNumber);
    if (recipient) {
      recipient.balance = (parseFloat(recipient.balance) || 0) + transferAmt;
    }

    // Save beneficiary if requested
    if (saveBeneficiary) {
      store.beneficiaries = store.beneficiaries || [];
      if (!store.beneficiaries.some(b => b.accountNumber === targetAccountNumber)) {
        store.beneficiaries.push({
          id: 'ben-' + Date.now(),
          name: recipient ? recipient.name : `Payee (${targetAccountNumber})`,
          accountNumber: targetAccountNumber,
          bankName: 'Apex Banking Network',
          dateAdded: getNowFormattedDate().substring(0, 10)
        });
      }
    }

    const newTxn = {
      id: Date.now(),
      ref: 'TXN-' + Math.floor(100000 + Math.random() * 900000),
      type: 'TRANSFER',
      amount: transferAmt,
      balanceAfter: store.customer.balance,
      description: description || `P2P Fund Transfer to ${targetAccountNumber}`,
      date: getNowFormattedDate(),
      status: 'SUCCESS'
    };
    store.transactions = store.transactions || [];
    store.transactions.unshift(newTxn);

    saveBankData(store);
    return { success: true, data: { balance: store.customer.balance }, message: 'Transfer successful' };
  },

  // Transactions: History Statement
  async getTransactionHistory(email) {
    if (API_BASE) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 2000);
        const res = await fetch(`${API_BASE}/transactions/history?email=${encodeURIComponent(email)}`, {
          signal: controller.signal
        });
        clearTimeout(timeoutId);
        if (res.ok) {
          const json = await res.json();
          return json.data;
        }
      } catch (err) {}
    }

    const store = getBankData();
    return store.transactions || [];
  },

  // Transactions: Delete Record
  async deleteTransaction(id) {
    if (API_BASE) {
      try {
        const res = await fetch(`${API_BASE}/transactions/${id}`, { method: 'DELETE' });
        if (res.ok) return await res.json();
      } catch (err) {}
    }

    const store = getBankData();
    store.transactions = (store.transactions || []).filter(t => t.id != id);
    saveBankData(store);
    return { success: true, message: 'Transaction removed from view' };
  },

  // Beneficiaries
  async getBeneficiaries(email) {
    if (API_BASE) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 2000);
        const res = await fetch(`${API_BASE}/beneficiaries?email=${encodeURIComponent(email)}`, {
          signal: controller.signal
        });
        clearTimeout(timeoutId);
        if (res.ok) {
          const json = await res.json();
          return json.data;
        }
      } catch (err) {}
    }

    const store = getBankData();
    return store.beneficiaries || [];
  },

  async deleteBeneficiary(id) {
    if (API_BASE) {
      try {
        const res = await fetch(`${API_BASE}/beneficiaries/${id}`, { method: 'DELETE' });
        if (res.ok) return await res.json();
      } catch (err) {}
    }

    const store = getBankData();
    store.beneficiaries = (store.beneficiaries || []).filter(b => b.id != id);
    saveBankData(store);
    return { success: true, message: 'Beneficiary removed' };
  },

  // Admin: Get Customer Directory
  async getAdminUsers() {
    if (API_BASE) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 2000);
        const res = await fetch(`${API_BASE}/admin/users`, { signal: controller.signal });
        clearTimeout(timeoutId);
        if (res.ok) {
          const json = await res.json();
          if (json.data && json.data.length > 0) return json.data;
        }
      } catch (err) {}
    }

    const store = getBankData();
    return (store.adminCustomers || []).map(u => ({
      userId: u.id || u.userId,
      fullName: u.name || u.fullName,
      email: u.email,
      accountNumber: u.accNo || u.accountNumber,
      accountType: u.type || u.accountType || 'SAVINGS',
      balance: parseFloat(u.balance) || 0,
      status: u.status || 'ACTIVE'
    }));
  },

  // Admin: Update Status (Active/Suspended)
  async updateUserStatus(userId, status) {
    if (API_BASE) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 2000);
        const res = await fetch(`${API_BASE}/admin/users/${userId}/status?status=${status}`, {
          method: 'PUT',
          signal: controller.signal
        });
        clearTimeout(timeoutId);
        if (res.ok) return await res.json();
      } catch (err) {}
    }

    const store = getBankData();
    const cust = (store.adminCustomers || []).find(u => (u.id == userId || u.userId == userId));
    if (cust) {
      cust.status = status;
      if (cust.accNo === store.customer.accountNumber) {
        store.customer.status = status;
      }
      saveBankData(store);
      return { success: true, message: `Status updated to ${status}` };
    }
    throw new Error('Customer record not found');
  },

  // Admin: Delete Customer Account (Enforce balance = 0 safety)
  async deleteCustomer(userId) {
    if (API_BASE) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 2000);
        const res = await fetch(`${API_BASE}/admin/users/${userId}`, {
          method: 'DELETE',
          signal: controller.signal
        });
        clearTimeout(timeoutId);
        if (res.ok) return await res.json();
        const errJson = await res.json();
        throw new Error(errJson.message || 'Deletion rejected');
      } catch (err) {
        if (err.message && err.message.includes('balance')) throw err;
      }
    }

    const store = getBankData();
    const idx = (store.adminCustomers || []).findIndex(u => (u.id == userId || u.userId == userId));
    if (idx === -1) throw new Error('Customer not found');

    const targetUser = store.adminCustomers[idx];
    const userBalance = parseFloat(targetUser.balance) || 0;
    if (userBalance > 0) {
      throw new Error(`Cannot delete account holding active balance of ${formatUSD(userBalance)}. All funds must be settled to $0.00 first.`);
    }

    store.adminCustomers.splice(idx, 1);
    saveBankData(store);
    return { success: true, message: 'Customer record successfully purged from database.' };
  },

  // Admin: Live System Statistics
  async getAdminStats() {
    if (API_BASE) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 2000);
        const res = await fetch(`${API_BASE}/admin/stats`, { signal: controller.signal });
        clearTimeout(timeoutId);
        if (res.ok) {
          const json = await res.json();
          if (json.data) return json.data;
        }
      } catch (err) {}
    }

    const store = getBankData();
    const list = store.adminCustomers || [];
    const totalUsers = list.length;
    const activeUsers = list.filter(u => u.status === 'ACTIVE').length;
    const inactiveUsers = list.filter(u => u.status !== 'ACTIVE').length;
    const totalLiquidity = list.reduce((sum, u) => sum + (parseFloat(u.balance) || 0), 0);

    return {
      totalUsers,
      activeUsers,
      inactiveUsers,
      totalLiquidity
    };
  }
};

window.BankAPI = BankAPI;
