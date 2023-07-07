import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import axios from 'axios';
import SignUp from './components/SignUp';
import Login from './components/Login';
import UploadPdf from './components/UploadPdf';
import PdfDetails from './components/PdfDetails';
import Home from './components/Home';
import './App.scss';
const App = () => {
  const [loggedIn, setLoggedIn] = useState(false);

  useEffect(()=>{
    if(localStorage.getItem('username'))setLoggedIn(true);
  },[])
  const handleLogin = () => {
    setLoggedIn(true);
  };

  const handleLogout = () => {
    localStorage.clear();
    setLoggedIn(false);
  };

  axios.defaults.baseURL = 'https://pdf-management-mpoo.onrender.com';
  axios.defaults.headers.common['Authorization'] = `Bearer ${localStorage.getItem('token')}`;

  return (
    <Router>
      <div>
       <div className='header'> <h1 onClick={e=>window.location.href="/"}>PDF Management App</h1> {loggedIn && (
          <button onClick={handleLogout} className="button">
            Logout
          </button>
        )} </div>
        <Routes>
          <Route path="/" element={loggedIn ? <Home /> : <SignUpLoginContainer onLogin={handleLogin} />} />
          <Route path="/upload" element={loggedIn ? <UploadPdf /> : <SignUpLoginContainer onLogin={handleLogin} />} />
          <Route path="/pdfs/:id" element={loggedIn ? <PdfDetails /> : <SignUpLoginContainer onLogin={handleLogin} />} />
        </Routes>
       
      </div>
    </Router>
  );
};

const SignUpLoginContainer = ({ onLogin }) => (
  <div style={{display:"flex",justifyContent:'center',flexDirection:'column',alignItems:"center"}}>
    <SignUp />
    <Login onLogin={onLogin} />
  </div>
);

export default App;
