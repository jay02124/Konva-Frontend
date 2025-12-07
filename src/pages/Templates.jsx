
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../utils/api';
import TemplatePreview from '../components/TemplatePreview';
import { PlusIcon, PencilIcon, TrashIcon } from '@heroicons/react/24/outline';
import { motion } from 'framer-motion';

function Templates() {
    const navigate = useNavigate();
    const [templates, setTemplates] = useState([]);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null);

    useEffect(() => {
        fetchTemplates();
    }, []);

    const fetchTemplates = async () => {
        try {
            const response = await api.get('/api/templates');
            setTemplates(response.data);
        } catch (err) {
            setError('Failed to load templates: ' + err.message);
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm('Are you sure you want to delete this template?')) {
            try {
                await api.delete(`/api/templates/${id}`);
                setSuccess('Template deleted successfully');
                fetchTemplates();
            } catch (err) {
                setError('Failed to delete template: ' + err.message);
            }
        }
    };

    return (
        <div className="max-w-7xl mx-auto p-6">
            <h1 className="text-2xl font-bold mb-4 text-gray-800">Manage Templates</h1>
            {error && <div className="text-red-600 mb-4">{error}</div>}
            {success && <div className="text-green-600 mb-4">{success}</div>}
            <button
                className="bg-[#1d4ed8] text-white p-2 rounded hover:bg-[#2563eb] flex items-center mb-4"
                onClick={() => navigate('/editor')}
            >
                <PlusIcon className="h-5 w-5 mr-1" /> Create New Template
            </button>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {templates.map(template => (
                    <motion.div
                        key={template._id}
                        className="bg-white rounded-lg shadow-lg p-4"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3 }}
                    >
                        <h2 className="text-lg font-semibold mb-2 text-gray-800">{template.name}</h2>
                        <TemplatePreview template={template} width={300} height={200} />
                        <div className="flex space-x-2 mt-4">
                            <button
                                className="bg-[#1d4ed8] text-white p-2 rounded hover:bg-[#2563eb] flex items-center"
                                onClick={() => navigate(`/editor/${template._id}`)}
                            >
                                <PencilIcon className="h-5 w-5 mr-1" /> Edit
                            </button>
                            <button
                                className="bg-red-600 text-white p-2 rounded hover:bg-red-700 flex items-center"
                                onClick={() => handleDelete(template._id)}
                            >
                                <TrashIcon className="h-5 w-5 mr-1" /> Delete
                            </button>
                        </div>
                    </motion.div>
                ))}
            </div>
        </div>
    );
}

export default Templates;
