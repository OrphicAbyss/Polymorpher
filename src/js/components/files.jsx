"use strict";

import React, {Fragment} from "react";
import {Modal} from "./ui-framework";

function CreateDialog (props) {
    const {isOpen, closeDialog} = props;
    const [newFilename, setNewFilename] = React.useState("");

    const closeAddDialog = () => {
        closeDialog();
        setNewFilename("");
    };
    const createAndCloseDialog = () => {
        closeDialog(newFilename)
            .then((closed) => {
                if (closed) {
                    setNewFilename("");
                }
            });
    }

    const textChange = event => {
        const {
            target: {value}
        } = event;
        setNewFilename(value);
    };

    return (
        <Fragment>
            {isOpen && (
                <Modal title={"New File"} onClickOutside={closeAddDialog} onEsc={closeAddDialog}>
                    <form onSubmit={createAndCloseDialog}>
                        <div className="field-row-stacked">
                            <label>Enter new filename:</label>
                            <input type="text" autoFocus value={newFilename} onChange={textChange}/>
                        </div>
                        <div className="flexRowRev">
                            <div><button type="submit"><div className={"fa fa-file"}/> Create</button></div>
                            <div><button onClick={closeAddDialog}>Cancel</button></div>
                        </div>
                    </form>
                </Modal>
            )}
        </Fragment>
    );
}

function DeleteDialog (props) {
    const {isOpen, closeDialog, file} = props;

    const closeDeleteDialog = () => {
        closeDialog();
    };

    const deleteFile = () => {
        closeDialog(file);
    };

    return (
        <React.Fragment>
            {isOpen && (
                <Modal title={"Delete File"} onClickOutside={closeDeleteDialog} onEsc={closeDeleteDialog}>
                    <form onSubmit={deleteFile}>
                        <div className="field-row-stacked">
                            <label>Are you sure you want to delete the file:</label>
                            <input type="text" value={file} readOnly={true}/>
                        </div>
                        <div className="flexRowRev">
                            <div><button type="submit"><div className={"fa fa-trash"}/> Delete</button></div>
                            <div><button onClick={closeDeleteDialog}>Cancel</button></div>
                        </div>
                    </form>
                </Modal>
            )}
        </React.Fragment>);
}

export function Files (props) {
    const fs = props.fs;
    const setCode = props.loadFile;
    const openFile = props.openFile;
    const fileChanged = props.fileChanged;

    const [files, setFiles] = React.useState([]);
    const [delFile, setDelFile] = React.useState(null);
    const [addDialog, setAddDialog] = React.useState(false);
    const [deleteDialog, setDeleteDialog] = React.useState(false);

    const openAddDialog = () => {
        setAddDialog(true);
    };
    const closeAddDialog = (filename) => {
        if (filename !== undefined) {
            if (filename.length > 0) {
                return fs.setFile(filename)
                    .then(() => fs.getFilenames())
                    .then((fileList) => setFiles(fileList))
                    .then(() => setAddDialog(false))
                    .then(() => true);
            } else {
                // TODO: add message
                return Promise.resolve(false);
            }
        }

        setAddDialog(false);
        return Promise.resolve(true);
    };

    const openDeleteDialog = (file) => {
        setDelFile(file)
        setDeleteDialog(true);
    };

    const closeDeleteDialog = (file) => {
        if (file !== undefined) {
            if (file.length > 0) {
                return fs.delFile(file)
                    .then(() => fs.getFilenames())
                    .then((fileList) => setFiles(fileList))
                    .then(() => setDeleteDialog(false))
                    .then(() => true);
            } else {
                // TODO: add message
                return Promise.resolve(false);
            }
        }

        setDeleteDialog(false);
        return Promise.resolve(true);
    };

    React.useEffect(() => {
        fs.ready.then(() => fs.getFilenames())
            .then((fileList) => {
                setFiles(fileList);
                if (fileList[0]) {
                    return loadFile(fileList[0]);
                }
            });
    }, []);

    const loadFile = (filename) => {
        return fs.getFile(filename)
            .then((file) => {
                setCode(filename, file);
            });
    };

    return (
        <Fragment>
            <div style={{display: "flex", flexDirection: "column"}}>
                <h3 style={{display: "flex"}}>
                    <div style={{flexGrow: 1}}>Files</div>
                    <button style={{minWidth: "auto"}} onClick={openAddDialog}><div className={"fa fa-plus"}/></button>
                    <button style={{minWidth: "auto"}} onClick={() => openDeleteDialog(openFile)}><div className={"fa fa-trash"}/></button>
                </h3>
                <ul className={"tree-view"} style={{width: "200px", height: "100%"}}>
                    {files.map((datum, index) => {
                        if (datum === openFile) {
                            return <li key={index} style={{backgroundColor: "#000080", color: "white"}}>{datum}{fileChanged && <span>...</span>}</li>;
                        } else {
                            return <li key={index} onClick={() => loadFile(datum)}>{datum}</li>;
                        }
                    })}
                </ul>
            </div>
            <CreateDialog isOpen={addDialog} closeDialog={closeAddDialog}/>
            <DeleteDialog isOpen={deleteDialog} closeDialog={closeDeleteDialog} file={delFile}/>
        </Fragment>
    );
}
