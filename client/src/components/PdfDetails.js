import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useParams } from 'react-router';
import './PdfDetails.scss';
import socketIOClient from 'socket.io-client';

const socket = socketIOClient('https://pdf-management-mpoo.onrender.com');

const PdfDetails = () => {
  const { id } = useParams();
  const [pdf, setPdf] = useState(null);
  const [loading, setLoading] = useState(true);
  const [pdfUrl, setPdfUrl] = useState(null);
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [sharedWith, setSharedWith] = useState([]);
  const [uploadedByUser, setUploadedByUser] = useState(false);
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [shareToAll, setShareToAll] = useState(false);
  const [sharableLink, setSharableLink] = useState('');

  const getPdfDetails = async () => {
    try {
      const response = await axios.get(`/pdfs/${id}`);
      setPdf(response.data);
      setLoading(false);

      // Check if the user is authorized to view the PDF
      const currentUser = localStorage.getItem('username');
      const { sharedWith, open } = response.data;
      const uploadedByUser = response.data.uploadedBy === currentUser;
      setUploadedByUser(uploadedByUser);
      const sharedWithUser = sharedWith.includes(currentUser);
      setIsAuthorized(uploadedByUser || sharedWithUser || (open && currentUser));
      setSharedWith(sharedWith);

      // Set the initial shareToAll state based on PDF open status
      setShareToAll(open);

      // Generate sharable link
      const baseUrl = window.location.origin;
      const link = `${baseUrl}/pdfs/${id}`;
      setSharableLink(link);
    } catch (error) {
      console.error(error);
      setLoading(false);
    }
  };
  useEffect(() => {
    

    getPdfDetails();
  }, [id]);

  useEffect(() => {
    socket.on('newComment', (data) => {
      // Handle the new comment event
      getPdfDetails();
      // console.log('New comment:', data.comment);
    });

    
  }, []);


  useEffect(() => {
    if (pdf && isAuthorized) {
      const getPdfUrl = async () => {
        try {
          const response = await axios.get(`/pdfs/${id}/file`, {
            responseType: 'blob',
          });
          const url = URL.createObjectURL(response.data);
          setPdfUrl(url);
        } catch (error) {
          console.error(error);
        }
      };

      getPdfUrl();
    }
  }, [id, pdf, isAuthorized]);

  const handleSharePdf = async () => {
    const sharedWithUser = prompt('Enter username to share the PDF with:');
    if (sharedWithUser) {
      try {
        await axios.post(`/pdfs/${id}/share`, { sharedWith: sharedWithUser });
        setSharedWith((prevSharedWith) => [...prevSharedWith, sharedWithUser]);
        alert('PDF shared successfully');
      } catch (error) {
        console.error(error);
        alert('Failed to share PDF');
      }
    }
  };

  const handleShareWithAll = async () => {
    try {
      const updatedStatus = !shareToAll;
      await axios.put(`/pdfs/${id}`, { open: updatedStatus });
      setShareToAll(updatedStatus);
      if (updatedStatus) {
        setSharableLink(`${window.location.origin}/pdfs/${id}`);
      } else {
        setSharableLink('');
      }
      alert(updatedStatus ? 'PDF shared with all' : 'PDF sharing with all turned off');
    } catch (error) {
      console.error(error);
      alert('Failed to share PDF with all');
    }
  };

  const handleAddComment = async () => {
    const currentUser = localStorage.getItem('username');
    if (newComment.trim() === '') {
      return;
    }

    try {
      const response = await axios.post(`/pdfs/${id}/comments`, {
        username: currentUser,
        comment: newComment,
      });
      setComments((prevComments) => [...prevComments, response.data]);
      setNewComment('');
    } catch (error) {
      console.error(error);
      alert('Failed to add comment');
    }
  };

  if (loading) {
    return <div className="pdf-details-container">Loading...</div>;
  }

  if (!isAuthorized) {
    return <div className="pdf-details-container">You don't have permission to view this PDF.</div>;
  }

  if (!pdf) {
    return <div className="pdf-details-container">PDF not found</div>;
  }

  return (
    <div className="pdf-details-container">
      {uploadedByUser && (
        <div className="share-pdf-section">
          <button onClick={handleSharePdf} className="share-pdf-button">
            Share PDF
          </button>
          <div className="share-to-all-section">
            <input
              type="checkbox"
              id="shareToAllToggle"
              checked={shareToAll}
              onChange={handleShareWithAll}
            />
            <label htmlFor="shareToAllToggle" className="share-to-all-label">
              Share with All
            </label>
            {shareToAll && (
              <div className="sharable-link-section">
                <div className="sharable-link-label">Sharable Link:</div>
                <div className="sharable-link">
                  {sharableLink ? (
                    <>
                      <input type="text" value={sharableLink} readOnly className="sharable-link-input" />
                      <button
                        onClick={() => navigator.clipboard.writeText(sharableLink)}
                        className="copy-icon"
                      >
                        Copy
                      </button>
                    </>
                  ) : (
                    <div>No sharable link available</div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      <h2 className="pdf-title">{pdf.filename}</h2>

      <div className="pdf-viewer">
        {pdfUrl && <embed src={pdfUrl} type="application/pdf" width="100%" height="600px" />}
      </div>

      <div className="comments-section">
        <h3>Comments</h3>
        {pdf.comments.length === 0 ? (
          <p>No comments available</p>
        ) : (
          <ul className="comment-list">
            {pdf.comments.map((comment) => (
              <li key={comment._id} className="comment">
                <strong className="comment-username">{comment.username}</strong>: {comment.comment}
              </li>
            ))}
          </ul>
        )}

        <div className="add-comment-section">
          <input
            type="text"
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="Add a comment..."
            className="comment-input"
          />
          <button onClick={handleAddComment} className="comment-button">
            Add Comment
          </button>
        </div>
      </div>
    </div>
  );
};

export default PdfDetails;
