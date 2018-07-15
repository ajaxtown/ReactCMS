import React from "react";
import styled from "styled-components";
import scrollTo from "../../helper/scrollTo";

/* eslint-disable react/prop-types */

const Image = styled.img`
    display: block;
    max-width: 100%;
    box-shadow: ${props => (props.selected ? "0 0 0 4px #414142;" : "none")};
`;

const ImageNode = ({ node, attributes, isFocused }) => {
    return (
        <Image
            src={node.data.get("src")}
            selected={isFocused}
            {...attributes}
            onLoad={e => {
                scrollTo(e.currentTarget);
            }}
        />
    );
};

export default ImageNode;
