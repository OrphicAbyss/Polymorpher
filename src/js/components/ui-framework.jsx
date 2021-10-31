"use strict";

import React from "react";
import PropTypes from "prop-types";
import Draggable from "react-draggable";
// import {FontAwesomeIcon} from "@fortawesome/react-fontawesome";

function TitleBar(props) {
    const title = props.title;
    const onClose = props.onClose;
    const onMinimize = props.onMinimize;
    const onMaximize = props.onMaximize;
    const draggable = props.draggable;

    return (<div className={"title-bar" + (draggable ? " cursor" : "")}>
        <div className="title-bar-text">{title}</div>
        <div className="title-bar-controls">
            {onMinimize && <button aria-label="Minimize" onClick={onMinimize}/>}
            {onMaximize && <button aria-label="Maximize" onClick={onMaximize}/>}
            {onClose && <button aria-label="Close" onClick={onClose}/>}
        </div>
    </div>);
}

TitleBar.propTypes = {
    title: PropTypes.node,
    onClose: PropTypes.func,
    onMaximize: PropTypes.func,
    onMinimize: PropTypes.func
}

export function Window(props) {
    const title = props.title;
    const children = props.children;
    const statusBar = props.statusBar;
    const onClose = props.onClose;
    const onMinimize = props.onMinimize;
    const onMaximize = props.onMaximize;
    const className = "window " + (props.className || "");
    const drag = props.draggable === undefined ? true : props.draggable;

    const internal = (<div className={className}>
        <TitleBar title={title} onClose={onClose} onMinimize={onMinimize} onMaximize={onMaximize} draggable={drag}/>
        <div className="window-body">
            {children}
        </div>
        <div className="status-bar">
            {statusBar}
        </div>
    </div>);

    if (drag) {
        return (<Draggable handle=".title-bar">{internal}</Draggable>);
    } else {
        return internal;
    }
}

Window.propTypes = {
    title: PropTypes.node,
    children: PropTypes.node,
    statusBar: PropTypes.node,
    className: PropTypes.string,
    onClose: PropTypes.func,
    onMaximize: PropTypes.func,
    onMinimize: PropTypes.func
}

export function Modal(props) {
    const title = props.title;
    const children = props.children;
    const onClose = props.onClose;
    const onMinimize = props.onMinimize;
    const onMaximize = props.onMaximize;

    return (
        <div className="modal popup">
            <Window className="dialog" title={title} onClose={onClose} onMinimize={onMinimize} onMaximize={onMaximize}>
                {children}
            </Window>
        </div>
    );
}

Modal.propTypes = {
    title: PropTypes.string,
    children: PropTypes.node,
    onClose: PropTypes.func,
    onMaximize: PropTypes.func,
    onMinimize: PropTypes.func
}

// export function Icon(props) {
//     const icon = props.icon;
//     const text = props.text;
//     const onClick = props.onClick;
//
//     return (
//         <button onClick={onClick}>
//             <div className="icon">
//                 <FontAwesomeIcon size="4x" icon={icon}/>
//                 <div>{text}</div>
//             </div>
//         </button>
//     );
// }

// Icon.propTypes = {
//     icon: PropTypes.object,
//     text: PropTypes.string,
//     onClick: PropTypes.func
// }
