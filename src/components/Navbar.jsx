import React from 'react';
import { NavLink } from 'react-router-dom';
import { HomeIcon, DocumentTextIcon, IdentificationIcon } from '@heroicons/react/24/outline';
import { motion } from 'framer-motion';

function Navbar() {
    return (
        <motion.nav
            initial={{ y: -50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.5 }}
            className="bg-[#000] text-white p-4 shadow-lg"
        >
            <div className="container mx-auto flex justify-between items-center">
                <h1 className="text-2xl font-bold">ID Card Studio</h1>
                <div className="flex space-x-4">
                    <NavLink
                        to="/"
                        className={({ isActive }) =>
                            `flex items-center space-x-2 p-2 rounded ${isActive ? 'bg-secondary' : 'hover:bg-blue-700'}`
                        }
                    >
                        <HomeIcon className="h-5 w-5" />
                        <span>Students</span>
                    </NavLink>
                    <NavLink
                        to="/templates"
                        className={({ isActive }) =>
                            `flex items-center space-x-2 p-2 rounded ${isActive ? 'bg-secondary' : 'hover:bg-blue-700'}`
                        }
                    >
                        <DocumentTextIcon className="h-5 w-5" />
                        <span>Templates</span>
                    </NavLink>
                    <NavLink
                        to="/generate"
                        className={({ isActive }) =>
                            `flex items-center space-x-2 p-2 rounded ${isActive ? 'bg-secondary' : 'hover:bg-blue-700'}`
                        }
                    >
                        <IdentificationIcon className="h-5 w-5" />
                        <span>Generate ID Cards</span>
                    </NavLink>
                    <NavLink
                        to="/login"
                        className={({ isActive }) =>
                            `flex items-center space-x-2 p-2 rounded ${isActive ? 'bg-secondary' : 'hover:bg-blue-700'}`
                        }
                    >
                        <IdentificationIcon className="h-5 w-5" />
                        <span>Log in</span>
                    </NavLink>
                </div>
            </div>
        </motion.nav>
    );
}

export default Navbar;