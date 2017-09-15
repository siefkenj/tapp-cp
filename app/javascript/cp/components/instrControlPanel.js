import React from 'react';
import {
    Grid,
    ButtonToolbar,
    ButtonGroup,
    Button,
    PanelGroup,
    Panel,
    Well,
    DropdownButton,
    MenuItem,
    Modal,
} from 'react-bootstrap';

import { DdahForm } from './ddahForm.js';

class InstrControlPanel extends React.Component {
    render() {
        let nullCheck = this.props.appState.instrAnyNull();
        if (nullCheck) {
            return <div id="loader" />;
        }

        let fetchCheck = this.props.appState.instrAnyFetching();
        let cursorStyle = { cursor: fetchCheck ? 'progress' : 'auto' };

        let selectedDdahId = this.props.appState.getSelectedDdahId();

        return (
            <Grid fluid id="instr-grid" style={cursorStyle}>
                <PanelGroup id="select-menu">
                    <TemplateSelectionMenu
                        selectedTemplate={
                            this.props.appState.isTemplateSelected() ? selectedDdahId : null
                        }
                        {...this.props}
                    />
                    <OfferSelectionMenu
                        selectedOffer={
                            this.props.appState.isOfferSelected() ? selectedDdahId : null
                        }
                        {...this.props}
                    />
                </PanelGroup>
                {selectedDdahId != null
                    ? <div id="ddah-menu-container">
                          {this.props.appState.isTemplateSelected()
                              ? <TemplateActionMenu
                                    selectedTemplate={selectedDdahId}
                                    {...this.props}
                                />
                              : <OfferActionMenu selectedOffer={selectedDdahId} {...this.props} />}

                          <DdahForm selectedDdahId={selectedDdahId} {...this.props} />
                      </div>
                    : <Well id="no-selection">
                          <h4>Nothing here yet!</h4>
                          <h5>Select a course and applicant to start, or create a template.</h5>
                      </Well>}
            </Grid>
        );
    }
}

const TemplateSelectionMenu = props => {
    let templates = props.appState.getTemplatesList();

    return (
        <Panel
            header={<h4>Templates</h4>}
            footer={
                <span
                    onClick={() => {
                        let name;
                        if ((name = window.prompt('Please enter a name for the new template:'))) {
                            props.appState.createTemplate(name);
                        }
                    }}>
                    Create a new template
                </span>
            }>
            <ul id="templates-menu">
                {templates
                    .sort(
                        (a, b) =>
                            a.get('name').toLowerCase() > b.get('name').toLowerCase() ? 1 : -1
                    )
                    .map((template, i) =>
                        <li
                            className={i == props.selectedTemplate ? 'active' : ''}
                            onClick={() => props.appState.toggleSelectedTemplate(i)}>
                            {template.get('name')}
                        </li>
                    )}
            </ul>
        </Panel>
    );
};

const OfferSelectionMenu = props => {
    let courses = props.appState.getCoursesList(),
        selectedCourse = props.appState.getSelectedCourse();

    return (
        <Panel header={<h4>Applicants</h4>}>
            <ul id="offers-menu">
                {courses.sort((a, b) => (a.get('code') > b.get('code') ? 1 : -1)).map((course, i) =>
                    <li onClick={() => props.appState.toggleSelectedCourse(i)}>
                        {course.get('code')}
                        <ul
                            className="applicant-menu"
                            style={{ display: i == selectedCourse ? 'block' : 'none' }}>
                            {props.appState.getOffersForCourse(i).map((offer, i) =>
                                <li
                                    className={i == props.selectedOffer ? 'active' : ''}
                                    onClick={event => {
                                        event.stopPropagation();
                                        props.appState.toggleSelectedOffer(i);
                                    }}>
                                    {offer.get('lastName')}&nbsp;&middot;&nbsp;{offer.get('utorid')}
                                </li>
                            )}
                        </ul>
                    </li>
                )}
            </ul>
        </Panel>
    );
};

const TemplateActionMenu = props => {
    let templates = props.appState.getTemplatesList();

    return (
        <ButtonToolbar id="action-menu">
            <DropdownButton bsStyle="warning" title="Apply template" id="templates-dropdown">
                {templates.map((template, i) =>
                    <MenuItem onClick={() => props.appState.applyTemplate(i)}>
                        {template.get('name')}
                    </MenuItem>
                )}
            </DropdownButton>

            <Button id="clear" bsStyle="danger" onClick={() => props.appState.clearDdah()}>
                Clear
            </Button>

            <Button
                bsStyle="primary"
                id="save"
                disabled={!props.appState.anyDdahWorksheetChanges()}
                onClick={() => props.appState.updateTemplate(props.selectedTemplate)}>
                Save
            </Button>
        </ButtonToolbar>
    );
};

const OfferActionMenu = props => {
    let templates = props.appState.getTemplatesList();

    return (
        <ButtonToolbar id="action-menu">
            <DropdownButton bsStyle="warning" title="Apply template" id="templates-dropdown">
                {templates.map((template, i) =>
                    <MenuItem onClick={() => props.appState.applyTemplate(i)}>
                        {template.get('name')}
                    </MenuItem>
                )}
            </DropdownButton>

            <Button id="clear" bsStyle="danger" onClick={() => props.appState.clearDdah()}>
                Clear
            </Button>

            <Button bsStyle="success" id="submit">
                Submit for Review
            </Button>

            <ButtonGroup id="save">
                <Button
                    bsStyle="primary"
                    disabled={!props.appState.anyDdahWorksheetChanges()}
                    onClick={() => props.appState.updateDdah(props.selectedOffer)}>
                    Save
                </Button>
                <Button
                    bsStyle="info"
                    onClick={() => {
                        let name;
                        if ((name = window.prompt('Please enter a name for the new template:'))) {
                            props.appState.createTemplateFromDdah(name);
                        }
                    }}>
                    Save as Template
                </Button>
            </ButtonGroup>
        </ButtonToolbar>
    );
};

const SaveModal = props =>
    <Modal.Dialog>
        <Modal.Header closeButton />
        <Modal.Body>You have unsaved changes.</Modal.Body>

        <Modal.Footer>
            <Button>Cancel</Button>
            <Button bsStyle="alert">Discard changes</Button>
            <Button bsStyle="primary">Save changes</Button>
        </Modal.Footer>
    </Modal.Dialog>;

export { InstrControlPanel };
