
import React, { useEffect, useState } from 'react';
import { Stage, Layer, Rect, Text, Image as KonvaImage, Path } from 'react-konva';
import useImage from 'use-image';

function TemplatePreview({ template, width = 400, height = 300, studentData = {} }) {
    const [backgroundImage] = useImage(template?.background?.image || '');
    const [elementImages, setElementImages] = useState({});

    useEffect(() => {
        const loadImages = async () => {
            const images = {};
            for (const [index, element] of template?.elements?.entries() || []) {
                if (element.type === 'image' && element.image) {
                    const [img] = await useImage(element.image, 'Anonymous');
                    images[index] = img;
                }
            }
            setElementImages(images);
        };
        loadImages();
    }, [template]);

    if (!template) return <div className="text-gray-700">No template selected</div>;

    return (
        <Stage width={width} height={height} className="border-2 border-gray-300 rounded-lg shadow-md">
            <Layer>
                <Rect
                    x={0}
                    y={0}
                    width={width}
                    height={height}
                    fill={template.background?.color || 'white'}
                />
                {backgroundImage && (
                    <KonvaImage image={backgroundImage} x={0} y={0} width={width} height={height} />
                )}
                {template.elements?.map((element, index) => {
                    const commonProps = {
                        x: element.x,
                        y: element.y,
                        rotation: element.rotation || 0,
                        opacity: element.opacity || 1,
                        shadowColor: element.shadowColor,
                        shadowBlur: element.shadowBlur,
                        shadowOffsetX: element.shadowOffsetX,
                        shadowOffsetY: element.shadowOffsetY,
                    };

                    if (element.type === 'text') {
                        return (
                            <Text
                                key={index}
                                {...commonProps}
                                text={element.dataField ? studentData[element.dataField] || element.text : element.text}
                                fontSize={element.fontSize}
                                fontFamily={element.fontFamily}
                                fontStyle={element.fontStyle}
                                align={element.textAlign}
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
                                width={element.width}
                                height={element.height}
                                fill={element.fill}
                                fillPatternImage={element.fillPatternImage}
                                fillPatternRepeat={element.fillPatternRepeat || 'repeat'}
                                stroke={element.stroke}
                                strokeWidth={element.strokeWidth}
                            />
                        );
                    } else if (element.type === 'image' && elementImages[index]) {
                        return (
                            <KonvaImage
                                key={index}
                                {...commonProps}
                                image={elementImages[index]}
                                width={element.width}
                                height={element.height}
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
                                fillPatternImage={element.fillPatternImage}
                                fillPatternRepeat={element.fillPatternRepeat || 'repeat'}
                                stroke={element.stroke}
                                strokeWidth={element.strokeWidth}
                            />
                        );
                    }
                    return null;
                })}
            </Layer>
        </Stage>
    );
}

export default TemplatePreview;
