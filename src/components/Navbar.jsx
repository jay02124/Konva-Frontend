
import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { ArrowLeftCircleIcon } from '@heroicons/react/24/outline';

function Navbar() {
    const navigate = useNavigate();

    const handleLogout = () => {
        localStorage.removeItem('token');
        navigate('/login');
    };

    return (
        <nav className="bg-[#000] text-white p-4 shadow-md">
            <div className="mx-auto flex justify-between items-center">
                <div className="text-xl font-bold">ID Card Generator</div>
                <div className="flex space-x-4">
                    <NavLink
                        to="/templates"
                        className={({ isActive }) =>
                            `px - 3 py - 2 rounded hover: bg - primary - 700 ${isActive ? 'bg-primary-700' : ''} `
                        }
                    >
                        Templates
                    </NavLink>
                    <NavLink
                        to="/students"
                        className={({ isActive }) =>
                            `px - 3 py - 2 rounded hover: bg - primary - 700 ${isActive ? 'bg-primary-700' : ''} `
                        }
                    >
                        Students
                    </NavLink>
                    <NavLink
                        to="/generate"
                        className={({ isActive }) =>
                            `px - 3 py - 2 rounded hover: bg - primary - 700 ${isActive ? 'bg-primary-700' : ''} `
                        }
                    >
                        Generate ID Cards
                    </NavLink>
                    <button
                        className="px-3 py-2 rounded hover:bg-red-600 flex items-center"
                        onClick={handleLogout}
                    >
                        <ArrowLeftCircleIcon className="h-5 w-5 mr-1" /> Logout
                    </button>
                </div>
            </div>
        </nav>
    );
}

export default Navbar;
