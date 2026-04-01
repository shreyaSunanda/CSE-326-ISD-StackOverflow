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
              
              <h1 
                onClick={() => setCurrentPage('feed')} 
                style={{ cursor: 'pointer' }}
              >
                Mini Stack Overflow
              </h1>
              <div className="user-actions">
                <span className="user-name">Hi, {user?.username || user?.name}</span>
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