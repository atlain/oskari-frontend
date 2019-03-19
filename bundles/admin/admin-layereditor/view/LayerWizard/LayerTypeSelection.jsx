import React from 'react';
import PropTypes from 'prop-types';
import styled from 'styled-components';
import { Button } from '../../components/Button';

const StyledButton = styled(Button)`
    margin: 10px;
`;
const StyledRootEl = styled('div')`
    padding: 10px;
`;

export const LayerTypeSelection = (props) => {
    const {types, text, onSelect} = props;
    // TODO: replace with some required PropType maybe?
    let buttonHandler = onSelect;
    if (!buttonHandler) {
        buttonHandler = () => {};
    }

    return (
        <StyledRootEl>
            {text}{text && <br />}
            {types.map((title, key) => (
                <StyledButton key={key} onClick={() => buttonHandler(title)}>{title}</StyledButton>
            ))}
        </StyledRootEl>
    );
};

LayerTypeSelection.propTypes = {
    text: PropTypes.string,
    types: PropTypes.arrayOf(PropTypes.string),
    onSelect: PropTypes.func
};
