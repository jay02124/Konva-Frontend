import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { Stage, Layer, Rect, Text, Image as KonvaImage, Circle, Star } from 'react-konva';
import useImage from 'use-image';
import jsPDF from 'jspdf';
import ExcelImport from '../components/ExcelImport';
import { motion } from 'framer-motion';

function GenerateIDCards() {
    const [students, setStudents] = useState([]);
    const [templates, setTemplates] = useState([]);
    const [selectedTemplate, setSelectedTemplate] = useState(null);
    const [selectedStudent, setSelectedStudent] = useState(null);
    const stageRef = useRef(null);

    useEffect(() => {
        axios.get('http://localhost:5000/api/students')
            .then(response => setStudents(response.data))
            .catch(error => console.error('Error fetching students:', error));
        axios.get('http://localhost:5000/api/templates')
            .then(response => setTemplates(response.data))
            .catch(error => console.error('Error fetching templates:', error));
    }, []);

    const generatePDF = async (student) => {
        if (!selectedTemplate) {
            alert('Please select a template');
            return;
        }
        const stage = stageRef.current;
        if (!stage) return;

        const pdf = new jsPDF('l', 'px', [800, 600]);
        pdf.setTextColor('#000000');
        stage.find('Text').forEach((text) => {
            const size = text.fontSize() / 0.75;
            pdf.setFontSize(size);
            pdf.setFont(text.fontFamily(), text.fontStyle());
            pdf.text(text.text(), text.x(), text.y(), {
                baseline: 'top',
                angle: -text.getAbsoluteRotation(),
                align: text.textAlign(),
            });
        });

        const uri = stage.toDataURL({ pixelRatio: 2 });
        const result = await axios.post('http://localhost:5000/api/uploads/image', { file: uri });
        pdf.addImage(result.data.url, 'PNG', 0, 0, 800, 600);
        pdf.save(`${student.name}_IDCard.pdf`);
    };

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
        >
            <h1 className="text-3xl font-bold mb-6">Generate ID Cards</h1>
            <ExcelImport setStudents={setStudents} />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div>
                    <h3 className="text-lg font-semibold mb-2">Select Template</h3>
                    <select
                        className="w-full p-3 border rounded bg-gray-50"
                        onChange={(e) => setSelectedTemplate(templates[e.target.value] || null)}
                    >
                        <option value="">Select a Template</option>
                        {templates.map((template, index) => (
                            <option key={template._id} value={index}>{template.name}</option>
                        ))}
                    </select>
                </div>
                <div>
                    <h3 className="text-lg font-semibold mb-2">Select Student</h3>
                    <select
                        className="w-full p-3 border rounded bg-gray-50"
                        onChange={(e) => setSelectedStudent(students[e.target.value] || null)}
                    >
                        <option value="">Select a Student</option>
                        {students.map((student, index) => (
                            <option key={student._id} value={index}>{student.name}</option>
                        ))}
                    </select>
                </div>
            </div>
            {selectedStudent && selectedTemplate && (
                <>
                    <Stage width={800} height={600} style={{ border: '2px solid black', background: 'white', marginBottom: '1rem' }}>
                        <Layer>
                            <Rect x={0} y={0} width={800} height={600} fill={selectedTemplate.background.color} />
                            {selectedTemplate.background.image && (
                                <KonvaImage
                                    image={useImage(selectedTemplate.background.image)[0]}
                                    x={0}
                                    y={0}
                                    width={800}
                                    height={600}
                                />
                            )}
                            {selectedTemplate.elements.map((element, index) => {
                                const patternImage = element.fillPatternImage ? new window.Image() : null;
                                if (element.fillPatternImage) patternImage.src = element.fillPatternImage;
                                const [img] = useImage(
                                    element.type === 'image' && element.dataField === 'photo' ? selectedStudent.photo :
                                        element.type === 'image' || element.type === 'custom' ? element.image || element.shapeImage : null
                                );

                                if (element.type === 'text') {
                                    const textContent = element.dataField ? selectedStudent[element.dataField] || element.text : element.text;
                                    return (
                                        <Text
                                            key={index}
                                            x={element.x}
                                            y={element.y}
                                            text={textContent}
                                            fontSize={element.fontSize}
                                            fontFamily={element.fontFamily}
                                            fontStyle={element.fontStyle}
                                            textAlign={element.textAlign}
                                            fill={element.fill}
                                            rotation={element.rotation}
                                            opacity={element.opacity}
                                            shadowColor={element.shadowColor}
                                            shadowBlur={element.shadowBlur}
                                            shadowOffsetX={element.shadowOffsetX}
                                            shadowOffsetY={element.shadowOffsetY}
                                            draggable
                                        />
                                    );
                                } else if (element.type === 'rect') {
                                    return (
                                        <Rect
                                            key={index}
                                            x={element.x}
                                            y={element.y}
                                            width={element.width}
                                            height={element.height}
                                            fill={element.fill}
                                            fillPatternImage={patternImage}
                                            fillPatternRepeat={element.fillPatternRepeat}
                                            stroke={element.stroke}
                                            strokeWidth={element.strokeWidth}
                                            rotation={element.rotation}
                                            opacity={element.opacity}
                                            shadowColor={element.shadowColor}
                                            shadowBlur={element.shadowBlur}
                                            shadowOffsetX={element.shadowOffsetX}
                                            shadowOffsetY={element.shadowOffsetY}
                                            draggable
                                        />
                                    );
                                } else if (element.type === 'circle') {
                                    return (
                                        <Circle
                                            key={index}
                                            x={element.x}
                                            y={element.y}
                                            radius={element.radius}
                                            fill={element.fill}
                                            fillPatternImage={patternImage}
                                            fillPatternRepeat={element.fillPatternRepeat}
                                            stroke={element.stroke}
                                            strokeWidth={element.strokeWidth}
                                            rotation={element.rotation}
                                            opacity={element.opacity}
                                            shadowColor={element.shadowColor}
                                            shadowBlur={element.shadowBlur}
                                            shadowOffsetX={element.shadowOffsetX}
                                            shadowOffsetY={element.shadowOffsetY}
                                            draggable
                                        />
                                    );
                                } else if (element.type === 'star') {
                                    return (
                                        <Star
                                            key={index}
                                            x={element.x}
                                            y={element.y}
                                            numPoints={5}
                                            innerRadius={element.innerRadius}
                                            outerRadius={element.outerRadius}
                                            fill={element.fill}
                                            fillPatternImage={patternImage}
                                            fillPatternRepeat={element.fillPatternRepeat}
                                            stroke={element.stroke}
                                            strokeWidth={element.strokeWidth}
                                            rotation={element.rotation}
                                            opacity={element.opacity}
                                            shadowColor={element.shadowColor}
                                            shadowBlur={element.shadowBlur}
                                            shadowOffsetX={element.shadowOffsetX}
                                            shadowOffsetY={element.shadowOffsetY}
                                            draggable
                                        />
                                    );
                                } else if (element.type === 'image' || element.type === 'custom') {
                                    return (
                                        <KonvaImage
                                            key={index}
                                            image={img}
                                            x={element.x}
                                            y={element.y}
                                            width={element.width}
                                            height={element.height}
                                            rotation={element.rotation}
                                            opacity={element.opacity}
                                            shadowColor={element.shadowColor}
                                            shadowBlur={element.shadowBlur}
                                            shadowOffsetX={element.shadowOffsetX}
                                            shadowOffsetY={element.shadowOffsetY}
                                            draggable
                                        />
                                    );
                                }
                                return null;
                            })}
                        </Layer>
                    </Stage>
                    <button
                        className="bg-primary text-white p-3 rounded hover:bg-blue-700"
                        onClick={() => generatePDF(selectedStudent)}
                    >
                        Generate PDF for {selectedStudent.name}
                    </button>
                    <Stage width={800} height={600} ref={stageRef} style={{ display: 'none' }}>
                        <Layer>
                            <Rect x={0} y={0} width={800} height={600} fill={selectedTemplate.background.color} />
                            {selectedTemplate.background.image && (
                                <KonvaImage
                                    image={useImage(selectedTemplate.background.image)[0]}
                                    x={0}
                                    y={0}
                                    width={800}
                                    height={600}
                                />
                            )}
                            {selectedTemplate.elements.map((element, index) => {
                                const patternImage = element.fillPatternImage ? new window.Image() : null;
                                if (element.fillPatternImage) patternImage.src = element.fillPatternImage;
                                const [img] = useImage(
                                    element.type === 'image' && element.dataField === 'photo' ? selectedStudent.photo :
                                        element.type === 'image' || element.type === 'custom' ? element.image || element.shapeImage : null
                                );

                                if (element.type === 'text') {
                                    const textContent = element.dataField ? selectedStudent[element.dataField] || element.text : element.text;
                                    return (
                                        <Text
                                            key={index}
                                            x={element.x}
                                            y={element.y}
                                            text={textContent}
                                            fontSize={element.fontSize}
                                            fontFamily={element.fontFamily}
                                            fontStyle={element.fontStyle}
                                            textAlign={element.textAlign}
                                            fill={element.fill}
                                            rotation={element.rotation}
                                            opacity={element.opacity}
                                            shadowColor={element.shadowColor}
                                            shadowBlur={element.shadowBlur}
                                            shadowOffsetX={element.shadowOffsetX}
                                            shadowOffsetY={element.shadowOffsetY}
                                        />
                                    );
                                } else if (element.type === 'rect') {
                                    return (
                                        <Rect
                                            key={index}
                                            x={element.x}
                                            y={element.y}
                                            width={element.width}
                                            height={element.height}
                                            fill={element.fill}
                                            fillPatternImage={patternImage}
                                            fillPatternRepeat={element.fillPatternRepeat}
                                            stroke={element.stroke}
                                            strokeWidth={element.strokeWidth}
                                            rotation={element.rotation}
                                            opacity={element.opacity}
                                            shadowColor={element.shadowColor}
                                            shadowBlur={element.shadowBlur}
                                            shadowOffsetX={element.shadowOffsetX}
                                            shadowOffsetY={element.shadowOffsetY}
                                        />
                                    );
                                } else if (element.type === 'circle') {
                                    return (
                                        <Circle
                                            key={index}
                                            x={element.x}
                                            y={element.y}
                                            radius={element.radius}
                                            fill={element.fill}
                                            fillPatternImage={patternImage}
                                            fillPatternRepeat={element.fillPatternRepeat}
                                            stroke={element.stroke}
                                            strokeWidth={element.strokeWidth}
                                            rotation={element.rotation}
                                            opacity={element.opacity}
                                            shadowColor={element.shadowColor}
                                            shadowBlur={element.shadowBlur}
                                            shadowOffsetX={element.shadowOffsetX}
                                            shadowOffsetY={element.shadowOffsetY}
                                        />
                                    );
                                } else if (element.type === 'star') {
                                    return (
                                        <Star
                                            key={index}
                                            x={element.x}
                                            y={element.y}
                                            numPoints={5}
                                            innerRadius={element.innerRadius}
                                            outerRadius={element.outerRadius}
                                            fill={element.fill}
                                            fillPatternImage={patternImage}
                                            fillPatternRepeat={element.fillPatternRepeat}
                                            stroke={element.stroke}
                                            strokeWidth={element.strokeWidth}
                                            rotation={element.rotation}
                                            opacity={element.opacity}
                                            shadowColor={element.shadowColor}
                                            shadowBlur={element.shadowBlur}
                                            shadowOffsetX={element.shadowOffsetX}
                                            shadowOffsetY={element.shadowOffsetY}
                                        />
                                    );
                                } else if (element.type === 'image' || element.type === 'custom') {
                                    return (
                                        <KonvaImage
                                            key={index}
                                            image={img}
                                            x={element.x}
                                            y={element.y}
                                            width={element.width}
                                            height={element.height}
                                            rotation={element.rotation}
                                            opacity={element.opacity}
                                            shadowColor={element.shadowColor}
                                            shadowBlur={element.shadowBlur}
                                            shadowOffsetX={element.shadowOffsetX}
                                            shadowOffsetY={element.shadowOffsetY}
                                        />
                                    );
                                }
                                return null;
                            })}
                        </Layer>
                    </Stage>
                </>
            )}
        </motion.div>
    );
}

export default GenerateIDCards;