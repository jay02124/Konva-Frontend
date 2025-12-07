
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { api } from '../utils/api';
import { Stage, Layer, Rect, Text, Image as KonvaImage, Circle, Star, Group, Transformer, Path } from 'react-konva';
import 'konva/lib/shapes/Path';
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
    const [flashMessage, setFlashMessage] = useState(null);
    const transformerRef = useRef(null);
    const stageRef = useRef(null);
    const [elementImages, setElementImages] = useState({});
    const [loadedUrls, setLoadedUrls] = useState(new Set());

    const imageUrls = useMemo(() => {
        return elements.reduce((acc, element, index) => {
            if ((element.type === 'image' || element.type === 'custom') && (element.image || element.shapeImage)) {
                acc[index] = element.image || element.shapeImage;
            }
            return acc;
        }, {});
    }, [elements]);

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
            } else if (elementImages[index]) {
                newImages[index] = elementImages[index];
            }
        });

        if (hasNewImages) {
            setElementImages(prev => ({ ...prev, ...newImages }));
            setLoadedUrls(prev => new Set([...prev, ...Object.values(imageUrls)]));
        }
    }, [imageUrls, loadedUrls, elementImages]);

    useEffect(() => {
        if (id) {
            api.get(`/api/templates/${id}`)
                .then(response => {
                    const template = response.data;
                    setTemplateName(template.name || '');
                    setElements(template.elements || []);
                    setBackgroundColor(template.background?.color || 'white');
                    setBackgroundImage(template.background?.image || '');
                })
                .catch(error => {
                    console.error('Error fetching template:', error);
                    setFlashMessage({ type: 'error', text: 'Failed to load template' });
                });
        }
        api.get('/api/patterns')
            .then(response => setPatterns(response.data))
            .catch(error => console.error('Error fetching patterns:', error));
        api.get('/api/shapes')
            .then(response => setShapes(response.data))
            .catch(error => console.error('Error fetching shapes:', error));
        api.get('/api/uploads/images')
            .then(response => setUploadedImages(response.data))
            .catch(error => console.error('Error fetching uploaded images:', error));
    }, [id]);

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
            const response = await api.get('https://api.unsplash.com/search/photos', {
                params: { query: searchQuery, per_page: 10 },
                headers: { Authorization: `Client-ID ${import.meta.env.VITE_UNSPLASH_ACCESS_KEY}` },
            });
            const images = await Promise.all(response.data.results.map(async (img) => {
                const result = await api.post('/api/uploads/image', { file: img.urls.regular });
                return { url: result.data.url, name: img.description || 'Image' };
            }));
            setOnlineImages(images);
            setUploadedImages(prev => [...prev, ...images]);
        } catch (error) {
            console.error('Error searching images:', error);
            setFlashMessage({ type: 'error', text: 'Failed to search images' });
        }
    };

    const uploadImage = async (file) => {
        const formData = new FormData();
        formData.append('file', file);
        try {
            const response = await api.post('/api/uploads/image', formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });
            const newImage = { url: response.data.url, name: file.name };
            setUploadedImages(prev => [...prev, newImage]);
            return response.data.url;
        } catch (error) {
            console.error('Error uploading image:', error);
            setFlashMessage({ type: 'error', text: 'Failed to upload image' });
            return null;
        }
    };

    const uploadPattern = async (file, name) => {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('name', name || file.name);
        try {
            const response = await api.post('/api/patterns', formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });
            setPatterns(prev => [...prev, response.data]);
            return response.data.url;
        } catch (error) {
            console.error('Error uploading pattern:', error);
            setFlashMessage({ type: 'error', text: 'Failed to upload pattern' });
            return null;
        }
    };

    const uploadShape = async (file, name, points = []) => {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('name', name || file.name);
        formData.append('points', JSON.stringify(points));
        try {
            const response = await api.post('/api/shapes', formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });
            setShapes(prev => [...prev, response.data]);
            return response.data;
        } catch (error) {
            console.error('Error uploading shape:', error);
            setFlashMessage({ type: 'error', text: 'Failed to upload shape' });
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
            align: 'left',
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
        navigate('/editor');
    };

    const saveTemplate = async () => {
        if (!templateName) {
            setFlashMessage({ type: 'error', text: 'Please enter a template name' });
            return;
        }
        try {
            const template = {
                name: templateName,
                elements,
                background: { color: backgroundColor, image: backgroundImage },
            };
            if (id) {
                await api.put(`/api/templates/${id}`, template);
                setFlashMessage({ type: 'success', text: 'Template updated successfully' });
            } else {
                await api.post('/api/templates', template);
                setFlashMessage({ type: 'success', text: 'Template created successfully' });
            }
            navigate('/templates');
        } catch (error) {
            console.error('Error saving template:', error);
            setFlashMessage({ type: 'error', text: 'Failed to save template' });
        }
    };

    const cloneTemplate = async () => {
        if (!templateName) {
            setFlashMessage({ type: 'error', text: 'Please enter a template name for the cloned template' });
            return;
        }
        try {
            const template = {
                name: `${templateName} (Copy)`,
                elements,
                background: { color: backgroundColor, image: backgroundImage },
            };
            await api.post('/api/templates', template);
            setFlashMessage({ type: 'success', text: 'Template cloned successfully' });
            navigate('/templates');
        } catch (error) {
            console.error('Error cloning template:', error);
            setFlashMessage({ type: 'error', text: 'Failed to clone template' });
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
            <h3 className="text-lg font-semibold mb-2 text-gray-800">Images</h3>
            <input
                type="file"
                accept="image/*"
                className="w-full p-2 border rounded bg-gray-50 mb-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
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
                className="w-full p-3 border rounded bg-gray-50 mb-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                disabled={isViewMode}
            />
            <button
                className="w-full bg-[#1d4ed8] text-white p-2 rounded hover:bg-[#2563eb] flex items-center justify-center mb-2 disabled:bg-gray-400 disabled:cursor-not-allowed"
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
            <h3 className="text-lg font-semibold mb-2 text-gray-800">Fields</h3>
            <button
                className="w-full bg-[#] text-white p-2 rounded hover:bg-[#2563eb] flex items-center justify-center mb-2 disabled:bg-gray-400 disabled:cursor-not-allowed"
                onClick={addTextElement}
                disabled={isViewMode}
            >
                <PlusIcon className="h-5 w-5 mr-1" /> Add Text
            </button>
            <div className="space-y-2">
                <div>
                    <label className="text-sm font-medium text-gray-700">Static Text</label>
                    <input
                        type="text"
                        placeholder="Enter text"
                        className="w-full p-2 border rounded bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary-500"
                        onChange={(e) => addTextElement({ text: e.target.value })}
                        disabled={isViewMode}
                    />
                </div>
                <div>
                    <label className="text-sm font-medium text-gray-700">Dynamic Field</label>
                    <select
                        className="w-full p-2 border rounded bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary-500"
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
            <h3 className="text-lg font-semibold mb-2 text-gray-800">Shapes & Patterns</h3>
            <div className="grid grid-cols-2 gap-2">
                <button
                    className="bg-[#] text-white p-2 rounded hover:bg-[#2563eb] flex items-center justify-center disabled:bg-gray-400 disabled:cursor-not-allowed"
                    onClick={() => addShapeElement('rect')}
                    disabled={isViewMode}
                >
                    <PlusIcon className="h-5 w-5 mr-1" /> Rectangle
                </button>
                <button
                    className="bg-[#] text-white p-2 rounded hover:bg-[#2563eb] flex items-center justify-center disabled:bg-gray-400 disabled:cursor-not-allowed"
                    onClick={() => addShapeElement('circle')}
                    disabled={isViewMode}
                >
                    <PlusIcon className="h-5 w-5 mr-1" /> Circle
                </button>
                <button
                    className="bg-[#] text-white p-2 rounded hover:bg-[#2563eb] flex items-center justify-center disabled:bg-gray-400 disabled:cursor-not-allowed"
                    onClick={() => addShapeElement('star')}
                    disabled={isViewMode}
                >
                    <PlusIcon className="h-5 w-5 mr-1" /> Star
                </button>
                <button
                    className="bg-[#] text-white p-2 rounded hover:bg-[#2563eb] flex items-center justify-center disabled:bg-gray-400 disabled:cursor-not-allowed"
                    onClick={() => addShapeElement('triangle')}
                    disabled={isViewMode}
                >
                    <PlusIcon className="h-5 w-5 mr-1" /> Triangle
                </button>
                <button
                    className="bg-[#] text-white p-2 rounded hover:bg-[#2563eb] flex items-center justify-center disabled:bg-gray-400 disabled:cursor-not-allowed"
                    onClick={() => addShapeElement('pentagon')}
                    disabled={isViewMode}
                >
                    <PlusIcon className="h-5 w-5 mr-1" /> Pentagon
                </button>
                <button
                    className="bg-[#] text-white p-2 rounded hover:bg-[#2563eb] flex items-center justify-center disabled:bg-gray-400 disabled:cursor-not-allowed"
                    onClick={() => addShapeElement('hexagon')}
                    disabled={isViewMode}
                >
                    <PlusIcon className="h-5 w-5 mr-1" /> Hexagon
                </button>
                <select
                    className="col-span-2 p-2 border rounded bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary-500"
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
            <h4 className="text-md font-semibold mt-4 mb-2 text-gray-800">Patterns</h4>
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
            <select
                className="w-full p-3 border rounded bg-gray-50 mt-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
                value={elements[selectedElement]?.fillPatternImage || ''}
                onChange={(e) => updateElement(selectedElement, { fillPatternImage: e.target.value })}
                disabled={isViewMode || !selectedElement || elements[selectedElement]?.type === 'image'}
            >
                <option value="">No Pattern</option>
                {patterns.map(pattern => (
                    <option key={pattern._id} value={pattern.url}>{pattern.name}</option>
                ))}
            </select>
        </div>
    );

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
            className="fixed inset-0 bg-gray-900 bg-opacity-50 flex flex-col"
        >
            {flashMessage && (
                <div
                    className={`absolute top-4 left-1/2 transform -translate-x-1/2 p-4 rounded-lg text-white ${flashMessage.type === 'success' ? 'bg-green-600' : 'bg-red-600'
                        }`}
                >
                    {flashMessage.text}
                </div>
            )}
            <div className="bg-white shadow-lg p-4 flex justify-between items-center">
                <input
                    type="text"
                    placeholder="Template Name"
                    className="p-2 border rounded bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary-500 w-1/3"
                    value={templateName}
                    onChange={(e) => setTemplateName(e.target.value)}
                    disabled={isViewMode}
                />
                {!isViewMode && (
                    <div className="flex space-x-2">
                        <button
                            className="bg-[#] text-white p-2 rounded hover:bg-[#2563eb] flex items-center disabled:bg-gray-400 disabled:cursor-not-allowed"
                            onClick={saveTemplate}
                        >
                            <PlusIcon className="h-5 w-5 mr-1" />
                            {id ? 'Update' : 'Save'}
                        </button>
                        <button
                            className="bg-yellow-500 text-white p-2 rounded hover:bg-yellow-600 flex items-center disabled:bg-gray-400 disabled:cursor-not-allowed"
                            onClick={cloneTemplate}
                        >
                            <PlusIcon className="h-5 w-5 mr-1" /> Clone
                        </button>
                        <button
                            className="bg-green-500 text-white p-2 rounded hover:bg-green-600 flex items-center disabled:bg-gray-400 disabled:cursor-not-allowed"
                            onClick={resetCanvas}
                        >
                            <PlusIcon className="h-5 w-5 mr-1" /> New Template
                        </button>
                        <button
                            className="bg-red-500 text-white p-2 rounded hover:bg-red-600 flex items-center disabled:bg-gray-400 disabled:cursor-not-allowed"
                            onClick={resetCanvas}
                        >
                            <ArrowPathIcon className="h-5 w-5 mr-1" /> Reset
                        </button>
                        <button
                            className="bg-gray-500 text-white p-2 rounded hover:bg-gray-600 flex items-center disabled:bg-gray-400 disabled:cursor-not-allowed"
                            onClick={() => navigate('/templates')}
                        >
                            <XCircleIcon className="h-5 w-5 mr-1" /> Close
                        </button>
                    </div>
                )}
            </div>
            <div className="flex flex-1 overflow-hidden">
                <div className="w-80 bg-white p-6 overflow-y-auto shadow-lg rounded-tr-lg">
                    <div className="flex border-b mb-4">
                        <button
                            className={`flex-1 p-2 text-center ${activeTab === 'images' ? 'bg-primary-100 text-primary-600' : 'bg-gray-100 text-gray-700'}`}
                            onClick={() => setActiveTab('images')}
                        >
                            Images
                        </button>
                        <button
                            className={`flex-1 p-2 text-center ${activeTab === 'fields' ? 'bg-primary-100 text-primary-600' : 'bg-gray-100 text-gray-700'}`}
                            onClick={() => setActiveTab('fields')}
                        >
                            Fields
                        </button>
                        <button
                            className={`flex-1 p-2 text-center ${activeTab === 'shapes' ? 'bg-primary-100 text-primary-600' : 'bg-gray-100 text-gray-700'}`}
                            onClick={() => setActiveTab('shapes')}
                        >
                            Shapes/Patterns
                        </button>
                    </div>
                    <div className="mb-6">
                        <h3 className="text-lg font-semibold mb-2 text-gray-800">Background</h3>
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
                            className="w-full p-2 border rounded bg-gray-50 mb-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
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
                            <h3 className="text-lg font-semibold mb-2 text-gray-800">Edit Element</h3>
                            {elements[selectedElement].type === 'text' && (
                                <>
                                    <input
                                        type="text"
                                        placeholder="Text"
                                        className="w-full p-3 border rounded bg-gray-50 mb-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
                                        value={elements[selectedElement].text}
                                        onChange={(e) => updateElement(selectedElement, { text: e.target.value })}
                                        disabled={isViewMode}
                                    />
                                    <select
                                        className="w-full p-3 border rounded bg-gray-50 mb-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
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
                                        className="w-full p-3 border rounded bg-gray-50 mb-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
                                        value={elements[selectedElement].fontSize}
                                        onChange={(e) => updateElement(selectedElement, { fontSize: parseInt(e.target.value) })}
                                        disabled={isViewMode}
                                    />
                                    <select
                                        className="w-full p-3 border rounded bg-gray-50 mb-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
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
                                        className="w-full p-3 border rounded bg-gray-50 mb-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
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
                                        className="w-full p-3 border rounded bg-gray-50 mb-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
                                        value={elements[selectedElement].align}
                                        onChange={(e) => updateElement(selectedElement, { align: e.target.value })}
                                        disabled={isViewMode}
                                    >
                                        <option value="left">Left</option>
                                        <option value="center">Center</option>
                                        <option value="right">Right</option>
                                    </select>
                                    <input
                                        type="number"
                                        placeholder="Width"
                                        className="w-full p-3 border rounded bg-gray-50 mb-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
                                        value={elements[selectedElement].width}
                                        onChange={(e) => updateElement(selectedElement, { width: parseInt(e.target.value) })}
                                        disabled={isViewMode}
                                    />
                                    <input
                                        type="number"
                                        placeholder="Height"
                                        className="w-full p-3 border rounded bg-gray-50 mb-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
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
                                            className="w-full p-3 border rounded bg-gray-50 mb-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
                                            value={elements[selectedElement].width || elements[selectedElement].radius * 2 || 100}
                                            onChange={(e) => updateElement(selectedElement, { width: parseInt(e.target.value), radius: parseInt(e.target.value) / 2 })}
                                            disabled={isViewMode}
                                        />
                                        <input
                                            type="number"
                                            placeholder="Height"
                                            className="w-full p-3 border rounded bg-gray-50 mb-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
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
                                        className="w-full p-3 border rounded bg-gray-50 mb-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
                                        value={elements[selectedElement].width}
                                        onChange={(e) => updateElement(selectedElement, { width: parseInt(e.target.value) })}
                                        disabled={isViewMode}
                                    />
                                    <input
                                        type="number"
                                        placeholder="Height"
                                        className="w-full p-3 border rounded bg-gray-50 mb-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
                                        value={elements[selectedElement].height}
                                        onChange={(e) => updateElement(selectedElement, { height: parseInt(e.target.value) })}
                                        disabled={isViewMode}
                                    />
                                    <select
                                        className="w-full p-3 border rounded bg-gray-50 mb-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
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
                                className="w-full p-3 border rounded bg-gray-50 mb-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
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
                                className="w-full p-3 border rounded bg-gray-50 mb-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
                                value={elements[selectedElement].strokeWidth || 0}
                                onChange={(e) => updateElement(selectedElement, { strokeWidth: parseInt(e.target.value) })}
                                disabled={isViewMode || elements[selectedElement].type === 'image'}
                            />
                            <input
                                type="number"
                                placeholder="Rotation"
                                className="w-full p-3 border rounded bg-gray-50 mb-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
                                value={elements[selectedElement].rotation || 0}
                                onChange={(e) => updateElement(selectedElement, { rotation: parseInt(e.target.value) })}
                                disabled={isViewMode}
                            />
                            <input
                                type="number"
                                placeholder="Opacity (0-1)"
                                className="w-full p-3 border rounded bg-gray-50 mb-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
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
                                className="w-full p-3 border rounded bg-gray-50 mb-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
                                value={elements[selectedElement].shadowBlur || 0}
                                onChange={(e) => updateElement(selectedElement, { shadowBlur: parseInt(e.target.value) })}
                                disabled={isViewMode}
                            />
                            <input
                                type="number"
                                placeholder="Shadow Offset X"
                                className="w-full p-3 border rounded bg-gray-50 mb-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
                                value={elements[selectedElement].shadowOffsetX || 0}
                                onChange={(e) => updateElement(selectedElement, { shadowOffsetX: parseInt(e.target.value) })}
                                disabled={isViewMode}
                            />
                            <input
                                type="number"
                                placeholder="Shadow Offset Y"
                                className="w-full p-3 border rounded bg-gray-50 mb-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
                                value={elements[selectedElement].shadowOffsetY || 0}
                                onChange={(e) => updateElement(selectedElement, { shadowOffsetY: parseInt(e.target.value) })}
                                disabled={isViewMode}
                            />
                            <button
                                className="w-full bg-red-600 text-white p-2 rounded hover:bg-red-700 flex items-center justify-center disabled:bg-gray-400 disabled:cursor-not-allowed"
                                onClick={() => removeElement(selectedElement)}
                                disabled={isViewMode}
                            >
                                <XCircleIcon className="h-5 w-5 mr-1" /> Remove Element
                            </button>
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
                            className="border-2 border-black bg-white shadow-lg"
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
                                                        newProps.innerRadius = Math.max(5, (element.innerRadius || 25) * scaleX);
                                                        newProps.outerRadius = Math.max(10, (element.outerRadius || 50) * scaleX);
                                                        newProps.width = newProps.outerRadius * 2;
                                                        newProps.height = newProps.outerRadius * 2;
                                                    } else if (['triangle', 'pentagon', 'hexagon', 'custom'].includes(element.type)) {
                                                        newProps.points = element.points.map((point, i) =>
                                                            i % 2 === 0 ? point * scaleX : point * scaleY
                                                        );
                                                        newProps.width = (element.width || 100) * scaleX;
                                                        newProps.height = (element.height || 100) * scaleY;
                                                    } else {
                                                        newProps.width = (element.width || 100) * scaleX;
                                                        newProps.height = (element.height || 100) * scaleY;
                                                    }
                                                    updateElement(index, newProps);
                                                    node.scaleX(1);
                                                    node.scaleY(1);
                                                }
                                            },
                                        };

                                        if (element.type === 'text') {
                                            return (
                                                <Text
                                                    key={index}
                                                    {...commonProps}
                                                    text={element.text}
                                                    fontSize={element.fontSize}
                                                    fontFamily={element.fontFamily}
                                                    fontStyle={element.fontStyle}
                                                    align={element.align}
                                                    fill={element.fill}
                                                    width={element.width}
                                                    height={element.height}
                                                />
                                            );
                                        } else if (element.type === 'rect') {
                                            return (
                                                <Rect
                                                    key={index}
                                                    {...commonProps}
                                                    width={width}
                                                    height={height}
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
                                                    key={index}
                                                    {...commonProps}
                                                    radius={element.radius || 50}
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
                                                    key={index}
                                                    {...commonProps}
                                                    numPoints={element.numPoints || 5}
                                                    innerRadius={element.innerRadius || 25}
                                                    outerRadius={element.outerRadius || 50}
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
                                                    key={index}
                                                    {...commonProps}
                                                    data={element.points?.reduce((acc, val, i) => {
                                                        if (i % 2 === 0) return acc + `L${val},${element.points[i + 1]} `;
                                                        return acc;
                                                    }, 'M') + 'Z'}
                                                    fill={element.fill}
                                                    fillPatternImage={element.shapeImage || patternImage}
                                                    fillPatternRepeat={element.fillPatternRepeat || 'repeat'}
                                                    stroke={element.stroke}
                                                    strokeWidth={element.strokeWidth}
                                                />
                                            );
                                        } else if (element.type === 'image' && img) {
                                            const imageProps = {
                                                key: index,
                                                ...commonProps,
                                                image: img,
                                                width: width,
                                                height: height,
                                            };
                                            if (element.shapeType && element.shapePoints && element.shapeType !== 'rect') {
                                                return (
                                                    <Group
                                                        {...commonProps}
                                                        clipFunc={(ctx) => {
                                                            if (element.shapeType === 'circle') {
                                                                ctx.arc(0, 0, element.width / 2, 0, Math.PI * 2, false);
                                                            } else if (element.shapeType === 'star') {
                                                                const innerRadius = (element.width / 2) * 0.5;
                                                                const outerRadius = element.width / 2;
                                                                const numPoints = 5;
                                                                for (let i = 0; i < numPoints * 2; i++) {
                                                                    const radius = i % 2 === 0 ? outerRadius : innerRadius;
                                                                    const angle = (Math.PI / numPoints) * i;
                                                                    const x = radius * Math.cos(angle);
                                                                    const y = radius * Math.sin(angle);
                                                                    if (i === 0) ctx.moveTo(x, y);
                                                                    else ctx.lineTo(x, y);
                                                                }
                                                                ctx.closePath();
                                                            } else {
                                                                ctx.beginPath();
                                                                element.shapePoints.forEach((point, i) => {
                                                                    if (i % 2 === 0) {
                                                                        if (i === 0) ctx.moveTo(point, element.shapePoints[i + 1]);
                                                                        else ctx.lineTo(point, element.shapePoints[i + 1]);
                                                                    }
                                                                });
                                                                ctx.closePath();
                                                            }
                                                        }}
                                                    >
                                                        <KonvaImage {...imageProps} />
                                                    </Group>
                                                );
                                            }
                                            return <KonvaImage {...imageProps} />;
                                        }
                                        return null;
                                    };

                                    return (
                                        <React.Fragment key={index}>
                                            {renderShape()}
                                        </React.Fragment>
                                    );
                                })}
                            </Layer>
                            {!isViewMode && <Layer><Transformer ref={transformerRef} /></Layer>}
                        </Stage>
                    </div>
                </div>
            </div>
        </motion.div>
    );
}

export default TemplateEditor;
