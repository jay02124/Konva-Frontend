
import React, { useState, useEffect } from 'react';
import { api } from '../utils/api';
import ExcelImport from '../components/ExcelImport';
import { PlusIcon, PencilIcon, TrashIcon } from '@heroicons/react/24/outline';

function Students() {
    const [students, setStudents] = useState([]);
    const [formData, setFormData] = useState({
        name: '',
        studentId: '',
        dob: '',
        class: '',
        email: '',
        phone: '',
    });
    const [editingId, setEditingId] = useState(null);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null);

    useEffect(() => {
        fetchStudents();
    }, []);

    const fetchStudents = async () => {
        try {
            const response = await api.get('/api/students');
            setStudents(response.data);
        } catch (err) {
            setError('Failed to load students: ' + err.message);
        }
    };

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async () => {
        try {
            if (editingId) {
                await api.put(`/api/students/${editingId}`, formData);
                setSuccess('Student updated successfully');
            } else {
                await api.post('/api/students', formData);
                setSuccess('Student added successfully');
            }
            setFormData({ name: '', studentId: '', dob: '', class: '', email: '', phone: '' });
            setEditingId(null);
            fetchStudents();
        } catch (err) {
            setError(err.response?.data?.message || 'An error occurred');
        }
    };

    const handleEdit = (student) => {
        setFormData({
            name: student.name,
            studentId: student.studentId,
            dob: student.dob ? new Date(student.dob).toISOString().split('T')[0] : '',
            class: student.class,
            email: student.email,
            phone: student.phone,
        });
        setEditingId(student._id);
    };

    const handleDelete = async (id) => {
        if (window.confirm('Are you sure you want to delete this student?')) {
            try {
                await api.delete(`/api/students/${id}`);
                setSuccess('Student deleted successfully');
                fetchStudents();
            } catch (err) {
                setError('Failed to delete student: ' + err.message);
            }
        }
    };

    return (
        <div className="max-w-7xl mx-auto p-6">
            <h1 className="text-2xl font-bold mb-4 text-gray-800">Manage Students</h1>
            {error && <div className="text-red-600 mb-4">{error}</div>}
            {success && <div className="text-green-600 mb-4">{success}</div>}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white p-6 rounded-lg shadow-md">
                    <h2 className="text-lg font-semibold mb-2 text-gray-800">{editingId ? 'Edit Student' : 'Add Student'}</h2>
                    <div className="space-y-4">
                        <input
                            type="text"
                            name="name"
                            placeholder="Name"
                            value={formData.name}
                            onChange={handleChange}
                            className="w-full p-2 border rounded bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary-500"
                        />
                        <input
                            type="text"
                            name="studentId"
                            placeholder="Student ID"
                            value={formData.studentId}
                            onChange={handleChange}
                            className="w-full p-2 border rounded bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary-500"
                        />
                        <input
                            type="date"
                            name="dob"
                            value={formData.dob}
                            onChange={handleChange}
                            className="w-full p-2 border rounded bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary-500"
                        />
                        <input
                            type="text"
                            name="class"
                            placeholder="Class"
                            value={formData.class}
                            onChange={handleChange}
                            className="w-full p-2 border rounded bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary-500"
                        />
                        <input
                            type="email"
                            name="email"
                            placeholder="Email"
                            value={formData.email}
                            onChange={handleChange}
                            className="w-full p-2 border rounded bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary-500"
                        />
                        <input
                            type="text"
                            name="phone"
                            placeholder="Phone"
                            value={formData.phone}
                            onChange={handleChange}
                            className="w-full p-2 border rounded bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary-500"
                        />
                        <button
                            className="w-full bg-primary-600 text-white p-2 rounded hover:bg-primary-700 flex items-center justify-center"
                            onClick={handleSubmit}
                        >
                            <PlusIcon className="h-5 w-5 mr-1" /> {editingId ? 'Update' : 'Add'} Student
                        </button>
                    </div>
                </div>
                <div>
                    <ExcelImport onImport={fetchStudents} />
                </div>
            </div>
            <div className="mt-6">
                <h2 className="text-lg font-semibold mb-2 text-gray-800">Students List</h2>
                <div className="bg-white rounded-lg shadow-md overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="bg-gray-100">
                                <th className="p-2 text-left text-gray-700">Name</th>
                                <th className="p-2 text-left text-gray-700">Student ID</th>
                                <th className="p-2 text-left text-gray-700">Email</th>
                                <th className="p-2 text-left text-gray-700">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {students.map(student => (
                                <tr key={student._id} className="border-t">
                                    <td className="p-2">{student.name}</td>
                                    <td className="p-2">{student.studentId}</td>
                                    <td className="p-2">{student.email}</td>
                                    <td className="p-2">
                                        <button
                                            className="text-primary-600 hover:text-primary-700 mr-2"
                                            onClick={() => handleEdit(student)}
                                        >
                                            <PencilIcon className="h-5 w-5" />
                                        </button>
                                        <button
                                            className="text-red-600 hover:text-red-700"
                                            onClick={() => handleDelete(student._id)}
                                        >
                                            <TrashIcon className="h-5 w-5" />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}

export default Students;
