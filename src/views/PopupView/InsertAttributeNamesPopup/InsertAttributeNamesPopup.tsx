import React, {useState} from 'react'
import './InsertAttributeNamesPopup.scss'
import {GenericYesNoPopup} from '../GenericYesNoPopup/GenericYesNoPopup';
import {AttributeActions} from '../../../logic/actions/AttributeActions';
import {PopupWindowType} from '../../../data/enums/PopupWindowType';
import {updateAttributeNames} from '../../../store/labels/actionCreators';
import {updateActivePopupType, updatePerClassColorationStatus} from '../../../store/general/actionCreators';
import {AppState} from '../../../store';
import {connect} from 'react-redux';
import Scrollbars from 'react-custom-scrollbars';
import {ImageButton} from '../../Common/ImageButton/ImageButton';
import {LabelName} from '../../../store/labels/types';
import {LabelUtil} from '../../../utils/LabelUtil';
import {LabelsSelector} from '../../../store/selectors/LabelsSelector';
import TextField from '@material-ui/core/TextField';
import {Settings} from '../../../settings/Settings';
import {withStyles} from '@material-ui/core';
import {reject, filter, uniq} from 'lodash';
import {ProjectType} from '../../../data/enums/ProjectType';
import {submitNewNotification} from '../../../store/notifications/actionCreators';
import {INotification} from '../../../store/notifications/types';
import {NotificationUtil} from '../../../utils/NotificationUtil';
import {NotificationsDataMap} from '../../../data/info/NotificationsData';
import {Notification} from '../../../data/enums/Notification';

const StyledTextField = withStyles({
    root: {
        '& .MuiInputBase-root': {
            color: 'white',
        },
        '& label': {
            color: 'white',
        },
        '& .MuiInput-underline:before': {
            borderBottomColor: 'white',
        },
        '& .MuiInput-underline:hover:before': {
            borderBottomColor: 'white',
        },
        '& label.Mui-focused': {
            color: Settings.SECONDARY_COLOR,
        },
        '& .MuiInput-underline:after': {
            borderBottomColor: Settings.SECONDARY_COLOR,
        }
    },
})(TextField);

interface IProps {
    updateActivePopupTypeAction: (activePopupType: PopupWindowType) => any;
    updateLabelNamesAction: (labels: LabelName[]) => any;
    updatePerClassColorationStatusAction: (updatePerClassColoration: boolean) => any;
    submitNewNotificationAction: (notification: INotification) => any;
    isUpdate: boolean;
    projectType: ProjectType;
    enablePerClassColoration: boolean;
}

const InsertLabelNamesPopup: React.FC<IProps> = (
    {
        updateActivePopupTypeAction,
        updateLabelNamesAction,
        updatePerClassColorationStatusAction,
        submitNewNotificationAction,
        isUpdate,
        projectType,
        enablePerClassColoration
    }) => {
    const [labelNames, setAttributeNames] = useState(LabelsSelector.getAttributeNames());

    const validateEmptyLabelNames = (): boolean => {
        const emptyLabelNames = filter(labelNames, (labelName: LabelName) => labelName.name === '')
        return emptyLabelNames.length === 0
    }

    const validateNonUniqueLabelNames = (): boolean => {
        const uniqueLabelNames = uniq(labelNames.map((labelName: LabelName) => labelName.name))
        return uniqueLabelNames.length === labelNames.length
    }

    const callbackWithLabelNamesValidation = (callback: () => any): () => any => {
        return () => {
            if (!validateEmptyLabelNames()) {
                submitNewNotificationAction(NotificationUtil
                    .createErrorNotification(NotificationsDataMap[Notification.EMPTY_LABEL_NAME_ERROR]))
                return
            }
            if (validateNonUniqueLabelNames()) {
                callback()
            } else {
                submitNewNotificationAction(NotificationUtil
                    .createErrorNotification(NotificationsDataMap[Notification.NON_UNIQUE_LABEL_NAMES_ERROR]))
            }
        }
    }

    const addLabelNameCallback = () => {
        const newLabelNames = [
            ...labelNames,
            LabelUtil.createLabelName('')
        ]
        setAttributeNames(newLabelNames);
    };

    const safeAddLabelNameCallback = () => callbackWithLabelNamesValidation(addLabelNameCallback)()

    const deleteLabelNameCallback = (id: string) => {
        const newLabelNames = reject(labelNames, {id});
        AttributeActions.removeAttributeNamesFromImageDatas([labelNames.find((l) => l.id === id).name]);
        setAttributeNames(newLabelNames);
    };

    const togglePerClassColorationCallback = () => {
        updatePerClassColorationStatusAction(!enablePerClassColoration)
    }

    const onKeyUpCallback = (event: React.KeyboardEvent<HTMLInputElement>) => {
        if (event.key === 'Enter') {
            safeAddLabelNameCallback()
        }
    }

    const labelInputs = labelNames.map((labelName: LabelName) => {
        const onChangeCallback = (event: React.ChangeEvent<HTMLInputElement>) =>
            onChange(labelName.id, event.target.value);
        const onDeleteCallback = () => deleteLabelNameCallback(labelName.id);
        return <div className='LabelEntry' key={labelName.id}>
            <StyledTextField
                id={'key'}
                autoComplete={'off'}
                autoFocus={true}
                type={'text'}
                margin={'dense'}
                label={'Insert label'}
                onKeyUp={onKeyUpCallback}
                value={labelName.name}
                onChange={onChangeCallback}
                style = {{width: 280}}
                InputLabelProps={{
                    shrink: true,
                }}
            />
            <ImageButton
                image={'ico/trash.png'}
                imageAlt={'remove_label'}
                buttonSize={{ width: 30, height: 30 }}
                onClick={onDeleteCallback}
            />
        </div>
    });

    const onChange = (id: string, value: string) => {
        const labelNamesDict = Object.assign({}, ...labelNames.map((x) => ({[x.name]: x.name})));
        const newLabelNames = labelNames.map((labelName: LabelName) => {
            if (labelName.id === id) {
                labelNamesDict[labelName.name] = value;
            }
            return labelName.id === id ? {
                ...labelName, name: value
            } : labelName
        });
        AttributeActions.updateAttributeNamesFromImageDatas(labelNamesDict);
        setAttributeNames(newLabelNames);
    };

    const onCreateAcceptCallback = () => {
        const nonEmptyLabelNames: LabelName[] = reject(labelNames,
            (labelName: LabelName) => labelName.name.length === 0)
        if (labelNames.length > 0) {
            updateLabelNamesAction(nonEmptyLabelNames);
        }
        updateActivePopupTypeAction(null);
    };

    const safeOnCreateAcceptCallback = () => callbackWithLabelNamesValidation(onCreateAcceptCallback)();

    const onUpdateAcceptCallback = () => {
        const nonEmptyLabelNames: LabelName[] = reject(labelNames,
            (labelName: LabelName) => labelName.name.length === 0);
        updateLabelNamesAction(nonEmptyLabelNames);
        updateActivePopupTypeAction(null);
    };

    const safeOnUpdateAcceptCallback = () => callbackWithLabelNamesValidation(onUpdateAcceptCallback)();

    const onCreateRejectCallback = () => {
        updateActivePopupTypeAction(PopupWindowType.LOAD_LABEL_NAMES);
    };

    const onUpdateRejectCallback = () => {
        updateActivePopupTypeAction(null);
    };

    const renderContent = () => {
        return (<div className='InsertLabelNamesPopup'>
            <div className='LeftContainer'>
                <ImageButton
                    image={'ico/plus.png'}
                    imageAlt={'plus'}
                    buttonSize={{ width: 40, height: 40 }}
                    padding={25}
                    onClick={safeAddLabelNameCallback}
                    externalClassName={'monochrome'}
                />
                {labelNames.length > 0 && <ImageButton
                    image={enablePerClassColoration ? 'ico/colors-on.png' : 'ico/colors-off.png'}
                    imageAlt={'per-class-coloration'}
                    buttonSize={{ width: 40, height: 40 }}
                    padding={15}
                    onClick={togglePerClassColorationCallback}
                    isActive={enablePerClassColoration}
                    externalClassName={enablePerClassColoration ? '' : 'monochrome'}
                />}
            </div>
            <div className='RightContainer'>
                <div className='Message'>
                    {
                        isUpdate ?
                            'You can now edit the attributes names you use to sub-classify the objects in the photos. Use the ' +
                            '+ button to add a new empty text field.' :
                            'Before you start, you can create a list of labels you plan to assign to objects in your ' +
                            'project. You can also choose to skip that part for now and define label names as you go.'
                    }
                </div>
                <div className='LabelsContainer'>
                    {Object.keys(labelNames).length !== 0 ? <Scrollbars>
                        <div
                            className='InsertLabelNamesPopupContent'
                        >
                            {labelInputs}
                        </div>
                    </Scrollbars> :
                        <div
                            className='EmptyList'
                            onClick={addLabelNameCallback}
                        >
                            <img
                                draggable={false}
                                alt={'upload'}
                                src={'ico/type-writer.png'}
                            />
                            <p className='extraBold'>Your label list is empty</p>
                        </div>}
                </div>
            </div>
        </div>);
    };

    return (
        <GenericYesNoPopup
            title={isUpdate ? 'Edit attributes' : 'Create attributes'}
            renderContent={renderContent}
            acceptLabel={isUpdate ? 'Accept' : 'Start project'}
            onAccept={isUpdate ? safeOnUpdateAcceptCallback : safeOnCreateAcceptCallback}
            rejectLabel={isUpdate ? 'Cancel' : 'Load attributes from file'}
            onReject={isUpdate ? onUpdateRejectCallback : onCreateRejectCallback}
        />)
};

const mapDispatchToProps = {
    updateActivePopupTypeAction: updateActivePopupType,
    updateLabelNamesAction: updateAttributeNames,
    updatePerClassColorationStatusAction: updatePerClassColorationStatus,
    submitNewNotificationAction: submitNewNotification
};

const mapStateToProps = (state: AppState) => ({
    projectType: state.general.projectData.type,
    enablePerClassColoration: state.general.enablePerClassColoration
});

export default connect(
    mapStateToProps,
    mapDispatchToProps
)(InsertLabelNamesPopup);
