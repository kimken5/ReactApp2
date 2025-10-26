import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';

// デスクトップアプリ
import { DesktopApp } from './desktop/DesktopApp';

function App() {
    return (
        <Router>
            <Routes>
                {/* デスクトップアプリ */}
                <Route path="/desktop/*" element={<DesktopApp />} />

                <Route path="/" element={
                    <div style={{padding: '20px', maxWidth: '800px', margin: '0 auto'}}>
                        <h1 style={{color: '#333', marginBottom: '30px'}}>保育園アプリ - デスクトップ管理画面</h1>

                        <div style={{marginBottom: '30px'}}>
                            <h2 style={{color: '#666', borderBottom: '2px solid #e0e0e0', paddingBottom: '10px'}}>💻 デスクトップ管理画面</h2>
                            <ul style={{listStyle: 'none', padding: 0}}>
                                <li style={{margin: '10px 0'}}><a href="/desktop/login" style={{color: '#7c3aed', textDecoration: 'none', fontSize: '16px', fontWeight: 'bold'}}>💻 デスクトップ管理ログイン</a></li>
                                <li style={{margin: '10px 0'}}><a href="/desktop/dashboard" style={{color: '#7c3aed', textDecoration: 'none', fontSize: '16px'}}>📊 管理ダッシュボード</a></li>
                                <li style={{margin: '10px 0'}}><a href="/desktop/classes" style={{color: '#7c3aed', textDecoration: 'none', fontSize: '16px'}}>👥 クラス管理</a></li>
                                <li style={{margin: '10px 0'}}><a href="/desktop/children" style={{color: '#7c3aed', textDecoration: 'none', fontSize: '16px'}}>👶 園児管理</a></li>
                                <li style={{margin: '10px 0'}}><a href="/desktop/parents" style={{color: '#7c3aed', textDecoration: 'none', fontSize: '16px'}}>👨‍👩‍👧 保護者管理</a></li>
                                <li style={{margin: '10px 0'}}><a href="/desktop/staff" style={{color: '#7c3aed', textDecoration: 'none', fontSize: '16px'}}>👩‍🏫 職員管理</a></li>
                                <li style={{margin: '10px 0'}}><a href="/desktop/dailyreports" style={{color: '#7c3aed', textDecoration: 'none', fontSize: '16px'}}>📋 日報管理</a></li>
                                <li style={{margin: '10px 0'}}><a href="/desktop/photos" style={{color: '#7c3aed', textDecoration: 'none', fontSize: '16px'}}>📸 写真管理</a></li>
                            </ul>
                        </div>

                        <div style={{backgroundColor: '#f3f4f6', padding: '15px', borderRadius: '8px', marginTop: '30px'}}>
                            <h3 style={{color: '#374151', margin: '0 0 10px 0'}}>📱 UIプレビューモード</h3>
                            <p style={{color: '#6b7280', margin: 0}}>
                                デスクトップ管理画面のUIを確認できます。<br/>
                                データベース接続なしで画面デザイン・レイアウトを確認してください。
                            </p>
                        </div>
                    </div>
                } />
            </Routes>
        </Router>
    );
}

export default App;
