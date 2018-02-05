import React, { Component } from "react";
import { graphql } from "react-apollo";
import moment from "moment";
import PropTypes from "prop-types";
import { Link } from "react-router-dom";
import PostsHoc from "./PostsHoc";
import Paginate from "../../components/Paginate";
import { PostFilters } from "../../components/Post";
import Loader from "../../components/Loader";
import { GET_POSTS, GET_TAXONOMIES } from "../../../shared/queries/Queries";
import {
    UPDATE_TAXONOMY,
    DELETE_TAXONOMY
} from "../../../shared/queries/Mutations";

class Taxonomy extends Component {
    constructor(props) {
        super(props);
        this.editSaveTaxonomy = this.editSaveTaxonomy.bind(this);
        this.newTaxClicked = this.newTaxClicked.bind(this);
        this.deleteTax = this.deleteTax.bind(this);
        this.texts = {
            post_tag: {
                title1: "Manage Tags",
                subtitle1:
                    "You can edit all your tags from here. Posts linked with those tags will automatically get updated.",
                title2: "Create a tag",
                input1: "Name of the tag",
                input2: "Description of the tag"
            },
            post_category: {
                title1: "Manage Categories",
                subtitle1:
                    "You can edit all your categories from here. Posts linked with those categories will automatically get updated.",
                title2: "Create a category",
                input1: "Name of the category",
                input2: "Description of the category"
            }
        };
        this.defaultText = this.texts[this.props.type];
        this.refList = {};
        this.state = {
            taxonomies: [],
            filteredData: [],
            editMode: false
        };
    }
    componentWillReceiveProps(nextProps) {
        if (
            !nextProps.loading &&
            this.state.taxonomies.length !== nextProps.taxonomies.length
        ) {
            this.state.taxonomies = nextProps.taxonomies;
            this.state.filteredData = nextProps.taxonomies;
            this.setState(this.state);
        }
    }
    setRef(ele, idx, key) {
        if (!this.refList[idx]) {
            this.refList[idx] = {};
        }
        this.refList[idx][key] = ele;
    }

    editSaveTaxonomy(idx) {
        let item = this.state.filteredData[idx];

        if (typeof item.edit === "undefined") {
            item.edit = false;
        }
        if (this.state.editMode && !item.edit) {
            return;
        }
        if (item.edit && item.name == "") {
            return alert("Cannot be empty");
        }

        item.edit = !item.edit;

        this.state.editMode = item.edit;

        this.state.filteredData[idx] = item;

        this.setState(this.state, async () => {
            if (item.edit) {
                this.refList[idx].name.focus();
            } else {
                item.type = this.props.type;
                const result = await this.props.updateTaxonomy(item);
                if (result.data.updateTaxonomy.ok) {
                    this.state.filteredData[idx].id =
                        result.data.updateTaxonomy.id;
                    this.setState(this.state);
                }
            }
        });
    }

    newTaxClicked() {
        this.state.editMode = false;
        this.state.filteredData.unshift({
            id: 0,
            name: "",
            desc: "",
            edit: true
        });
        this.setState(this.state, () => {
            this.refList[0].name.focus();
        });
    }

    handleChange(idx, key, value, maxWidth = 20) {
        this.state.filteredData[idx][key] = value;
        this.setState(this.state);
    }
    deleteTax(idx) {
        let id = this.state.filteredData[idx].id;
        this.props.deleteTaxonomy({ id: id });
        delete this.state.filteredData[idx];
        this.setState(this.state);
    }
    render() {
        const loading = this.props.loading || !this.props.networkStatus === 2;
        if (loading) return null;
        const style = {
            tableBtns: {
                marginRight: 5,
                cursor: "pointer"
            }
        };
        const rows = this.state.filteredData.map((item, idx) => (
            <tr key={idx} className={item.edit ? "row-selected" : ""}>
                <td width="30%">
                    <span
                        style={{ display: "block" }}
                        ref={ele => this.setRef(ele, idx, "name")}
                        onKeyUp={e =>
                            this.handleChange(
                                idx,
                                "name",
                                e.currentTarget.innerHTML
                            )
                        }
                        className={item.edit ? "inline-edit" : ""}
                        placeholder={this.defaultText.input1}
                        contentEditable={item.edit}
                    >
                        {item.name}
                    </span>
                </td>
                <td width="50%">
                    <span
                        style={{ display: "block" }}
                        ref={ele => this.setRef(ele, idx, "desc")}
                        onKeyUp={e =>
                            this.handleChange(
                                idx,
                                "desc",
                                e.currentTarget.innerHTML
                            )
                        }
                        className={item.edit ? "inline-edit" : ""}
                        placeholder={this.defaultText.input2}
                        contentEditable={item.edit}
                    >
                        {item.desc || ""}
                    </span>
                </td>
                <td width="20%">
                    <button
                        onClick={_ => this.editSaveTaxonomy(idx, item.edit)}
                        className={
                            "btn btn-xs btn-" + (item.edit ? "success" : "dark")
                        }
                    >
                        {item.edit ? "Save" : "Edit"}
                    </button>
                    &nbsp;&nbsp;
                    <button
                        onClick={_ => this.deleteTax(idx)}
                        className="btn btn-xs btn-dark"
                    >
                        Delete
                    </button>
                </td>
            </tr>
        ));

        return (
            <section className="module-xs">
                <div className="card">
                    <div className="module-title">
                        {this.defaultText.title1}
                    </div>
                    <div className="module-subtitle">
                        {this.defaultText.subtitle1}
                    </div>

                    <div>
                        <button
                            className="btn btn-xs btn-dark"
                            aria-label="Add"
                            onClick={this.newTaxClicked}
                        >
                            <i className="fa fa-plus" />
                        </button>
                    </div>
                    <table className="table table-hover">
                        <thead>
                            <tr>
                                <th width="25%" className="col-text">
                                    Name
                                </th>
                                <th width="25%" className="col-text">
                                    Description
                                </th>
                                <th width="25%" className="col-text">
                                    Actions
                                </th>
                            </tr>
                        </thead>
                        <tbody>{rows}</tbody>
                    </table>
                </div>
            </section>
        );
    }
}

const ContainerWithData = graphql(GET_TAXONOMIES, {
    options: props => {
        return {
            variables: {
                type: props.type
            },
            forceFetch: true,
            fetchPolicy: "network-only"
        };
    },
    props: ({ data: { loading, taxonomies, networkStatus } }) => ({
        taxonomies,
        loading,
        networkStatus
    })
});

const updateTaxonomyQuery = graphql(UPDATE_TAXONOMY, {
    props: ({ mutate }) => ({
        updateTaxonomy: data =>
            mutate({
                variables: data
            })
    })
});

const deleteTaxonomyQuery = graphql(DELETE_TAXONOMY, {
    props: ({ mutate }) => ({
        deleteTaxonomy: data =>
            mutate({
                variables: data
            })
    })
});
export default deleteTaxonomyQuery(
    updateTaxonomyQuery(ContainerWithData(Taxonomy))
);
