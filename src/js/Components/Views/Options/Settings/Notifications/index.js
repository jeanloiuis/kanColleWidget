import React, {Component, PropTypes} from "react";

// TODO: 意外とごっつくなったので誰か分割してくれ〜

import {Table, TableBody, TableRow, TableRowColumn} from "material-ui/Table";
import Toggle     from "material-ui/Toggle";
import FlatButton from "material-ui/FlatButton";
import Settings   from "material-ui/svg-icons/action/settings";
import Clear      from "material-ui/svg-icons/content/clear";
import VolumeUp   from "material-ui/svg-icons/av/volume-up";
import Image      from "material-ui/svg-icons/image/image";
import {grey400, grey800}  from "material-ui/styles/colors";
import SelectField from "material-ui/SelectField";
import MenuItem from "material-ui/MenuItem";

import Config     from "../../../../Models/Config";
import FileSystem from "../../../../Services/Assets/FileSystem";

import {Client} from "chomex";

const styles = {
    icon: {
        cursor: "pointer",
        color:  grey400
    }
};

class NotificationSettingRow extends Component {
    constructor(props) {
        super(props);
        this.state = {
            model: Config.find(this.props.name),
        };
        this.client = new Client(chrome.runtime);
        this.prepareIconInput();
        this.prepareSoundInput();
    }
    prepareIconInput() {
        this.iconInput = this.createFileInput("icon", "image/*");
    }
    prepareSoundInput() {
        this.soundInput = this.createFileInput("sound", "audio/*");
    }
    createFileInput(suffix, accept) {
        let input = document.createElement("input");
        input.setAttribute("type", "file");
        input.setAttribute("accept", accept);
        input.onchange = (ev) => {
            let fs = new FileSystem();
            fs.set(this.props.name + "-" + suffix, ev.target.files[0])
            .then(({entry}) => {
                let model = this.state.model;
                model[suffix] = entry.toURL() + `?timestamp=${Date.now()}`;
                model.save();
                this.setState({model});
                // location.reload(); // TODO: 結局iconの値が変わってないからre-renderされない
            }).catch(err => console.info("NG", err));
        };
        return input;
    }ut
    render() {
        return (
          <TableRow>
            <TableRowColumn>
              <div>{this.state.model.label}</div>
              {this.state.model.description ? <span style={{fontSize: "0.6em"}}>{this.state.model.description}</span> : null}
            </TableRowColumn>
            <TableRowColumn>
              {this.getSwitchColumn()}
            </TableRowColumn>
            <TableRowColumn>{this.getIconInput()}</TableRowColumn>
            <TableRowColumn>
              {this.getSoundInput()}
            </TableRowColumn>
            <TableRowColumn>
              {this.getTestColumn()}
            </TableRowColumn>
          </TableRow>
        );
    }
    getSwitchColumn() {
        if (this.props.name == "notification-for-tiredness") {
            return (
                <SelectField
                  value={this.state.model.time}
                  style={{maxWidth: "100px"}}
                  onChange={(ev,i,value) => {
                      let model = this.state.model;
                      model.time = parseInt(value);
                      model.save();
                      this.setState({model});
                  }}>
                    <MenuItem value={0}  primaryText="使用しない"/>
                    <MenuItem value={10} primaryText="10分" />
                    <MenuItem value={15} primaryText="15分" />
                    <MenuItem value={20} primaryText="20分" />
                    <MenuItem value={25} primaryText="25分" />
                </SelectField>
            );
        }
        return <Toggle toggled={this.state.model.enabled} onToggle={this.onToggle.bind(this)}/>;
    }
    getTestColumn() {
        // いやー例外がたくさんありますねー
        if (this.props.name == "notification-for-default") {
            return <input type="range" max="100" value={this.state.model.volume} onChange={this.onVolumeChange.bind(this)}/>;
        }
        return <FlatButton label="test" onClick={this.test.bind(this)}/>;
    }
    onVolumeChange(ev) {
        let model = this.state.model;
        model.volume = parseInt(ev.target.value);
        model.save();
        this.setState({model});
    }
    onIconDelete() {
        let fs = new FileSystem();
        fs.delete(this.state.model.icon.split("/").pop()).then(()=> {
            let model = this.state.model;
            model.icon = null;
            model.save();
            this.setState({model});
        });
    }
    onSoundDelete() {
        let fs = new FileSystem();
        fs.delete(this.state.model.sound.split("/").pop()).then(()=> {
            let model = this.state.model;
            model.sound = null;
            model.save();
            this.setState({model});
        });
    }
    getSoundInput() {
        if (this.state.model.sound) return (
          <div style={{displey:"flex", justifyContents:"center", alignItems:"center", height:"48%"}}>
            <VolumeUp style={{...styles.icon, color:grey800}} onClick={() => this.soundInput.click()}/>
            <Clear style={{...styles.icon, height:"50%"}} onClick={this.onSoundDelete.bind(this)}/>
          </div>
        );
        return <div><VolumeUp style={styles.icon} onClick={() => this.soundInput.click()}/></div>;
    }
    getIconInput() {
        if (this.state.model.icon) return (
          <div style={{displey:"flex", justifyContents:"center", alignItems:"center", height:"48%"}}>
            <img src={this.state.model.icon} height="100%" onClick={() => this.iconInput.click()} style={styles.icon}/>
            <Clear style={{...styles.icon, height:"50%"}} onClick={this.onIconDelete.bind(this)}/>
          </div>
        );
        return <div><Image style={styles.icon} onClick={() => this.iconInput.click()} /></div>;
    }
    onToggle() {
        let model = this.state.model;
        model.enabled = !model.enabled;
        model.save();
        this.setState({model});
        if (this.props.toggle) this.props.toggle();
    }
    test() {
        this.client.message("/debug/notification", {name: this.props.name});
    }
    static propTypes = {
        name:   PropTypes.string.isRequired,
        toggle: PropTypes.func,
    }
}

export default class NotificationSettingsView extends Component {
    constructor(props) {
        super(props);
        this.state = {
            default: Config.find("notification-for-default").enabled
        };
        this.toggle = this.toggleDefault.bind(this);
    }
    toggleDefault() {
        this.setState({default: Config.find("notification-for-default").enabled});
    }
    render() {
        return (
          <div>
            <h1 style={this.props.styles.title}><Settings /> 通知設定</h1>
            <Table>
              <TableBody>
                <NotificationSettingRow name="notification-for-default" toggle={this.toggle}/>
                {(this.state.default) ? [
                    <NotificationSettingRow key={0} name="notification-for-mission"   />,
                    <NotificationSettingRow key={1} name="notification-for-recovery"  />,
                    <NotificationSettingRow key={2} name="notification-for-createship"/>,
                    <NotificationSettingRow key={3} name="notification-for-tiredness" />
                ] : null}
              </TableBody>
            </Table>
          </div>
        );
    }
    static propTypes = {
        styles: PropTypes.object.isRequired
    }
}
