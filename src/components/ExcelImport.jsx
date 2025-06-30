import React from 'react';
import axios from 'axios';
import * as XLSX from 'xlsx';
import { motion } from 'framer-motion';

function ExcelImport({ setStudents }) {
    const handleFileUpload = async (event) => {
        const file = event.target.files[0];
        const reader = new FileReader();
        reader.onload = async (e) => {
            const data = new Uint8Array(e.target.result);
            try {
                const response = await axios.post('http://localhost:5000/api/students/import', {
                    buffer: Buffer.from(data),
                });
                console.log(response.data);
                const updatedStudents = await axios.get('http://localhost:5000/api/students');
                setStudents(updatedStudents.data);
            } catch (error) {
                console.error('Error importing Excel:', error);
            }
        };
        reader.readAsArrayBuffer(file);
    };

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
            className="mb-4"
        >
            <h3 className="text-lg font-semibold mb-2">Import Students (Excel)</h3>
            <input
                type="file"
                accept=".xlsx, .xls"
                className="w-full p-2 border rounded bg-white shadow-sm"
                onChange={handleFileUpload}
            />
        </motion.div>
    );
}

export default ExcelImport;