// import React from "react";
// import QuestionList from "./components/QuestionList";

// function App() {
//   return (
//     <div className="App">
//       <h1>Mini Stack Overflow</h1>
//       <QuestionList />
//     </div>
//   );
// }

// export default App;

import React, { useState, useEffect } from "react";
import Feed from "./components/Feed";
import Auth from "./components/Auth";
import AskQuestion from "./components/AskQuestion"; 
import "./App.css";

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user, setUser] = useState(null); 
  const [currentPage, setCurrentPage] = useState('feed');

  
  useEffect(() => {
    const token = localStorage.getItem("token");
    const savedUser = localStorage.getItem("user");
    
    if (token && savedUser) {
      setIsLoggedIn(true);
      setUser(JSON.parse(savedUser));
    }
  }, []);

  const handleLoginSuccess = (userData) => {
    setIsLoggedIn(true);
    
    if (userData) {
      setUser(userData);
      localStorage.setItem("user", JSON.stringify(userData));
    } else {
      
      const savedUser = JSON.parse(localStorage.getItem("user"));
      setUser(savedUser);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setIsLoggedIn(false);
    setUser(null);
    setCurrentPage('feed');
  };

  return (
    <div className="App">
      {!isLoggedIn ? (
        <Auth onLoginSuccess={handleLoginSuccess} />
      ) : (
        <>
        <header className="app-header">
            <div className="header-container">
              
              {/* Logo Section */}
              <div className="logo-section" onClick={() => setCurrentPage('feed')}>
                <svg aria-hidden="true" width="32" height="37" viewBox="0 0 32 37">
                  <path d="M26 33v-9h4v13H0V24h4v9h22Z" fill="#BCBBBB"/>
                  <path d="m21.5 0-2.7 2 9.9 13.3 2.7-2L21.5 0ZM26 18.4 13.3 7.8l2.1-2.5 12.7 10.6-2.1 2.5ZM9.1 15.2l15 7 1.4-3-15-7-1.4 3Zm14 10.79.68-2.95-16.1-3.35L7 23l16.1 2.99ZM23 30H7v-3h16v3Z" fill="#F48024"/>
                </svg>
                <h1>Stack Overflow</h1>
              </div>


              {/* User Actions */}
              <div className="user-actions">
                <div className="user-avatar">
                  {(user?.username || user?.name || 'U').charAt(0).toUpperCase()}
                </div>
                <button onClick={handleLogout} className="logout-btn">
                  Logout
                </button>
              </div>

            </div>
          </header>
          <main className="app-main">
            
            {currentPage === 'feed' ? (
              <Feed onAskQuestionClick={() => setCurrentPage('ask')} />
            ) : (
              <AskQuestion 
                user={user} 
                onCancel={() => setCurrentPage('feed')} 
                onSuccess={() => setCurrentPage('feed')} 
              />
            )}
          </main>
        </>
      )}
    </div>
  );
}

export default App;