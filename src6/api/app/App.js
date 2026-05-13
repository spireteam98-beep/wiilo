import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import Profile from './pages/Profile';
import Home from './pages/Home';
import SinglePost from './pages/SinglePost';
import Navbar from './components/Navbar';
import Podcast from './components/Podcast';
import TopUp from './pages/TopUp';  // Import the TopUp page
import TopUpComplete from './pages/TopUpComplete'; // Import the TopUpComplete page
import { AuthProvider, useAuth } from './firebase';

function App() {
  return (
    <AuthProvider>
      <Router>
        <Navbar />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
          <Route path="/Podcast" element={<ProtectedRoute><Podcast /></ProtectedRoute>} />
         
		 <Route path="/top-up" element={<ProtectedRoute><TopUp /></ProtectedRoute>} />
          <Route path="/topup-complete" element={<ProtectedRoute><TopUpComplete /></ProtectedRoute>} />
          <Route path="/post/:slug" element={<SinglePost />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

// ProtectedRoute to ensure user is authenticated before accessing certain pages
const ProtectedRoute = ({ children }) => {
  const { user } = useAuth();
  
  if (!user) {
    return <Navigate to="/" />; // Redirect to Home if user is not authenticated
  }

  return children;
};

export default App;
