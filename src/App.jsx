import { useState, useMemo, useEffect } from 'react';
import { Plus, Wallet, Calendar as CalendarIcon, MoreVertical, Trash2, Settings, Sun, Moon } from 'lucide-react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';
import { useLocalStorage } from './hooks/useLocalStorage';
import './App.css';

const CATEGORY_COLORS = {
  '구독': '#3b82f6', // Blue
  '주거비': '#8b5cf6', // Purple
  '공과금': '#10b981', // Green
  '보험': '#f59e0b', // Amber
  '통신비': '#ec4899', // Pink
  '기타': '#64748b'  // Slate
};

const CustomTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    return (
      <div style={{
        background: 'var(--bg-secondary)',
        border: '1px solid var(--border-color)',
        padding: '0.5rem 0.75rem',
        borderRadius: 'var(--radius-md)',
        boxShadow: 'var(--shadow-lg)',
        color: 'var(--text-primary)',
        fontSize: '0.875rem',
        zIndex: 100
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <div style={{ width: 8, height: 8, borderRadius: '50%', background: payload[0].payload.fill || CATEGORY_COLORS[payload[0].name] }} />
          <span style={{ fontWeight: 600 }}>{payload[0].name}</span>
        </div>
        <div style={{ marginTop: '0.25rem', paddingLeft: '1rem', color: 'var(--text-secondary)' }}>
          ₩{payload[0].value.toLocaleString()}
        </div>
      </div>
    );
  }
  return null;
};

function App() {
  const [expenses, setExpenses] = useLocalStorage('fixed_costs_expenses', []);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [expenseToDelete, setExpenseToDelete] = useState(null);
  const [filterCategory, setFilterCategory] = useState('전체');
  const [sortOption, setSortOption] = useState('결제일 빠른 순');
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isDarkMode, setIsDarkMode] = useLocalStorage('fixed_costs_theme_dark', true);

  useEffect(() => {
    if (isDarkMode) {
      document.body.classList.remove('light-mode');
    } else {
      document.body.classList.add('light-mode');
    }
  }, [isDarkMode]);
  
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
    return [...filtered].sort((a, b) => {
      if (sortOption === '결제일 빠른 순') return Number(a.date) - Number(b.date);
      if (sortOption === '결제일 늦은 순') return Number(b.date) - Number(a.date);
      if (sortOption === '금액 높은 순') return Number(b.amount) - Number(a.amount);
      if (sortOption === '금액 낮은 순') return Number(a.amount) - Number(b.amount);
      if (sortOption === '이름순') return a.name.localeCompare(b.name);
      return 0;
    });
  }, [expenses, filterCategory, sortOption]);

  const chartData = useMemo(() => {
    const totals = {};
    expenses.forEach(exp => {
      totals[exp.category] = (totals[exp.category] || 0) + Number(exp.amount);
    });
    return Object.entries(totals)
      .filter(([, amount]) => amount > 0)
      .sort((a, b) => b[1] - a[1])
      .map(([name, value]) => ({ name, value }));
  }, [expenses]);

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

  const handleExportData = () => {
    const dataStr = JSON.stringify(expenses, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    const exportFileDefaultName = 'fixed_costs_backup.json';
    
    let linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  };

  const handleImportData = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const fileReader = new FileReader();
    fileReader.readAsText(file, "UTF-8");
    fileReader.onload = e => {
      try {
        const importedData = JSON.parse(e.target.result);
        if (Array.isArray(importedData)) {
          if (window.confirm('기존 데이터가 덮어씌워집니다. 계속하시겠습니까?')) {
            setExpenses(importedData);
            setIsSettingsOpen(false);
            alert('데이터를 성공적으로 불러왔습니다!');
          }
        } else {
          alert('잘못된 형태의 백업 파일입니다.');
        }
      } catch (error) {
        alert('파일을 읽는 중 오류가 발생했습니다.');
      }
    };
  };

  const currentMonth = new Date().getMonth();
  const currentDay = new Date().getDate();

  return (
    <>
      <div className="app-container animate-fade-in">
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1 className="text-gradient">나의 고정 지출</h1>
          <p className="text-muted" style={{ fontSize: '0.875rem', marginTop: '0.25rem' }}>매월 나가는 고정 비용을 한눈에 관리하세요</p>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          <button className="btn-icon" style={{ background: 'linear-gradient(135deg, var(--accent-primary), var(--accent-secondary))', color: 'white', border: 'none', boxShadow: 'var(--shadow-md)' }} onClick={() => handleOpenModal()}>
            <Plus size={20} />
          </button>
          <button className="btn-icon" style={{ background: 'transparent', border: 'none' }} onClick={() => setIsDarkMode(!isDarkMode)}>
            {isDarkMode ? <Sun size={24} color="var(--text-secondary)" /> : <Moon size={24} color="var(--text-secondary)" />}
          </button>
          <button className="btn-icon" style={{ background: 'transparent', border: 'none' }} onClick={() => setIsSettingsOpen(true)}>
            <Settings size={24} color="var(--text-secondary)" />
          </button>
        </div>
      </header>

      <div className="dashboard-card glass-panel delay-1">
        <div className="dashboard-content" style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <div style={{ flex: 1 }}>
            <p className="stat-label">이번 달 총 고정 지출</p>
            <div className="total-amount">
              <span className="currency">₩</span>
              {totalAmount.toLocaleString()}
            </div>
            
            <div className="stats-row" style={{ borderTop: 'none', marginTop: '0.5rem', paddingTop: '0' }}>
              <div className="stat-item">
                <span className="stat-label">항목</span>
                <span className="stat-value">{expenses.length}개</span>
              </div>
              <div className="stat-item" style={{ alignItems: 'flex-end' }}>
                <span className="stat-label">다음 결제</span>
                <span className="stat-value text-gradient">
                  {sortedExpenses.find(e => Number(e.date) >= currentDay)?.name || '없음'}
                </span>
              </div>
            </div>
          </div>

          {totalAmount > 0 && (
            <div style={{ width: '110px', height: '110px', position: 'relative', flexShrink: 0 }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Tooltip content={<CustomTooltip />} cursor={{ fill: 'transparent' }} />
                  <Pie
                    data={chartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={36}
                    outerRadius={50}
                    paddingAngle={4}
                    dataKey="value"
                    stroke="none"
                    isAnimationActive={true}
                    animationDuration={800}
                    animationEasing="ease-out"
                  >
                    {chartData.map((entry, index) => (
                      <Cell 
                        key={`cell-${index}`} 
                        fill={CATEGORY_COLORS[entry.name] || '#ccc'} 
                        style={{ outline: 'none' }}
                      />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </div>

      <div className="delay-2">
        <h2 className="section-title">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span>이번 달 지출 내역</span>
            <CalendarIcon size={20} className="text-muted" />
          </div>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <select 
              value={sortOption} 
              onChange={(e) => setSortOption(e.target.value)}
              style={{ width: 'auto', padding: '0.25rem 0.5rem', fontSize: '0.875rem', background: 'rgba(255,255,255,0.1)', border: 'none', borderRadius: 'var(--radius-sm)' }}
            >
              <option value="결제일 빠른 순">결제일 빠른 순</option>
              <option value="결제일 늦은 순">결제일 늦은 순</option>
              <option value="금액 높은 순">금액 높은 순</option>
              <option value="금액 낮은 순">금액 낮은 순</option>
              <option value="이름순">이름순</option>
            </select>
            <select 
              value={filterCategory} 
              onChange={(e) => setFilterCategory(e.target.value)}
              style={{ width: 'auto', padding: '0.25rem 0.5rem', fontSize: '0.875rem', background: 'rgba(255,255,255,0.1)', border: 'none', borderRadius: 'var(--radius-sm)' }}
            >
              <option value="전체">전체 보기</option>
              {categories.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
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
                      <h3>
                        {expense.name} 
                        <span className="badge" style={{ marginLeft: '0.5rem', backgroundColor: CATEGORY_COLORS[expense.category] || 'rgba(255,255,255,0.1)', color: 'white', border: 'none' }}>
                          {expense.category}
                        </span>
                      </h3>
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
    </div>

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

      {/* Settings Modal */}
      {isSettingsOpen && (
        <div className="modal-overlay" onClick={(e) => { if(e.target.className === 'modal-overlay') setIsSettingsOpen(false) }}>
          <div className="modal-content">
            <h2 style={{ marginBottom: '1.5rem' }}>설정 및 백업</h2>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div className="glass-panel" style={{ padding: '1rem' }}>
                <h3 style={{ marginBottom: '0.5rem', fontSize: '1rem' }}>데이터 내보내기</h3>
                <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '1rem' }}>
                  현재 지출 내역을 파일로 저장하여 백업합니다.
                </p>
                <button className="btn btn-primary" style={{ width: '100%' }} onClick={handleExportData}>
                  백업 파일 다운로드
                </button>
              </div>

              <div className="glass-panel" style={{ padding: '1rem' }}>
                <h3 style={{ marginBottom: '0.5rem', fontSize: '1rem' }}>데이터 불러오기</h3>
                <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '1rem' }}>
                  저장해둔 백업 파일을 불러와 복원합니다. (기존 데이터 덮어쓰기)
                </p>
                <input 
                  type="file" 
                  accept=".json" 
                  id="import-file" 
                  style={{ display: 'none' }} 
                  onChange={handleImportData} 
                />
                <button 
                  className="btn btn-secondary" 
                  style={{ width: '100%' }} 
                  onClick={() => document.getElementById('import-file').click()}
                >
                  백업 파일 선택
                </button>
              </div>
            </div>

            <div className="form-actions" style={{ marginTop: '2rem' }}>
              <button type="button" className="btn btn-secondary" onClick={() => setIsSettingsOpen(false)}>닫기</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default App;
