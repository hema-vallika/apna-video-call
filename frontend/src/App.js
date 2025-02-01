import './App.css';
import {BrowserRouter as Router,Routes,Route} from 'react-router-dom';
import LandingPage from './pages/landing';
import Authentication from './pages/authentication';
import { AuthProvider } from './contexts/AuthContext';
import VideomeetComponent from './pages/videoMeet.jsx';
import HomeComponent from './pages/home.jsx';
import History from './pages/history.jsx';

function App() {
  return (
    <>
    <Router>
    <AuthProvider>


      <Routes>
        <Route path="/" element={<LandingPage/>} />
        <Route path='/auth' element={<Authentication/>}/>
        <Route path='/home' element={<HomeComponent/>}/>
        <Route path='/history' element={<History/>}/>
        <Route path='/:url' element={<VideomeetComponent/>}/>
      </Routes>
      </AuthProvider>
    </Router>
    </>
    
  );
}

export default App;
