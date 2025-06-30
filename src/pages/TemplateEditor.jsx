import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import { Stage, Layer, Rect, Text, Image as KonvaImage, Circle, Star, Group, Transformer, Path } from 'react-konva';
import 'konva/lib/shapes/Path'; // Explicitly import Path to support minimal react-konva
import useImage from 'use-image';
import { motion, AnimatePresence } from 'framer-motion';
import { XCircleIcon, ArrowPathIcon, PlusIcon } from '@heroicons/react/24/outline';

function TemplateEditor() {
    const { id } = useParams();
    const navigate = useNavigate();
    const location = useLocation();
    const isViewMode = new URLSearchParams(location.search).get('view') === 'true';
    const [templateName, setTemplateName] = useState('');
    const [elements, setElements] = useState([]);
    const [backgroundColor, setBackgroundColor] = useState('white');
    const [backgroundImage, setBackgroundImage] = useState('');
    const [bgImage] = useImage(backgroundImage, 'Anonymous');
    const [selectedElement, setSelectedElement] = useState(null);
    const [patterns, setPatterns] = useState([]);
    const [shapes, setShapes] = useState([]);
    const [onlineImages, setOnlineImages] = useState([]);
    const [uploadedImages, setUploadedImages] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [activeTab, setActiveTab] = useState('images');
    const transformerRef = useRef(null);
    const stageRef = useRef(null);

    // Store images for elements
    const [elementImages, setElementImages] = useState({});

    // Memoize image URLs to prevent unnecessary recomputation
    const imageUrls = useMemo(() => {
        return elements.reduce((acc, element, index) => {
            if ((element.type === 'image' || element.type === 'custom') && (element.image || element.shapeImage)) {
                acc[index] = element.image || element.shapeImage;
            }
            return acc;
        }, {});
    }, [elements]);

    // Load images for elements and track loaded URLs to avoid redundant updates
    const [loadedUrls, setLoadedUrls] = useState(new Set());
    useEffect(() => {
        const newImages = {};
        let hasNewImages = false;

        Object.entries(imageUrls).forEach(([index, url]) => {
            if (!loadedUrls.has(url)) {
                const [image] = useImage(url, 'Anonymous');
                if (image) {
                    newImages[index] = image;
                    hasNewImages = true;
                }
            } else {
                newImages[index] = elementImages[index];
            }
        });

        if (hasNewImages) {
            setElementImages(prev => ({
                ...prev,
                ...newImages,
            }));
            setLoadedUrls(prev => new Set([...prev, ...Object.values(imageUrls)]));
        }
    }, [imageUrls, loadedUrls]);

    useEffect(() => {
        if (id) {
            axios.get(`http://localhost:5000/api/templates/${id}`)
                .then(response => {
                    const template = response.data;
                    setTemplateName(template.name);
                    setElements(template.elements);
                    setBackgroundColor(template.background.color);
                    setBackgroundImage(template.background.image);
                })
                .catch(error => console.error('Error fetching template:', error));
        }
        axios.get('http://localhost:5000/api/patterns')
            .then(response => setPatterns(response.data))
            .catch(error => console.error('Error fetching patterns:', error));
        axios.get('http://localhost:5000/api/shapes')
            .then(response => setShapes(response.data))
            .catch(error => console.error('Error fetching shapes:', error));
        axios.get('http://localhost:5000/api/uploads/images')
            .then(response => setUploadedImages(response.data))
            .catch(error => console.error('Error fetching uploaded images:', error));
    }, [id]);

    // Update Transformer when selectedElement changes
    useEffect(() => {
        if (selectedElement !== null && transformerRef.current && !isViewMode && elements[selectedElement]) {
            const node = stageRef.current.findOne(`#element-${selectedElement}`);
            if (node) {
                transformerRef.current.nodes([node]);
                transformerRef.current.getLayer().batchDraw();
            } else {
                transformerRef.current.nodes([]);
                transformerRef.current.getLayer().batchDraw();
            }
        } else if (transformerRef.current) {
            transformerRef.current.nodes([]);
            transformerRef.current.getLayer().batchDraw();
        }
    }, [selectedElement, isViewMode, elements]);

    const searchOnlineImages = async () => {
        try {
            const response = await axios.get(`https://api.unsplash.com/search/photos`, {
                params: { query: searchQuery, per_page: 10 },
                headers: { Authorization: `Client-ID ${process.env.REACT_APP_UNSPLASH_ACCESS_KEY}` },
            });
            const images = await Promise.all(response.data.results.map(async (img) => {
                const result = await axios.post('http://localhost:5000/api/uploads/image', {
                    file: img.urls.regular,
                });
                return { url: result.data.url, name: img.description || 'Image' };
            }));
            setOnlineImages(images);
            setUploadedImages(prev => [...prev, ...images]);
        } catch (error) {
            console.error('Error searching images:', error);
        }
    };

    const uploadImage = async (file) => {
        const formData = new FormData();
        formData.append('file', file);
        try {
            const response = await axios.post('http://localhost:5000/api/uploads/image', formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });
            const newImage = { url: response.data.url, name: file.name };
            setUploadedImages(prev => [...prev, newImage]);
            return response.data.url;
        } catch (error) {
            console.error('Error uploading image:', error);
            return null;
        }
    };

    const uploadPattern = async (file, name) => {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('name', name || file.name);
        try {
            const response = await axios.post('http://localhost:5000/api/patterns', formData);
            setPatterns(prev => [...prev, response.data]);
            return response.data.url;
        } catch (error) {
            console.error('Error uploading pattern:', error);
            return null;
        }
    };

    const uploadShape = async (file, name, points = []) => {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('name', name || file.name);
        formData.append('points', JSON.stringify(points));
        try {
            const response = await axios.post('http://localhost:5000/api/shapes', formData);
            setShapes(prev => [...prev, response.data]);
            return response.data;
        } catch (error) {
            console.error('Error uploading shape:', error);
            return null;
        }
    };

    const addTextElement = (props = {}) => {
        setElements(prev => [...prev, {
            type: 'text',
            x: 50,
            y: 50,
            text: 'Sample Text',
            fontSize: 16,
            fontFamily: 'Arial',
            fontStyle: 'normal',
            textAlign: 'left',
            fill: 'black',
            draggable: !isViewMode,
            dataField: 'name',
            rotation: 0,
            opacity: 1,
            shadowColor: 'black',
            shadowBlur: 0,
            shadowOffsetX: 0,
            shadowOffsetY: 0,
            width: 100,
            height: 50,
            ...props,
        }]);
    };

    const addShapeElement = (type, props = {}) => {
        const baseProps = {
            x: 50,
            y: 50,
            fill: 'blue',
            stroke: 'black',
            strokeWidth: 2,
            draggable: !isViewMode,
            rotation: 0,
            opacity: 1,
            shadowColor: 'black',
            shadowBlur: 0,
            shadowOffsetX: 0,
            shadowOffsetY: 0,
        };
        if (type === 'rect') {
            setElements(prev => [...prev, { type, width: 100, height: 50, ...baseProps, ...props }]);
        } else if (type === 'circle') {
            setElements(prev => [...prev, { type, radius: 50, width: 100, height: 100, ...baseProps, ...props }]);
        } else if (type === 'star') {
            setElements(prev => [...prev, { type, numPoints: 5, innerRadius: 25, outerRadius: 50, width: 100, height: 100, ...baseProps, ...props }]);
        } else if (type === 'triangle') {
            setElements(prev => [...prev, { type, points: [0, -50, 50, 50, -50, 50], width: 100, height: 100, ...baseProps, ...props }]);
        } else if (type === 'pentagon') {
            const r = 50;
            const points = Array.from({ length: 5 }, (_, i) => {
                const angle = (Math.PI / 2) + (2 * Math.PI * i) / 5;
                return [r * Math.cos(angle), r * Math.sin(angle)];
            }).flat();
            setElements(prev => [...prev, { type, points, width: 100, height: 100, ...baseProps, ...props }]);
        } else if (type === 'hexagon') {
            const r = 50;
            const points = Array.from({ length: 6 }, (_, i) => {
                const angle = (Math.PI / 3) * i;
                return [r * Math.cos(angle), r * Math.sin(angle)];
            }).flat();
            setElements(prev => [...prev, { type, points, width: 100, height: 100, ...baseProps, ...props }]);
        } else if (type === 'custom') {
            setElements(prev => [...prev, { type, points: props.points || [], shapeImage: props.shapeImage, width: 100, height: 100, ...baseProps, ...props }]);
        }
    };

    const addImageElement = (url, shapeType = null, x = 50, y = 50) => {
        const newElement = {
            type: 'image',
            x,
            y,
            width: 100,
            height: 100,
            image: url,
            shapeType: shapeType ? shapeType.type : null,
            shapePoints: shapeType ? shapeType.points : null,
            shapeImage: shapeType ? shapeType.url : null,
            draggable: !isViewMode,
            rotation: 0,
            opacity: 1,
            shadowColor: 'black',
            shadowBlur: 0,
            shadowOffsetX: 0,
            shadowOffsetY: 0,
        };
        setElements(prev => [...prev, newElement]);
    };

    const removeElement = (index) => {
        setElements(prev => prev.filter((_, i) => i !== index));
        setElementImages(prev => {
            const newImages = { ...prev };
            delete newImages[index];
            return newImages;
        });
        setSelectedElement(null);
    };

    const resetCanvas = () => {
        setElements([]);
        setElementImages({});
        setLoadedUrls(new Set());
        setBackgroundColor('white');
        setBackgroundImage('');
        setTemplateName('');
        setSelectedElement(null);
    };

    const saveTemplate = async () => {
        if (!templateName) {
            alert('Please enter a template name');
            return;
        }
        try {
            const template = {
                name: templateName,
                elements,
                background: { color: backgroundColor, image: backgroundImage },
            };
            if (id) {
                await axios.put(`http://localhost:5000/api/templates/${id}`, template);
            } else {
                await axios.post('http://localhost:5000/api/templates', template);
            }
            navigate('/templates');
        } catch (error) {
            console.error('Error saving template:', error);
        }
    };

    const cloneTemplate = async () => {
        if (!templateName) {
            alert('Please enter a template name for the cloned template');
            return;
        }
        try {
            const template = {
                name: `${templateName} (Copy)`,
                elements,
                background: { color: backgroundColor, image: backgroundImage },
            };
            await axios.post('http://localhost:5000/api/templates', template);
            navigate('/templates');
        } catch (error) {
            console.error('Error cloning template:', error);
        }
    };

    const updateElement = (index, updatedProps) => {
        setElements(prev => {
            const newElements = [...prev];
            newElements[index] = { ...newElements[index], ...updatedProps };
            return newElements;
        });
    };

    const handleSelectElement = (index, node) => {
        if (!isViewMode) {
            setSelectedElement(index);
        }
    };

    const handleDragOver = (e) => {
        e.preventDefault();
    };

    const handleDrop = (e) => {
        e.preventDefault();
        if (isViewMode) return;
        stageRef.current.setPointersPositions(e);
        const { x, y } = stageRef.current.getPointerPosition();
        const url = e.dataTransfer.getData('text/plain');
        if (url) {
            addImageElement(url, null, x - 50, y - 50);
        }
    };

    const handleDragStart = (e, url) => {
        e.dataTransfer.setData('text/plain', url);
    };

    const renderImagesTab = () => (
        <div>
            <h3 className="text-lg font-semibold mb-2">Images</h3>
            <input
                type="file"
                accept="image/*"
                className="w-full p-2 border rounded bg-gray-50 mb-2"
                onChange={async (e) => {
                    const file = e.target.files[0];
                    if (file) {
                        const url = await uploadImage(file);
                        if (url) {
                            addImageElement(url);
                        }
                    }
                }}
                disabled={isViewMode}
            />
            <input
                type="text"
                placeholder="Search online images..."
                className="w-full p-3 border rounded bg-gray-50 mb-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                disabled={isViewMode}
            />
            <button
                className="w-full bg-blue-600 text-white p-2 rounded hover:bg-blue-700 flex items-center justify-center mb-2"
                onClick={searchOnlineImages}
                disabled={isViewMode}
            >
                <PlusIcon className="h-5 w-5 mr-1" /> Search Images
            </button>
            <div className="grid grid-cols-2 gap-2 max-h-96 overflow-y-auto">
                {uploadedImages.map((img, index) => (
                    <motion.img
                        key={`uploaded-${index}`}
                        src={img.url}
                        alt={img.name}
                        className="w-full h-20 object-cover rounded cursor-pointer"
                        whileHover={{ scale: 1.05 }}
                        draggable={!isViewMode}
                        onDragStart={(e) => handleDragStart(e, img.url)}
                        onClick={() => addImageElement(img.url)}
                    />
                ))}
                {onlineImages.map((img, index) => (
                    <motion.img
                        key={`online-${index}`}
                        src={img.url}
                        alt={img.name}
                        className="w-full h-20 object-cover rounded cursor-pointer"
                        whileHover={{ scale: 1.05 }}
                        draggable={!isViewMode}
                        onDragStart={(e) => handleDragStart(e, img.url)}
                        onClick={() => addImageElement(img.url)}
                    />
                ))}
            </div>
        </div>
    );

    const renderFieldsTab = () => (
        <div>
            <h3 className="text-lg font-semibold mb-2">Fields</h3>
            <button
                className="w-full bg-blue-600 text-white p-2 rounded hover:bg-blue-700 flex items-center justify-center mb-2"
                onClick={addTextElement}
                disabled={isViewMode}
            >
                <PlusIcon className="h-5 w-5 mr-1" /> Add Text
            </button>
            <div className="space-y-2">
                <div>
                    <label className="text-sm font-medium">Static Text</label>
                    <input
                        type="text"
                        placeholder="Enter text"
                        className="w-full p-2 border rounded bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        onChange={(e) => addTextElement({ text: e.target.value })}
                        disabled={isViewMode}
                    />
                </div>
                <div>
                    <label className="text-sm font-medium">Dynamic Field</label>
                    <select
                        className="w-full p-2 border rounded bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        onChange={(e) => addTextElement({ dataField: e.target.value })}
                        disabled={isViewMode}
                    >
                        <option value="">Select Field</option>
                        <option value="name">Name</option>
                        <option value="studentId">Student ID</option>
                        <option value="dob">DOB</option>
                        <option value="class">Class</option>
                        <option value="email">Email</option>
                        <option value="phone">Phone</option>
                    </select>
                </div>
            </div>
        </div>
    );

    const renderShapesPatternsTab = () => (
        <div>
            <h3 className="text-lg font-semibold mb-2">Shapes & Patterns</h3>
            <div className="grid grid-cols-2 gap-2">
                <button
                    className="bg-blue-600 text-white p-2 rounded hover:bg-blue-700 flex items-center justify-center"
                    onClick={() => addShapeElement('rect')}
                    disabled={isViewMode}
                >
                    <PlusIcon className="h-5 w-5 mr-1" /> Rectangle
                </button>
                <button
                    className="bg-blue-600 text-white p-2 rounded hover:bg-blue-700 flex items-center justify-center"
                    onClick={() => addShapeElement('circle')}
                    disabled={isViewMode}
                >
                    <PlusIcon className="h-5 w-5 mr-1" /> Circle
                </button>
                <button
                    className="bg-blue-600 text-white p-2 rounded hover:bg-blue-700 flex items-center justify-center"
                    onClick={() => addShapeElement('star')}
                    disabled={isViewMode}
                >
                    <PlusIcon className="h-5 w-5 mr-1" /> Star
                </button>
                <button
                    className="bg-blue-600 text-white p-2 rounded hover:bg-blue-700 flex items-center justify-center"
                    onClick={() => addShapeElement('triangle')}
                    disabled={isViewMode}
                >
                    <PlusIcon className="h-5 w-5 mr-1" /> Triangle
                </button>
                <button
                    className="bg-blue-600 text-white p-2 rounded hover:bg-blue-700 flex items-center justify-center"
                    onClick={() => addShapeElement('pentagon')}
                    disabled={isViewMode}
                >
                    <PlusIcon className="h-5 w-5 mr-1" /> Pentagon
                </button>
                <button
                    className="bg-blue-600 text-white p-2 rounded hover:bg-blue-700 flex items-center justify-center"
                    onClick={() => addShapeElement('hexagon')}
                    disabled={isViewMode}
                >
                    <PlusIcon className="h-5 w-5 mr-1" /> Hexagon
                </button>
                <select
                    className="col-span-2 p-2 border rounded bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    onChange={(e) => {
                        const shape = shapes.find(s => s._id === e.target.value);
                        if (shape) addShapeElement('custom', { shapeImage: shape.url, points: shape.points });
                    }}
                    disabled={isViewMode}
                >
                    <option value="">Add Custom Shape</option>
                    {shapes.map(shape => (
                        <option key={shape._id} value={shape._id}>{shape.name}</option>
                    ))}
                </select>
                <input
                    type="file"
                    accept="image/*"
                    className="col-span-2 p-2 border rounded bg-gray-50"
                    onChange={async (e) => {
                        const file = e.target.files[0];
                        if (file) {
                            const name = prompt('Enter shape name:');
                            const shape = await uploadShape(file, name);
                            if (shape) addShapeElement('custom', { shapeImage: shape.url, points: shape.points });
                        }
                    }}
                    disabled={isViewMode}
                />
                <input
                    type="file"
                    accept="image/*"
                    className="col-span-2 p-2 border rounded bg-gray-50"
                    onChange={async (e) => {
                        const file = e.target.files[0];
                        if (file) {
                            const name = prompt('Enter pattern name:');
                            await uploadPattern(file, name);
                        }
                    }}
                    disabled={isViewMode}
                />
            </div>
            <h4 className="text-md font-semibold mt-4 mb-2">Patterns</h4>
            <div className="grid grid-cols-2 gap-2 max-h-96 overflow-y-auto">
                {patterns.map((pattern, index) => (
                    <motion.div
                        key={index}
                        className="w-full h-20 bg-cover rounded cursor-pointer"
                        style={{ backgroundImage: `url(${pattern.url})` }}
                        whileHover={{ scale: 1.05 }}
                        onClick={() => selectedElement !== null && updateElement(selectedElement, { fillPatternImage: pattern.url })}
                    />
                ))}
            </div>
        </div>
    );

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
            className="fixed inset-0 bg-gray-900 bg-opacity-50 flex flex-col"
        >
            <div className="bg-white shadow-md p-4 flex justify-between items-center">
                <input
                    type="text"
                    placeholder="Template Name"
                    className="p-2 border rounded bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 w-1/3"
                    value={templateName}
                    onChange={(e) => setTemplateName(e.target.value)}
                    disabled={isViewMode}
                />
                {!isViewMode && (
                    <div className="flex space-x-2">
                        <button
                            className="bg-blue-600 text-white p-2 rounded hover:bg-blue-700 flex items-center"
                            onClick={saveTemplate}
                        >
                            <PlusIcon className="h-5 w-5 mr-1" />
                            {id ? 'Update' : 'Save'}
                        </button>
                        <button
                            className="bg-yellow-500 text-white p-2 rounded hover:bg-yellow-600 flex items-center"
                            onClick={cloneTemplate}
                        >
                            <PlusIcon className="h-5 w-5 mr-1" /> Clone
                        </button>
                        <button
                            className="bg-red-500 text-white p-2 rounded hover:bg-red-600 flex items-center"
                            onClick={resetCanvas}
                        >
                            <ArrowPathIcon className="h-5 w-5 mr-1" /> Reset
                        </button>
                        <button
                            className="bg-gray-500 text-white p-2 rounded hover:bg-gray-600 flex items-center"
                            onClick={() => navigate('/templates')}
                        >
                            <XCircleIcon className="h-5 w-5 mr-1" /> Close
                        </button>
                    </div>
                )}
            </div>
            <div className="flex flex-1 overflow-hidden">
                <div className="w-80 bg-white p-6 overflow-y-auto shadow-xl rounded-tr-lg">
                    <div className="flex border-b mb-4">
                        <button
                            className={`flex-1 p-2 text-center ${activeTab === 'images' ? 'bg-blue-100 text-blue-600' : 'bg-gray-100'}`}
                            onClick={() => setActiveTab('images')}
                        >
                            Images
                        </button>
                        <button
                            className={`flex-1 p-2 text-center ${activeTab === 'fields' ? 'bg-blue-100 text-blue-600' : 'bg-gray-100'}`}
                            onClick={() => setActiveTab('fields')}
                        >
                            Fields
                        </button>
                        <button
                            className={`flex-1 p-2 text-center ${activeTab === 'shapes' ? 'bg-blue-100 text-blue-600' : 'bg-gray-100'}`}
                            onClick={() => setActiveTab('shapes')}
                        >
                            Shapes/Patterns
                        </button>
                    </div>
                    <div className="mb-6">
                        <h3 className="text-lg font-semibold mb-2">Background</h3>
                        <input
                            type="color"
                            className="w-full h-10 p-1 border rounded mb-2 cursor-pointer"
                            value={backgroundColor}
                            onChange={(e) => setBackgroundColor(e.target.value)}
                            disabled={isViewMode}
                        />
                        <input
                            type="file"
                            accept="image/*"
                            className="w-full p-2 border rounded bg-gray-50 mb-2"
                            onChange={async (e) => {
                                const file = e.target.files[0];
                                if (file) {
                                    const url = await uploadImage(file);
                                    if (url) setBackgroundImage(url);
                                }
                            }}
                            disabled={isViewMode}
                        />
                    </div>
                    <AnimatePresence>
                        {activeTab === 'images' && <motion.div key="images" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>{renderImagesTab()}</motion.div>}
                        {activeTab === 'fields' && <motion.div key="fields" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>{renderFieldsTab()}</motion.div>}
                        {activeTab === 'shapes' && <motion.div key="shapes" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>{renderShapesPatternsTab()}</motion.div>}
                    </AnimatePresence>
                    {selectedElement !== null && elements[selectedElement] && (
                        <div className="mt-6">
                            <h3 className="text-lg font-semibold mb-2">Edit Element</h3>
                            {elements[selectedElement].type === 'text' && (
                                <>
                                    <input
                                        type="text"
                                        placeholder="Text"
                                        className="w-full p-3 border rounded bg-gray-50 mb-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        value={elements[selectedElement].text}
                                        onChange={(e) => updateElement(selectedElement, { text: e.target.value })}
                                        disabled={isViewMode}
                                    />
                                    <select
                                        className="w-full p-3 border rounded bg-gray-50 mb-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        value={elements[selectedElement].dataField || ''}
                                        onChange={(e) => updateElement(selectedElement, { dataField: e.target.value })}
                                        disabled={isViewMode}
                                    >
                                        <option value="">Static Text</option>
                                        <option value="name">Name</option>
                                        <option value="studentId">Student ID</option>
                                        <option value="dob">DOB</option>
                                        <option value="class">Class</option>
                                        <option value="email">Email</option>
                                        <option value="phone">Phone</option>
                                    </select>
                                    <input
                                        type="number"
                                        placeholder="Font Size"
                                        className="w-full p-3 border rounded bg-gray-50 mb-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        value={elements[selectedElement].fontSize}
                                        onChange={(e) => updateElement(selectedElement, { fontSize: parseInt(e.target.value) })}
                                        disabled={isViewMode}
                                    />
                                    <select
                                        className="w-full p-3 border rounded bg-gray-50 mb-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        value={elements[selectedElement].fontFamily}
                                        onChange={(e) => updateElement(selectedElement, { fontFamily: e.target.value })}
                                        disabled={isViewMode}
                                    >
                                        <option value="Arial">Arial</option>
                                        <option value="Inter">Inter</option>
                                        <option value="Helvetica">Helvetica</option>
                                        <option value="Times New Roman">Times New Roman</option>
                                        <option value="Roboto">Roboto</option>
                                        <option value="Montserrat">Montserrat</option>
                                    </select>
                                    <select
                                        className="w-full p-3 border rounded bg-gray-50 mb-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        value={elements[selectedElement].fontStyle}
                                        onChange={(e) => updateElement(selectedElement, { fontStyle: e.target.value })}
                                        disabled={isViewMode}
                                    >
                                        <option value="normal">Normal</option>
                                        <option value="italic">Italic</option>
                                        <option value="bold">Bold</option>
                                        <option value="bold italic">Bold Italic</option>
                                    </select>
                                    <select
                                        className="w-full p-3 border rounded bg-gray-50 mb-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        value={elements[selectedElement].textAlign}
                                        onChange={(e) => updateElement(selectedElement, { textAlign: e.target.value })}
                                        disabled={isViewMode}
                                    >
                                        <option value="left">Left</option>
                                        <option value="center">Center</option>
                                        <option value="right">Right</option>
                                    </select>
                                    <input
                                        type="number"
                                        placeholder="Width"
                                        className="w-full p-3 border rounded bg-gray-50 mb-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        value={elements[selectedElement].width}
                                        onChange={(e) => updateElement(selectedElement, { width: parseInt(e.target.value) })}
                                        disabled={isViewMode}
                                    />
                                    <input
                                        type="number"
                                        placeholder="Height"
                                        className="w-full p-3 border rounded bg-gray-50 mb-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        value={elements[selectedElement].height}
                                        onChange={(e) => updateElement(selectedElement, { height: parseInt(e.target.value) })}
                                        disabled={isViewMode}
                                    />
                                </>
                            )}
                            {(elements[selectedElement].type === 'rect' ||
                                elements[selectedElement].type === 'circle' ||
                                elements[selectedElement].type === 'star' ||
                                elements[selectedElement].type === 'triangle' ||
                                elements[selectedElement].type === 'pentagon' ||
                                elements[selectedElement].type === 'hexagon' ||
                                elements[selectedElement].type === 'custom') && (
                                    <>
                                        <input
                                            type="number"
                                            placeholder="Width"
                                            className="w-full p-3 border rounded bg-gray-50 mb-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            value={elements[selectedElement].width || elements[selectedElement].radius * 2 || 100}
                                            onChange={(e) => updateElement(selectedElement, { width: parseInt(e.target.value), radius: parseInt(e.target.value) / 2 })}
                                            disabled={isViewMode}
                                        />
                                        <input
                                            type="number"
                                            placeholder="Height"
                                            className="w-full p-3 border rounded bg-gray-50 mb-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            value={elements[selectedElement].height || elements[selectedElement].radius * 2 || 100}
                                            onChange={(e) => updateElement(selectedElement, { height: parseInt(e.target.value), radius: parseInt(e.target.value) / 2 })}
                                            disabled={isViewMode}
                                        />
                                    </>
                                )}
                            {elements[selectedElement].type === 'image' && (
                                <>
                                    <input
                                        type="number"
                                        placeholder="Width"
                                        className="w-full p-3 border rounded bg-gray-50 mb-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        value={elements[selectedElement].width}
                                        onChange={(e) => updateElement(selectedElement, { width: parseInt(e.target.value) })}
                                        disabled={isViewMode}
                                    />
                                    <input
                                        type="number"
                                        placeholder="Height"
                                        className="w-full p-3 border rounded bg-gray-50 mb-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        value={elements[selectedElement].height}
                                        onChange={(e) => updateElement(selectedElement, { height: parseInt(e.target.value) })}
                                        disabled={isViewMode}
                                    />
                                    <select
                                        className="w-full p-3 border rounded bg-gray-50 mb-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        value={elements[selectedElement].shapeType || ''}
                                        onChange={(e) => {
                                            const shape = shapes.find(s => s._id === e.target.value) || { type: e.target.value, points: [] };
                                            updateElement(selectedElement, {
                                                shapeType: e.target.value || null,
                                                shapePoints: shape.points || [],
                                                shapeImage: shape.url || null,
                                            });
                                        }}
                                        disabled={isViewMode}
                                    >
                                        <option value="">No Shape Mask</option>
                                        <option value="rect">Rectangle</option>
                                        <option value="circle">Circle</option>
                                        <option value="star">Star</option>
                                        <option value="triangle">Triangle</option>
                                        <option value="pentagon">Pentagon</option>
                                        <option value="hexagon">Hexagon</option>
                                        {shapes.map(shape => (
                                            <option key={shape._id} value={shape._id}>{shape.name}</option>
                                        ))}
                                    </select>
                                </>
                            )}
                            <input
                                type="color"
                                className="w-full h-10 p-1 border rounded mb-2 cursor-pointer"
                                value={elements[selectedElement].fill || '#000000'}
                                onChange={(e) => updateElement(selectedElement, { fill: e.target.value })}
                                disabled={isViewMode || elements[selectedElement].type === 'image'}
                            />
                            <select
                                className="w-full p-3 border rounded bg-gray-50 mb-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                value={elements[selectedElement].fillPatternImage || ''}
                                onChange={(e) => updateElement(selectedElement, { fillPatternImage: e.target.value })}
                                disabled={isViewMode || elements[selectedElement].type === 'image'}
                            >
                                <option value="">No Pattern</option>
                                {patterns.map(pattern => (
                                    <option key={pattern._id} value={pattern.url}>{pattern.name}</option>
                                ))}
                            </select>
                            <input
                                type="color"
                                className="w-full h-10 p-1 border rounded mb-2 cursor-pointer"
                                value={elements[selectedElement].stroke || '#000000'}
                                onChange={(e) => updateElement(selectedElement, { stroke: e.target.value })}
                                disabled={isViewMode || elements[selectedElement].type === 'image'}
                            />
                            <input
                                type="number"
                                placeholder="Stroke Width"
                                className="w-full p-3 border rounded bg-gray-50 mb-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                value={elements[selectedElement].strokeWidth || 0}
                                onChange={(e) => updateElement(selectedElement, { strokeWidth: parseInt(e.target.value) })}
                                disabled={isViewMode || elements[selectedElement].type === 'image'}
                            />
                            <input
                                type="number"
                                placeholder="Rotation"
                                className="w-full p-3 border rounded bg-gray-50 mb-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                value={elements[selectedElement].rotation || 0}
                                onChange={(e) => updateElement(selectedElement, { rotation: parseInt(e.target.value) })}
                                disabled={isViewMode}
                            />
                            <input
                                type="number"
                                placeholder="Opacity (0-1)"
                                className="w-full p-3 border rounded bg-gray-50 mb-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                value={elements[selectedElement].opacity}
                                step="0.1"
                                min="0"
                                max="1"
                                onChange={(e) => updateElement(selectedElement, { opacity: parseFloat(e.target.value) })}
                                disabled={isViewMode}
                            />
                            <input
                                type="color"
                                className="w-full h-10 p-1 border rounded mb-2 cursor-pointer"
                                value={elements[selectedElement].shadowColor || '#000000'}
                                onChange={(e) => updateElement(selectedElement, { shadowColor: e.target.value })}
                                disabled={isViewMode}
                            />
                            <input
                                type="number"
                                placeholder="Shadow Blur"
                                className="w-full p-3 border rounded bg-gray-50 mb-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                value={elements[selectedElement].shadowBlur || 0}
                                onChange={(e) => updateElement(selectedElement, { shadowBlur: parseInt(e.target.value) })}
                                disabled={isViewMode}
                            />
                            <input
                                type="number"
                                placeholder="Shadow Offset X"
                                className="w-full p-3 border rounded bg-gray-50 mb-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                value={elements[selectedElement].shadowOffsetX || 0}
                                onChange={(e) => updateElement(selectedElement, { shadowOffsetX: parseInt(e.target.value) })}
                                disabled={isViewMode}
                            />
                            <input
                                type="number"
                                placeholder="Shadow Offset Y"
                                className="w-full p-3 border rounded bg-gray-50 mb-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                value={elements[selectedElement].shadowOffsetY || 0}
                                onChange={(e) => updateElement(selectedElement, { shadowOffsetY: parseInt(e.target.value) })}
                                disabled={isViewMode}
                            />
                        </div>
                    )}
                </div>
                <div className="flex-1 bg-gray-100 overflow-auto">
                    <div
                        className="flex items-center justify-center p-4"
                        onDragOver={handleDragOver}
                        onDrop={handleDrop}
                    >
                        <Stage
                            width={800}
                            height={600}
                            style={{ border: '2px solid black', background: 'white', boxShadow: '0 4px 12px rgba(0,0,0,0.15)' }}
                            ref={stageRef}
                        >
                            <Layer>
                                <Rect x={0} y={0} width={800} height={600} fill={backgroundColor} />
                                {bgImage && <KonvaImage image={bgImage} x={0} y={0} width={800} height={600} />}
                                {elements.map((element, index) => {
                                    const patternImage = element.fillPatternImage ? new window.Image() : null;
                                    if (element.fillPatternImage) patternImage.src = element.fillPatternImage;
                                    const img = elementImages[index] || null;
                                    const isSelected = selectedElement === index && !isViewMode;

                                    const getElementDimensions = () => {
                                        if (element.type === 'circle') {
                                            return { width: element.radius * 2, height: element.radius * 2 };
                                        }
                                        return { width: element.width || 100, height: element.height || 100 };
                                    };

                                    const { width, height } = getElementDimensions();

                                    const renderShape = () => {
                                        const commonProps = {
                                            id: `element-${index}`,
                                            x: element.x,
                                            y: element.y,
                                            rotation: element.rotation,
                                            opacity: element.opacity,
                                            shadowColor: element.shadowColor,
                                            shadowBlur: element.shadowBlur,
                                            shadowOffsetX: element.shadowOffsetX,
                                            shadowOffsetY: element.shadowOffsetY,
                                            draggable: !isViewMode,
                                            onClick: (e) => handleSelectElement(index, e.target),
                                            onTap: (e) => handleSelectElement(index, e.target),
                                            onDragEnd: (e) => !isViewMode && updateElement(index, { x: e.target.x(), y: e.target.y() }),
                                            onTransformEnd: (e) => {
                                                if (!isViewMode) {
                                                    const node = e.target;
                                                    const scaleX = node.scaleX();
                                                    const scaleY = node.scaleY();
                                                    const newProps = {
                                                        x: node.x(),
                                                        y: node.y(),
                                                        rotation: node.rotation(),
                                                        scaleX: 1,
                                                        scaleY: 1,
                                                    };
                                                    if (element.type === 'circle') {
                                                        newProps.radius = Math.max(10, (element.radius || 50) * scaleX);
                                                        newProps.width = newProps.radius * 2;
                                                        newProps.height = newProps.radius * 2;
                                                    } else if (element.type === 'star') {
                                                        newProps.innerRadius = Math.max(10, (element.innerRadius || 25) * scaleX);
                                                        newProps.outerRadius = Math.max(20, (element.outerRadius || 50) * scaleX);
                                                        newProps.width = newProps.outerRadius * 2;
                                                        newProps.height = newProps.outerRadius * 2;
                                                    } else {
                                                        newProps.width = Math.max(20, (element.width || 100) * scaleX);
                                                        newProps.height = Math.max(20, (element.height || 100) * scaleY);
                                                    }
                                                    updateElement(index, newProps);
                                                }
                                            },
                                        };

                                        if (element.type === 'text') {
                                            return (
                                                <Text
                                                    {...commonProps}
                                                    text={element.text}
                                                    fontSize={element.fontSize}
                                                    fontFamily={element.fontFamily}
                                                    fontStyle={element.fontStyle}
                                                    textAlign={element.textAlign}
                                                    fill={element.fill}
                                                    width={element.width}
                                                    height={element.height}
                                                />
                                            );
                                        } else if (element.type === 'rect') {
                                            return (
                                                <Rect
                                                    {...commonProps}
                                                    width={element.width}
                                                    height={element.height}
                                                    fill={element.fill}
                                                    fillPatternImage={patternImage}
                                                    fillPatternRepeat={element.fillPatternRepeat || 'repeat'}
                                                    stroke={element.stroke}
                                                    strokeWidth={element.strokeWidth}
                                                />
                                            );
                                        } else if (element.type === 'circle') {
                                            return (
                                                <Circle
                                                    {...commonProps}
                                                    radius={element.radius}
                                                    fill={element.fill}
                                                    fillPatternImage={patternImage}
                                                    fillPatternRepeat={element.fillPatternRepeat || 'repeat'}
                                                    stroke={element.stroke}
                                                    strokeWidth={element.strokeWidth}
                                                />
                                            );
                                        } else if (element.type === 'star') {
                                            return (
                                                <Star
                                                    {...commonProps}
                                                    numPoints={5}
                                                    innerRadius={element.innerRadius}
                                                    outerRadius={element.outerRadius}
                                                    fill={element.fill}
                                                    fillPatternImage={patternImage}
                                                    fillPatternRepeat={element.fillPatternRepeat || 'repeat'}
                                                    stroke={element.stroke}
                                                    strokeWidth={element.strokeWidth}
                                                />
                                            );
                                        } else if (['triangle', 'pentagon', 'hexagon', 'custom'].includes(element.type)) {
                                            return (
                                                <Path
                                                    {...commonProps}
                                                    data={element.points.reduce((acc, val, i) => {
                                                        if (i % 2 === 0) return acc + `L${val},${element.points[i + 1]} `;
                                                        return acc;
                                                    }, 'M') + 'Z'}
                                                    fill={element.fill}
                                                    fillPatternImage={patternImage}
                                                    fillPatternRepeat={element.fillPatternRepeat || 'repeat'}
                                                    stroke={element.stroke}
                                                    strokeWidth={element.strokeWidth}
                                                />
                                            );
                                        } else if (element.type === 'image' && img) {
                                            if (element.shapeType && ['rect', 'circle', 'star', 'triangle', 'pentagon', 'hexagon'].includes(element.shapeType)) {
                                                let clipFunc;
                                                if (element.shapeType === 'rect') {
                                                    clipFunc = (ctx) => {
                                                        ctx.rect(-element.width / 2, -element.height / 2, element.width, element.height);
                                                    };
                                                } else if (element.shapeType === 'circle') {
                                                    clipFunc = (ctx) => {
                                                        ctx.arc(0, 0, element.width / 2, 0, Math.PI * 2);
                                                    };
                                                } else if (element.shapeType === 'star') {
                                                    clipFunc = (ctx) => {
                                                        const innerRadius = element.width / 4;
                                                        const outerRadius = element.width / 2;
                                                        ctx.beginPath();
                                                        for (let i = 0; i < 10; i++) {
                                                            const angle = (Math.PI / 5) * i - Math.PI / 2;
                                                            const r = i % 2 === 0 ? outerRadius : innerRadius;
                                                            ctx.lineTo(r * Math.cos(angle), r * Math.sin(angle));
                                                        }
                                                        ctx.closePath();
                                                    };
                                                } else if (['triangle', 'pentagon', 'hexagon'].includes(element.shapeType)) {
                                                    const sides = element.shapeType === 'triangle' ? 3 : element.shapeType === 'pentagon' ? 5 : 6;
                                                    const r = element.width / 2;
                                                    clipFunc = (ctx) => {
                                                        ctx.beginPath();
                                                        for (let i = 0; i < sides; i++) {
                                                            const angle = (2 * Math.PI * i) / sides - Math.PI / 2;
                                                            ctx.lineTo(r * Math.cos(angle), r * Math.sin(angle));
                                                        }
                                                        ctx.closePath();
                                                    };
                                                }
                                                return (
                                                    <KonvaImage
                                                        {...commonProps}
                                                        image={img}
                                                        width={element.width}
                                                        height={element.height}
                                                        clipFunc={clipFunc}
                                                    />
                                                );
                                            } else if (element.shapeType && element.shapeImage && elementImages[index]) {
                                                return (
                                                    <KonvaImage
                                                        {...commonProps}
                                                        image={img}
                                                        width={element.width}
                                                        height={element.height}
                                                        clipFunc={(ctx) => {
                                                            ctx.drawImage(elementImages[index], -element.width / 2, -element.height / 2, element.width, element.height);
                                                        }}
                                                    />
                                                );
                                            }
                                            return (
                                                <KonvaImage
                                                    {...commonProps}
                                                    image={img}
                                                    width={element.width}
                                                    height={element.height}
                                                />
                                            );
                                        }
                                        return null;
                                    };

                                    return (
                                        <Group key={index}>
                                            {renderShape()}
                                            {isSelected && (
                                                <Rect
                                                    x={element.x - width / 2}
                                                    y={element.y - height / 2}
                                                    width={width}
                                                    height={height}
                                                    stroke="blue"
                                                    strokeWidth={2}
                                                    dash={[5, 5]}
                                                    cornerRadius={4}
                                                    listening={false}
                                                />
                                            )}
                                            {isSelected && (
                                                <Group
                                                    x={element.x + width / 2 - 12}
                                                    y={element.y - height / 2 - 12}
                                                    onClick={() => removeElement(index)}
                                                    onTap={() => removeElement(index)}
                                                >
                                                    <Rect
                                                        width={24}
                                                        height={24}
                                                        fill="red"
                                                        cornerRadius={12}
                                                    />
                                                    <XCircleIcon
                                                        className="text-white"
                                                        style={{
                                                            position: 'absolute',
                                                            top: 0,
                                                            left: 0,
                                                            width: 24,
                                                            height: 24,
                                                            cursor: 'pointer',
                                                        }}
                                                    />
                                                </Group>
                                            )}
                                        </Group>
                                    );
                                })}
                                {!isViewMode && (
                                    <Transformer
                                        ref={transformerRef}
                                        rotateEnabled={true}
                                        boundBoxFunc={(oldBox, newBox) => {
                                            if (newBox.width < 20 || newBox.height < 20) {
                                                return oldBox;
                                            }
                                            return newBox;
                                        }}
                                    />
                                )}
                            </Layer>
                        </Stage>
                    </div>
                </div>
            </div>
        </motion.div>
    );
}

export default TemplateEditor;