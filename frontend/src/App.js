import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import Login from './Login';
import IssueBook from './/IssueBook';
import ReturnBook from './ReturnBook';
import CheckBookAvailability from './CheckBookAvailability';

const App = () => {
    const [role, setRole] = useState(localStorage.getItem('role') || '');

    const handleLogout = () => {
        localStorage.clear();
        setRole('');
    };

    return (
        <Router>
            <div>
                <nav>
                    {role && (
                        <>
                            <Link to="/">Check Availability</Link>
                            {role === 'Admin' && <Link to="/issue">Issue Book</Link>}
                            <Link to="/return">Return Book</Link>
                            <button onClick={handleLogout}>Logout</button>
                        </>
                    )}
                </nav>
                <Routes>
                    {!role && <Route path="/" element={<Login onLogin={setRole} />} />}
                    {role && <Route path="/" element={<CheckBookAvailability />} />}
                    {role === 'Admin' && <Route path="/issue" element={<IssueBook />} />}
                    <Route path="/return" element={<ReturnBook />} />
                </Routes>
            </div>
        </Router>
    );
};

export default App;
