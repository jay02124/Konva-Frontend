import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import TemplatePreview from '../components/TemplatePreview';
import { motion } from 'framer-motion';
import { PencilIcon, DocumentDuplicateIcon, EyeIcon } from '@heroicons/react/24/outline';

function Templates() {
    const [templates, setTemplates] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        axios.get(`http://localhost:5000/api/templates?search=${searchQuery}`)
            .then(response => setTemplates(response.data))
            .catch(error => console.error('Error fetching templates:', error));
    }, [searchQuery]);

    const cloneTemplate = async (template) => {
        try {
            const newTemplate = { ...template, name: `${template.name} (Copy)` };
            delete newTemplate._id;
            await axios.post('http://localhost:5000/api/templates', newTemplate);
            const response = await axios.get('http://localhost:5000/api/templates');
            setTemplates(response.data);
        } catch (error) {
            console.error('Error cloning template:', error);
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
        >
            <h1 className="text-3xl font-bold mb-6">Templates</h1>
            <div className="mb-4">
                <input
                    type="text"
                    placeholder="Search templates..."
                    className="w-full max-w-md p-2 border rounded bg-white shadow-sm"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                />
            </div>
            <Link to="/templates/edit" className="bg-primary text-white p-2 rounded hover:bg-blue-700 mb-4 inline-block">
                Create New Template
            </Link>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {templates.map(template => (
                    <motion.div
                        key={template._id}
                        className="bg-white p-4 rounded-lg shadow-md"
                        whileHover={{ scale: 1.02 }}
                    >
                        <TemplatePreview template={template} />
                        <h3 className="text-lg font-semibold mt-2">{template.name}</h3>
                        <div className="flex space-x-2 mt-2">
                            <Link
                                to={`/templates/edit/${template._id}`}
                                className="flex items-center text-primary hover:text-blue-700"
                            >
                                <PencilIcon className="h-5 w-5 mr-1" />
                                Edit
                            </Link>
                            <button
                                className="flex items-center text-yellow-500 hover:text-yellow-700"
                                onClick={() => cloneTemplate(template)}
                            >
                                <DocumentDuplicateIcon className="h-5 w-5 mr-1" />
                                Clone
                            </button>
                            <Link
                                to={`/templates/edit/${template._id}?view=true`}
                                className="flex items-center text-gray-500 hover:text-gray-700"
                            >
                                <EyeIcon className="h-5 w-5 mr-1" />
                                View
                            </Link>
                        </div>
                    </motion.div>
                ))}
            </div>
        </motion.div>
    );
}

export default Templates;