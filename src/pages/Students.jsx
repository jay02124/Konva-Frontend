import React, { useState, useEffect } from 'react';
import axios from 'axios';
import ExcelImport from '../components/ExcelImport';
import { motion } from 'framer-motion';
import { TrashIcon } from '@heroicons/react/24/outline';

function Students() {
    const [students, setStudents] = useState([]);

    useEffect(() => {
        axios.get('http://localhost:5000/api/students')
            .then(response => setStudents(response.data))
            .catch(error => console.error('Error fetching students:', error));
    }, []);

    const deleteStudent = async (id) => {
        try {
            await axios.delete(`http://localhost:5000/api/students/${id}`);
            setStudents(students.filter(student => student._id !== id));
        } catch (error) {
            console.error('Error deleting student:', error);
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
        >
            <h1 className="text-3xl font-bold mb-6">Students</h1>
            <ExcelImport setStudents={setStudents} />
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {students.map(student => (
                    <motion.div
                        key={student._id}
                        className="bg-white p-4 rounded-lg shadow-md flex items-center"
                        whileHover={{ scale: 1.02 }}
                    >
                        <img src={student.photo} alt={student.name} className="w-16 h-16 rounded-full mr-4" />
                        <div>
                            <h3 className="text-lg font-semibold">{student.name}</h3>
                            <p>ID: {student.studentId}</p>
                            <p>Class: {student.class}</p>
                            <p>DOB: {student.dob}</p>
                        </div>
                        <button
                            className="ml-auto text-red-500 hover:text-red-700"
                            onClick={() => deleteStudent(student._id)}
                        >
                            <TrashIcon className="h-5 w-5" />
                        </button>
                    </motion.div>
                ))}
            </div>
        </motion.div>
    );
}

export default Students;