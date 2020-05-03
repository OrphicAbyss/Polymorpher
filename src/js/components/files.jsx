"use strict";

import React from "react";
import {Box, Button, DropButton, Form, FormField, Heading, Layer, List, Text, TextInput} from "grommet";
import {Add, Document, MoreVertical, Save, Trash} from "grommet-icons";

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
        <React.Fragment>
            {isOpen && (
                <Layer position="top" modal onClickOutside={closeAddDialog} onEsc={closeAddDialog}>
                    <Box pad="medium" gap="small" width="medium">
                        <Form onSubmit={createAndCloseDialog}>
                            <Heading level={3} margin="none">
                                Enter new filename:
                            </Heading>
                            <FormField>
                                <TextInput autoFocus icon={<Document/>} value={newFilename} onChange={textChange}/>
                            </FormField>
                            <Box as="footer" gap="small" direction="row" align="center" justify="end" pad="small">
                                <Button label="Cancel" onClick={closeAddDialog}/>
                                <Button primary icon={<Save/>} label="Create" type="submit"/>
                            </Box>
                        </Form>
                    </Box>
                </Layer>
            )}
        </React.Fragment>)
        ;
}

function DeleteDialog (props) {
    const {isOpen, closeDialog, file} = props;

    const cancel = () => {
        closeDialog();
    };

    const deleteFile = () => {
        closeDialog(file);
    };

    return (
        <React.Fragment>
            {isOpen && (
                <Layer position="top" modal onClickOutside={cancel} onEsc={cancel}>
                    <Box pad="medium" gap="small" width="medium">
                        <Form onSubmit={deleteFile}>
                            <Heading level={3} margin="none">
                                Are you sure you want to delete the file:
                            </Heading>
                            <Text>{file}</Text>
                            <Box as="footer" gap="small" direction="row" align="center" justify="end" pad="small">
                                <Button label="Cancel" onClick={cancel}/>
                                <Button primary icon={<Trash/>} label="Delete" type="submit"/>
                            </Box>
                        </Form>
                    </Box>
                </Layer>
            )}
        </React.Fragment>);
}

export function Files (props) {
    const fs = props.fs;
    const setCode = props.loadFile;

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
        <Box pad="small">
            <Box fill direction="row-responsive">
                <Heading level="3">Files</Heading>
                <Box flex/>
                <Heading level="3"><Add onClick={openAddDialog}/></Heading>
            </Box>
            <List data={files} pad="small">
                {(datum, index) => (
                    <Box key={index} direction="row-responsive">
                        <Box flex direction="row-responsive" onClick={() => loadFile(datum)}>
                            <Document/>
                            <Text>{datum}</Text>
                        </Box>
                        <DropButton dropContent={<Box pad="small"><Trash onClick={() => openDeleteDialog(datum)}/></Box>}>
                            <MoreVertical/>
                        </DropButton>
                    </Box>
                )}
            </List>
            <CreateDialog isOpen={addDialog} closeDialog={closeAddDialog}/>
            <DeleteDialog isOpen={deleteDialog} closeDialog={closeDeleteDialog} file={delFile}/>
        </Box>
    );
}