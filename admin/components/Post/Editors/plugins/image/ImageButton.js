import React from "react";
import FileExplorerModal from "../../../../Modals/FileExplorerModal";
import { insertInlineImage } from "./ImageUtils";
import { uploadFile } from "../../../../../util";
/* eslint-disable react/prop-types */
/* eslint-disable no-unused-vars */

class ImageButton extends React.Component {
    imageInputRef = React.createRef();

    state = {
        fileExplorerOpen: false
    };

    insertMedia = src => {
        this.props.onChange(
            insertInlineImage({ change: this.props.value.change(), src })
        );
        this.toggleFileExplorer();
    };

    toggleFileExplorer = () => {
        this.setState({ fileExplorerOpen: !this.state.fileExplorerOpen });
    };

    uploadImage = async files => {
        const uploadedFiles = await uploadFile({ files, type: "post_image" });
        uploadedFiles.forEach(src => {
            this.props.onChange(
                insertInlineImage({ change: this.props.value.change(), src })
            );
        });
    };
    render() {
        const { value, onChange, changeState, style, type } = this.props;
        return (
            <React.Fragment>
                <span
                    style={style}
                    className="button"
                    type={type}
                    onMouseDown={this.toggleFileExplorer}
                >
                    <span className="material-icons">image</span>
                </span>
                <input
                    ref={this.imageInputRef}
                    className="hide post-image"
                    type="file"
                    multiple
                    onChange={input => this.uploadImage(input.target.files)}
                />
                {this.state.fileExplorerOpen && (
                    <FileExplorerModal
                        onClose={this.toggleFileExplorer}
                        onMediaSelect={this.insertMedia}
                        addNewMedia={() => {
                            this.imageInputRef.current.click();
                            this.toggleFileExplorer();
                        }}
                    />
                )}
            </React.Fragment>
        );
    }
}
export default ImageButton;
