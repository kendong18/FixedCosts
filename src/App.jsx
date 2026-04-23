import { useState, useMemo } from 'react';
import { Plus, Wallet, Calendar as CalendarIcon, MoreVertical, Trash2 } from 'lucide-react';
import { useLocalStorage } from './hooks/useLocalStorage';
import './App.css';

function App() {
  const [expenses, setExpenses] = useLocalStorage('fixed_costs_expenses', []);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [expenseToDelete, setExpenseToDelete] = useState(null);
  const [filterCategory, setFilterCategory] = useState('전체');
  
  // Form State
  const [formData, setFormData] = useState({
    id: null,
    name: '',
    amount: '',
    date: '1', // Day of the month
    category: '구독'
  });

  const categories = ['구독', '주거비', '공과금', '보험', '통신비', '기타'];

  const totalAmount = useMemo(() => {
    return expenses.reduce((sum, exp) => sum + Number(exp.amount), 0);
  }, [expenses]);

  const sortedExpenses = useMemo(() => {
    return [...expenses].sort((a, b) => Number(a.date) - Number(b.date));
  }, [expenses]);

  const filteredAndSortedExpenses = useMemo(() => {
    let filtered = expenses;
    if (filterCategory !== '전체') {
      filtered = expenses.filter(exp => exp.category === filterCategory);
    }
    return [...filtered].sort((a, b) => Number(a.date) - Number(b.date));
  }, [expenses, filterCategory]);

  const handleOpenModal = (expense = null) => {
    if (expense) {
      setFormData(expense);
    } else {
      setFormData({
        id: null,
        name: '',
        amount: '',
        date: '1',
        category: '구독'
      });
    }
    setIsModalOpen(true);
  };

  const handleSaveExpense = (e) => {
    e.preventDefault();
    if (!formData.name || !formData.amount) return;

    if (formData.id) {
      setExpenses(expenses.map(exp => exp.id === formData.id ? formData : exp));
    } else {
      setExpenses([...expenses, { ...formData, id: Date.now().toString() }]);
    }
    setIsModalOpen(false);
  };

  const handleDeleteClick = (e, id) => {
    e.stopPropagation();
    setExpenseToDelete(id);
  };

  const confirmDelete = () => {
    if (expenseToDelete) {
      setExpenses(expenses.filter(exp => exp.id !== expenseToDelete));
      setExpenseToDelete(null);
    }
  };



  const currentMonth = new Date().getMonth();
  const currentDay = new Date().getDate();

  return (
    <div className="app-container animate-fade-in">
      <header>
        <h1 className="text-gradient">나의 고정 지출</h1>
        <p className="text-muted" style={{ fontSize: '0.875rem', marginTop: '0.25rem' }}>매월 나가는 고정 비용을 한눈에 관리하세요</p>
      </header>

      <div className="dashboard-card glass-panel delay-1">
        <div className="dashboard-content">
          <p className="stat-label">이번 달 총 고정 지출</p>
          <div className="total-amount">
            <span className="currency">₩</span>
            {totalAmount.toLocaleString()}
          </div>
          
          <div className="stats-row">
            <div className="stat-item">
              <span className="stat-label">등록된 항목</span>
              <span className="stat-value">{expenses.length}개</span>
            </div>
            <div className="stat-item" style={{ alignItems: 'flex-end' }}>
              <span className="stat-label">다음 결제 예정</span>
              <span className="stat-value text-gradient">
                {sortedExpenses.find(e => Number(e.date) >= currentDay)?.name || '없음'}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="delay-2">
        <h2 className="section-title">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span>이번 달 지출 내역</span>
            <CalendarIcon size={20} className="text-muted" />
          </div>
          <select 
            value={filterCategory} 
            onChange={(e) => setFilterCategory(e.target.value)}
            style={{ width: 'auto', padding: '0.25rem 0.5rem', fontSize: '0.875rem', background: 'rgba(255,255,255,0.1)', border: 'none', borderRadius: 'var(--radius-sm)' }}
          >
            <option value="전체">전체 보기</option>
            {categories.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </h2>

        {expenses.length === 0 ? (
          <div className="empty-state glass-panel">
            <Wallet size={48} opacity={0.5} />
            <p>등록된 고정 지출이 없습니다.<br/>아래 + 버튼을 눌러 추가해 보세요.</p>
          </div>
        ) : (
          <div className="expense-list">
            {filteredAndSortedExpenses.map(expense => {
              const isDueSoon = Number(expense.date) >= currentDay && Number(expense.date) <= currentDay + 3;

              return (
                <div key={expense.id} className={`expense-item ${isDueSoon ? 'due-soon' : ''}`}>
                  <div className="expense-info">
                    <div className="expense-details" onClick={() => handleOpenModal(expense)}>
                      <h3>{expense.name} <span className="badge">{expense.category}</span></h3>
                      <p>매월 {expense.date}일 결제</p>
                    </div>
                  </div>
                  
                  <div className="expense-amount-area">
                    <div className="expense-amount">₩{Number(expense.amount).toLocaleString()}</div>
                    <button onClick={(e) => handleDeleteClick(e, expense.id)} className="btn-icon" style={{ width: 28, height: 28, padding: 4 }}>
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <button className="fab" onClick={() => handleOpenModal()}>
        <Plus size={28} />
      </button>

      {/* Modal Overlay */}
      {isModalOpen && (
        <div className="modal-overlay" onClick={(e) => { if(e.target.className === 'modal-overlay') setIsModalOpen(false) }}>
          <div className="modal-content">
            <h2 style={{ marginBottom: '1.5rem' }}>고정 지출 {formData.id ? '수정' : '추가'}</h2>
            
            <form onSubmit={handleSaveExpense}>
              <div className="form-group">
                <label>항목명 (예: 넷플릭스, 월세)</label>
                <input 
                  type="text" 
                  value={formData.name}
                  onChange={e => setFormData({...formData, name: e.target.value})}
                  required
                  placeholder="지출 항목 이름"
                />
              </div>

              <div className="form-group">
                <label>결제 금액 (원)</label>
                <input 
                  type="number" 
                  value={formData.amount}
                  onChange={e => setFormData({...formData, amount: e.target.value})}
                  required
                  placeholder="예: 10000"
                />
              </div>

              <div className="form-group" style={{ display: 'flex', gap: '1rem' }}>
                <div style={{ flex: 1 }}>
                  <label>결제일</label>
                  <select 
                    value={formData.date}
                    onChange={e => setFormData({...formData, date: e.target.value})}
                  >
                    {[...Array(31)].map((_, i) => (
                      <option key={i+1} value={i+1}>{i+1}일</option>
                    ))}
                  </select>
                </div>
                <div style={{ flex: 1 }}>
                  <label>카테고리</label>
                  <select 
                    value={formData.category}
                    onChange={e => setFormData({...formData, category: e.target.value})}
                  >
                    {categories.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
              </div>

              <div className="form-actions">
                <button type="button" className="btn btn-secondary" onClick={() => setIsModalOpen(false)}>취소</button>
                <button type="submit" className="btn btn-primary">저장</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {expenseToDelete && (
        <div className="modal-overlay" style={{ alignItems: 'center' }} onClick={(e) => { if(e.target.className.includes('modal-overlay')) setExpenseToDelete(null) }}>
          <div className="modal-content" style={{ borderRadius: 'var(--radius-lg)', animation: 'fadeIn 0.2s' }}>
            <h3 style={{ marginBottom: '1rem', textAlign: 'center' }}>정말 삭제하시겠습니까?</h3>
            <p style={{ textAlign: 'center', color: 'var(--text-secondary)', marginBottom: '1.5rem', fontSize: '0.875rem' }}>
              이 작업은 되돌릴 수 없습니다.
            </p>
            <div className="form-actions" style={{ marginTop: '1rem' }}>
              <button className="btn btn-secondary" onClick={() => setExpenseToDelete(null)}>취소</button>
              <button className="btn" style={{ background: 'var(--accent-danger)', color: 'white' }} onClick={confirmDelete}>삭제</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
