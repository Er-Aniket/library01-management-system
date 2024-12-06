import React, { useState } from 'react';
import axios from 'axios';

const CheckBookAvailability = () => {
    const [bookId, setBookId] = useState('');
    const [availability, setAvailability] = useState(null);

    const checkAvailability = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await axios.get(`http://localhost:5000/books/${bookId}/availability`, {
                headers: { Authorization: token }
            });
            setAvailability(response.data.available ? 'Available' : 'Not Available');
        } catch (error) {
            alert('Error checking availability: ' + error.message);
        }
    };

    return (
        <div>
            <h1>Check Book Availability</h1>
            <input type="text" placeholder="Book ID" value={bookId} onChange={(e) => setBookId(e.target.value)} />
            <button onClick={checkAvailability}>Check</button>
            {availability && <p>Book is {availability}</p>}
        </div>
    );
};

export default CheckBookAvailability;
