import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import './Home.scss'; 

const Home = () => {
  const [ownedPdfs, setOwnedPdfs] = useState([]);
  const [sharedPdfs, setSharedPdfs] = useState([]);
  const [userName, setUserName] = useState(localStorage.getItem('username'));


  useEffect(() => {
    fetchPdfs();
  }, [userName]);

  const fetchPdfs = async () => {
    try {
      const response = await axios.get('/pdfs');
      const allPdfs = response.data;
      setOwnedPdfs(allPdfs.filter((pdf) => pdf.uploadedBy === userName));
      setSharedPdfs(allPdfs.filter((pdf) => pdf.sharedWith.includes(userName)));
    } catch (error) {
      console.error(error);
      alert('Failed to fetch PDFs');
    }
  };

  return (
    <div className="home-container">
      <h2>Uploaded PDFs</h2>
      <div className="pdf-list">
        <div className="pdf-category">
          <h3>Owned PDFs</h3>
          {ownedPdfs.length === 0 ? (
            <p>No owned PDFs available</p>
          ) : (
            <ul>
              {ownedPdfs.map((pdf) => (
                <li key={pdf._id}>
                  <Link to={`/pdfs/${pdf._id}`}>{pdf.filename}</Link>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="pdf-category">
          <h3>Shared With You</h3>
          {sharedPdfs.length === 0 ? (
            <p>No shared PDFs available</p>
          ) : (
            <ul>
              {sharedPdfs.map((pdf) => (
                <li key={pdf._id}>
                  <Link to={`/pdfs/${pdf._id}`}>{pdf.filename}</Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <Link to="/upload" className="button">
        Upload PDF
      </Link>
    </div>
  );
};

export default Home;
