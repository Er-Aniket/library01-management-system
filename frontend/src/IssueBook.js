import React, { useState } from 'react';
import axios from 'axios';

const IssueBook = () => {
    const [formData, setFormData] = useState({
        book_id: '',
        user_id: '',
        issue_date: '',
        return_date: '',
        remarks: ''
    });

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData({ ...formData, [name]: value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        try {
            const token = localStorage.getItem('token');
            await axios.post('http://localhost:5000/transactions/issue', formData, {
                headers: { Authorization: token }
            });
            alert('Book issued successfully');
        } catch (error) {
            alert('Error issuing book: ' + error.message);
        }
    };

    return (
        <div>
            <h1>Issue a Book</h1>
            <form onSubmit={handleSubmit}>
                <input type="text" name="book_id" placeholder="Book ID" onChange={handleChange} required />
                <input type="text" name="user_id" placeholder="User ID" onChange={handleChange} required />
                <input type="date" name="issue_date" onChange={handleChange} required />
                <input type="date" name="return_date" onChange={handleChange} />
                <textarea name="remarks" placeholder="Remarks" onChange={handleChange}></textarea>
                <button type="submit">Issue Book</button>
            </form>
        </div>
    );
};

export default IssueBook;
