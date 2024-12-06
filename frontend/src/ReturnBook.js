import React, { useState } from 'react';
import axios from 'axios';

const ReturnBook = () => {
    const [formData, setFormData] = useState({
        transaction_id: '',
        actual_return_date: ''
    });
    const [fine, setFine] = useState(null);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData({ ...formData, [name]: value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const token = localStorage.getItem('token');
            const response = await axios.post('http://localhost:5000/transactions/return', formData, {
                headers: { Authorization: token }
            });
            setFine(response.data.fine);
            alert('Book returned successfully');
        } catch (error) {
            alert('Error returning book: ' + error.message);
        }
    };

    return (
        <div>
            <h1>Return a Book</h1>
            <form onSubmit={handleSubmit}>
                <input type="text" name="transaction_id" placeholder="Transaction ID" onChange={handleChange} required />
                <input type="date" name="actual_return_date" onChange={handleChange} required />
                <button type="submit">Return Book</button>
            </form>
            {fine !== null && <p>Fine: ${fine}</p>}
        </div>
    );
};

export default ReturnBook;
