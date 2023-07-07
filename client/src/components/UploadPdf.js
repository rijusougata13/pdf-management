import React, { useEffect, useState } from 'react';
import axios from 'axios';
import './UploadPdf.scss';

const UploadPdf = () => {
  const [selectedFile, setSelectedFile] = useState(null);
  const [userName, setUserName] = useState(null);

  const handleFileChange = (event) => {
    setSelectedFile(event.target.files[0]);
  };

  useEffect(() => {
    setUserName(localStorage.getItem('username'));
  }, []);

  const handleUpload = async (e) => {
    e.preventDefault();

    // upload only pdf
    if (selectedFile.type !== 'application/pdf') {
      alert('Please upload a PDF');
      return;
    }
    try {
      const formData = new FormData();
      formData.append('pdf', selectedFile);
      formData.append('username', userName);
      await axios.post('/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      alert('PDF uploaded successfully');
      window.history.back();
    } catch (error) {
      console.error(error);
      alert('Failed to upload PDF');
    }
  };

  return (
    <div className="upload-pdf">
      <h2>Upload PDF</h2>
      <form onSubmit={handleUpload}>
        <input type="file" onChange={handleFileChange} required />
        <button type="submit">Upload</button>
      </form>
    </div>
  );
};

export default UploadPdf;
