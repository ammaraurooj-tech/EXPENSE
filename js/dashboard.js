
// Dashboard logic: store transactions in localStorage per user
function getCurrentUser(){
  return localStorage.getItem('et_current') || null;
}
function getTxns(){
  const user = getCurrentUser();
  if(!user) return [];
  return JSON.parse(localStorage.getItem('et_txns_' + user) || '[]');
}
function saveTxns(txns){
  const user = getCurrentUser();
  if(!user) return;
  localStorage.setItem('et_txns_' + user, JSON.stringify(txns));
}
function formatMoney(v){ return '$' + Number(v).toFixed(2); }

document.addEventListener('DOMContentLoaded', ()=>{
  // redirect to login if no user
  const user = getCurrentUser();
  if(!user){
    alert('Please login to access dashboard. Use demo@user.com / demo123 for quick demo.');
    window.location.href = 'login.html';
    return;
  }

  const totalIncomeEl = document.getElementById('totalIncome');
  const totalExpenseEl = document.getElementById('totalExpense');
  const balanceEl = document.getElementById('balance');
  const txnForm = document.getElementById('txnForm');
  const txnTableBody = document.querySelector('#txnTable tbody');

  function render(){
    const txns = getTxns();
    // totals
    const income = txns.filter(t=>t.type==='income').reduce((s,t)=>s+Number(t.amount),0);
    const expense = txns.filter(t=>t.type==='expense').reduce((s,t)=>s+Number(t.amount),0);
    const balance = income - expense;
    
    totalIncomeEl.textContent = formatMoney(income);
    totalExpenseEl.textContent = formatMoney(expense);
    balanceEl.textContent = formatMoney(balance);

    // Update card colors based on balance
    const balanceCard = document.querySelector('.balance-card');
    if (balanceCard) {
      if (balance > 0) {
        balanceCard.classList.add('positive-balance');
        balanceCard.classList.remove('negative-balance');
      } else if (balance < 0) {
        balanceCard.classList.add('negative-balance');
        balanceCard.classList.remove('positive-balance');
      } else {
        balanceCard.classList.remove('positive-balance', 'negative-balance');
      }
    }

    // table
    txnTableBody.innerHTML = '';
    
    if (txns.length === 0) {
      // Show empty state
      const emptyRow = document.createElement('tr');
      emptyRow.className = 'empty-state';
      emptyRow.innerHTML = `
        <td colspan="6" class="empty-message">
          <div class="empty-icon">📊</div>
          <p>No transactions yet</p>
          <small>Add your first transaction to get started</small>
        </td>
      `;
      txnTableBody.appendChild(emptyRow);
    } else {
      // Show transactions
      txns.slice().reverse().forEach((t, idx)=>{
        const tr = document.createElement('tr');
        const typeIcon = t.type === 'income' ? '💰' : '💸';
        const amountClass = t.type === 'income' ? 'amount-income' : 'amount-expense';
        tr.innerHTML = `
          <td>${t.date}</td>
          <td>${t.category}</td>
          <td><span class="type-badge">${typeIcon} ${t.type}</span></td>
          <td class="${amountClass}">${t.type === 'income' ? '+' : '-'}${formatMoney(t.amount)}</td>
          <td>${t.desc||'-'}</td>
          <td><button class="del-btn" data-i="${idx}">Delete</button></td>
        `;
        txnTableBody.appendChild(tr);
      });
    }

    // charts
    renderCharts(txns);
  }

  function renderCharts(txns){
    // pie: expense by category
    const expenseTxns = txns.filter(t=>t.type==='expense');
    const catMap = {};
    expenseTxns.forEach(t=>{
      catMap[t.category] = (catMap[t.category]||0) + Number(t.amount);
    });
    const labels = Object.keys(catMap);
    const data = Object.values(catMap);

    if(window.pieChartInstance) window.pieChartInstance.destroy();
    const pieCtx = document.getElementById('pieChart').getContext('2d');
    window.pieChartInstance = new Chart(pieCtx, {
      type: 'pie',
      data: { labels: labels, datasets:[{data: data}] },
      options:{maintainAspectRatio: false}
    });

    // bar: monthly totals
    const monthly = {};
    txns.forEach(t=>{
      const m = t.date.slice(0,7);
      monthly[m] = (monthly[m]||0) + (t.type==='income'? Number(t.amount): -Number(t.amount));
    });
    const months = Object.keys(monthly).sort();
    const mdata = months.map(m=>monthly[m]);

    if(window.barChartInstance) window.barChartInstance.destroy();
    const barCtx = document.getElementById('barChart').getContext('2d');
    window.barChartInstance = new Chart(barCtx, {
      type: 'bar',
      data: { labels: months, datasets:[{label:'Net', data:mdata}] },
      options:{maintainAspectRatio:false}
    });
  }

  txnForm.addEventListener('submit', (e)=>{
    e.preventDefault();
    const amount = document.getElementById('txnAmount').value;
    const type = document.getElementById('txnType').value;
    const category = document.getElementById('txnCategory').value.trim() || 'Other';
    const date = document.getElementById('txnDate').value;
    const desc = document.getElementById('txnDesc').value.trim();
    
    if(!amount || !date){ 
      alert('Please enter required fields'); 
      return; 
    }
    
    const txns = getTxns();
    txns.push({amount:Number(amount), type, category, date, desc});
    saveTxns(txns);
    txnForm.reset();
    
    // Set today's date as default
    document.getElementById('txnDate').value = new Date().toISOString().slice(0,10);
    
    render();
    
    // Show success message
    const submitBtn = txnForm.querySelector('button[type="submit"]');
    const originalText = submitBtn.innerHTML;
    submitBtn.innerHTML = '✓ Added!';
    submitBtn.style.background = 'var(--secondary)';
    setTimeout(() => {
      submitBtn.innerHTML = originalText;
      submitBtn.style.background = '';
    }, 2000);
  });

  // delete handler
  document.querySelector('#txnTable').addEventListener('click', (e)=>{
    if(e.target.matches('.del-btn')){
      const i = parseInt(e.target.getAttribute('data-i'));
      // delete latest reversed index mapping
      const txns = getTxns();
      const idx = txns.length - 1 - i;
      txns.splice(idx,1);
      saveTxns(txns);
      render();
    }
  });

  // logout link
  const logoutLink = document.getElementById('logoutLink');
  if(logoutLink) logoutLink.addEventListener('click', (e)=>{
    e.preventDefault();
    localStorage.removeItem('et_current');
    window.location.href = 'index.html';
  });
  
  // Set default date to today
  document.getElementById('txnDate').value = new Date().toISOString().slice(0,10);
  
  // Export functionality
  const exportBtn = document.getElementById('exportBtn');
  if(exportBtn) {
    exportBtn.addEventListener('click', () => {
      const txns = getTxns();
      if(txns.length === 0) {
        alert('No transactions to export');
        return;
      }
      
      const csvContent = 'Date,Type,Category,Amount,Description\n' + 
        txns.map(t => `${t.date},${t.type},${t.category},${t.amount},${t.desc || ''}`).join('\n');
      
      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `expenses_${new Date().toISOString().slice(0,10)}.csv`;
      a.click();
      window.URL.revokeObjectURL(url);
    });
  }

  // Dashboard starts with empty data - no sample data loaded
  // Set default date to today when page loads
  document.getElementById('txnDate').value = new Date().toISOString().slice(0,10);

  render();
});
