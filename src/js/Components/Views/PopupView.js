import React, { Component } from 'react';

import SelectField from 'material-ui/SelectField';
import MenuItem from 'material-ui/MenuItem';

export default class PopupView extends Component {

  constructor() {
    super();
    this.state = {
      value: 4
    };
  }

  handleChange(ev, index, value) {
    alert(`${index}\n${value}`);
  }

  render() {
    return (
      <div>
        <SelectField value={this.state.value} onChange={this.handleChange}>
          <MenuItem value={1} primaryText="Never" />
          <MenuItem value={2} primaryText="Every Night" />
          <MenuItem value={3} primaryText="Weeknights" />
          <MenuItem value={4} primaryText="Weekends" />
          <MenuItem value={5} primaryText="Weekly" />
        </SelectField>
      </div>
    );
  }
}
