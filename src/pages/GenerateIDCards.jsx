
import React, { useState, useEffect } from 'react';
import { api } from '../utils/api';
import TemplatePreview from '../components/TemplatePreview';
import { PlusIcon } from '@heroicons/react/24/outline';

function GenerateIDCards() {
    const [templates, setTemplates] = useState([]);
    const [students, setStudents] = useState([]);
    const [selectedTemplate, setSelectedTemplate] = useState(null);
    const [selectedStudent, setSelectedStudent] = useState(null);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [templateRes, studentRes] = await Promise.all([
                    api.get('/api/templates'),
                    api.get('/api/students'),
                ]);
                setTemplates(templateRes.data);
                setStudents(studentRes.data);
            } catch (err) {
                setError('Failed to load templates or students: ' + err.message);
            }
        };
        fetchData();
    }, []);

    const handleGenerate = () => {
        if (!selectedTemplate || !selectedStudent) {
            setError('Please select a template and a student');
            return;
        }
        setSuccess('ID card generated successfully (placeholder for download logic)');
    };

    return (
        <div className="max-w-7xl mx-auto p-6">
            <h1 className="text-2xl font-bold mb-4 text-gray-800">Generate ID Cards</h1>
            {error && <div className="text-red-600 mb-4">{error}</div>}
            {success && <div className="text-green-600 mb-4">{success}</div>}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                    <h2 className="text-lg font-semibold mb-2 text-gray-800">Select Template</h2>
                    <select
                        className="w-full p-2 border rounded bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary-500"
                        value={selectedTemplate?._id || ''}
                        onChange={(e) => setSelectedTemplate(templates.find(t => t._id === e.target.value))}
                    >
                        <option value="">Select a template</option>
                        {templates.map(template => (
                            <option key={template._id} value={template._id}>{template.name}</option>
                        ))}
                    </select>
                    {selectedTemplate && (
                        <div className="mt-4">
                            <TemplatePreview template={selectedTemplate} studentData={selectedStudent || {}} />
                        </div>
                    )}
                </div>
                <div>
                    <h2 className="text-lg font-semibold mb-2 text-gray-800">Select Student</h2>
                    <select
                        className="w-full p-2 border rounded bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary-500"
                        value={selectedStudent?._id || ''}
                        onChange={(e) => setSelectedStudent(students.find(s => s._id === e.target.value))}
                    >
                        <option value="">Select a student</option>
                        {students.map(student => (
                            <option key={student._id} value={student._id}>{student.name}</option>
                        ))}
                    </select>
                    {selectedStudent && (
                        <div className="mt-4 p-4 bg-white rounded-lg shadow-md">
                            <p><strong>Name:</strong> {selectedStudent.name}</p>
                            <p><strong>Student ID:</strong> {selectedStudent.studentId}</p>
                            <p><strong>Email:</strong> {selectedStudent.email}</p>
                            <p><strong>Class:</strong> {selectedStudent.class}</p>
                        </div>
                    )}
                </div>
            </div>
            <button
                className="mt-6 bg-primary-600 text-white p-2 rounded hover:bg-primary-700 flex items-center justify-center disabled:bg-gray-400 disabled:cursor-not-allowed"
                onClick={handleGenerate}
                disabled={!selectedTemplate || !selectedStudent}
            >
                <PlusIcon className="h-5 w-5 mr-1" /> Generate ID Card
            </button>
        </div>
    );
}

export default GenerateIDCards;
