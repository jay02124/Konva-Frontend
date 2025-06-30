import React from 'react';
import { Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Students from './pages/Students';
import Templates from './pages/Templates';
import TemplateEditor from './pages/TemplateEditor';
import GenerateIDCards from './pages/GenerateIDCards';

function App() {
  return (
    <div className="min-h-screen bg-gray-50 font-inter">
      <Navbar />
      <div className="container mx-auto p-6">
        <Routes>
          <Route path="/" element={<Students />} />
          <Route path="/templates" element={<Templates />} />
          <Route path="/templates/edit/:id?" element={<TemplateEditor />} />
          <Route path="/generate" element={<GenerateIDCards />} />
        </Routes>
      </div>
    </div>
  );
}

export default App;