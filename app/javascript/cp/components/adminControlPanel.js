import React from "react";
import {
    Grid,
    ButtonToolbar,
    DropdownButton,
    MenuItem,
    Button,
    OverlayTrigger,
    Popover,
    Glyphicon,
    Modal,
    Form,
    FormGroup,
    ControlLabel,
    FormControl
} from "react-bootstrap";

import { TableMenu } from "./tableMenu.js";
import { Table } from "./table.js";
import { ImportMenu } from "./importMenu.js";
import { SessionsForm } from "./sessionsForm.js";

class EditHoursDialog extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            hours: props.offer.get("hours"),
            origHours: props.offer.get("hours")
        };
        this.setHours = this.setHours.bind(this);
        this.cancelClick = this.cancelClick.bind(this);
    }
    setHours(hours) {
        this.setState({ hours });
    }
    cancelClick() {
        this.props.onHide();
        this.setState({ hours: this.state.origHours });
    }
    render() {
        const { show, onSave, onHide } = this.props;
        const [hours, setHours] = [+this.state.hours, this.setHours];
        const origHours = +this.state.origHours;

        return (
            <Modal show={show} onHide={this.cancelClick}>
                <Modal.Header closeButton>
                    <Modal.Title>Edit Hours</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <input
                        value={hours}
                        onChange={e => setHours(e.currentTarget.value)}
                    />{" "}
                    {+hours !== +origHours && (
                        <span>
                            Change hours from {origHours} to {hours}
                        </span>
                    )}
                </Modal.Body>
                <Modal.Footer>
                    <Button onClick={this.cancelClick}>Cancel</Button>
                    <Button
                        onClick={() => {
                            if (hours !== origHours) {
                                (onSave || (() => {}))(hours);
                            }
                            onHide();
                        }}
                    >
                        Save
                    </Button>
                </Modal.Footer>
            </Modal>
        );
    }
}

class EditHoursIcon extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            dialogShow: false
        };

        this.setDialogShow = this.setDialogShow.bind(this);
    }
    setDialogShow(state) {
        this.setState({ dialogShow: state });
    }
    render() {
        const { offer, hidden, onSave } = this.props;
        const setDialogShow = this.setDialogShow;
        const dialogShow = this.state.dialogShow;

        if (hidden) {
            return null;
        }
        return (
            <React.Fragment>
                <div
                    style={{ position: "absolute", right: 2, bottom: 0 }}
                    className="show-on-hover edit-glyph"
                    onClick={() => setDialogShow(true)}
                >
                    <Glyphicon glyph="edit" />
                </div>
                <EditHoursDialog
                    offer={offer}
                    show={dialogShow}
                    onHide={() => this.setDialogShow(false)}
                    onSave={onSave}
                />
            </React.Fragment>
        );
    }
}

const getCheckboxElements = () =>
    document.getElementsByClassName("offer-checkbox");

const getSelectedOffers = () =>
    Array.prototype.filter
        .call(getCheckboxElements(), box => box.checked == true)
        .map(box => box.id);

class AdminControlPanel extends React.Component {
    constructor(props) {
        super(props);

        // most recently-clicked checkbox, stored to allow range selection
        this.lastClicked = null;
    }

    selectThisTab() {
        if (this.props.appState.getSelectedNavTab() != this.props.navKey) {
            this.props.appState.selectNavTab(this.props.navKey);
        }
    }

    updateOffer(offer, attrs) {
        attrs.offer_id = offer;
        this.props.appState.setOfferDetails(attrs);
    }

    componentWillMount() {
        this.selectThisTab();
    }

    componentWillUpdate() {
        this.selectThisTab();
    }

    render() {
        const role = this.props.appState.getSelectedUserRole();
        let nullCheck =
            this.props.appState.isOffersListNull() ||
            (role == "cp_admin" && this.props.appState.isSessionsListNull());
        if (nullCheck) {
            return <div id="loader" />;
        }

        let fetchCheck =
            this.props.appState.fetchingOffers() ||
            (role == "cp_admin" && this.props.appState.fetchingSessions());
        let cursorStyle = { cursor: fetchCheck ? "progress" : "auto" };

        this.config = [
            {
                header: (
                    <input
                        type="checkbox"
                        defaultChecked={false}
                        id="header-checkbox"
                        onClick={event =>
                            Array.prototype.forEach.call(
                                getCheckboxElements(),
                                box => {
                                    box.checked = event.target.checked;
                                }
                            )
                        }
                    />
                ),
                headerNoSort: true,
                data: p => (
                    <input
                        type="checkbox"
                        defaultChecked={false}
                        className="offer-checkbox"
                        id={p.offerId}
                        onClick={event => {
                            // range selection using shift key (range is from current box (offerId) to last-clicked box
                            if (this.lastClicked && event.shiftKey) {
                                let first = false,
                                    last = false;

                                for (let box of getCheckboxElements()) {
                                    if (
                                        !first &&
                                        (box.id == p.offerId ||
                                            box.id == this.lastClicked)
                                    ) {
                                        // starting box
                                        first = true;
                                        box.checked = true;
                                    } else if (first && !last) {
                                        // box is in range
                                        if (
                                            box.id == p.offerId ||
                                            box.id == this.lastClicked
                                        ) {
                                            // ending box
                                            last = true;
                                        }
                                        box.checked = true;
                                    }
                                }
                            }

                            this.lastClicked = p.offerId;
                        }}
                    />
                ),

                style: { textAlign: "center" }
            },
            {
                header: "Last Name",
                data: p => p.offer.get("lastName"),
                sortData: p => p.get("lastName")
            },
            {
                header: "First Name",
                data: p => p.offer.get("firstName"),
                sortData: p => p.get("firstName")
            },
            {
                header: "Email",
                data: p => p.offer.get("email"),
                sortData: p => p.get("email"),
                style: { maxWidth: "15vw", overflow: "hidden" }
            },
            {
                header: "Student Number",
                data: p => p.offer.get("studentNumber"),
                sortData: p => p.get("studentNumber")
            },
            {
                header: "Position",
                data: p => p.offer.get("course"),
                sortData: p => p.get("course"),

                filterLabel: "Position",
                filterCategories: this.props.appState.getPositions(),
                // filter out offers not to that position
                filterFuncs: this.props.appState
                    .getPositions()
                    .map(position => p => p.get("course") == position)
            },
            {
                header: "Hours",
                data: p => (
                    <div
                        style={{ position: "relative" }}
                        className="show-on-hover-wrapper"
                    >
                        {p.offer.get("hours")}
                        <EditHoursIcon
                            offer={p.offer}
                            hidden={["Accepted", "Pending"].includes(
                                p.offer.get("status")
                            )}
                            onSave={hours => {
                                this.updateOffer(p.offerId, { hours });
                            }}
                        />
                    </div>
                ),
                sortData: p => p.get("hours")
            },
            {
                header: "Status",
                data: p => (
                    <span>
                        {p.offer.get("status")}&ensp;
                        {p.offer.get("status") == "Withdrawn" && (
                            <OverlayTrigger
                                trigger="click"
                                placement="bottom"
                                rootClose={true}
                                overlay={
                                    <Popover
                                        id="offer-note-popover"
                                        title="Withdrawn Notes"
                                    >
                                        <textarea
                                            id="offer-note"
                                            style={{ width: "100%" }}
                                            defaultValue={p.offer.get("note")}
                                        />
                                        <br />
                                        <Button
                                            bsSize="xsmall"
                                            bsStyle="success"
                                            onClick={() =>
                                                this.props.appState.noteOffer(
                                                    p.offerId,
                                                    document.getElementById(
                                                        "offer-note"
                                                    ).value
                                                )
                                            }
                                        >
                                            Save
                                        </Button>
                                    </Popover>
                                }
                            >
                                {p.offer.get("note") ? (
                                    <i
                                        className="fa fa-question-circle"
                                        style={{
                                            fontSize: "16px",
                                            cursor: "pointer"
                                        }}
                                        title="Reason"
                                    />
                                ) : (
                                    <i
                                        className="fa fa-question"
                                        style={{
                                            fontSize: "16px",
                                            cursor: "pointer"
                                        }}
                                        title="Add reason"
                                    />
                                )}
                            </OverlayTrigger>
                        )}
                    </span>
                ),
                sortData: p => p.get("status"),

                filterLabel: "Status",
                filterCategories: [
                    "Unsent",
                    "Pending",
                    "Accepted",
                    "Rejected",
                    "Withdrawn"
                ],
                filterFuncs: [
                    "Unsent",
                    "Pending",
                    "Accepted",
                    "Rejected",
                    "Withdrawn"
                ].map(status => p => p.get("status") == status)
            },
            {
                header: "Contract",
                data: p => (
                    <div
                        title={
                            p.offer.get("sentAt") &&
                            "Contract sent at " +
                                new Date(p.offer.get("sentAt")).toLocaleString(
                                    "en-CA"
                                )
                        }
                    >
                        {p.offer.get("sentAt") &&
                            new Date(p.offer.get("sentAt")).toLocaleString(
                                "en-CA",
                                { month: "short", day: "numeric" }
                            ) + " "}
                        <i
                            className="fa fa-search"
                            style={{ fontSize: "16px", cursor: "pointer" }}
                            title="Applicant View"
                            onClick={() =>
                                this.props.appState.showContractApplicant(
                                    p.offerId
                                )
                            }
                        />
                        <i
                            className="fa fa-search-plus"
                            style={{ fontSize: "16px", cursor: "pointer" }}
                            title="Office View"
                            onClick={() =>
                                this.props.appState.showContractHr(p.offerId)
                            }
                        />
                    </div>
                ),
                sortData: p => (p.get("sentAt") ? p.get("sentAt") : "")
            },
            {
                header: "Nag Count",
                data: p =>
                    p.offer.get("nagCount") ? p.offer.get("nagCount") : "",
                sortData: p => (p.get("nagCount") ? p.get("nagCount") : "")
            },
            {
                header: "HRIS Status",
                data: p =>
                    p.offer.get("hrStatus") ? p.offer.get("hrStatus") : "-",
                sortData: p => (p.get("hrStatus") ? p.get("hrStatus") : ""),

                filterLabel: "HRIS Status",
                filterCategories: ["-", "Processed", "Printed"],
                filterFuncs: [p => p.get("hrStatus") == undefined].concat(
                    ["Processed", "Printed"].map(status => p =>
                        p.get("hrStatus") == status
                    )
                )
            },
            {
                header: "Printed Date",
                data: p =>
                    p.offer.get("printedAt") && (
                        <div
                            title={new Date(
                                p.offer.get("printedAt")
                            ).toLocaleString("en-CA")}
                        >
                            {new Date(p.offer.get("printedAt")).toLocaleString(
                                "en-CA",
                                { month: "short", day: "numeric" }
                            )}
                        </div>
                    ),
                sortData: p => (p.get("printedAt") ? p.get("printedAt") : "")
            },
            {
                header: "DDAH Status",
                data: p =>
                    p.offer.get("ddahStatus") ? (
                        <span>
                            {p.offer.get("ddahStatus")}&nbsp;
                            {!["None", "Created"].includes(
                                p.offer.get("ddahStatus")
                            ) && (
                                <i
                                    className="fa fa-search"
                                    style={{
                                        fontSize: "16px",
                                        cursor: "pointer"
                                    }}
                                    title="PDF preview"
                                    onClick={() =>
                                        this.props.appState.previewDdah(
                                            p.offerId
                                        )
                                    }
                                />
                            )}
                        </span>
                    ) : (
                        "-"
                    ),
                sortData: p => (p.get("ddahStatus") ? p.get("ddahStatus") : ""),

                filterLabel: "DDAH Status",
                filterCategories: [
                    "-",
                    "Created",
                    "Ready",
                    "Approved",
                    "Pending",
                    "Accepted"
                ],
                filterFuncs: [p => p.get("ddahStatus") == undefined].concat(
                    ["Created", "Ready", "Approved", "Pending", "Accepted"].map(
                        status => p => p.get("ddahStatus") == status
                    )
                )
            }
        ];

        return (
            <Grid fluid id="offers-grid" style={cursorStyle}>
                {role == "cp_admin" && <SessionsForm {...this.props} />}

                <ButtonToolbar id="dropdown-menu">
                    {role == "cp_admin" && <ImportMenu {...this.props} />}
                    <ExportButton {...this.props} />
                    {role == "cp_admin" && <OffersMenu {...this.props} />}
                    {role == "cp_admin" && <CommMenu {...this.props} />}
                    <PrintButton {...this.props} />

                    <TableMenu
                        config={this.config}
                        getSelectedSortFields={() =>
                            this.props.appState.getSorts()
                        }
                        anyFilterSelected={field =>
                            this.props.appState.anyFilterSelected(field)
                        }
                        isFilterSelected={(field, category) =>
                            this.props.appState.isFilterSelected(
                                field,
                                category
                            )
                        }
                        toggleFilter={(field, category) =>
                            this.props.appState.toggleFilter(field, category)
                        }
                        clearFilters={() => this.props.appState.clearFilters()}
                        addSort={field => this.props.appState.addSort(field)}
                        removeSort={field =>
                            this.props.appState.removeSort(field)
                        }
                        toggleSortDir={field =>
                            this.props.appState.toggleSortDir(field)
                        }
                    />
                </ButtonToolbar>

                <Table
                    config={this.config}
                    getOffers={() => this.props.appState.getOffersList()}
                    getSelectedSortFields={() => this.props.appState.getSorts()}
                    getSelectedFilters={() => this.props.appState.getFilters()}
                    cycleSort={field => this.props.appState.cycleSort(field)}
                />
            </Grid>
        );
    }
}

const ExportButton = props => (
    <Button bsStyle="primary" onClick={() => props.appState.exportOffers()}>
        Export
    </Button>
);

const OffersMenu = props => (
    <DropdownButton
        bsStyle="primary"
        title="Update offers"
        id="offers-dropdown"
    >
        <MenuItem
            onClick={() => props.appState.sendContracts(getSelectedOffers())}
        >
            Send contract(s)
        </MenuItem>
        <MenuItem divider />
        <MenuItem
            onClick={() => props.appState.resetOffer(getSelectedOffers())}
        >
            Reset status to <i>Unsent</i>
        </MenuItem>
        <MenuItem
            onClick={() => props.appState.setOfferAccepted(getSelectedOffers())}
        >
            Set status to <i>Accepted</i>
        </MenuItem>
        <MenuItem
            onClick={() => props.appState.withdrawOffers(getSelectedOffers())}
        >
            Withdraw offer(s)
        </MenuItem>
        <MenuItem divider />
        <MenuItem
            onClick={() => props.appState.setHrProcessed(getSelectedOffers())}
        >
            Set HRIS status to <i>Processed</i>
        </MenuItem>
        <MenuItem
            onClick={() => props.appState.clearHrStatus(getSelectedOffers())}
        >
            Clear HRIS status
        </MenuItem>
        <MenuItem divider />
        <MenuItem
            onClick={() => props.appState.setDdahAccepted(getSelectedOffers())}
        >
            Set DDAH status to <i>Accepted</i>
        </MenuItem>
    </DropdownButton>
);

const CommMenu = props => (
    <DropdownButton bsStyle="primary" title="Communicate" id="comm-dropdown">
        <MenuItem onClick={() => props.appState.email(getSelectedOffers())}>
            Email&ensp;[blank]
        </MenuItem>
        <MenuItem
            onClick={() => props.appState.emailContract(getSelectedOffers())}
        >
            Email&ensp;[contract]
        </MenuItem>
        <MenuItem divider />
        <MenuItem onClick={() => props.appState.nagOffers(getSelectedOffers())}>
            Nag
        </MenuItem>
    </DropdownButton>
);

const PrintButton = props => (
    <Button
        bsStyle="primary"
        onClick={() => props.appState.print(getSelectedOffers())}
    >
        Print contracts
    </Button>
);

export { AdminControlPanel };
