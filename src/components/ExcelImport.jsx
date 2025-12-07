
import React, { useState } from 'react';
import * as XLSX from 'xlsx';
import { PlusIcon } from '@heroicons/react/24/outline';
import { api } from '../utils/api';

function ExcelImport({ onImport }) {
    const [file, setFile] = useState(null);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null);

    const handleFileChange = (e) => {
        setFile(e.target.files[0]);
        setError(null);
        setSuccess(null);
    };

    const handleUpload = async () => {
        if (!file) {
            setError('Please select an Excel file');
            return;
        }

        try {
            const reader = new FileReader();
            reader.onload = async (e) => {
                const data = new Uint8Array(e.target.result);
                const workbook = XLSX.read(data, { type: 'array' });
                const sheetName = workbook.SheetNames[0];
                const worksheet = workbook.Sheets[sheetName];
                const jsonData = XLSX.utils.sheet_to_json(worksheet);

                const students = jsonData.map(row => ({
                    name: row.Name || '',
                    studentId: row['Student ID'] || '',
                    dob: row.DOB ? new Date(row.DOB) : null,
                    class: row.Class || '',
                    email: row.Email || '',
                    phone: row.Phone || '',
                }));

                for (const student of students) {
                    try {
                        await api.post('/api/students', student);
                    } catch (err) {
                        setError(`Failed to import student ${student.name}: ${err.response?.data?.message || err.message}`);
                        return;
                    }
                }

                setSuccess('Students imported successfully');
                if (onImport) onImport();
                setFile(null);
            };
            reader.readAsArrayBuffer(file);
        } catch (err) {
            setError('Failed to process Excel file: ' + err.message);
        }
    };

    return (
        <div className="p-4 bg-white rounded-lg shadow-md">
            <h3 className="text-lg font-semibold mb-2 text-gray-800">Import Students from Excel</h3>
            {error && <div className="text-red-600 mb-2">{error}</div>}
            {success && <div className="text-green-600 mb-2">{success}</div>}
            <input
                type="file"
                accept=".xlsx, .xls"
                className="w-full p-2 border rounded bg-gray-50 mb-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
                onChange={handleFileChange}
            />
            <button
                className="bg-primary-600 text-white p-2 rounded hover:bg-primary-700 flex items-center justify-center disabled:bg-gray-400 disabled:cursor-not-allowed"
                onClick={handleUpload}
                disabled={!file}
            >
                <PlusIcon className="h-5 w-5 mr-1" /> Import
            </button>
        </div>
    );
}

export default ExcelImport;
