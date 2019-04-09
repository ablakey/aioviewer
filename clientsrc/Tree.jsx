import React from 'react';
import { dedupe } from './helpers';

export default class Tree extends React.Component {
  render() {
    const filenames = dedupe(this.props.reports).map(r => r.split(' ')[0]);
    return <div>
      {filenames.map(f => <div onClick={() => this.props.onSelect(f)}>{f}</div>)}
    </div>;
  }
}
