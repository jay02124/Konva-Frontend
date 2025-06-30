import React from 'react';
import { Stage, Layer, Rect, Text, Image as KonvaImage, Circle, Star } from 'react-konva';
import useImage from 'use-image';

function TemplatePreview({ template }) {
    const [bgImage] = useImage(template.background.image);

    return (
        <Stage width={200} height={150} style={{ border: '1px solid gray' }}>
            <Layer>
                <Rect x={0} y={0} width={200} height={150} fill={template.background.color} />
                {bgImage && <KonvaImage image={bgImage} x={0} y={0} width={200} height={150} />}
                {template.elements.map((element, index) => {
                    const patternImage = element.fillPatternImage ? new window.Image() : null;
                    if (element.fillPatternImage) patternImage.src = element.fillPatternImage;

                    if (element.type === 'text') {
                        return (
                            <Text
                                key={index}
                                x={element.x / 4}
                                y={element.y / 4}
                                text={element.text}
                                fontSize={element.fontSize / 4}
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
                                x={element.x / 4}
                                y={element.y / 4}
                                width={element.width / 4}
                                height={element.height / 4}
                                fill={element.fill}
                                fillPatternImage={patternImage}
                                fillPatternRepeat={element.fillPatternRepeat}
                                stroke={element.stroke}
                                strokeWidth={element.strokeWidth / 4}
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
                                x={element.x / 4}
                                y={element.y / 4}
                                radius={element.radius / 4}
                                fill={element.fill}
                                fillPatternImage={patternImage}
                                fillPatternRepeat={element.fillPatternRepeat}
                                stroke={element.stroke}
                                strokeWidth={element.strokeWidth / 4}
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
                                x={element.x / 4}
                                y={element.y / 4}
                                numPoints={5}
                                innerRadius={element.radius / 8}
                                outerRadius={element.radius / 4}
                                fill={element.fill}
                                fillPatternImage={patternImage}
                                fillPatternRepeat={element.fillPatternRepeat}
                                stroke={element.stroke}
                                strokeWidth={element.strokeWidth / 4}
                                rotation={element.rotation}
                                opacity={element.opacity}
                                shadowColor={element.shadowColor}
                                shadowBlur={element.shadowBlur}
                                shadowOffsetX={element.shadowOffsetX}
                                shadowOffsetY={element.shadowOffsetY}
                            />
                        );
                    } else if (element.type === 'image' && element.image) {
                        const [img] = useImage(element.image);
                        return (
                            <KonvaImage
                                key={index}
                                image={img}
                                x={element.x / 4}
                                y={element.y / 4}
                                width={element.width / 4}
                                height={element.height / 4}
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
    );
}

export default TemplatePreview;